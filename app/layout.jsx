import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import Navbar from "../components/navbar";
import { AuthProvider } from "../components/auth-provider";
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1">{children}</div>
              <footer className="border-t py-6">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                  <p className="text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} SIGNAL. Hak Cipta
                    Dilindungi.
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <a href="/about" className="hover:underline">
                      Tentang
                    </a>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
