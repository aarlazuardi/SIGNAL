"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function LoginRegisterPage() {
  const { addToast: toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState("login");
  // Login state
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({
    title: "",
    description: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Implementasi login - ganti dengan API call asli Anda
      // Mock successful login untuk demo
      // Tampilkan dialog sukses
      setDialogMessage({
        title: "Login Berhasil!",
        description: "Selamat datang kembali di platform SIGNAL.",
      });
      setShowSuccessDialog(true);

      // Arahkan ke dashboard setelah beberapa detik
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Login Gagal",
        description: error.message || "Terjadi kesalahan saat login.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // Implementasi register - ganti dengan API call asli Anda
      // Mock successful registration untuk demo
      // Tampilkan dialog sukses
      setDialogMessage({
        title: "Registrasi Berhasil!",
        description:
          "Akun Anda telah berhasil dibuat. Selamat datang di platform SIGNAL.",
      });
      setShowSuccessDialog(true);

      // Arahkan ke dashboard setelah beberapa detik
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Registrasi Gagal",
        description: error.message || "Terjadi kesalahan saat registrasi.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    // Mock Google login logic
    setDialogMessage({
      title: "Login Google Berhasil!",
      description: "Anda telah berhasil login menggunakan akun Google.",
    });
    setShowSuccessDialog(true);

    // Arahkan ke dashboard setelah beberapa detik
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex justify-center gap-8 mb-6">
          <button
            onClick={() => setTab("login")}
            className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
              tab === "login"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab("register")}
            className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
              tab === "register"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Daftar
          </button>
        </div>
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  className="pl-10"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                  <span className="sr-only">
                    {showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"}
                  </span>
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Login
            </Button>
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-2 text-xs text-muted-foreground">atau</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="h-5 w-5" />
              <span>Login dengan Google</span>
            </Button>{" "}
            <div className="mt-4 text-center text-sm">
              Belum memiliki akun?
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-emerald-600 hover:underline"
              >
                Daftar sekarang
              </button>
            </div>
          </form>
        )}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="pl-10"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                  <span className="sr-only">
                    {showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"}
                  </span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password-confirm">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="register-password-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                  <span className="sr-only">
                    {showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"}
                  </span>
                </button>
              </div>
              {registerPasswordConfirm &&
                registerPassword !== registerPasswordConfirm && (
                  <div className="text-sm text-red-500">
                    Password tidak sama
                  </div>
                )}
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={registerPassword !== registerPasswordConfirm}
            >
              Daftar
            </Button>{" "}
            <div className="mt-4 text-center text-sm">
              Sudah memiliki akun?
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-emerald-600 hover:underline"
              >
                Masuk
              </button>
            </div>
          </form>
        )}
      </div>{" "}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-6 w-6" />
              {dialogMessage.title}
            </DialogTitle>
            <DialogDescription>{dialogMessage.description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <div className="animate-pulse text-emerald-600 mt-2">
              Mengalihkan ke dashboard...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
