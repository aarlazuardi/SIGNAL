/**
 * Database client singleton untuk Prisma
 */

import { PrismaClient } from "@prisma/client";

// Deklarasi variabel global untuk PrismaClient
const globalForPrisma = global;

// Simpan instance PrismaClient sebagai variabel global selama development
// untuk mencegah terlalu banyak koneksi dibuat selama hot-reloading
let prisma;

try {
  console.log("Initializing PrismaClient...");
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ["query", "error"],
    });
  console.log("PrismaClient initialized successfully");
} catch (error) {
  console.error("Error initializing PrismaClient:", error);
  throw error;
}

// Cegah pembuatan lebih dari satu instance selama development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
