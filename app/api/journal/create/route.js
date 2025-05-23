/**
 * API Handler untuk membuat jurnal baru dan memverifikasi tanda tangan
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";
import { verifySignature } from "@/lib/crypto/ecdsa";
import { signPdf } from "../sign/pdf-signer-cjs";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } // Parse request body
    const body = await request.json();
    const { title, content, signature, publicKey, subject, passHash } = body;

    console.log("Request body:", {
      title,
      contentLength: content ? content.length : 0,
      hasSignature: !!signature,
      hasPublicKey: !!publicKey,
      hasSubject: !!subject,
    }); // Validasi input
    if (!title || !content) {
      console.log("Validation error: Missing title or content");
      return NextResponse.json(
        { error: "Judul dan konten diperlukan" },
        { status: 400 }
      );
    }

    // Batasi ukuran konten jika terlalu besar
    if (content.length > 5000000) {
      // ~5MB limit
      console.log("Content too large:", content.length);
      return NextResponse.json(
        { error: "Ukuran konten terlalu besar. Maksimal 5MB." },
        { status: 400 }
      );
    } // Check if this is a signed or unsigned journal
    let isVerified = false;

    if (signature && publicKey) {
      // Verifikasi tanda tangan jika ada
      const isSignatureValid = verifySignature(content, signature, publicKey);

      if (!isSignatureValid) {
        console.log("Invalid signature");
        return NextResponse.json(
          { error: "Tanda tangan digital tidak valid" },
          { status: 400 }
        );
      }

      isVerified = true;
    }
    try {
      // Generate PDF dari konten draft (tanpa signature)
      let pdfFile;
      try {
        pdfFile = await signPdf(content, {});
      } catch (pdfErr) {
        console.error("Gagal generate PDF draft:", pdfErr);
        return NextResponse.json(
          { error: "Gagal membuat file PDF draft: " + pdfErr.message },
          { status: 500 }
        );
      }

      // Buat jurnal baru (signed or unsigned)
      const journalData = {
        title,
        content,
        verified: isVerified,
        userId: user.id,
        pdfFile, // simpan file PDF hasil generate
      };

      // Only add signature and publicKey if they exist
      if (signature) {
        journalData.signature = signature;
      }

      if (publicKey) {
        journalData.publicKey = publicKey;
      }

      // Remove subject and passHash fields as they don't exist in the database schema

      console.log("Creating journal with data:", journalData);

      const journal = await prisma.journal.create({
        data: journalData,
      });

      console.log("Journal created successfully:", journal.id);

      return NextResponse.json(
        {
          id: journal.id,
          title: journal.title,
          verified: journal.verified,
          createdAt: journal.createdAt,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error during journal creation:", dbError);
      return NextResponse.json(
        {
          error:
            "Database error: " + (dbError.message || "Kesalahan pada database"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Create journal error:", error.name, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat jurnal: " + error.message },
      { status: 500 }
    );
  }
}
