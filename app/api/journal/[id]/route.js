/**
 * API Handler untuk mendapatkan detail jurnal berdasarkan ID
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Dapatkan user dari token (jika ada)
    const user = await getUserFromToken(request);

    // Ambil detail jurnal berdasarkan ID
    const journal = await prisma.journal.findUnique({
      where: { id },
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

    // Jika jurnal milik user lain dan user tidak login, batasi akses
    if (user?.id !== journal.userId) {
      // Kembalikan hanya info publik
      return NextResponse.json({
        id: journal.id,
        title: journal.title,
        verified: journal.verified,
        createdAt: journal.createdAt,
        author: journal.user.name,
      });
    }

    // Jika jurnal milik user, berikan akses penuh
    return NextResponse.json(journal);
  } catch (error) {
    console.error("Get journal detail error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil detail jurnal" },
      { status: 500 }
    );
  }
}
