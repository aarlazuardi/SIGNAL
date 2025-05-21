"use client";

import dynamic from "next/dynamic";

// Dynamic import the PdfWorkerInitializer to ensure it only runs on the client
const PdfWorkerInitializer = dynamic(() => import("./pdf-worker-initializer"), {
  ssr: false,
});

// This is a client component wrapper for the PdfWorkerInitializer
export default function PdfWorkerInitializerWrapper() {
  // Only render this component on the client
  return <PdfWorkerInitializer />;
}
