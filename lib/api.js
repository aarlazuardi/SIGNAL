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
    // Log token information for debugging
    console.log(
      `[API] Using token for API call - Length: ${token.length}, Start: ${token.substring(
        0,
        10
      )}...`
    );
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn(
      "[API] No token available for API call - Headers:",
      JSON.stringify(headers)
    );
  }

  return headers;
}

/**
 * Tunggu hingga token tersedia di localStorage dengan polling
 * Berguna untuk memastikan token ada sebelum API call setelah login Google
 * @param {number} maxWaitMs - Waktu maksimal menunggu dalam milidetik (default: 10000ms/10 detik)
 * @param {number} intervalMs - Interval polling dalam milidetik (default: 100ms)
 * @returns {Promise<string|null>} - Token yang ditemukan atau null jika timeout
 */
export async function waitForAuthToken(maxWaitMs = 10000, intervalMs = 100) {
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    const token = getAuthToken();

    if (token) {
      // Cek token format dan informasi tambahan
      try {
        // Cek jika token formatnya valid JWT (punya 3 bagian yang dipisahkan titik)
        const tokenParts = token.split('.');
        const isValidFormat = tokenParts.length === 3;
        
        console.log(
          `[API] Token ditemukan setelah ${attempts} kali coba (${
            Date.now() - startTime
          }ms) - Format valid: ${isValidFormat}, Length: ${token.length}`
        );
        
        if (!isValidFormat) {
          console.warn(`[API] Token format tidak valid: ${token.substring(0, 10)}...`);
        }
      } catch (e) {
        console.error("[API] Error saat analisis token:", e);
      }
      
      return token;
    }

    // Tunggu sebentar sebelum cek lagi
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.error(
    `[API] Timeout menunggu token setelah ${attempts} percobaan (${maxWaitMs}ms)`
  );
  return null;
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
    console.log(
      "Verifying journal document:",
      file.name,
      "size:",
      file.size,
      "bytes"
    );

    const formData = new FormData();
    formData.append("file", file);
    if (publicKey) formData.append("publicKey", publicKey);

    // Add file type info to help server with verification strategy
    const fileType =
      file.type ||
      (file.name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "unknown");
    formData.append("fileType", fileType);

    const response = await fetch("/api/journal/verify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Verification request failed (${response.status}): ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Verification result:", result);

    // Add additional metadata for easier UI handling
    return {
      ...result,
      verified: result.verified || false,
      message: result.message || "Tidak ada informasi verifikasi",
      status: result.status || (result.verified ? "success" : "error"),
      statusText: getStatusText(result.status, result.verified),
    };
  } catch (error) {
    console.error("Error verifying journal:", error);
    throw new Error("Gagal memverifikasi dokumen: " + error.message);
  }
}

/**
 * Get human-readable status text based on verification status
 * @param {string} status - Status code from verification
 * @param {boolean} verified - Whether document is verified
 * @returns {string} - Human readable status text
 */
function getStatusText(status, verified) {
  if (verified) return "Dokumen terverifikasi";
  switch (status) {
    case "error":
      return "Gagal memverifikasi dokumen";
    case "modified":
      return "Dokumen telah dimodifikasi";
    case "invalid_signature":
      return "Tanda tangan tidak valid";
    case "missing_metadata":
      return "Metadata tidak ditemukan";
    default:
      return "Dokumen tidak terverifikasi";
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

/**
 * Eksekusi API call dengan memastikan token sudah ada terlebih dahulu
 * Gunakan untuk API call yang membutuhkan autentikasi setelah login Google
 * @param {Function} apiCallFn - Fungsi API call yang ingin dijalankan
 * @param {number} maxWaitMs - Waktu maksimal menunggu token dalam milidetik
 * @returns {Promise<any>} - Hasil dari API call
 */
export async function executeAuthenticatedCall(apiCallFn, maxWaitMs = 10000) {
  // Cek dulu apakah sudah ada token
  let token = getAuthToken();

  // Jika belum ada, tunggu hingga tersedia
  if (!token) {
    console.log("[API] Token belum tersedia, menunggu...");
    token = await waitForAuthToken(maxWaitMs);

    // Jika masih belum ada setelah menunggu, kembalikan error
    if (!token) {
      console.error("[API] Gagal mendapatkan token autentikasi");
      throw new Error(
        "Autentikasi gagal: Token tidak tersedia. Coba logout dan login kembali."
      );
    }
  }

  // Jalankan API call setelah token tersedia
  return await apiCallFn();
}

/**
 * Fungsi bantuan untuk melakukan fetch request dengan retry jika terjadi error 401
 * dan opsi untuk menunggu token tersedia
 * 
 * @param {string} url - URL endpoint API
 * @param {Object} options - Opsi fetch seperti method, headers, body
 * @param {boolean} waitForToken - Apakah harus menunggu token tersedia (default: true)
 * @param {number} maxRetries - Jumlah maksimum retry jika terjadi error 401 (default: 1)
 * @returns {Promise<Response>} - Promise dari fetch response
 */
export async function fetchWithAuth(url, options = {}, waitForToken = true, maxRetries = 1) {
  // Jika perlu menunggu token
  if (waitForToken) {
    const token = await waitForAuthToken(10000);
    if (!token) {
      throw new Error("Tidak dapat menemukan token autentikasi setelah menunggu");
    }
    
    // Pastikan headers ada dan memiliki Authorization
    options.headers = options.headers || {};
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  
  let retries = 0;
  let lastError = null;
  
  // Deteksi apakah body adalah FormData
  const isFormData = options.body instanceof FormData;
  
  while (retries <= maxRetries) {
    try {
      console.log(`[API] Fetching ${url} - Attempt ${retries + 1}/${maxRetries + 1} - FormData: ${isFormData}`);
      
      // Untuk FormData jangan sertakan Content-Type karena boundary akan diatur otomatis
      const fetchOptions = {
        ...options,
        headers: {
          // Hanya sertakan Content-Type untuk bukan FormData
          ...(!isFormData && { "Content-Type": "application/json" }),
          ...options.headers,
        },
      };
      
      // Log headers untuk debugging
      console.log(`[API] Request headers:`, fetchOptions.headers);
      
      const response = await fetch(url, fetchOptions);
      
      // Jika 401 dan masih bisa retry, coba lagi dengan token baru
      if (response.status === 401 && retries < maxRetries) {
        console.warn(`[API] Got 401 from ${url} - Retrying with fresh token (${retries + 1}/${maxRetries})`);
        
        // Dapatkan token baru dan coba lagi
        removeAuthToken(); // Hapus token lama yang mungkin tidak valid
        const newToken = await waitForAuthToken(5000);
        if (newToken) {
          options.headers["Authorization"] = `Bearer ${newToken}`;
        }
        
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`[API] Fetch error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      if (retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        continue;
      }
      
      break;
    }
  }
  
  // Jika sampai sini berarti semua percobaan gagal
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
