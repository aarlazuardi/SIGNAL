// test-fix.js - Simple test script for PDF signing fixes
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");
const path = require("path");

// Test data
const testText = "This is a test document for signature verification.";
const sampleSignData = {
  signature: "TESTSIGNATURE123456789abcdef",
  publicKey: "TESTPUBLICKEY123456789abcdef",
  author: "Test Author",
  perihal: "Test Document",
  timestamp: new Date().toISOString(),
  journalId: "test-journal-123",
  passHash: "testhash123",
};

async function runTest() {
  try {
    console.log("Importing PDF functions...");
    // Dynamic imports
    const { signPdf } = await import("../app/api/journal/sign/pdf-signer.js");
    const { extractSignatureMetadataFromPdf } = await import(
      "../lib/document-utils.js"
    );

    console.log("Signing test document...");
    // Sign the document (use text content for simplicity)
    const signedPdfBytes = await signPdf(testText, sampleSignData);

    // Save output
    const outputPath = path.resolve("./test-signed-output.pdf");
    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log(`Signed PDF saved to ${outputPath}`);

    // Extract metadata to verify success
    console.log("Extracting metadata from signed PDF...");
    const metadata = await extractSignatureMetadataFromPdf(signedPdfBytes);

    console.log(
      "Test results:",
      metadata
        ? "✅ Metadata extracted successfully"
        : "❌ Failed to extract metadata"
    );

    if (metadata) {
      console.log(
        "Signature verification:",
        metadata.signature === sampleSignData.signature
          ? "✅ Matched"
          : "❌ Not matched"
      );
      console.log(
        "Public key verification:",
        metadata.publicKey === sampleSignData.publicKey
          ? "✅ Matched"
          : "❌ Not matched"
      );
    }

    return true;
  } catch (error) {
    console.error("Test failed with error:", error);
    return false;
  }
}

runTest().then((success) => {
  console.log("Test completed", success ? "successfully" : "with errors");
});
