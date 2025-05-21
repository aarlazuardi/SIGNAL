/**
 * Utilitas untuk backup dan pemulihan kunci
 */
import { encryptPrivateKey, decryptPrivateKey } from "./key-management";

/**
 * Format kunci untuk backup dalam format JSON
 * @param {string} privateKey - Private key dalam format base64
 * @param {string} publicKey - Public key dalam format base64
 * @param {string} passphrase - Passphrase untuk enkripsi (opsional)
 * @returns {string} - JSON string berisi informasi kunci untuk backup
 */
export function formatKeyForBackup(privateKey, publicKey, passphrase = null) {
  try {
    const backupData = {
      version: "1.0",
      algorithm: "ECDSA-P256",
      created: new Date().toISOString(),
      publicKey: publicKey,
      privateKey: passphrase
        ? encryptPrivateKey(privateKey, passphrase)
        : privateKey,
      encrypted: !!passphrase,
    };

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    console.error("Error formatting key for backup:", error);
    throw error;
  }
}

/**
 * Create formatted backup kunci (dengan keamanan tambahan)
 * @param {Object} keyData - Data kunci {privateKey, publicKey, userId, email}
 * @param {string} passphrase - Passphrase untuk enkripsi
 * @returns {string} - Formatted backup teks
 */
export function createFormattedKeyBackup(keyData, passphrase) {
  try {
    // Enkripsi private key
    const encryptedPrivateKey = passphrase
      ? encryptPrivateKey(keyData.privateKey, passphrase)
      : keyData.privateKey;

    // Format tanggal
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString("id-ID");

    // Create formatted backup text
    return `-----BEGIN SIGNAL BACKUP KEY-----
Version: SIGNAL Key Backup v1.0
Algorithm: ECDSA-P256
Created: ${timestamp}
User: ${keyData.email || "Unknown"}
ID: ${keyData.userId || "Unknown"}

${encryptedPrivateKey}

Public Key:
${keyData.publicKey}

This private key is ${passphrase ? "encrypted" : "NOT encrypted"}.
${
  passphrase
    ? "You will need your passphrase to restore it."
    : "Please keep it secure!"
}
Backup created on: ${formattedDate}
-----END SIGNAL BACKUP KEY-----`;
  } catch (error) {
    console.error("Error creating formatted key backup:", error);
    throw error;
  }
}

/**
 * Parse backup kunci dari format JSON
 * @param {string} backupJson - JSON string dari backup
 * @param {string} passphrase - Passphrase untuk dekripsi (jika dibutuhkan)
 * @returns {Object} - Data kunci {privateKey, publicKey, ...}
 */
export function parseKeyBackup(backupJson, passphrase = null) {
  try {
    // Parse JSON
    const backupData = JSON.parse(backupJson);

    // Validasi data
    if (!backupData.publicKey || !backupData.privateKey) {
      throw new Error("Invalid backup format: Missing key data");
    }

    // Decrypt jika perlu
    let privateKey = backupData.privateKey;
    if (backupData.encrypted) {
      if (!passphrase) {
        throw new Error("This backup is encrypted and requires a passphrase");
      }
      privateKey = decryptPrivateKey(privateKey, passphrase);
    }

    return {
      privateKey,
      publicKey: backupData.publicKey,
      created: backupData.created,
      algorithm: backupData.algorithm,
      version: backupData.version,
    };
  } catch (error) {
    console.error("Error parsing key backup:", error);
    throw error;
  }
}

/**
 * Extract key data dari formatted backup
 * @param {string} formattedBackup - Teks backup terformat
 * @param {string} passphrase - Passphrase untuk dekripsi (jika dibutuhkan)
 * @returns {Object} - Data kunci {privateKey, publicKey, ...}
 */
export function extractKeyFromFormattedBackup(
  formattedBackup,
  passphrase = null
) {
  try {
    // Extract data dari format teks
    const privateKeyMatch = formattedBackup.match(
      /-----BEGIN SIGNAL BACKUP KEY-----([\s\S]*?)Public Key:/
    );
    const publicKeyMatch = formattedBackup.match(
      /Public Key:\s*([\s\S]*?)(?:This|$)/
    );
    const isEncryptedMatch = formattedBackup.match(
      /This private key is (encrypted|NOT encrypted)/
    );

    if (!privateKeyMatch || !publicKeyMatch) {
      throw new Error("Invalid backup format: Cannot extract key data");
    }

    // Clean up extracted values
    const privateKeyRaw = privateKeyMatch[1]
      .trim()
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("Version:") &&
          !line.startsWith("Algorithm:") &&
          !line.startsWith("Created:") &&
          !line.startsWith("User:") &&
          !line.startsWith("ID:")
      )
      .join("")
      .trim();

    const publicKey = publicKeyMatch[1].trim();
    const isEncrypted = isEncryptedMatch && isEncryptedMatch[1] === "encrypted";

    // Decrypt jika perlu
    let privateKey = privateKeyRaw;
    if (isEncrypted) {
      if (!passphrase) {
        throw new Error("This backup is encrypted and requires a passphrase");
      }
      privateKey = decryptPrivateKey(privateKey, passphrase);
    }

    return {
      privateKey,
      publicKey,
      encrypted: isEncrypted,
    };
  } catch (error) {
    console.error("Error extracting key from formatted backup:", error);
    throw error;
  }
}
