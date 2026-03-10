// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { Leaderboard } from "@/components/game/leaderboard";

vi.mock("next/script", () => ({
  default: () => null,
}));

const MOCK_ENTRIES = [
  { id: 1, rank: 1, nickname: "챔피언", score: 150, metadata: null, createdAt: "2025-01-01" },
  { id: 2, rank: 2, nickname: "도전자", score: 200, metadata: null, createdAt: "2025-01-02" },
  { id: 3, rank: 3, nickname: null, score: 250, metadata: null, createdAt: "2025-01-03" },
  { id: 4, rank: 4, nickname: "신입", score: 300, metadata: null, createdAt: "2025-01-04" },
];

const MOCK_MY_RANK = { rank: 5, score: 350, nickname: "나" };

function mockFetchSuccess(entries = MOCK_ENTRIES, myRank: typeof MOCK_MY_RANK | null = null, total = 100) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ leaderboard: entries, myRank, total }),
  });
}

function mockFetchError() {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}

describe("Leaderboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<Leaderboard game="reaction" />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(5);
  });

  it("빈 리더보드 메시지를 표시한다", async () => {
    mockFetchSuccess([], null, 0);
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByText(/아직 기록이 없습니다/)).toBeInTheDocument();
    });
  });

  it("순위, 닉네임, 점수가 포함된 항목을 렌더링한다", async () => {
    mockFetchSuccess();
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByText("챔피언")).toBeInTheDocument();
    });
    expect(screen.getByText("도전자")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
  });

  it("상위 3위에 메달을 표시한다", async () => {
    mockFetchSuccess();
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByText("🥇")).toBeInTheDocument();
    });
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();
  });

  it("내 순위를 표시한다", async () => {
    mockFetchSuccess(MOCK_ENTRIES, MOCK_MY_RANK, 100);
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByText("내 순위")).toBeInTheDocument();
    });
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText(/100명/)).toBeInTheDocument();
  });

  it("null 닉네임은 '익명'으로 표시한다", async () => {
    mockFetchSuccess();
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByText("익명")).toBeInTheDocument();
    });
  });

  it("API 오류 시 로딩을 종료한다", async () => {
    mockFetchError();
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(0);
    });
  });

  it("game prop에 맞는 URL로 fetch한다", async () => {
    mockFetchSuccess();
    render(<Leaderboard game="typing" />);

    expect(global.fetch).toHaveBeenCalledWith("/api/scores/typing?limit=10");
  });

  it("game prop 변경 시 re-fetch한다", async () => {
    mockFetchSuccess();
    const { rerender } = render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/scores/reaction?limit=10");
    });

    mockFetchSuccess();
    rerender(<Leaderboard game="typing" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/scores/typing?limit=10");
    });
  });

  it("role=table로 리더보드를 렌더링한다", async () => {
    mockFetchSuccess();
    render(<Leaderboard game="reaction" />);

    await waitFor(() => {
      expect(screen.getByRole("table", { name: "리더보드" })).toBeInTheDocument();
    });
  });
});
