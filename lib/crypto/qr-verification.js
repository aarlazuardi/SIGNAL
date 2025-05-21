/**
 * Utilitas untuk menghasilkan dan memproses QR codes untuk verifikasi jurnal
 */
import QRCode from "qrcode";

/**
 * Generate QR code for journal verification
 * @param {string} journalId - ID jurnal untuk verifikasi
 * @param {string} baseUrl - Base URL aplikasi (opsional)
 * @returns {Promise<string>} - QR code sebagai data URL
 */
export async function generateVerificationQR(journalId, baseUrl = null) {
  try {
    // Gunakan environment variable jika baseUrl tidak disediakan
    const appUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://signal.example.com";
    const verificationUrl = `${appUrl}/verify?id=${journalId}`;

    // Generate QR code sebagai data URL
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return qrDataUrl;
  } catch (error) {
    console.error("Error generating verification QR code:", error);
    throw error;
  }
}

/**
 * Generate data for verification QR that contains minimal info
 * @param {object} journalData - Data jurnal untuk QR code
 * @returns {Promise<string>} - QR code sebagai data URL
 */
export async function generateMinimalVerificationQR(journalData) {
  try {
    // Data minimal untuk verifikasi
    const minimalData = {
      id: journalData.id,
      h: journalData.hash || null, // Hash dokumen (opsional)
      t: journalData.title.substring(0, 20), // Judul singkat
    };

    // Encode ke JSON string dan buat QR code
    const dataStr = JSON.stringify(minimalData);
    const qrDataUrl = await QRCode.toDataURL(dataStr, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 200,
    });

    return qrDataUrl;
  } catch (error) {
    console.error("Error generating minimal verification QR:", error);
    throw error;
  }
}

/**
 * Ekstrak data dari QR code untuk verifikasi
 * @param {string} qrData - Data dari QR code scanner
 * @returns {object} - Hasil ekstraksi data {type, data}
 */
export function extractQRData(qrData) {
  try {
    // Cek apakah QR code berisi URL verifikasi
    if (qrData.startsWith("http")) {
      // Ekstrak ID jurnal dari URL
      const urlObj = new URL(qrData);
      const journalId = urlObj.searchParams.get("id");

      if (journalId) {
        return {
          type: "url",
          data: { journalId },
        };
      }
    }

    // Coba parse sebagai JSON
    try {
      const jsonData = JSON.parse(qrData);
      if (jsonData && jsonData.id) {
        return {
          type: "json",
          data: jsonData,
        };
      }
    } catch (jsonError) {
      console.log("QR data is not in JSON format");
    }

    // Fallback jika tidak dikenali formatnya
    return {
      type: "unknown",
      data: qrData,
    };
  } catch (error) {
    console.error("Error extracting QR data:", error);
    return {
      type: "error",
      data: null,
      error: error.message,
    };
  }
}
