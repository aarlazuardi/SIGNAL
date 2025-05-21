/**
 * API endpoint untuk operasi batch pada jurnal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request) {
  try {
    // Dapatkan user dari token
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { operations } = await request.json();

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: "Daftar operasi diperlukan" },
        { status: 400 }
      );
    }

    // Batasi jumlah operasi yang bisa dilakukan sekaligus
    if (operations.length > 20) {
      return NextResponse.json(
        { error: "Maksimal 20 operasi dapat dilakukan sekaligus" },
        { status: 400 }
      );
    }

    // Hasil operasi
    const results = [];

    // Lakukan setiap operasi dalam batch
    for (const op of operations) {
      const { type, journalId, data } = op;

      // Validasi operasi
      if (!type || !journalId) {
        results.push({
          success: false,
          journalId: journalId || null,
          error: "Tipe operasi dan ID jurnal diperlukan",
        });
        continue;
      }

      try {
        // Periksa apakah jurnal ada dan milik user
        const journal = await prisma.journal.findUnique({
          where: { id: journalId },
        });

        if (!journal) {
          results.push({
            success: false,
            journalId,
            error: "Jurnal tidak ditemukan",
          });
          continue;
        }

        if (journal.userId !== user.id) {
          results.push({
            success: false,
            journalId,
            error: "Anda tidak memiliki akses untuk jurnal ini",
          });
          continue;
        }

        // Lakukan operasi berdasarkan tipe
        switch (type) {
          case "delete":
            // Hapus jurnal
            await prisma.journal.delete({
              where: { id: journalId },
            });
            results.push({
              success: true,
              journalId,
              operation: "delete",
            });
            break;

          case "update":
            // Validasi: Jurnal yang sudah diverifikasi tidak dapat diubah
            if (journal.verified) {
              results.push({
                success: false,
                journalId,
                error: "Jurnal yang sudah ditandatangani tidak dapat diubah",
              });
              continue;
            }

            // Pastikan ada data yang akan diupdate
            if (!data || (data && !data.title && !data.content)) {
              results.push({
                success: false,
                journalId,
                error: "Data update diperlukan",
              });
              continue;
            }

            // Update jurnal
            const updateData = {};
            if (data.title) updateData.title = data.title;
            if (data.content) updateData.content = data.content;

            await prisma.journal.update({
              where: { id: journalId },
              data: updateData,
            });

            results.push({
              success: true,
              journalId,
              operation: "update",
            });
            break;

          default:
            results.push({
              success: false,
              journalId,
              error: `Tipe operasi '${type}' tidak didukung`,
            });
        }
      } catch (opError) {
        console.error(
          `Error in batch operation ${type} for journal ${journalId}:`,
          opError
        );
        results.push({
          success: false,
          journalId,
          error: `Terjadi kesalahan pada operasi ${type}: ${opError.message}`,
        });
      }
    }

    // Hitung statistik
    const stats = {
      total: operations.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };

    return NextResponse.json({
      stats,
      results,
    });
  } catch (error) {
    console.error("Batch operation error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat melakukan operasi batch" },
      { status: 500 }
    );
  }
}
