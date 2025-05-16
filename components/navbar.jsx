"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu, X, Shield, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "./auth-provider";
import LoginModal from "./login-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navbar() {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();

  // Close mobile menu when path changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  const navigation = [
    { name: "Beranda", href: "/" },
    { name: "Buat Jurnal", href: "/create", requiresAuth: true },
    { name: "Ekspor Jurnal", href: "/export", requiresAuth: true },
    { name: "Verifikasi", href: "/verify" },
    { name: "Tentang", href: "/about" },
  ];

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" />
          <Link href="/" className="text-xl font-bold">
            SIGNAL
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <ul className="flex gap-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  {item.requiresAuth && !isAuthenticated ? (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                        isActive ? "text-foreground" : "text-foreground/60"
                      }`}
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                        isActive ? "text-foreground" : "text-foreground/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2 ml-6">
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline-block">
                      {user?.name || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </nav>
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <ThemeToggle />
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-emerald-600" />
                  <Link href="/" className="text-xl font-bold">
                    SIGNAL
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <nav className="mt-8">
                <ul className="flex flex-col gap-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        {item.requiresAuth && !isAuthenticated ? (
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setShowLoginModal(true);
                            }}
                            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                              isActive
                                ? "text-foreground"
                                : "text-foreground/60"
                            }`}
                          >
                            {item.name}
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                              isActive
                                ? "text-foreground"
                                : "text-foreground/60"
                            }`}
                          >
                            {item.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 border-t pt-6">
                  {isAuthenticated ? (
                    <>
                      <div className="mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>{user?.name || "User"}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/profile">Profil</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            logout();
                            setShowMobileMenu(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Keluar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLoginModal(true);
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </header>
  );
}
