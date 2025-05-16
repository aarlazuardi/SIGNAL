"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "./auth-provider";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function LoginModal({ isOpen, onClose, redirectPath }) {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    // Mock Google login logic
    alert("Google login (mocked)");
    onClose();
    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      await login(loginEmail, loginPassword);
      onClose();
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      setLoginError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegistering(true);

    try {
      await register(registerName, registerEmail, registerPassword);
      onClose();
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      setRegisterError("Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Akun SIGNAL</DialogTitle>
          <DialogDescription>
            Masuk atau daftar untuk mengakses semua fitur SIGNAL.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue="login"
          value={activeTab}
          onTabChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 py-4">
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
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-emerald-600"
                  >
                    Lupa password?
                  </Button>
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
              {loginError && (
                <div className="text-sm text-red-500">{loginError}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Memproses..." : "Login"}
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
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nama Lengkap"
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
                    placeholder="nama@contoh.com"
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
                    placeholder="Password"
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
                      {showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password-confirm">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-password-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Konfirmasi password"
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
                      {showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    </span>
                  </button>
                </div>
                {registerPasswordConfirm && registerPassword !== registerPasswordConfirm && (
                  <div className="text-sm text-red-500">Password tidak sama</div>
                )}
              </div>
              {registerError && (
                <div className="text-sm text-red-500">{registerError}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isRegistering || registerPassword !== registerPasswordConfirm}
              >
                {isRegistering ? "Memproses..." : "Daftar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
