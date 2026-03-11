// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { addGameHistory } from "@/lib/game-history";
import { ColorMemoryGame } from "@/components/game/color-memory-game";

vi.mock("@/lib/game-history", () => ({
  addGameHistory: vi.fn(),
}));

vi.mock("@/lib/game-session", () => ({
  startGameSession: vi.fn().mockResolvedValue("test-session-id"),
}));

vi.mock("@/components/game/game-result-panel", () => ({
  GameResultPanel: ({ game, score, grade }: { game: string; score: number; grade: string }) => (
    <div data-testid="game-result-panel" data-game={game} data-score={score} data-grade={grade} />
  ),
}));

// Constants from source
const FLASH_DURATION = 500;
const FLASH_GAP = 300;
const ROUND_DELAY = 600;
const CORRECT_DELAY = 800;
const WRONG_DELAY = 1500;

describe("ColorMemoryGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.spyOn(Math, "random").mockRestore();
  });

  it("idle 상태에서 설명과 시작 버튼을 렌더링한다", () => {
    render(<ColorMemoryGame />);

    expect(screen.getByText(/색상 패드가 점멸하는 순서를 기억/)).toBeInTheDocument();
    expect(screen.getByText("시작하기")).toBeInTheDocument();
  });

  it("시작 후 showing 상태에서 패턴을 기억하세요 메시지가 나타난다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    expect(screen.getByText("패턴을 기억하세요...")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });

  it("showing 완료 후 input 상태로 전환된다", async () => {
    // createInitialSequence: [floor(0.5*4), floor(0.5*4)] = [2, 2]
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // Total showing time: ROUND_DELAY + seqLen * (FLASH_DURATION + FLASH_GAP) = 600 + 2*800 = 2200
    act(() => { vi.advanceTimersByTime(2200); });

    expect(screen.getByText("0 / 2")).toBeInTheDocument();
  });

  it("올바른 시퀀스를 입력하면 정답 표시 후 다음 라운드로 진행한다", async () => {
    // sequence = [2, 2]
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // Wait for showing phase to complete (+100 margin)
    act(() => { vi.advanceTimersByTime(2300); });

    // Should now be in input phase
    expect(screen.getByText("0 / 2")).toBeInTheDocument();

    // Click correct pads: blue (index 2) twice
    const pads = screen.getAllByRole("button", { name: /패드/ });
    // Verify pads are not disabled
    expect(pads[2]).not.toBeDisabled();

    // Click first pad in sequence
    await act(async () => { fireEvent.click(pads[2]); });
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // Click second pad in sequence — re-query since DOM may have changed
    const pads2 = screen.getAllByRole("button", { name: /패드/ });
    await act(async () => { fireEvent.click(pads2[2]); });

    // After completing sequence, phase is "correct"
    expect(screen.getByText("정답!")).toBeInTheDocument();

    // Wait for CORRECT_DELAY and next round showing
    act(() => { vi.advanceTimersByTime(CORRECT_DELAY + 100); });

    expect(screen.getByText("Round 2")).toBeInTheDocument();
  });

  it("잘못된 입력 시 틀렸습니다 표시 후 result로 전환된다", async () => {
    vi.mocked(addGameHistory).mockClear();
    // sequence = [2, 2]
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => { vi.advanceTimersByTime(2200); });

    // Click wrong pad (index 0 instead of 2)
    const pads = screen.getAllByRole("button", { name: /패드/ });
    fireEvent.click(pads[0]);

    expect(screen.getByText("틀렸습니다!")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalledWith(
      expect.objectContaining({ game: "color-memory" }),
    );

    // Wait for WRONG_DELAY to transition to result
    act(() => { vi.advanceTimersByTime(WRONG_DELAY + 100); });

    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(screen.getByTestId("game-result-panel")).toBeInTheDocument();
  });

  it("그만하기 버튼 클릭 시 result 화면으로 전환된다", async () => {
    vi.mocked(addGameHistory).mockClear();
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const quitButton = screen.getByText("그만하기");
    expect(quitButton).toBeInTheDocument();

    fireEvent.click(quitButton);

    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(screen.getByTestId("game-result-panel")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalledWith(
      expect.objectContaining({ game: "color-memory" }),
    );
  });

  it("result 화면에서 라운드 도달 정보와 등급이 표시된다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // Quit immediately in round 1 → cleared round = 0
    fireEvent.click(screen.getByText("그만하기"));

    expect(screen.getByText("0라운드 도달")).toBeInTheDocument();
    expect(screen.getByTestId("game-result-panel")).toHaveAttribute("data-grade", "F");
  });

  it("showing 상태에서 패드가 disabled이다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const pads = screen.getAllByRole("button", { name: /패드/ });
    // showing 상태에서는 패드가 비활성
    expect(pads[0]).toBeDisabled();
  });

  it("패드에 aria-label이 있다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const pads = screen.getAllByRole("button", { name: /패드/ });
    expect(pads.length).toBeGreaterThan(0);
    // 각 패드에 이름 패드가 포함된 aria-label이 있어야 함
    expect(pads[0].getAttribute("aria-label")).toContain("패드");
  });

  it("result에서 다시 도전 버튼으로 재시작할 수 있다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<ColorMemoryGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    fireEvent.click(screen.getByText("그만하기"));
    expect(screen.getByText("다시 도전")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("다시 도전"));
    });

    expect(screen.getByText("패턴을 기억하세요...")).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });
});
