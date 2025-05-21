// API route for testing PDF signing fixes

import { signPdf } from "@/app/api/journal/sign/pdf-signer";
import { extractSignatureMetadataFromPdf } from "@/lib/document-utils";

export async function GET() {
  try {
    // Test data
    const testText = "This is a test document for signature verification.";
    const sampleSignData = {
      signature: "TESTSIGNATURE123456789abcdef",
      publicKey: "TESTPUBLICKEY123456789abcdef",
      author: "Test Author",
      perihal: "Test Document",
      timestamp: new Date().toISOString(),
      journalId: "test-journal-123",
      passHash: "testhash123",
    };

    console.log("[TEST] Starting PDF signature fix test");

    // Sign the document with text content
    const signedPdfBytes = await signPdf(testText, sampleSignData);
    console.log("[TEST] PDF signed successfully");

    // Extract metadata to verify the fix worked
    const metadata = await extractSignatureMetadataFromPdf(signedPdfBytes);
    console.log(
      "[TEST] Metadata extraction result:",
      metadata ? "Success" : "Failed"
    );

    // Verification results
    const results = {
      success: !!metadata,
      signatureMatched: metadata?.signature === sampleSignData.signature,
      publicKeyMatched: metadata?.publicKey === sampleSignData.publicKey,
      metadata: metadata
        ? {
            signature: metadata.signature?.substring(0, 10) + "...",
            publicKey: metadata.publicKey?.substring(0, 10) + "...",
            author: metadata.author,
            documentHash: metadata.originalHash?.substring(0, 10) + "...",
          }
        : null,
      errors: [],
    };

    return Response.json({
      message: "PDF signature fix test complete",
      fixes: [
        {
          issue: "TypeError: infoDict.set is not a function",
          fixed: results.success,
          notes:
            "Info Dictionary implementation improved to handle all PDF object types correctly",
        },
        {
          issue:
            "TypeError: 'keywords' must be of type 'Array', but was actually of type 'string'",
          fixed: results.success,
          notes:
            "Keywords implementation now properly uses arrays as required by pdf-lib",
        },
      ],
      testResults: results,
    });
  } catch (error) {
    console.error("[TEST] Test failed with error:", error);
    return Response.json(
      {
        message: "PDF signature fix test failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
