/**
 * Utilitas PDF untuk penandatanganan dokumen
 * Implementasi flow penandatanganan sesuai diagram
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  createHash,
  createPdfHash,
  getCanonicalPdfHash,
} from "@/lib/crypto/document-hash";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  PDF_CATALOG_METADATA_KEY,
  METADATA_FIELDS,
  METADATA_VERSION,
} from "@/lib/signature-config";

/**
 * Tandatangani dokumen PDF
 * @param {Uint8Array|string} pdfBytes - Bytes PDF atau konten text
 * @param {Object} signatureData - Data tanda tangan
 * @returns {Promise<Uint8Array>} - Bytes PDF yang sudah ditandatangani
 */
export async function signPdf(pdfBytes, signatureData) {
  try {
    // 1. Proses dokumen
    const pdfDoc =
      typeof pdfBytes === "string"
        ? await PDFDocument.create()
        : await PDFDocument.load(pdfBytes);

    // Jika input berupa string, buat PDF baru dengan konten tersebut
    if (typeof pdfBytes === "string") {
      // Tambahkan halaman baru
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Bagi teks menjadi baris-baris
      const textLines = wrapText(pdfBytes, font, fontSize, width - 100);

      // Tulis konten ke PDF
      let y = height - 50;
      for (const line of textLines) {
        page.drawText(line, {
          x: 50,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSize * 1.2; // Spasi antar baris
      }
    }

    // === HASH PDF ASLI (SEBELUM MODIFIKASI) ===
    // Gunakan hash ini untuk metadata dan verifikasi
    const originalPdfHash = getCanonicalPdfHash(pdfBytes, "hex");
    console.log("[SIGN] Canonical/original PDF hash:", originalPdfHash);

    // 5. Tandatangani dengan ECDSA P-256
    // Signature sudah dibuat di client-side

    // 6. Dapatkan signature dan public key
    const {
      signature,
      publicKey,
      author,
      perihal,
      passHash,
      timestamp,
      journalId,
    } = signatureData;

    if (!signature || !publicKey) {
      throw new Error("Tanda tangan atau kunci publik tidak ditemukan.");
    }
    // 7. Simpan metadata tanda tangan di PDF
    const signMetadata = {
      [METADATA_FIELDS.SIGNATURE]: signature,
      [METADATA_FIELDS.PUBLIC_KEY]: publicKey,
      [METADATA_FIELDS.DOCUMENT_HASH]: originalPdfHash, // PENTING: hash dari file asli
      [METADATA_FIELDS.SIGNING_DATE]: timestamp || new Date().toISOString(),
      [METADATA_FIELDS.AUTHOR]: author || "Unknown",
      [METADATA_FIELDS.PERIHAL]: perihal || "Digital Signature",
      [METADATA_FIELDS.ID]: journalId || null,
      [METADATA_FIELDS.VERSION]: METADATA_VERSION, // Versi format metadata untuk kompatibilitas
    };

    console.log("[SIGN] Setting document metadata with signature info:", {
      signature: signature ? signature.substring(0, 10) + "..." : null,
      publicKey: publicKey ? publicKey.substring(0, 10) + "..." : null,
      documentHash: originalPdfHash
        ? originalPdfHash.substring(0, 10) + "..."
        : null,
    });

    // Tambahkan metadata standar
    pdfDoc.setTitle(`${perihal || "Dokumen Ditandatangani"}`);
    pdfDoc.setAuthor(author || "SIGNAL User");
    pdfDoc.setSubject(
      `Ditandatangani pada: ${new Date().toLocaleString("id-ID")}`
    );
    pdfDoc.setCreator(
      "SIGNAL - Secure Integrated Global Network for Academic Literature"
    );
    pdfDoc.setProducer("SIGNAL ECDSA P-256 Digital Signature");

    // Serialize metadata untuk penyimpanan
    const metadataString = JSON.stringify(signMetadata);
    console.log(
      "[SIGN] Preparing metadata for embedding:",
      metadataString.substring(0, 50) + "..."
    ); // Metode 1: Simpan di custom property di Info Dictionary (metode utama baru)
    try {
      console.log("[SIGN] Setting metadata in PDF Info Dictionary");

      // Dapatkan Info Dictionary dari PDF
      const infoDict = pdfDoc.context.obj({
        Title: pdfDoc.getTitle() || "",
        Author: pdfDoc.getAuthor() || "",
        Subject: pdfDoc.getSubject() || "",
        Creator: pdfDoc.getCreator() || "",
        Producer: pdfDoc.getProducer() || "",
        Keywords: metadataString, // Simpan juga di Keywords standar
        [PDF_METADATA_KEY]: pdfDoc.context.obj(metadataString), // Tambahkan metadata ke Info Dictionary sebagai objek string
      });

      // Atur Info Dictionary dokumen
      pdfDoc.context.trailerInfo.Info = infoDict;

      // Verifikasi Info Dictionary telah diset
      if (pdfDoc.context.trailerInfo.Info) {
        console.log(
          `[SIGN] Successfully added metadata to Info Dictionary using key "${PDF_METADATA_KEY}"`
        );
      } else {
        console.log("[SIGN] Warning: Info Dictionary not set properly");
      }
    } catch (e) {
      console.error("[SIGN] Error setting Info Dictionary:", e);
    } // Metode 2: Gunakan juga Keywords sebagai fallback (paling kompatibel)
    try {
      // Pastikan metadata disimpan dalam keywords
      console.log(
        "[SIGN] Setting metadata in PDF Keywords (most compatible method)"
      );
      pdfDoc.setKeywords(metadataString);

      // Verifikasi keywords telah diset
      const verifyKeywords = pdfDoc.getKeywords();
      if (verifyKeywords) {
        console.log(
          "[SIGN] Successfully added metadata to Keywords:",
          typeof verifyKeywords === "string"
            ? verifyKeywords.substring(0, 50) + "..."
            : "Non-string value"
        );
      } else {
        console.log("[SIGN] Warning: Keywords not set properly");
        // Coba lagi dengan metode alternatif
        try {
          // Beberapa PDF lib menerima array string
          pdfDoc.setKeywords([metadataString]);
          console.log("[SIGN] Tried fallback method for Keywords (array)");
        } catch (innerErr) {
          console.error(
            "[SIGN] Fallback Keywords method also failed:",
            innerErr
          );
        }
      }
    } catch (e) {
      console.error("[SIGN] Error setting Keywords:", e);
    } // Metode 3: Tambahkan juga sebagai custom property di katalog PDF
    try {
      console.log("[SIGN] Setting metadata in PDF Catalog");

      // Buat dictionary objek untuk SIGNAL Properties
      const pdfDict = pdfDoc.context.obj({
        [PDF_CATALOG_METADATA_KEY]: pdfDoc.context.obj(metadataString), // Simpan sebagai string
        Type: pdfDoc.context.obj("SIGNAL"), // Tipe objek untuk pencarian lebih mudah
        Version: pdfDoc.context.obj(METADATA_VERSION), // Versi format metadata
      });

      // Set di catalog
      pdfDoc.catalog.set(pdfDoc.context.obj(PDF_CATALOG_KEY), pdfDict);
      console.log(`[SIGN] Added metadata to catalog as ${PDF_CATALOG_KEY}`);

      // Tambah metode 4: Simpan metadata di Document XMP metadata jika memungkinkan
      try {
        const metadataXMP = `
        <x:xmpmeta xmlns:x="adobe:ns:meta/">
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <rdf:Description rdf:about="" xmlns:signalns="http://signal.example.org/ns/">
              <signalns:metadata>${encodeURIComponent(
                metadataString
              )}</signalns:metadata>
            </rdf:Description>
          </rdf:RDF>
        </x:xmpmeta>
        `;

        if (pdfDoc.catalog.has("Metadata")) {
          console.log(
            "[SIGN] Document already has XMP metadata, not modifying"
          );
        } else {
          console.log("[SIGN] Adding XMP metadata if possible");
          // Tidak mengubah XMP yang sudah ada karena bisa kompleks
        }
      } catch (xmpErr) {
        console.log("[SIGN] XMP metadata addition skipped:", xmpErr.message);
      }
    } catch (e) {
      console.error("[SIGN] Error setting catalog properties:", e);
    }

    // Tambahkan halaman verifikasi jika diminta
    if (signatureData.addVerificationPage) {
      addVerificationPage(pdfDoc, signMetadata);
    }
    // 8. Response: Dokumen ditandatangani
    const signedPdfBytes = await pdfDoc.save();

    // Hash dokumen yang telah ditandatangani (boleh untuk keperluan audit, tapi BUKAN untuk verifikasi utama)
    const finalDocumentHash = createPdfHash(signedPdfBytes, "hex");
    console.log("[SIGN] Final signed PDF hash generated:", finalDocumentHash);

    // Debug: Reload PDF and print keywords to verify metadata
    try {
      const debugDoc = await PDFDocument.load(signedPdfBytes);
      const debugKeywords = debugDoc.getKeywords();
      console.log("[SIGN][DEBUG] Keywords in signed PDF:", debugKeywords);
    } catch (e) {
      console.log(
        "[SIGN][DEBUG] Could not reload PDF for keyword check:",
        e.message
      );
    }
    return signedPdfBytes;
  } catch (error) {
    console.error("[SIGN] Error signing PDF document:", error);
    throw new Error(`Gagal menandatangani dokumen: ${error.message}`);
  }
}

/**
 * Hitung dan simpan hash dari PDF final
 * @param {Uint8Array} pdfBytes - Bytes dari PDF final yang telah ditandatangani
 * @returns {string} - Hash dari PDF final
 */
export function calculateFinalPdfHash(pdfBytes) {
  return createPdfHash(pdfBytes, "hex");
}

/**
 * Tambahkan halaman verifikasi ke PDF
 * @param {PDFDocument} pdfDoc - Dokumen PDF
 * @param {Object} metadata - Metadata tanda tangan
 */
async function addVerificationPage(pdfDoc, metadata) {
  try {
    // Tambahkan halaman verifikasi
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Judul
    page.drawText("INFORMASI VERIFIKASI TANDA TANGAN DIGITAL", {
      x: 72,
      y: height - 72,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Garis pembatas
    page.drawLine({
      start: { x: 72, y: height - 90 },
      end: { x: width - 72, y: height - 90 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Informasi tanda tangan
    const lineHeight = 25;
    let y = height - 130;

    page.drawText(
      "Dokumen ini telah ditandatangani secara digital menggunakan algoritma ECDSA P-256.",
      {
        x: 72,
        y: y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }
    );
    y -= lineHeight;

    page.drawText(`Ditandatangani oleh: ${metadata.signal_author}`, {
      x: 72,
      y: y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;

    page.drawText(
      `Tanggal tanda tangan: ${new Date(
        metadata.signal_signingDate
      ).toLocaleString("id-ID")}`,
      {
        x: 72,
        y: y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }
    );
    y -= lineHeight;

    page.drawText(`Perihal: ${metadata.signal_perihal}`, {
      x: 72,
      y: y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;

    page.drawText(
      `Hash Dokumen: ${metadata.signal_documentHash.substring(0, 32)}...`,
      {
        x: 72,
        y: y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }
    );
    y -= lineHeight * 2;

    // Informasi verifikasi
    page.drawText("VERIFIKASI TANDA TANGAN", {
      x: 72,
      y: y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;

    page.drawText(
      "Untuk memverifikasi tanda tangan digital pada dokumen ini:",
      {
        x: 72,
        y: y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }
    );
    y -= lineHeight;

    const instructions = [
      "1. Kunjungi https://signal-app.vercel.app/validasi",
      "2. Upload dokumen ini",
      "3. Klik tombol 'Verifikasi Tanda Tangan'",
      "4. Sistem akan otomatis memverifikasi keaslian dokumen ini",
    ];

    for (const instruction of instructions) {
      page.drawText(instruction, {
        x: 82,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    // Footer
    page.drawText(
      "Dokumen ini memiliki tanda tangan digital yang aman dan terverifikasi",
      {
        x: width / 2 - 180,
        y: 40,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }
    );
  } catch (error) {
    console.error("[SIGN] Error adding verification page:", error);
    // Continue without verification page if error
  }
}

/**
 * Membagi teks menjadi baris-baris yang sesuai dengan lebar halaman
 * @param {string} text - Teks yang akan dibagi
 * @param {PDFFont} font - Font untuk teks
 * @param {number} fontSize - Ukuran font
 * @param {number} maxWidth - Lebar maksimum baris
 * @returns {string[]} - Array baris-baris teks
 */
function wrapText(text, font, fontSize, maxWidth) {
  const lines = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(" ");
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);

      if (width < maxWidth) {
        currentLine += ` ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}
