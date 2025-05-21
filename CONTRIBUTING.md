# Panduan Kontribusi untuk SIGNAL

## Pengantar

Terima kasih telah berminat untuk berkontribusi pada proyek SIGNAL! Dokumen ini memberikan panduan tentang bagaimana Anda dapat berkontribusi pada proyek ini.

## Bagaimana Cara Berkontribusi

### 1. Setup Lingkungan Pengembangan

```bash
# Clone repository
git clone <repository-url>
cd SIGNAL

# Install dependencies
pnpm install

# Setup database lokal
npx prisma generate
npx prisma migrate dev

# Jalankan aplikasi dalam mode pengembangan
pnpm dev
```

### 2. Struktur Kode dan Konvensi

- **Frontend**: Komponen React berada di folder `/components` dan halaman di `/app`
- **Backend**: API routes ada di `/app/api`
- **Database**: Schema dan migrations di `/prisma`
- **Keamanan**: Logika kriptografi di `/lib/crypto`, middleware autentikasi di `/middleware`

### 3. Workflow Git

1. Buat branch untuk fitur/perbaikan Anda:

   ```bash
   git checkout -b feature/nama-fitur
   ```

2. Commit perubahan Anda dengan pesan yang jelas:

   ```bash
   git commit -m "Deskripsi singkat perubahan"
   ```

3. Push branch Anda:

   ```bash
   git push origin feature/nama-fitur
   ```

4. Buat Pull Request di GitHub.

### 4. Panduan Styling

- Kami menggunakan Tailwind CSS untuk styling
- Pastikan desain responsif dan mendukung tampilan mobile
- Ikuti tema warna dan font yang sudah ada

### 5. Keamanan

- Jangan pernah melakukan hardcoding kredensial
- Gunakan environment variables untuk informasi sensitif
- Implementasikan validasi input pada semua form
- Pastikan middleware auth digunakan pada semua API yang membutuhkan autentikasi

### 6. Testing

- Uji fitur Anda secara lokal sebelum submit
- Pastikan tidak ada regression pada fitur yang sudah ada
- Uji pada berbagai browser dan ukuran layar

## Fokus Pengembangan Saat Ini

1. **Peningkatan UX/UI**: Membuat UI lebih intuitif dan responsif
2. **Optimasi Performa**: Memperbaiki loading time dan performa aplikasi
3. **Fitur Kolaborasi**: Menambahkan kemampuan berbagi dan berkolaborasi pada jurnal
4. **Ekspansi Format**: Support untuk lebih banyak format ekspor jurnal

## Panduan Dokumentasi

- Tambahkan dokumentasi inline untuk fungsi dan komponen
- Update README.md jika Anda menambahkan fitur baru
- Buat dokumen terpisah untuk fitur kompleks

## Hubungi Tim

Jika Anda memiliki pertanyaan atau butuh bantuan, hubungi tim pengembang di:

- Email: [email tim]
- Discord: [link discord]

Terima kasih atas kontribusi Anda! Bersama-sama, kita dapat membuat SIGNAL menjadi platform pengelolaan jurnal akademik yang lebih baik dan lebih aman.
