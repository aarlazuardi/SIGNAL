## Panduan Menjalankan Aplikasi SIGNAL

Berikut adalah langkah-langkah untuk menjalankan aplikasi SIGNAL secara lokal:

### 1. Setup Database

SIGNAL sekarang menggunakan PostgreSQL (Neon DB) untuk database. Berikut langkah-langkah untuk setup database:

```bash
# Reset database (opsional)
npx prisma migrate reset

# Jalankan migrasi
npx prisma migrate dev
```

#### Konfigurasi Neon DB

1. Buat akun di [Neon DB](https://neon.tech)
2. Buat project baru di dashboard Neon
3. Dapatkan connection string dari dashboard
4. Update .env file Anda:
   ```
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

### 2. Jalankan Development Server

```bash
# Menjalankan development server
npm run dev
```

Server akan berjalan di `http://localhost:3000`.

### 3. Akses Melalui Perangkat Mobile

Untuk mengakses aplikasi dari perangkat mobile yang terhubung ke jaringan yang sama:

```bash
# Jalankan dengan akses jaringan
npm run dev -- --hostname 0.0.0.0
```

Kemudian akses aplikasi dari perangkat mobile menggunakan IP komputer Anda, misalnya:
`http://192.168.1.x:3000`

### 4. Testing API

Anda dapat menggunakan tools seperti Postman atau bahkan cURL untuk menguji API:

```bash
# Contoh registrasi user
curl -X POST http://localhost:3000/api/register \
-H "Content-Type: application/json" \
-d '{"name":"User Test","email":"user@example.com","password":"password123"}'

# Contoh login user
curl -X POST http://localhost:3000/api/login \
-H "Content-Type: application/json" \
-d '{"email":"user@example.com","password":"password123"}'

# Contoh mendapatkan info user (dengan token)
curl -X GET http://localhost:3000/api/me \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Melihat Database

Anda dapat melihat dan mengelola database menggunakan Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio akan berjalan di `http://localhost:5555`.

### 6. Deployment ke Vercel

Untuk men-deploy aplikasi SIGNAL ke Vercel, ikuti langkah-langkah berikut:

1. **Push kode Anda ke GitHub**
2. **Login ke [Vercel](https://vercel.com) dan buat project baru**
3. **Import repository GitHub Anda**
4. **Konfigurasi environment variables**:
   - `DATABASE_URL` (connection string Neon DB)
   - `JWT_SECRET` (secret untuk JWT)
   - `NEXTAUTH_SECRET` (gunakan JWT_SECRET yang sama)
   - `NEXTAUTH_URL` (URL deployment Vercel)
   - `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` (untuk OAuth)
5. **Deploy aplikasi**
6. **Jalankan migrasi database** menggunakan Vercel CLI:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

> **Catatan**: Pastikan untuk menambahkan domain Vercel Anda sebagai redirect URL yang diizinkan di Google Cloud Console untuk OAuth.
