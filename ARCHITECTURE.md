# Struktur dan Alur Aplikasi SIGNAL

## Struktur Folder Aplikasi

```
SIGNAL/
├── app/                       # Komponen halaman dan rute API
│   ├── api/                   # API Routes (Backend)
│   │   ├── auth/              # Autentikasi (NextAuth.js)
│   │   ├── journal/           # API untuk manajemen jurnal
│   │   ├── login/             # API login manual
│   │   ├── register/          # API pendaftaran
│   │   └── update-public-key/ # API untuk update kunci publik
│   ├── about/                 # Halaman tentang aplikasi
│   ├── create/                # Halaman pembuatan jurnal
│   ├── dashboard/             # Halaman dashboard utama
│   ├── editor/                # Editor jurnal
│   ├── export/                # Halaman ekspor jurnal
│   ├── login/                 # Halaman login
│   ├── register/              # Halaman pendaftaran
│   └── verify/                # Halaman verifikasi jurnal
│
├── components/                # Komponen React yang dapat digunakan kembali
│   ├── ui/                    # Komponen UI dasar (buttons, inputs, dll)
│   └── ...                    # Komponen aplikasi (navbar, forms, dll)
│
├── middleware/                # Middleware aplikasi
│   └── auth.js                # Middleware autentikasi JWT
│
├── lib/                       # Utilitas dan helper functions
│   ├── db/                    # Konfigurasi database
│   │   └── prisma.js          # Konfigurasi koneksi Prisma
│   ├── crypto/                # Utilitas kriptografi
│   │   ├── ecdsa.js           # Implementasi ECDSA
│   │   └── client-ecdsa.js    # Implementasi kriptografi di sisi klien
│   ├── api.js                 # Helper untuk request API
│   └── utils.js               # Fungsi-fungsi utilitas umum
│
├── hooks/                     # Custom React hooks
│   ├── use-mobile.js          # Hook untuk deteksi perangkat mobile
│   └── use-toast.js           # Hook untuk notifikasi toast
│
├── prisma/                    # Konfigurasi Prisma ORM dan migrations
│   ├── schema.prisma          # Schema database
│   └── migrations/            # File migrasi database
│
└── public/                    # Aset statis
```

## Arsitektur Aplikasi

```
┌───────────────────┐        ┌──────────────────────┐
│                   │        │                      │
│    Client Side    │◄──────►│    Server Side       │
│    (Browser)      │        │    (Next.js)         │
│                   │        │                      │
└─────────┬─────────┘        └──────────┬───────────┘
          │                             │
          │                             │
┌─────────▼─────────┐        ┌──────────▼───────────┐
│                   │        │                      │
│  React Components │        │  API Routes          │
│  & Client Logic   │        │  (Serverless)        │
│                   │        │                      │
└─────────┬─────────┘        └──────────┬───────────┘
          │                             │
          │                             │
┌─────────▼─────────┐        ┌──────────▼───────────┐
│                   │        │                      │
│  Client Crypto    │        │  Auth Middleware     │
│  (ECDSA)          │        │  (JWT Verification)  │
│                   │        │                      │
└───────────────────┘        └──────────┬───────────┘
                                        │
                                        │
                             ┌──────────▼───────────┐
                             │                      │
                             │  Prisma ORM          │
                             │                      │
                             └──────────┬───────────┘
                                        │
                                        │
                             ┌──────────▼───────────┐
                             │                      │
                             │  PostgreSQL          │
                             │  (Neon DB)           │
                             │                      │
                             └──────────────────────┘
```

## Alur Autentikasi

```
┌───────────────┐     ┌─────────────────┐     ┌──────────────┐
│               │     │                 │     │              │
│  User Login   ├────►│  Auth Provider  ├────►│  JWT Created │
│               │     │  (NextAuth/JWT) │     │              │
└───────────────┘     └─────────────────┘     └──────┬───────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌─────────────────┐     ┌──────────────┐
│               │     │                 │     │              │
│  API Response │◄────┤  Auth Middleware│◄────┤  API Request │
│               │     │  (JWT Verify)   │     │              │
└───────────────┘     └─────────────────┘     └──────────────┘
```

## Alur Kriptografi dan Verifikasi Jurnal

```
┌───────────────┐     ┌─────────────────┐     ┌──────────────┐
│               │     │                 │     │              │
│ Create Journal├────►│  Sign with      ├────►│  Save Journal│
│               │     │  Private Key    │     │  & Signature │
└───────────────┘     └─────────────────┘     └──────┬───────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌─────────────────┐     ┌──────────────┐
│               │     │                 │     │              │
│ Verify Result │◄────┤  Verify with    │◄────┤  Load Journal│
│               │     │  Public Key     │     │  & Signature │
└───────────────┘     └─────────────────┘     └──────────────┘
```

## Model Data

### User

- id: String (UUID)
- name: String
- email: String
- password: String (hashed)
- publicKey: String (ECDSA)
- createdAt: DateTime
- updatedAt: DateTime

### Journal

- id: String (UUID)
- title: String
- content: String
- authorId: String (User.id)
- signature: String (ECDSA signature)
- isVerified: Boolean
- createdAt: DateTime
- updatedAt: DateTime
