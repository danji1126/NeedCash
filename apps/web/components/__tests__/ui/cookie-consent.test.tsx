// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookieConsent } from "@/components/ui/cookie-consent";

vi.mock("next/script", () => ({
  default: () => null,
}));

const STORAGE_KEY = "needcash-cookie-consent";

describe("CookieConsent", () => {
  afterEach(() => {
    cleanup();
  });

  it("동의 기록이 없으면 배너를 표시한다", () => {
    render(<CookieConsent />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/쿠키를 사용합니다/)).toBeInTheDocument();
  });

  it("이미 동의한 경우 배너를 표시하지 않는다", () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    render(<CookieConsent />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("이미 거부한 경우 배너를 표시하지 않는다", () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    render(<CookieConsent />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("수락 클릭 시 localStorage에 granted를 저장하고 배너를 숨긴다", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: "수락" }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe("granted");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("거부 클릭 시 localStorage에 denied를 저장하고 배너를 숨긴다", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole("button", { name: "거부" }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe("denied");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("role=alertdialog과 aria-label이 존재한다", () => {
    render(<CookieConsent />);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-label", "쿠키 사용 동의");
  });

  it("개인정보처리방침 링크가 있다", () => {
    render(<CookieConsent />);

    const link = screen.getByRole("link", { name: "개인정보처리방침" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("수락/거부 버튼 레이블이 올바르다", () => {
    render(<CookieConsent />);

    expect(screen.getByRole("button", { name: "수락" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거부" })).toBeInTheDocument();
  });
});
