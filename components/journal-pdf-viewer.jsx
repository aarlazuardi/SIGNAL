"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PdfViewer from "@/components/pdf-viewer";

export default function JournalPdfViewer({ pdfData }) {
  const [showRetry, setShowRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  // Handle retry loading the PDF
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setShowRetry(false);
    setPdfError(false);
  };

  // Handle errors from the PDF viewer
  const handlePdfError = (error) => {
    console.error("PDF error in journal viewer:", error);
    setPdfError(true);
    setShowRetry(true);
  };

  return (
    <div className="relative">
      {/* Show retry UI if needed */}
      {showRetry && (
        <div className="absolute inset-0 bg-gray-100/90 flex flex-col items-center justify-center z-10 rounded-md p-4">
          <p className="text-red-500 mb-4">
            Terjadi kesalahan saat memuat PDF.
          </p>
          <Button
            variant="outline"
            onClick={handleRetry}
            className="bg-white hover:bg-gray-100"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Main PDF viewer with key for forcing remount on retry */}
      <div className={pdfError ? "opacity-30" : "opacity-100"}>
        <PdfViewer
          key={`pdf-viewer-${retryCount}`}
          pdfData={pdfData}
          width={450}
          onError={handlePdfError}
        />
      </div>

      {/* Footer error message */}
      {pdfError && (
        <div className="text-xs text-red-500 mt-2">
          Gagal memuat preview PDF. Coba muat ulang atau gunakan browser lain.
        </div>
      )}
    </div>
  );
}
