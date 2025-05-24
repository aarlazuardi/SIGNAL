"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import { Shield, Save, FileDown, Database, Check } from "lucide-react";
import SignaturePreviewModal from "./signature-preview-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { exportJournalToFile } from "@/lib/journal-export";
import { getAuthHeaders } from "@/lib/api";

export default function CreateJournal() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSignJournalId, setPendingSignJournalId] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { addToast: toast } = useToast();

  useEffect(() => {
    let interval;
    function checkToken() {
      const token = localStorage.getItem("signal_auth_token");
      if (token) {
        setTokenReady(true);
        setLoadingToken(false);
        if (interval) clearInterval(interval);
      } else {
        setTokenReady(false);
        setLoadingToken(true);
      }
    }
    checkToken();
    if (!tokenReady) {
      interval = setInterval(checkToken, 200);
    }
    return () => interval && clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!title || !content) return;

    try {
      setIsSaving(true);
      const response = await fetch("/api/journal/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          signature: "",
          publicKey: "",
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save draft";
        let errorDetails = "";
        try {
          if (errorText && errorText.trim().startsWith("{")) {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
              if (errorData.error.includes("Unauthorized")) {
                errorDetails =
                  "Your session may have expired. Please log in again.";
              } else if (errorData.error.includes("database")) {
                errorDetails =
                  "There was a problem connecting to the database. Please try again later.";
              }
            }
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
          errorDetails = "Unexpected server response format.";
        }
        console.error("Server response:", errorText);
        throw new Error(
          `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`
        );
      }
      // Jika sukses, langsung redirect ke halaman daftar jurnal (upload/export)
      router.push("/export");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error Saving Draft",
        description:
          error.message || "Gagal menyimpan draft. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleExportFile = (format) => {
    if (!title || !content) {
      toast({
        title: "Error",
        description:
          "Judul dan konten jurnal diperlukan untuk mengekspor file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ekspor jurnal ke format file yang dipilih
      exportJournalToFile(title, content, format);

      // Tampilkan dialog sukses
      setDialogMessage({
        title: "Jurnal Berhasil Diekspor",
        description: `Jurnal Anda telah berhasil diekspor ke format ${format.toUpperCase()}.`,
        redirectTo: "", // Tidak perlu redirect
      });
      setShowSuccessDialog(true);

      // Toast notification tetap ditampilkan dengan variant success
      toast({
        title: "Jurnal diekspor",
        description: `Jurnal Anda telah berhasil diekspor ke format ${format.toUpperCase()}.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting journal:", error);
      toast({
        title: "Error",
        description: "Gagal mengekspor jurnal. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };
  const handleSignRequest = async () => {
    if (!title || !content) return;
    setIsSaving(true);
    try {
      // Simpan draft dulu, dapatkan ID
      const response = await fetch("/api/journal/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          signature: "",
          publicKey: "",
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Gagal menyimpan draft sebelum tanda tangan"
        );
      }
      const savedJournal = await response.json();
      // Setelah draft tersimpan, langsung redirect ke halaman tanda tangan
      window.location.href = `/tandatangani?id=${savedJournal.id}`;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.message || "Gagal menyimpan draft sebelum tanda tangan.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueToSign = () => {
    setShowPreviewModal(false);
    setShowPrivateKeyModal(true);
  };
  const handleSign = async (signData) => {
    if (!title || !content || !pendingSignJournalId) return;
    const { privateKey, publicKey, subject, passHash } = signData;
    try {
      const { sign } = await import("@/lib/crypto/client-ecdsa");
      const signature = await sign(content, privateKey);
      const response = await fetch(
        `/api/journal/${pendingSignJournalId}/sign`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            signature,
            publicKey,
            subject,
            passHash,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menandatangani jurnal");
      }
      // Setelah sukses, redirect ke halaman validasi atau dashboard
      window.location.href = `/validasi?id=${pendingSignJournalId}&signed=true`;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Gagal menandatangani jurnal.",
        variant: "destructive",
      });
    }
  };

  if (loadingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">
          Memuat sesi autentikasi...
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Buat Jurnal Baru</h1>
        <p className="text-muted-foreground">
          Tulis jurnal ilmiah Anda dan tandatangani secara digital dengan
          algoritma ECDSA P-256.
        </p>
      </div>
      <div className="space-y-6">
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

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
          <h3 className="text-md font-medium text-yellow-800 dark:text-yellow-300 mb-2">
            Opsi Penyimpanan:
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700 dark:text-yellow-400">
            <li>
              <strong>Simpan Sebagai File</strong> - Mengunduh jurnal sebagai
              file DOC atau TXT ke komputer Anda.
            </li>
            <li>
              <strong>Simpan Draft</strong> - Menyimpan jurnal ke database tanpa
              tanda tangan. Dapat ditandatangani nanti.
            </li>
            <li>
              <strong>Tanda Tangani & Simpan</strong> - Menyimpan jurnal ke
              database dengan tanda tangan digital Anda.
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={!title || !content}
              >
                <FileDown className="h-4 w-4" />
                <span>Simpan Sebagai File</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportFile("doc")}>
                Format DOC (.doc)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportFile("txt")}>
                Format TXT (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSave}
            disabled={isSaving || !title || !content}
          >
            <Database className="h-4 w-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Draft"}</span>
          </Button>
          <Button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSignRequest}
            disabled={!title || !content}
          >
            <Shield className="h-4 w-4" />
            <span>Tanda Tangani & Simpan</span>
          </Button>
        </div>
      </div>
      <SignaturePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onContinue={handleContinueToSign}
        journalTitle={title}
        content={content}
      />{" "}
      {/* SignatureResultModal removed as we directly redirect to the signing page */}
    </div>
  );
}
