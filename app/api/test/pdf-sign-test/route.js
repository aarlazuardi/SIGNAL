import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { signPdf } from "@/app/api/journal/sign/pdf-signer";

// This is a test endpoint to verify our PDF signing fixes

export async function GET() {
  try {
    console.log("[TEST] Testing PDF signing with fixed implementation");

    // Get sample PDF path (using scripts/sample.pdf or creating a new one)
    let pdfBytes;
    try {
      // Try to read the sample PDF file
      const samplePath = path.join(process.cwd(), "scripts", "sample.pdf");
      console.log("[TEST] Looking for sample PDF at:", samplePath);

      if (fs.existsSync(samplePath)) {
        pdfBytes = fs.readFileSync(samplePath);
        console.log("[TEST] Using existing sample PDF file");
      } else {
        // If sample doesn't exist, use text input to create a new PDF
        console.log("[TEST] Sample PDF not found, creating new PDF from text");
        pdfBytes =
          "This is a test document for SIGNAL PDF signing functionality.";
      }
    } catch (err) {
      console.error("[TEST] Error reading sample PDF:", err);
      // Fallback to text input
      pdfBytes =
        "This is a test document for SIGNAL PDF signing functionality.";
    }

    // Create test signature data
    const testSignatureData = {
      signature: "testSignature123456789",
      publicKey: "testPublicKey987654321",
      author: "Test User",
      perihal: "Test Document",
      passHash: "testPassHash",
      timestamp: new Date().toISOString(),
      journalId: "test-journal-123",
    };

    // Sign the PDF with our fixed implementation
    console.log("[TEST] Signing PDF with test data");
    const signedPdfBytes = await signPdf(pdfBytes, testSignatureData);
    console.log("[TEST] PDF signed successfully!");

    // Save the signed PDF for debugging purposes
    const outputPath = path.join(process.cwd(), "scripts", "test-output.pdf");
    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log("[TEST] Signed PDF saved to:", outputPath);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "PDF signed successfully!",
      outputPath,
      pdfSize: signedPdfBytes.length,
    });
  } catch (error) {
    console.error("[TEST] Error in PDF sign test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
