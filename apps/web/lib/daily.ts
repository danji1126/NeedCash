// Seeded PRNG using date string as seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  // Simple LCG
  hash = Math.abs(((hash * 1103515245) + 12345) & 0x7fffffff);
  return (hash % 1000) / 1000;
}

export function getDailyGame(games: { slug: string }[]): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const rand = seededRandom(today);
  const index = Math.floor(rand * games.length);
  return games[index].slug;
}

// Streak management
const STREAK_KEY = "needcash-daily-streak";

interface StreakData {
  current: number;
  best: number;
  lastVisit: string;
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") return { current: 0, best: 0, lastVisit: "" };

  try {
    const streak = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
    return {
      current: streak.current || 0,
      best: streak.best || 0,
      lastVisit: streak.lastVisit || "",
    };
  } catch {
    return { current: 0, best: 0, lastVisit: "" };
  }
}

export function updateStreak(): StreakData {
  if (typeof window === "undefined") return { current: 0, best: 0, lastVisit: "" };

  const today = new Date().toISOString().split("T")[0];
  const data = getStreak();

  if (data.lastVisit === today) return data; // already visited today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newCurrent: number;
  if (data.lastVisit === yesterdayStr) {
    newCurrent = data.current + 1;
  } else {
    newCurrent = 1;
  }

  const newData: StreakData = {
    current: newCurrent,
    best: Math.max(data.best, newCurrent),
    lastVisit: today,
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
  return newData;
}
