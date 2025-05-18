import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";

/**
 * Konfigurasi NextAuth untuk autentikasi
 */
export const authOptions = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          publicKey: user.publicKey,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Jika login dengan Google, cek apakah user sudah ada di DB
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Buat user baru untuk login Google
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Google User",
              // Buat password random untuk user Google
              password: await bcrypt.hash(Math.random().toString(36), 10),
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Saat login berhasil, tambahkan data user ke token
        token.userId = user.id;
        // Buat JWT kustom dengan JWT_SECRET dari .env
        token.customToken = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || "fallback-secret",
          { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );
      }
      return token;
    },
    async session({ session, token }) {
      // Tambahkan userId dan custom token ke sesi
      session.user.id = token.userId;
      session.customToken = token.customToken;
      return session;
    },
  },
  pages: {
    signIn: "/login", // URL halaman login kustom
    error: "/login", // URL halaman error
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 hari
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
