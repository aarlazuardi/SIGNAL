/**
 * API Handler untuk mendapatkan dan memperbarui detail jurnal berdasarkan ID
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

export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Periksa apakah jurnal ada dan milik user
    const existingJournal = await prisma.journal.findUnique({
      where: { id },
    });

    if (!existingJournal) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verifikasi kepemilikan jurnal
    if (existingJournal.userId !== user.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengedit jurnal ini" },
        { status: 403 }
      );
    }

    // Verifikasi bahwa jurnal belum ditandatangani (verified)
    if (existingJournal.verified) {
      return NextResponse.json(
        { error: "Jurnal yang sudah ditandatangani tidak dapat diubah" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    // Validasi input
    if (!title && !content) {
      return NextResponse.json(
        { error: "Tidak ada data yang diubah" },
        { status: 400 }
      );
    }

    // Batasi ukuran konten jika terlalu besar
    if (content && content.length > 5000000) {
      // ~5MB limit
      return NextResponse.json(
        { error: "Ukuran konten terlalu besar. Maksimal 5MB." },
        { status: 400 }
      );
    }

    // Update data jurnal
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    // Update jurnal
    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        verified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Jurnal berhasil diperbarui",
      journal: updatedJournal,
    });
  } catch (error) {
    console.error("Update journal error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui jurnal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Periksa apakah jurnal ada dan milik user
    const existingJournal = await prisma.journal.findUnique({
      where: { id },
    });

    if (!existingJournal) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verifikasi kepemilikan jurnal
    if (existingJournal.userId !== user.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk menghapus jurnal ini" },
        { status: 403 }
      );
    }

    // Verifikasi bahwa jurnal belum ditandatangani (verified)
    // Komentar: Untuk sementara, kita biarkan penghapusan jurnal yang sudah ditandatangani
    // jika diperlukan keamanan ekstra, uncomment code di bawah
    /*
    if (existingJournal.verified) {
      return NextResponse.json(
        { error: "Jurnal yang sudah ditandatangani tidak dapat dihapus" },
        { status: 400 }
      );
    }
    */

    // Hapus jurnal
    await prisma.journal.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Jurnal berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete journal error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus jurnal" },
      { status: 500 }
    );
  }
}
