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

export default function VerifyJournal() {
  const [file, setFile] = useState(null);
  const [publicKey, setPublicKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const { user } = useAuth();

  // Use authenticated user's public key if available
  useEffect(() => {
    if (user?.publicKey) {
      setPublicKey(user.publicKey);
    }
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset verification result when file changes
      setVerificationResult(null);
    }
  };

  const handleVerify = () => {
    if (!file || !publicKey) return;

    setVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      // For demo purposes, randomly determine if verification is successful
      const isValid = Math.random() > 0.3;

      setVerificationResult({
        valid: isValid,
        message: isValid
          ? "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani."
          : "Tanda tangan digital tidak valid. Dokumen mungkin telah diubah atau kunci publik tidak cocok.",
        timestamp: new Date().toISOString(),
        documentName: file.name,
        signer: isValid ? "John Doe" : null,
        signingDate: isValid ? "2023-05-15T10:30:00Z" : null,
      });

      setVerifying(false);
    }, 2000);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verifikasi Tanda Tangan</h1>
        <p className="text-muted-foreground">
          Verifikasi keaslian jurnal dengan memeriksa tanda tangan digital ECDSA
          P-256.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Jurnal</CardTitle>
              <CardDescription>
                Upload file jurnal yang ingin diverifikasi tanda tangannya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File Jurnal</Label>
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
                  </p>
                  <p>
                    <strong>Waktu Verifikasi:</strong>{" "}
                    {new Date(verificationResult.timestamp).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                  {verificationResult.valid && (
                    <>
                      <p>
                        <strong>Penandatangan:</strong>{" "}
                        {verificationResult.signer}
                      </p>
                      <p>
                        <strong>Tanggal Ditandatangani:</strong>{" "}
                        {new Date(
                          verificationResult.signingDate
                        ).toLocaleString("id-ID")}
                      </p>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-600" />
                <span>Panduan Verifikasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="ml-5 list-decimal space-y-2 text-sm">
                <li>Upload file jurnal yang ingin diverifikasi.</li>
                <li>
                  Masukkan kunci publik dari penandatangan. Kunci ini biasanya
                  dibagikan oleh penandatangan.
                </li>
                <li>Klik tombol "Verifikasi Tanda Tangan".</li>
                <li>
                  Sistem akan memverifikasi apakah dokumen ditandatangani dengan
                  kunci privat yang sesuai dengan kunci publik yang dimasukkan.
                </li>
                <li>
                  Hasil verifikasi akan menunjukkan apakah dokumen asli dan
                  tidak diubah sejak ditandatangani.
                </li>
              </ol>

              <div className="mt-6 rounded-lg bg-muted p-4 text-sm">
                <h4 className="mb-2 font-medium">Tentang ECDSA P-256</h4>
                <p>
                  ECDSA (Elliptic Curve Digital Signature Algorithm) P-256
                  adalah salah satu algoritma tanda tangan digital berbasis
                  kurva eliptik yang banyak digunakan untuk keamanan dokumen
                  digital modern.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
