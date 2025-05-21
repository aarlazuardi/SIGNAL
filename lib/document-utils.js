import { PDFDocument } from "pdf-lib";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  PDF_CATALOG_METADATA_KEY,
  METADATA_FIELDS,
} from "@/lib/signature-config";

/**
 * Utilitas untuk ekstraksi metadata dokumen
 */

/**
 * Ekstrak metadata dari file PDF
 *
 * Catatan: Implementasi ini hanya placeholder
 * Untuk implementasi nyata, diperlukan library seperti pdf.js
 *
 * @param {File} file - File PDF
 * @returns {Promise<Object>} Metadata dokumen
 */
export async function extractPdfMetadata(file) {
  // Placeholder - dalam implementasi nyata ini akan menggunakan library PDF
  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    type: "PDF Document",
    mimeType: "application/pdf",
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
    pages: "Unknown", // Dalam implementasi nyata ini bisa diambil dari PDF
  };
}

/**
 * Ekstrak metadata dari file DOC/DOCX
 *
 * Catatan: Implementasi ini hanya placeholder
 * Untuk implementasi nyata, diperlukan library khusus
 *
 * @param {File} file - File DOC/DOCX
 * @returns {Promise<Object>} Metadata dokumen
 */
export async function extractDocMetadata(file) {
  const isDocx = file.name.toLowerCase().endsWith(".docx");

  // Placeholder - dalam implementasi nyata ini akan menggunakan library Office
  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    type: isDocx
      ? "Microsoft Word Document (DOCX)"
      : "Microsoft Word Document (DOC)",
    mimeType: isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword",
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

/**
 * Fungsi generik untuk ekstraksi metadata dokumen
 *
 * @param {File} file - File
 * @returns {Promise<Object>} Metadata dokumen atau null jika tidak didukung
 */
export async function extractDocumentMetadata(file) {
  if (!file) return null;

  const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  if (fileExt === ".pdf") {
    return extractPdfMetadata(file);
  } else if ([".doc", ".docx"].includes(fileExt)) {
    return extractDocMetadata(file);
  }

  return null;
}

/**
 * Ekstrak text dari file
 * @param {File} file - File
 * @returns {Promise<string|null>} - Ekstraksi teks atau null jika tipe file tidak didukung
 */
export async function extractTextFromFile(file) {
  if (!file) return null;

  const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  // Untuk file teks sederhana
  if ([".txt", ".md", ".markdown"].includes(fileExt)) {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      console.error("Error extracting text from file:", error);
      return null;
    }
  }

  // Untuk file PDF dan DOC, implementasi sebenarnya memerlukan library eksternal
  if (fileExt === ".pdf") {
    // Placeholder - gunakan library seperti pdf.js untuk implementasi nyata
    return `[PDF Content Placeholder]\nTitle: ${file.name}\nSize: ${file.size} bytes`;
  }

  if ([".doc", ".docx"].includes(fileExt)) {
    // Placeholder - gunakan library seperti mammoth.js untuk implementasi nyata
    return `[Word Document Content Placeholder]\nTitle: ${file.name}\nSize: ${file.size} bytes`;
  }

  return null;
}

/**
 * Format ukuran file untuk ditampilkan
 * @param {number} bytes - Ukuran file dalam bytes
 * @returns {string} - Ukuran file yang diformat (KB, MB, dll)
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validasi file berdasarkan tipe dan ukuran
 * @param {File} file - File yang akan divalidasi
 * @param {Array<string>} allowedTypes - Array dari tipe MIME yang diizinkan
 * @param {number} maxSizeInBytes - Ukuran maksimum file dalam bytes
 * @returns {Object} - Hasil validasi {valid, error}
 */
