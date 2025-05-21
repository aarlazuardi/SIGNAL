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
import { ScrollArea } from "./ui/scroll-area";
import { FileText, ArrowRight } from "lucide-react";

export default function SignaturePreviewModal({
  isOpen,
  onClose,
  onContinue,
  title,
  content,
  journalTitle,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Preview Dokumen: {journalTitle}
          </DialogTitle>
          <DialogDescription>
            Tinjau isi dokumen sebelum melanjutkan ke proses penandatanganan
          </DialogDescription>
        </DialogHeader>{" "}
        <div className="bg-muted/50 border rounded-lg p-4 my-4">
          <h3 className="text-lg font-medium mb-2">{journalTitle}</h3>
          <ScrollArea className="h-[300px] rounded border p-4 bg-white dark:bg-gray-950">
            <div className="whitespace-pre-wrap">{content}</div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kembali
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={onContinue}
          >
            Lanjutkan Tanda Tangan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
