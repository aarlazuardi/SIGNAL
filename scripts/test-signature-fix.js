/**
 * Script untuk menguji perbaikan fungsi penandatanganan PDF
 * Pengujian terhadap dua error utama:
 * 1. TypeError: infoDict.set is not a function
 * 2. TypeError: 'keywords' must be of type 'Array', but was actually of type 'string'
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Handle ESM module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic imports for Next.js modules
const { signPdf } = await import("../app/api/journal/sign/pdf-signer.js");
const { extractSignatureMetadataFromPdf } = await import(
  "../lib/document-utils.js"
);

// Sample data untuk pengujian
const sampleSignData = {
  signature: "TESTSIGNATURE123456789abcdef",
  publicKey: "TESTPUBLICKEY123456789abcdef",
  author: "Test Author",
  perihal: "Test Document",
  timestamp: new Date().toISOString(),
  journalId: "test-journal-123",
  passHash: "testhash123",
};

async function testPdfSigning() {
  try {
    // 1. Load sample PDF
    console.log("Loading sample PDF...");
    let pdfPath;
    // Coba beberapa lokasi yang mungkin untuk file PDF pengujian
    const possiblePaths = [
      path.resolve(__dirname, "sample.pdf"),
      path.resolve(__dirname, "../public/sample.pdf"),
      path.resolve(__dirname, "../sample.pdf"),
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        pdfPath = testPath;
        break;
      }
    }

    // Jika tidak ada file PDF, buat dummy PDF dengan teks sederhana
    if (!pdfPath) {
      console.log("No sample PDF found, using text content instead");
      const pdfText = "This is a test document for signature verification.";

      // 2. Sign PDF with sample data
      console.log("Signing PDF with dummy text content...");
      const signedPdfBytes = await signPdf(pdfText, sampleSignData);

      // 3. Save signed PDF
      const outputPath = path.resolve("./scripts/test-signed-output.pdf");
      fs.writeFileSync(outputPath, signedPdfBytes);
      console.log(`Signed PDF saved to ${outputPath}`);

      // 4. Extract and verify metadata from signed PDF
      console.log("Extracting metadata from signed PDF...");
      const metadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
      console.log("Extracted metadata:", JSON.stringify(metadata, null, 2));

      return { success: true, path: outputPath, metadata };
    } else {
      // Use existing PDF
      console.log(`Using existing PDF: ${pdfPath}`);
      const pdfBytes = fs.readFileSync(pdfPath);

      // 2. Sign PDF with sample data
      console.log("Signing PDF...");
      const signedPdfBytes = await signPdf(pdfBytes, sampleSignData);

      // 3. Save signed PDF
      const outputPath = path.resolve("./scripts/test-signed-output.pdf");
      fs.writeFileSync(outputPath, signedPdfBytes);
      console.log(`Signed PDF saved to ${outputPath}`);

      // 4. Extract and verify metadata from signed PDF
      console.log("Extracting metadata from signed PDF...");
      const metadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
      console.log("Extracted metadata:", JSON.stringify(metadata, null, 2));

      return { success: true, path: outputPath, metadata };
    }
  } catch (error) {
    console.error("Error in PDF signing test:", error);
    return { success: false, error: error.message };
  }
}

// Run the test
console.log("Starting PDF signature test...");
testPdfSigning().then((result) => {
  if (result.success) {
    console.log("✅ PDF signing test completed successfully!");
    console.log(`Signed PDF saved at: ${result.path}`);

    if (result.metadata) {
      console.log("✅ Metadata successfully extracted from signed PDF");
      // Verify signature and publicKey from metadata
      const foundSignature =
        result.metadata.signature === sampleSignData.signature;
      const foundPublicKey =
        result.metadata.publicKey === sampleSignData.publicKey;

      console.log(`Signature match: ${foundSignature ? "✅" : "❌"}`);
      console.log(`Public key match: ${foundPublicKey ? "✅" : "❌"}`);

      if (foundSignature && foundPublicKey) {
        console.log(
          "✅ FIXES SUCCESSFUL: Both signature errors appear to be resolved!"
        );
      } else {
        console.log(
          "❌ PARTIAL SUCCESS: Metadata was saved but content doesn't match expected values"
        );
      }
    } else {
      console.log("❌ WARNING: PDF was created but no metadata was extracted");
    }
  } else {
    console.log("❌ PDF signing test failed");
  }
});
