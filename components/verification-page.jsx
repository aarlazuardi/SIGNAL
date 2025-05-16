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

export default function VerificationPage() {
  const [file, setFile] = useState(null);
  const [publicKey, setPublicKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVerify = () => {
    if (!file || !publicKey) return;

    setVerifying(true);
    // Simulasi proses verifikasi
    setTimeout(() => {
      // Hasil verifikasi acak untuk demo
      const isValid = Math.random() > 0.3;
      setVerificationResult({
        valid: isValid,
        message: isValid
          ? "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani."
          : "Tanda tangan digital tidak valid. Dokumen mungkin telah diubah atau kunci publik tidak cocok.",
        timestamp: new Date().toISOString(),
        documentName: file.name,
      });
      setVerifying(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Verifikasi Tanda Tangan</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">Unggah Dokumen Jurnal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicKey">Kunci Publik</Label>
                  <Textarea
                    id="publicKey"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Masukkan kunci publik penandatangan untuk verifikasi..."
                    className="min-h-[120px] resize-y font-mono text-sm"
                  />
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
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
                  </p>
                  <p>
                    <strong>Waktu Verifikasi:</strong>{" "}
                    {new Date(verificationResult.timestamp).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
              <FileText className="h-5 w-5 text-emerald-600" />
              Cara Verifikasi Tanda Tangan Digital
            </h3>
            <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
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
