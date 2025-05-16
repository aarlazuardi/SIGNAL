"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function Dashboard() {
  const { user } = useAuth();

  // Sample data for journals
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
    {
      id: 4,
      title: "Studi Kasus: Implementasi Digital Signature pada Jurnal Ilmiah",
      status: "unsigned",
      date: "2023-08-05",
    },
  ]);

  const handleDelete = (id) => {
    setJournals(journals.filter((j) => j.id !== id));
  };

  return (
    <div className="container py-8">
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

      <h2 className="mb-4 mt-8 text-xl font-bold">Daftar Jurnal</h2>
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
              {journals.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell className="font-medium">{journal.title}</TableCell>
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
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/view/${journal.id}`}
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Lihat</span>
                          </Link>
                        </DropdownMenuItem>
                        {journal.status === "unsigned" && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/create/${journal.id}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
