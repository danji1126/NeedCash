"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface AuthContextType {
  apiKey: string | null;
  isAuthenticated: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "admin_api_key";
const EXPIRY_KEY = "admin_api_key_expiry";
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4시간

function getStoredKey(): string | null {
  if (typeof window === "undefined") return null;

  // 기존 localStorage 키 마이그레이션
  const legacyKey = localStorage.getItem(SESSION_KEY);
  if (legacyKey) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(SESSION_KEY, legacyKey);
    sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
    return legacyKey;
  }

  // 만료 확인
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (expiry && Date.now() > parseInt(expiry)) {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    return null;
  }

  return sessionStorage.getItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => getStoredKey());

  // 주기적 만료 체크 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = sessionStorage.getItem(EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(EXPIRY_KEY);
        setApiKey(null);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (key: string): Promise<boolean> => {
    const res = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      setApiKey(key);
      sessionStorage.setItem(SESSION_KEY, key);
      sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setApiKey(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
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
