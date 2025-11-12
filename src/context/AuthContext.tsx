import React, { createContext, useContext, useEffect, useState } from "react";
import authApi from "@/api/authApi";
import { getCurrentUser } from "@/api/userApi";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user if already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // 🔹 LOGIN (Step 1: Send OTP)
  const login = async (email: string, password: string) => {
    await authApi.post("/User/Login", { email, password });
    // OTP sent — you’ll verify next
  };

  // 🔹 VERIFY OTP (Step 2)
  const verifyOtp = async (email: string, otp: string) => {
    const response = await authApi.post("/User/OtpVerify", { email, otp });

    // ✅ Save tokens
    if (response.data.access_token)
      localStorage.setItem("access_token", response.data.access_token);
    if (response.data.refresh_token)
      localStorage.setItem("refresh_token", response.data.refresh_token);

    // ✅ Get current user
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    localStorage.setItem("user", JSON.stringify(currentUser));
  };

  // 🔹 SIGNUP
  const signup = async (username: string, email: string, password: string) => {
    await authApi.post("/User/Register", { username, email, password });
  };

  // 🔹 LOGOUT
  const logout = async () => {
    try {
      await authApi.post("/User/Logout");
    } catch (err) {
      console.warn("Logout API failed:", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifyOtp, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
