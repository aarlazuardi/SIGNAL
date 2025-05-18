/**
 * API Handler untuk verifikasi tanda tangan digital
 */
import { NextResponse } from "next/server";
import { verifySignature } from "../../../../../lib/crypto/ecdsa";
import prisma from "../../../../../lib/db/prisma";

export async function POST(request) {
  try {
    // Parse request body
    const { content, signature, publicKey } = await request.json();

    // Validasi input
    if (!content || !signature || !publicKey) {
      return NextResponse.json(
        { error: "Konten, tanda tangan, dan kunci publik diperlukan" },
        { status: 400 }
      );
    }

    // Verifikasi tanda tangan
    const isSignatureValid = verifySignature(content, signature, publicKey);

    // Cari informasi pemilik kunci publik (jika ada)
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
      valid: isSignatureValid,
      signer: signerInfo,
    });
  } catch (error) {
    console.error("Verify signature error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi tanda tangan" },
      { status: 500 }
    );
  }
}
