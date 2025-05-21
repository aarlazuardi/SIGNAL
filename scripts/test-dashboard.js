/**
 * Script untuk menguji komponen dashboard
 *
 * Ini adalah script pengujian sederhana untuk mendiagnosis
 * masalah dengan komponen dashboard
 */

const fetch = require("node-fetch");

// Mengambil token dari argumen command line
const token = process.argv[2];

if (!token) {
  console.error("Error: Token tidak ditemukan.");
  console.log("Penggunaan: node scripts/test-dashboard.js <token>");
  process.exit(1);
}

async function testFetchJournals() {
  try {
    console.log("Mencoba mendapatkan daftar jurnal...");

    const response = await fetch("http://localhost:3000/api/journal/mine", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gagal mendapatkan jurnal");
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return;
    }

    const journals = await response.json();

    console.log("✅ Berhasil mendapatkan daftar jurnal!");
    console.log(`Jumlah jurnal: ${journals.length}`);

    if (journals.length > 0) {
      console.log("\nContoh jurnal:");
      journals.slice(0, 3).forEach((journal, index) => {
        console.log(`\nJurnal #${index + 1}:`);
        console.log(`- ID: ${journal.id}`);
        console.log(`- Judul: ${journal.title}`);
        console.log(`- Terverifikasi: ${journal.verified ? "Ya" : "Tidak"}`);
        console.log(`- Dibuat pada: ${journal.createdAt}`);
      });
    }

    // Periksa format respons untuk potensi masalah
    console.log("\nMemeriksa format jurnal...");
    checkJournalFormat(journals);
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error.message);
  }
}

// Fungsi untuk memeriksa masalah umum dengan format jurnal
function checkJournalFormat(journals) {
  if (!Array.isArray(journals)) {
    console.error("❌ MASALAH: Respons API bukan array!");
    return;
  }

  if (journals.length === 0) {
    console.log("ℹ️ Tidak ada jurnal untuk diperiksa.");
    return;
  }

  let hasIssues = false;

  journals.forEach((journal, index) => {
    if (!journal.id) {
      console.error(`❌ MASALAH: Jurnal #${index + 1} tidak memiliki ID!`);
      hasIssues = true;
    }

    if (!journal.title) {
      console.error(`❌ MASALAH: Jurnal #${index + 1} tidak memiliki judul!`);
      hasIssues = true;
    }

    if (journal.verified === undefined) {
      console.error(
        `❌ MASALAH: Jurnal #${index + 1} tidak memiliki status verified!`
      );
      hasIssues = true;
    }

    if (!journal.createdAt) {
      console.error(
        `❌ MASALAH: Jurnal #${index + 1} tidak memiliki timestamp createdAt!`
      );
      hasIssues = true;
    }

    // Cek format tanggal yang valid
    try {
      new Date(journal.createdAt);
    } catch (e) {
      console.error(
        `❌ MASALAH: Jurnal #${index + 1} memiliki format tanggal tidak valid!`
      );
      hasIssues = true;
    }
  });

  if (!hasIssues) {
    console.log("✅ Format jurnal valid. Tidak ada masalah terdeteksi.");
  }
}

testFetchJournals();
