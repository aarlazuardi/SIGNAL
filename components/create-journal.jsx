"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import { Shield, Save, FileDown, Database, Check } from "lucide-react";
import PrivateKeyModal from "./private-key-modal-new";
import SignaturePreviewModal from "./signature-preview-modal";
import SignatureResultModal from "./signature-result-modal";
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
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const { user } = useAuth();
  const router = useRouter();
  const { addToast: toast } = useToast();

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({
    title: "",
    description: "",
    redirectTo: "",
  });

  const handleSave = async () => {
    if (!title || !content) return;

    try {
      setIsSaving(true); // Call API to save draft (without signature)
      const response = await fetch("/api/journal/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          // For drafts, we pass empty signature and publicKey
          signature: "",
          publicKey: "",
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save draft";
        let errorDetails = "";

        try {
          // Try to parse the error response as JSON
          if (errorText && errorText.trim().startsWith("{")) {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;

              // Add more detailed information for specific errors
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
      const savedJournal = await response.json();

      // Tampilkan dialog sukses
      setDialogMessage({
        title: "Draft Berhasil Disimpan",
        description:
          "Jurnal Anda telah berhasil disimpan sebagai draft di database.",
        redirectTo: "/dashboard",
      });
      setShowSuccessDialog(true);

      // Toast notification tetap ditampilkan
      toast({
        title: "Draft disimpan",
        description:
          "Jurnal Anda telah berhasil disimpan sebagai draft di database.",
      });

      // Redirect to dashboard after a delay (if dialog is closed)
      setTimeout(() => {
        if (!showSuccessDialog) {
          router.push("/dashboard");
        }
      }, 2000);
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

      // Toast notification tetap ditampilkan
      toast({
        title: "Jurnal diekspor",
        description: `Jurnal Anda telah berhasil diekspor ke format ${format.toUpperCase()}.`,
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
  const handleSignRequest = () => {
    if (!title || !content) return;
    setShowPreviewModal(true);
  };

  const handleContinueToSign = () => {
    setShowPreviewModal(false);
    setShowPrivateKeyModal(true);
  };
  const handleSign = async (signData) => {
    if (!title || !content) return;
    const { privateKey, publicKey, subject, passHash } = signData;

    try {
      // Import ECDSA sign function from our crypto library
      const { sign } = await import("@/lib/crypto/client-ecdsa");

      // Generate signature using private key
      const signature = await sign(content, privateKey);

      // Call API to create signed journal
      const response = await fetch("/api/journal/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          subject,
          signature,
          publicKey,
          passHash, // For server-side hashing if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save signed journal");
      }

      const savedJournal = await response.json();

      // Set data untuk modal hasil tanda tangan
      setSignatureData({
        title,
        subject,
        content,
        signature,
        publicKey,
        signer: user?.name || "Anda",
        timestamp: new Date().toISOString(),
        journalId: savedJournal.id,
      });

      // Tampilkan modal hasil tanda tangan
      setShowResultModal(true);

      // Toast notification tetap ditampilkan
      toast({
        title: "Jurnal ditandatangani",
        description:
          "Jurnal Anda telah berhasil ditandatangani dengan ECDSA P-256.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error signing journal:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Gagal menandatangani jurnal. Periksa kunci privat Anda.",
        variant: "destructive",
      });
    }
  };
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
      <PrivateKeyModal
        isOpen={showPrivateKeyModal}
        onClose={() => setShowPrivateKeyModal(false)}
        onSign={handleSign}
        title="Tanda Tangani Jurnal"
        journalInfo={{ title, content }}
      />

      <SignaturePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onContinue={handleContinueToSign}
        journalTitle={title}
        content={content}
      />

      <SignatureResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          router.push("/dashboard");
        }}
        signatureData={signatureData}
      />

      {/* Success Dialog for Draft Save */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open && dialogMessage.redirectTo) {
            router.push(dialogMessage.redirectTo);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-6 w-6" />
              {dialogMessage.title}
            </DialogTitle>
            <DialogDescription>{dialogMessage.description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <div className="animate-pulse text-emerald-600 mt-2">
              {dialogMessage.redirectTo && "Mengalihkan ke dashboard..."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
