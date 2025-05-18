# SIGNAL Backend API Documentation

SIGNAL (Secure Integrated Global Network for Academic Literature) adalah platform penandatanganan jurnal digital dengan algoritma ECDSA P-256. Dokumen ini menjelaskan implementasi backend yang dibuat menggunakan Next.js API routes.

## Teknologi yang Digunakan

- **Next.js 14+ (App Router)** - Framework React untuk frontend dan API routes
- **Prisma ORM** - Object-Relational Mapping untuk database
- **SQLite** - Database lokal (dapat diganti PostgreSQL untuk production)
- **JWT** - JSON Web Token untuk autentikasi
- **bcrypt** - Untuk hashing password
- **@noble/curves** - Implementasi kurva eliptik untuk ECDSA P-256
- **pdf-lib** - Untuk generasi PDF

## Struktur Database

Database terdiri dari dua model utama:

### User

- `id` - ID unik (cuid)
- `email` - Email user (unique)
- `name` - Nama user
- `password` - Password yang di-hash dengan bcrypt
- `publicKey` - Kunci publik ECDSA P-256 (optional, dalam format base64)
- `createdAt` - Waktu pembuatan
- `updatedAt` - Waktu update terakhir

### Journal

- `id` - ID unik (cuid)
- `title` - Judul jurnal
- `content` - Isi jurnal dalam format teks
- `signature` - Tanda tangan digital dalam format base64
- `publicKey` - Kunci publik yang digunakan untuk verifikasi
- `verified` - Status verifikasi (boolean)
- `userId` - Relasi ke user pemilik jurnal
- `createdAt` - Waktu pembuatan
- `updatedAt` - Waktu update terakhir

## API Endpoints

### Auth Endpoints

- **POST /api/register** - Registrasi user baru

  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- **POST /api/login** - Login user dan mendapatkan token JWT

  ```json
  { "email": "user@example.com", "password": "securepassword" }
  ```

- **GET /api/me** - Mendapatkan informasi user yang terautentikasi
  (memerlukan header Authorization: Bearer {token})

- **POST /api/update-public-key** - Update kunci publik user
  ```json
  { "publicKey": "base64EncodedPublicKey" }
  ```

### Journal Endpoints

- **POST /api/journal/create** - Membuat jurnal baru dengan tanda tangan digital

  ```json
  {
    "title": "Judul Jurnal",
    "content": "Isi jurnal...",
    "signature": "base64EncodedSignature",
    "publicKey": "base64EncodedPublicKey"
  }
  ```

- **GET /api/journal/mine** - Mendapatkan daftar jurnal milik user
  (memerlukan header Authorization: Bearer {token})

- **GET /api/journal/{id}** - Mendapatkan detail jurnal berdasarkan ID

- **POST /api/journal/verify** - Memverifikasi tanda tangan digital jurnal

  ```json
  {
    "content": "Isi jurnal yang akan diverifikasi...",
    "signature": "base64EncodedSignature",
    "publicKey": "base64EncodedPublicKey"
  }
  ```

- **POST /api/journal/export** - Mengekspor jurnal sebagai PDF
  ```json
  { "journalId": "journal-id-here" }
  ```

## Alur Penggunaan SIGNAL

1. **Registrasi & Login User**

   - User melakukan registrasi dengan nama, email, dan password
   - Setelah registrasi, user dapat login untuk mendapatkan token JWT

2. **Generasi Kunci di Client Side**

   - User membuat pasangan kunci ECDSA P-256 di browser menggunakan Web Crypto API
   - Private key disimpan di local storage
   - Public key dikirim ke server dan disimpan di database

3. **Pembuatan Jurnal dengan Tanda Tangan**

   - User menulis jurnal di browser
   - Saat menyimpan, client melakukan signing terhadap konten jurnal menggunakan private key
   - Jurnal, signature, dan public key dikirim ke server
   - Server memverifikasi tanda tangan sebelum menyimpan jurnal

4. **Verifikasi Jurnal**

   - Pembaca dapat memverifikasi keaslian jurnal dengan mengunggah konten, signature, dan public key
   - Server memverifikasi apakah signature cocok dengan konten dan public key
   - Informasi penulis ditampilkan jika tersedia di database

5. **Ekspor sebagai PDF**
   - User dapat mengekspor jurnal sebagai PDF dengan metadata dan informasi signature

## Contoh Penggunaan API dari Frontend

```javascript
// Contoh login
const login = async (email, password) => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.token) {
    localStorage.setItem("signal_auth_token", data.token);
  }

  return data;
};

// Contoh membuat jurnal dengan tanda tangan digital
const createSignedJournal = async (title, content, privateKey) => {
  // 1. Generate tanda tangan menggunakan private key
  const signature = await signData(content, privateKey);

  // 2. Ambil public key dari local storage
  const publicKey = localStorage.getItem("signal_public_key");

  // 3. Kirim ke API
  const response = await fetch("/api/journal/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("signal_auth_token")}`,
    },
    body: JSON.stringify({
      title,
      content,
      signature,
      publicKey,
    }),
  });

  return await response.json();
};
```

## Catatan Keamanan

- Private key tidak pernah dikirim ke server, semua proses signing dilakukan di client-side
- Server hanya menyimpan public key untuk verifikasi
- API endpoint dilindungi dengan JWT untuk mencegah akses tidak sah
- Password disimpan dalam bentuk hash dengan bcrypt untuk keamanan data pengguna
