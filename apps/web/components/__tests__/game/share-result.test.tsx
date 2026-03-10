// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { ShareResult } from "@/components/game/share-result";

vi.mock("@/lib/share", () => ({
  buildShareText: vi.fn(({ game, title, lines }: { game: string; title: string; lines: string[] }) =>
    `[NeedCash] ${title}\n${lines.join("\n")}\nhttps://needcash.dev/game/${game}`
  ),
  copyToClipboard: vi.fn(),
}));

import { copyToClipboard, buildShareText } from "@/lib/share";

const props = {
  game: "reaction",
  title: "Reaction Test",
  lines: ["250ms", "Grade: A"],
};

describe("ShareResult", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it("'결과 공유' 버튼을 렌더링한다", () => {
    render(<ShareResult {...props} />);
    expect(screen.getByText("결과 공유")).toBeInTheDocument();
  });

  it("클릭 시 buildShareText와 copyToClipboard를 호출한다", async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    render(<ShareResult {...props} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(buildShareText).toHaveBeenCalledWith(props);
    expect(copyToClipboard).toHaveBeenCalled();
  });

  it("복사 성공 시 '복사됨!'으로 텍스트가 변경된다", async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    render(<ShareResult {...props} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByText("복사됨!")).toBeInTheDocument();
  });

  it("2초 후 '결과 공유'로 텍스트가 복원된다", async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    render(<ShareResult {...props} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByText("복사됨!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("결과 공유")).toBeInTheDocument();
  });

  it("복사 실패 시 텍스트가 변경되지 않는다", async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(false);
    render(<ShareResult {...props} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByText("결과 공유")).toBeInTheDocument();
    expect(screen.queryByText("복사됨!")).not.toBeInTheDocument();
  });
});
