"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo purposes, accept any email/password
        const mockUser = {
          id: "user-1",
          name: email.split("@")[0],
          email,
          publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
        }

        localStorage.setItem("user", JSON.stringify(mockUser))
        setUser(mockUser)
        setIsAuthenticated(true)
        resolve(mockUser)
      }, 1000)
    })
  }

  const register = async (name, email, password) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo purposes, accept any registration
        const mockUser = {
          id: "user-" + Date.now(),
          name,
          email,
          publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
        }

        localStorage.setItem("user", JSON.stringify(mockUser))
        setUser(mockUser)
        setIsAuthenticated(true)
        resolve(mockUser)
      }, 1000)
    })
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
