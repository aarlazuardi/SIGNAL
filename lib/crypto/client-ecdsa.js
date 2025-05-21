/**
 * Utilitas untuk ECDSA di sisi klien
 * File ini menangani tanda tangan digital menggunakan Web Crypto API
 */

/**
 * Generate pasangan kunci ECDSA P-256
 * @returns {Promise<{privateKey: string, publicKey: string}>} Private dan public key dalam format base64
 */
export async function generateKeyPair() {
  try {
    // Generate key pair menggunakan Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256", // Sesuai dengan ECDSA P-256
      },
      true, // Allow export
      ["sign", "verify"] // Key operations
    );

    // Export private key ke PKCS#8 format
    const privateKeyExported = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    // Export public key ke raw format
    const publicKeyExported = await window.crypto.subtle.exportKey(
      "raw",
      keyPair.publicKey
    );

    // Konversi ArrayBuffer ke base64
    const privateKeyBase64 = arrayBufferToBase64(privateKeyExported);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyExported);

    return {
      privateKey: privateKeyBase64,
      publicKey: publicKeyBase64,
    };
  } catch (error) {
    console.error("Error generating ECDSA key pair:", error);
    throw error;
  }
}

/**
 * Import kunci privat ECDSA dari format base64
 * @param {string} privateKeyBase64 - Kunci privat dalam format base64
 * @returns {Promise<CryptoKey>} - CryptoKey untuk signing
 */
export async function importPrivateKey(privateKeyBase64) {
  try {
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

    return await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"]
    );
  } catch (error) {
    console.error("Error importing private key:", error);
    throw error;
  }
}

/**
 * Tanda tangani data menggunakan kunci privat
 * @param {string} data - Data yang akan ditandatangani
 * @param {string} privateKeyBase64 - Kunci privat dalam format base64
 * @returns {Promise<string>} - Tanda tangan dalam format base64
 */
export async function signData(data, privateKeyBase64) {
  try {
    // Import kunci privat
    const privateKey = await importPrivateKey(privateKeyBase64);

    // Ubah data ke ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Tanda tangani data
    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      privateKey,
      dataBuffer
    );

    // Konversi tanda tangan ke base64
    return arrayBufferToBase64(signature);
  } catch (error) {
    console.error("Error signing data:", error);
    throw error;
  }
}

/**
 * Konversi ArrayBuffer ke string base64
 * @param {ArrayBuffer} buffer - ArrayBuffer untuk dikonversi
 * @returns {string} - String base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Konversi string base64 ke ArrayBuffer
 * @param {string} base64 - String base64 untuk dikonversi
 * @returns {ArrayBuffer} - ArrayBuffer hasil konversi
 */
function base64ToArrayBuffer(base64) {
  try {
    // Sanitize base64 input by removing any non-base64 characters
    const sanitizedBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");

    // Add padding if needed
    const paddedBase64 = sanitizedBase64.padEnd(
      Math.ceil(sanitizedBase64.length / 4) * 4,
      "="
    );

    const binaryString = window.atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Error decoding base64 string:", error);
    console.error("Problematic base64 input:", base64);
    throw new Error("Invalid base64 string: " + error.message);
  }
}

// Alias untuk backward compatibility
export const generateECDSAKeyPair = generateKeyPair;
export const sign = signData;

/**
 * Turunkan kunci publik dari kunci privat
 * @param {string} privateKeyBase64 - Kunci privat dalam format base64
 * @returns {Promise<string>} - Kunci publik dalam format base64
 */
export async function derivePublicKey(privateKeyBase64) {
  try {
    // Import kunci privat
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

    // Import private key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true, // extractable needs to be true to generate the public key
      ["sign"]
    );

    // Get the key's JWK representation which contains the public key components
    const jwk = await window.crypto.subtle.exportKey("jwk", privateKey);

    // Import the public key components
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      {
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
        ext: true,
      },
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["verify"]
    );

    // Export the public key to raw format
    const publicKeyExported = await window.crypto.subtle.exportKey(
      "raw",
      publicKey
    );

    // Convert to base64
    return arrayBufferToBase64(publicKeyExported);
  } catch (error) {
    console.error("Error deriving public key from private key:", error);
    throw error;
  }
}
