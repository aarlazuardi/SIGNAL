"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import { Shield, Save } from "lucide-react";
import PrivateKeyModal from "./private-key-modal";

export default function CreateJournal() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title || !content) return;

    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Jurnal disimpan",
        description: "Jurnal Anda telah berhasil disimpan sebagai draft.",
      });
    }, 1500);
  };

  const handleSignRequest = () => {
    if (!title || !content) return;
    setShowPrivateKeyModal(true);
  };

  const handleSign = async (signatureData) => {
    toast({
      title: "Jurnal ditandatangani",
      description:
        "Jurnal Anda telah berhasil ditandatangani dengan ECDSA P-256.",
      variant: "success",
    });

    // Redirect to dashboard after successful signing
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
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

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSave}
            disabled={isSaving || !title || !content}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Draft"}</span>
          </Button>
          <Button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSignRequest}
            disabled={!title || !content}
          >
            <Shield className="h-4 w-4" />
            <span>Tanda Tangani dan Simpan</span>
          </Button>
        </div>
      </div>

      <PrivateKeyModal
        isOpen={showPrivateKeyModal}
        onClose={() => setShowPrivateKeyModal(false)}
        onSign={handleSign}
        title="Tanda Tangani Jurnal"
      />
    </div>
  );
}
