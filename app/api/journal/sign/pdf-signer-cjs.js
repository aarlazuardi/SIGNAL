/**
 * Utilitas PDF untuk penandatanganan dokumen (CommonJS version)
 */
const { PDFDocument, PDFName, PDFString, PDFDict, PDFArray, StandardFonts, rgb } = require("pdf-lib");
const crypto = require('crypto');

// Constants for metadata and signature
const PDF_METADATA_KEY = "X-Signal-Metadata-JSON";
const PDF_CATALOG_KEY = "SIGNAL_Properties";
const PDF_CATALOG_METADATA_KEY = "SIGNAL_Metadata";
const METADATA_FIELDS = {
  SIGNATURE: "signal_signature",
  PUBLIC_KEY: "signal_publicKey",
  DOCUMENT_HASH: "signal_documentHash",
  SIGNING_DATE: "signal_signingDate",
  AUTHOR: "signal_author",
  PERIHAL: "signal_perihal",
  ID: "signal_id",
  VERSION: "signal_version",
};
const METADATA_VERSION = "1.2";

/**
 * Helper functions for document hashing
 */
function createHash(content, format = "hex") {
  try {
    const hash = crypto.createHash("sha256");

    if (content instanceof Uint8Array) {
      hash.update(Buffer.from(content));
    } else if (Buffer.isBuffer(content)) {
      hash.update(content);
    } else {
      hash.update(String(content));
    }

    const result = hash.digest(format);
    console.log(
      `[HASH] Created ${format} hash (first 10 chars): ${result.substring(0, 10)}...`
    );
    return result;
  } catch (error) {
    console.error("Error creating document hash:", error);
    throw new Error(`Gagal membuat hash dokumen: ${error.message}`);
  }
}

function createPdfHash(pdfBytes, format = "hex") {
  try {
    console.log(
      "[PDF_HASH] Creating hash for PDF document of size:",
      pdfBytes.length
    );
    if (!(pdfBytes instanceof Uint8Array) && !Buffer.isBuffer(pdfBytes)) {
      throw new Error("PDF bytes harus berupa Uint8Array atau Buffer");
    }

    const buffer = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
    const hash = crypto.createHash("sha256");
    hash.update(buffer);

    const result = hash.digest(format);
    console.log(
      `[PDF_HASH] Generated ${format} hash (first 15 chars): ${result.substring(0, 15)}...`
    );
    return result;
  } catch (error) {
    console.error("[PDF_HASH] Error creating PDF hash:", error);
    throw new Error(`Gagal membuat hash PDF: ${error.message}`);
  }
}

function getCanonicalPdfHash(pdfBytes, format = "hex") {
  return createHash(pdfBytes, format);
}

/**
 * Tandatangani dokumen PDF
 * @param {Uint8Array|string} pdfBytes - Bytes PDF atau konten text
 * @param {Object} signatureData - Data tanda tangan
 * @returns {Promise<Uint8Array>} - Bytes PDF yang sudah ditandatangani
 */
async function signPdf(pdfBytes, signatureData) {
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

    // Get signature data
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

    // Serialize metadata untuk penyimpanan
    const metadataString = JSON.stringify(signMetadata);
    
    // Set standard metadata
    pdfDoc.setTitle(perihal || "Dokumen Digital SIGNAL");
    pdfDoc.setAuthor(author || "SIGNAL User");
    pdfDoc.setProducer("SIGNAL Signature Module v" + METADATA_VERSION);
    pdfDoc.setCreator("Aplikasi SIGNAL");
    pdfDoc.setSubject(perihal || "Dokumen Ditandatangani");
    pdfDoc.setModificationDate(new Date());

    // === FIX 1: Embed metadata in Keywords (always as array) ===
    try {
      // FIXED: ALWAYS use array for setKeywords to avoid TypeError
      pdfDoc.setKeywords([metadataString]);
      console.log("[SIGN] Successfully set Keywords as array with metadata string");
    } catch (keywordsErr) {
      console.error("[SIGN] Keywords method failed:", keywordsErr.message);
      
      // Fallback: Try manual method if setKeywords fails
      try {
        // Create a keywords array with a single item
        const keywordsArray = PDFArray.withContext(pdfDoc.context);
        keywordsArray.push(PDFString.of(metadataString));

        // Ensure Info Dictionary exists
        if (!pdfDoc.context.trailerInfo) {
          pdfDoc.context.trailerInfo = {};
        }

        if (!pdfDoc.context.trailerInfo.Info) {
          pdfDoc.context.trailerInfo.Info = pdfDoc.context.obj({});
        }

        // Set to Info Dictionary with the correct key name
        const infoDict = pdfDoc.context.trailerInfo.Info;
        if (infoDict && typeof infoDict.set === "function") {
          const keywordsKey = PDFName.of("Keywords");
          infoDict.set(keywordsKey, keywordsArray);
          console.log("[SIGN] Set Keywords manually using PDFArray");
        } else if (infoDict) {
          // Alternative if set() doesn't exist
          infoDict.Keywords = keywordsArray;
          console.log("[SIGN] Set Keywords manually using direct property");
        }
      } catch (manualErr) {
        console.error("[SIGN] Manual Keywords setting failed:", manualErr.message);
      }
    }

    // === FIX 2: Add as custom property in PDF catalog ===
    try {
      // Create a dictionary object for SIGNAL Properties
      const pdfDict = pdfDoc.context.obj({
        [PDF_CATALOG_METADATA_KEY]: pdfDoc.context.obj(metadataString),
        Type: pdfDoc.context.obj("SIGNAL"),
        Version: pdfDoc.context.obj(METADATA_VERSION),
      });

      // Set in catalog
      pdfDoc.catalog.set(pdfDoc.context.obj(PDF_CATALOG_KEY), pdfDict);
      console.log(`[SIGN] Added metadata to catalog as ${PDF_CATALOG_KEY}`);
    } catch (e) {
      console.error("[SIGN] Error setting catalog properties:", e.message);
    }

    // Save the signed document
    const signedPdfBytes = await pdfDoc.save();
    console.log("[SIGN] PDF successfully signed and saved");
    
    return signedPdfBytes;
  } catch (error) {
    console.error("[SIGN] Error signing PDF document:", error);
    throw new Error(`Gagal menandatangani dokumen: ${error.message}`);
  }
}

/**
 * Membagi teks menjadi baris-baris yang sesuai dengan lebar halaman
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

// Export functions using CommonJS format
module.exports = {
  signPdf,
  createPdfHash,
};
