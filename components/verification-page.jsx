"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  ArrowLeft,
  Upload,
  Shield,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { verifyJournal } from "@/lib/api";
import { toast } from "./ui/toast";

export default function VerificationPage() {
  const [file, setFile] = useState(null);
  const [publicKey, setPublicKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setFile(null);
        toast({
          title: "Format file tidak didukung",
          description: "Hanya file PDF yang dapat diverifikasi.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      setFile(file);
    }
  };

  const handleVerify = async () => {
    if (!file || !publicKey) return;

    setVerifying(true);
    try {
      // Kirim file PDF ke backend untuk verifikasi
      const result = await verifyJournal({ file, publicKey });

      setVerificationResult({
        valid: result.verified,
        message: result.verified
          ? "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani."
          : result.message ||
            "Tanda tangan digital tidak valid. Dokumen mungkin telah diubah atau kunci publik tidak cocok.",
        timestamp: new Date().toISOString(),
        documentName: file.name,
        signer: result.author?.name || result.signer || null,
        signingDate: result.signedAt || result.signingDate || null,
        id: result.id || null,
        publicKey,
      });
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                aria-label="Kembali ke beranda"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold">
              Verifikasi Tanda Tangan
            </h1>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="file" className="text-sm sm:text-base">
                    Unggah Dokumen Jurnal
                  </Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="flex-1 text-sm h-9 sm:h-10"
                    />
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto"
                      onClick={() => document.getElementById("file").click()}
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Pilih File</span>
                    </Button>
                  </div>
                  {file && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      File dipilih: {file.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Hanya file PDF yang didukung untuk verifikasi tanda tangan.
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="publicKey" className="text-sm sm:text-base">
                    Kunci Publik
                  </Label>
                  <Textarea
                    id="publicKey"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Masukkan kunci publik penandatangan untuk verifikasi..."
                    className="min-h-[120px] resize-y font-mono text-sm"
                  />
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 sm:h-11"
                  onClick={handleVerify}
                  disabled={!file || !publicKey || verifying}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {verifying ? "Memverifikasi..." : "Verifikasi Tanda Tangan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {verificationResult && (
            <Alert
              className={
                verificationResult.valid
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-red-600 bg-red-50 text-red-800"
              }
            >
              {verificationResult.valid ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <AlertTitle className="text-base sm:text-lg">
                {verificationResult.valid
                  ? "Verifikasi Berhasil"
                  : "Verifikasi Gagal"}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm sm:text-base">
                  {verificationResult.message}
                </p>
                <div className="mt-4 space-y-1 text-xs sm:text-sm">
                  <p>
                    <strong>Dokumen:</strong> {verificationResult.documentName}
                  </p>{" "}
                  <p>
                    <strong>Waktu Verifikasi:</strong>
                    {new Date(verificationResult.timestamp).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                  {verificationResult.signer && (
                    <p>
                      <strong>Penandatangan:</strong>{" "}
                      {verificationResult.signer}
                    </p>
                  )}
                  {verificationResult.signingDate && (
                    <p>
                      <strong>Tanggal Penandatanganan:</strong>{" "}
                      {new Date(verificationResult.signingDate).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  )}
                  {verificationResult.id && (
                    <p>
                      <strong>ID Verifikasi:</strong> {verificationResult.id}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg font-medium">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              Cara Verifikasi Tanda Tangan Digital
            </h3>
            <ol className="ml-5 sm:ml-6 list-decimal space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>
                Unggah dokumen jurnal yang ingin diverifikasi tanda tangannya.
              </li>
              <li>
                Masukkan kunci publik dari penandatangan dokumen. Kunci ini
                biasanya dibagikan oleh penandatangan.
              </li>
              <li>
                Klik tombol "Verifikasi Tanda Tangan" untuk memeriksa keaslian
                dokumen.
              </li>
              <li>
                Sistem akan memverifikasi apakah dokumen ditandatangani dengan
                kunci privat yang sesuai dengan kunci publik yang dimasukkan.
              </li>
              <li>
                Hasil verifikasi akan menunjukkan apakah dokumen asli dan tidak
                diubah sejak ditandatangani.
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
