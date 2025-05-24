/**
 * API Handler untuk mengunggah dan mengimpor dokumen sebagai jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request) {
  try {
    console.log("[Upload API] Received file upload request");
    
    // Log headers untuk debugging
    const headers = Object.fromEntries([...request.headers.entries()]);
    const authHeader = headers.authorization || "Not provided";
    console.log(`[Upload API] Auth header: ${authHeader.substring(0, 20)}...`);
    
    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      console.error("[Upload API] Authentication failed - No valid user found from token");
      return NextResponse.json({ 
        error: "Unauthorized - Sesi login tidak valid atau telah berakhir" 
      }, { status: 401 });
    }
    
    console.log(`[Upload API] Authenticated user: ${user.name} (${user.email})`);

    // Parse form data dengan file
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    
    console.log(`[Upload API] File received: ${file ? file.name : 'No file'}, size: ${file ? file.size : 0} bytes, title: ${title || 'No title'}`);

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
      // Untuk file PDF, kita hanya menyimpan metadata karena ekstraksi konten PDF memerlukan library tambahan
      content = `[PDF Document] ${file.name}\n\nUkuran: ${(
        file.size / 1024
      ).toFixed(2)} KB\n\nKonten asli ada di file PDF.`;
    } catch (extractError) {
      console.error("Error extracting content:", extractError);
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
    });    console.log(`[Upload API] Journal created successfully with ID: ${journal.id}`);
    
    return NextResponse.json(
      {
        message: "Dokumen berhasil diunggah dan dikonversi menjadi jurnal",
        id: journal.id,
        title: journal.title,
        createdAt: journal.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload document error:", error);
    
    // Memberikan pesan error yang lebih spesifik
    let errorMessage = "Terjadi kesalahan saat mengunggah dokumen";
    let statusCode = 500;
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      errorMessage = "Token autentikasi tidak valid atau telah kedaluwarsa";
      statusCode = 401;
    } else if (error.code === 'P2002') { 
      errorMessage = "Dokumen dengan judul tersebut sudah ada";
      statusCode = 409;
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = "Sesi login Anda telah berakhir, silakan login kembali";
      statusCode = 401;
    }
    
    console.error(`[Upload API] Error: ${errorMessage} (${statusCode})`);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
