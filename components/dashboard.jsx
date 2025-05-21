"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  FilePlus,
  Upload,
  MoreVertical,
  Eye,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast: toast } = useToast();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("Dashboard component rendering");

  // Debugging journals state
  useEffect(() => {
    console.log("Journals state updated:", journals);
  }, [journals]); // Fetch journals from API
  useEffect(() => {
    // Membuat referensi stabil untuk toast agar tidak menyebabkan re-render yang tidak perlu
    const toastRef = { current: toast };

    const fetchJournals = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("signal_auth_token");

        if (!token) {
          toastRef.current({
            title: "Error",
            description:
              "Sesi login Anda telah berakhir. Silakan login kembali.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }

        const response = await fetch("/api/journal/mine", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

        // Transform data to match our UI needs and handle null values safely
        const formattedJournals = data
          .map((journal) => {
            // Validasi setiap journal untuk memastikan semua field yang dibutuhkan ada
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
                : new Date().toISOString().split("T")[0], // Default to today if no date
              // Tambahkan raw date untuk debugging
              rawDate: journal.createdAt || "",
            };
          })
          .filter(Boolean); // Hapus entri null

        setJournals(formattedJournals);
      } catch (error) {
        console.error("Error fetching journals:", error);
        setError(
          error.message || "Gagal memuat jurnal Anda. Silakan coba lagi nanti."
        );
        toastRef.current({
          title: "Error",
          description: "Gagal memuat jurnal Anda. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchJournals();
    }

    // Hapus toast dari dependency untuk mencegah looping
  }, [user]);
  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm(
        "Apakah Anda yakin ingin menghapus jurnal ini?"
      );

      if (!confirmed) return;
      const response = await fetch(`/api/journal/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("signal_auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus jurnal");
      }

      // Update state after successful deletion
      setJournals(journals.filter((j) => j.id !== id));

      toast({
        title: "Sukses",
        description: "Jurnal berhasil dihapus",
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
  return (
    <div className="container py-8">
      {" "}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {user?.name || "User"}! Kelola jurnal digital Anda
            di sini.
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
            asChild
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <Link href="/export" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload Jurnal</span>
            </Link>
          </Button>
        </div>
      </div>
      {error ? (
        <div className="p-6 mb-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-700">
              Error memuat data jurnal
            </h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
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
        </>
      )}
      <h2 className="mb-4 mt-8 text-xl font-bold">Daftar Jurnal</h2>{" "}
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
                      <p className="text-muted-foreground">
                        Anda belum memiliki jurnal
                      </p>
                      <Button
                        asChild
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Link href="/create">Buat Jurnal Baru</Link>
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
                        <DropdownMenuContent align="end">                          <DropdownMenuItem asChild>
                            <Link
                              href={`/editor/${journal.id}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Lihat</span>
                            </Link>
                          </DropdownMenuItem>
                          {journal.status === "unsigned" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/tandatangani?id=${journal.id}`}
                                className="flex items-center"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Tanda Tangani</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/verify?id=${journal.id}`}
                              className="flex items-center"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>Verifikasi</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(journal.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
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
    </div>
  );
}
