/**
 * API endpoint untuk memverifikasi jurnal berdasarkan QR Code
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifySignature, extractSignatureInfo } from "@/lib/crypto/ecdsa";
import { extractQRData } from "@/lib/crypto/qr-verification";

export async function POST(request) {
  try {
    // Parse request body
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: "Data QR code diperlukan" },
        { status: 400 }
      );
    }

    // Ekstrak data dari QR code
    const extractedData = extractQRData(qrData);

    // Handle berdasarkan tipe data
    if (extractedData.type === "url" || extractedData.type === "json") {
      // Ekstrak ID jurnal
      const journalId = extractedData.data.journalId || extractedData.data.id;

      if (!journalId) {
        return NextResponse.json(
          { error: "ID jurnal tidak ditemukan dalam QR code" },
          { status: 400 }
        );
      }

      // Ambil jurnal berdasarkan ID
      const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!journal) {
        return NextResponse.json(
          { error: "Jurnal tidak ditemukan" },
          { status: 404 }
        );
      }

      // Jika jurnal ditemukan tapi belum ditandatangani
      if (!journal.signature || !journal.publicKey) {
        return NextResponse.json({
          verified: false,
          message: "Jurnal belum ditandatangani secara digital",
          journal: {
            id: journal.id,
            title: journal.title,
            author: journal.user ? journal.user.name : "Unknown",
            verified: false,
          },
        });
      }

      // Verifikasi tanda tangan
      const isSignatureValid = verifySignature(
        journal.content,
        journal.signature,
        journal.publicKey
      );

      return NextResponse.json({
        verified: isSignatureValid,
        journal: {
          id: journal.id,
          title: journal.title,
          author: journal.user ? journal.user.name : "Unknown",
          email: journal.user ? journal.user.email : null,
          verified: isSignatureValid,
          signedAt: journal.updatedAt,
        },
        message: isSignatureValid
          ? "Tanda tangan digital valid"
          : "Tanda tangan digital tidak valid",
      });
    } else if (extractedData.type === "unknown") {
      // Coba ekstrak info dari teks dokumen yang mungkin berisi metadata tanda tangan
      const signatureInfo = extractSignatureInfo(qrData);

      if (signatureInfo && signatureInfo.verificationId) {
        // Temukan jurnal berdasarkan ID verifikasi
        const journal = await prisma.journal.findUnique({
          where: { id: signatureInfo.verificationId },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        if (journal) {
          const isSignatureValid =
            journal.signature && journal.publicKey
              ? verifySignature(
                  journal.content,
                  journal.signature,
                  journal.publicKey
                )
              : false;

          return NextResponse.json({
            verified: isSignatureValid,
            journal: {
              id: journal.id,
              title: journal.title,
              author: journal.user ? journal.user.name : "Unknown",
              verified: isSignatureValid,
            },
            message: isSignatureValid
              ? "Dokumen terverifikasi berdasarkan metadata yang diekstrak"
              : "Metadata ditemukan tetapi tanda tangan tidak valid",
          });
        }
      }

      return NextResponse.json({
        verified: false,
        message:
          "Format QR code tidak dikenali atau tidak berisi informasi verifikasi yang valid",
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: "Terjadi kesalahan saat memproses QR code",
        error: extractedData.error || "Unknown error",
      });
    }
  } catch (error) {
    console.error("QR verification error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi QR code" },
      { status: 500 }
    );
  }
}
