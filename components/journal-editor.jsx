"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Save, Shield, FileText, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function JournalEditor({ id }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const { addToast } = useToast();

  // Fetch journal data if id is provided
  useEffect(() => {
    if (id) {
      fetchJournal();
    }
    // Force readOnly if opened from /editor/[id] (view mode)
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/editor/')) {
      setReadOnly(true);
    }
  }, [id]);

  const fetchJournal = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("signal_auth_token");
      
      if (!token) {
        addToast({
          title: "Error",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      
      const response = await fetch(`/api/journal/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data jurnal");
      }
      
      const data = await response.json();
        setTitle(data.title || "");
      setContent(data.content || "");
      setSigned(!!data.verified);
      // Set read-only mode if the document is already signed or if viewing from dashboard
      setReadOnly(!!data.verified || window.location.pathname.includes('/editor/'));
      
    } catch (error) {
      console.error("Error fetching journal:", error);
      setError(error.message || "Terjadi kesalahan saat mengambil data jurnal");
      addToast({
        title: "Error",
        description: "Gagal mengambil data jurnal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      addToast({
        title: "Error",
        description: "Judul dan konten jurnal wajib diisi",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem("signal_auth_token");
      
      if (!token) {
        addToast({
          title: "Error",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      
      const url = id ? `/api/journal/${id}` : "/api/journal/create";
      const method = id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      
      if (!response.ok) {
        throw new Error("Gagal menyimpan jurnal");
      }
      
      const savedJournal = await response.json();
      
      addToast({
        title: "Sukses",
        description: id ? "Jurnal berhasil diperbarui" : "Jurnal berhasil disimpan sebagai draft",
        variant: "success",
      });
      
      // Redirect to dashboard after successful save
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
      return savedJournal;
      
    } catch (error) {
      console.error("Error saving journal:", error);
      addToast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menyimpan jurnal",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };  const handleSign = async () => {
    try {
      setSigning(true);
      if (!id) {
        // Jika jurnal belum disimpan, simpan dulu
        const savedJournal = await handleSave();
        if (savedJournal && savedJournal.id) {
          // Tampilkan notifikasi sukses
          addToast({
            title: "Berhasil",
            description: "Jurnal telah disimpan dan siap untuk ditandatangani",
            variant: "success",
          });
          
          // Arahkan ke halaman tandatangani setelah berhasil disimpan
          window.location.href = `/tandatangani?id=${savedJournal.id}`;
        }
      } else {
        // Jika sudah ada ID, langsung arahkan ke halaman tandatangani
        addToast({
          title: "Dialihkan",
          description: "Mengalihkan ke halaman tanda tangan...",
          variant: "success",
        });
        window.location.href = `/tandatangani?id=${id}`;
      }
      setShowSignDialog(false);
    } catch (error) {
      console.error("Error handling sign process:", error);
      addToast({
        title: "Error",
        description: "Gagal mengalihkan ke halaman tanda tangan",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold">
              {readOnly ? "Lihat Jurnal" : id ? "Edit Jurnal" : "Jurnal Baru"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSave}
                disabled={saving || !title || !content}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? "Menyimpan..." : "Simpan"}</span>
              </Button>
            )}
            {!signed && !readOnly && (
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
            )}
            {signed && (
              <Link href={`/verify?id=${id}`}>
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Lihat Verifikasi</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Jurnal</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul jurnal"
                className="text-lg"
                readOnly={readOnly}
                disabled={readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            
            {readOnly && (
              <div className="rounded-md bg-gray-100 p-4 text-center dark:bg-gray-800">
                <p className="text-sm text-muted-foreground">
                  Dokumen ini dalam mode hanya-baca. {signed ? "Dokumen telah ditandatangani secara digital." : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tanda Tangani Jurnal</DialogTitle>
            <DialogDescription>
              Jurnal yang sudah ditandatangani tidak dapat diubah lagi. Pastikan
              konten jurnal sudah benar sebelum ditandatangani.
            </DialogDescription>
          </DialogHeader>          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
            <FileText className="h-5 w-5" />
            <p className="text-sm">
              Jurnal akan ditandatangani menggunakan kunci privat Anda dan dapat
              diverifikasi menggunakan kunci publik. Setelah ditandatangani, Anda akan dialihkan ke halaman tanda tangan.
            </p>
          </div><DialogFooter className="sm:justify-end">
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
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menandatangani...
                </span>
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
