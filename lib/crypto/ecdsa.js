/**
 * Utilitas kriptografik untuk ECDSA P-256
 * Menggunakan @noble/curves untuk implementasi
 */

import { p256 } from "@noble/curves/p256";

/**
 * Memverifikasi tanda tangan digital menggunakan ECDSA P-256
 * @param {string} message - Isi jurnal untuk diverifikasi
 * @param {string} signature - Tanda tangan digital dalam format base64
 * @param {string} publicKey - Kunci publik dalam format base64
 * @returns {boolean} - Hasil verifikasi (valid/tidak)
 */
export function verifySignature(message, signature, publicKey) {
  try {
    // Konversi dari base64 ke bytes
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");

    // Buat hash dari data jurnal
    const messageHash = Buffer.from(message, "utf-8");

    // Verifikasi tanda tangan
    return p256.verify(signatureBytes, messageHash, publicKeyBytes);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Fungsi untuk mem-format dan memvalidasi kunci publik
 * @param {string} publicKey - Kunci publik dalam format base64
 * @returns {boolean} - Hasil validasi kunci publik
 */
export function validatePublicKey(publicKey) {
  try {
    const publicKeyBytes = Buffer.from(publicKey, "base64");
    // Validasi format dan panjang kunci publik (65 bytes untuk P-256 uncompressed)
    return publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04;
  } catch (error) {
    console.error("Error validating public key:", error);
    return false;
  }
}
