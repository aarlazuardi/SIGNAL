/**
 * API Handler untuk mendapatkan informasi user saat ini
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";

export async function GET(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kembalikan data user (tanpa password)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      publicKey: user.publicKey,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data user" },
      { status: 500 }
    );
  }
}
