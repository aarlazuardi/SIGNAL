// Custom PDF.js worker stub
// This is a minimal implementation that can be used when CDN access fails
self.onmessage = async function(event) {
  // Just show we received the message - real worker would process it
  console.log("PDF Worker received message:", event.data);
  
  // Send a response back indicating the worker is working
  self.postMessage({
    type: "ready",
    message: "PDF Worker is ready",
    version: "4.8.69"
  });
};
