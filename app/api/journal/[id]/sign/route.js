/**
 * API Handler untuk menandatangani jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    console.log("Sign request for journal:", id);

    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      console.log("User not found from token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Ambil data jurnal
    const journal = await prisma.journal.findUnique({
      where: { id },
    });

    if (!journal) {
      console.log("Journal not found:", id);
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    } // Verifikasi kepemilikan jurnal
    if (journal.userId !== user.id) {
      console.log("Journal ownership mismatch:", {
        journalUserId: journal.userId,
        currentUserId: user.id,
      });
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk menandatangani jurnal ini" },
        { status: 403 }
      );
    }
    // Ambil data dari request
    const data = await request.json();
    console.log("Request data received:", {
      hasSignature: !!data.signature,
      hasPublicKey: !!data.publicKey,
      hasPassHash: !!data.passHash,
      hasMetadata: !!data.metadata,
      hasPerihal: !!data.perihal || (data.metadata && !!data.metadata.perihal),
    });

    const { signature, publicKey, passHash } = data;
    // Get perihal from either direct param or metadata
    const perihal = data.perihal || (data.metadata && data.metadata.perihal);

    // Verifikasi data yang diperlukan
    if (!signature || !publicKey) {
      return NextResponse.json(
        { error: "Signature dan publicKey harus disediakan" },
        { status: 400 }
      );
    }

    // Verifikasi passHash
    if (!passHash) {
      return NextResponse.json(
        { error: "PassHash harus disediakan untuk verifikasi" },
        { status: 400 }
      );
    }

    // Verifikasi perihal
    if (!perihal) {
      return NextResponse.json(
        { error: "Perihal wajib diisi" },
        { status: 400 }
      );
    } // Verifikasi apakah user memiliki passHash yang tersimpan
    if (!user.signature) {
      console.log("User has no signature stored in profile:", user.id);
      return NextResponse.json(
        {
          error:
            "Anda belum menyiapkan PassHash di profil. Silakan perbarui profil Anda terlebih dahulu.",
        },
        { status: 400 }
      );
    } // Verifikasi kecocokan passHash dengan yang tersimpan di profil
    console.log("PassHash comparison:", {
      stored: user.signature ? user.signature.substring(0, 3) + "..." : "null",
      provided: passHash ? passHash.substring(0, 3) + "..." : "null",
      storedLength: user.signature ? user.signature.length : 0,
      providedLength: passHash ? passHash.length : 0,
      isExactMatch: user.signature === passHash,
      userSignatureType: typeof user.signature,
      passHashType: typeof passHash,
    });

    if (user.signature !== passHash) {
      return NextResponse.json(
        { error: "PassHash tidak cocok dengan yang tersimpan di profil Anda" },
        { status: 400 }
      );
    }

    // Simpan signature ke tabel SignedDocument (bukan signedDocuments)
    const signedAt = new Date().toISOString();
    let hash;
    try {
      // Import createDocumentHash function to ensure consistent hashing
      const { createDocumentHash } = require("@/lib/crypto/ecdsa");
      hash = createDocumentHash(journal.content, true); // true untuk mendapatkan hex string
    } catch (e) {
      // Fallback jika require tidak tersedia (misal di edge runtime)
      hash = "";
      console.error("Error generating hash:", e);
    }

    console.log("Creating signed document record...");
    await prisma.signedDocument.create({
      data: {
        userId: user.id,
        documentId: journal.id,
        perihal,
        hash: "", // hash akan diperbarui setelah PDF dihasilkan
        signature,
        signedAt: new Date(signedAt),
      },
    }); // Update jurnal dengan signature dan tanda verified (dengan metadata)
    console.log("Updating journal with signature and metadata...");

    // Combine existing metadata with new signature metadata
    const existingMetadata = journal.metadata || {};

    const metadata = {
      ...existingMetadata, // Keep existing metadata (e.g. file info)
      perihal,
      signedAt: signedAt,
      signerName: user.name,
      signerEmail: user.email,
    };

    // If client sent additional metadata, merge it
    if (data.metadata) {
      Object.assign(metadata, data.metadata);
    }

    console.log("Metadata yang akan disimpan:", metadata);

    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: {
        signature,
        publicKey,
        verified: true,
        metadata: metadata,
      },
    });

    // === Generate the final PDF and hash it ===
    try {
      // Import PDF generation logic (reuse from /export)
      const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
      // Fetch user info for PDF
      const pdfUser = { name: user.name, email: user.email };
      // Generate PDF (copy logic from /export)
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      const margin = 50;
      const textSize = 12;
      const titleSize = 18;
      const headingSize = 14;
      page.drawText("SIGNAL - JURNAL DIGITAL", { x: margin, y: height - margin, size: titleSize, font: timesRomanBoldFont, color: rgb(0, 0, 0) });
      page.drawText(journal.title, { x: margin, y: height - margin - 30, size: headingSize, font: timesRomanBoldFont, color: rgb(0, 0, 0) });
      page.drawText(`Penulis: ${pdfUser.name}`, { x: margin, y: height - margin - 60, size: textSize, font: timesRomanFont });
      page.drawText(`Email: ${pdfUser.email}`, { x: margin, y: height - margin - 80, size: textSize, font: timesRomanFont });
      page.drawText(`Tanggal: ${journal.createdAt.toLocaleDateString()}`, { x: margin, y: height - margin - 100, size: textSize, font: timesRomanFont });
      page.drawText(`Status Verifikasi: ${journal.verified ? "Terverifikasi" : "Belum Terverifikasi"}`, { x: margin, y: height - margin - 120, size: textSize, font: timesRomanFont, color: journal.verified ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0) });
      page.drawLine({ start: { x: margin, y: height - margin - 140 }, end: { x: width - margin, y: height - margin - 140 }, thickness: 1, color: rgb(0, 0, 0) });
      page.drawText("KONTEN JURNAL:", { x: margin, y: height - margin - 170, size: headingSize, font: timesRomanBoldFont });
      // Simple text wrap
      const wrapText = (text, font, fontSize, maxWidth) => {
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
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      const contentLines = wrapText(journal.content, timesRomanFont, textSize, width - 2 * margin);
      let yPosition = height - margin - 200;
      const lineHeight = textSize * 1.2;
      contentLines.forEach((line) => {
        if (yPosition < margin + lineHeight) {
          page.addPage([595.28, 841.89]);
          yPosition = height - margin;
        }
        page.drawText(line, { x: margin, y: yPosition, size: textSize, font: timesRomanFont });
        yPosition -= lineHeight;
      });
      const signatureY = Math.max(margin + 140, yPosition - 40);
      page.drawLine({ start: { x: margin, y: signatureY }, end: { x: width - margin, y: signatureY }, thickness: 1, color: rgb(0, 0, 0) });
      page.drawText("INFORMASI TANDA TANGAN DIGITAL", { x: margin, y: signatureY - 30, size: headingSize, font: timesRomanBoldFont });
      page.drawText(`ID Dokumen: ${journal.id}`, { x: margin, y: signatureY - 55, size: textSize, font: timesRomanFont });
      page.drawText("Tanda tangan digital terverifikasi dengan ECDSA P-256", { x: margin, y: signatureY - 75, size: textSize, font: timesRomanFont });
      page.drawText(`Kunci publik: ${publicKey.substring(0, 20)}...`, { x: margin, y: signatureY - 95, size: textSize, font: timesRomanFont });
      page.drawText("Dokumen ini dihasilkan oleh SIGNAL - Platform Jurnal Digital Terverifikasi", { x: margin, y: margin, size: 8, font: timesRomanFont, color: rgb(0.5, 0.5, 0.5) });
      const pdfBytes = await pdfDoc.save();
      // Hash the PDF bytes
      const crypto = require("crypto");
      const pdfHash = crypto.createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");
      // Update signedDocument and journal metadata with the real PDF hash
      await prisma.signedDocument.updateMany({
        where: { documentId: journal.id, userId: user.id },
        data: { hash: pdfHash },
      });
      await prisma.journal.update({
        where: { id: journal.id },
        data: { metadata: { ...metadata, documentHash: pdfHash } },
      });
      console.log("Final PDF hash stored:", pdfHash);
    } catch (err) {
      console.error("Failed to generate or hash PDF after signing:", err);
    }

    return NextResponse.json({
      message: "Jurnal berhasil ditandatangani",
      id: updatedJournal.id,
      verified: updatedJournal.verified,
      perihal: perihal,
    });
  } catch (error) {
    console.error("Sign journal error:", error);
    // Provide more specific error message when possible
    const errorMessage =
      error.message || "Terjadi kesalahan saat menandatangani jurnal";
    console.error("Returning error to client:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
