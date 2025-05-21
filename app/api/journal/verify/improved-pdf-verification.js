/**
 * Utilitas untuk verifikasi PDF yang ditingkatkan
 * Mengimplementasikan flow verifikasi sesuai dengan diagram
 */
import { PDFDocument } from "pdf-lib";
import {
  createHash,
  createPdfHash,
  getCanonicalPdfHash,
} from "@/lib/crypto/document-hash";
import {
  verifySignature,
  verifySignatureWithDocumentHash,
} from "@/lib/crypto/ecdsa";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  PDF_CATALOG_METADATA_KEY,
  METADATA_FIELDS,
} from "@/lib/signature-config";
import { extractSignatureMetadataFromPdf } from "@/lib/document-utils";
import crypto from "crypto";

/**
 * Verifikasi tanda tangan PDF
 * @param {Uint8Array} pdfBytes - Bytes dari file PDF
 * @returns {Promise<Object>} - Hasil verifikasi
 */
export async function verifyPdfSignature(pdfBytes) {
  try {
    console.log("[VERIFY] Starting PDF verification process");

    // === HASH PDF ASLI YANG DIUPLOAD USER ===
    const uploadedPdfHash = getCanonicalPdfHash(pdfBytes, "hex");
    console.log("[VERIFY] Uploaded canonical PDF hash:", uploadedPdfHash);

    // Load PDF document untuk ekstrak metadata
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Ekstrak metadata menggunakan fungsi yang sudah ditingkatkan
    const metadata = await extractSignatureMetadataFromPdf(pdfBytes);

    if (!metadata) {
      console.log("[VERIFY] No signature metadata found in PDF");

      // Tambahan: Coba log semua metadata standard PDF untuk troubleshooting
      console.log("[VERIFY] Available standard PDF metadata:");
      console.log("- Title:", pdfDoc.getTitle());
      console.log("- Author:", pdfDoc.getAuthor());
      console.log("- Subject:", pdfDoc.getSubject());
      console.log("- Creator:", pdfDoc.getCreator());
      console.log("- Producer:", pdfDoc.getProducer());
      console.log("- Keywords:", pdfDoc.getKeywords());

      // Tambahan: Coba baca langsung dari Info Dictionary untuk debugging
      try {
        if (
          pdfDoc.context &&
          pdfDoc.context.trailerInfo &&
          pdfDoc.context.trailerInfo.Info
        ) {
          console.log(
            "[VERIFY] Raw Info Dictionary keys:",
            Object.keys(pdfDoc.context.trailerInfo.Info)
          );
          // Cek apakah ada keys yang mengandung "Signal" atau metadata
          for (const key of Object.keys(pdfDoc.context.trailerInfo.Info)) {
            if (
              key.includes("Signal") ||
              key.includes("META") ||
              key.includes("Data")
            ) {
              console.log(`[VERIFY] Found suspicious key: ${key}`);
            }
          }
        }
      } catch (e) {
        console.log("[VERIFY] Error accessing raw Info Dictionary:", e);
      }

      return {
        verified: false,
        message:
          "Metadata tanda tangan tidak ditemukan di PDF. Pastikan file merupakan hasil unduhan dari SIGNAL.",
        status: "missing_metadata",
      };
    }

    console.log("[VERIFY] Extracted metadata:", metadata);

    // Ekstrak signature, publicKey, dan originalHash dari metadata
    const { signature, publicKey, originalHash } = metadata;

    if (!signature || !publicKey) {
      console.log("[VERIFY] Missing signature or public key in metadata");
      return {
        verified: false,
        message:
          "Tanda tangan digital atau kunci publik tidak ditemukan di dokumen.",
        status: "missing_signature",
      };
    }

    // Verifikasi integritas dokumen (compare hash)
    let hashesMatch = true;
    let hashToVerify = originalHash || uploadedPdfHash;

    // Jika originalHash ada di metadata, bandingkan dengan hash PDF yang diupload
    if (originalHash) {
      console.log("[VERIFY] Comparing hashes:", {
        originalHash: originalHash,
        uploadedHash: uploadedPdfHash,
      });

      // Check exact match first
      if (originalHash !== uploadedPdfHash) {
        // Try normalized comparison (lowercase, no whitespace)
        const normalizedOriginalHash = originalHash.trim().toLowerCase();
        const normalizedUploadedHash = uploadedPdfHash.trim().toLowerCase();

        if (normalizedOriginalHash !== normalizedUploadedHash) {
          console.log("[VERIFY] Hash mismatch even after normalization");
          hashesMatch = false;
        } else {
          console.log("[VERIFY] Hash matched after normalization");
        }
      }
    } else {
      console.log(
        "[VERIFY] No originalHash in metadata, using uploaded hash for verification"
      );
    }

    // Verifikasi tanda tangan dengan hash dokumen asli dari metadata
    console.log("[VERIFY] Verifying signature with hash:", hashToVerify);

    // Coba verifikasi dengan hash dokumen menggunakan fungsi khusus
    const isHashSignatureValid = verifySignatureWithDocumentHash(
      signature,
      publicKey,
      hashToVerify
    );

    console.log(
      "[VERIFY] Signature verification with hash result:",
      isHashSignatureValid
    );

    // Jika verifikasi hash gagal, coba metode alternatif dengan fungsi verifySignatureWithHash
    let isAlternativeValid = false;
    if (!isHashSignatureValid) {
      console.log(
        "[VERIFY] Primary verification failed, trying alternative method"
      );
      isAlternativeValid = verifySignatureWithHash(
        signature,
        publicKey,
        hashToVerify
      );
      console.log(
        "[VERIFY] Alternative verification result:",
        isAlternativeValid
      );
    }

    // Hasil akhir verifikasi: jika salah satu metode berhasil
    const isSignatureValid = isHashSignatureValid || isAlternativeValid;

    if (!isSignatureValid) {
      return {
        verified: false,
        message: "Tanda tangan digital tidak valid untuk dokumen ini.",
        status: "invalid_signature",
        author: metadata.author,
        signingDate: metadata.signingDate,
        originalHash: originalHash,
      };
    }

    // Signature is valid, but content hash doesn't match (possible file alteration)
    if (!hashesMatch && originalHash) {
      return {
        verified: true,
        modified: true,
        message:
          "Tanda tangan digital valid, namun dokumen mungkin telah dimodifikasi setelah ditandatangani (hash berbeda).",
        status: "valid_but_modified",
        author: metadata.author,
        signingDate: metadata.signingDate,
        publicKey,
        originalHash,
        uploadedPdfHash,
        method: isHashSignatureValid ? "primary" : "alternative",
      };
    }

    // Everything is verified and hashes match
    return {
      verified: true,
      message:
        "Tanda tangan digital valid. Dokumen ini asli dan tidak diubah sejak ditandatangani.",
      status: "success",
      author: metadata.author,
      signingDate: metadata.signingDate,
      publicKey,
      originalHash,
      method: isHashSignatureValid ? "primary" : "alternative",
    };
  } catch (error) {
    console.error("[VERIFY] Error verifying PDF signature:", error);
    return {
      verified: false,
      message: `Gagal memverifikasi dokumen: ${error.message}`,
      status: "error",
    };
  }
}

