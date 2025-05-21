/**
 * Script untuk menguji koneksi database Prisma
 * Jalankan dengan: node scripts/test-db-connection.js
 */

const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log("Mencoba terhubung ke database...");

    // Coba query sederhana untuk menguji koneksi
    const userCount = await prisma.user.count();
    console.log(`Koneksi berhasil! Jumlah user dalam database: ${userCount}`);

    // Coba lakukan query jurnal
    const journalCount = await prisma.journal.count();
    console.log(`Jumlah jurnal dalam database: ${journalCount}`);

    // Menampilkan informasi tentang skema tabel jurnal
    console.log("\nStruktur tabel Journal:");
    // Di PostgreSQL kita bisa mendapatkan informasi skema
    // Tetapi ini tergantung pada tipe database, jadi kita gunakan cara yang lebih umum

    // Ambil contoh jurnal untuk melihat struktur
    const sampleJournal = await prisma.journal.findFirst();
    if (sampleJournal) {
      console.log("Contoh data jurnal:");
      console.log(sampleJournal);
    } else {
      console.log("Tidak ada jurnal dalam database");
    }

    return true;
  } catch (error) {
    console.error("Error menghubungkan ke database:");
    console.error(`Nama error: ${error.name}`);
    console.error(`Pesan error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);

    // Tambahan cek DATABASE_URL
    if (process.env.DATABASE_URL) {
      console.log("\nDATABASE_URL ditemukan dalam env variables");
      const sanitizedUrl = process.env.DATABASE_URL.replace(
        /postgresql:\/\/([^:]+):([^@]+)@/,
        "postgresql://$1:****@"
      );
      console.log(`URL Database (disanitasi): ${sanitizedUrl}`);
    } else {
      console.error("DATABASE_URL tidak ditemukan dalam env variables!");
    }

    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan test
testConnection().then((success) => {
  console.log("\nTest koneksi database selesai.");
  process.exit(success ? 0 : 1);
});