export function validateFile(file, allowedTypes, maxSizeInBytes) {
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // Validasi tipe
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type;
    if (!allowedTypes.includes(fileType)) {
      return {
        valid: false,
        error: `Tipe file tidak diizinkan. Tipe yang diizinkan: ${allowedTypes.join(
          ", "
        )}`,
      };
    }
  }

  // Validasi ukuran
  if (maxSizeInBytes && file.size > maxSizeInBytes) {
    const formattedSize = formatFileSize(maxSizeInBytes);
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal: ${formattedSize}`,
    };
  }

  return { valid: true };
}

/**
 * Ekstrak metadata tanda tangan dari file PDF menggunakan pendekatan baru yang lebih robust
 * @param {Uint8Array|Buffer} pdfBytes - Bytes dari dokumen PDF
 * @returns {Promise<Object|null>} - Metadata tanda tangan atau null jika tidak ditemukan
 */
export async function extractSignatureMetadataFromPdf(pdfBytes) {
  console.log("[EXTRACT] Starting signature metadata extraction from PDF");
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Metadata yang akan dikembalikan
    const metadata = {
      signature: null,
      publicKey: null,
      originalHash: null,
      signingDate: null,
      author: null,
      version: null,
    };

    // Log metadata standar PDF untuk debugging
    console.log("[EXTRACT] PDF standard metadata:");
    console.log("- Title:", pdfDoc.getTitle());
    console.log("- Author:", pdfDoc.getAuthor());
    console.log("- Subject:", pdfDoc.getSubject());
    console.log("- Creator:", pdfDoc.getCreator());
    console.log("- Producer:", pdfDoc.getProducer());
    console.log("- CreationDate:", pdfDoc.getCreationDate());
    console.log("- ModificationDate:", pdfDoc.getModificationDate());
    console.log("- Keywords:", pdfDoc.getKeywords());

    // Ambil author dari metadata standar
    if (pdfDoc.getAuthor()) {
      metadata.author = pdfDoc.getAuthor();
    }

    // Variable untuk menampung metadata SIGNAL
    let signalMetadata = null;

    // METHOD 1: Ekstrak dari Info Dictionary (primary method)
    try {
      console.log("[EXTRACT] Extracting from PDF Info Dictionary");
      const infoDict = pdfDoc.context.trailerInfo.Info;

      if (infoDict && infoDict.get) {
        const metadataObj = infoDict.get(pdfDoc.context.obj(PDF_METADATA_KEY));

        if (metadataObj) {
          const metadataString = metadataObj.toString();
          console.log(
            `[EXTRACT] Found metadata in Info Dictionary under "${PDF_METADATA_KEY}":`,
            metadataString.substring(0, 50) + "..."
          );

          try {
            const parsed = JSON.parse(metadataString);
            if (
              parsed[METADATA_FIELDS.SIGNATURE] ||
              parsed[METADATA_FIELDS.PUBLIC_KEY]
            ) {
              console.log(
                "[EXTRACT] Successfully parsed metadata from Info Dictionary"
              );
              signalMetadata = parsed;
            }
          } catch (e) {
            console.error(
              "[EXTRACT] Failed to parse Info Dictionary metadata:",
              e.message
            );
          }
        } else {
          console.log(
            `[EXTRACT] No metadata found in Info Dictionary under "${PDF_METADATA_KEY}"`
          );
        }
      }
    } catch (e) {
      console.error("[EXTRACT] Error accessing Info Dictionary:", e.message);
    }

    // METHOD 2: Ekstrak dari Keywords (fallback)
    if (!signalMetadata) {
      const keywords = pdfDoc.getKeywords();

      if (keywords) {
        if (typeof keywords === "string") {
          try {
            const parsed = JSON.parse(keywords);
            if (
              parsed[METADATA_FIELDS.SIGNATURE] ||
              parsed[METADATA_FIELDS.PUBLIC_KEY]
            ) {
              console.log("[EXTRACT] Found SIGNAL metadata in keywords JSON");
              signalMetadata = parsed;
            }
          } catch (e) {
            console.log(
              "[EXTRACT] Failed to parse keywords as JSON:",
              e.message
            );
          }
        } else if (Array.isArray(keywords)) {
          for (const keyword of keywords) {
            if (typeof keyword === "string") {
              try {
                const parsed = JSON.parse(keyword);
                if (
                  parsed[METADATA_FIELDS.SIGNATURE] ||
                  parsed[METADATA_FIELDS.PUBLIC_KEY]
                ) {
                  console.log(
                    "[EXTRACT] Found SIGNAL metadata in keywords array"
                  );
                  signalMetadata = parsed;
                  break;
                }
              } catch (e) {
                // Silent catch - we're just trying each array item
              }
            }
          }
        }
      }
    }

    // METHOD 3: Ekstrak dari Catalog Properties (fallback)
    if (!signalMetadata) {
      try {
        console.log(
          `[EXTRACT] Searching in PDF catalog for ${PDF_CATALOG_KEY}`
        );
        const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
        if (catalog && catalog.get) {
          const signalProps = catalog.get(pdfDoc.context.obj(PDF_CATALOG_KEY));
          if (signalProps) {
            const metadataObj = signalProps.get(
              pdfDoc.context.obj(PDF_CATALOG_METADATA_KEY)
            );
            if (metadataObj) {
              try {
                const metadataString = metadataObj.toString();
                const parsed = JSON.parse(metadataString);
                if (
                  parsed[METADATA_FIELDS.SIGNATURE] ||
                  parsed[METADATA_FIELDS.PUBLIC_KEY]
                ) {
                  console.log(
                    `[EXTRACT] Found metadata in catalog ${PDF_CATALOG_KEY}`
                  );
                  signalMetadata = parsed;
                }
              } catch (e) {
                console.log(
                  `[EXTRACT] Failed to parse catalog metadata:`,
                  e.message
                );
              }
            }
          }
        }
      } catch (e) {
        console.log("[EXTRACT] Error accessing PDF catalog:", e.message);
      }
    } // Jika tidak ditemukan metadata dengan metode apapun
    if (!signalMetadata) {
      console.log("[EXTRACT] No signature metadata found in PDF");

      // Debug: Analisa keywords lebih detail (untuk debugging)
      try {
        const keywords = pdfDoc.getKeywords();
        console.log("[EXTRACT] Raw Keywords debugging:");
        console.log("  - Type:", typeof keywords);
        console.log("  - Value:", keywords);
        if (keywords) {
          if (typeof keywords === "string") {
            console.log("  - String length:", keywords.length);
            console.log("  - First 100 chars:", keywords.substring(0, 100));
            console.log(
              "  - Last 20 chars:",
              keywords.substring(keywords.length - 20)
            );
            console.log(
              "  - Contains '{' or '}':",
              keywords.includes("{") || keywords.includes("}")
            );
          } else if (Array.isArray(keywords)) {
            console.log("  - Array length:", keywords.length);
            keywords.forEach((kw, i) => {
              console.log(
                `  - Item ${i}: ${typeof kw}, ${String(kw).substring(0, 30)}`
              );
            });
          }
        }
      } catch (e) {
        console.log("[EXTRACT] Error analyzing keywords:", e);
      }

      return null;
    }

    // Ekstrak field dari signalMetadata
    if (signalMetadata[METADATA_FIELDS.SIGNATURE]) {
      metadata.signature = signalMetadata[METADATA_FIELDS.SIGNATURE];
    }

    if (signalMetadata[METADATA_FIELDS.PUBLIC_KEY]) {
      metadata.publicKey = signalMetadata[METADATA_FIELDS.PUBLIC_KEY];
    }

    if (signalMetadata[METADATA_FIELDS.DOCUMENT_HASH]) {
      metadata.originalHash = signalMetadata[METADATA_FIELDS.DOCUMENT_HASH];
    }

    if (signalMetadata[METADATA_FIELDS.SIGNING_DATE]) {
      metadata.signingDate = signalMetadata[METADATA_FIELDS.SIGNING_DATE];
    }

    if (signalMetadata[METADATA_FIELDS.AUTHOR]) {
      metadata.author = signalMetadata[METADATA_FIELDS.AUTHOR];
    }

    if (signalMetadata[METADATA_FIELDS.VERSION]) {
      metadata.version = signalMetadata[METADATA_FIELDS.VERSION];
    }

    console.log("[EXTRACT] Extracted signature metadata:", {
      signature: metadata.signature
        ? metadata.signature.substring(0, 10) + "..."
        : null,
      publicKey: metadata.publicKey
        ? metadata.publicKey.substring(0, 10) + "..."
        : null,
      originalHash: metadata.originalHash
        ? metadata.originalHash.substring(0, 10) + "..."
        : null,
      signingDate: metadata.signingDate,
      author: metadata.author,
      version: metadata.version,
    });

    return metadata;
  } catch (error) {
    console.error(
      "[EXTRACT] Error extracting signature metadata from PDF:",
      error
    );
    return null;
  }
}