/**
 * Verifikasi tanda tangan menggunakan hash
 * @param {string} signature - Tanda tangan dalam format base64
 * @param {string} publicKey - Kunci publik dalam format base64
 * @param {string} hash - Hash dokumen dalam format hex
 * @returns {boolean} - Hasil verifikasi
 */
function verifySignatureWithHash(signature, publicKey, hash) {
  try {
    const { p256 } = require("@noble/curves/p256");

    console.log("[VERIFY] Verifying with hash:", {
      signaturePrefix: signature.substring(0, 20) + "...",
      publicKeyPrefix: publicKey.substring(0, 20) + "...",
      hashPrefix: hash.substring(0, 20) + "...",
    });

    // Convert signature and public key from base64 to binary
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");

    // Convert hash from hex to binary
    const hashBytes = Buffer.from(hash, "hex");

    // Try multiple verification methods
    let isValid = false;
    let attempts = 0;
    const maxAttempts = 3;

    // Method 1: Standard verification
    try {
      attempts++;
      isValid = p256.verify(signatureBytes, hashBytes, publicKeyBytes);
      console.log("[VERIFY] Standard verification result:", isValid);
    } catch (e) {
      console.log("[VERIFY] Standard verification failed:", e.message);
    }

    // Method 2: Normalized hash (rehash)
    if (!isValid && attempts < maxAttempts) {
      try {
        attempts++;
        // Some PDF libraries might format hashes differently
        // Ensure hash is in correct format by hashing it again
        const normalizedHash = Buffer.from(
          crypto.createHash("sha256").update(hashBytes).digest()
        );
        isValid = p256.verify(signatureBytes, normalizedHash, publicKeyBytes);
        console.log("[VERIFY] Normalized hash verification result:", isValid);
      } catch (e) {
        console.log("[VERIFY] Normalized verification failed:", e.message);
      }
    }

    // Method 3: Try with UTF-8 encoding of hash
    if (!isValid && attempts < maxAttempts) {
      try {
        attempts++;
        // Some clients might have encoded the hash as a UTF-8 string
        const stringHash = Buffer.from(hash, "utf8");
        isValid = p256.verify(signatureBytes, stringHash, publicKeyBytes);
        console.log("[VERIFY] UTF-8 string hash verification result:", isValid);
      } catch (e) {
        console.log("[VERIFY] UTF-8 verification failed:", e.message);
      }
    }

    return isValid;
  } catch (error) {
    console.error("[VERIFY] Error in verifySignatureWithHash:", error);
    return false;
  }
}

