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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Info, Upload, Key } from "lucide-react";

export default function PrivateKeyModal({ isOpen, onClose, onSign, title }) {
  const [activeTab, setActiveTab] = useState("input");
  const [privateKey, setPrivateKey] = useState("");
  const [keyFile, setKeyFile] = useState(null);
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setKeyFile(file);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          setPrivateKey(event.target.result);
        } catch (error) {
          setError("Format file kunci privat tidak valid.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSign = async () => {
    if (!privateKey) {
      setError("Kunci privat diperlukan untuk menandatangani dokumen.");
      return;
    }

    setError("");
    setIsSigning(true);

    try {
      // Simulate signing process (in a real app, this would use Web Crypto API)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Call the onSign callback with the signature
      onSign({
        signature:
          "ECDSA_P256_SIGNATURE_" + Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
      });

      // Reset state and close modal
      setPrivateKey("");
      setKeyFile(null);
      onClose();
    } catch (error) {
      setError("Gagal menandatangani dokumen. Pastikan kunci privat valid.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {title || "Tanda Tangani dengan Kunci Privat"}
          </DialogTitle>
          <DialogDescription>
            Masukkan kunci privat ECDSA P-256 Anda untuk menandatangani dokumen.
            Kunci privat hanya diproses di perangkat Anda dan tidak akan dikirim
            ke server.
          </DialogDescription>
        </DialogHeader>

        <Alert
          variant="outline"
          className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          <Info className="h-4 w-4" />
          <AlertDescription>
            Kunci privat Anda tidak akan disimpan atau dikirim ke server. Proses
            penandatanganan dilakukan sepenuhnya di perangkat Anda.
          </AlertDescription>
        </Alert>

        <Tabs
          defaultValue="input"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input Manual</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey">Kunci Privat</Label>
              <Textarea
                id="privateKey"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...&#10;-----END PRIVATE KEY-----"
                className="font-mono text-sm min-h-[150px]"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="file" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyFile">File Kunci Privat</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="keyFile"
                  type="file"
                  accept=".pem,.key,.txt"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById("keyFile").click()}
                >
                  <Upload className="h-4 w-4" />
                  <span>Pilih File</span>
                </Button>
              </div>
              {keyFile && (
                <p className="text-sm text-muted-foreground">
                  File dipilih: {keyFile.name}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSigning}>
            Batal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSign}
            disabled={!privateKey || isSigning}
          >
            <Key className="mr-2 h-4 w-4" />
            {isSigning ? "Menandatangani..." : "Tanda Tangani"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
