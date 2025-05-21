/**
 * API Handler untuk verifikasi tanda tangan digital
 */
import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/crypto/ecdsa";
import prisma from "@/lib/db/prisma";
import { PDFDocument } from "pdf-lib";

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
      // Read PDF bytes
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      // Load PDF and extract metadata
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const keywords = pdfDoc.getKeywords();
      // Tambahkan log debug untuk keywords
      console.log("[PDF VERIFY] Keywords from PDF:", keywords);
      let customMeta = null;
      if (keywords && Array.isArray(keywords)) {
        for (const kw of keywords) {
          if (kw.startsWith("{")) {
            try {
              const parsed = JSON.parse(kw);
              if (parsed.signal_signature && parsed.signal_publicKey) {
                customMeta = parsed;
                break;
              }
            } catch (e) {
              console.log("[PDF VERIFY] Failed to parse keyword as JSON:", kw);
            }
          }
        }
      }
      if (!customMeta) {
        return NextResponse.json({
          verified: false,
          message:
            "Metadata tanda tangan tidak ditemukan di PDF. Pastikan file hasil unduhan dari SIGNAL.",
        });
      }
      const { signal_signature, signal_publicKey } = customMeta;
      if (!signal_signature || !signal_publicKey) {
        return NextResponse.json({
          verified: false,
          message: "Signature atau public key tidak ditemukan di metadata PDF.",
        });
      }
      // Hash the PDF bytes (excluding the signature field is not trivial; for now, hash the full PDF)
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");
      // Verify the signature over the PDF bytes
      const { p256 } = await import("@noble/curves/p256");
      const signatureBytes = Buffer.from(signal_signature, "base64");
      const publicKeyBytes = Buffer.from(signal_publicKey, "base64");
      const hashBytes = Buffer.from(hash, "hex");
      const isSignatureValid = p256.verify(
        signatureBytes,
        hashBytes,
        publicKeyBytes
      );
      return NextResponse.json({
        verified: isSignatureValid,
        publicKey: signal_publicKey,
        message: isSignatureValid
          ? "Tanda tangan digital valid dan cocok dengan file PDF."
          : "Tanda tangan digital tidak valid untuk file PDF ini.",
      });
    }

    // Parse request body
    const { content, publicKey, signature, journalId, isPdf, pdfHash } =
      await request.json();

    // Validate input
    if (!content && !journalId && !pdfHash) {
      return NextResponse.json(
        { error: "Konten, journalId, atau pdfHash diperlukan" },
        { status: 400 }
      );
    }

    // Case 1: Verify by journal ID
    if (journalId) {
      const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!journal) {
        return NextResponse.json(
          { error: "Jurnal tidak ditemukan" },
          { status: 404 }
        );
      }

      if (!journal.signature || !journal.publicKey) {
        return NextResponse.json({
          verified: false,
          message: "Jurnal belum ditandatangani secara digital",
        });
      }

      const isSignatureValid = verifySignature(
        journal.content,
        journal.signature,
        journal.publicKey
      );

      return NextResponse.json({
        verified: isSignatureValid,
        id: journal.id,
        title: journal.title,
        author: {
          name: journal.user.name,
          email: journal.user.email,
        },
        signedAt: journal.updatedAt,
        publicKey: journal.publicKey,
        message: isSignatureValid
          ? "Tanda tangan digital valid"
          : "Tanda tangan digital tidak valid",
      });
    }

    // Case 2: Direct verification with content, signature, and publicKey (from request)
    if (content && publicKey && signature) {
      const isSignatureValid = verifySignature(content, signature, publicKey);

      // Find signer info if signature is valid
      let signerInfo = null;
      if (isSignatureValid) {
        const user = await prisma.user.findFirst({
          where: { publicKey },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (user) {
          signerInfo = {
            name: user.name,
            email: user.email,
          };
        }
      }

      return NextResponse.json({
        verified: isSignatureValid,
        author: signerInfo,
        publicKey: publicKey,
        message: isSignatureValid
          ? "Tanda tangan digital valid"
          : "Tanda tangan digital tidak valid",
      });
    }

    // Case 3: Find document by content hash
    if (content) {
      // Import createDocumentHash function for consistent hashing
      const { createDocumentHash } = require("@/lib/crypto/ecdsa");

      // Compute hash of the uploaded content
      const contentHash = createDocumentHash(content, true); // Get hex string hash

      // Find all signed documents
      const signedDocuments = await prisma.signedDocument.findMany({
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

      // Cari dokumen yang cocok dengan hash yang sama
      let foundDocument = null;
      let publicKeyFound = null;

      console.log(
        `Verification: Looking for document with hash: ${contentHash.substring(
          0,
          10
        )}...`
      );

      for (const doc of signedDocuments) {
        if (doc.hash && doc.signature && doc.user.publicKey) {
          // Bandingkan hash dokumen, bukan kontennya
          console.log(
            `Comparing with stored hash: ${doc.hash.substring(
              0,
              10
            )}... for doc ID: ${doc.documentId}`
          );

          if (doc.hash === contentHash) {
            foundDocument = doc;
            publicKeyFound = doc.user.publicKey;
            console.log(`Found matching document with ID: ${doc.documentId}`);
            break;
          }

          // Fallback: if hash comparison fails, try to compute fresh hash of stored content
          const journalContentHash = createDocumentHash(
            doc.journal.content,
            true
          );
          if (journalContentHash === contentHash) {
            foundDocument = doc;
            publicKeyFound = doc.user.publicKey;
            console.log(
              `Found matching document with ID: ${doc.documentId} (using content hash)`
            );
            break;
          }
        }
      }

      if (foundDocument) {
        return NextResponse.json({
          verified: true,
          id: foundDocument.id,
          title: foundDocument.journal.title,
          author: {
            name: foundDocument.user.name,
            email: foundDocument.user.email,
          },
          signedAt: foundDocument.signedAt,
          publicKey: publicKeyFound,
          message:
            "Dokumen terverifikasi dan cocok dengan jurnal yang terdaftar",
        });
      }

      // Jika tidak ditemukan kecocokan
      return NextResponse.json({
        verified: false,
        message:
          "Tidak ditemukan jurnal yang cocok atau dokumen belum ditandatangani",
      });
    }

    // Case 4: Find document by PDF hash
    if (pdfHash) {
      // Cari dokumen yang hash-nya sama
      const signedDocuments = await prisma.signedDocument.findMany({
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
      let foundDocument = null;
      let publicKeyFound = null;
      for (const doc of signedDocuments) {
        if (doc.hash && doc.signature && doc.user.publicKey) {
          if (doc.hash === pdfHash) {
            foundDocument = doc;
            publicKeyFound = doc.user.publicKey;
            break;
          }
        }
      }
      if (foundDocument) {
        // Verifikasi signature (opsional, jika ingin double check)
        const isSignatureValid = verifySignature(
          foundDocument.journal.content,
          foundDocument.signature,
          foundDocument.user.publicKey
        );
        return NextResponse.json({
          verified: isSignatureValid,
          id: foundDocument.id,
          title: foundDocument.journal.title,
          author: {
            name: foundDocument.user.name,
            email: foundDocument.user.email,
          },
          signedAt: foundDocument.signedAt,
          publicKey: publicKeyFound,
          message: isSignatureValid
            ? "Dokumen terverifikasi dan cocok dengan jurnal yang terdaftar"
            : "Tanda tangan digital tidak valid",
        });
      }
      // Jika tidak ditemukan kecocokan
      return NextResponse.json({
        verified: false,
        message:
          "Dokumen tidak ditemukan berdasarkan hash PDF. Pastikan file yang diupload adalah hasil unduhan dari sistem.",
      });
    }

    return NextResponse.json(
      { error: "Parameter verifikasi tidak cukup" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Verify signature error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi tanda tangan" },
      { status: 500 }
    );
  }
}
