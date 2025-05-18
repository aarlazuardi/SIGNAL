"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  FileText,
  Upload,
  MoreVertical,
  Download,
  Trash2,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import PrivateKeyModal from "./private-key-modal";

export default function ExportJournal() {
  const [journals, setJournals] = useState([
    {
      id: 1,
      title: "Implementasi Algoritma ECDSA P-256 untuk Digital Signature",
      status: "signed",
      date: "2023-05-15",
    },
    {
      id: 2,
      title: "Analisis Keamanan Sistem Penandatanganan Digital",
      status: "unsigned",
      date: "2023-06-20",
    },
    {
      id: 3,
      title: "Perbandingan Algoritma Digital Signature: RSA vs ECDSA",
      status: "signed",
      date: "2023-07-10",
    },
  ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setShowUploadDialog(false);
      setSelectedFile(null);

      // Add new journal to the list
      const newJournal = {
        id: Date.now(),
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        status: "unsigned",
        date: new Date().toISOString().split("T")[0],
      };

      setJournals([newJournal, ...journals]);

      toast({
        title: "Jurnal diunggah",
        description: "Jurnal Anda telah berhasil diunggah.",
      });
    }, 1500);
  };

  const handleSignRequest = (journal) => {
    setSelectedJournal(journal);
    setShowPrivateKeyModal(true);
  };

  const handleSign = (signatureData) => {
    if (!selectedJournal) return;

    // Update journal status
    setJournals(
      journals.map((j) =>
        j.id === selectedJournal.id ? { ...j, status: "signed" } : j
      )
    );

    toast({
      title: "Jurnal ditandatangani",
      description:
        "Jurnal Anda telah berhasil ditandatangani dengan ECDSA P-256.",
      variant: "success",
    });
  };

  const handleDelete = (id) => {
    setJournals(journals.filter((j) => j.id !== id));

    toast({
      title: "Jurnal dihapus",
      description: "Jurnal telah berhasil dihapus.",
    });
  };

  const handleExport = (journal) => {
    toast({
      title: "Jurnal diunduh",
      description: `Jurnal "${journal.title}" telah berhasil diunduh sebagai PDF.`,
    });
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Unggah Jurnal</h1>
          <p className="text-muted-foreground">
            Kelola, tandatangani, dan ekspor jurnal Anda ke format PDF.
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowUploadDialog(true)}
        >
          <Upload className="h-4 w-4" />
          <span>Upload Jurnal</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Jurnal</CardTitle>
          <CardDescription>
            Jurnal yang telah Anda buat atau unggah. Jurnal yang ditandatangani
            dapat diekspor ke PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {journals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-medium">
                      {journal.title}
                    </TableCell>
                    <TableCell>
                      {journal.status === "signed" ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                          <CheckCircle className="h-4 w-4" />
                          <span>Ditandatangani</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                          <AlertCircle className="h-4 w-4" />
                          <span>Belum ditandatangani</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(journal.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {journal.status === "signed" ? (
                            <DropdownMenuItem
                              onClick={() => handleExport(journal)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>Ekspor PDF</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleSignRequest(journal)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Tanda Tangani PDF</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(journal.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">Belum ada jurnal</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Anda belum memiliki jurnal. Upload jurnal atau buat jurnal baru.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload Jurnal</span>
                </Button>
                <Button asChild>
                  <a href="/create">Buat Jurnal</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Jurnal</DialogTitle>
            <DialogDescription>
              Upload file jurnal Anda untuk ditandatangani dan dikelola di
              platform SIGNAL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File dipilih: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Mengunggah..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Private Key Modal */}
      <PrivateKeyModal
        isOpen={showPrivateKeyModal}
        onClose={() => setShowPrivateKeyModal(false)}
        onSign={handleSign}
        title="Tanda Tangani PDF"
      />
    </div>
  );
}
