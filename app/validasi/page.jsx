"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowLeft,
  Download,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportJournalToPDF } from "@/lib/journal-export";
import { Document, Page, pdfjs } from "react-pdf";

// Initialize PDF.js worker correctly for browser environment
// Only run in browser environment to avoid SSR issues
if (typeof window !== "undefined") {
  try {
    // Use unpkg CDN with HTTPS URL for better compatibility
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log(
      `PDF.js worker initialized in validasi with version: ${pdfjs.version}`
    );
  } catch (error) {
    console.error("Failed to initialize PDF.js worker:", error);
  }
}

export default function ValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast: toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState(null);
  const [error, setError] = useState("");
  const [justSigned, setJustSigned] = useState(false);

  // Add PDF preview state
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    const signed = searchParams.get("signed") === "true";
    setJustSigned(signed);

    console.log("Halaman validasi diakses dengan parameter:", { id, signed });

    if (id) {
      fetchJournalData(id);
    } else {
      setError("ID jurnal tidak ditemukan.");
      setLoading(false);
      console.error("ID jurnal tidak ditemukan dalam parameter URL");
    }
  }, [searchParams]);

  const fetchJournalData = async (id) => {
    setLoading(true);
    console.log("Mengambil data jurnal dengan ID:", id);
    try {
      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        setError("Sesi login Anda telah berakhir. Silakan login kembali.");
        console.error("Token tidak ditemukan");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
        return;
      }

      console.log("Mengirim request ke API");
      const response = await fetch(`/api/journal/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data jurnal");
      }
      const journalData = await response.json();
      console.log("Data jurnal diterima:", journalData);

      // Verify if journal is signed
      if (!journalData.verified) {
        setError("Jurnal ini belum ditandatangani.");
        console.warn("Jurnal belum ditandatangani");
      }

      // Check if content is PDF and prepare preview
      if (journalData.content) {
        // Detect if content is base64 encoded PDF
        const isPdfBase64 =
          journalData.metadata?.fileType === "pdf" ||
          journalData.content.substring(0, 20).includes("JVBERi");

        if (isPdfBase64) {
          try {
            setPdfData(`data:application/pdf;base64,${journalData.content}`);
            setShowPreview(true);
          } catch (error) {
            console.error("Error preparing PDF preview:", error);
          }
        }
      }

      setJournal(journalData);
      setLoading(false);

      // Set PDF data for preview
      if (journalData.content && journalData.content.startsWith("JVBERi0")) {
        setPdfData(journalData.content);
      }
    } catch (error) {
      console.error("Error fetching journal:", error);
      setError(error.message || "Terjadi kesalahan saat memuat data");
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!journal) return;

    try {
      console.log("Memulai proses unduh PDF untuk jurnal:", journal.id);

      // Detect if content might be a binary file (PDF/DOC) from metadata
      let originalFileType = null;
      if (journal.metadata?.fileType) {
        originalFileType = journal.metadata.fileType;
      } else if (journal.content && journal.content.startsWith("JVBERi0")) {
        // Looks like a base64 encoded PDF
        originalFileType = "pdf";
      }

      // Get metadata for PDF export
      const metadata = {
        title: journal.title,
        subject: journal.metadata?.perihal || "Dokumen Jurnal",
        creator:
          journal.metadata?.signerName || journal.user?.name || "SIGNAL User",
        producer: "SIGNAL - Platform Jurnal dengan ECDSA",
        creationDate: new Date(journal.metadata?.signedAt || journal.updatedAt),
        originalFileType: originalFileType,
        signatureInfo: {
          signer:
            journal.metadata?.signerName ||
            journal.user?.name ||
            "Pengguna SIGNAL",
          timestamp: new Date(
            journal.metadata?.signedAt || journal.updatedAt
          ).toLocaleString("id-ID"),
          publicKey: journal.publicKey || "Tidak tersedia",
          signature: journal.signature || "Tidak tersedia",
        },
      };

      console.log("Metadata PDF:", {
        title: metadata.title,
        subject: metadata.subject,
        originalFileType: metadata.originalFileType,
        hasPerihal: !!journal.metadata?.perihal,
        hasSignatureInfo: !!metadata.signatureInfo,
      });

      // Export journal to PDF
      exportJournalToPDF(journal.title, journal.content, metadata);

      toast({
        title: "Berhasil",
        description: "Dokumen PDF berhasil diunduh",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Gagal mengunduh dokumen PDF: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handlePreviewPDF = () => {
    setShowPreview(true);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Validasi Tanda Tangan</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
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
              {" "}
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-emerald-700 dark:text-emerald-300">
                  {justSigned
                    ? "Dokumen Berhasil Ditandatangani!"
                    : "Dokumen Telah Divalidasi"}
                </h2>
                <p className="text-emerald-600 dark:text-emerald-400 mb-6">
                  {justSigned
                    ? "Dokumen Anda telah berhasil ditandatangani dengan ECDSA P-256."
                    : "Tanda tangan digital pada dokumen ini valid."}
                </p>
              </div>
              {showPreview && pdfData && (
                <div className="border rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-medium mb-4">
                    Pratinjau Dokumen
                  </h3>
                  <div className="flex flex-col items-center">
                    <Document
                      file={pdfData}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      loading={
                        <div className="text-center py-4">
                          Memuat dokumen...
                        </div>
                      }
                      error={
                        <div className="text-red-500 py-4">
                          Gagal memuat dokumen
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={450}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>

                    {numPages && numPages > 1 && (
                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPageNumber((p) => Math.max(1, p - 1))
                          }
                          disabled={pageNumber <= 1}
                        >
                          Sebelumnya
                        </Button>
                        <span className="text-sm">
                          Halaman {pageNumber} dari {numPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPageNumber((p) => Math.min(numPages, p + 1))
                          }
                          disabled={pageNumber >= numPages}
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    )}

                    {journal?.metadata?.fileType === "pdf" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Ini adalah preview dokumen asli PDF yang telah
                        ditandatangani
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="border rounded-lg shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-medium">Detail Dokumen</h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Judul
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {journal.title}
                    </div>
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Penandatangan
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {journal.metadata?.signerName ||
                        journal.user?.name ||
                        "Pengguna SIGNAL"}
                    </div>
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Perihal
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {journal.metadata?.perihal || "Tidak tersedia"}
                    </div>{" "}
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Tanggal Tanda Tangan
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {journal.metadata?.signedAt
                        ? new Date(journal.metadata.signedAt).toLocaleString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : new Date(journal.updatedAt).toLocaleString("id-ID")}
                    </div>
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Document Hash
                    </div>
                    <div className="col-span-2 font-mono text-xs break-all">
                      {journal.metadata?.documentHash
                        ? journal.metadata.documentHash.substring(0, 25) + "..."
                        : journal.signature
                        ? journal.signature.substring(0, 25) + "..."
                        : "Tidak tersedia"}
                    </div>
                  </div>
                </div>
              </div>
              {pdfData && (
                <div className="border rounded-lg shadow-sm p-6 space-y-4">
                  <h3 className="text-lg font-medium">Pratinjau PDF</h3>
                  <div className="flex justify-center">
                    {showPreview ? (
                      <Document
                        file={`data:application/pdf;base64,${pdfData}`}
                        onLoadSuccess={onDocumentLoadSuccess}
                      >
                        <Page pageNumber={pageNumber} />
                      </Document>
                    ) : (
                      <Button
                        onClick={handlePreviewPDF}
                        className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Tampilkan Pratinjau
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-8">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Kembali ke Daftar Jurnal</Link>
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Unduh Dokumen
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
