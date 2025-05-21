/**
 * API Handler untuk mendapatkan daftar jurnal milik user
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function GET(request) {
  try {
    console.log("API: /api/journal/mine called");

    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      console.error("API: Unauthorized user tried to access journals");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`API: Fetching journals for user ID: ${user.id}`);

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

    console.log(`API: Found ${journals.length} journals for user`);

    // Validasi journals
    const validatedJournals = journals.map((journal) => ({
      id: journal.id || "",
      title: journal.title || "Untitled",
      verified: !!journal.verified,
      createdAt: journal.createdAt ? journal.createdAt.toISOString() : null,
      updatedAt: journal.updatedAt ? journal.updatedAt.toISOString() : null,
    }));

    return NextResponse.json(validatedJournals);
  } catch (error) {
    console.error("API: Error in GET /api/journal/mine:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil daftar jurnal" },
      { status: 500 }
    );
  }
}
