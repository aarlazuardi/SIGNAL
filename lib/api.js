/**
 * Utilitas API untuk komunikasi dengan backend
 */

/**
 * Ambil token dari localStorage
 * @returns {string|null} - Token JWT atau null jika tidak ada
 */
export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("signal_auth_token");
  }
  return null;
}

/**
 * Simpan token ke localStorage
 * @param {string} token - Token JWT untuk disimpan
 */
export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem("signal_auth_token", token);
  }
}

/**
 * Hapus token dari localStorage
 */
export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("signal_auth_token");
  }
}

/**
 * Buat headers untuk request API terautentikasi
 * @param {Object} additionalHeaders - Headers tambahan (opsional)
 * @returns {Object} - Headers untuk fetch
 */
export function getAuthHeaders(additionalHeaders = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fungsi API untuk registrasi user
 * @param {Object} userData - Data user untuk registrasi
 * @returns {Promise<Object>} - Response dari API
 */
export async function registerUser(userData) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk login user
 * @param {Object} credentials - Kredensial login
 * @returns {Promise<Object>} - Response dari API dengan token dan data user
 */
export async function loginUser(credentials) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // Simpan token di localStorage
      setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk logout user
 */
export function logoutUser() {
  removeAuthToken();
}

/**
 * Fungsi API untuk mendapatkan data user saat ini
 * @returns {Promise<Object>} - Data user
 */
export async function getCurrentUser() {
  try {
    const response = await fetch("/api/me", {
      headers: getAuthHeaders(),
    });

    return await response.json();
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk memperbarui kunci publik user
 * @param {string} publicKey - Kunci publik dalam format base64
 * @returns {Promise<Object>} - Response dari API
 */
export async function updatePublicKey(publicKey) {
  try {
    const response = await fetch("/api/update-public-key", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ publicKey }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error updating public key:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk membuat jurnal baru
 * @param {Object} journalData - Data jurnal yang akan dibuat
 * @returns {Promise<Object>} - Response dari API
 */
export async function createJournal(journalData) {
  try {
    const response = await fetch("/api/journal/create", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(journalData),
    });

    return await response.json();
  } catch (error) {
    console.error("Error creating journal:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk mendapatkan daftar jurnal milik user
 * @returns {Promise<Array>} - Array jurnal user
 */
export async function getMyJournals() {
  try {
    const response = await fetch("/api/journal/mine", {
      headers: getAuthHeaders(),
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching journals:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk mendapatkan detail jurnal berdasarkan ID
 * @param {string} journalId - ID jurnal
 * @returns {Promise<Object>} - Data detail jurnal
 */
export async function getJournalById(journalId) {
  try {
    const response = await fetch(`/api/journal/${journalId}`, {
      headers: getAuthHeaders(),
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching journal:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk memverifikasi tanda tangan jurnal
 * @param {File} file - File PDF yang akan diverifikasi
 * @param {string} publicKey - Kunci publik (opsional, jika diperlukan)
 * @returns {Promise<Object>} - Hasil verifikasi
 */
export async function verifyJournal({ file, publicKey }) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (publicKey) formData.append("publicKey", publicKey);

    const response = await fetch("/api/journal/verify", {
      method: "POST",
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error("Error verifying journal:", error);
    throw error;
  }
}

/**
 * Fungsi API untuk mengekspor jurnal sebagai PDF
 * @param {string} journalId - ID jurnal yang akan diekspor
 * @returns {Promise<Blob>} - PDF blob
 */
export async function exportJournalPdf(journalId) {
  try {
    const response = await fetch("/api/journal/export", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ journalId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error exporting PDF");
    }

    // Return blob untuk diunduh
    return await response.blob();
  } catch (error) {
    console.error("Error exporting journal to PDF:", error);
    throw error;
  }
}
