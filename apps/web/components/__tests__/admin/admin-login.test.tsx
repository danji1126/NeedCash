// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/admin/auth-provider";

function TestConsumer() {
  const { isAuthenticated, apiKey, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "unauthenticated"}</span>
      <span data-testid="api-key">{apiKey ?? "null"}</span>
      <button onClick={() => login("test-key")}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function LoginForm() {
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("apikey") as HTMLInputElement;
    setLoading(true);
    setError(false);
    const ok = await login(input.value);
    setLoading(false);
    if (!ok) setError(true);
  }

  if (isAuthenticated) return <div data-testid="children">Admin Content</div>;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="apikey">API Key</label>
      <input id="apikey" name="apikey" type="password" disabled={loading} />
      <button type="submit" disabled={loading}>Sign In</button>
      {error && <p role="alert">Invalid API key</p>}
    </form>
  );
}

import React from "react";

describe("AuthProvider - admin login", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("login form renders with label and input", () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("successful login shows children", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "valid-key" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByTestId("children")).toHaveTextContent("Admin Content");
    });
    expect(sessionStorage.getItem("admin_api_key")).toBe("valid-key");
  });

  it("failed login shows error message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "bad-key" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid API key");
    });
  });

  it("loading state disables inputs during login", async () => {
    let resolveLogin: (v: Response) => void;
    const pending = new Promise<Response>((r) => { resolveLogin = r; });
    vi.mocked(fetch).mockReturnValueOnce(pending as Promise<Response>);

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "key" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByLabelText("API Key")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Sign In" })).toBeDisabled();
    });

    resolveLogin!(new Response(null, { status: 200 }));
    await waitFor(() => {
      expect(screen.getByTestId("children")).toBeInTheDocument();
    });
  });

  it("logout clears auth state and localStorage", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });

    fireEvent.click(screen.getByText("Logout"));
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
    expect(sessionStorage.getItem("admin_api_key")).toBeNull();
  });

  it("restores apiKey from sessionStorage on mount", () => {
    sessionStorage.setItem("admin_api_key", "saved-key");
    sessionStorage.setItem("admin_api_key_expiry", String(Date.now() + 3600000));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("api-key")).toHaveTextContent("saved-key");
  });

  it("migrates legacy localStorage key to sessionStorage", () => {
    localStorage.setItem("admin_api_key", "legacy-key");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    expect(localStorage.getItem("admin_api_key")).toBeNull();
    expect(sessionStorage.getItem("admin_api_key")).toBe("legacy-key");
  });

  it("useAuth throws outside AuthProvider", () => {
    expect(() => render(<TestConsumer />)).toThrow("useAuth must be inside AuthProvider");
  });
});
