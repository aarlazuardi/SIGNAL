"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

// Component for PDF rendering with proper PDF.js worker setup and error handling
export default function PdfViewer({ pdfData, width = 450, onError }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workerLoaded, setWorkerLoaded] = useState(false);
  // Initialize the PDF.js worker
  useEffect(() => {
    const loadPdfWorker = async () => {
      try {
        // Set worker source using dynamic import for better code splitting
        // For robust worker loading across environments, we use the CDN approach
        if (
          typeof window !== "undefined" &&
          !pdfjs.GlobalWorkerOptions.workerSrc
        ) {
          // Primary CDN source
          const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

          // Setup a timeout to detect if CDN is taking too long
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Worker load timeout")), 5000)
          );

          try {
            // Try to load from CDN first with timeout
            await Promise.race([
              fetch(workerSrc, { method: "HEAD" }),
              timeoutPromise,
            ]);

            // CDN is accessible, use it
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
            console.log("PDF.js worker initialized with CDN:", workerSrc);
          } catch (cdnError) {
            console.warn(
              "CDN worker load failed, using local fallback:",
              cdnError
            );
            // Fallback to local worker if CDN fails
            pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs-dist/build/pdf.worker.min.js`;
            console.log("PDF.js worker initialized with local path");
          }

          setWorkerLoaded(true);
        }
      } catch (err) {
        console.error("Error loading PDF worker:", err);
        setError("Failed to load PDF worker. Please try again later.");
        setLoading(false);
      }
    };

    loadPdfWorker();
  }, []);

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };
  // Handle PDF load error
  const onDocumentLoadError = (err) => {
    console.error("Error loading PDF:", err);
    setError("Failed to load PDF document. Please try again later.");
    setLoading(false);
    if (onError) {
      onError(err);
    }
  };

  // Navigate to previous page
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  // Navigate to next page
  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 text-red-500">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer flex flex-col items-center">
      <Document
        file={pdfData}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="text-center p-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Loading document...</p>
          </div>
        }
        error={
          <div className="text-red-500 p-4">
            Failed to load document. Please try refreshing.
          </div>
        }
        className="w-full"
      >
        {numPages &&
          Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-md">
              <Page
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
      </Document>

      {numPages > 1 && (
        <div className="flex items-center gap-3 mt-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
