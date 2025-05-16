"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Save, Shield, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function JournalEditor({ id }) {
  const [title, setTitle] = useState(
    id ? "Implementasi Digital Signature pada Dokumen Elektronik" : ""
  );
  const [content, setContent] = useState(
    id
      ? "Digital signature merupakan teknologi yang memungkinkan penandatanganan dokumen secara elektronik dengan menggunakan kriptografi kunci publik. Teknologi ini menjamin keaslian, integritas, dan non-repudiation dari dokumen yang ditandatangani.\n\nPada penelitian ini, kami mengimplementasikan sistem digital signature menggunakan algoritma RSA dan SHA-256 untuk mengamankan dokumen jurnal ilmiah. Hasil penelitian menunjukkan bahwa sistem ini mampu memverifikasi keaslian dokumen dengan tingkat keberhasilan 100% dan waktu verifikasi rata-rata 0.5 detik."
      : ""
  );
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulasi penyimpanan
    setTimeout(() => {
      setSaving(false);
      // Redirect ke dashboard jika berhasil
      if (!id) {
        window.location.href = "/dashboard";
      }
    }, 1500);
  };

  const handleSign = () => {
    setSigning(true);
    // Simulasi proses penandatanganan
    setTimeout(() => {
      setSigning(false);
      setSigned(true);
      setShowSignDialog(false);
      // Redirect ke dashboard setelah berhasil
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    }, 2000);
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
            <h1 className="text-xl font-bold">
              {id ? "Edit Jurnal" : "Jurnal Baru"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleSave}
              disabled={saving || !title || !content}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Menyimpan..." : "Simpan"}</span>
            </Button>
            <Button
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowSignDialog(true)}
              disabled={!title || !content || signed}
            >
              {signed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Ditandatangani</span>
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
      </header>

      <main className="container px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Jurnal</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul jurnal"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Konten Jurnal</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis konten jurnal di sini..."
              className="min-h-[400px] resize-y"
            />
          </div>
        </div>
      </main>

      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tanda Tangani Jurnal</DialogTitle>
            <DialogDescription>
              Jurnal yang sudah ditandatangani tidak dapat diubah lagi. Pastikan
              konten jurnal sudah benar sebelum ditandatangani.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
            <FileText className="h-5 w-5" />
            <p className="text-sm">
              Jurnal akan ditandatangani menggunakan kunci privat Anda dan dapat
              diverifikasi menggunakan kunci publik.
            </p>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowSignDialog(false)}
              disabled={signing}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSign}
              disabled={signing}
            >
              {signing ? (
                <span>Menandatangani...</span>
              ) : (
                <span>Konfirmasi Tanda Tangan</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
