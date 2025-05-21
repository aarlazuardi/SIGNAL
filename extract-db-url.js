// Skrip untuk membantu menambahkan kolom originalHash ke database
// Simpan sebagai extract-db-url.js
const fs = require("fs");
const path = require("path");

try {
  // Baca file .env
  const envPath = path.join(__dirname, ".env");
  const envContent = fs.readFileSync(envPath, "utf8");

  // Ekstrak DATABASE_URL
  const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*["']([^"']+)["']/);

  if (dbUrlMatch && dbUrlMatch[1]) {
    const databaseUrl = dbUrlMatch[1];

    console.log("==== INSTRUKSI UNTUK MENAMBAHKAN KOLOM originalHash ====");
    console.log("Database URL Anda adalah:");
    console.log(databaseUrl);
    console.log("\nLangkah-langkah untuk menambahkan kolom originalHash:");
    console.log("1. Buka pgAdmin, DBeaver, atau klien PostgreSQL lainnya");
    console.log("2. Buat koneksi baru menggunakan URL database di atas");
    console.log("3. Jalankan perintah SQL berikut:");
    console.log("\n--- SQL YANG PERLU DIJALANKAN ---");
    console.log(
      'ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT;'
    );
    console.log(
      'CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");'
    );
    console.log("\n--- AKHIR PERINTAH SQL ---");
    console.log(
      '\nSetelah menjalankan perintah SQL di atas, error "Unknown argument `originalHash`" seharusnya sudah teratasi.'
    );
  } else {
    console.log("Tidak dapat menemukan DATABASE_URL di file .env");
  }
} catch (error) {
  console.error("Error:", error.message);
}
