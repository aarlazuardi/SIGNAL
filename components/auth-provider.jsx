"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  getAuthToken,
  setAuthToken,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = getAuthToken();

    // Check for Next Auth session
    if (status === "authenticated" && session) {
      // If we have a Next Auth session
      if (session.customToken) {
        // Use the JWT token from Next Auth session
        setAuthToken(session.customToken);
        setUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        });
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
    }

    // If no Next Auth session or it doesn't have custom token,
    // check for our JWT token
    async function fetchUser() {
      if (token) {
        try {
          const userData = await getCurrentUser();
          if (userData && !userData.error) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token tidak valid, hapus dari localStorage
            logoutUser();
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          logoutUser();
        }
      }
      setLoading(false);
    }

    fetchUser();
  }, [session?.customToken, status]);

  // Pastikan customToken dari session NextAuth selalu disimpan ke localStorage
  useEffect(() => {
    if (status === "authenticated" && session?.customToken) {
      setAuthToken(session.customToken);
    }
  }, [session?.customToken, status]);

  // Pastikan customToken dari session NextAuth selalu disimpan ke localStorage, dengan polling yang optimal
  useEffect(() => {
    if (status === "authenticated" && session?.customToken) {
      // Variabel untuk tracking polling
      let pollingInterval;
      let pollingAttempts = 0;
      const MAX_POLLS = 10; // 10 x 50ms = 500ms total polling (lebih singkat untuk UX lebih cepat)
      const POLL_INTERVAL = 50; // 50ms interval (lebih responsif)

      // Fungsi untuk simpan token ke localStorage dan sessionStorage (redundansi untuk keandalan)
      const persistToken = () => {
        const tokenToSave = session.customToken;

        // Catat sumber login
        if (typeof window !== "undefined") {
          sessionStorage.setItem("auth_method", "google");
        }

        // Gunakan API function untuk simpan token (single source of truth)
        setAuthToken(tokenToSave);

        // Simpan juga di sessionStorage untuk redundansi
        if (typeof window !== "undefined") {
          sessionStorage.setItem("signal_auth_token", tokenToSave);
          // Set timestamp untuk tracking
          sessionStorage.setItem(
            "signal_auth_token_timestamp",
            Date.now().toString()
          );
        }
      };

      // Panggil sekali di awal
      persistToken();

      // Fungsi polling untuk memverifikasi token tersimpan
      const verifyTokenStored = () => {
        pollingAttempts++;

        const storedToken =
          localStorage.getItem("signal_auth_token") ||
          sessionStorage.getItem("signal_auth_token");

        // Token sudah tersedia dan sama dengan session token
        if (storedToken && storedToken === session.customToken) {
          // Token berhasil tersimpan, stop polling
          clearInterval(pollingInterval);
          setIsAuthenticated(true);
          setUser({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            // Tambahkan flag sumber otentikasi
            authSource: "google",
          });
          setLoading(false);

          // Set flag ready untuk komponen lain
          window.SIGNAL_AUTH_READY = true;

          // Cek jika ada halaman redirect setelah login
          const redirectPath = sessionStorage.getItem("redirect_after_login");
          if (redirectPath) {
            // Hapus dari session storage
            sessionStorage.removeItem("redirect_after_login");
            // Arahkan ke halaman sebelumnya
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== redirectPath
            ) {
              window.location.href = redirectPath;
            }
          }
          return;
        }

        // Token belum tersimpan atau tidak sama, coba tulis ulang
        if (pollingAttempts <= MAX_POLLS) {
          persistToken();
        } else {
          // Sudah mencapai batas polling, tetap gunakan apa yang tersedia
          clearInterval(pollingInterval);

          // Terakhir coba simpan dengan metode lain jika belum berhasil
          if (typeof window !== "undefined" && session?.customToken) {
            try {
              // Set as cookie juga sebagai fallback terakhir
              document.cookie = `signal_auth_token=${session.customToken};path=/;max-age=3600`;

              // Set flag untuk coba reload halaman
              sessionStorage.setItem("auth_reload_attempted", "true");

              // Update UI state
              setIsAuthenticated(true);
              setUser({
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                authSource: "google",
              });
              setLoading(false);
            } catch (e) {
              console.error("Failed to save token as cookie:", e);
            }
          }
        }
      };

      // Start polling dengan interval yang lebih singkat
      pollingInterval = setInterval(verifyTokenStored, POLL_INTERVAL);

      // Cleanup
      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [session?.customToken, status]);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.token && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error("Login gagal: Data tidak valid");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  const register = async (name, email, password) => {
    try {
      const response = await registerUser({ name, email, password });

      if (response.error) {
        throw new Error(response.error);
      }

      // Login setelah registrasi berhasil
      return await login(email, password);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };
  const logout = async () => {
    try {
      // First sign out from Next Auth if applicable
      if (status === "authenticated") {
        await signOut({ redirect: false });
      }

      // Then clear our local auth
      logoutUser();
      setUser(null);
      setIsAuthenticated(false);

      // Show success notification (using setTimeout to ensure it happens after state updates)
      setTimeout(() => {
        if (typeof window !== "undefined") {
          // Display success toast using browser alert since toast provider may not be accessible here
          alert("Logout berhasil!");
          // Redirect to home page
          window.location.href = "/";
        }
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Tambahkan function untuk update data user
  const updateUserData = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData && !userData.error) {
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error updating user data:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        updateUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
