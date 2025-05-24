import { NextResponse } from "next/server";
import { signPdf } from "../journal/sign/pdf-signer";

export async function GET(request) {
  try {
    console.log("[API_TEST] Testing signPdf import in API route");
    // Check if signPdf is a function
    if (typeof signPdf !== "function") {
      return NextResponse.json(
        { error: "signPdf is not a function", type: typeof signPdf },
        { status: 500 }
      );
    }
    // Create test data
    const textContent = "Test document for API route";
    const signatureData = {
      signature: "api-test-signature",
      publicKey: "api-test-public-key",
      author: "API Test User",
      perihal: "API Test Document",
      timestamp: new Date().toISOString(),
    };
    // Try to sign the document
    const signedPdfBytes = await signPdf(textContent, signatureData);
    if (!signedPdfBytes || signedPdfBytes.length === 0) {
      return NextResponse.json(
        { error: "signPdf did not return valid PDF data" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "signPdf imported and executed successfully",
      bytesLength: signedPdfBytes.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error in test",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
