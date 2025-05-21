import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyJWT } from "@/middleware/auth";

export async function POST(request) {
  try {
    // Verify authentication token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Sesi login Anda telah berakhir" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Process the form data
    const formData = await request.formData();

    // Extract and validate the data
    const name = formData.get("name");
    const passhash = formData.get("passhash");
    const avatarFile = formData.get("avatar");

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Initialize update data with name
    const updateData = {
      name: name.trim(),
    };    // Process passhash if provided
    if (passhash) {
      if (passhash.length < 6) {
        return NextResponse.json(
          { error: "Passhash harus minimal 6 karakter" },
          { status: 400 }
        );
      }

      console.log("Setting passhash in profile:", {
        value: passhash.substring(0, 3) + '...',
        length: passhash.length,
        type: typeof passhash
      });

      updateData.signature = passhash;
    }

    // Process avatar if provided
    if (avatarFile && avatarFile instanceof File) {
      // Validate file type
      if (!avatarFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File avatar harus berupa gambar" },
          { status: 400 }
        );
      }

      // Validate file size (max 2MB)
      if (avatarFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file avatar terlalu besar. Maksimal 2MB" },
          { status: 400 }
        );
      }

      // Convert avatar to base64 for storage
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const avatarData = `data:${avatarFile.type};base64,${base64}`;

      updateData.avatar = avatarData;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Remove sensitive data from response
    const { password, ...userData } = updatedUser;

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: userData,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui profil" },
      { status: 500 }
    );
  }
}
