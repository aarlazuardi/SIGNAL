"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
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
    { name: "Upload Jurnal", href: "/export", requiresAuth: true },
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
      <div className="container flex h-14 items-center px-3 sm:px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-1 sm:gap-2">
          <Shield className="h-[1.2rem] w-[1.2rem] text-emerald-600" />
          <span className="text-lg font-bold leading-none">SIGNAL</span>
        </Link>
        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center mx-6 lg:mx-10 flex-1">
          <ul className="flex items-center gap-3 lg:gap-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name} className="flex items-center">
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
                  )}{" "}
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
          {/* User Menu - Hidden on Mobile */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="inline-flex items-center gap-2 h-9 px-3"
                  >
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="hidden sm:inline-block text-sm leading-none">
                      {user?.name || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  
                  <DropdownMenuItem asChild className="text-sm py-1.5">
                    <Link href="/profile">Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-sm py-1.5">
                    <LogOut className="mr-2 h-[1.2rem] w-[1.2rem]" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm px-3 inline-flex items-center"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="mr-2 h-[1.2rem] w-[1.2rem]" />{" "}
                <span className="leading-none">Login</span>
              </Button>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center justify-center"
                  aria-label="Buka menu navigasi"
                  aria-expanded={showMobileMenu}
                >
                  {" "}
                  <Menu className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-[280px] sm:max-w-[320px] p-0"
              >
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <div className="flex items-center justify-between h-14 px-4 border-b">
                  <div className="inline-flex items-center gap-1.5">
                    <Shield className="h-[1.2rem] w-[1.2rem] text-emerald-600" />
                    <Link
                      href="/"
                      className="text-lg font-bold leading-none"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      SIGNAL
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 p-0 ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center justify-center"
                    aria-label="Tutup menu"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <X className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Tutup</span>
                  </Button>
                </div>
                <nav className="px-4 py-4">
                  <ul className="flex flex-col space-y-3">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name} className="py-0.5">
                          {item.requiresAuth && !isAuthenticated ? (
                            <button
                              onClick={() => {
                                setShowMobileMenu(false);
                                setShowLoginModal(true);
                              }}
                              className={`text-base font-medium transition-colors rounded-md px-2 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                                isActive
                                  ? "text-foreground font-semibold bg-gray-100 dark:bg-gray-800"
                                  : "text-foreground/60"
                              }`}
                            >
                              {item.name}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              className={`text-base font-medium transition-colors rounded-md px-2 py-2 w-full block hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                                isActive
                                  ? "text-foreground font-semibold bg-gray-100 dark:bg-gray-800"
                                  : "text-foreground/60"
                              }`}
                              onClick={() => setShowMobileMenu(false)}
                            >
                              {item.name}{" "}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-medium">Theme</div>
                      <ThemeToggle />
                    </div>
                    {isAuthenticated ? (
                      <>
                        <div className="mb-4 inline-flex items-center gap-2">
                          <User className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                          <span className="text-base leading-none">
                            {user?.name || "User"}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-2.5">
                          
                          <Button
                            variant="outline"
                            className="h-10 text-base justify-start"
                            asChild
                          >
                            <Link
                              href="/profile"
                              onClick={() => setShowMobileMenu(false)}
                            >
                              Profil
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-10 text-base mt-2 inline-flex items-center"
                            onClick={() => {
                              logout();
                              setShowMobileMenu(false);
                            }}
                          >
                            <LogOut className="mr-2 h-[1.2rem] w-[1.2rem]" />
                            <span className="leading-none">Keluar</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 text-base inline-flex items-center"
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowLoginModal(true);
                        }}
                      >
                        <LogIn className="mr-2 h-[1.2rem] w-[1.2rem]" />
                        <span className="leading-none">Login</span>
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
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
