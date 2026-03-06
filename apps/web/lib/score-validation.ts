export type RankableGame =
  | "reaction"
  | "color-sense"
  | "color-memory"
  | "typing"
  | "math";

export const SCORE_ORDER: Record<RankableGame, "ASC" | "DESC"> = {
  reaction: "ASC",
  "color-sense": "DESC",
  "color-memory": "DESC",
  typing: "DESC",
  math: "DESC",
};

export const SCORE_UNIT: Record<RankableGame, string> = {
  reaction: "ms",
  "color-sense": "level",
  "color-memory": "level",
  typing: "WPM",
  math: "문제",
};

export const SCORE_RANGES: Record<
  RankableGame,
  { min: number; max: number }
> = {
  reaction: { min: 100, max: 2000 },
  "color-sense": { min: 1, max: 50 },
  "color-memory": { min: 1, max: 30 },
  typing: { min: 0, max: 250 },
  math: { min: 0, max: 120 },
};

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_\-]{3,12}$/;
const RESERVED_NAMES = [
  "admin",
  "system",
  "관리자",
  "운영자",
  "needcash",
];

export function isRankableGame(slug: string): slug is RankableGame {
  return slug in SCORE_ORDER;
}

export function validateScore(game: RankableGame, score: number): boolean {
  const range = SCORE_RANGES[game];
  return Number.isFinite(score) && score >= range.min && score <= range.max;
}

export function validateNickname(
  name: string
): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: true };
  if (!NICKNAME_REGEX.test(trimmed))
    return { valid: false, error: "한글, 영문, 숫자, _, - (3-12자)" };
  if (RESERVED_NAMES.includes(trimmed.toLowerCase()))
    return { valid: false, error: "사용할 수 없는 닉네임" };
  return { valid: true };
}

export function getScoreType(game: RankableGame): string {
  return SCORE_ORDER[game] === "ASC" ? "ms_lower" : "higher";
}
