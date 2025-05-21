/**
 * Test script to verify the import of signPdf function
 */
import { signPdf } from './app/api/journal/sign/pdf-signer.js';

// Simple test to validate that signPdf is imported correctly
async function testSignPdfImport() {
  console.log('Testing signPdf import...');
  
  // Check if signPdf is a function
  if (typeof signPdf === 'function') {
    console.log('SUCCESS: signPdf is correctly imported as a function');
  } else {
    console.error('ERROR: signPdf is not a function. Type:', typeof signPdf);
  }
  
  try {
    // Create a simple text content to sign
    const textContent = 'This is a test document';
    
    // Create test signature data
    const signatureData = {
      signature: 'test-signature',
      publicKey: 'test-public-key',
      author: 'Test User',
      perihal: 'Test Document',
      timestamp: new Date().toISOString(),
      journalId: 'test-id',
    };
    
    // Try calling the function with minimal parameters
    console.log('Attempting to call signPdf function...');
    const result = await signPdf(textContent, signatureData);
    
    if (result && result.length > 0) {
      console.log('SUCCESS: signPdf function executed successfully and returned data');
      console.log('Result length:', result.length, 'bytes');
    } else {
      console.error('ERROR: signPdf function did not return expected data');
    }
  } catch (error) {
    console.error('ERROR: Exception thrown when calling signPdf:', error);
  }
}

// Run the test
testSignPdfImport().catch(err => {
  console.error('Unhandled error in test:', err);
});
