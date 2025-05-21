// Generate a signed PDF and verify it
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function testSignAndVerify() {
  try {
    console.log('Starting sign and verify test...');
    
    // Dynamically import our modules to handle ESM/CommonJS differences
    const { signPdf } = await import('./app/api/journal/sign/pdf-signer.js');
    const { extractSignatureMetadataFromPdf } = await import('./lib/document-utils.js');
    
    // Get sample PDF path (using one of our existing PDFs or creating one)
    let inputPdfPath = './scripts/sample.pdf';
    let pdfBytes;
    
    try {
      // Try to read existing PDF
      pdfBytes = await fs.readFile(inputPdfPath);
      console.log(`Read existing PDF: ${inputPdfPath}`);
    } catch (error) {
      // If file doesn't exist, create a simple PDF
      console.log('Creating a new PDF document');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([500, 700]);
      page.drawText('Test document for signature verification', {
        x: 50,
        y: 650,
        size: 12,
      });
      pdfBytes = await pdfDoc.save();
    }
    
    console.log(`PDF size: ${pdfBytes.length} bytes`);
    
    // Sign the PDF
    console.log('Signing the PDF...');
    const testMetadata = {
      author: 'Test User',
      documentId: 'test-doc-123',
      perihal: 'Test Document',
    };
    
    const signatureData = {
      signature: 'test-signature-value-123456789',
      publicKey: 'test-public-key-abcdefghijk',
      originalHash: 'test-document-hash-12345',
      signingDate: new Date().toISOString(),
    };
    
    const signedPdfBytes = await signPdf(pdfBytes, signatureData, testMetadata);
    
    // Save the signed PDF
    const outputPath = './test-signed.pdf';
    await fs.writeFile(outputPath, signedPdfBytes);
    console.log(`Signed PDF saved to: ${outputPath}`);
    
    // Extract and verify metadata
    console.log('\nExtracting metadata from signed PDF...');
    const extractedMetadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
    
    // Display results
    if (extractedMetadata) {
      console.log('\n---- METADATA VERIFICATION RESULTS ----');
      console.log('Signature:', extractedMetadata.signature ? `${extractedMetadata.signature.substring(0, 20)}...` : 'None');
      console.log('Public Key:', extractedMetadata.publicKey ? `${extractedMetadata.publicKey.substring(0, 20)}...` : 'None');
      console.log('Document Hash:', extractedMetadata.originalHash ? `${extractedMetadata.originalHash.substring(0, 20)}...` : 'None');
      console.log('Signing Date:', extractedMetadata.signingDate || 'None');
      console.log('Author:', extractedMetadata.author || 'None');
      console.log('Version:', extractedMetadata.version || 'None');
      console.log('----------------------------------');
      
      // Compare original and extracted metadata
      console.log('\n---- VERIFICATION CHECK ----');
      console.log('Signature matches:', signatureData.signature === extractedMetadata.signature ? 'YES' : 'NO');
      console.log('Public Key matches:', signatureData.publicKey === extractedMetadata.publicKey ? 'YES' : 'NO');
      console.log('Document Hash matches:', signatureData.originalHash === extractedMetadata.originalHash ? 'YES' : 'NO');
      console.log('--------------------------');
      
      if (
        signatureData.signature === extractedMetadata.signature &&
        signatureData.publicKey === extractedMetadata.publicKey &&
        signatureData.originalHash === extractedMetadata.originalHash
      ) {
        console.log('\n✅ TEST PASSED - Metadata extraction is working correctly!');
      } else {
        console.log('\n❌ TEST FAILED - Extracted metadata does not match original values');
      }
    } else {
      console.error('❌ TEST FAILED - Could not extract metadata from the signed PDF');
    }
  } catch (error) {
    console.error('Error running sign and verify test:', error);
  }
}

testSignAndVerify();
