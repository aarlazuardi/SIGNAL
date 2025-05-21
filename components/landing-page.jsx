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
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 py-8 sm:py-12 md:py-16 lg:py-24">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="relative flex flex-col items-center justify-center text-center min-h-[30vh] sm:min-h-[40vh] md:min-h-[50vh]">
              <div className="space-y-2 sm:space-y-3 max-w-full">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter leading-tight">
                  Keamanan dan Autentikasi Jurnal Anda Dimulai dari Sini.
                </h1>
                <p className="max-w-[600px] mx-auto text-muted-foreground text-sm sm:text-base md:text-lg px-1">
                  SIGNAL adalah platform penandatanganan jurnal digital yang
                  memastikan integritas dan keaslian setiap artikel ilmiah Anda.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row flex-wrap justify-center mt-5 sm:mt-7 md:mt-8">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full min-[400px]:w-auto h-10 inline-flex items-center"
                  onClick={() => handleProtectedAction("/create")}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="leading-none">Tulis Jurnal</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 w-full min-[400px]:w-auto h-10 inline-flex items-center"
                  onClick={() => handleProtectedAction("/export")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="leading-none">Upload Jurnal</span>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="w-full min-[400px]:w-auto h-10 inline-flex items-center"
                >
                  <Link href="/about">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span className="leading-none">Pelajari Lebih Lanjut</span>
                  </Link>
                </Button>
              </div>
              {/* Background circles for decoration */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64 rounded-full bg-emerald-600/20" />{" "}
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64 rounded-full bg-emerald-600/20" />
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="bg-muted/50 py-8 sm:py-10 md:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="mb-6 sm:mb-8 md:mb-10 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Fitur Utama
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground px-1">
                Keunggulan platform SIGNAL untuk kebutuhan penandatanganan
                jurnal digital Anda
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 text-base sm:text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="py-8 sm:py-10 md:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="mb-6 sm:mb-8 md:mb-10 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Cara Kerja
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground px-1">
                Proses sederhana untuk mengamankan jurnal ilmiah Anda
              </p>
            </div>
            <div className="grid gap-5 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Edit className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                  1. Tulis atau Upload
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground px-1">
                  Tulis jurnal baru atau upload file jurnal yang sudah ada ke
                  platform SIGNAL.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">2. Tandatangani</h3>
                <p className="text-xs sm:text-sm text-muted-foreground px-1">
                  Tandatangani jurnal Anda dengan algoritma ECDSA P-256 yang
                  aman dan terstandarisasi.
                </p>
              </div>
              <div className="flex flex-col items-center text-center sm:col-span-2 md:col-span-1 sm:max-w-md sm:mx-auto md:max-w-none">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">3. Verifikasi</h3>
                <p className="text-xs sm:text-sm text-muted-foreground px-1">
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
