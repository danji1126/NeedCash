// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { addGameHistory } from "@/lib/game-history";
import { MathGame } from "@/components/game/math-game";

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

describe("MathGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.spyOn(Math, "random").mockRestore();
  });

  it("idle 상태에서 난이도 선택과 시작 버튼을 렌더링한다", () => {
    render(<MathGame />);

    expect(screen.getByText("쉬움")).toBeInTheDocument();
    expect(screen.getByText("보통")).toBeInTheDocument();
    expect(screen.getByText("어려움")).toBeInTheDocument();
    expect(screen.getByText("시작하기")).toBeInTheDocument();
  });

  it("난이도 변경 시 설명 텍스트가 변경된다", () => {
    render(<MathGame />);

    expect(screen.getByText("1~20 범위, 덧셈·뺄셈")).toBeInTheDocument();

    fireEvent.click(screen.getByText("보통"));
    expect(screen.getByText("1~50 범위, 사칙연산")).toBeInTheDocument();

    fireEvent.click(screen.getByText("어려움"));
    expect(screen.getByText("1~100 범위, 사칙연산")).toBeInTheDocument();
  });

  it("시작 버튼 클릭 시 카운트다운이 시작된다", async () => {
    render(<MathGame />);

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("준비하세요!")).toBeInTheDocument();
  });

  it("카운트다운 후 playing 상태로 전환되어 문제가 표시된다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { vi.advanceTimersByTime(1000); });

    expect(screen.getByPlaceholderText("?")).toBeInTheDocument();
    expect(screen.getByText("Enter를 눌러 제출")).toBeInTheDocument();
  });

  it("정답을 입력하면 점수가 증가한다", async () => {
    // Math.random=0 → easy mode, operator="+", a=1, b=1, answer=2
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.submit(input.closest("form")!);

    // Score text "1" with "문제" label
    const scoreArea = screen.getByText((content, element) => {
      return element?.tagName === "SPAN" && element?.getAttribute("aria-live") === "polite" && content.includes("1");
    });
    expect(scoreArea).toBeInTheDocument();
  });

  it("오답을 입력하면 streak이 리셋된다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");

    // answer is 2, submit wrong answer 9999
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.submit(input.closest("form")!);

    // No streak display (needs >= 3)
    expect(screen.queryByText(/연속 정답/)).toBeNull();
  });

  it("빈 입력이나 NaN은 무시된다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");

    // Submit empty
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(input.closest("form")!);

    // Submit NaN text
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.submit(input.closest("form")!);

    // Score should remain 0 — check the score span with aria-live and font-bold
    const scoreSpans = screen.getAllByText((content, element) => {
      return element?.tagName === "SPAN" && element?.getAttribute("aria-live") === "polite" && element?.classList.contains("font-bold");
    });
    // The bold score span should contain "0"
    expect(scoreSpans[0].textContent).toContain("0");
  });

  it("60초 타이머가 종료되면 result 상태로 전환된다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    // Simulate 60 seconds elapsed
    vi.spyOn(performance, "now").mockReturnValue(60000);
    act(() => { vi.advanceTimersByTime(100); });

    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(screen.getByTestId("game-result-panel")).toBeInTheDocument();
    expect(vi.mocked(addGameHistory)).toHaveBeenCalledWith(
      expect.objectContaining({ game: "math" }),
    );
  });

  it("3연속 정답 시 streak 표시가 나타난다", async () => {
    // Math.random=0 → "+", a=1, b=1, answer=2
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");

    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, { target: { value: "2" } });
      fireEvent.submit(input.closest("form")!);
      act(() => { vi.advanceTimersByTime(350); });
    }

    expect(screen.getByText(/3 연속 정답/)).toBeInTheDocument();
  });

  it("등급 S: 30문제 이상이면 수학 천재", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");

    // 30문제 정답 (answer=2 for random=0)
    for (let i = 0; i < 30; i++) {
      fireEvent.change(input, { target: { value: "2" } });
      fireEvent.submit(input.closest("form")!);
      act(() => { vi.advanceTimersByTime(350); });
    }

    vi.spyOn(performance, "now").mockReturnValue(60000);
    act(() => { vi.advanceTimersByTime(100); });

    expect(screen.getByTestId("game-result-panel")).toHaveAttribute("data-grade", "S");
  });

  it("등급 F: 5문제 미만이면 계산기를 찾아주세요", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    // 아무것도 안 풀고 60초 경과
    vi.spyOn(performance, "now").mockReturnValue(60000);
    act(() => { vi.advanceTimersByTime(100); });

    expect(screen.getByTestId("game-result-panel")).toHaveAttribute("data-grade", "F");
  });

  it("난이도 hard 선택 후 시작하면 어려운 문제가 나온다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<MathGame />);
    fireEvent.click(screen.getByText("어려움"));
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    // playing 상태로 진입
    expect(screen.getByPlaceholderText("?")).toBeInTheDocument();
  });

  it("정답 피드백이 표시된 후 사라진다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    const input = screen.getByPlaceholderText("?");
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.submit(input.closest("form")!);

    // 정답 후 일정 시간 뒤 피드백 사라짐
    act(() => { vi.advanceTimersByTime(350); });

    // 다음 문제로 넘어감 - 입력 필드가 비어 있음
    expect((screen.getByPlaceholderText("?") as HTMLInputElement).value).toBe("");
  });

  it("result에서 다시 도전 버튼을 누르면 카운트다운부터 재시작한다", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    render(<MathGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });
    act(() => { vi.advanceTimersByTime(3000); });

    vi.spyOn(performance, "now").mockReturnValue(60000);
    act(() => { vi.advanceTimersByTime(100); });

    expect(screen.getByText("다시 도전")).toBeInTheDocument();

    vi.spyOn(performance, "now").mockReturnValue(0);
    await act(async () => {
      fireEvent.click(screen.getByText("다시 도전"));
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("준비하세요!")).toBeInTheDocument();
  });
});
