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

  useEffect(() => {
    // Logging untuk debug token Google
    if (status === "authenticated") {
      console.log("[AuthProvider] NextAuth session:", session);
    }
    // Pastikan customToken dari session NextAuth selalu disimpan ke localStorage/sessionStorage
    if (status === "authenticated" && session?.customToken) {
      console.log(
        "[AuthProvider] Menyimpan customToken ke storage:",
        session.customToken
      );
      // Variabel untuk tracking polling
      let pollingInterval;
      let pollingAttempts = 0;
      const MAX_POLLS = 40; // 40 x 50ms = 2 detik total polling
      const POLL_INTERVAL = 50; // 50ms interval

      // Fungsi untuk simpan token ke localStorage dan sessionStorage
      const persistToken = () => {
        const tokenToSave = session.customToken;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("auth_method", "google");
        }
        setAuthToken(tokenToSave); // localStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("signal_auth_token", tokenToSave);
          sessionStorage.setItem(
            "signal_auth_token_timestamp",
            Date.now().toString()
          );
        }
        // Logging
        console.log(
          "[AuthProvider] Token disimpan ke localStorage & sessionStorage:",
          tokenToSave
        );
      };

      // Polling untuk memastikan token tersimpan
      const verifyTokenStored = () => {
        pollingAttempts++;
        const storedToken =
          localStorage.getItem("signal_auth_token") ||
          sessionStorage.getItem("signal_auth_token");
        if (storedToken && storedToken === session.customToken) {
          clearInterval(pollingInterval);
          setIsAuthenticated(true);
          setUser({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            authSource: "google",
          });
          setLoading(false);
          window.SIGNAL_AUTH_READY = true;
          const redirectPath = sessionStorage.getItem("redirect_after_login");
          if (redirectPath) {
            sessionStorage.removeItem("redirect_after_login");
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== redirectPath
            ) {
              window.location.href = redirectPath;
            }
          }
          return;
        }
        if (pollingAttempts <= MAX_POLLS) {
          persistToken();
        } else {
          clearInterval(pollingInterval);
          console.warn(
            "[AuthProvider] Gagal menyimpan token ke storage setelah polling"
          );
        }
      };
      persistToken();
      pollingInterval = setInterval(verifyTokenStored, POLL_INTERVAL);
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
