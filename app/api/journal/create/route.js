/**
 * API Handler untuk membuat jurnal baru dan memverifikasi tanda tangan
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../../middleware/auth";
import prisma from "../../../../../lib/db/prisma";
import { verifySignature } from "../../../../../lib/crypto/ecdsa";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { title, content, signature, publicKey } = await request.json();

    // Validasi input
    if (!title || !content || !signature || !publicKey) {
      return NextResponse.json(
        { error: "Judul, konten, tanda tangan, dan kunci publik diperlukan" },
        { status: 400 }
      );
    }

    // Verifikasi tanda tangan
    const isSignatureValid = verifySignature(content, signature, publicKey);

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Tanda tangan digital tidak valid" },
        { status: 400 }
      );
    }

    // Buat jurnal baru dengan tanda tangan yang sudah diverifikasi
    const journal = await prisma.journal.create({
      data: {
        title,
        content,
        signature,
        publicKey,
        verified: true,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        id: journal.id,
        title: journal.title,
        verified: journal.verified,
        createdAt: journal.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create journal error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat jurnal" },
      { status: 500 }
    );
  }
}
