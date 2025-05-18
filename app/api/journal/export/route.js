/**
 * API Handler untuk mengekspor jurnal sebagai PDF
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { journalId } = await request.json();

    if (!journalId) {
      return NextResponse.json(
        { error: "ID jurnal diperlukan" },
        { status: 400 }
      );
    }

    // Ambil data jurnal dari database
    const journal = await prisma.journal.findUnique({
      where: {
        id: journalId,
        userId: user.id, // Pastikan jurnal milik user yang terautentikasi
      },
      include: {
        user: {
          select: {
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

    // Buat dokumen PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBold
    );
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    const { width, height } = page.getSize();
    const margin = 50;
    const textSize = 12;
    const titleSize = 18;
    const headingSize = 14;

    // Tambahkan judul
    page.drawText("SIGNAL - JURNAL DIGITAL", {
      x: margin,
      y: height - margin,
      size: titleSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    // Tambahkan judul jurnal
    page.drawText(journal.title, {
      x: margin,
      y: height - margin - 30,
      size: headingSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    // Tambahkan metadata jurnal
    page.drawText(`Penulis: ${journal.user.name}`, {
      x: margin,
      y: height - margin - 60,
      size: textSize,
      font: timesRomanFont,
    });

    page.drawText(`Email: ${journal.user.email}`, {
      x: margin,
      y: height - margin - 80,
      size: textSize,
      font: timesRomanFont,
    });

    page.drawText(`Tanggal: ${journal.createdAt.toLocaleDateString()}`, {
      x: margin,
      y: height - margin - 100,
      size: textSize,
      font: timesRomanFont,
    });

    page.drawText(
      `Status Verifikasi: ${
        journal.verified ? "Terverifikasi" : "Belum Terverifikasi"
      }`,
      {
        x: margin,
        y: height - margin - 120,
        size: textSize,
        font: timesRomanFont,
        color: journal.verified ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
      }
    );

    // Tambahkan garis pemisah
    page.drawLine({
      start: { x: margin, y: height - margin - 140 },
      end: { x: width - margin, y: height - margin - 140 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Tambahkan label konten
    page.drawText("KONTEN JURNAL:", {
      x: margin,
      y: height - margin - 170,
      size: headingSize,
      font: timesRomanBoldFont,
    });

    // Tambahkan konten jurnal (dengan wrapping teks sederhana)
    const contentLines = wrapText(
      journal.content,
      timesRomanFont,
      textSize,
      width - 2 * margin
    );
    let yPosition = height - margin - 200;
    const lineHeight = textSize * 1.2;

    contentLines.forEach((line) => {
      // Tambahkan halaman baru jika konten tidak muat
      if (yPosition < margin + lineHeight) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin;
      }

      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: textSize,
        font: timesRomanFont,
      });

      yPosition -= lineHeight;
    });

    // Tambahkan informasi digital signature
    const signatureY = Math.max(margin + 140, yPosition - 40);

    page.drawLine({
      start: { x: margin, y: signatureY },
      end: { x: width - margin, y: signatureY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText("INFORMASI TANDA TANGAN DIGITAL", {
      x: margin,
      y: signatureY - 30,
      size: headingSize,
      font: timesRomanBoldFont,
    });

    page.drawText(`ID Dokumen: ${journal.id}`, {
      x: margin,
      y: signatureY - 55,
      size: textSize,
      font: timesRomanFont,
    });

    page.drawText("Tanda tangan digital terverifikasi dengan ECDSA P-256", {
      x: margin,
      y: signatureY - 75,
      size: textSize,
      font: timesRomanFont,
    });

    page.drawText(`Kunci publik: ${journal.publicKey.substring(0, 20)}...`, {
      x: margin,
      y: signatureY - 95,
      size: textSize,
      font: timesRomanFont,
    });

    // Footer
    page.drawText(
      "Dokumen ini dihasilkan oleh SIGNAL - Platform Jurnal Digital Terverifikasi",
      {
        x: margin,
        y: margin,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Generate dan kembalikan PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${journal.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export journal to PDF error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengekspor jurnal ke PDF" },
      { status: 500 }
    );
  }
}

/**
 * Fungsi helper untuk wrapping teks pada PDF
 * @param {string} text - Teks yang akan di-wrap
 * @param {PDFFont} font - Font yang digunakan
 * @param {number} fontSize - Ukuran font
 * @param {number} maxWidth - Lebar maksimum dalam points
 * @returns {string[]} - Array dari baris teks yang sudah di-wrap
 */
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);

    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
