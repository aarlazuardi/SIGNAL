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

    // Validasi tipe file (opsional)
    const fileType = file.type;
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/msword", // doc
      "text/markdown",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Gunakan txt, pdf, doc, docx, atau markdown",
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

    // Ekstrak konten dari file berdasarkan tipe
    let content = "";

    try {
      if (fileType === "text/plain" || fileType === "text/markdown") {
        // Untuk file teks
        const buffer = Buffer.from(await file.arrayBuffer());
        content = buffer.toString("utf8");
      } else if (fileType === "application/pdf") {
        // Untuk file PDF, kita hanya menyimpan metadata karena ekstraksi konten PDF
        // memerlukan library tambahan seperti pdf.js atau pdf-parse
        content = `[PDF Document] ${file.name}\n\nUkuran: ${(
          file.size / 1024
        ).toFixed(2)} KB\n\nKonten asli ada di file PDF.`;
      } else {
        // Untuk file Word, kita juga hanya menyimpan metadata
        content = `[Word Document] ${file.name}\n\nUkuran: ${(
          file.size / 1024
        ).toFixed(2)} KB\n\nKonten asli ada di file Word.`;
      }
    } catch (extractError) {
      console.error("Error extracting content:", extractError);
      return NextResponse.json(
        { error: "Terjadi kesalahan saat membaca konten file" },
        { status: 500 }
      );
    }

    // Buat jurnal baru dari file yang diunggah
    const journal = await prisma.journal.create({
      data: {
        title: title,
        content: content,
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
