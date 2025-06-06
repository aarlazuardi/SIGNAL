/**
 * Middleware untuk autentikasi dengan JWT
 * Digunakan untuk melindungi endpoint API
 */

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "../lib/db/prisma";

/**
 * Verifikasi token JWT
 * @param {string} token - Token JWT yang akan diverifikasi
 * @returns {object|null} - Payload token jika valid, null jika tidak
 */
export function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

/**
 * Middleware untuk autentikasi dengan JWT
 * @param {Request} request - Request Next.js
 * @returns {NextResponse} - Response Next.js
 * @throws {Error} - Jika token tidak valid atau tidak ditemukan
 */
export async function auth(request) {
  try {
    // Periksa header Authorization
    const authHeader = request.headers.get("authorization");
    console.log(
      `[AUTH] Authorization header: ${authHeader ? "Present" : "Missing"}`
    );

    // Debug headers untuk pemecahan masalah
    // console.log('[AUTH] Request headers:', Object.fromEntries([...request.headers.entries()]));

    // Jika header tidak ada atau tidak dimulai dengan 'Bearer '
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[AUTH] Missing or invalid Authorization header format");
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ada" },
        { status: 401 }
      );
    }

    // Ambil token dari header
    const token = authHeader.split(" ")[1];
    console.log(
      `[AUTH] Token found, length: ${
        token.length
      }, starts with: ${token.substring(0, 10)}...`
    );

    // Verifikasi token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(
        `[AUTH] Token verified successfully for user: ${decoded.userId}`
      );
    } catch (error) {
      console.error(`[AUTH] Token verification failed:`, error.message);
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    // Periksa apakah user masih ada di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - User tidak ditemukan" },
        { status: 401 }
      );
    }

    // Tambahkan informasi user ke request untuk digunakan di handler
    const requestWithAuth = new Request(request);
    requestWithAuth.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Lanjutkan dengan request yang sudah dimodifikasi
    return requestWithAuth;
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Server error saat autentikasi" },
      { status: 500 }
    );
  }
}

/**
 * Helper untuk autentikasi dengan JWT di API route
 * @param {Request} request - Request Next.js
 * @returns {Object|null} - Object user jika autentikasi berhasil, null jika gagal
 */
export async function getUserFromToken(request) {
  try {
    // Periksa header Authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    // Ambil token dari header
    const token = authHeader.split(" ")[1];
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Periksa apakah user masih ada di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    return user || null;
  } catch (error) {
    console.error("getUserFromToken error:", error);
    return null;
  }
}
