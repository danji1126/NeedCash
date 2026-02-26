"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface AuthContextType {
  apiKey: string | null;
  isAuthenticated: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_api_key");
  });

  const login = useCallback(async (key: string): Promise<boolean> => {
    const res = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      setApiKey(key);
      localStorage.setItem("admin_api_key", key);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setApiKey(null);
    localStorage.removeItem("admin_api_key");
  }, []);

  return (
    <AuthContext.Provider
      value={{ apiKey, isAuthenticated: !!apiKey, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
