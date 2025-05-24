/**
 * Utilitas PDF untuk penandatanganan dokumen
 * Implementasi flow penandatanganan sesuai diagram
 */
import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFDict,
  PDFArray,
  StandardFonts,
  rgb,
} from "pdf-lib";
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
    pdfDoc.setProducer(
      "SIGNAL ECDSA P-256 Digital Signature v" + METADATA_VERSION
    );

    // Serialize metadata untuk penyimpanan
    const metadataString = JSON.stringify(signMetadata);
    console.log(
      "[SIGN] Preparing metadata for embedding:",
      metadataString.substring(0, 50) + "..."
    );

    // ================================================================
    // Metode 1: Embed ke Info Dictionary dengan implementasi yang aman
    // ================================================================
    try {
      console.log("[SIGN] Preparing to set metadata in PDF Info Dictionary...");

      // Langkah 1: Atur field metadata standar untuk memastikan
      // pdf-lib menginisialisasi Info Dictionary dengan benar
      pdfDoc.setTitle(perihal || "Dokumen Digital SIGNAL");
      pdfDoc.setAuthor(author || "SIGNAL User");
      pdfDoc.setProducer("SIGNAL Signature Module v" + METADATA_VERSION);
      pdfDoc.setCreator("Aplikasi SIGNAL");
      pdfDoc.setSubject(perihal || "Dokumen Ditandatangani");
      pdfDoc.setModificationDate(new Date()); // PENTING: selalu update tanggal modifikasi

      // Langkah 2: Coba dapatkan Info Dictionary yang sudah ada
      let infoDict = null;
      try {
        // Coba akses context.trailerInfo.Info (cara pdf-lib internal)
        if (pdfDoc.context && pdfDoc.context.trailerInfo) {
          infoDict = pdfDoc.context.trailerInfo.Info;
          if (infoDict) {
            console.log("[SIGN] Found existing Info Dictionary in PDF");
          }
        }
      } catch (err) {
        console.log("[SIGN] Error accessing Info Dictionary:", err.message);
      }

      // Jika Info Dict masih kosong, coba buat
      if (!infoDict) {
        try {
          console.log("[SIGN] Creating new Info Dictionary");
          // Buat Info Dictionary baru
          const newInfoObj = {
            Title: pdfDoc.getTitle() || "Dokumen SIGNAL",
            Author: pdfDoc.getAuthor() || "SIGNAL User",
            Subject: pdfDoc.getSubject() || "Dokumen Ditandatangani",
            Creator: pdfDoc.getCreator() || "Aplikasi SIGNAL",
            Producer: pdfDoc.getProducer() || "SIGNAL PDF Module",
            ModDate: new Date().toISOString(),
          };

          // Tambahkan metadata SIGNAL
          newInfoObj[PDF_METADATA_KEY] = metadataString;

          // Buat objek Info Dictionary pdf-lib
          const pdfInfoDict = pdfDoc.context.obj(newInfoObj);

          // Pastikan trailerInfo ada
          if (!pdfDoc.context.trailerInfo) {
            pdfDoc.context.trailerInfo = {};
          }

          // Set Info Dictionary di PDF
          pdfDoc.context.trailerInfo.Info = pdfInfoDict;

          // Verifikasi
          if (pdfDoc.context.trailerInfo.Info) {
            infoDict = pdfDoc.context.trailerInfo.Info;
            console.log("[SIGN] Successfully created new Info Dictionary");
          }
        } catch (createErr) {
          console.error(
            "[SIGN] Failed to create Info Dictionary:",
            createErr.message
          );
        }
      }

      // Langkah 3: Tambahkan metadata ke Info Dictionary yang ada
      if (infoDict) {
        try {
          // Tambahkan metadata dengan berbagai metode yang mungkin
          let metadataAdded = false;

          // Metode 1: Coba dengan set() jika tersedia
          if (typeof infoDict.set === "function") {
            try {
              // Try dengan PDFName.of()
              const key = PDFName.of(PDF_METADATA_KEY);
              const value = PDFString.of(metadataString);
              infoDict.set(key, value);
              console.log(
                "[SIGN] Added metadata using infoDict.set with PDFName/PDFString"
              );
              metadataAdded = true;
            } catch (err1) {
              console.log(
                "[SIGN] Error using infoDict.set with PDFName:",
                err1.message
              );

              // Coba dengan string biasa
              try {
                infoDict.set(PDF_METADATA_KEY, metadataString);
                console.log(
                  "[SIGN] Added metadata using infoDict.set with direct strings"
                );
                metadataAdded = true;
              } catch (err2) {
                console.log(
                  "[SIGN] Error using infoDict.set with direct string:",
                  err2.message
                );
              }
            }
          }

          // Metode 2: Coba dengan properti langsung jika set() gagal
          if (!metadataAdded) {
            try {
              infoDict[PDF_METADATA_KEY] = metadataString;
              console.log(
                "[SIGN] Added metadata using direct property assignment"
              );
              metadataAdded = true;
            } catch (err3) {
              console.log(
                "[SIGN] Error using direct property assignment:",
                err3.message
              );
            }
          }

          // Metode 3: Coba dengan objek internal pdf-lib jika ada
          if (!metadataAdded && infoDict.dict) {
            try {
              infoDict.dict[PDF_METADATA_KEY] =
                pdfDoc.context.obj(metadataString);
              console.log(
                "[SIGN] Added metadata using infoDict.dict internal object"
              );
              metadataAdded = true;
            } catch (err4) {
              console.log("[SIGN] Error using infoDict.dict:", err4.message);
            }
          }

          // Metode 4: Buat kembali Info Dictionary dengan metadata kita jika semua gagal
          if (!metadataAdded) {
            try {
              // Salin semua properti saat ini (jika ada)
              const currentProps = {};

              // Dari infoDict.dict
              if (infoDict.dict) {
                Object.keys(infoDict.dict).forEach((key) => {
                  if (typeof key === "string") {
                    currentProps[key] = infoDict.dict[key];
                  }
                });
              }
              // Atau dari infoDict langsung
              else {
                Object.keys(infoDict).forEach((key) => {
                  if (
                    typeof key === "string" &&
                    key !== "context" &&
                    key !== "set" &&
                    key !== "get" &&
                    key !== "has"
                  ) {
                    currentProps[key] = infoDict[key];
                  }
                });
              }

              // Tambahkan metadata kita dan buat ulang
              currentProps[PDF_METADATA_KEY] = metadataString;

              // Buat Info Dictionary baru
              pdfDoc.context.trailerInfo.Info =
                pdfDoc.context.obj(currentProps);
              console.log("[SIGN] Recreated Info Dictionary with our metadata");
              metadataAdded = true;
            } catch (err5) {
              console.error(
                "[SIGN] Failed to recreate Info Dictionary:",
                err5.message
              );
            }
          }

          // Final fallback - langsung ke trailer Info
          if (!metadataAdded) {
            console.error(
              "[SIGN] All Info Dictionary methods failed. Using emergency method"
            );
            // Sebagai upaya terakhir, buat Info baru dengan pendekatan paling basic
            try {
              const basicObj = { [PDF_METADATA_KEY]: metadataString };
              pdfDoc.context.trailerInfo.Info = basicObj;
              console.log("[SIGN] Used emergency method for Info Dictionary");
            } catch (err6) {
              console.error(
                "[SIGN] Even emergency method failed:",
                err6.message
              );
            }
          }
        } catch (addErr) {
          console.error(
            "[SIGN] Critical error adding metadata to Info Dictionary:",
            addErr.message
          );
        }
      } else {
        console.error("[SIGN] Could not get or create Info Dictionary");
      }
    } catch (infoErr) {
      console.error(
        "[SIGN] Critical error in Info Dictionary section:",
        infoErr.message
      );
    }

    // =========================================================
    // Metode 2: Keywords (diperbaiki untuk selalu menggunakan array)
    // =========================================================
    try {
      console.log(
        "[SIGN] Setting metadata in PDF Keywords (most compatible method)"
      );

      // FIXED: SELALU gunakan array untuk setKeywords untuk menghindari TypeError
      try {
        // Gunakan metode setKeywords dengan array seperti yang dipersyaratkan oleh pdf-lib
        pdfDoc.setKeywords([metadataString]);
        console.log(
          "[SIGN] Successfully set Keywords as array with metadata string"
        );

        // Verifikasi keywords telah diset
        const verifyKeywords = pdfDoc.getKeywords();

        if (verifyKeywords) {
          console.log(
            "[SIGN] Keywords verification passed:",
            Array.isArray(verifyKeywords)
              ? `Array with ${verifyKeywords.length} elements`
              : typeof verifyKeywords === "string"
              ? verifyKeywords.substring(0, 50) + "..."
              : "Non-standard value type: " + typeof verifyKeywords
          );
        } else {
          console.log(
            "[SIGN] Warning: Keywords verification returned empty result"
          );
        }
      } catch (keywordsErr) {
        console.error(
          "[SIGN] Primary Keywords method failed:",
          keywordsErr.message
        );

        // Fallback: Mencoba metode manual jika setKeywords gagal
        try {
          // Buat array keywords dengan satu item menggunakan PDFArray
          const keywordsArray = PDFArray.withContext(pdfDoc.context);
          keywordsArray.push(PDFString.of(metadataString));

          // Pastikan Info Dictionary ada
          if (!pdfDoc.context.trailerInfo) {
            pdfDoc.context.trailerInfo = {};
          }

          if (!pdfDoc.context.trailerInfo.Info) {
            pdfDoc.context.trailerInfo.Info = pdfDoc.context.obj({});
          }

          // Set ke Info Dictionary dengan nama kunci yang benar
          const infoDict = pdfDoc.context.trailerInfo.Info;
          if (infoDict && typeof infoDict.set === "function") {
            const keywordsKey = PDFName.of("Keywords");
            infoDict.set(keywordsKey, keywordsArray);
            console.log("[SIGN] Set Keywords manually using PDFArray");
          } else if (infoDict) {
            // Alternatif jika set() tidak ada
            infoDict.Keywords = keywordsArray;
            console.log("[SIGN] Set Keywords manually using direct property");
          }
        } catch (manualErr) {
          console.error(
            "[SIGN] Manual Keywords setting failed:",
            manualErr.message
          );
        }
      }
    } catch (e) {
      console.error("[SIGN] Error in Keywords setting process:", e.message);
    }

    // ===================================================================
    // Metode 3: Tambahkan juga sebagai custom property di katalog PDF
    // ===================================================================
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
      console.error("[SIGN] Error setting catalog properties:", e.message);
    }

    // Tambahkan halaman verifikasi jika diminta
    if (signatureData.addVerificationPage) {
      await addVerificationPage(pdfDoc, signMetadata);
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
