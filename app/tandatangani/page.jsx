"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Shield,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import mammoth from "mammoth/mammoth.browser";
import PdfWorkerInitializer from "@/components/pdf-worker-initializer";
import JournalPdfViewer from "@/components/journal-pdf-viewer";

export default function SignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast: toast } = useToast();

  const [journalId, setJournalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [journal, setJournal] = useState(null);
  const [error, setError] = useState("");
  const [hasPassHash, setHasPassHash] = useState(false);

  const [perihal, setPerihal] = useState("");
  const [passHash, setPassHash] = useState("");
  const [errors, setErrors] = useState({
    perihal: "",
    passHash: "",
  });
  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Tambahan state untuk preview file
  const [fileType, setFileType] = useState("");
  const [docxText, setDocxText] = useState("");
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setJournalId(id);
      fetchJournalAndProfile(id);
    } else {
      setError("ID jurnal tidak ditemukan. Silakan kembali ke daftar jurnal.");
      setLoading(false);
    }
  }, [searchParams]);

  const fetchJournalAndProfile = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        setError("Sesi login Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
        return;
      }

      // Fetch journal data
      const journalResponse = await fetch(`/api/journal/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!journalResponse.ok) {
        throw new Error("Gagal mengambil data jurnal");
      }

      const journalData = await journalResponse.json();
      setJournal(journalData);

      // Fetch user profile to check if they have a PassHash (signature field)
      const profileResponse = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Gagal mengambil data profil");
      }

      const profileData = await profileResponse.json();

      // Check if user has PassHash stored in their profile
      setHasPassHash(!!profileData.signature);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Terjadi kesalahan saat memuat data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journal) {
      // Deteksi tipe file dari metadata atau judul
      const fileTypeFromMetadata = journal.metadata?.fileType;
      const lower = journal.title?.toLowerCase() || "";

      // First try to detect from metadata
      if (fileTypeFromMetadata) {
        console.log(`File type from metadata: ${fileTypeFromMetadata}`);
        if (fileTypeFromMetadata === "pdf") {
          setFileType("pdf");
        } else if (["doc", "docx"].includes(fileTypeFromMetadata)) {
          setFileType("docx");
        } else {
          setFileType("txt");
        }
      }
      // If no metadata, try to detect from file extension
      else if (lower.endsWith(".pdf")) {
        setFileType("pdf");
      } else if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
        setFileType("docx");
      } else {
        // Try to detect from content
        if (
          journal.content &&
          (journal.content.startsWith("JVBERi0") ||
            journal.content.startsWith("%PDF"))
        ) {
          console.log("Detected PDF from content header");
          setFileType("pdf");
        } else {
          setFileType("txt");
        }
      }

      // Process content based on detected file type
      if (fileType === "pdf") {
        try {
          // Jika sudah base64, gunakan langsung
          if (
            journal.content &&
            /^[A-Za-z0-9+/=\r\n]+$/.test(journal.content.trim().slice(0, 100))
          ) {
            console.log("Content appears to be base64, using directly");
            setPdfData(`data:application/pdf;base64,${journal.content.trim()}`);
          } else if (journal.content) {
            // Jika bukan base64, coba konversi dari utf-8 ke base64
            console.log("Attempting to convert content to base64");
            const b64 = btoa(unescape(encodeURIComponent(journal.content)));
            setPdfData(`data:application/pdf;base64,${b64}`);
          }
        } catch (e) {
          console.error("Error processing PDF content:", e);
        }
      } else if (fileType === "docx" && journal.content) {
        // Konversi DOCX ke teks menggunakan mammoth
        (async () => {
          try {
            console.log("Converting DOCX content to HTML");
            // Asumsikan journal.content adalah base64 string
            const arrayBuffer = Uint8Array.from(atob(journal.content), (c) =>
              c.charCodeAt(0)
            ).buffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setDocxText(result.value);
          } catch (e) {
            console.error("Error converting DOCX:", e);
            setDocxText("Gagal memuat file DOCX.");
          }
        })();
      }
    }
  }, [journal, fileType]);
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const validateForm = () => {
    const newErrors = {
      perihal: "",
      passHash: "",
    };

    let isValid = true;

    if (!perihal.trim()) {
      newErrors.perihal = "Perihal wajib diisi";
      isValid = false;
    }

    if (!passHash.trim()) {
      newErrors.passHash = "PassHash wajib diisi";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSign = async () => {
    setSigning(true);
    setError("");
    setErrors({ perihal: "", passHash: "" });
    try {
      // Validasi input
      if (!perihal) {
        setErrors((e) => ({ ...e, perihal: "Perihal wajib diisi" }));
        setSigning(false);
        return;
      }
      if (!passHash) {
        setErrors((e) => ({ ...e, passHash: "PassHash wajib diisi" }));
        setSigning(false);
        return;
      }
      if (!journal) {
        setError("Jurnal tidak ditemukan.");
        setSigning(false);
        return;
      }
      // 1. Ambil konten PDF (atau hasil generate PDF, atau file yang akan diunduh user)
      // Jika hanya ada string, gunakan TextEncoder:
      const encoder = new TextEncoder();
      const pdfArrayBuffer = encoder.encode(journal.content);
      // 2. Hash PDF
      const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        pdfArrayBuffer
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pdfHashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      // 3. Generate signature (pseudocode, sesuaikan dengan implementasi Anda)
      const { sign, generateKeyPair } = await import(
        "@/lib/crypto/client-ecdsa"
      );

      // Generate key pair
      const { privateKey, publicKey } = await generateKeyPair();

      // Sign the document content
      const signature = await sign(journal.content, privateKey);

      // 4. Kirim ke backend
      const token = localStorage.getItem("signal_auth_token");
      const response = await fetch(`/api/journal/${journalId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature,
          publicKey,
          passHash,
          metadata: {
            perihal,
            signedAt: new Date().toISOString(),
            pdfHash: pdfHashHex,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Gagal menandatangani jurnal");
        setSigning(false);
        return;
      }
      // Sukses
      toast({
        title: "Berhasil",
        description: "Jurnal telah berhasil ditandatangani",
      });

      // Redirect to validation page using window.location for more reliable navigation
      window.location.href = `/validasi?id=${journalId}&signed=true`;
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menandatangani jurnal");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Initialize PDF.js worker */}
      <PdfWorkerInitializer />

      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Tanda Tangani Jurnal</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
              <p>Memuat data jurnal...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-medium mb-2">
                      {journal?.title}
                    </h2>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>
                        Dibuat pada:{" "}
                        {journal?.createdAt
                          ? new Date(journal.createdAt).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </p>
                    </div>{" "}
                    <div className="mt-4 max-h-[60vh] overflow-y-auto bg-muted/30 rounded-md p-3">
                      {/* Preview file asli */}
                      {fileType === "pdf" && pdfData ? (
                        <JournalPdfViewer pdfData={pdfData} />
                      ) : fileType === "docx" ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: docxText }}
                        />
                      ) : (
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {/* Check if content is base64 and render appropriately */}
                          {journal?.content &&
                          /^[A-Za-z0-9+/=\r\n]+$/.test(
                            journal.content.substring(0, 100)
                          )
                            ? "[Binary content - Content will be preserved when downloaded]"
                            : journal?.content}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h2 className="text-lg font-medium mb-4">
                      Informasi Penandatanganan
                    </h2>

                    {/* Peringatan jika user belum memiliki PassHash */}
                    {!hasPassHash && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Anda belum menyiapkan PassHash di profil. Silakan
                          perbarui profil Anda terlebih dahulu.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="perihal">
                          Perihal<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="perihal"
                          value={perihal}
                          onChange={(e) => setPerihal(e.target.value)}
                          placeholder="Masukkan perihal penandatanganan"
                          className={errors.perihal ? "border-red-500" : ""}
                        />
                        {errors.perihal && (
                          <p className="text-xs text-red-500">
                            {errors.perihal}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passHash">
                          PassHash<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="passHash"
                          type="password"
                          value={passHash}
                          onChange={(e) => setPassHash(e.target.value)}
                          placeholder="Masukkan PassHash untuk verifikasi"
                          className={errors.passHash ? "border-red-500" : ""}
                        />
                        {errors.passHash && (
                          <p className="text-xs text-red-500">
                            {errors.passHash}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          PassHash harus sama dengan yang Anda atur di profil
                          Anda
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard">Kembali</Link>
                      </Button>
                      <Button
                        onClick={handleSign}
                        disabled={signing || !hasPassHash}
                        className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                      >
                        {signing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Menandatangani...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span>Tanda Tangani</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
