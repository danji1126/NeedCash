import { describe, it, expect } from "vitest";

// ── Helper functions (extracted for testing) ──

const TOTAL_TEETH = 12;

interface Tooth {
  index: number;
  isMine: boolean;
  isClicked: boolean;
}

function createTeeth(mineCount: number): Tooth[] {
  const mineIndices = new Set<number>();
  while (mineIndices.size < mineCount) {
    mineIndices.add(Math.floor(Math.random() * TOTAL_TEETH));
  }
  return Array.from({ length: TOTAL_TEETH }, (_, i) => ({
    index: i,
    isMine: mineIndices.has(i),
    isClicked: false,
  }));
}

interface Player {
  id: number;
  name: string;
  color: string;
}

function getNextTurnId(players: Player[], currentId: number): number {
  const currentIdx = players.findIndex((p) => p.id === currentId);
  const nextIdx = (currentIdx + 1) % players.length;
  return players[nextIdx].id;
}

// ── Tests ──

describe("createTeeth", () => {
  it("항상 12개 이빨 생성", () => {
    expect(createTeeth(1)).toHaveLength(12);
    expect(createTeeth(3)).toHaveLength(12);
  });

  it("지정된 수만큼 지뢰 생성", () => {
    for (let mines = 1; mines <= 4; mines++) {
      for (let i = 0; i < 10; i++) {
        const teeth = createTeeth(mines);
        expect(teeth.filter((t) => t.isMine)).toHaveLength(mines);
      }
    }
  });

  it("모든 이빨 isClicked = false 초기화", () => {
    const teeth = createTeeth(2);
    expect(teeth.every((t) => !t.isClicked)).toBe(true);
  });

  it("인덱스가 0~11까지 순서대로", () => {
    const teeth = createTeeth(1);
    teeth.forEach((t, i) => {
      expect(t.index).toBe(i);
    });
  });
});

describe("getNextTurnId", () => {
  const makePlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      name: `P${i}`,
      color: "#000",
    }));

  it("다음 플레이어로 턴 이동", () => {
    const players = makePlayers(3);
    expect(getNextTurnId(players, 0)).toBe(1);
    expect(getNextTurnId(players, 1)).toBe(2);
  });

  it("마지막에서 처음으로 순환", () => {
    const players = makePlayers(3);
    expect(getNextTurnId(players, 2)).toBe(0);
  });

  it("2명 게임에서 번갈아 진행", () => {
    const players = makePlayers(2);
    expect(getNextTurnId(players, 0)).toBe(1);
    expect(getNextTurnId(players, 1)).toBe(0);
  });

  it("6명 게임에서 순환", () => {
    const players = makePlayers(6);
    expect(getNextTurnId(players, 5)).toBe(0);
    expect(getNextTurnId(players, 3)).toBe(4);
  });
});

describe("game rules", () => {
  it("기본 지뢰 1개 — 안전 이빨 11개", () => {
    const teeth = createTeeth(1);
    expect(teeth.filter((t) => !t.isMine)).toHaveLength(11);
  });

  it("지뢰 4개 — 안전 이빨 8개", () => {
    const teeth = createTeeth(4);
    expect(teeth.filter((t) => !t.isMine)).toHaveLength(8);
  });

  it("지뢰 수는 1~4 범위", () => {
    expect(createTeeth(1).filter((t) => t.isMine)).toHaveLength(1);
    expect(createTeeth(4).filter((t) => t.isMine)).toHaveLength(4);
  });
});
