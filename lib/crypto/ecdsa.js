/**
 * Utilitas kriptografik untuk ECDSA P-256
 * Menggunakan @noble/curves untuk implementasi
 */

import { p256 } from "@noble/curves/p256";
import crypto from "crypto";

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
    const messageHash = createDocumentHash(message);

    // Log untuk debugging
    console.log("[VERIFY] Verifying signature with:", {
      messageHashPrefix:
        Buffer.from(messageHash).toString("hex").substring(0, 20) + "...",
      signaturePrefix: signature.substring(0, 20) + "...",
      publicKeyPrefix: publicKey.substring(0, 20) + "...",
    });

    // Verifikasi tanda tangan
    return p256.verify(signatureBytes, messageHash, publicKeyBytes);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Memverifikasi tanda tangan digital menggunakan hash dokumen
 * Fungsi khusus untuk verifikasi PDF berdasarkan hash dokumen
 *
 * @param {string} signature - Tanda tangan digital dalam format base64
 * @param {string} publicKey - Kunci publik dalam format base64
 * @param {string} hash - Hash dokumen dalam format hex string
 * @returns {boolean} - Hasil verifikasi (valid/tidak)
 */
export function verifySignatureWithDocumentHash(signature, publicKey, hash) {
  try {
    console.log("[VERIFY-HASH] Verifying signature with document hash:", {
      signaturePrefix: signature.substring(0, 20) + "...",
      publicKeyPrefix: publicKey.substring(0, 20) + "...",
      hashPrefix: hash.substring(0, 20) + "...",
    });

    // Konversi signature dan publicKey dari base64 ke bytes
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");

    // Konversi hash dari hex string ke binary
    const hashBytes = Buffer.from(hash, "hex");

    // Verifikasi tanda tangan dengan hash
    return p256.verify(signatureBytes, hashBytes, publicKeyBytes);
  } catch (error) {
    console.error("[VERIFY-HASH] Error verifying signature with hash:", error);
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

/**
 * Membuat hash dokumen (menggunakan SHA-256)
 * @param {string} content - Konten dokumen untuk di-hash
 * @param {boolean} asHexString - Jika true, mengembalikan string hex, jika false mengembalikan Uint8Array
 * @returns {Uint8Array|string} - Hasil hash dokumen
 */
export function createDocumentHash(content, asHexString = false) {
  try {
    // Gunakan SHA-256 untuk membuat hash
    const hash = crypto.createHash("sha256");
    hash.update(content);

    if (asHexString) {
      return hash.digest("hex");
    }
    return new Uint8Array(hash.digest());
  } catch (error) {
    console.error("Error creating document hash:", error);
    throw error;
  }
}

/**
 * Verifikasi dokumen eksternal dengan tanda tangan dan kunci publik
 * @param {string} documentContent - Konten dokumen yang akan diverifikasi
 * @param {string} signature - Tanda tangan dalam format base64
 * @param {string} publicKey - Kunci publik dalam format base64
 * @param {string} passHash - PassHash yang mungkin digunakan dalam penandatanganan (opsional)
 * @returns {boolean} - Hasil verifikasi
 */
export function verifyExternalDocument(
  documentContent,
  signature,
  publicKey,
  passHash = ""
) {
  try {
    // Validasi input
    if (!documentContent || !signature || !publicKey) {
      return false;
    }

    // Validasi format kunci publik
    if (!validatePublicKey(publicKey)) {
      return false;
    }

    // Coba verifikasi dengan dan tanpa passHash
    let isValid = verifySignature(documentContent, signature, publicKey);

    // Jika tidak valid dan ada passHash, coba dengan passHash
    if (!isValid && passHash) {
      const securedContent = `${documentContent}:${passHash}`;
      isValid = verifySignature(securedContent, signature, publicKey);
    }

    return isValid;
  } catch (error) {
    console.error("Error verifying external document:", error);
    return false;
  }
}

/**
 * Membuat tanda tangan digital untuk dokumen
 * @param {string} message - Konten dokumen untuk ditandatangani
 * @param {string} privateKey - Kunci privat dalam format base64
 * @param {string} passHash - PassHash user untuk memperketat keamanan (opsional)
 * @returns {string} - Tanda tangan digital dalam format base64
 */
export function createSignature(message, privateKey, passHash = "") {
  try {
    // Konversi privateKey dari format base64
    const privateKeyBytes = Buffer.from(privateKey, "base64");

    // Jika ada passHash, gabungkan dengan message
    const securedMessage = passHash ? `${message}:${passHash}` : message;

    // Buat hash dari pesan menggunakan fungsi standar
    const messageHash = createDocumentHash(securedMessage);

    // Buat tanda tangan dengan format yang terstandarisasi (DER format)
    const signatureBytes = p256.sign(messageHash, privateKeyBytes);

    // Log untuk debugging
    console.log(
      "[SIGN] Creating signature with message hash:",
      Buffer.from(messageHash).toString("hex").substring(0, 20) + "..."
    );

    // Kembalikan signature dalam format base64
    return Buffer.from(signatureBytes).toString("base64");
  } catch (error) {
    console.error("Error creating signature:", error);
    throw error;
  }
}

/**
 * Menggabungkan dokumen dengan metadata tanda tangan
 * @param {object} journalData - Data jurnal
 * @param {object} signatureData - Data tanda tangan
 * @returns {string} - Dokumen dengan metadata tanda tangan
 */
export function createSignedDocument(journalData, signatureData) {
  try {
    const metadata = {
      title: journalData.title,
      author: journalData.author || "Anonymous",
      signedAt: signatureData.signedAt,
      signatureId: signatureData.id,
      verificationUrl: `${
        process.env.NEXT_PUBLIC_BASE_URL || "https://signal.example.com"
      }/verify?id=${signatureData.id}`,
    };

    // Format dokumen dengan metadata
    const signedDocument = `
SIGNAL - Secure Integrated Global Network for Academic Literature
---------------------------------------------------------------
Title: ${journalData.title}
Author: ${metadata.author}
Date: ${new Date(signatureData.signedAt).toLocaleDateString("id-ID")}
Subject: ${signatureData.subject || "Not specified"}
Verification ID: ${signatureData.id}
---------------------------------------------------------------

${journalData.content}

---------------------------------------------------------------
Digital Signature Information:
This document is digitally signed using ECDSA P-256.
Verification URL: ${metadata.verificationUrl}
Signature: ${signatureData.signature.substring(0, 20)}...
    `;

    return signedDocument;
  } catch (error) {
    console.error("Error creating signed document:", error);
    throw error;
  }
}

/**
 * Ekstrak informasi tanda tangan dari dokumen yang ditandatangani
 * @param {string} documentText - Teks dokumen yang berisi informasi tanda tangan
 * @returns {object|null} - Objek dengan informasi tanda tangan atau null jika tidak ditemukan
 */
export function extractSignatureInfo(documentText) {
  try {
    // Cari bagian metadata tanda tangan
    const signatureSection = documentText.match(
      /Digital Signature Information:([\s\S]*?)(?:$|(?=---))/
    );
    if (!signatureSection) return null;

    // Cari ID verifikasi
    const verificationIdMatch = documentText.match(
      /Verification ID:\s*([a-zA-Z0-9_-]+)/
    );
    const verificationId = verificationIdMatch ? verificationIdMatch[1] : null;

    // Cari URL verifikasi
    const verificationUrlMatch = documentText.match(
      /Verification URL:\s*(https?:\/\/[^\s]+)/
    );
    const verificationUrl = verificationUrlMatch
      ? verificationUrlMatch[1]
      : null;

    // Cari tanda tangan (mungkin tidak lengkap)
    const signatureMatch = documentText.match(
      /Signature:\s*([a-zA-Z0-9+/=]+)\.{3}/
    );
    const partialSignature = signatureMatch ? signatureMatch[1] : null;

    // Cari metadata lainnya
    const titleMatch = documentText.match(/Title:\s*(.*)/);
    const authorMatch = documentText.match(/Author:\s*(.*)/);
    const dateMatch = documentText.match(/Date:\s*(.*)/);

    return {
      title: titleMatch ? titleMatch[1] : null,
      author: authorMatch ? authorMatch[1] : null,
      date: dateMatch ? dateMatch[1] : null,
      verificationId,
      verificationUrl,
      partialSignature,
      hasSignatureInfo: !!signatureSection,
    };
  } catch (error) {
    console.error("Error extracting signature info:", error);
    return null;
  }
}

/**
 * Membuat pasangan kunci ECDSA secara server-side (untuk keperluan pengembangan)
 * @returns {Promise<{privateKey: string, publicKey: string}>} Pasangan kunci dalam format base64
 */
export async function generateServerKeyPair() {
  try {
    const privateKey = p256.utils.randomPrivateKey();
    const publicKey = p256.getPublicKey(privateKey);

    return {
      privateKey: Buffer.from(privateKey).toString("base64"),
      publicKey: Buffer.from(publicKey).toString("base64"),
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
}
