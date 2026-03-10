// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { DesignProvider, DesignContext } from "@/components/design/design-provider";
import { useContext } from "react";
import type { DesignId } from "@/lib/design";

function TestConsumer() {
  const ctx = useContext(DesignContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="design">{ctx.design}</span>
      <span data-testid="theme">{ctx.theme}</span>
      <span data-testid="themes-count">{ctx.availableThemes.length}</span>
      <button onClick={() => ctx.setDesign("glass" as DesignId)}>Set Glass</button>
      <button onClick={() => ctx.setDesign("editorial" as DesignId)}>Set Editorial</button>
      <button onClick={() => ctx.setTheme("custom-theme")}>Set Theme</button>
    </div>
  );
}

describe("DesignProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-design");
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
  });

  it("provides default design value (brutalist)", () => {
    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );
    expect(screen.getByTestId("design")).toHaveTextContent("brutalist");
    expect(screen.getByTestId("theme")).toHaveTextContent("brutal-terminal");
  });

  it("restores design from localStorage", () => {
    localStorage.setItem("needcash-design", "glass");
    localStorage.setItem("needcash-theme", "glass-midnight");

    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );
    expect(screen.getByTestId("design")).toHaveTextContent("glass");
  });

  it("falls back to default for invalid localStorage value", () => {
    localStorage.setItem("needcash-design", "nonexistent");

    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );
    expect(screen.getByTestId("design")).toHaveTextContent("brutalist");
  });

  it("setDesign updates context, localStorage, and resets theme", () => {
    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );

    fireEvent.click(screen.getByText("Set Glass"));
    expect(screen.getByTestId("design")).toHaveTextContent("glass");
    expect(localStorage.getItem("needcash-design")).toBe("glass");
    expect(localStorage.getItem("needcash-theme")).toBeTruthy();
  });

  it("setTheme updates context and localStorage", () => {
    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );

    fireEvent.click(screen.getByText("Set Theme"));
    expect(screen.getByTestId("theme")).toHaveTextContent("custom-theme");
    expect(localStorage.getItem("needcash-theme")).toBe("custom-theme");
  });

  it("sets data-design and data-theme attributes on documentElement", async () => {
    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );

    // useEffect runs after render
    await vi.waitFor(() => {
      expect(document.documentElement.getAttribute("data-design")).toBe("brutalist");
      expect(document.documentElement.getAttribute("data-theme")).toBe("brutal-terminal");
    });
  });

  it("updates DOM attributes when design changes", async () => {
    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );

    fireEvent.click(screen.getByText("Set Glass"));

    await vi.waitFor(() => {
      expect(document.documentElement.getAttribute("data-design")).toBe("glass");
    });
  });

  it("handles localStorage error gracefully (fallback to default)", () => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("Storage error"); };

    render(
      <DesignProvider>
        <TestConsumer />
      </DesignProvider>
    );

    expect(screen.getByTestId("design")).toHaveTextContent("brutalist");
    Storage.prototype.getItem = originalGetItem;
  });
});
