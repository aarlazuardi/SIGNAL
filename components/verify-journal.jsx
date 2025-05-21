"use client";

import { useEffect } from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Upload, Shield, CheckCircle, XCircle, Info } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import { verifyJournal } from "@/lib/api";

export default function VerifyJournal() {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [journalId, setJournalId] = useState("");
  const { user } = useAuth();
  const { addToast } = useToast();
  const toast = addToast;

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);

  // Kunci publik diambil dari backend, tidak perlu input user
  const [publicKey, setPublicKey] = useState("");

  // Use authenticated user's public key if available
  useEffect(() => {
    if (user?.publicKey) {
      setPublicKey(user.publicKey);
    }
  }, [user]);

  // Check if URL has a journal ID parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      setJournalId(id);
      fetchJournalDetails(id);
    }
  }, []);

  const fetchJournalDetails = async (id) => {
    try {
      const token =
        localStorage.getItem("signal_auth_token") ||
        sessionStorage.getItem("signal_auth_token");
      if (!token) {
        toast("Sesi login Anda telah berakhir. Silakan login kembali.");
        return;
      }

      const response = await fetch(`/api/journal/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const journal = await response.json();
        setVerificationResult({
          valid: journal.verified,
          message: journal.verified
            ? "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani."
            : "Dokumen belum ditandatangani atau kunci publik tidak cocok.",
          timestamp: new Date().toISOString(),
          documentName: journal.title,
          content: journal.content,
          signer: journal.author?.name || "Unknown",
          signingDate: journal.updatedAt,
          id: journal.id,
          publicKey: journal.publicKey,
        });
        if (journal.publicKey) {
          setPublicKey(journal.publicKey);
        }
      } else {
        setVerificationResult({
          valid: false,
          message: "Jurnal tidak ditemukan atau Anda tidak memiliki akses.",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching journal:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate that it's a PDF file
      if (
        !selectedFile.type.includes("pdf") &&
        !selectedFile.name.toLowerCase().endsWith(".pdf")
      ) {
        toast({
          title: "Format File Tidak Didukung",
          description:
            "Hanya file PDF yang didukung untuk verifikasi tanda tangan.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);

      // For PDF preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPdfData(event.target.result);
      };
      reader.readAsDataURL(selectedFile);

      // Reset verification result when file changes
      setVerificationResult(null);
    }
  };

  // If journal loaded by ID and is PDF, set preview
  useEffect(() => {
    if (verificationResult && verificationResult.content && journalId) {
      // Assume content is base64 for PDF
      setPdfData("data:application/pdf;base64," + verificationResult.content);
    }
  }, [verificationResult, journalId]);

  const handleVerify = async () => {
    if (!file) return;
    setVerifying(true);
    try {
      // Always use the new FormData-based API
      const result = await verifyJournal({ file });
      setVerificationResult({
        valid: result.verified,
        message: result.verified
          ? "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani."
          : result.message || "Tanda tangan digital tidak valid atau dokumen belum ditandatangani.",
        timestamp: new Date().toISOString(),
        documentName: file.name,
        signer: result.author?.name || result.signer || null,
        signingDate: result.signedAt || result.signingDate || null,
        id: result.id || null,
        publicKey: result.publicKey || null,
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      setVerificationResult({
        valid: false,
        message: "Error verifying document: " + error.message,
        timestamp: new Date().toISOString(),
        documentName: file?.name || "Unknown",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Enhanced QR code scan handler
  const handleQrScan = (scanData) => {
    try {
      if (scanData && scanData.id) {
        // Show success toast
        toast(`Memverifikasi jurnal: ${scanData.title || "Untitled"}`);

        // Fetch journal details using the scanned ID
        setJournalId(scanData.id);
        fetchJournalDetails(scanData.id);

        // Close scanner and show verification section
        setShowScanner(false);

        // If we already have public key info from QR code, set it
        if (scanData.publicKey && scanData.publicKey.endsWith("...")) {
          // This is a shortened key, we'll get the full one from the API
          console.log("Shortened public key detected in QR code");
        } else if (scanData.publicKey) {
          setPublicKey(scanData.publicKey);
        }

        // Set QR value for display
        setQrValue(JSON.stringify(scanData));
      } else {
        toast({
          title: "QR Code Tidak Valid",
          description:
            "QR code tidak mengandung data jurnal yang valid. Pastikan Anda memindai QR code dari jurnal SIGNAL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing QR code data:", error);
      toast({
        title: "Error",
        description: "Gagal memproses data QR code: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verifikasi Tanda Tangan</h1>{" "}
        <p className="text-muted-foreground">
          Verifikasi keaslian jurnal dengan memeriksa tanda tangan digital ECDSA
          P-256.
        </p>
      </div>
      <div className="space-y-6">
        {/* Document Preview Section */}
        {pdfData && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Pratinjau Dokumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <Document
                  file={pdfData}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                  <Page pageNumber={pageNumber} width={400} />
                </Document>
                {numPages && numPages > 1 && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      disabled={pageNumber === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs">
                      Halaman {pageNumber} dari {numPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPageNumber((p) => Math.min(numPages, p + 1))
                      }
                      disabled={pageNumber === numPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Upload Jurnal</CardTitle>
            <CardDescription>
              Upload file jurnal yang ingin diverifikasi tanda tangannya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File Jurnal PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById("file").click()}
                >
                  <Upload className="h-4 w-4" />
                  <span>Pilih File</span>
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  File dipilih: {file.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Hanya file PDF yang didukung untuk verifikasi tanda tangan.
              </p>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleVerify}
              disabled={!file || verifying}
            >
              <Shield className="mr-2 h-4 w-4" />
              {verifying ? "Memverifikasi..." : "Verifikasi Tanda Tangan"}
            </Button>
          </CardContent>
        </Card>

        {/* Panduan Verifikasi - Dipindahkan ke bawah input file */}
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-600" />
              <span>Panduan Verifikasi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="ml-5 list-decimal space-y-2 text-sm">
              <li>Upload file jurnal PDF yang ingin diverifikasi.</li>
              <li>Klik tombol "Verifikasi Tanda Tangan".</li>
              <li>
                Sistem akan secara otomatis memverifikasi tanda tangan digital
                pada dokumen.
              </li>
              <li>
                Hasil verifikasi akan menunjukkan apakah dokumen asli dan tidak
                diubah sejak ditandatangani.
              </li>
            </ol>
            <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
              <h4 className="mb-2 font-medium">Tentang ECDSA P-256</h4>
              <p>
                ECDSA (Elliptic Curve Digital Signature Algorithm) P-256 adalah
                salah satu algoritma tanda tangan digital berbasis kurva eliptik
                yang digunakan untuk menjamin keaslian dan integritas dokumen
                digital.
              </p>
            </div>
          </CardContent>
        </Card>

        {verificationResult && (
          <Alert
            variant={verificationResult.valid ? "default" : "destructive"}
            className={
              verificationResult.valid
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "border-red-600 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
            }
          >
            {verificationResult.valid ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <AlertTitle>
              {verificationResult.valid
                ? "Verifikasi Berhasil"
                : "Verifikasi Gagal"}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{verificationResult.message}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <strong>Dokumen:</strong> {verificationResult.documentName}
                </p>{" "}
                <p>
                  <strong>Waktu Verifikasi:</strong>
                  {new Date(verificationResult.timestamp).toLocaleString(
                    "id-ID"
                  )}
                </p>
                {verificationResult.valid && (
                  <>
                    {" "}
                    <p>
                      <strong>Penandatangan:</strong>
                      {verificationResult.signer}
                    </p>
                    <p>
                      <strong>Tanggal Ditandatangani:</strong>
                      {new Date(verificationResult.signingDate).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
