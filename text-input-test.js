/**
 * Direct test script for testing text input in PDF signer
 */
const fs = require('fs');
const path = require('path');

async function runTextTest() {
  try {
    console.log('[TEXT-TEST] Starting PDF signing test with text input...');
    
    // Check if module path exists
    const modulePath = path.join(__dirname, 'app', 'api', 'journal', 'sign', 'pdf-signer-cjs.js');
    console.log('[TEXT-TEST] Checking if module exists at:', modulePath);
    console.log('[TEXT-TEST] File exists:', fs.existsSync(modulePath));
    
    // Import the module with more explicit error handling
    let signPdf;
    try {
      const signerModule = require('./app/api/journal/sign/pdf-signer-cjs');
      console.log('[TEXT-TEST] Module imported:', typeof signerModule);
      console.log('[TEXT-TEST] Module exports:', Object.keys(signerModule));
      
      if (typeof signerModule.signPdf !== 'function') {
        throw new Error('signPdf is not a function in the imported module');
      }
      
      signPdf = signerModule.signPdf;
      console.log('[TEXT-TEST] Successfully imported signPdf function');
    } catch (importError) {
      console.error('[TEXT-TEST] Import error:', importError);
      console.error('[TEXT-TEST] Import error stack:', importError.stack);
      process.exit(1);
    }
    
    // Use text input
    const textInput = "This is a test document for SIGNAL PDF signing functionality with direct text input.";
    console.log('[TEXT-TEST] Using text input length:', textInput.length);
    
    // Create test signature data
    const testSignatureData = {
      signature: "testSignature123456789",
      publicKey: "testPublicKey987654321",
      author: "Test User (Text Test)",
      perihal: "Text Document Test",
      passHash: "testPassHash",
      timestamp: new Date().toISOString(),
      journalId: "text-test-123",
    };

    // Sign the text
    console.log('[TEXT-TEST] Signing with text input...');
    const signedPdfBytes = await signPdf(textInput, testSignatureData);
    console.log('[TEXT-TEST] Text signed successfully!');

    // Save the signed PDF for verification
    const outputPath = path.join(__dirname, "scripts", "text-test-output.pdf");
    console.log('[TEXT-TEST] Output path:', outputPath);
    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log('[TEXT-TEST] Signed PDF saved to:', outputPath);
    console.log('[TEXT-TEST] PDF size:', signedPdfBytes.length, 'bytes');

    console.log('[TEXT-TEST] Test completed successfully!');
  } catch (error) {
    console.error('[TEXT-TEST] Error in text signing test:', error);
    console.error('[TEXT-TEST] Error stack:', error.stack);
  }
}

// Run the test
runTextTest().catch(err => {
  console.error('Unhandled error in test:', err);
});
