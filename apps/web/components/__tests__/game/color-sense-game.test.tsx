// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { addGameHistory } from "@/lib/game-history";
import { ColorSenseGame } from "@/components/game/color-sense-game";

vi.mock("@/lib/game-history", () => ({
  addGameHistory: vi.fn(),
}));

vi.mock("@/components/game/game-result-panel", () => ({
  GameResultPanel: ({ game, score, grade }: { game: string; score: number; grade: string }) => (
    <div data-testid="game-result-panel" data-game={game} data-score={score} data-grade={grade} />
  ),
}));

describe("ColorSenseGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.spyOn(Math, "random").mockRestore();
  });

  it("idle 상태에서 설명과 시작 버튼을 렌더링한다", () => {
    render(<ColorSenseGame />);

    expect(screen.getByText(/다른 색을 찾아 클릭/)).toBeInTheDocument();
    expect(screen.getByText("시작하기")).toBeInTheDocument();
  });

  it("시작 후 그리드와 라운드 정보가 표시된다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    expect(screen.getByText(/Round 1/)).toBeInTheDocument();
    // Round 1 → gridSize=2 → 4 tiles
    const tiles = screen.getAllByRole("button", { name: /타일/ });
    expect(tiles).toHaveLength(4);
  });

  it("정답 타일 클릭 시 다음 라운드로 진행한다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // With r=0.5, round 1: gridSize=2, diffIndex = floor(0.5 * 4) = 2
    const tiles = screen.getAllByRole("button", { name: /타일/ });
    fireEvent.click(tiles[2]);

    expect(screen.getByText("정답!")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(900); });

    expect(screen.getByText(/Round 2/)).toBeInTheDocument();
  });

  it("오답 타일 클릭 시 게임 오버 화면을 표시한다", () => {
    vi.mocked(addGameHistory).mockClear();
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // diffIndex=2, click wrong tile (index 0)
    const tiles = screen.getAllByRole("button", { name: /타일/ });
    fireEvent.click(tiles[0]);

    expect(screen.getByText("틀렸습니다!")).toBeInTheDocument();
    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalledWith(
      expect.objectContaining({ game: "color-sense" }),
    );
  });

  it("시간 초과 시 timeout 화면을 표시한다", () => {
    vi.mocked(addGameHistory).mockClear();
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // Simulate 10 seconds elapsed (TIME_LIMIT = 10000ms)
    vi.spyOn(performance, "now").mockReturnValue(10000);
    act(() => { vi.advanceTimersByTime(100); });

    expect(screen.getByText("시간 초과!")).toBeInTheDocument();
    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalled();
  });

  it("10라운드를 모두 통과하면 최종 result 화면을 표시한다", () => {
    vi.mocked(addGameHistory).mockClear();
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    for (let round = 1; round <= 10; round++) {
      const tiles = screen.getAllByRole("button", { name: /타일/ });
      let gridSize: number;
      if (round <= 3) gridSize = 2;
      else if (round <= 6) gridSize = 3;
      else gridSize = 4;

      const diffIndex = Math.floor(0.5 * gridSize * gridSize);
      fireEvent.click(tiles[diffIndex]);

      if (round < 10) {
        act(() => { vi.advanceTimersByTime(900); });
      }
    }

    // Wait for feedback to transition
    act(() => { vi.advanceTimersByTime(900); });

    expect(screen.getByTestId("game-result-panel")).toBeInTheDocument();
    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalledWith(
      expect.objectContaining({
        game: "color-sense",
        metadata: { rounds: 10 },
      }),
    );
  });

  it("다시 도전 버튼으로 게임을 재시작할 수 있다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // Wrong answer → game over
    const tiles = screen.getAllByRole("button", { name: /타일/ });
    fireEvent.click(tiles[0]);

    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    fireEvent.click(screen.getByText("다시 도전"));

    // 다시 Round 1
    expect(screen.getByText(/Round 1/)).toBeInTheDocument();
  });

  it("라운드 진행에 따라 그리드 크기가 커진다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // Round 1: gridSize=2 → 4 tiles
    expect(screen.getAllByRole("button", { name: /타일/ })).toHaveLength(4);

    // Complete rounds 1-3 to reach round 4 (gridSize=3 → 9 tiles)
    for (let round = 1; round <= 3; round++) {
      const tiles = screen.getAllByRole("button", { name: /타일/ });
      const gridSize = 2;
      const diffIndex = Math.floor(0.5 * gridSize * gridSize);
      fireEvent.click(tiles[diffIndex]);
      act(() => { vi.advanceTimersByTime(900); });
    }

    // Round 4: gridSize=3 → 9 tiles
    expect(screen.getAllByRole("button", { name: /타일/ })).toHaveLength(9);
  });

  it("타일에 aria-label이 있다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    const tiles = screen.getAllByRole("button", { name: /타일/ });
    expect(tiles[0]).toHaveAttribute("aria-label", "타일 1");
  });

  it("오답 시 라운드 클리어 정보가 표시된다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorSenseGame />);
    fireEvent.click(screen.getByText("시작하기"));

    // Wrong answer immediately → 0 rounds cleared
    const tiles = screen.getAllByRole("button", { name: /타일/ });
    fireEvent.click(tiles[0]);

    expect(screen.getByText(/0라운드 클리어/)).toBeInTheDocument();
  });
});
