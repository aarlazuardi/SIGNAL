"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Provider untuk Next Auth Session
 * Digunakan untuk menyediakan session NextAuth ke seluruh aplikasi
 */
export function NextAuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
