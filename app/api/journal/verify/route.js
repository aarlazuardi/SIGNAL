/**
 * API Handler untuk verifikasi tanda tangan digital
 */
import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/crypto/ecdsa";
import prisma from "@/lib/db/prisma";
import { PDFDocument } from "pdf-lib";
import { verifyPdfSignature } from "./improved-pdf-verification";
import { extractSignatureMetadataFromPdf } from "@/lib/document-utils";
import {
  createHash,
  createPdfHash,
  verifyHash,
  getCanonicalPdfHash,
} from "@/lib/crypto/document-hash";

export async function POST(request) {
  try {
    // Check if request is multipart/form-data (PDF upload)
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Parse form data
      const formData = await request.formData();
      const file = formData.get("file");
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
          { error: "Hanya file PDF yang didukung untuk verifikasi." },
          { status: 400 }
        );
      }

      // Read PDF bytes
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // Generate both regular and canonical hashes
      const uploadedPdfHash = createPdfHash(pdfBytes, "hex");
      const canonicalPdfHash = getCanonicalPdfHash(pdfBytes, "hex");

      console.log("[PDF VERIFY] Uploaded PDF hash:", uploadedPdfHash);
      console.log("[PDF VERIFY] Canonical PDF hash:", canonicalPdfHash);

      // Try to verify using embedded metadata first
      console.log("[PDF VERIFY] Verifying using embedded metadata");
      const verificationResult = await verifyPdfSignature(pdfBytes);

      // If no metadata found or verification failed, try database lookup
      if (
        verificationResult.status === "missing_metadata" ||
        !verificationResult.verified
      ) {
        console.log(
          "[PDF VERIFY] No metadata found in PDF or verification failed, trying database lookup"
        );

        // Try to extract any standard PDF metadata for better matching
        let pdfMetadata = {};
        try {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          pdfMetadata = {
            title: pdfDoc.getTitle(),
            author: pdfDoc.getAuthor(),
            subject: pdfDoc.getSubject(),
            creator: pdfDoc.getCreator(),
          };
          console.log("[PDF VERIFY] Extracted standard PDF metadata:", pdfMetadata);
        } catch (metadataError) {
          console.log(
            "[PDF VERIFY] Error extracting standard metadata:",
            metadataError.message
          );
        }

        // Try to find document by hash with multiple methods
        // 1. Exact hash match
        // 2. Canonical hash match
        // 3. Original hash match (hash when document was first signed)
        // 4. Try to match using document filename or metadata
        let signedDocument = await prisma.signedDocument.findFirst({
          where: {
            OR: [
              { hash: uploadedPdfHash },
              { hash: canonicalPdfHash },
              { originalHash: uploadedPdfHash },
              { originalHash: canonicalPdfHash },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                publicKey: true,
              },
            },
            journal: true,
          },
        });

        // If not found by hash, try additional methods
        if (!signedDocument) {
          console.log(
            "[PDF VERIFY] Document not found by hash, trying additional methods"
          );

          // Extract filename if available
          const fileName =
            file.name && typeof file.name === "string"
              ? file.name.toLowerCase()
              : "";

          // Get all signed documents and try to find a match
          const allDocuments = await prisma.signedDocument.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  publicKey: true,
                },
              },
              journal: true,
            },
            take: 100, // Limit to recent documents
            orderBy: {
              signedAt: "desc",
            },
          });

          console.log(
            `[PDF VERIFY] Checking against ${allDocuments.length} recent documents`
          );

          // Try matching by filename pattern or metadata similarity
          for (const doc of allDocuments) {
            // Try matching by filename pattern if available
            if (fileName && doc.journal.title) {
              const journalTitle = doc.journal.title.toLowerCase();

              // If filename contains journal title or vice versa
              if (
                fileName.includes(journalTitle) ||
                journalTitle.includes(fileName)
              ) {
                console.log("[PDF VERIFY] Found potential match by filename pattern");
                signedDocument = doc;
                break;
              }
            }

            // If we have journal metadata and PDF metadata
            if (doc.journal.metadata && pdfMetadata.title) {
              try {
                const journalMeta =
                  typeof doc.journal.metadata === "string"
                    ? JSON.parse(doc.journal.metadata)
                    : doc.journal.metadata;

                // Check if PDF title matches journal title
                if (
                  pdfMetadata.title === doc.journal.title ||
                  (journalMeta.perihal &&
                    pdfMetadata.title.includes(journalMeta.perihal))
                ) {
                  console.log("[PDF VERIFY] Found potential match by metadata");
                  signedDocument = doc;
                  break;
                }

                // Check PDF author against journal author
                if (
                  pdfMetadata.author &&
                  journalMeta.signerName &&
                  pdfMetadata.author.includes(journalMeta.signerName)
                ) {
                  console.log("[PDF VERIFY] Found potential match by author name");
                  signedDocument = doc;
                  break;
                }
              } catch (metaError) {
                // Continue to next document
              }
            }
          }
        }

        if (signedDocument) {
          console.log("[PDF VERIFY] Found document in database:", signedDocument.id);

          // Get signature from document
          let signature = signedDocument.signature;
          let publicKey = signedDocument.user.publicKey;

          // If document has journal with signature and public key, use those
          if (signedDocument.journal && signedDocument.journal.signature) {
            signature = signedDocument.journal.signature;
          }

          if (signedDocument.journal && signedDocument.journal.publicKey) {
            publicKey = signedDocument.journal.publicKey;
          }

          // Check if we have all required data for verification
          if (!signature || !publicKey) {
            return NextResponse.json({
              verified: false,
              message: "Data tanda tangan atau kunci publik tidak lengkap",
              status: "missing_signature_data",
              id: signedDocument.journal?.id,
              title: signedDocument.journal?.title,
            });
          }

          // Get the content to verify against
          const contentToVerify =
            signedDocument.journal?.content || signedDocument.originalHash;

          // Verify signature using database data
          let isSignatureValid = false;

          try {
            isSignatureValid = verifySignature(
              contentToVerify,
              signature,
              publicKey
            );

            console.log(
              "[PDF VERIFY] Signature verification result:",
              isSignatureValid
            );
          } catch (verifyError) {
            console.error(
              "[PDF VERIFY] Error verifying signature:",
              verifyError.message
            );
          }

          return NextResponse.json({
            verified: isSignatureValid,
            id: signedDocument.journal?.id,
            title: signedDocument.journal?.title,
            author: {
              name: signedDocument.user.name,
              email: signedDocument.user.email,
            },
            signedAt: signedDocument.signedAt,
            publicKey: publicKey,
            message: isSignatureValid
              ? "Dokumen terverifikasi dan cocok dengan jurnal yang terdaftar (berdasarkan hash atau metadata)"
              : "Dokumen ditemukan tetapi tanda tangan digital tidak valid",
            status: isSignatureValid ? "success" : "invalid_signature",
            verificationMethod: "database",
          });
        } else {
          // No document found in database
          return NextResponse.json({
            verified: false,
            message:
              "Metadata tanda tangan tidak ditemukan dalam dokumen PDF dan dokumen tidak terdaftar di database.",
            status: "missing_metadata",
          });
        }
      } else {
        // Return the result from embedded metadata verification
        return NextResponse.json(verificationResult);
      }
    }

    // If not a PDF upload, handle as regular JSON API request
    const body = await request.json();

    // Extract necessary data for verification
    const { signature, publicKey, content } = body;

    if (!signature || !publicKey || !content) {
      return NextResponse.json(
        {
          error:
            "Data tidak lengkap. Dibutuhkan tanda tangan, kunci publik, dan konten.",
        },
        { status: 400 }
      );
    }

    // Verify signature
    const isSignatureValid = verifySignature(content, signature, publicKey);

    return NextResponse.json({
      verified: isSignatureValid,
      message: isSignatureValid
        ? "Tanda tangan valid"
        : "Tanda tangan tidak valid",
    });
  } catch (error) {
    console.error("Error verifying signature:", error);
    return NextResponse.json(
      { error: `Gagal memverifikasi: ${error.message}` },
      { status: 500 }
    );
  }
}
