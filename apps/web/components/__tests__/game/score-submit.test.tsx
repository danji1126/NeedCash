// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoreSubmit } from "@/components/game/score-submit";

vi.mock("next/script", () => ({
  default: () => null,
}));

function mockFetch(response: object, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
}

describe("ScoreSubmit", () => {
  beforeEach(() => {
    global.fetch = mockFetch({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("닉네임 입력과 등록/건너뛰기 버튼을 렌더링한다", () => {
    render(<ScoreSubmit game="reaction" score={250} />);

    expect(screen.getByPlaceholderText(/닉네임/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "건너뛰기" })).toBeInTheDocument();
  });

  it("점수와 단위를 표시한다", () => {
    render(<ScoreSubmit game="reaction" score={250} />);
    expect(screen.getByText(/250.*ms.*기록을 리더보드에 등록하세요/s)).toBeInTheDocument();
  });

  it("localStorage에 저장된 닉네임을 복원한다", () => {
    localStorage.setItem("needcash-nickname", "테스터");
    render(<ScoreSubmit game="typing" score={80} />);

    const input = screen.getByPlaceholderText(/닉네임/) as HTMLInputElement;
    expect(input.value).toBe("테스터");
  });

  it("닉네임이 너무 짧으면 에러를 표시한다", async () => {
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    const input = screen.getByPlaceholderText(/닉네임/);
    await user.type(input, "ab");
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByText(/3-12자/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("특수문자 닉네임이면 에러를 표시한다", async () => {
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    const input = screen.getByPlaceholderText(/닉네임/);
    await user.type(input, "ab@#$");
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByText(/3-12자/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("성공적으로 제출하면 onSubmitted를 호출한다", async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    render(
      <ScoreSubmit game="reaction" score={250} onSubmitted={onSubmitted} />
    );

    const input = screen.getByPlaceholderText(/닉네임/);
    fireEvent.change(input, { target: { value: "player01" } });
    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledOnce();
    });
    expect(screen.getByText(/리더보드에 등록되었습니다/)).toBeInTheDocument();
  });

  it("성공적으로 제출하면 닉네임을 localStorage에 저장한다", async () => {
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    const input = screen.getByPlaceholderText(/닉네임/);
    fireEvent.change(input, { target: { value: "player01" } });
    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(localStorage.getItem("needcash-nickname")).toBe("player01");
    });
  });

  it("HTTP 429 응답 시 rate limit 메시지를 표시한다", async () => {
    global.fetch = mockFetch({ retryAfter: 30 }, 429);
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(screen.getByText(/30초 제한/)).toBeInTheDocument();
    });
  });

  it("네트워크 오류 시 에러 메시지를 표시한다", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(screen.getByText(/네트워크 오류/)).toBeInTheDocument();
    });
  });

  it("건너뛰기 버튼 클릭 시 onSkipped를 호출한다", async () => {
    const user = userEvent.setup();
    const onSkipped = vi.fn();
    render(
      <ScoreSubmit game="reaction" score={250} onSkipped={onSkipped} />
    );

    await user.click(screen.getByRole("button", { name: "건너뛰기" }));
    expect(onSkipped).toHaveBeenCalledOnce();
  });

  it("제출 중에는 등록 버튼이 비활성화된다", async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "등록 중..." })).toBeDisabled();
    });
  });

  it("올바른 fetch body를 전송한다", async () => {
    const user = userEvent.setup();
    render(
      <ScoreSubmit
        game="typing"
        score={120}
        metadata={{ accuracy: 95 }}
      />
    );

    const input = screen.getByPlaceholderText(/닉네임/);
    fireEvent.change(input, { target: { value: "typer123" } });
    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: "typing",
          score: 120,
          nickname: "typer123",
          metadata: { accuracy: 95 },
        }),
      });
    });
  });

  it("빈 닉네임은 null로 전송한다", async () => {
    const user = userEvent.setup();
    render(<ScoreSubmit game="reaction" score={250} />);

    await user.click(screen.getByRole("button", { name: "등록" }));

    await waitFor(() => {
      const body = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
      );
      expect(body.nickname).toBeNull();
    });
  });
});
