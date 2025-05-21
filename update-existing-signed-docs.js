// Script untuk memperbarui dokumen yang sudah ditandatangani
// Menambahkan nilai originalHash sama dengan hash untuk dokumen yang sudah ada
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateExistingDocuments() {
  try {
    console.log("Memulai proses update dokumen yang sudah ditandatangani...");

    // Ambil semua dokumen yang sudah ditandatangani namun tidak memiliki originalHash
    const signedDocuments = await prisma.signedDocument.findMany({
      where: {
        originalHash: null,
      },
    });

    console.log(
      `Ditemukan ${signedDocuments.length} dokumen yang perlu diperbarui`
    );

    let updateCount = 0;
    for (const doc of signedDocuments) {
      // Update originalHash sama dengan hash
      await prisma.signedDocument.update({
        where: { id: doc.id },
        data: { originalHash: doc.hash },
      });
      updateCount++;
      console.log(
        `${updateCount}/${signedDocuments.length}: Dokumen ${doc.id} diperbarui`
      );
    }

    console.log(`Berhasil memperbarui ${updateCount} dokumen!`);
  } catch (error) {
    console.error("Error updating signed documents:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingDocuments();
