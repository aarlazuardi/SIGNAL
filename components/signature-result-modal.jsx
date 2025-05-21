"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Shield,
  Download,
  Copy,
  CheckCircle,
  ClipboardCopy,
} from "lucide-react";
import { exportJournalToPDF } from "@/lib/journal-export";
import { useToast } from "@/hooks/use-toast";

export default function SignatureResultModal({
  isOpen,
  onClose,
  signatureData,
}) {
  const { addToast: toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  if (!signatureData) return null;

  const {
    title,
    subject,
    content,
    signature,
    publicKey,
    signer,
    timestamp,
    journalId,
  } = signatureData;

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopying(true);
        toast({
          title: "Berhasil disalin",
          description: `${label} telah disalin ke clipboard.`,
        });
        setTimeout(() => setIsCopying(false), 2000);
      })
      .catch((err) => {
        toast({
          title: "Gagal menyalin",
          description: "Tidak dapat menyalin ke clipboard.",
          variant: "destructive",
        });
      });
  };

  const handleDownloadPDF = () => {
    try {
      // Buat metadata untuk file PDF
      const metadata = {
        title: title,
        subject: subject,
        creator: signer,
        producer: "SIGNAL - Platform Jurnal dengan ECDSA",
        creationDate: new Date(timestamp),
        signatureInfo: {
          signer: signer,
          timestamp: new Date(timestamp).toLocaleString("id-ID"),
          publicKey: publicKey,
          signature: signature,
        },
      };

      // Export ke PDF
      exportJournalToPDF(title, content, metadata);

      toast({
        title: "Dokumen Diunduh",
        description: "Dokumen PDF dengan tanda tangan telah diunduh.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Gagal mengunduh dokumen PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            Dokumen Berhasil Ditandatangani
          </DialogTitle>
          <DialogDescription>
            Dokumen Anda telah berhasil ditandatangani dengan ECDSA P-256 dan
            disimpan di database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 text-sm font-medium text-muted-foreground">
              Judul
            </div>
            <div className="col-span-2 text-sm font-medium">{title}</div>

            <div className="col-span-1 text-sm font-medium text-muted-foreground">
              Perihal
            </div>
            <div className="col-span-2 text-sm font-medium">{subject}</div>

            <div className="col-span-1 text-sm font-medium text-muted-foreground">
              Penandatangan
            </div>
            <div className="col-span-2 text-sm font-medium">{signer}</div>

            <div className="col-span-1 text-sm font-medium text-muted-foreground">
              Tanggal
            </div>
            <div className="col-span-2 text-sm font-medium">
              {new Date(timestamp).toLocaleString("id-ID")}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Kunci Publik ECDSA</h4>
            <div className="relative">
              <div className="bg-muted p-3 rounded text-xs font-mono break-all h-12 overflow-y-auto">
                {publicKey}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-8 w-8 p-0"
                onClick={() => handleCopyToClipboard(publicKey, "Kunci publik")}
              >
                {isCopying ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">Tanda Tangan Digital</h4>
            <div className="relative">
              <div className="bg-muted p-3 rounded text-xs font-mono break-all h-12 overflow-y-auto">
                {signature}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-8 w-8 p-0"
                onClick={() => handleCopyToClipboard(signature, "Tanda tangan")}
              >
                {isCopying ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4" />
            Unduh Dokumen PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
