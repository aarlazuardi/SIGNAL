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
 * Tunggu hingga token tersedia di localStorage dengan polling
 * Berguna untuk memastikan token ada sebelum API call setelah login Google
 * @param {number} maxWaitMs - Waktu maksimal menunggu dalam milidetik (default: 3000ms/3 detik)
 * @param {number} intervalMs - Interval polling dalam milidetik (default: 50ms)
 * @returns {Promise<string|null>} - Token yang ditemukan atau null jika timeout
 */
export async function waitForAuthToken(maxWaitMs = 3000, intervalMs = 50) {
  const startTime = Date.now();
  let attempts = 0;

  // Fungsi untuk mencoba mendapatkan token dari berbagai sumber
  const getToken = () => {
    if (typeof window === "undefined") return null;

    // Coba dari localStorage (prioritas utama)
    const lsToken = localStorage.getItem("signal_auth_token");
    if (lsToken && lsToken !== "undefined" && lsToken !== "null")
      return lsToken;

    // Coba dari sessionStorage
    const ssToken = sessionStorage.getItem("signal_auth_token");
    if (ssToken && ssToken !== "undefined" && ssToken !== "null")
      return ssToken;

    // Coba dari cookie (fallback terakhir)
    if (document.cookie) {
      const match = document.cookie.match(/signal_auth_token=([^;]+)/);
      if (match && match[1] && match[1] !== "undefined" && match[1] !== "null")
        return match[1];
    }

    return null;
  };

  // Pertama, coba dapatkan token langsung
  let token = getToken();
  if (token) {
    // Validasi format token cepat
    if (token.split(".").length === 3) {
      // Jika token valid, tambahkan ke local storage jika belum ada
      if (
        typeof window !== "undefined" &&
        !localStorage.getItem("signal_auth_token")
      ) {
        localStorage.setItem("signal_auth_token", token);
      }
      return token;
    }
  }

  // Jika belum berhasil, lakukan polling dengan interval yang lebih singkat
  // Gunakan Promise.race untuk membatasi waktu total
  return Promise.race([
    // Polling token
    (async () => {
      while (Date.now() - startTime < maxWaitMs) {
        attempts++;

        // Tunggu interval sebelum mencoba lagi
        await new Promise((resolve) => setTimeout(resolve, intervalMs));

        token = getToken();
        if (token) {
          // Validasi format JWT (3 segmen dipisahkan titik)
          if (token.split(".").length === 3) {
            // Kurangi logging di production
            if (process.env.NODE_ENV !== "production") {
              console.log(
                `[API] Token valid ditemukan setelah ${attempts} percobaan (${
                  Date.now() - startTime
                }ms)`
              );
            }
            // Simpan ke localStorage jika belum ada
            if (
              typeof window !== "undefined" &&
              !localStorage.getItem("signal_auth_token")
            ) {
              localStorage.setItem("signal_auth_token", token);
            }
            return token;
          }
        }
      }

      console.warn(
        `[API] Timeout menunggu token setelah ${attempts} percobaan (${maxWaitMs}ms)`
      );
      return null;
    })(),

    // Timeout promise
    new Promise((resolve) =>
      setTimeout(() => {
        console.warn(
          `[API] Hard timeout after ${maxWaitMs}ms waiting for token`
        );
        resolve(null);
      }, maxWaitMs)
    ),
  ]);
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
export async function fetchWithAuth(
  url,
  options = {},
  waitForToken = true,
  maxRetries = 1
) {
  // Jika perlu menunggu token
  if (waitForToken) {
    // Gunakan maxWaitMs yang lebih pendek (3 detik) dan interval yang lebih kecil (100ms) untuk performa lebih baik
    const token = await waitForAuthToken(3000, 100);
    if (!token) {
      throw new Error(
        "Tidak dapat menemukan token autentikasi setelah menunggu"
      );
    }

    // Pastikan headers ada dan memiliki Authorization
    options.headers = options.headers || {};

    // Hanya set Authorization jika belum ada atau token berbeda
    const currentAuthHeader = options.headers["Authorization"];
    if (!currentAuthHeader || !currentAuthHeader.includes(token)) {
      options.headers["Authorization"] = `Bearer ${token}`;

      // Kurangi logging di production untuk optimasi performa
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[API] Token ditambahkan ke header Authorization, panjang: ${token.length}`
        );
      }
    }
  }

  let retries = 0;
  let lastError = null;

  // Deteksi apakah body adalah FormData
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  while (retries <= maxRetries) {
    try {
      // Kurangi logging di production
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[API] Fetching ${url} - Attempt ${retries + 1}/${
            maxRetries + 1
          } - FormData: ${isFormData}`
        );
      }

      // Tambahkan timestamp yang lebih efisien untuk mencegah caching
      const timestamp = Date.now();
      const urlWithTimestamp = url.includes("?")
        ? `${url}&_t=${timestamp}`
        : `${url}?_t=${timestamp}`;

      // Untuk FormData jangan sertakan Content-Type karena boundary akan diatur otomatis
      const fetchOptions = { ...options };

      // Setup headers dengan cara yang benar untuk FormData
      if (isFormData) {
        // Jika body adalah FormData, jangan atur Content-Type
        const headers = { ...options.headers };
        delete headers["Content-Type"]; // Hapus Content-Type jika ada
        fetchOptions.headers = headers;
      } else if (!options.headers || !options.headers["Content-Type"]) {
        // Untuk non-FormData, jika Content-Type tidak ada, tambahkan
        fetchOptions.headers = {
          "Content-Type": "application/json",
          ...options.headers,
        };
      }

      // Hanya log dalam development mode untuk mengurangi overhead
      if (process.env.NODE_ENV !== "production") {
        console.log(`[API] Request headers:`, fetchOptions.headers);
        console.log(`[API] Request method: ${fetchOptions.method || "GET"}`);
      }

      // Tambahkan timeout untuk mencegah request menggantung terlalu lama
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      fetchOptions.signal = controller.signal;

      const response = await fetch(urlWithTimestamp, fetchOptions);
      clearTimeout(timeoutId); // Hapus timeout jika request sukses

      // Jika 401 dan masih bisa retry, coba lagi dengan token baru
      if (response.status === 401 && retries < maxRetries) {
        console.warn(
          `[API] Got 401 from ${url} - Retrying with fresh token (${
            retries + 1
          }/${maxRetries})`
        );

        // Dapatkan token baru dan coba lagi dengan delay lebih pendek (500ms)
        removeAuthToken(); // Hapus token lama yang mungkin tidak valid
        await new Promise((resolve) => setTimeout(resolve, 500)); // Tunggu sebentar sebelum coba mendapat token baru
        const newToken = await waitForAuthToken(3000, 100); // Gunakan maksimum 3 detik

        if (newToken) {
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[API] Mendapatkan token baru untuk retry: ${newToken.substring(
                0,
                10
              )}...`
            );
          }
          options.headers = options.headers || {};
          options.headers["Authorization"] = `Bearer ${newToken}`;
        } else {
          console.warn(`[API] Gagal mendapatkan token baru untuk retry`);
        }

        retries++;
        await new Promise((resolve) => setTimeout(resolve, 300)); // Tunggu 0.3 detik sebelum retry
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Log error hanya jika bukan abort error dari timeout
      if (error.name !== "AbortError") {
        console.error(
          `[API] Fetch error (attempt ${retries + 1}/${maxRetries + 1}):`,
          error.message
        );
      } else {
        console.warn(`[API] Request timeout for ${url}`);
      }

      if (retries < maxRetries) {
        retries++;
        // Tunggu lebih singkat untuk retry cepat (backoff lebih pendek)
        const waitTime = 300 * Math.pow(1.5, retries);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      break;
    }
  }

  // Jika sampai sini berarti semua percobaan gagal
  throw (
    lastError ||
    new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`)
  );
}
