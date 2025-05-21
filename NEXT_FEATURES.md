# Rencana Pengembangan SIGNAL

## 1. Perbaikan Dashboard

- **Masalah**: Dashboard saat ini menggunakan data dummy statis
- **Solusi**:
  - Implementasi fetch data jurnal dari database menggunakan API route `/api/journal/mine`
  - Tambahkan state loading dan handling error
  - Implementasi real-time update saat jurnal dihapus atau ditambahkan

```jsx
// Contoh implementasi fetch data di dashboard
useEffect(() => {
  const fetchJournals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/journal/mine", {
        headers: {
          Authorization: `Bearer ${session?.customToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch journals");
      const data = await response.json();
      setJournals(data.journals);
    } catch (error) {
      console.error("Error fetching journals:", error);
      setError("Gagal memuat jurnal");
    } finally {
      setLoading(false);
    }
  };

  if (session?.customToken) {
    fetchJournals();
  }
}, [session]);
```

## 2. Perbaikan Eksport Jurnal

- **Masalah**: Komponen ekspor jurnal menggunakan data dummy dan fitur ekspor belum berfungsi
- **Solusi**:
  - Implementasi fetch data jurnal dari database
  - Tambahkan fungsi ekspor yang sebenarnya dengan pilihan format (PDF, DOCX, TXT)
  - Implementasi ekspor dengan metadata dan tanda tangan digital

```jsx
// Contoh implementasi ekspor jurnal
const exportJournal = async (journalId, format) => {
  setExporting(true);
  try {
    const response = await fetch(`/api/journal/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.customToken}`,
      },
      body: JSON.stringify({ journalId, format }),
    });

    if (!response.ok) throw new Error("Failed to export journal");

    // Handle download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${journalId}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Ekspor Berhasil",
      description: `Jurnal berhasil diekspor dalam format ${format}.`,
      variant: "success",
    });
  } catch (error) {
    console.error("Error exporting journal:", error);
    toast({
      title: "Ekspor Gagal",
      description: "Terjadi kesalahan saat mengekspor jurnal.",
      variant: "destructive",
    });
  } finally {
    setExporting(false);
  }
};
```

## 3. Perbaikan Pembuatan Jurnal

- **Masalah**: Pembuatan jurnal tidak jelas alur penyimpanannya dan draft tidak tersimpan
- **Solusi**:
  - Implementasi auto-save draft setiap 30 detik
  - Tambahkan indikator status (draft, saved, published)
  - Implementasi fitur revisi dan riwayat versi

```jsx
// Implementasi auto-save draft
useEffect(() => {
  const autoSaveTimer = setTimeout(() => {
    if (title && content) {
      saveDraft();
    }
  }, 30000); // Auto-save setiap 30 detik

  return () => clearTimeout(autoSaveTimer);
}, [title, content]);

const saveDraft = async () => {
  setIsSaving(true);
  try {
    const response = await fetch("/api/journal/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.customToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        status: "draft",
      }),
    });

    if (!response.ok) throw new Error("Failed to save draft");

    const data = await response.json();
    setJournalId(data.id);

    toast({
      title: "Draft Tersimpan",
      description: "Draft jurnal Anda telah tersimpan otomatis.",
      variant: "success",
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    toast({
      title: "Gagal Menyimpan",
      description: "Terjadi kesalahan saat menyimpan draft.",
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
};
```

## 4. Implementasi Verifikasi dengan Barcode

- **Masalah**: Verifikasi saat ini hanya menggunakan teks kunci publik
- **Solusi**:
  - Tambahkan fitur QR code untuk verifikasi
  - Implementasi scanner QR code untuk upload kunci publik
  - Buat sistem verifikasi dengan dua opsi: input manual dan scan QR code

```jsx
// Implementasi QR code untuk verifikasi
import QRCode from "qrcode.react";
import { QrScanner } from "@yudiel/react-qr-scanner";

// Generate QR code untuk tanda tangan
const generateSignatureQR = (journal) => {
  const signatureData = JSON.stringify({
    id: journal.id,
    title: journal.title,
    authorId: journal.authorId,
    signature: journal.signature,
    timestamp: journal.updatedAt,
  });

  return (
    <QRCode value={signatureData} size={200} level={"H"} includeMargin={true} />
  );
};

// Scanner QR code untuk verifikasi
const [showScanner, setShowScanner] = useState(false);

const handleScan = (data) => {
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      setSignatureData(parsedData);
      setShowScanner(false);
      verifyWithQRData(parsedData);
    } catch (e) {
      toast({
        title: "QR Code Tidak Valid",
        description: "Format QR code tidak sesuai.",
        variant: "destructive",
      });
    }
  }
};
```

## 5. Laporan dan Dashboard Analitik

- **Masalah**: Tidak ada cara untuk melacak dan menganalisis jurnal
- **Solusi**:
  - Tambahkan dashboard analitik dengan metrik utama
  - Implementasi laporan aktivitas dan riwayat verifikasi
  - Tambahkan visualisasi data untuk jurnal yang paling banyak diakses

## 6. Fitur Berbagi dan Kolaborasi

- **Masalah**: Tidak ada fitur untuk berbagi dan berkolaborasi pada jurnal
- **Solusi**:
  - Tambahkan fitur berbagi dengan kontrol akses (view, edit, verify)
  - Implementasi kolaborasi real-time (multi-user editing)
  - Tambahkan notifikasi untuk aktivitas kolaborasi

## Timeline Implementasi

1. **Minggu 1**: Perbaikan Dashboard dan integrasi dengan API backend
2. **Minggu 2**: Perbaikan fitur Ekspor Jurnal dan pembuatan jurnal
3. **Minggu 3**: Implementasi fitur verifikasi dengan Barcode/QR Code
4. **Minggu 4**: Pengembangan fitur analitik dan berbagi

## Catatan Teknis

- Pastikan middleware autentikasi berfungsi dengan benar untuk semua endpoint API
- Upgrade Prisma ORM jika diperlukan untuk mendukung fitur baru
- Pastikan semua fitur keamanan (ECDSA, JWT) berfungsi dengan baik secara end-to-end
- Lakukan testing khusus untuk fitur barcode/QR code di berbagai perangkat
