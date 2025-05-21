/**
 * Script untuk mendiagnosa dan memperbaiki masalah dashboard
 */

// Simulasi lingkungan browser
global.localStorage = {
  getItem: () => "sample_token",
  setItem: () => {},
  removeItem: () => {},
};

class MockResponse {
  constructor(status, data) {
    this.status = status;
    this.data = data;
    this.ok = status >= 200 && status < 300;
  }

  async json() {
    return this.data;
  }

  async text() {
    return typeof this.data === "object"
      ? JSON.stringify(this.data)
      : String(this.data);
  }
}

// Mock fetch API
global.fetch = (url, options) => {
  console.log(`Simulating fetch to: ${url}`);

  if (url === "/api/journal/mine") {
    // Simulasi respons berhasil
    return Promise.resolve(
      new MockResponse(200, [
        {
          id: "1",
          title: "Jurnal Test 1",
          verified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Jurnal Test 2",
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    );
  } else if (url.startsWith("/api/journal/")) {
    // Simulasi respons delete
    return Promise.resolve(new MockResponse(200, { success: true }));
  }

  // Default response
  return Promise.resolve(new MockResponse(404, { error: "Not found" }));
};

// Tes fungsi utama dashboard
async function testFetchJournals() {
  console.log("=== Testing Dashboard Journal Fetching ===");
  try {
    // Simulasi fungsi fetchJournals dari dashboard.jsx
    console.log("Fetching journals...");
    const token = global.localStorage.getItem("signal_auth_token");

    if (!token) {
      console.error("No token found");
      return;
    }

    const response = await fetch("/api/journal/mine", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);

      let errorMessage = "Gagal memuat jurnal";
      try {
        if (errorText && errorText.trim().startsWith("{")) {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Fetched journals:", data);

    // Transform data to match UI needs and handle null values safely
    const formattedJournals = Array.isArray(data)
      ? data.map((journal) => ({
          id: journal.id || "",
          title: journal.title || "Untitled",
          status: journal.verified ? "signed" : "unsigned",
          date: journal.createdAt
            ? new Date(journal.createdAt).toISOString().split("T")[0]
            : "",
        }))
      : [];

    console.log("Formatted journals:", formattedJournals);
    console.log("✓ Test completed successfully");
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run tests
testFetchJournals();

// Cara menjalankan tes:
// 1. node scripts/fix-dashboard.js
// 2. Lihat output untuk identifikasi masalah
console.log("\nRekomendasi perbaikan Dashboard:");
console.log(
  "1. Pastikan token autentikasi tersimpan dengan benar di localStorage"
);
console.log(
  "2. Periksa response API untuk memastikan format data sesuai harapan"
);
console.log("3. Pastikan penanganan error dilakukan dengan benar");
console.log("4. Periksa browser console untuk error konkret");
