// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ReactionGame } from "@/components/game/reaction-game";
import { addGameHistory } from "@/lib/game-history";

vi.mock("@/lib/game-history", () => ({
  addGameHistory: vi.fn(),
}));

vi.mock("@/lib/game-session", () => ({
  startGameSession: vi.fn().mockResolvedValue("test-session-id"),
}));

vi.mock("@/components/game/game-result-panel", () => ({
  GameResultPanel: () => <div data-testid="game-result-panel" />,
}));

const mockAddGameHistory = vi.mocked(addGameHistory);

describe("ReactionGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
  });

  it("idle 상태에서 시작 버튼과 횟수 선택이 보인다", () => {
    render(<ReactionGame />);
    expect(screen.getByText("시작하기")).toBeInTheDocument();
    expect(screen.getByLabelText("측정 횟수")).toBeInTheDocument();
    expect(screen.getByLabelText("횟수 줄이기")).toBeInTheDocument();
    expect(screen.getByLabelText("횟수 늘리기")).toBeInTheDocument();
  });

  it("횟수 줄이기/늘리기 버튼이 동작한다", () => {
    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    expect(input.value).toBe("5");

    fireEvent.click(screen.getByLabelText("횟수 늘리기"));
    expect(input.value).toBe("6");

    fireEvent.click(screen.getByLabelText("횟수 줄이기"));
    expect(input.value).toBe("5");
  });

  it("횟수 입력값은 1~20 범위로 클램프된다", () => {
    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);
    expect(input.value).toBe("1");

    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.blur(input);
    expect(input.value).toBe("20");
  });

  it("시작 클릭 후 waiting 상태가 된다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    expect(screen.getByText("초록색이 되면 클릭!")).toBeInTheDocument();
    expect(screen.getByText("기다리세요...")).toBeInTheDocument();
  });

  it("waiting 상태에서 라운드 정보가 표시된다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    expect(screen.getByText(/Round 1 \/ 5/)).toBeInTheDocument();
  });

  it("waiting 상태에서 클릭하면 너무 빨라요 메시지가 나온다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("너무 빨라요!")).toBeInTheDocument();
    expect(screen.getByText("초록색이 될 때까지 기다리세요")).toBeInTheDocument();
  });

  it("tooEarly 후 1.5초 뒤 다시 waiting 상태로 돌아간다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("너무 빨라요!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText("초록색이 되면 클릭!")).toBeInTheDocument();
  });

  it("go 상태에서 클릭하면 반응시간이 기록된다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // waiting → go 전환 (최대 5초 대기)
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    expect(screen.getByText("클릭!")).toBeInTheDocument();

    nowValue = 250;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    // roundResult 상태에서 시간 표시
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("전체 라운드 완료 후 결과 화면이 표시된다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    // 1라운드 설정으로 빠르게 완료
    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // go 상태에서 클릭 → 200ms
    nowValue = 200;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    // 200ms → grade A (S는 200 미만)
    expect(screen.getByText("매의 눈")).toBeInTheDocument();
    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    expect(mockAddGameHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        game: "reaction",
        score: 200,
        grade: "A",
      })
    );
  });

  it("결과에서 최고/최저 시간이 표시된다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // Round 1: waiting → go
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // go 상태에서 클릭 → 150ms
    nowValue = 150;
    let area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    // roundResult → next round
    nowValue = 0;
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Round 2: waiting → go
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // go 상태에서 클릭 → 350ms
    nowValue = 350;
    area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText(/최고 150ms/)).toBeInTheDocument();
    expect(screen.getByText(/최저 350ms/)).toBeInTheDocument();
  });

  it("등급이 평균 반응시간에 따라 결정된다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // 450ms → grade D
    nowValue = 450;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("느긋한 거북이")).toBeInTheDocument();
  });

  it("다시 도전 클릭 시 게임이 재시작된다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    nowValue = 200;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("다시 도전")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("다시 도전"));
    });

    // 다시 waiting 상태로
    expect(screen.getByText("초록색이 되면 클릭!")).toBeInTheDocument();
  });

  it("게임 종료 버튼 클릭 시 idle로 돌아간다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const exitBtn = screen.getByLabelText("게임 종료");
    fireEvent.pointerDown(exitBtn);

    expect(screen.getByText("시작하기")).toBeInTheDocument();
  });

  it("등급 S: 평균 < 200ms이면 번개 반사신경", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    nowValue = 150;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("번개 반사신경")).toBeInTheDocument();
    expect(mockAddGameHistory).toHaveBeenCalledWith(
      expect.objectContaining({ grade: "S" })
    );
  });

  it("등급 F: 평균 >= 500ms이면 졸린 나무늘보", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    nowValue = 550;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.click(area);

    expect(screen.getByText("졸린 나무늘보")).toBeInTheDocument();
    expect(mockAddGameHistory).toHaveBeenCalledWith(
      expect.objectContaining({ grade: "F" })
    );
  });

  it("반응 영역에 aria-label이 있다", async () => {
    render(<ReactionGame />);
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    expect(area).toBeInTheDocument();
  });

  it("waiting 상태에서 라운드 정보가 aria-live로 안내된다", async () => {
    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2" } });
    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    // waiting 상태에서 Round 정보가 표시됨
    expect(screen.getByText(/Round 1 \/ 2/)).toBeInTheDocument();
  });

  it("키보드(Enter/Space)로 반응할 수 있다", async () => {
    let nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);

    render(<ReactionGame />);
    const input = screen.getByLabelText("측정 횟수") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1" } });

    await act(async () => {
      fireEvent.click(screen.getByText("시작하기"));
    });

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    expect(screen.getByText("클릭!")).toBeInTheDocument();

    nowValue = 180;
    const area = screen.getByRole("button", { name: /반응 테스트 영역/ });
    fireEvent.keyDown(area, { key: "Enter" });

    // result 상태 - grade와 title 확인
    expect(screen.getByText("번개 반사신경")).toBeInTheDocument();
    expect(screen.getByText("다시 도전")).toBeInTheDocument();
  });
});