/**
 * Ekstrak metadata tanda tangan dari PDF
 * @param {PDFDocument} pdfDoc - Dokumen PDF yang sudah dimuat
 * @returns {Object|null} - Metadata tanda tangan atau null jika tidak ditemukan
 */
function extractSignatureMetadata(pdfDoc) {
  try {
    const metadata = {
      signature: null,
      publicKey: null,
      originalHash: null,
      signingDate: null,
      author: null,
      version: null,
    };

    // Log all standard PDF metadata for debugging
    console.log("[VERIFY] PDF standard metadata:");
    console.log("- Title:", pdfDoc.getTitle());
    console.log("- Author:", pdfDoc.getAuthor());
    console.log("- Subject:", pdfDoc.getSubject());
    console.log("- Creator:", pdfDoc.getCreator());
    console.log("- Producer:", pdfDoc.getProducer());
    console.log("- CreationDate:", pdfDoc.getCreationDate());
    console.log("- ModificationDate:", pdfDoc.getModificationDate());

    // Ambil author dari metadata standar
    if (pdfDoc.getAuthor()) {
      metadata.author = pdfDoc.getAuthor();
    }

    // Variable untuk menampung metadata SIGNAL
    let signalMetadata = null;

    // Method 1 (Utama): Cari di Info Dictionary dengan custom key
    try {
      console.log("[VERIFY] Searching in PDF Info Dictionary");
      const infoDict = pdfDoc.context.trailerInfo.Info;

      if (infoDict && infoDict.get) {
        // Coba dapatkan metadata dari custom key di Info Dictionary
        const metadataObj = infoDict.get(pdfDoc.context.obj(PDF_METADATA_KEY));

        if (metadataObj) {
          const metadataString = metadataObj.toString();
          console.log(
            `[VERIFY] Found metadata in Info Dictionary under "${PDF_METADATA_KEY}":`,
            metadataString.substring(0, 50) + "..."
          );

          try {
            // Parse JSON metadata
            const parsed = JSON.parse(metadataString);
            if (
              parsed[METADATA_FIELDS.SIGNATURE] ||
              parsed[METADATA_FIELDS.PUBLIC_KEY]
            ) {
              console.log(
                "[VERIFY] Successfully parsed metadata from Info Dictionary"
              );
              signalMetadata = parsed;
            } else {
              console.log(
                "[VERIFY] Info Dictionary metadata doesn't contain signature fields"
              );
            }
          } catch (e) {
            console.error(
              "[VERIFY] Failed to parse Info Dictionary metadata:",
              e.message
            );
          }
        } else {
          console.log(
            `[VERIFY] No metadata found in Info Dictionary under "${PDF_METADATA_KEY}"`
          );
        }
      } else {
        console.log("[VERIFY] PDF does not have accessible Info Dictionary");
      }
    } catch (e) {
      console.error("[VERIFY] Error accessing Info Dictionary:", e.message);
    }

    // Method 2 (Fallback): Cari metadata dari Keywords jika tidak ditemukan di Info Dictionary
    if (!signalMetadata) {
      const keywords = pdfDoc.getKeywords();

      if (keywords === undefined || keywords === "") {
        console.log(
          "[VERIFY] WARNING: PDF Keywords is undefined or empty string"
        );
      } else {
        console.log(
          "[VERIFY] Keywords from PDF:",
          typeof keywords,
          keywords?.substring?.(0, 50) + "..."
        );
      }

      try {
        // 1. PDF-lib dapat mengembalikan keywords sebagai string atau array
        if (keywords) {
          // Jika Keywords berupa string JSON
          if (typeof keywords === "string") {
            try {
              // Try direct parsing first
              const parsed = JSON.parse(keywords);
              if (
                parsed[METADATA_FIELDS.SIGNATURE] ||
                parsed[METADATA_FIELDS.PUBLIC_KEY]
              ) {
                console.log("[VERIFY] Found SIGNAL metadata in keywords JSON");
                signalMetadata = parsed;
              } else {
                console.log(
                  "[VERIFY] Keywords JSON doesn't contain signature metadata"
                );
              }
            } catch (e) {
              console.log(
                "[VERIFY] Failed to parse keywords as JSON:",
                e.message
              );
            }
          }

          // Jika Keywords berupa array (PDF-lib bisa mengembalikan array jika setKeywords dipanggil dengan array)
          if (!signalMetadata && Array.isArray(keywords)) {
            console.log(
              "[VERIFY] Keywords is an array with",
              keywords.length,
              "items"
            );
            for (let i = 0; i < keywords.length; i++) {
              const keyword = keywords[i];
              console.log(
                `[VERIFY] Examining keyword[${i}]:`,
                typeof keyword,
                keyword?.substring?.(0, 30)
              );

              if (typeof keyword === "string") {
                try {
                  // Coba parse item array sebagai JSON
                  const parsed = JSON.parse(keyword);
                  if (
                    parsed[METADATA_FIELDS.SIGNATURE] ||
                    parsed[METADATA_FIELDS.PUBLIC_KEY]
                  ) {
                    console.log(
                      "[VERIFY] Found SIGNAL metadata in array keyword at index",
                      i
                    );
                    signalMetadata = parsed;
                    break;
                  }
                } catch (e) {
                  console.log(
                    `[VERIFY] Failed to parse keyword[${i}] as JSON:`,
                    e.message
                  );
                }
              }
            }
          }
        }
      } catch (e) {
        console.log("[VERIFY] Error processing keywords:", e);
      }
    }

    // Method 3 (Fallback): Cari dalam custom properties di catalog jika masih belum ditemukan
    if (!signalMetadata) {
      try {
        console.log(`[VERIFY] Searching in PDF catalog for ${PDF_CATALOG_KEY}`);
        const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
        if (catalog && catalog.get) {
          const signalProps = catalog.get(pdfDoc.context.obj(PDF_CATALOG_KEY));
          if (signalProps) {
            console.log(`[VERIFY] Found ${PDF_CATALOG_KEY} in PDF catalog`);
            const metadataObj = signalProps.get(
              pdfDoc.context.obj(PDF_CATALOG_METADATA_KEY)
            );
            if (metadataObj) {
              const metadataString = metadataObj.toString();
              try {
                const parsed = JSON.parse(metadataString);
                if (
                  parsed[METADATA_FIELDS.SIGNATURE] ||
                  parsed[METADATA_FIELDS.PUBLIC_KEY]
                ) {
                  console.log(`[VERIFY] Found metadata in ${PDF_CATALOG_KEY}`);
                  signalMetadata = parsed;
                }
              } catch (e) {
                console.log(
                  `[VERIFY] Failed to parse ${PDF_CATALOG_KEY} metadata:`,
                  e.message
                );
              }
            }
          } else {
            console.log(`[VERIFY] No ${PDF_CATALOG_KEY} found in PDF catalog`);
          }
        }
      } catch (e) {
        console.log("[VERIFY] Error searching PDF catalog:", e.message);
      }
    }

    // Jika tidak ditemukan metadata di semua metode
    if (!signalMetadata) {
      console.log(
        "[VERIFY] No signature metadata found in PDF using any method"
      );
      return null;
    }

    // Extract metadata dari signalMetadata
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

    // Jika ada metadata.author dari metadata standar tapi tidak dari signal_author, simpan
    if (!metadata.author && pdfDoc.getAuthor()) {
      metadata.author = pdfDoc.getAuthor();
    }

    console.log("[VERIFY] Extracted final metadata:", {
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
    console.error("[VERIFY] Error extracting signature metadata:", error);
    return null;
  }
}
