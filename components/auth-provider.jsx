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

  // Pastikan customToken dari session NextAuth selalu disimpan ke localStorage, dengan polling jika perlu
  useEffect(() => {
    let pollingInterval;
    let pollingCounter = 0;
    const MAX_POLLS = 50; // 50 x 200ms = 10 detik total polling

    if (status === "authenticated" && session?.customToken) {
      // Coba simpan token dengan berbagai metode (redundant untuk keamanan)

      // Metode 1: Gunakan setAuthToken dari api.js
      const currentToken = getAuthToken();
      if (currentToken !== session.customToken) {
        setAuthToken(session.customToken);
        console.log(
          "[AuthProvider] customToken ditulis ke localStorage (metode 1)"
        );
      }

      // Metode 2: Tulis langsung ke localStorage untuk keamanan tambahan
      if (typeof window !== "undefined") {
        window.localStorage.setItem("signal_auth_token", session.customToken);
        console.log(
          "[AuthProvider] customToken ditulis ke localStorage (metode 2 langsung)"
        );
      }

      // Polling untuk memastikan token benar-benar tersimpan (mengatasi race condition/hydration)
      pollingInterval = setInterval(() => {
        pollingCounter++;
        const tokenNow = getAuthToken();

        if (tokenNow !== session.customToken) {
          // Coba lagi kedua metode
          setAuthToken(session.customToken);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "signal_auth_token",
              session.customToken
            );
          }
          console.log(
            `[AuthProvider] customToken ditulis ke localStorage (polling #${pollingCounter})`
          );
        } else {
          console.log(
            `[AuthProvider] customToken berhasil tersimpan di localStorage setelah ${pollingCounter} kali polling`
          );
          clearInterval(pollingInterval);
        }

        // Hentikan polling jika sudah mencapai batas
        if (pollingCounter >= MAX_POLLS) {
          console.log(
            `[AuthProvider] Batas polling tercapai (${MAX_POLLS}). Status token: ${
              getAuthToken() === session.customToken ? "berhasil" : "gagal"
            }`
          );
          clearInterval(pollingInterval);
        }
      }, 200);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
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
