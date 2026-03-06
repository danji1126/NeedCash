export interface GameHistoryEntry {
  id: string;
  game: string;
  score: number;
  grade: string;
  title: string;
  metadata: Record<string, unknown>;
  playedAt: string;
}

const HISTORY_KEY = "needcash-game-history";
const MAX_PER_GAME = 100;

export function getGameHistory(game?: string): GameHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const all: GameHistoryEntry[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
    return game ? all.filter((e) => e.game === game) : all;
  } catch {
    return [];
  }
}

export function addGameHistory(
  entry: Omit<GameHistoryEntry, "id" | "playedAt">
): void {
  if (typeof window === "undefined") return;
  const all = getGameHistory();
  const newEntry: GameHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
  };
  const sameGame = all.filter((e) => e.game === entry.game);
  const others = all.filter((e) => e.game !== entry.game);
  const updated = [newEntry, ...sameGame].slice(0, MAX_PER_GAME);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([...updated, ...others]));
}

export function clearGameHistory(game?: string): void {
  if (typeof window === "undefined") return;
  if (!game) {
    localStorage.removeItem(HISTORY_KEY);
    return;
  }
  const all = getGameHistory();
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(all.filter((e) => e.game !== game))
  );
}
