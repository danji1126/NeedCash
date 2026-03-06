"use client";

import { useState } from "react";
import { useAuth } from "@/components/admin/auth-provider";

export function AdminLogin() {
  const { login } = useAuth();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(key);
    setLoading(false);
    if (!ok) {
      setError("Invalid API Key");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h2 className="font-heading text-2xl font-bold">Admin Login</h2>
        <div>
          <label
            htmlFor="apiKey"
            className="mb-1 block text-sm text-text-secondary"
          >
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-text-muted focus:outline-none"
            placeholder="Enter admin API key"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Login"}
        </button>
      </form>
    </div>
  );
}
