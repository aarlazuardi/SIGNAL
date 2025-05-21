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
    // First sign out from Next Auth if applicable
    if (status === "authenticated") {
      await signOut({ redirect: false });
    }

    // Then clear our local auth
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
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
