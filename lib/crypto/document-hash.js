/**
 * Utilitas hash dokumen untuk SIGNAL
 * Mengimplementasikan algoritma SHA-256 untuk integrity verification
 */

import crypto from "crypto";

/**
 * Membuat hash dokumen dengan SHA-256
 * @param {string|Uint8Array} content - Konten dokumen untuk dihash
 * @param {string} [format='hex'] - Format output ('hex' atau 'base64')
 * @returns {string} - Hash dokumen dalam format yang diminta
 */
export function createHash(content, format = "hex") {
  try {
    const hash = crypto.createHash("sha256");

    if (content instanceof Uint8Array) {
      // Ensure consistent handling of Uint8Array by directly using it
      hash.update(Buffer.from(content));
    } else if (Buffer.isBuffer(content)) {
      // Directly use Buffer without conversion
      hash.update(content);
    } else {
      // Convert to string if it's not a binary type
      hash.update(String(content));
    }

    // Debug info for tracing hash creation
    const result = hash.digest(format);
    console.log(
      `[HASH] Created ${format} hash (first 10 chars): ${result.substring(
        0,
        10
      )}...`
    );
    return result;
  } catch (error) {
    console.error("Error creating document hash:", error);
    throw new Error(`Gagal membuat hash dokumen: ${error.message}`);
  }
}

/**
 * Membuat hash dokumen yang akan ditandatangani
 * Menggabungkan konten dokumen dan perihal/subjek jika tersedia
 * @param {string|Uint8Array} content - Konten dokumen
 * @param {object} metadata - Metadata dokumen
 * @param {string} [format='hex'] - Format output
 * @returns {string} - Hash dokumen untuk penandatanganan
 */
export function createSignableHash(content, metadata = {}, format = "hex") {
  try {
    const hash = crypto.createHash("sha256");

    // Hash konten utama
    if (content instanceof Uint8Array) {
      hash.update(Buffer.from(content));
    } else {
      hash.update(String(content));
    }

    // Jika ada perihal atau subject, tambahkan ke hash
    if (metadata.perihal) {
      hash.update(`:${metadata.perihal}`);
    } else if (metadata.subject) {
      hash.update(`:${metadata.subject}`);
    }

    // Jika ada passHash, tambahkan untuk keamanan tambahan
    if (metadata.passHash) {
      hash.update(`:${metadata.passHash}`);
    }

    return hash.digest(format);
  } catch (error) {
    console.error("Error creating signable hash:", error);
    throw new Error(
      `Gagal membuat hash untuk ditandatangani: ${error.message}`
    );
  }
}

/**
 * Verifikasi hash dokumen
 * @param {string|Uint8Array} content - Konten dokumen
 * @param {string} expectedHash - Hash yang diharapkan
 * @param {string} [format='hex'] - Format hash
 * @returns {boolean} - Hasil verifikasi hash
 */
export function verifyHash(content, expectedHash, format = "hex") {
  try {
    const actualHash = createHash(content, format);
    console.log("[VERIFY_HASH] Comparing hashes:", {
      expected: expectedHash.substring(0, 10) + "...",
      actual: actualHash.substring(0, 10) + "...",
    });
    return actualHash === expectedHash;
  } catch (error) {
    console.error("Error verifying document hash:", error);
    return false;
  }
}

/**
 * Fungsi khusus untuk hash dokumen PDF
 * Memastikan konsistensi hash antara proses sign dan verify
 * @param {Uint8Array|Buffer} pdfBytes - Bytes dari dokumen PDF
 * @param {string} [format='hex'] - Format output hash
 * @returns {string} - Hash PDF dalam format yang diminta
 */
export function createPdfHash(pdfBytes, format = "hex") {
  try {
    console.log(
      "[PDF_HASH] Creating hash for PDF document of size:",
      pdfBytes.length
    );
    // Pastikan input adalah Buffer atau Uint8Array
    if (!(pdfBytes instanceof Uint8Array) && !Buffer.isBuffer(pdfBytes)) {
      throw new Error("PDF bytes harus berupa Uint8Array atau Buffer");
    }

    // Gunakan Buffer untuk konsistensi
    const buffer = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);

    // Buat hash menggunakan crypto
    const hash = crypto.createHash("sha256");
    hash.update(buffer);

    // Generate hash dalam format yang diminta
    const result = hash.digest(format);
    console.log(
      `[PDF_HASH] Generated ${format} hash (first 15 chars): ${result.substring(
        0,
        15
      )}...`
    );
    return result;
  } catch (error) {
    console.error("[PDF_HASH] Error creating PDF hash:", error);
    throw new Error(`Gagal membuat hash PDF: ${error.message}`);
  }
}

/**
 * Menghasilkan hash PDF yang konsisten dari bytes asli (tanpa modifikasi)
 * @param {Uint8Array|Buffer} pdfBytes - Bytes PDF asli (sebelum diubah/ditandatangani)
 * @param {string} [format='hex'] - Format output hash
 * @returns {string} - Hash PDF dalam format yang diminta
 */
export function getCanonicalPdfHash(pdfBytes, format = "hex") {
  // Untuk PDF, hash seluruh bytes asli (tanpa modifikasi apapun)
  // Jika ingin lebih advanced, bisa menghapus metadata yang mudah berubah
  // Untuk saat ini, hash seluruh bytes saja
  return createHash(pdfBytes, format);
}
