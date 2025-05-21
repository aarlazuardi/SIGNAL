/**
 * Test script to check the sign-pdf-test API route
 */
console.log('=== API ROUTE TEST START ===');
console.log('Testing signPdf function import in Next.js API context');

// First check if the server is running
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'HEAD',
  timeout: 2000
};

console.log('Checking if Next.js development server is running...');
const serverCheck = http.request(options, (res) => {
  console.log('Server is running! Status code:', res.statusCode);
  
  // Now test our API endpoint
  testApiEndpoint();
});

serverCheck.on('error', (error) => {
  console.error('ERROR: Development server is not running at http://localhost:3000');
  console.error('Please make sure the Next.js development server is started with "npm run dev" or "npx next dev"');
  console.error('Error details:', error.message);
  
  console.log('=== API ROUTE TEST FAILED ===');
  process.exit(1);
});

serverCheck.on('timeout', () => {
  console.error('ERROR: Request to development server timed out');
  serverCheck.abort();
  console.log('=== API ROUTE TEST FAILED ===');
  process.exit(1);
});

serverCheck.end();

function testApiEndpoint() {
  console.log('Making request to http://localhost:3000/api/test/sign-pdf-test...');
  
  const apiRequest = http.get('http://localhost:3000/api/test/sign-pdf-test', (res) => {
    const { statusCode } = res;
    let data = '';
    
    console.log('Response status code:', statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response received!');
      
      try {
        console.log('Raw response data:', data);
        
        if (!data) {
          console.error('ERROR: Empty response from API');
          console.log('=== API ROUTE TEST FAILED ===');
          process.exit(1);
        }
        
        const parsedData = JSON.parse(data);
        
        if (parsedData.success) {
          console.log('SUCCESS: signPdf imported and executed successfully in API route');
          console.log('PDF bytes length:', parsedData.bytesLength);
          console.log('=== API ROUTE TEST PASSED ===');
          process.exit(0);
        } else {
          console.error('ERROR: API returned error:', parsedData.error);
          
          if (parsedData.message) {
            console.error('Error message:', parsedData.message);
          }
          
          if (parsedData.stack) {
            console.error('Stack trace:', parsedData.stack);
          }
          
          console.log('=== API ROUTE TEST FAILED ===');
          process.exit(1);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.error('Raw response:', data);
        console.log('=== API ROUTE TEST FAILED ===');
        process.exit(1);
      }
    });
  });
  
  apiRequest.on('error', (error) => {
    console.error('Error making API request:', error.message);
    console.log('=== API ROUTE TEST FAILED ===');
    process.exit(1);
  });
  
  apiRequest.on('timeout', () => {
    console.error('API request timed out');
    apiRequest.abort();
    console.log('=== API ROUTE TEST FAILED ===');
    process.exit(1);
  });
  
  // Set timeout for the request
  apiRequest.setTimeout(5000);
}
