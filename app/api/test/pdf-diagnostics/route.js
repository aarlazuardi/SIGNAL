/**
 * Test API untuk metadata PDF dan proses verifikasi
 * Untuk troubleshooting dan debugging proses tanda tangan dan verifikasi
 */
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { extractSignatureMetadataFromPdf } from "@/lib/document-utils";
import { createPdfHash, getCanonicalPdfHash } from "@/lib/crypto/document-hash";
import prisma from "@/lib/db/prisma";
import { signPdf } from "../../journal/sign/pdf-signer";

export async function POST(request) {
  try {
    // Check if request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request harus multipart/form-data" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file");
    const action = formData.get("action") || "extract"; // Default action is extract

    if (!file) {
      return NextResponse.json(
        { error: "File PDF tidak ditemukan" },
        { status: 400 }
      );
    }

    // Restrict to PDF only
    if (
      (file.type && file.type !== "application/pdf") ||
      (file.name && !file.name.toLowerCase().endsWith(".pdf"))
    ) {
      return NextResponse.json(
        { error: "Hanya file PDF yang didukung" },
        { status: 400 }
      );
    }

    // Read PDF bytes
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Calculate hashes
    const uploadedPdfHash = createPdfHash(pdfBytes, "hex");
    const canonicalPdfHash = getCanonicalPdfHash(pdfBytes, "hex");
    
    // Results object
    const results = {
      filename: file.name,
      fileSize: pdfBytes.length,
      uploadedPdfHash: uploadedPdfHash,
      canonicalPdfHash: canonicalPdfHash,
      standardMetadata: {},
      extraction: {
        success: false,
        metadata: null,
        errors: []
      },
      database: {
        success: false,
        document: null,
        errors: []
      }
    };

    // Load PDF to extract standard metadata
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      results.standardMetadata = {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
        keywords: pdfDoc.getKeywords()
      };
    } catch (error) {
      results.extraction.errors.push(`Error reading standard metadata: ${error.message}`);
    }

    // Extract SIGNAL metadata
    try {
      const metadata = await extractSignatureMetadataFromPdf(pdfBytes);
      if (metadata) {
        results.extraction.success = true;
        results.extraction.metadata = {
          signature: metadata.signature ? `${metadata.signature.substring(0, 20)}...` : null,
          publicKey: metadata.publicKey ? `${metadata.publicKey.substring(0, 20)}...` : null,
          originalHash: metadata.originalHash,
          signingDate: metadata.signingDate,
          author: metadata.author,
          version: metadata.version
        };
      } else {
        results.extraction.errors.push("No SIGNAL metadata found in PDF");
      }
    } catch (error) {
      results.extraction.errors.push(`Error extracting SIGNAL metadata: ${error.message}`);
    }

    // Look up in database
    try {
      const signedDocument = await prisma.signedDocument.findFirst({
        where: {
          OR: [
            { hash: uploadedPdfHash },
            { hash: canonicalPdfHash },
            { originalHash: uploadedPdfHash },
            { originalHash: canonicalPdfHash }
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            },
          },
          journal: {
            select: {
              id: true,
              title: true,
              signature: true,
              publicKey: true,
              metadata: true
            }
          },
        },
      });

      if (signedDocument) {
        results.database.success = true;
        results.database.document = {
          id: signedDocument.id,
          documentId: signedDocument.documentId,
          journalId: signedDocument.journal?.id,
          journalTitle: signedDocument.journal?.title,
          hash: signedDocument.hash,
          originalHash: signedDocument.originalHash,
          perihal: signedDocument.perihal,
          signedAt: signedDocument.signedAt,
          userName: signedDocument.user?.name,
          userEmail: signedDocument.user?.email,
          metadata: signedDocument.journal?.metadata
        };
      } else {
        results.database.errors.push("Document not found in database");
      }
    } catch (dbError) {
      results.database.errors.push(`Database error: ${dbError.message}`);
    }
    
    // Special actions based on the request
    if (action === "resign" && results.database.success) {
      try {
        // Get the document from the database
        const doc = results.database.document;
        const journalMetadata = typeof doc.metadata === 'string' 
          ? JSON.parse(doc.metadata) 
          : doc.metadata;
        
        // Create test signature data
        const signatureData = {
          signature: "test-signature-regenerated",
          publicKey: "test-public-key-regenerated",
          originalHash: doc.originalHash,
          signingDate: new Date().toISOString(),
        };
        
        // Additional metadata
        const metadata = {
          author: doc.userName || "Test User",
          perihal: doc.perihal || "Test Document",
          id: doc.journalId || "test-id"
        };
        
        // Sign the PDF
        const signedPdfBytes = await signPdf(pdfBytes, signatureData, metadata);
        
        // Return the signed PDF as attachment
        return new NextResponse(signedPdfBytes, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="resigned-${file.name}"`,
          },
        });
      } catch (resignError) {
        return NextResponse.json({
          error: "Error during re-signing process",
          details: resignError.message,
          results
        }, { status: 500 });
      }
    }

    // Return the results
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: `Error processing request: ${error.message}` },
      { status: 500 }
    );
  }
}
