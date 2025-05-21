# SIGNAL - Secure Integrated Global Network for Academic Literature

## Deskripsi Aplikasi

SIGNAL (Secure Integrated Global Network for Academic Literature) adalah platform yang dirancang untuk mengelola, berbagi, dan memverifikasi jurnal akademik secara aman. Aplikasi ini memungkinkan pengguna untuk membuat, mengedit, mengekspor, dan memverifikasi jurnal akademik dengan fitur keamanan kriptografi untuk menjamin keaslian dan integritas konten.

## Teknologi yang Digunakan

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) - Framework React untuk aplikasi web dengan server-side rendering dan static site generation
- **UI Library**: React dengan komponen UI kustom dan [Tailwind CSS](https://tailwindcss.com/) untuk styling
- **State Management**: React Context API dan React Hooks
- **Autentikasi Client**: NextAuth.js untuk integrasi dengan berbagai provider autentikasi

### Backend

- **Framework**: Next.js API Routes (serverless functions)
- **Runtime**: Node.js
- **Authentication**: JSON Web Tokens (JWT) dan NextAuth.js
- **Database ORM**: Prisma ORM untuk akses database yang type-safe

### Database

- **Database**: PostgreSQL (Neon DB) - Database relasional yang dihosting di cloud
- **Migration Tool**: Prisma Migrate untuk pengelolaan skema dan migrasi database

### Deployment & Infrastructure

- **Deployment Platform**: Vercel
- **Regions**: Singapore (sin1)
- **Environment Variables**: Dikelola melalui dashboard Vercel

## Struktur Aplikasi

SIGNAL menggunakan arsitektur modern dengan pendekatan "App Router" dari Next.js:

- `/app` - Folder utama yang berisi semua komponen rendering halaman dan API routes
- `/app/api` - Backend API routes untuk autentikasi, manajemen jurnal, dan operasi pengguna
- `/components` - Komponen React yang dapat digunakan kembali
- `/lib` - Utilitas dan helper functions
- `/prisma` - Konfigurasi database dan model schema
- `/middleware` - Middleware aplikasi termasuk autentikasi
- `/hooks` - Custom React hooks
- `/public` - Aset statis seperti gambar dan file

## Fitur Keamanan

### Autentikasi

- **JWT (JSON Web Token)**: Untuk verifikasi identitas pengguna dan sesi
- **Google OAuth**: Integrasi login menggunakan Google
- **Auth Middleware**: Proteksi rute API dan otorisasi pengguna
- **Validasi Input**: Pengaman terhadap serangan injeksi

### Kriptografi

- **ECDSA (Elliptic Curve Digital Signature Algorithm)**: Digunakan untuk tanda tangan digital
- **Public-Private Key Infrastructure**: Setiap pengguna memiliki pasangan kunci untuk verifikasi jurnal
- **Enkripsi Client-side**: Implementasi kriptografi di sisi klien untuk memastikan keamanan data
- **Verifikasi Integritas**: Sistem untuk memverifikasi keaslian dan integritas jurnal akademik

### Keamanan Data

- **Hashing Password**: Password pengguna di-hash menggunakan bcrypt
- **Database Security**: Koneksi database dengan SSL/TLS enabled
- **Environment Variables**: Kredensial sensitif disimpan sebagai environment variables

## Alur Kerja Aplikasi

1. **Autentikasi Pengguna**

   - Pengguna dapat mendaftar dengan email/password atau Google OAuth
   - Setelah login berhasil, pengguna diberikan JWT untuk sesi mereka

2. **Manajemen Jurnal**

   - Pengguna dapat membuat jurnal akademik baru
   - Edit jurnal yang ada dengan editor built-in
   - Ekspor jurnal dalam format yang dapat dibagikan

3. **Verifikasi Jurnal**

   - Pengguna dapat memverifikasi keaslian jurnal menggunakan tanda tangan digital
   - Validasi bahwa jurnal tidak dimodifikasi sejak ditandatangani

4. **Dashboard**

   - Pengguna dapat melihat semua jurnal mereka
   - Mengelola profil dan kunci publik mereka
   - Navigasi ke halaman profil untuk pengaturan akun

5. **Profil Pengguna**

   - Pengguna dapat mengupload dan mengedit avatar profil
   - Mengubah nama tampilan pengguna
   - Melihat alamat email terdaftar (tidak dapat diubah)
   - Mengatur passhash untuk penandatanganan dokumen

6. **Manajemen Profil**
   - Upload dan perbarui foto profil (avatar)
   - Edit informasi pribadi seperti nama
   - Atur passhash untuk penandatanganan digital dokumen
   - Tampilan email pengguna (hanya baca)

## Deployment

Aplikasi dioptimalkan untuk deployment di Vercel dan sudah di-deploy di platform tersebut.

## Lisensi

Hak cipta © 2024-2025. Hak Cipta Dilindungi Undang-Undang.
