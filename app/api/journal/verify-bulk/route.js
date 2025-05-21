/**
 * API endpoint untuk memverifikasi jurnal secara massal
 */
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/middleware/auth";
import prisma from "@/lib/db/prisma";
import { verifySignature } from "@/lib/crypto/ecdsa";

export async function POST(request) {
  try {
    // Optional: Get user from token (for admin features)
    const user = await getUserFromToken(request);

    // Parse request body
    const { journalIds } = await request.json();

    if (!journalIds || !Array.isArray(journalIds) || journalIds.length === 0) {
      return NextResponse.json(
        { error: "Daftar ID jurnal diperlukan" },
        { status: 400 }
      );
    }

    // Batasi jumlah jurnal yang bisa diverifikasi sekaligus
    if (journalIds.length > 50) {
      return NextResponse.json(
        { error: "Maksimal 50 jurnal dapat diverifikasi sekaligus" },
        { status: 400 }
      );
    }

    // Ambil jurnal-jurnal yang akan diverifikasi
    const journals = await prisma.journal.findMany({
      where: {
        id: { in: journalIds },
      },
      select: {
        id: true,
        content: true,
        signature: true,
        publicKey: true,
        verified: true,
        title: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Lakukan verifikasi untuk setiap jurnal
    const verificationResults = journals.map((journal) => {
      let verificationStatus = "unknown";
      let isVerified = false;

      if (!journal.signature || !journal.publicKey) {
        verificationStatus = "unsigned";
      } else {
        // Verifikasi tanda tangan
        isVerified = verifySignature(
          journal.content,
          journal.signature,
          journal.publicKey
        );
        verificationStatus = isVerified ? "valid" : "invalid";
      }

      return {
        id: journal.id,
        title: journal.title,
        author: journal.user?.name || "Unknown",
        verificationStatus,
        verified: isVerified,
      };
    });

    // Hitung statistik
    const stats = {
      total: verificationResults.length,
      valid: verificationResults.filter((r) => r.verificationStatus === "valid")
        .length,
      invalid: verificationResults.filter(
        (r) => r.verificationStatus === "invalid"
      ).length,
      unsigned: verificationResults.filter(
        (r) => r.verificationStatus === "unsigned"
      ).length,
      notFound: journalIds.length - verificationResults.length,
    };

    return NextResponse.json({
      stats,
      results: verificationResults,
    });
  } catch (error) {
    console.error("Bulk verification error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi jurnal secara massal" },
      { status: 500 }
    );
  }
}
