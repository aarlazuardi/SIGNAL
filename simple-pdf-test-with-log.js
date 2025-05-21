// Simple PDF signing and verification test with file output
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

// Helper to log to both console and file
async function log(message) {
  console.log(message);
  await fs.appendFile('./pdf-test-log.txt', message + '\n').catch(() => {});
}

async function main() {
  try {
    // Clear previous log
    await fs.writeFile('./pdf-test-log.txt', '--- PDF SIGNING AND VERIFICATION TEST ---\n').catch(() => {});
    
    await log("Starting simple PDF test");
    
    // Create a simple PDF
    await log("Creating PDF document");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    page.drawText('Test document for signature verification', {
      x: 50,
      y: 650,
      size: 12,
    });
    const pdfBytes = await pdfDoc.save();
    await log(`Created PDF with ${pdfBytes.length} bytes`);
    
    // Save the unsigned PDF
    await fs.writeFile('./test-unsigned.pdf', pdfBytes);
    await log("Saved unsigned PDF to test-unsigned.pdf");
    
    // Load the signPdf function
    const signPdfModule = await import('./app/api/journal/sign/pdf-signer.js');
    await log("Loaded signPdf module: " + (!!signPdfModule.signPdf ? "YES" : "NO"));
    
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
    
    await log("Signing the PDF...");
    try {
      const signedPdfBytes = await signPdfModule.signPdf(pdfBytes, signatureData, metadata);
      await log(`Generated signed PDF with ${signedPdfBytes.length} bytes`);
      
      // Save the signed PDF
      await fs.writeFile('./test-simple-signed.pdf', signedPdfBytes);
      await log("Saved signed PDF to test-simple-signed.pdf");
      
      // Extract metadata
      await log("Loading document-utils module...");
      const docUtilsModule = await import('./lib/document-utils.js');
      await log("Document utils loaded: " + (!!docUtilsModule.extractSignatureMetadataFromPdf ? "YES" : "NO"));
      
      await log("Extracting metadata from signed PDF...");
      const extractedMetadata = await docUtilsModule.extractSignatureMetadataFromPdf(signedPdfBytes);
      
      if (extractedMetadata) {
        await log("Extracted metadata successfully: " + JSON.stringify(extractedMetadata, null, 2));
        await log("Verification result:");
        await log("- Signature matches: " + (extractedMetadata.signature === signatureData.signature));
        await log("- Public key matches: " + (extractedMetadata.publicKey === signatureData.publicKey));
        await log("- Hash matches: " + (extractedMetadata.originalHash === signatureData.originalHash));
        
        if (extractedMetadata.signature === signatureData.signature &&
            extractedMetadata.publicKey === signatureData.publicKey &&
            extractedMetadata.originalHash === signatureData.originalHash) {
          await log("✅ TEST PASSED: All metadata extracted correctly!");
        } else {
          await log("❌ TEST FAILED: Metadata values don't match!");
        }
      } else {
        await log("❌ Failed to extract metadata");
      }
    } catch (signError) {
      await log("Error during signing: " + signError.message);
      await log(signError.stack);
    }
  } catch (error) {
    await log("Test failed with error: " + error.message);
    await log(error.stack);
  }
  
  await log("Test completed");
}

main();
