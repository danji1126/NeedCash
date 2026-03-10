// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GameHistoryPanel } from "@/components/game/game-history-panel";
import type { GameHistoryEntry } from "@/lib/game-history";

vi.mock("@/lib/game-history", () => ({
  getGameHistory: vi.fn(),
  clearGameHistory: vi.fn(),
}));

import { getGameHistory, clearGameHistory } from "@/lib/game-history";

const today = new Date().toISOString().split("T")[0];

function makeEntry(overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
  return {
    id: crypto.randomUUID(),
    game: "reaction",
    score: 250,
    grade: "A",
    title: "250ms",
    metadata: {},
    playedAt: `${today}T12:00:00.000Z`,
    ...overrides,
  };
}

describe("GameHistoryPanel", () => {
  beforeEach(() => {
    vi.mocked(getGameHistory).mockReturnValue([]);
    vi.mocked(clearGameHistory).mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it("히스토리가 비어있으면 아무것도 렌더링하지 않는다", () => {
    vi.mocked(getGameHistory).mockReturnValue([]);
    const { container } = render(<GameHistoryPanel game="reaction" />);
    expect(container.innerHTML).toBe("");
  });

  it("'My History' 제목과 삭제 버튼을 렌더링한다", () => {
    vi.mocked(getGameHistory).mockReturnValue([makeEntry()]);
    render(<GameHistoryPanel game="reaction" />);
    expect(screen.getByText("My History")).toBeInTheDocument();
    expect(screen.getByText("삭제")).toBeInTheDocument();
  });

  it("통계(총, 평균, 최고)를 올바르게 표시한다", () => {
    vi.mocked(getGameHistory).mockReturnValue([
      makeEntry({ score: 200 }),
      makeEntry({ score: 300 }),
      makeEntry({ score: 250 }),
    ]);
    render(<GameHistoryPanel game="reaction" />);
    expect(screen.getByText("3회")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument(); // average
    expect(screen.getByText("200")).toBeInTheDocument(); // best (reaction = ASC = min)
  });

  it("DESC 게임(typing)에서 최고 점수를 max로 계산한다", () => {
    vi.mocked(getGameHistory).mockReturnValue([
      makeEntry({ game: "typing", score: 80 }),
      makeEntry({ game: "typing", score: 120 }),
    ]);
    render(<GameHistoryPanel game="typing" />);
    expect(screen.getByText("120")).toBeInTheDocument(); // best = max
  });

  it("히스토리 항목의 grade와 score를 렌더링한다", () => {
    vi.mocked(getGameHistory).mockReturnValue([
      makeEntry({ grade: "S", score: 150, title: "150ms" }),
    ]);
    render(<GameHistoryPanel game="reaction" />);
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("오늘 날짜의 항목은 '오늘'로 그룹화된다", () => {
    vi.mocked(getGameHistory).mockReturnValue([makeEntry()]);
    render(<GameHistoryPanel game="reaction" />);
    expect(screen.getByText("오늘")).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 clearGameHistory를 호출하고 목록을 비운다", () => {
    vi.mocked(getGameHistory).mockReturnValue([makeEntry()]);
    render(<GameHistoryPanel game="reaction" />);

    fireEvent.click(screen.getByText("삭제"));

    expect(clearGameHistory).toHaveBeenCalledWith("reaction");
    expect(screen.queryByText("My History")).not.toBeInTheDocument();
  });

  it("SCORE_UNIT에 해당하는 단위를 표시한다", () => {
    vi.mocked(getGameHistory).mockReturnValue([makeEntry({ score: 250 })]);
    render(<GameHistoryPanel game="reaction" />);
    // reaction의 SCORE_UNIT은 "ms"
    expect(screen.getAllByText("ms").length).toBeGreaterThan(0);
  });
});
