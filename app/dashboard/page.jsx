"use client";

import React from "react";
import Dashboard from "@/components/dashboard";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Tangkap error di level komponen halaman
  useEffect(() => {
    // Tambahkan event listener untuk error global
    const handleError = (error) => {
      console.error("Dashboard error caught:", error);
      setHasError(true);
      setErrorMessage(
        error.message || "Terjadi kesalahan saat memuat dashboard"
      );
    };

    // Tambahkan event listener untuk unhandled rejection
    const handleRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      setHasError(true);
      setErrorMessage(
        event.reason?.message || "Terjadi kesalahan pada operasi asinkron"
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Set loading false setelah komponen dimount
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      clearTimeout(timer);
    };
  }, []);
  if (hasError) {
    return (
      <div className="container py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-2xl font-bold text-red-700 mb-4">
            Error Memuat Dashboard
          </h1>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <div className="space-y-4">
            <p className="text-gray-700">Beberapa kemungkinan penyebab:</p>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Sesi login Anda mungkin telah berakhir</li>
              <li>Koneksi ke server terputus</li>
              <li>Ada masalah dengan data jurnal Anda</li>
            </ol>
            <div className="pt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Muat Ulang Halaman
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="ml-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-emerald-800">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={<DashboardError onReset={() => window.location.reload()} />}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}

// Komponen ErrorBoundary untuk menangkap error di React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Komponen untuk menampilkan error dashboard
function DashboardError({ onReset }) {
  return (
    <div className="container py-8">
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-700 mb-4">
          Error Pada Komponen Dashboard
        </h1>
        <p className="text-red-600 mb-4">
          Terjadi kesalahan saat merender dashboard
        </p>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Coba Lagi
        </button>{" "}
      </div>
    </div>
  );
}
