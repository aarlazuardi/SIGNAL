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

      // Calculate hash of uploaded PDF for database lookup
      const uploadedPdfHash = createPdfHash(pdfBytes, "hex");
      console.log("[PDF VERIFY] Uploaded PDF hash:", uploadedPdfHash);

      // Try to verify using embedded metadata first
      console.log("[PDF VERIFY] Verifying using embedded metadata");
      const verificationResult = await verifyPdfSignature(pdfBytes);

      // If no metadata found
      if (verificationResult.status === "missing_metadata") {
        console.log(
          "[PDF VERIFY] No metadata found in PDF, trying database lookup"
        ); // Try to find document by hash or originalHash in database as fallback
        const signedDocument = await prisma.signedDocument.findFirst({
          where: {
            OR: [{ hash: uploadedPdfHash }, { originalHash: uploadedPdfHash }],
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

        if (signedDocument) {
          console.log("[PDF VERIFY] Found document in database by hash");

          // Verify signature using database data
          const isSignatureValid = verifySignature(
            signedDocument.journal.content,
            signedDocument.signature,
            signedDocument.user.publicKey
          );

          return NextResponse.json({
            verified: isSignatureValid,
            id: signedDocument.journal.id,
            title: signedDocument.journal.title,
            author: {
              name: signedDocument.user.name,
              email: signedDocument.user.email,
            },
            signedAt: signedDocument.signedAt,
            publicKey: signedDocument.user.publicKey,
            message: isSignatureValid
              ? "Dokumen terverifikasi dan cocok dengan jurnal yang terdaftar (berdasarkan hash)"
              : "Dokumen ditemukan tetapi tanda tangan digital tidak valid",
            status: isSignatureValid ? "success" : "invalid_signature",
            verificationMethod: "database",
          });
        } else {
          // No metadata and not found in database
          return NextResponse.json(
            {
              verified: false,
              error:
                "Metadata tanda tangan tidak ditemukan dalam dokumen PDF dan dokumen tidak terdaftar di database.",
              status: "missing_metadata",
            },
            { status: 400 }
          );
        }
      }

      // If signature verification from metadata successful
      if (verificationResult.verified) {
        console.log(
          "[PDF VERIFY] Document successfully verified through embedded metadata"
        );

        // Check if file might have been slightly modified
        let fileHashMatch = false;

        if (verificationResult.originalHash) {
          try {
            // Try to find document with matching originalHash in database
            const signedDocument = await prisma.signedDocument.findFirst({
              where: {
                originalHash: verificationResult.originalHash,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                journal: true,
              },
            });

            if (signedDocument) {
              console.log(
                "[PDF VERIFY] Found matching document in database by originalHash"
              );
              fileHashMatch = true;

              // Enhance response with database info
              return NextResponse.json({
                verified: true,
                id: signedDocument.journal.id,
                title: signedDocument.journal.title,
                author: {
                  name: signedDocument.user.name,
                  email: signedDocument.user.email,
                },
                signedAt:
                  signedDocument.signedAt || verificationResult.signingDate,
                publicKey: verificationResult.publicKey,
                message:
                  "Dokumen terverifikasi dan cocok dengan jurnal yang terdaftar",
                status: "success",
                fileModified: uploadedPdfHash !== signedDocument.hash,
                verificationMethod: "hybrid",
              });
            }
          } catch (e) {
            console.error(
              "[PDF VERIFY] Error checking database for originalHash:",
              e
            );
          }
        }

        // Return verification result without database enhancement
        return NextResponse.json({
          verified: true,
          message: verificationResult.message,
          publicKey: verificationResult.publicKey,
          author: verificationResult.author,
          signingDate: verificationResult.signingDate,
          contentIntegrity: true,
          fileModified: !fileHashMatch,
          status: verificationResult.status,
          verificationMethod: "metadata",
        });
      } else {
        // Return the verification error
        return NextResponse.json(
          {
            verified: false,
            message: verificationResult.message,
            status: verificationResult.status,
          },
          { status: 400 }
        );
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
