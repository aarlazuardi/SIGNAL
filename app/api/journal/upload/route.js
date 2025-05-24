/**
 * API Handler untuk mengunggah dan mengimpor dokumen sebagai jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request) {
  try {
    // Kurangi logging di production
    if (process.env.NODE_ENV !== "production") {
      console.log("[Upload API] Received file upload request");
    }

    // Verifikasi auth lebih cepat
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized - Sesi login tidak valid atau telah berakhir",
        },
        { status: 401 }
      );
    }

    // Logging minimal di production
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Upload API] Authenticated user: ${user.name} (${user.email})`
      );
    }

    // Parse form data dengan file
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      return NextResponse.json(
        {
          error:
            "Format request tidak valid. Pastikan mengirim FormData dengan file.",
        },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const title = formData.get("title");
    const authSource = formData.get("authSource"); // Info tambahan dari klien

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Upload API] File received: ${file ? file.name : "No file"}, size: ${
          file ? file.size : 0
        } bytes, title: ${title || "No title"}, auth source: ${
          authSource || "unknown"
        }`
      );
    }

    // Validasi input cepat
    if (!file || !title) {
      return NextResponse.json(
        { error: "File dokumen dan judul diperlukan" },
        { status: 400 }
      );
    }

    // Validasi tipe file (PDF only)
    const fileType = file.type;
    const allowedTypes = ["application/pdf"];
    const isPdf =
      allowedTypes.includes(fileType) ||
      (file.name && file.name.toLowerCase().endsWith(".pdf"));

    if (!isPdf) {
      return NextResponse.json(
        {
          error: "Hanya file PDF yang didukung untuk upload jurnal.",
        },
        { status: 400 }
      );
    }

    // Batasi ukuran file (maksimal 5MB untuk performa lebih baik)
    const maxSize = 5 * 1024 * 1024; // 5MB dalam bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 5MB." },
        { status: 400 }
      );
    }

    // Ekstrak metadata file secara minimal
    const content = `[PDF Document] ${file.name}\n\nUkuran: ${(
      file.size / 1024
    ).toFixed(2)} KB\nDiunggah oleh: ${user.name}\nEmail: ${
      user.email
    }\nWaktu: ${new Date().toISOString()}`;

    // Baca file PDF sebagai ArrayBuffer yang lebih efisien
    let pdfBuffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } catch (err) {
      console.error("Failed to read PDF buffer:", err);
      return NextResponse.json(
        { error: "Gagal membaca file PDF sebagai buffer" },
        { status: 500 }
      );
    }

    // Buat jurnal baru dari file yang diunggah dengan transaksi untuk keandalannya
    const journal = await prisma
      .$transaction(async (tx) => {
        // Cek duplikasi judul untuk user yang sama
        const existingJournal = await tx.journal.findFirst({
          where: {
            title: title,
            userId: user.id,
          },
        });

        if (existingJournal) {
          throw new Error("Journal_Duplicate");
        }

        return await tx.journal.create({
          data: {
            title: title,
            content: content,
            pdfFile: pdfBuffer,
            verified: false,
            userId: user.id,
            metadata: {
              fileSize: file.size,
              fileName: file.name,
              uploadedAt: new Date().toISOString(),
              authSource: authSource || "unknown",
            },
          },
        });
      })
      .catch((error) => {
        if (error.message === "Journal_Duplicate") {
          throw new Error(
            "Dokumen dengan judul yang sama sudah ada. Silakan gunakan judul yang berbeda."
          );
        }
        throw error;
      });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Upload API] Journal created successfully with ID: ${journal.id}`
      );
    }

    return NextResponse.json(
      {
        message: "Dokumen berhasil diunggah dan dikonversi menjadi jurnal",
        id: journal.id,
        title: journal.title,
        createdAt: journal.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload document error:", error);

    // Memberikan pesan error yang lebih spesifik
    let errorMessage = "Terjadi kesalahan saat mengunggah dokumen";
    let statusCode = 500;

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      errorMessage = "Token autentikasi tidak valid atau telah kedaluwarsa";
      statusCode = 401;
    } else if (error.code === "P2002") {
      errorMessage = "Dokumen dengan judul tersebut sudah ada";
      statusCode = 409;
    } else if (error.message && error.message.includes("Unauthorized")) {
      errorMessage = "Sesi login Anda telah berakhir, silakan login kembali";
      statusCode = 401;
    } else if (
      error.message &&
      error.message.includes("Dokumen dengan judul yang sama")
    ) {
      errorMessage = error.message;
      statusCode = 409;
    } else if (error.message && error.message.includes("too large")) {
      errorMessage = "Ukuran file terlalu besar. Maksimal 5MB.";
      statusCode = 413;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error(`[Upload API] Error: ${errorMessage} (${statusCode})`);
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
