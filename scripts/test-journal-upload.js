/**
 * Script untuk menguji fungsi upload jurnal
 *
 * Cara penggunaan:
 * 1. Jalankan aplikasi (npm run dev)
 * 2. Login ke aplikasi untuk mendapatkan token
 * 3. Ambil token dari localStorage di browser
 * 4. Jalankan script dengan perintah:
 *    node scripts/test-journal-upload.js <token>
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Mengambil token dari argumen command line
const token = process.argv[2];

if (!token) {
  console.error("Error: Token tidak ditemukan.");
  console.log("Penggunaan: node scripts/test-journal-upload.js <token>");
  process.exit(1);
}

// Contoh konten jurnal
const testJournal = {
  title: "Test Journal Upload via Script",
  content:
    "Ini adalah jurnal test yang dibuat dengan script pengujian pada " +
    new Date().toISOString(),
};

async function testUpload() {
  try {
    console.log("Mencoba upload jurnal tanpa signature/publicKey...");

    const response = await fetch("http://localhost:3000/api/journal/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testJournal),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Berhasil membuat jurnal!");
      console.log("ID jurnal:", result.id);
      console.log("Judul:", result.title);
      console.log("Terverifikasi:", result.verified);
      console.log("Dibuat pada:", result.createdAt);

      // Simpan ID untuk penggunaan nanti
      fs.writeFileSync(
        path.join(__dirname, "last-test-journal-id.txt"),
        result.id,
        "utf8"
      );
      console.log("ID jurnal disimpan di scripts/last-test-journal-id.txt");
    } else {
      console.error("❌ Gagal membuat jurnal");
      console.error("Status:", response.status);
      console.error("Error:", result.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error.message);
  }
}

testUpload();
