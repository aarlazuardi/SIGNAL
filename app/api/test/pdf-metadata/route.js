// API route to test PDF signing and metadata extraction
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { signPdf } from "@/app/api/journal/sign/pdf-signer";
import { extractSignatureMetadataFromPdf } from "@/lib/document-utils";

export async function GET() {
  try {
    console.log("API ROUTE: Starting PDF signing and metadata test");
    
    // Create a simple PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    page.drawText('Test document for signature verification', {
      x: 50,
      y: 650,
      size: 12,
    });
    const pdfBytes = await pdfDoc.save();
    
    // Sign the PDF
    const signatureData = {
      signature: 'test-signature-value-123456789',
      publicKey: 'test-public-key-abcdefghijk',
      originalHash: 'test-document-hash-12345',
      signingDate: new Date().toISOString(),
    };
    
    const metadata = {
      author: 'Test User',
      documentId: 'test-doc-123',
      perihal: 'Test Document',
    };
    
    console.log("API ROUTE: Signing PDF");
    const signedPdfBytes = await signPdf(pdfBytes, signatureData, metadata);
    
    // Extract metadata from signed PDF
    console.log("API ROUTE: Extracting metadata");
    const extractedMetadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
    
    // Verification results
    const results = {
      signedPdfSize: signedPdfBytes.length,
      metadataExtracted: !!extractedMetadata,
      signatureMatch: extractedMetadata?.signature === signatureData.signature,
      publicKeyMatch: extractedMetadata?.publicKey === signatureData.publicKey,
      hashMatch: extractedMetadata?.originalHash === signatureData.originalHash,
      extractedMetadata: extractedMetadata || null,
    };
    
    return NextResponse.json({
      success: true,
      message: "PDF signing and metadata extraction test completed",
      results
    });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "PDF test failed",
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
