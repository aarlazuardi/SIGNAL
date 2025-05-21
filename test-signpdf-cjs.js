/**
 * Simple test script to verify that we can require the CommonJS version of signPdf
 */
console.log('=== BEGIN TEST ===');
try {
  console.log('Testing signPdf import from CommonJS version...');
  
  // First check if the file exists
  const fs = require('fs');
  const path = require('path');
  
  const modulePath = path.join(__dirname, 'app', 'api', 'journal', 'sign', 'pdf-signer-cjs.js');
  console.log('Looking for module at:', modulePath);
  
  if (fs.existsSync(modulePath)) {
    console.log('Module file exists!');
  } else {
    console.error('ERROR: Module file does not exist at path:', modulePath);
    process.exit(1);
  }
  
  console.log('Attempting to require the module...');
  
  // Import the module
  const pdfSigner = require('./app/api/journal/sign/pdf-signer-cjs');
  
  console.log('Module imported, checking for signPdf function...');
  
  // Check if signPdf exists and is a function
  if (pdfSigner && typeof pdfSigner.signPdf === 'function') {
    console.log('SUCCESS: signPdf is correctly exported as a function in the CommonJS version');
    console.log('Module exports:', Object.keys(pdfSigner));
  } else {
    console.error('ERROR: signPdf is not a function in the CommonJS version');
    console.error('Module type:', typeof pdfSigner);
    console.error('Module content:', pdfSigner);
  }
} catch (error) {
  console.error('ERROR: Exception when importing the module:', error);
  console.error('Stack trace:', error.stack);
}
console.log('=== END TEST ===');
