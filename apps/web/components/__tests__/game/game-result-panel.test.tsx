// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameResultPanel } from "@/components/game/game-result-panel";

// Mock child components
vi.mock("@/components/game/score-submit", () => ({
  ScoreSubmit: (props: Record<string, unknown>) => (
    <div data-testid="score-submit" data-game={props.game} data-score={props.score} />
  ),
}));

vi.mock("@/components/game/leaderboard", () => ({
  Leaderboard: (props: Record<string, unknown>) => (
    <div data-testid="leaderboard" data-game={props.game} />
  ),
}));

vi.mock("@/components/game/game-history-panel", () => ({
  GameHistoryPanel: (props: Record<string, unknown>) => (
    <div data-testid="game-history" data-game={props.game} />
  ),
}));

vi.mock("@/components/game/share-result", () => ({
  ShareResult: (props: Record<string, unknown>) => (
    <div data-testid="share-result" data-game={props.game} />
  ),
}));

const baseProps = {
  game: "reaction",
  score: 250,
  grade: "A",
  title: "Reaction Test",
  shareLines: ["250ms"],
};

describe("GameResultPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("rankable 게임에서 ScoreSubmit, Leaderboard, ShareResult, GameHistory를 모두 렌더링한다", () => {
    render(<GameResultPanel {...baseProps} />);
    expect(screen.getByTestId("score-submit")).toBeInTheDocument();
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("share-result")).toBeInTheDocument();
    expect(screen.getByTestId("game-history")).toBeInTheDocument();
  });

  it("non-rankable 게임에서 ScoreSubmit과 Leaderboard를 렌더링하지 않는다", () => {
    render(<GameResultPanel {...baseProps} game="dice" />);
    expect(screen.queryByTestId("score-submit")).not.toBeInTheDocument();
    expect(screen.queryByTestId("leaderboard")).not.toBeInTheDocument();
    expect(screen.getByTestId("share-result")).toBeInTheDocument();
    expect(screen.getByTestId("game-history")).toBeInTheDocument();
  });

  it("children을 렌더링한다", () => {
    render(
      <GameResultPanel {...baseProps}>
        <p data-testid="child">Result Detail</p>
      </GameResultPanel>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("올바른 game과 score를 ScoreSubmit에 전달한다", () => {
    render(<GameResultPanel {...baseProps} />);
    const submit = screen.getByTestId("score-submit");
    expect(submit).toHaveAttribute("data-game", "reaction");
    expect(submit).toHaveAttribute("data-score", "250");
  });

  it("ShareResult에 game을 전달한다", () => {
    render(<GameResultPanel {...baseProps} />);
    expect(screen.getByTestId("share-result")).toHaveAttribute("data-game", "reaction");
  });

  it("GameHistoryPanel에 game을 전달한다", () => {
    render(<GameResultPanel {...baseProps} />);
    expect(screen.getByTestId("game-history")).toHaveAttribute("data-game", "reaction");
  });
});
