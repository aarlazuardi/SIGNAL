/**
 * Test script to verify signPdf can be properly imported and called
 */
import { signPdf } from './app/api/journal/sign/pdf-signer.js';

async function testSignPdf() {
  try {
    console.log("Testing signPdf import...");
    console.log("signPdf type:", typeof signPdf);
    
    if (typeof signPdf !== 'function') {
      console.error("ERROR: signPdf is not a function!");
      return;
    }
    
    console.log("SUCCESS: signPdf is properly imported as a function");
    
    // Create a simple test document
    const testText = "This is a test document";
    const testSignData = {
      signature: "testSignature123",
      publicKey: "testPublicKey123",
      author: "Test User",
      perihal: "Test Document",
      timestamp: new Date().toISOString(),
      journalId: "test-123",
    };
    
    console.log("Attempting to call signPdf...");
    const result = await signPdf(testText, testSignData);
    
    console.log("signPdf executed successfully!");
    console.log("Result type:", typeof result);
    console.log("Result length:", result ? result.length : "N/A");
    
    return "Test completed successfully";
  } catch (error) {
    console.error("Error testing signPdf:", error);
    throw error;
  }
}

testSignPdf()
  .then(result => console.log(result))
  .catch(error => console.error("Test failed:", error));
