"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Eye,
  FilePlus,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "../hooks/use-toast";
import PrivateKeyModal from "./private-key-modal";
import { useAuth } from "./auth-provider";
import JournalPdfViewer from "./journal-pdf-viewer";

export default function ExportJournal() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast: toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [showSignedPdfModal, setShowSignedPdfModal] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const token = localStorage.getItem("signal_auth_token");
    if (!token && user === null) {
      toast({
        title: "Autentikasi diperlukan",
        description: "Anda harus login untuk mengakses halaman ini.",
        variant: "destructive",
      });
      // Redirect to login page
      window.location.href = "/login";
    }
  }, []);

  // Token readiness check
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

  // Function to fetch journals
  const fetchJournals = async () => {
    try {
      setLoading(true);

      // Import fungsi yang lebih robust
      const { fetchWithAuth } = await import("@/lib/api");

      // Gunakan fetchWithAuth untuk handle token dan retry
      const response = await fetchWithAuth(
        "/api/journal/mine",
        { method: "GET" },
        true, // tunggu token
        2 // retry 2x
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);

        let errorMessage = "Gagal memuat jurnal";
        try {
          // Hanya parse jika errorText berisi valid JSON
          if (errorText && errorText.trim().startsWith("{")) {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Fetched journals:", data);

      // Verifikasi bahwa data adalah array
      if (!Array.isArray(data)) {
        console.error("API response is not an array:", data);
        throw new Error("Format data jurnal tidak valid");
      }

      // Transform data untuk menyesuaikan dengan UI
      const formattedJournals = data
        .map((journal) => {
          // Validasi data jurnal
          if (!journal || typeof journal !== "object") {
            console.error("Invalid journal entry:", journal);
            return null;
          }

          return {
            id: journal.id || "",
            title: journal.title || "Untitled",
            status: journal.verified ? "signed" : "unsigned",
            date: journal.createdAt
              ? new Date(journal.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0], // Default ke hari ini jika tidak ada tanggal
            // Data raw untuk debugging
            rawDate: journal.createdAt || "",
          };
        })
        .filter(Boolean); // Hapus entri yang null

      setJournals(formattedJournals);
    } catch (error) {
      console.error("Error fetching journals:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal memuat jurnal Anda. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && tokenReady) {
      fetchJournals();
    }
  }, [user, tokenReady]);
  // Tambahkan fungsi helper untuk validasi file yang lebih cepat
  const validateFile = (file) => {
    // Validasi tipe file
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast({
        title: "Format file tidak didukung",
        description: "Hanya file PDF yang dapat diupload.",
        variant: "destructive",
      });
      return false;
    }

    // Validasi ukuran file - maks 5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "Ukuran file terlalu besar",
        description: "File PDF maksimal 5MB untuk kinerja optimal.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Format file size untuk tampilan
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Handler file change yang lebih efisien dengan feedback ukuran file
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validasi file sebelum disimpan ke state
    if (validateFile(file)) {
      setSelectedFile(file);
      // Feedback cepat untuk pengguna dengan format ukuran yang lebih baik
      toast({
        title: "File siap diupload",
        description: `${file.name} (${formatFileSize(file.size)})`,
      });
    } else {
      e.target.value = ""; // Clear input field
      setSelectedFile(null);
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "File tidak ditemukan",
        description:
          "Tidak ada file yang dipilih. Silakan pilih file untuk diunggah.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Tampilkan feedback untuk pengalaman lebih baik
    toast({
      title: "Mempersiapkan upload",
      description: "Memeriksa file dan autentikasi...",
    });

    try {
      // Validasi file dengan fungsi helper untuk lebih efisien
      if (!validateFile(selectedFile)) {
        setIsUploading(false);
        return;
      }

      // Pembatasan ukuran lebih ketat
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > MAX_SIZE) {
        toast({
          title: "File terlalu besar",
          description:
            "Ukuran file maksimal adalah 5MB. Silakan kompres file Anda.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      toast({
        title: "Mengupload jurnal",
        description: `Mengunggah file ${selectedFile.name} (${(
          selectedFile.size / 1024
        ).toFixed(1)} KB)...`,
      });

      // Coba dapatkan token dengan lebih agresif dari berbagai sumber
      let token = null;

      // Import fungsi untuk dapat token
      const { waitForAuthToken } = await import("@/lib/api");

      // Tunggu token dengan timeout yang lebih pendek (3 detik)
      token = await waitForAuthToken(3000, 50);

      // Jika masih tidak ada token, coba refresh browser storage
      if (!token && typeof window !== "undefined") {
        // Coba refresh token dari session storage
        token = sessionStorage.getItem("signal_auth_token");

        // Coba dari cookies
        if (!token && document.cookie) {
          const match = document.cookie.match(/signal_auth_token=([^;]+)/);
          if (match) token = match[1];
        }

        // Coba dari localStorage lagi (mungkin baru saja diset oleh komponen lain)
        if (!token) {
          token = localStorage.getItem("signal_auth_token");
        }
      }

      // Jika masih tidak ada token, coba dari context auth
      if (!token && user) {
        // Minta auth provider untuk update data user (refreshing token)
        await updateUserData();
        token =
          localStorage.getItem("signal_auth_token") ||
          sessionStorage.getItem("signal_auth_token");
      }

      // Jika tidak ada token, redirect ke login dengan pesan yang jelas
      if (!token) {
        toast({
          title: "Sesi Berakhir",
          description:
            "Autentikasi tidak valid atau sesi telah berakhir. Anda akan dialihkan ke halaman login.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href =
            "/login?redirect=" +
            encodeURIComponent(window.location.pathname) +
            "&reason=token_expired";
        }, 1500);
        return;
      }

      // Gunakan FormData untuk upload file dengan lebih efisien
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name.replace(/\.[^/.]+$/, ""));

      // Tambahkan indikator untuk membantu server mengetahui sumber login
      formData.append(
        "authSource",
        sessionStorage.getItem("auth_method") || "direct"
      );

      // Upload dengan AbortController untuk timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 detik timeout untuk file besar

      // Upload langsung dengan fetch sederhana tapi dengan headers yang benar
      const response = await fetch("/api/journal/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      // Clear timeout setelah response
      clearTimeout(timeoutId);

      // Handle spesifik untuk error autentikasi
      if (response.status === 401) {
        // Simpan halaman saat ini untuk redirect kembali setelah login
        sessionStorage.setItem(
          "redirect_after_login",
          window.location.pathname
        );

        toast({
          title: "Sesi Login Berakhir",
          description: "Sesi autentikasi telah berakhir. Silakan login ulang.",
          variant: "destructive",
        });

        // Hapus token yang bermasalah
        localStorage.removeItem("signal_auth_token");
        sessionStorage.removeItem("signal_auth_token");

        // Arahkan ke login dengan parameter untuk redirect kembali
        setTimeout(() => {
          window.location.href =
            "/login?redirect=" +
            encodeURIComponent(window.location.pathname) +
            "&reason=session_expired";
        }, 1500);
        return;
      }

      // Handle error umum lainnya
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Upload] Error response: ${errorText}`);

        let errorMsg = "Gagal mengunggah jurnal.";
        try {
          if (errorText && errorText.trim().startsWith("{")) {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorMsg;
          }
        } catch (e) {
          console.error("[Upload] Error parsing response:", e);
        }

        throw new Error(errorMsg);
      }

      console.log("[Upload] Response OK, memproses data");
      const data = await response.json();

      if (!data || !data.id) {
        throw new Error("Data respons dari server tidak lengkap");
      }

      // Update UI dengan hasil upload
      const newJournal = {
        id: data.id,
        title: data.title,
        status: "unsigned",
        date: new Date(data.createdAt || Date.now())
          .toISOString()
          .split("T")[0],
      };

      // Tambahkan jurnal baru ke awal list
      setJournals((prevJournals) => [newJournal, ...prevJournals]);
      setSelectedFile(null);
      setShowUploadDialog(false);

      // Tampilkan notifikasi sukses
      toast({
        title: "Sukses",
        description: "Jurnal berhasil diunggah ke database.",
        variant: "success",
      });

      // Refresh daftar jurnal untuk memastikan data terbaru dengan delay
      // untuk mengurangi beban server
      setTimeout(() => {
        fetchJournals();
      }, 1000);
    } catch (error) {
      console.error("Error during upload:", error);

      // Pesan error yang lebih informatif
      let errorMessage =
        error.message || "Terjadi kesalahan saat mengunggah jurnal";

      // Deteksi error timeout
      if (error.name === "AbortError") {
        errorMessage =
          "Upload timeout - koneksi terlalu lambat atau file terlalu besar";
      }

      toast({
        title: "Gagal Upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const handleSignRequest = (journal) => {
    if (!journal || !journal.id) {
      toast({
        title: "Error",
        description: "Tidak dapat menandatangani: data jurnal tidak lengkap",
        variant: "destructive",
      });
      return;
    } // Show notification before redirect
    toast({
      title: "Dialihkan",
      description: "Mengalihkan ke halaman tanda tangan...",
      variant: "default",
    });

    // Redirect to signature page instead of showing modal
    window.location.href = `/tandatangani?id=${journal.id}`;
  };
  const handleSign = async (privateKey, passHash) => {
    if (!selectedJournal || !privateKey) {
      toast({
        title: "Data tidak lengkap",
        description: "Tidak dapat menandatangani dokumen: data tidak lengkap",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        toast({
          title: "Sesi Berakhir",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      // Generate signature using the provided private key
      const { sign } = await import("@/lib/crypto/client-ecdsa");

      // Import fungsi fetchWithAuth yang lebih robust
      const { fetchWithAuth } = await import("@/lib/api");

      // Fetch journal content to sign dengan fetchWithAuth yang lebih robust
      const journalResponse = await fetchWithAuth(
        `/api/journal/${selectedJournal.id}`,
        { method: "GET" },
        true, // tunggu token tersedia
        2 // retry max 2x jika error 401
      );

      if (!journalResponse.ok) {
        throw new Error("Gagal mengambil konten jurnal");
      }

      const journalData = await journalResponse.json();
      // Sign the content
      const signature = await sign(journalData.content, privateKey);
      const publicKey = privateKey.publicKey;

      // Prepare additional metadata for the signature process
      const signatureMetadata = {
        perihal: "Tanda Tangan Digital ECDSA P-256",
        signedAt: new Date().toISOString(),
      };

      // If the journal has metadata from an uploaded file, include it
      if (journalData.metadata) {
        Object.assign(signatureMetadata, journalData.metadata);
      }

      console.log("Signing journal with metadata:", signatureMetadata);

      // Send signature to backend menggunakan fetchWithAuth yang lebih robust
      const updateResponse = await fetchWithAuth(
        `/api/journal/${selectedJournal.id}/sign`,
        {
          method: "POST",
          body: JSON.stringify({
            signature,
            publicKey,
            passHash,
            metadata: signatureMetadata,
          }),
        },
        true, // tunggu token tersedia
        2 // retry max 2x jika error 401
      );

      if (!updateResponse.ok) {
        let errorMessage = "Gagal menandatangani jurnal";
        try {
          const errorData = await updateResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, try to get the text
          try {
            const errorText = await updateResponse.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Error getting response text:", textError);
          }
        }
        throw new Error(errorMessage);
      }

      // Refresh journal list to reflect the new signing status
      await fetchJournals();

      // Update the UI
      setJournals((currentJournals) =>
        currentJournals.map((j) =>
          j.id === selectedJournal.id ? { ...j, status: "signed" } : j
        )
      );
      toast({
        title: "Berhasil",
        description:
          "Jurnal Anda telah berhasil ditandatangani dengan ECDSA P-256.",
        variant: "success",
      });

      // Fetch the signed PDF from backend (assume /api/journal/[id]/export returns PDF)
      try {
        const pdfRes = await fetch(
          `/api/journal/${selectedJournal.id}/export`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (pdfRes.ok) {
          const pdfBlob = await pdfRes.blob();
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setSignedPdfUrl(pdfUrl);
          setShowSignedPdfModal(true);
        } else {
          toast({
            title: "Gagal Mengambil PDF",
            description: "Tidak dapat mengambil PDF yang sudah ditandatangani.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Gagal Mengambil PDF",
          description: err.message,
          variant: "destructive",
        });
      }
      setShowPrivateKeyModal(false);
    } catch (error) {
      console.error("Error signing journal:", error);

      // Create more detailed error message for debugging
      let errorMsg = "Gagal menandatangani jurnal.";
      if (error.message) {
        errorMsg = error.message;
      }

      // Add useful instruction
      if (errorMsg.includes("PassHash tidak cocok")) {
        errorMsg +=
          " Pastikan PassHash yang Anda masukkan sama persis dengan yang tersimpan di profil.";
      }

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setSelectedJournal(null);
      setShowPrivateKeyModal(false); // Ensure modal closes even on error
    }
  };

  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm(
        "Apakah Anda yakin ingin menghapus jurnal ini?"
      );
      if (!confirmed) return;

      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        toast({
          title: "Sesi Berakhir",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      const response = await fetch(`/api/journal/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete journal");
      }

      setJournals(journals.filter((j) => j.id !== id));
      toast({
        title: "Sukses",
        description: "Jurnal berhasil dihapus",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting journal:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus jurnal. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (journal) => {
    try {
      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        toast({
          title: "Sesi Berakhir",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      const response = await fetch(`/api/journal/${journal.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch journal data");
      }

      const journalData = await response.json();
      const exportContent = `SIGNAL - Secure Integrated Global Network for Academic Literature\n---------------------------------------------------------------\nTitle: ${
        journalData.title
      }\nAuthor: ${journalData.author?.name || "Anonymous"}\nDate: ${new Date(
        journalData.createdAt
      ).toLocaleDateString("id-ID")}\nVerification ID: ${
        journalData.id
      }\nVerified: ${
        journalData.verified ? "Yes" : "No"
      }\n---------------------------------------------------------------\n\n${
        journalData.content
      }\n\n---------------------------------------------------------------\nDigital Signature Information:\nThis document is digitally signed using ECDSA P-256.\nVerification URL: ${
        window.location.origin
      }/verify?id=${journalData.id}\n      `;

      const blob = new Blob([exportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${journalData.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: `Jurnal "${journalData.title}" telah berhasil diunduh.`,
      });
    } catch (error) {
      console.error("Error exporting journal:", error);
      toast({
        title: "Error",
        description: "Gagal mengekspor jurnal. Silakan coba lagi nanti.",
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
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Upload Jurnal</h1>
          <p className="text-muted-foreground">
            Kelola, tandatangani, dan Upload jurnal Anda.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/create" className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              <span>Tulis Jurnal</span>
            </Link>
          </Button>
          <Button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Jurnal</span>
          </Button>
        </div>
      </div>
      {/* Statistik Jurnal - mirip dengan dashboard */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jurnal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jurnal Ditandatangani
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journals.filter((j) => j.status === "signed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jurnal Belum Ditandatangani
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journals.filter((j) => j.status === "unsigned").length}
            </div>
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-4 text-xl font-bold">Daftar Jurnal</h2>
      <Card>
        <CardContent className="p-0">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <p>Memuat jurnal Anda...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : journals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Anda belum memiliki jurnal
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Upload Jurnal</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                journals.map((journal) => (
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
                      {journal.date
                        ? (() => {
                            try {
                              return new Date(journal.date).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              );
                            } catch (error) {
                              console.error(
                                "Date formatting error:",
                                error,
                                journal.date
                              );
                              return journal.date; // Tampilkan format asli jika gagal
                            }
                          })()
                        : "Tanggal tidak tersedia"}
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
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/validasi?id=${journal.id}`}
                                  className="flex items-center"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Lihat</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(journal.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus</span>
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/tandatangani?id=${journal.id}`}
                                  className="flex items-center"
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>Tanda Tangani</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(journal.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            {" "}
            <div className="space-y-2">
              <Label htmlFor="file">File Jurnal</Label>{" "}
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>{" "}
              {selectedFile && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    File dipilih:{" "}
                    <span className="font-medium">{selectedFile.name}</span>
                  </p>
                  <p className="text-xs flex items-center">
                    <span
                      className={`${
                        selectedFile.size > 4 * 1024 * 1024
                          ? "text-amber-500"
                          : "text-emerald-600"
                      }`}
                    >
                      Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                      MB
                    </span>
                    {selectedFile.size > 4 * 1024 * 1024 && (
                      <AlertCircle className="h-3 w-3 text-amber-500 ml-1" />
                    )}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span>Hanya file PDF yang didukung. Ukuran maksimal: 5MB</span>
              </p>
              <p className="text-xs text-blue-500">
                (Disarankan kurang dari 2MB untuk performa terbaik)
              </p>
            </div>
          </div>{" "}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Batal
            </Button>{" "}
            <Button
              className={`${
                isUploading
                  ? "bg-blue-500"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="upload-progress">Mengupload...</span>
                </span>
              ) : (
                <>
                  <Upload className="mr-1 h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      {/* Private Key Modal */}
      <PrivateKeyModal
        isOpen={showPrivateKeyModal}
        onClose={() => setShowPrivateKeyModal(false)}
        onSign={handleSign}
        title="Tanda Tangani Jurnal"
        journalId={selectedJournal?.id}
      />
      {/* Signed PDF Preview Modal */}
      {showSignedPdfModal && (
        <Dialog open={showSignedPdfModal} onOpenChange={setShowSignedPdfModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Jurnal Ditandatangani</DialogTitle>
              <DialogDescription>
                Berikut adalah dokumen PDF yang sudah ditandatangani. Silakan
                unduh dan lanjutkan ke validasi.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              {signedPdfUrl && (
                <JournalPdfViewer url={signedPdfUrl} height={500} />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                asChild
                variant="outline"
                onClick={() => {
                  if (signedPdfUrl) {
                    const a = document.createElement("a");
                    a.href = signedPdfUrl;
                    a.download = `jurnal-ditandatangani.pdf`;
                    a.click();
                  }
                }}
              >
                <span>Download PDF</span>
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setShowSignedPdfModal(false);
                  // Optionally, redirect to validasi page
                  window.location.href = "/validasi";
                }}
              >
                Lanjut ke Validasi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
