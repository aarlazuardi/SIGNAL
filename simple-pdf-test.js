// Simple PDF signing and verification test
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

async function main() {
  try {
    console.log("Starting simple PDF test");
    
    // Create a simple PDF
    console.log("Creating PDF document");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    page.drawText('Test document for signature verification', {
      x: 50,
      y: 650,
      size: 12,
    });
    const pdfBytes = await pdfDoc.save();
    console.log(`Created PDF with ${pdfBytes.length} bytes`);
    
    // Save the unsigned PDF
    await fs.writeFile('./test-unsigned.pdf', pdfBytes);
    console.log("Saved unsigned PDF to test-unsigned.pdf");
    
    // Load the signPdf function
    const signPdfModule = await import('./app/api/journal/sign/pdf-signer.js');
    console.log("Loaded signPdf module:", !!signPdfModule.signPdf);
    
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
    
    console.log("Signing the PDF...");
    try {
      const signedPdfBytes = await signPdfModule.signPdf(pdfBytes, signatureData, metadata);
      console.log(`Generated signed PDF with ${signedPdfBytes.length} bytes`);
      
      // Save the signed PDF
      await fs.writeFile('./test-simple-signed.pdf', signedPdfBytes);
      console.log("Saved signed PDF to test-simple-signed.pdf");
      
      // Extract metadata
      console.log("Loading document-utils module...");
      const { extractSignatureMetadataFromPdf } = await import('./lib/document-utils.js');
      
      console.log("Extracting metadata from signed PDF...");
      const extractedMetadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
      
      if (extractedMetadata) {
        console.log("Extracted metadata successfully:", JSON.stringify(extractedMetadata, null, 2));
        console.log("Verification result:");
        console.log("- Signature matches:", extractedMetadata.signature === signatureData.signature);
        console.log("- Public key matches:", extractedMetadata.publicKey === signatureData.publicKey);
        console.log("- Hash matches:", extractedMetadata.originalHash === signatureData.originalHash);
      } else {
        console.log("Failed to extract metadata");
      }
    } catch (signError) {
      console.error("Error during signing:", signError);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

main();
