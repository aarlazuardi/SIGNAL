/**
 * API Handler untuk mendapatkan daftar jurnal milik user
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function GET(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil daftar jurnal milik user
    const journals = await prisma.journal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error("Get journals error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil daftar jurnal" },
      { status: 500 }
    );
  }
}
