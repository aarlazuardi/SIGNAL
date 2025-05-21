"use client";

import { useEffect } from "react";
import { pdfjs } from "react-pdf";

// This component handles PDF.js worker initialization
export default function PdfWorkerInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const version = pdfjs.version;
      const cdnWorker = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
      const localWorker = `/pdfjs-dist/build/pdf.worker.min.js`;

      // Try CDN first, fallback to local
      const loadWorker = async () => {
        try {
          // Try to fetch the CDN worker (HEAD request)
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("CDN timeout")), 3000)
          );

          await Promise.race([fetch(cdnWorker, { method: "HEAD" }), timeout]);

          // CDN is accessible
          pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
          console.log("PDF.js worker initialized from CDN:", cdnWorker);
        } catch (e) {
          // Fallback to local worker
          pdfjs.GlobalWorkerOptions.workerSrc = localWorker;
          console.warn("PDF.js worker fallback to local:", localWorker);
        }
      };

      loadWorker().catch((err) => {
        console.error("Error initializing PDF worker:", err);
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
