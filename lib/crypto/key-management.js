/**
 * Utilitas untuk manajemen kunci ECDSA P-256
 */
import { p256 } from "@noble/curves/p256";
import crypto from "crypto";

/**
 * Generate sepasang kunci ECDSA P-256
 * @returns {Promise<{privateKey: string, publicKey: string}>} Pasangan kunci dalam format base64
 */
export async function generateKeyPair() {
  try {
    // Generate private key (32 bytes random untuk P-256)
    const privateKeyBytes = p256.utils.randomPrivateKey();

    // Derive public key dari private key
    const publicKeyBytes = p256.getPublicKey(privateKeyBytes);

    // Encode sebagai base64 untuk penyimpanan
    return {
      privateKey: Buffer.from(privateKeyBytes).toString("base64"),
      publicKey: Buffer.from(publicKeyBytes).toString("base64"),
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
}

/**
 * Enkripsi private key dengan passphrase
 * @param {string} privateKey - Private key dalam format base64
 * @param {string} passphrase - Passphrase untuk enkripsi
 * @returns {string} - Encrypted private key
 */
export function encryptPrivateKey(privateKey, passphrase) {
  try {
    // Generate encryption key dari passphrase menggunakan PBKDF2
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");
    const iv = crypto.randomBytes(16);

    // Enkripsi private key
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const privateKeyBuffer = Buffer.from(privateKey, "base64");

    let encryptedKey = cipher.update(privateKeyBuffer);
    encryptedKey = Buffer.concat([encryptedKey, cipher.final()]);

    // Ambil authentication tag
    const authTag = cipher.getAuthTag();

    // Format: salt|iv|authTag|encryptedData
    const result = Buffer.concat([salt, iv, authTag, encryptedKey]).toString(
      "base64"
    );

    return result;
  } catch (error) {
    console.error("Error encrypting private key:", error);
    throw error;
  }
}

/**
 * Dekripsi private key dengan passphrase
 * @param {string} encryptedKey - Encrypted private key
 * @param {string} passphrase - Passphrase untuk dekripsi
 * @returns {string} - Decrypted private key dalam format base64
 */
export function decryptPrivateKey(encryptedKey, passphrase) {
  try {
    // Decode base64
    const encryptedBuffer = Buffer.from(encryptedKey, "base64");

    // Extract salt, iv, authTag dan encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 32);
    const authTag = encryptedBuffer.slice(32, 48);
    const encryptedData = encryptedBuffer.slice(48);

    // Generate dekripsi key dari passphrase
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");

    // Dekripsi
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Return dalam format base64
    return decrypted.toString("base64");
  } catch (error) {
    console.error("Error decrypting private key:", error);
    throw new Error(
      "Gagal mendekripsi kunci privat. Passphrase mungkin salah."
    );
  }
}

/**
 * Validate dan tes sepasang kunci
 * @param {string} privateKey - Private key dalam format base64
 * @param {string} publicKey - Public key dalam format base64
 * @returns {boolean} - True jika pasangan kunci valid
 */
export function validateKeyPair(privateKey, publicKey) {
  try {
    // Konversi dari base64
    const privateKeyBytes = Buffer.from(privateKey, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");

    // Verifikasi format kunci
    if (privateKeyBytes.length !== 32) {
      return false; // P-256 private key harus 32 bytes
    }

    if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
      return false; // P-256 uncompressed public key harus 65 bytes dan diawali 0x04
    }

    // Derive public key dari private key
    const derivedPublicKey = p256.getPublicKey(privateKeyBytes);

    // Bandingkan dengan public key yang diberikan
    return Buffer.compare(Buffer.from(derivedPublicKey), publicKeyBytes) === 0;
  } catch (error) {
    console.error("Error validating key pair:", error);
    return false;
  }
}

/**
 * Generate PassHash untuk keamanan tambahan
 * @param {string} password - Password user
 * @param {string} publicKey - Public key dalam format base64
 * @returns {string} - PassHash dalam format base64
 */
export function generatePassHash(password, publicKey) {
  try {
    // Gunakan HMAC-SHA256 dengan public key sebagai "salt"
    const hmac = crypto.createHmac("sha256", Buffer.from(publicKey, "base64"));
    hmac.update(password);
    return hmac.digest("base64");
  } catch (error) {
    console.error("Error generating PassHash:", error);
    throw error;
  }
}
