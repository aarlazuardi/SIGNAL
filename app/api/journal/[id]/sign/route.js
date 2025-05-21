/**
 * API Handler untuk menandatangani jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";
import { createHash } from "@/lib/crypto/document-hash";
import { signPdf } from "../../sign/pdf-signer";

export async function POST(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log("Sign request for journal:", id);

    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      console.log("User not found from token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Ambil data jurnal
    const journal = await prisma.journal.findUnique({
      where: { id },
    });

    if (!journal) {
      console.log("Journal not found:", id);
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verifikasi kepemilikan jurnal
    if (journal.userId !== user.id) {
      console.log("Journal ownership mismatch:", {
        journalUserId: journal.userId,
        currentUserId: user.id,
      });
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk menandatangani jurnal ini" },
        { status: 403 }
      );
    }

    // Ambil data dari request
    const data = await request.json();
    console.log("Request data received:", {
      hasSignature: !!data.signature,
      hasPublicKey: !!data.publicKey,
      hasPassHash: !!data.passHash,
      hasMetadata: !!data.metadata,
      hasPerihal: !!data.perihal || (data.metadata && !!data.metadata.perihal),
    });

    const { signature, publicKey, passHash } = data;
    // Get perihal from either direct param or metadata
    const perihal = data.perihal || (data.metadata && data.metadata.perihal);

    // Verifikasi data yang diperlukan
    if (!signature || !publicKey) {
      return NextResponse.json(
        { error: "Signature dan publicKey harus disediakan" },
        { status: 400 }
      );
    }

    // Verifikasi passHash
    if (!passHash) {
      return NextResponse.json(
        { error: "PassHash harus disediakan untuk verifikasi" },
        { status: 400 }
      );
    }

    // Verifikasi perihal
    if (!perihal) {
      return NextResponse.json(
        { error: "Perihal wajib diisi" },
        { status: 400 }
      );
    }

    // Verifikasi apakah user memiliki passHash yang tersimpan
    if (!user.signature) {
      console.log("User has no signature stored in profile:", user.id);
      return NextResponse.json(
        {
          error:
            "Anda belum menyiapkan PassHash di profil. Silakan perbarui profil Anda terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    // Verifikasi kecocokan passHash dengan yang tersimpan di profil
    console.log("PassHash comparison:", {
      stored: user.signature ? user.signature.substring(0, 3) + "..." : "null",
      provided: passHash ? passHash.substring(0, 3) + "..." : "null",
      storedLength: user.signature ? user.signature.length : 0,
      providedLength: passHash ? passHash.length : 0,
      isExactMatch: user.signature === passHash,
      userSignatureType: typeof user.signature,
      passHashType: typeof passHash,
    });

    if (user.signature !== passHash) {
      return NextResponse.json(
        { error: "PassHash tidak cocok dengan yang tersimpan di profil Anda" },
        { status: 400 }
      );
    }

    // Simpan signature ke tabel SignedDocument
    const signedAt = new Date().toISOString();

    // Calculate document hash using our improved document-hash module
    const originalDocumentHash = createHash(journal.content, "hex");
    console.log(
      "Generated original document hash:",
      originalDocumentHash.substring(0, 10) + "..."
    );

    console.log("Creating signed document record...");
    const signedDoc = await prisma.signedDocument.create({
      data: {
        userId: user.id,
        documentId: journal.id,
        perihal,
        hash: originalDocumentHash, // Initial hash (will be updated with final PDF hash later)
        originalHash: originalDocumentHash, // Store original content hash for verification
        signature,
        signedAt: new Date(signedAt),
      },
    });

    // Update jurnal dengan signature dan tanda verified (dengan metadata)
    console.log("Updating journal with signature and metadata...");

    // Combine existing metadata with new signature metadata
    const existingMetadata = journal.metadata || {};

    const metadata = {
      ...existingMetadata, // Keep existing metadata (e.g. file info)
      perihal,
      signedAt: signedAt,
      signerName: user.name,
      signerEmail: user.email,
      documentHash: originalDocumentHash,
    };

    // If client sent additional metadata, merge it
    if (data.metadata) {
      Object.assign(metadata, data.metadata);
    }

    console.log("Metadata yang akan disimpan:", metadata);

    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: {
        signature,
        publicKey,
        verified: true,
        metadata: metadata,
      },
    });

    // === Generate the signed PDF using our PDF signer utility ===
    try {
      // Prepare signature data for PDF signing
      const signatureData = {
        signature,
        publicKey,
        author: user.name,
        perihal,
        passHash,
        timestamp: signedAt,
        journalId: journal.id,
        addVerificationPage: true, // Add the verification page with instructions
      };

      // Sign the PDF document using our utility
      const signedPdfBytes = await signPdf(journal.content, signatureData);

      // Calculate the final PDF hash
      const finalDocumentHash = createHash(signedPdfBytes, "hex");

      // Update the signed document record with the final hash
      await prisma.signedDocument.update({
        where: { id: signedDoc.id },
        data: { hash: finalDocumentHash },
      });

      // Update journal metadata with the final document hash
      await prisma.journal.update({
        where: { id: journal.id },
        data: {
          metadata: {
            ...metadata,
            documentHash: finalDocumentHash,
            fileName: `SIGNAL_${journal.id}_signed.pdf`,
          },
        },
      });

      console.log(
        "Final PDF hash stored:",
        finalDocumentHash.substring(0, 10) + "..."
      );
    } catch (err) {
      console.error("Failed to generate or hash PDF after signing:", err);
    }

    return NextResponse.json({
      message: "Jurnal berhasil ditandatangani",
      id: updatedJournal.id,
      verified: updatedJournal.verified,
      perihal: perihal,
    });
  } catch (error) {
    console.error("Sign journal error:", error);
    // Provide more specific error message when possible
    const errorMessage =
      error.message || "Terjadi kesalahan saat menandatangani jurnal";
    console.error("Returning error to client:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
