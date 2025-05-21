"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Save, Upload, User, Key } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useToast } from "../hooks/use-toast";

export default function ProfilePage() {
  const { user, updateUserData } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passhash, setPasshash] = useState("");
  const [confirmPasshash, setConfirmPasshash] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarPreview(user.avatar || null);
      setLoading(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        addToast("Ukuran file terlalu besar. Maksimal 2MB.");
        e.target.value = ""; // Reset file input
        return;
      }

      // Check file type (only images)
      if (!file.type.startsWith("image/")) {
        addToast("Format file tidak didukung. Gunakan format gambar.");
        e.target.value = ""; // Reset file input
        return;
      }

      setAvatar(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validatePasshash = () => {
    if (!passhash) return true; // If no passhash entered, it's valid (not changing)

    if (passhash.length < 6) {
      addToast("Passhash harus minimal 6 karakter.");
      return false;
    }

    if (passhash !== confirmPasshash) {
      addToast("Konfirmasi passhash tidak cocok.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validatePasshash()) return;

    if (!name.trim()) {
      addToast("Nama tidak boleh kosong.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);

      if (passhash) {
        formData.append("passhash", passhash);
      }

      if (avatar) {
        formData.append("avatar", avatar);
      }

      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        addToast("Sesi login Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memperbarui profil.");
      }

      const updatedUser = await updateUserData();

      addToast("Profil berhasil diperbarui.");

      // Reset passhash fields
      setPasshash("");
      setConfirmPasshash("");
    } catch (error) {
      console.error("Update profile error:", error);
      addToast(error.message || "Terjadi kesalahan saat memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 text-4xl font-semibold">Memuat...</div>
          <p className="text-lg text-muted-foreground">
            Mengambil data profil Anda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Kembali</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profil Saya</h1>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Informasi Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreview || user?.avatar || "/placeholder-user.jpg"}
                  alt={name || "User"}
                />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <div>
                <Label htmlFor="avatar" className="mb-2 block">
                  Foto Profil
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="max-w-xs"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                readOnly
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            {/* Passhash */}
            <div className="space-y-2">
              <Label htmlFor="passhash">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Passhash untuk Penandatanganan</span>
                </div>
              </Label>
              <Input
                id="passhash"
                type="password"
                value={passhash}
                onChange={(e) => setPasshash(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              <p className="text-xs text-muted-foreground">
                Passhash digunakan untuk menandatangani dokumen
              </p>
            </div>

            {/* Confirm Passhash */}
            {passhash && (
              <div className="space-y-2">
                <Label htmlFor="confirmPasshash">Konfirmasi Passhash</Label>
                <Input
                  id="confirmPasshash"
                  type="password"
                  value={confirmPasshash}
                  onChange={(e) => setConfirmPasshash(e.target.value)}
                  placeholder="Konfirmasi passhash baru"
                />
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
