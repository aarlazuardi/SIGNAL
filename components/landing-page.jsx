"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Edit,
  Upload,
  BookOpen,
  Shield,
  CheckCircle,
  FileCheck,
  Lock,
} from "lucide-react";
import Link from "next/link";
import LoginModal from "./login-modal";
import { useAuth } from "./auth-provider";

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState("");
  const { isAuthenticated } = useAuth();

  const handleProtectedAction = (redirect) => {
    if (!isAuthenticated) {
      setLoginRedirect(redirect);
      setShowLoginModal(true);
    } else {
      window.location.href = redirect;
    }
  };

  const features = [
    {
      icon: Edit,
      title: "Editor Jurnal Digital",
      description:
        "Tulis dan edit jurnal ilmiah Anda dengan editor yang mudah digunakan dan intuitif.",
    },
    {
      icon: Shield,
      title: "Tanda Tangan Digital ECDSA P-256",
      description:
        "Tandatangani jurnal Anda dengan algoritma kriptografi ECDSA P-256 yang aman dan terstandarisasi.",
    },
    {
      icon: CheckCircle,
      title: "Verifikasi Otomatis",
      description:
        "Verifikasi keaslian jurnal dengan cepat dan mudah menggunakan kunci publik.",
    },
    {
      icon: Lock,
      title: "Integritas dan Non-Repudiation",
      description:
        "Pastikan jurnal Anda tidak dapat diubah dan penandatangan tidak dapat menyangkal tanda tangannya.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="relative flex flex-col items-center justify-center text-center min-h-[60vh]">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Keamanan dan Autentikasi Jurnal Anda Dimulai dari Sini.
                </h1>
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                  SIGNAL adalah platform penandatanganan jurnal digital yang
                  memastikan integritas dan keaslian setiap artikel ilmiah
                  Anda.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center mt-8">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleProtectedAction("/create")}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Tulis Jurnal
                </Button>
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => handleProtectedAction("/export")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Jurnal
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/about">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Pelajari Lebih Lanjut
                  </Link>
                </Button>
              </div>
              {/* Background circles for decoration */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-600/20" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-600/20" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-16">
          <div className="container px-4 md:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Fitur Utama</h2>
              <p className="mt-2 text-muted-foreground">
                Keunggulan platform SIGNAL untuk kebutuhan penandatanganan
                jurnal digital Anda
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="container px-4 md:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Cara Kerja</h2>
              <p className="mt-2 text-muted-foreground">
                Proses sederhana untuk mengamankan jurnal ilmiah Anda
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Edit className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  1. Tulis atau Upload
                </h3>
                <p className="text-muted-foreground">
                  Tulis jurnal baru atau upload file jurnal yang sudah ada ke
                  platform SIGNAL.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">2. Tandatangani</h3>
                <p className="text-muted-foreground">
                  Tandatangani jurnal Anda dengan algoritma ECDSA P-256 yang
                  aman dan terstandarisasi.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <FileCheck className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">3. Verifikasi</h3>
                <p className="text-muted-foreground">
                  Bagikan jurnal Anda dan biarkan orang lain memverifikasi
                  keasliannya dengan kunci publik.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectPath={loginRedirect}
      />
    </div>
  );
}
