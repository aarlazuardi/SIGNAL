// Verify PDF Metadata Extraction
import { readFile } from 'fs/promises';
import path from 'path';
import { extractSignatureMetadataFromPdf } from './lib/document-utils.js';

async function testMetadataExtraction() {
  try {
    console.log('Starting PDF metadata extraction test...');
    
    // Get signed PDF file path from command line argument
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Please provide path to a signed PDF file as an argument');
      process.exit(1);
    }
    
    const pdfPath = args[0];
    console.log(`Testing metadata extraction for: ${pdfPath}`);
    
    // Read the PDF file
    const pdfBytes = await readFile(pdfPath);
    console.log(`Read ${pdfBytes.length} bytes from file`);
    
    // Extract metadata
    console.log('Extracting metadata...');
    const metadata = await extractSignatureMetadataFromPdf(pdfBytes);
    
    // Display results
    if (metadata) {
      console.log('\n---- METADATA EXTRACTION RESULTS ----');
      console.log('Signature:', metadata.signature ? `${metadata.signature.substring(0, 20)}...` : 'None');
      console.log('Public Key:', metadata.publicKey ? `${metadata.publicKey.substring(0, 20)}...` : 'None');
      console.log('Document Hash:', metadata.originalHash ? `${metadata.originalHash.substring(0, 20)}...` : 'None');
      console.log('Signing Date:', metadata.signingDate || 'None');
      console.log('Author:', metadata.author || 'None');
      console.log('Version:', metadata.version || 'None');
      console.log('----------------------------------');
      console.log('\nMetadata extraction successful!');
    } else {
      console.error('Failed to extract metadata from the PDF');
    }
  } catch (error) {
    console.error('Error testing metadata extraction:', error);
  }
}

testMetadataExtraction();
