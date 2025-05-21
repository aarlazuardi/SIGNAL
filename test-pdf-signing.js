// This is a simple test script to verify the PDF signing functionality works
const fs = require('fs');
const path = require('path');

// Use CommonJS version of the PDF signer
(async function() {
  try {
    console.log("[TEST] Starting PDF signing test...");
    console.log("[TEST] Current directory:", __dirname);
    
    // Explicitly checking if our modules are available
    console.log("[TEST] Checking for required modules...");
    
    let signerModule;
    try {
      signerModule = require('./app/api/journal/sign/pdf-signer-cjs');
      console.log("[TEST] Successfully imported pdf-signer-cjs module");
    } catch (importErr) {
      console.error("[TEST] Failed to import pdf-signer-cjs:", importErr);
      console.log("[TEST] Detailed error:", importErr.stack);
      process.exit(1);
    }
    
    // Check if the signPdf function exists
    if (!signerModule.signPdf) {
      console.error("[TEST] signPdf function not found in the module");
      console.log("[TEST] Available exports:", Object.keys(signerModule));
      process.exit(1);
    }
    
    const { signPdf } = signerModule;
    
    // Get sample PDF path
    const samplePath = path.join(__dirname, "scripts", "sample.pdf");
    console.log("[TEST] Looking for sample PDF at:", samplePath);

    // Check if the sample PDF exists
    if (!fs.existsSync(samplePath)) {
      console.error("[TEST] Sample PDF not found at:", samplePath);
      console.log("[TEST] Contents of scripts directory:", fs.readdirSync(path.join(__dirname, "scripts")));
      
      console.log("[TEST] Using text input instead of PDF");
      runTestWithText();
      return;
    }

    // Read the PDF file
    let pdfBytes;
    try {
      pdfBytes = fs.readFileSync(samplePath);
      console.log("[TEST] Successfully read sample PDF, size:", pdfBytes.length, "bytes");
    } catch (readErr) {
      console.error("[TEST] Error reading PDF file:", readErr);
      console.log("[TEST] Using text input as fallback");
      runTestWithText();
      return;
    }

    await runTestWithPdf(pdfBytes);
  } catch (error) {
    console.error("[TEST] Unexpected error in main test function:", error);
    console.error("[TEST] Error stack:", error.stack);
    process.exit(1);
  }
})();

async function runTestWithPdf(pdfBytes) {
  try {
    const { signPdf } = require('./app/api/journal/sign/pdf-signer-cjs');
    
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

    // Sign the PDF
    console.log("[TEST] Signing PDF with test data...");
    const signedPdfBytes = await signPdf(pdfBytes, testSignatureData);
    console.log("[TEST] PDF signed successfully!");

    // Save the signed PDF for verification
    const outputPath = path.join(__dirname, "scripts", "test-output.pdf");
    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log("[TEST] Signed PDF saved to:", outputPath);
    console.log("[TEST] PDF size:", signedPdfBytes.length, "bytes");

    console.log("[TEST] Test completed successfully!");
  } catch (error) {
    console.error("[TEST] Error in PDF signing test:", error);
    console.error("[TEST] Error stack:", error.stack);
    process.exit(1);
  }
}

async function runTestWithText() {
  try {
    const { signPdf } = require('./app/api/journal/sign/pdf-signer-cjs');
    
    // Use text input
    const textInput = "This is a test document for SIGNAL PDF signing functionality.";
    console.log("[TEST] Using text input length:", textInput.length);
    
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

    // Sign the PDF
    console.log("[TEST] Signing with text input...");
    const signedPdfBytes = await signPdf(textInput, testSignatureData);
    console.log("[TEST] Text signed successfully!");

    // Save the signed PDF for verification
    const outputPath = path.join(__dirname, "scripts", "test-output.pdf");
    fs.writeFileSync(outputPath, signedPdfBytes);
    console.log("[TEST] Signed PDF saved to:", outputPath);
    console.log("[TEST] PDF size:", signedPdfBytes.length, "bytes");

    console.log("[TEST] Test completed successfully!");
  } catch (error) {
    console.error("[TEST] Error in text signing test:", error);
    console.error("[TEST] Error stack:", error.stack);
    process.exit(1);
  }
}
