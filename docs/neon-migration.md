# Panduan Migrasi dari SQLite ke Neon DB

Dokumen ini berisi langkah-langkah migrasi database SIGNAL dari SQLite ke PostgreSQL menggunakan Neon DB.

## Mengapa Migrasi ke Neon DB?

1. **Performa lebih baik** - PostgreSQL menawarkan performa yang lebih baik untuk aplikasi produksi
2. **Mendukung deployment serverless** - Cocok untuk deployment di Vercel
3. **Mendukung multiple connections** - Tidak ada batasan koneksi seperti di SQLite
4. **Fitur database lebih lengkap** - Transaction, stored procedures, dll

## Langkah-langkah Migrasi

### 1. Buat Akun dan Database di Neon DB

1. Daftar di [https://neon.tech](https://neon.tech)
2. Buat project baru
3. Catat connection string yang diberikan

### 2. Update .env File

```
# Ganti connection string yang lama
DATABASE_URL="postgresql://[username]:[password]@[neon-host]/[dbname]?sslmode=require"
```

### 3. Update Schema.prisma

Schema Prisma sudah diupdate untuk menggunakan PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Migrasi Data

Karena perubahan database engine, kita perlu melakukan migrasi ulang:

```bash
# Reset dan buat ulang migrasi
npx prisma migrate dev --name neon_migration
```

Jika terjadi error, Anda bisa mencoba dengan pendekatan reset:

```bash
# Hapus folder migrations
rm -rf prisma/migrations

# Buat migrasi awal
npx prisma migrate dev --name initial
```

### 5. Verifikasi Migrasi

Pastikan struktur dan data Anda berhasil dimigrasi:

```bash
npx prisma studio
```

## Deployment ke Vercel

Untuk men-deploy dengan Neon DB:

1. Tambahkan environment variable `DATABASE_URL` di dashboard Vercel
2. Pastikan variable `NEXTAUTH_URL` dan `NEXTAUTH_SECRET` sudah diatur
3. Deploy aplikasi Anda
4. Jalankan migrasi database:
   ```bash
   npx vercel env pull
   npx prisma migrate deploy
   ```

## Troubleshooting

- **Error koneksi**: Periksa apakah IP Vercel diizinkan di firewall Neon DB (biasanya tidak masalah karena Neon DB menerima semua koneksi)
- **Error migrasi**: Jika migrasi gagal, coba reset database dan buat migrasi baru
- **Data hilang**: Jika data hilang setelah migrasi, Anda perlu melakukan import manual menggunakan data dump
