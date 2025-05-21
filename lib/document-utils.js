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
