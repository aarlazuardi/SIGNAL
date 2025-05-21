/**
 * Script untuk menguji implementasi metadata PDF yang baru
 * Jalur: scripts/test-pdf-metadata.js
 */
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { signPdf } from "../app/api/journal/sign/pdf-signer.js";
import { extractSignatureMetadataFromPdf } from "../lib/document-utils.js";
import { verifyPdfSignature } from "../app/api/journal/verify/improved-pdf-verification.js";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  METADATA_FIELDS,
} from "../lib/signature-config.js";

// Fungsi untuk mensimulasikan tanda tangan PDF dan verifikasi
async function testPdfMetadataImplementation() {
  try {
    console.log("===== TESTING PDF METADATA IMPLEMENTATION =====");

    // 1. Buat PDF sederhana untuk pengujian
    console.log("\n[1] Creating test PDF...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText("Test PDF for SIGNAL Digital Signature", {
      x: 50,
      y: 700,
      size: 20,
    });

    // Simpan PDF sebagai file temp
    const tempPdfBytes = await pdfDoc.save();
    const tempPdfPath = path.join(process.cwd(), "temp-test.pdf");
    fs.writeFileSync(tempPdfPath, tempPdfBytes);
    console.log(`Test PDF created at: ${tempPdfPath}`);

    // 2. Tandatangani PDF dengan implementasi baru
    console.log("\n[2] Signing the PDF with new metadata implementation...");
    const testSignatureData = {
      signature: "TEST_SIGNATURE_BASE64_STRING",
      publicKey: "TEST_PUBLIC_KEY_BASE64_STRING",
      author: "Test User",
      perihal: "Test Document",
      timestamp: new Date().toISOString(),
      journalId: "test-123",
    };

    const signedPdfBytes = await signPdf(tempPdfBytes, testSignatureData);
    const signedPdfPath = path.join(process.cwd(), "signed-test.pdf");
    fs.writeFileSync(signedPdfPath, signedPdfBytes);
    console.log(`Signed PDF created at: ${signedPdfPath}`);

    // 3. Verifikasi bahwa metadata dapat dibaca kembali
    console.log("\n[3] Extracting metadata from signed PDF...");
    const extractedMetadata = await extractSignatureMetadataFromPdf(
      signedPdfBytes
    );

    if (!extractedMetadata) {
      console.error("FAIL: Metadata extraction failed!");
    } else {
      console.log("PASS: Metadata extracted successfully!");
      console.log("Extracted metadata:", {
        signature: extractedMetadata.signature ? "✓ Present" : "✗ Missing",
        publicKey: extractedMetadata.publicKey ? "✓ Present" : "✗ Missing",
        originalHash: extractedMetadata.originalHash
          ? "✓ Present"
          : "✗ Missing",
        signingDate: extractedMetadata.signingDate,
        author: extractedMetadata.author,
        version: extractedMetadata.version,
      });
    }

    // 4. Verifikasi dengan fungsi verifyPdfSignature
    console.log("\n[4] Verifying signed PDF with verifyPdfSignature...");
    const verificationResult = await verifyPdfSignature(signedPdfBytes);

    console.log("Verification result:", {
      verified: verificationResult.verified,
      status: verificationResult.status,
      message: verificationResult.message,
    });

    // 5. Load PDF kembali dan periksa metadata langsung
    console.log("\n[5] Checking PDF metadata directly...");
    const loadedPdf = await PDFDocument.load(signedPdfBytes);

    // Cek Keywords (metode lama)
    console.log("Keywords:", loadedPdf.getKeywords());

    // Cek Info Dictionary (metode baru)
    if (loadedPdf.context.trailerInfo.Info) {
      const infoDict = loadedPdf.context.trailerInfo.Info;
      const hasCustomMetadata = infoDict.get(
        loadedPdf.context.obj(PDF_METADATA_KEY)
      );
      console.log(
        `Info Dictionary has ${PDF_METADATA_KEY}: ${!!hasCustomMetadata}`
      );
    } else {
      console.log("Info Dictionary not accessible");
    }

    // Cek Catalog Properties (metode tambahan)
    if (loadedPdf.context.trailerInfo.Root) {
      const catalog = loadedPdf.context.lookup(
        loadedPdf.context.trailerInfo.Root
      );
      const hasSignalProps = catalog.get(
        loadedPdf.context.obj(PDF_CATALOG_KEY)
      );
      console.log(`Catalog has ${PDF_CATALOG_KEY}: ${!!hasSignalProps}`);
    } else {
      console.log("Catalog not accessible");
    }

    // 6. Bersihkan file test
    console.log("\n[6] Cleaning up test files...");
    try {
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(signedPdfPath);
      console.log("Test files deleted");
    } catch (e) {
      console.log("Warning: Could not delete test files:", e.message);
    }

    console.log("\n===== TEST COMPLETE =====");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Jalankan test
testPdfMetadataImplementation();
