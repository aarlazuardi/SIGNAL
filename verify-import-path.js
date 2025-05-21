/**
 * Comprehensive test script to verify the import path fix
 */
const fs = require('fs');
const path = require('path');

console.log('=== IMPORT PATH VERIFICATION TEST ===');
console.log(`Running at: ${new Date().toLocaleString()}`);
console.log(`Current directory: ${__dirname}`);

try {
  // Define paths
  const sourceSignerPath = path.join(__dirname, 'app', 'api', 'journal', 'sign', 'pdf-signer.js');
  const routeSignPath = path.join(__dirname, 'app', 'api', 'journal', '[id]', 'sign', 'route.js');

  console.log('Paths to check:');
  console.log('- PDF signer source:', sourceSignerPath);
  console.log('- Route file:', routeSignPath);

  // Check if files exist
  console.log('\nChecking if files exist...');
  if (!fs.existsSync(sourceSignerPath)) {
    throw new Error(`PDF signer source file not found at: ${sourceSignerPath}`);
  }
  console.log('✓ PDF signer source file exists');

  if (!fs.existsSync(routeSignPath)) {
    throw new Error(`Route file not found at: ${routeSignPath}`);
  }
  console.log('✓ Route file exists');

  // Read file contents
  console.log('\nReading file contents...');
  let routeContent, sourceContent;
  
  try {
    routeContent = fs.readFileSync(routeSignPath, 'utf8');
    console.log(`✓ Route file read successfully (${routeContent.length} bytes)`);
  } catch (err) {
    throw new Error(`Failed to read route file: ${err.message}`);
  }
  
  try {
    sourceContent = fs.readFileSync(sourceSignerPath, 'utf8');
    console.log(`✓ Source file read successfully (${sourceContent.length} bytes)`);
  } catch (err) {
    throw new Error(`Failed to read source file: ${err.message}`);
  }

  // Check import pattern in route file
  console.log('\nChecking import path in route.js...');
  const importPattern = /import\s*{\s*signPdf\s*}\s*from\s*['"]([^'"]+)['"]/;
  const importMatch = routeContent.match(importPattern);

  if (!importMatch) {
    throw new Error('Could not find signPdf import in route file');
  }

  const importPath = importMatch[1];
  console.log(`Found import path: "${importPath}"`);

  // Verify the import path is correct
  if (importPath === '../../sign/pdf-signer') {
    console.log('✓ Import path is CORRECT (../../sign/pdf-signer)');
  } else if (importPath === '../../../journal/sign/pdf-signer') {
    throw new Error('Import path is still INCORRECT (../../../journal/sign/pdf-signer). It should be ../../sign/pdf-signer');
  } else {
    console.warn('⚠ WARNING: Import path is different than expected:', importPath);
    console.warn('Please verify this path is correct for your project structure');
  }

  // Print the line containing the import for verification
  const lines = routeContent.split('\n');
  let importLine = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(importPath)) {
      importLine = `${i+1}: ${lines[i]}`;
      break;
    }
  }
  console.log('Import line in route.js:', importLine);

  // Verify export in source file
  console.log('\nVerifying export in pdf-signer.js...');
  const exportPattern = /export\s+async\s+function\s+signPdf/;
  const exportMatch = sourceContent.match(exportPattern);

  if (exportMatch) {
    console.log('✓ signPdf is correctly exported as a named function in pdf-signer.js');
    
    // Print the line containing the export for verification
    const sourcelines = sourceContent.split('\n');
    let exportLine = '';
    for (let i = 0; i < sourcelines.length; i++) {
      if (sourcelines[i].includes('export async function signPdf')) {
        exportLine = `${i+1}: ${sourcelines[i]}`;
        break;
      }
    }
    console.log('Export line in pdf-signer.js:', exportLine);
  } else {
    throw new Error('Could not find proper export of signPdf function in source file');
  }

  // Final summary
  console.log('\n=== SUMMARY ===');
  console.log('✓ Import path in route.js is now:', importPath);
  console.log('✓ signPdf function is properly exported from pdf-signer.js');
  console.log('\nTo fully verify this fix:');
  console.log('1. Ensure the Next.js development server is running (npx next dev)');
  console.log('2. Run the API test script: node test-api-sign-pdf.js');
  console.log('3. Try the actual signing endpoint with a test PDF document');
  console.log('\n=== IMPORT PATH VERIFICATION COMPLETED SUCCESSFULLY ===');
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Stack trace:', error.stack);
  console.log('\n=== IMPORT PATH VERIFICATION FAILED ===');
  process.exit(1);
}
