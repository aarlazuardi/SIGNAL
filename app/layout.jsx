import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import Navbar from "../components/navbar";
import { AuthProvider } from "../components/auth-provider";
import { NextAuthProvider } from "../components/next-auth-provider";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SIGNAL - Platform Penandatanganan Jurnal Digital",
  description:
    "Platform penandatanganan jurnal digital dengan algoritma ECDSA P-256",
  generator: "v0.dev",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      </head>{" "}
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <div className="flex-1 w-full max-w-full overflow-hidden">
                  {children}
                </div>
                <footer className="border-t py-4 sm:py-5">
                  <div className="container px-4 sm:px-6 md:px-8 flex flex-col items-center justify-between gap-2 sm:gap-3 md:flex-row">
                    <p className="text-center text-xs sm:text-sm text-muted-foreground">
                      &copy; {new Date().getFullYear()} SIGNAL. Hak Cipta
                      Dilindungi.
                    </p>
                    <div className="flex gap-4 text-xs sm:text-sm text-muted-foreground">
                      <a href="/about" className="hover:underline">
                        Tentang
                      </a>
                      <a href="/verify" className="hover:underline">
                        Verifikasi
                      </a>
                    </div>
                  </div>
                </footer>
              </div>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
