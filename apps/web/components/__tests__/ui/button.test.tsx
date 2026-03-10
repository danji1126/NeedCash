// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

afterEach(() => cleanup());

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole("button", { name: "Default" });
    expect(btn.className).toContain("border-b");
    expect(btn.className).toContain("border-text");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button", { name: "Outline" });
    expect(btn.className).toContain("border-border");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button", { name: "Ghost" });
    expect(btn.className).toContain("text-text-secondary");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole("button", { name: "Small" });
    expect(btn.className).toContain("px-3");
    expect(btn.className).toContain("py-1");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole("button", { name: "Large" });
    expect(btn.className).toContain("px-8");
    expect(btn.className).toContain("py-3");
  });

  it("does not fire onClick when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={handler}>Disabled</Button>);
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Merged</Button>);
    const btn = screen.getByRole("button", { name: "Merged" });
    expect(btn.className).toContain("custom-class");
  });

  it("calls onClick handler", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handler}>Clickable</Button>);
    await user.click(screen.getByRole("button", { name: "Clickable" }));
    expect(handler).toHaveBeenCalledOnce();
  });
});
