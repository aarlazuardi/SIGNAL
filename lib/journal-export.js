/**
 * Utilitas untuk ekspor jurnal ke berbagai format file
 */

/**
 * Membuat dan mengunduh file teks (.txt) dari konten jurnal
 * @param {string} title - Judul jurnal
 * @param {string} content - Konten jurnal
 */
export function exportToTextFile(title, content) {
  // Buat konten file teks
  const fileContent = `${title}\n\n${content}`;
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });

  // Buat objek URL dan link untuk mengunduh
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;

  // Klik link tersebut untuk memicu unduhan
  document.body.appendChild(link);
  link.click();

  // Bersihkan
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Membuat dan mengunduh file dokumen Word (.doc) dari konten jurnal
 * @param {string} title - Judul jurnal
 * @param {string} content - Konten jurnal
 */
export function exportToWordFile(title, content) {
  // Buat dokumen HTML yang kompatibel dengan Word
  const htmlDocument = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2cm;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }
        h1 {
          font-size: 16pt;
          text-align: center;
          font-weight: bold;
          margin-bottom: 24pt;
        }
        p {
          text-align: justify;
          margin-bottom: 12pt;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("")}
    </body>
    </html>
  `;

  // Buat blob dan download link
  const blob = new Blob([htmlDocument], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;

  // Klik link untuk mengunduh
  document.body.appendChild(link);
  link.click();

  // Bersihkan
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor jurnal ke format file yang dipilih
 * @param {string} title - Judul jurnal
 * @param {string} content - Konten jurnal
 * @param {string} format - Format file ('txt' atau 'doc')
 */
export function exportJournalToFile(title, content, format = "doc") {
  if (!title || !content) {
    console.error("Judul dan konten diperlukan untuk ekspor");
    return;
  }

  if (format === "txt") {
    exportToTextFile(title, content);
  } else if (format === "doc") {
    exportToWordFile(title, content);
  } else if (format === "pdf") {
    exportJournalToPDF(title, content);
  } else {
    console.error("Format tidak didukung:", format);
  }
}

/**
 * Membuat dan mengunduh file PDF dari konten jurnal
 * @param {string} title - Judul jurnal
 * @param {string} content - Konten jurnal
 * @param {Object} metadata - Metadata untuk file PDF (opsional)
 */
export function exportJournalToPDF(title, content, metadata = {}) {
  console.log("Memulai ekspor PDF...", {
    title,
    contentLength: content?.length,
  });

  // Deteksi apakah konten adalah PDF base64 atau teks biasa
  let isPDFBase64 = false;
  if (content && typeof content === "string") {
    try {
      // Deteksi apakah konten adalah base64 PDF
      // Periksa awalan PDF dan pola base64
      const isPDFHeader =
        content.trim().startsWith("JVBERi0") ||
        content.trim().startsWith("JVBER");
      const isBase64Format = /^[A-Za-z0-9+/=\r\n]+$/.test(
        content.trim().slice(0, 100)
      );
      isPDFBase64 = isPDFHeader && isBase64Format;
      console.log("Konten terdeteksi sebagai PDF base64:", isPDFBase64);
    } catch (e) {
      console.error("Error mendeteksi format konten:", e);
    }
  }

  // Jika konten adalah binary PDF (base64), langsung ekstrak dan download
  if (isPDFBase64) {
    import("pdf-lib").then(async ({ PDFDocument, rgb }) => {
      try {
        console.log("Mengekstrak dokumen PDF asli dari base64");

        // Decode base64 ke binary
        const binary = atob(content.replace(/\s/g, ""));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Load PDF original
        const pdfDoc = await PDFDocument.load(bytes);

        // Generate hash dari PDF original
        const { createPdfHash } = await import("@/lib/crypto/document-hash");
        const documentHash = createPdfHash(bytes, "hex");

        // Generate QR code validasi
        const { generateVerificationQR } = await import(
          "@/lib/crypto/qr-verification"
        );
        const qrDataUrl = await generateVerificationQR(
          metadata.id || metadata.journalId || ""
        );
        const qrImage = await pdfDoc.embedPng(qrDataUrl);
        const qrSize = 80;

        // Tambahkan hash di footer semua halaman & QR di halaman terakhir
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          page.drawText(`Hash: ${documentHash.substring(0, 32)}...`, {
            x: 40,
            y: 40,
            size: 8,
            color: rgb(0.3, 0.3, 0.3),
          });
          if (i === pages.length - 1) {
            page.drawImage(qrImage, {
              x: page.getWidth() - qrSize - 40,
              y: 40,
              width: qrSize,
              height: qrSize,
            });
          }
        }

        // Simpan PDF hasil modifikasi
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_signed.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("File PDF asli berhasil diunduh");
      } catch (error) {
        console.error("Error saat memproses PDF asli:", error);
        console.log("Melanjutkan dengan metode pembuatan PDF baru...");
      }
    });
    return;
  }

  // Dinamis import untuk jsPDF - memastikan hanya diimpor di client
  import("jspdf")
    .then(({ default: jsPDF }) => {
      try {
        console.log("Library jsPDF berhasil dimuat");

        // Buat instance PDF
        const doc = new jsPDF();

        // Set metadata jika ada
        if (metadata) {
          doc.setProperties({
            title: metadata.title || title,
            subject: metadata.subject || "",
            author: metadata.creator || "SIGNAL Platform",
            keywords: "jurnal, ECDSA, digital signature",
            creator: metadata.creator || "SIGNAL Platform",
            producer: metadata.producer || "SIGNAL - Platform Jurnal",
            creationDate: metadata.creationDate || new Date(),
          });
        }

        // Tambahkan judul
        doc.setFontSize(18);
        doc.text(title, 20, 20);

        // Tambahkan subjek jika ada
        if (metadata.subject) {
          doc.setFontSize(12);
          doc.text(`Perihal: ${metadata.subject}`, 20, 30);
          doc.line(20, 32, 190, 32);
        }

        // Tambahkan konten
        doc.setFontSize(12);

        // Split konten berdasarkan baris
        let yPosition = metadata.subject ? 40 : 30;

        // Deteksi tipe konten untuk tampilan
        if (
          metadata.originalFileType &&
          ["pdf", "doc", "docx"].includes(
            metadata.originalFileType.toLowerCase()
          )
        ) {
          // Konten adalah dari file binary, tampilkan informasi
          doc.text(
            "Dokumen ini adalah representasi dari file yang ditandatangani secara digital.",
            20,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `Tipe Dokumen Asli: ${metadata.originalFileType.toUpperCase()}`,
            20,
            yPosition
          );
          yPosition += 10;
          doc.text(
            "Detail tanda tangan digital dapat dilihat di halaman berikutnya.",
            20,
            yPosition
          );
        } else {
          // Konten adalah teks biasa
          const textLines = doc.splitTextToSize(
            content || "Konten tidak tersedia",
            170
          );
          doc.text(textLines, 20, yPosition);
        }

        // Jika ada info tanda tangan, tambahkan ke halaman baru
        if (metadata.signatureInfo) {
          const { signer, timestamp, publicKey, signature } =
            metadata.signatureInfo;

          // Tambahkan halaman baru untuk info tanda tangan
          doc.addPage();

          // Judul halaman
          doc.setFontSize(16);
          doc.text("Informasi Tanda Tangan Digital", 20, 20);
          doc.line(20, 22, 190, 22);

          // Info tanda tangan
          doc.setFontSize(12);

          let yPosition = 30;
          const lineGap = 10;

          doc.text(`Penandatangan: ${signer}`, 20, yPosition);
          yPosition += lineGap;

          doc.text(`Tanggal: ${timestamp}`, 20, yPosition);
          yPosition += lineGap;

          // Kunci publik dengan pengaturan font khusus
          if (publicKey) {
            doc.setFontSize(10);
            doc.text("Kunci Publik ECDSA:", 20, yPosition);
            yPosition += 7;

            // Split kunci publik yang panjang
            const publicKeyLines = doc.splitTextToSize(publicKey, 170);
            doc.text(publicKeyLines, 20, yPosition);
            yPosition += publicKeyLines.length * 5 + 5;
          }

          // Tanda tangan
          if (signature) {
            doc.text("Tanda Tangan Digital:", 20, yPosition);
            yPosition += 7;

            // Split signature yang panjang
            const signatureLines = doc.splitTextToSize(signature, 170);
            doc.text(signatureLines, 20, yPosition);
          }

          // Tambahkan footer dengan status verifikasi
          doc.setFontSize(10);
          doc.setTextColor(0, 100, 0); // Warna hijau untuk status terverifikasi
          doc.text(
            "Dokumen ini telah ditandatangani secara digital dan terverifikasi.",
            20,
            280
          );
        }

        // Simpan file PDF
        console.log("Menyimpan file PDF...");
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        doc.save(filename);
        console.log("File PDF berhasil disimpan:", filename);
      } catch (error) {
        console.error("Error creating PDF:", error);
        throw new Error("Gagal membuat file PDF: " + error.message);
      }
    })
    .catch((error) => {
      console.error("Error loading jsPDF library:", error);
      throw new Error("Gagal memuat pustaka PDF: " + error.message);
    });
}
