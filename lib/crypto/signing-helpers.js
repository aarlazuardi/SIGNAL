/**
 * Helper functions to ensure consistent document signing workflows
 */

// Debug level - bisa diubah untuk debugging
export const DEBUG_LEVEL = 2; // 0=none, 1=error, 2=normal, 3=verbose

/**
 * Log dengan level berbeda untuk memudahkan debugging
 * @param {string} source - Source dari log
 * @param {string} message - Pesan untuk dilog
 * @param {any} data - Data untuk dilog
 * @param {number} level - Level log (0=none, 1=error, 2=normal, 3=verbose)
 */
export function logWithLevel(source, message, data = null, level = 2) {
  if (level <= DEBUG_LEVEL) {
    const prefix = `[${source}]`;

    if (data === null) {
      console.log(`${prefix} ${message}`);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }
}

/**
 * Bentuk hash yang konsisten untuk dokumen
 * @param {string|Uint8Array} content - Dokumen yang akan di-hash
 * @param {boolean} isBase64 - Jika true, input dianggap sebagai base64
 * @returns {string} - Hash dalam format hex
 */
export function createConsistentDocumentHash(content, isBase64 = false) {
  const { createHash } = require("crypto");

  // Jika content berupa Uint8Array, convert ke buffer
  let buffer;
  if (content instanceof Uint8Array) {
    buffer = Buffer.from(content);
  } else if (isBase64) {
    buffer = Buffer.from(content, "base64");
  } else {
    buffer = Buffer.from(content);
  }

  // Gunakan sha256 untuk konsistensi
  const hash = createHash("sha256").update(buffer).digest("hex");
  logWithLevel("HASH", "Created hash", hash.substring(0, 20) + "...", 3);
  return hash;
}

/**
 * Compare dokumen hash
 * @param {string} hash1 - Hash pertama
 * @param {string} hash2 - Hash kedua
 * @returns {boolean} - True jika sama
 */
export function compareDocumentHashes(hash1, hash2) {
  const result = hash1 === hash2;
  logWithLevel(
    "HASH",
    "Comparing hashes",
    {
      hash1: hash1.substring(0, 10) + "...",
      hash2: hash2.substring(0, 10) + "...",
      match: result,
    },
    3
  );
  return result;
}
