/**
 * API Handler untuk memperbarui kunci publik user
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import { validatePublicKey } from "@/lib/crypto/ecdsa";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { publicKey } = await request.json();

    // Validasi input
    if (!publicKey) {
      return NextResponse.json(
        { error: "Kunci publik diperlukan" },
        { status: 400 }
      );
    }

    // Validasi format kunci publik
    if (!validatePublicKey(publicKey)) {
      return NextResponse.json(
        { error: "Format kunci publik tidak valid" },
        { status: 400 }
      );
    }

    // Perbarui kunci publik user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { publicKey },
    });

    // Kembalikan data user yang diperbarui (tanpa password)
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      publicKey: updatedUser.publicKey,
    });
  } catch (error) {
    console.error("Update public key error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui kunci publik" },
      { status: 500 }
    );
  }
}
