/**
 * API Handler untuk mengunggah dan mengimpor dokumen sebagai jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data dengan file
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");

    // Validasi input
    if (!file || !title) {
      return NextResponse.json(
        { error: "File dokumen dan judul diperlukan" },
        { status: 400 }
      );
    }

    // Validasi tipe file (PDF only)
    const fileType = file.type;
    const allowedTypes = ["application/pdf"];
    if (
      !allowedTypes.includes(fileType) &&
      !(file.name && file.name.toLowerCase().endsWith(".pdf"))
    ) {
      return NextResponse.json(
        {
          error: "Hanya file PDF yang didukung untuk upload jurnal.",
        },
        { status: 400 }
      );
    }

    // Batasi ukuran file (misal: 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB dalam bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 10MB." },
        { status: 400 }
      );
    }

    // Ekstrak konten dari file PDF saja
    let content = "";
    try {
      content = `[PDF Document] ${file.name}\n\nUkuran: ${(
        file.size / 1024
      ).toFixed(2)} KB\n\nKonten asli ada di file PDF.`;
    } catch (extractError) {
      return NextResponse.json(
        { error: "Terjadi kesalahan saat membaca konten file" },
        { status: 500 }
      );
    }

    // Baca file PDF sebagai ArrayBuffer
    let pdfBuffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } catch (err) {
      return NextResponse.json(
        { error: "Gagal membaca file PDF sebagai buffer" },
        { status: 500 }
      );
    }

    // Buat jurnal baru dari file yang diunggah
    const journal = await prisma.journal.create({
      data: {
        title: title,
        content: content,
        pdfFile: pdfBuffer,
        verified: false,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Dokumen berhasil diunggah dan dikonversi menjadi jurnal",
        id: journal.id,
        title: journal.title,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah dokumen" },
      { status: 500 }
    );
  }
}
