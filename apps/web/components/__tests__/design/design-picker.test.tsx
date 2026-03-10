// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DesignPicker } from "@/components/design/design-picker";
import { DesignProvider } from "@/components/design/design-provider";

function renderPicker() {
  return render(
    <DesignProvider>
      <DesignPicker />
    </DesignProvider>
  );
}

describe("DesignPicker", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-design");
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders toggle button with aria-label", () => {
    renderPicker();
    expect(screen.getByLabelText("디자인 변경")).toBeInTheDocument();
  });

  it("button click opens picker panel", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("re-click closes picker panel", () => {
    renderPicker();
    const btn = screen.getByLabelText("디자인 변경");
    fireEvent.click(btn);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("outside click closes picker", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // mousedown outside the ref container
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape key closes picker", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("design option click updates design", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));

    // Click on "글래스" (glass design)
    const glassBtn = screen.getByText("글래스");
    fireEvent.click(glassBtn);

    expect(localStorage.getItem("needcash-design")).toBe("glass");
  });

  it("theme option click updates theme", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));

    // Default is brutalist with themes visible; click a theme
    const themeButtons = screen.getAllByTitle(/.+/);
    // Click a different theme (not the default one)
    const nonDefaultTheme = themeButtons.find(
      (btn) => btn.getAttribute("title") !== "터미널"
    );
    if (nonDefaultTheme) {
      fireEvent.click(nonDefaultTheme);
      expect(localStorage.getItem("needcash-theme")).toBeTruthy();
    }
  });

  it("active design has special styling class", () => {
    renderPicker();
    fireEvent.click(screen.getByLabelText("디자인 변경"));

    // Default is brutalist = "브루탈리스트"
    const activeBtn = screen.getByText("브루탈리스트");
    expect(activeBtn.className).toContain("bg-accent");
  });

  it("aria-expanded reflects open state", () => {
    renderPicker();
    const btn = screen.getByLabelText("디자인 변경");
    expect(btn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("panel has aria-controls and role=listbox attributes", () => {
    renderPicker();
    const btn = screen.getByLabelText("디자인 변경");
    expect(btn).toHaveAttribute("aria-controls", "design-picker-panel");

    fireEvent.click(btn);
    const panel = screen.getByRole("listbox");
    expect(panel).toHaveAttribute("id", "design-picker-panel");
  });
});
