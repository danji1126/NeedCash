import { GAMES } from "@/lib/constants";
import type { Game } from "@/lib/constants";

export interface GameContent {
  slug: string;
  introduction: string;
  howToPlay: string[];
  scoreGuide: {
    label: string;
    value: string;
    description: string;
  }[];
  background: string;
  faq: {
    question: string;
    answer: string;
  }[];
  relatedBlog?: {
    slug: string;
    title: string;
    description: string;
  };
}

import diceData from "@/content/games/dice.json";
import lottoData from "@/content/games/lotto.json";
import animalFaceData from "@/content/games/animal-face.json";
import reactionData from "@/content/games/reaction.json";
import colorSenseData from "@/content/games/color-sense.json";
import colorMemoryData from "@/content/games/color-memory.json";
import typingData from "@/content/games/typing.json";
import mathData from "@/content/games/math.json";
import quizData from "@/content/games/quiz.json";

const GAME_CONTENTS: GameContent[] = [
  diceData as GameContent,
  lottoData as GameContent,
  animalFaceData as GameContent,
  reactionData as GameContent,
  colorSenseData as GameContent,
  colorMemoryData as GameContent,
  typingData as GameContent,
  mathData as GameContent,
  quizData as GameContent,
];

export function getGameContent(slug: string): GameContent | undefined {
  return GAME_CONTENTS.find((g) => g.slug === slug);
}

export function getRelatedGames(
  currentSlug: string,
  count: number = 3,
): Game[] {
  return GAMES.filter((g) => g.slug !== currentSlug).slice(0, count);
}
