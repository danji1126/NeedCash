import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/constants";
import { UIIcon } from "@/components/ui/icons";
import { GameJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getGameContent } from "@/lib/game-content";
import {
  GameContentSection,
  RelatedGames,
} from "@/components/game/game-content-section";

const DiceGame = dynamic(() =>
  import("@/components/game/dice-game").then((m) => m.DiceGame),
);
const LottoGame = dynamic(() =>
  import("@/components/game/lotto-game").then((m) => m.LottoGame),
);
const AnimalFaceGame = dynamic(() =>
  import("@/components/game/animal-face").then((m) => m.AnimalFaceGame),
);
const ReactionGame = dynamic(() =>
  import("@/components/game/reaction-game").then((m) => m.ReactionGame),
);
const ColorSenseGame = dynamic(() =>
  import("@/components/game/color-sense-game").then((m) => m.ColorSenseGame),
);
const ColorMemoryGame = dynamic(() =>
  import("@/components/game/color-memory-game").then((m) => m.ColorMemoryGame),
);
const TypingGame = dynamic(() =>
  import("@/components/game/typing-game").then((m) => m.TypingGame),
);
const MathGame = dynamic(() =>
  import("@/components/game/math-game").then((m) => m.MathGame),
);
const PersonalityQuiz = dynamic(() =>
  import("@/components/game/personality-quiz").then((m) => m.PersonalityQuiz),
);

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
  reaction: ReactionGame,
  "color-sense": ColorSenseGame,
  "color-memory": ColorMemoryGame,
  typing: TypingGame,
  math: MathGame,
  quiz: PersonalityQuiz,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return {};
  return {
    title: game.title,
    description: game.description,
    openGraph: {
      title: `${game.title} | NeedCash`,
      description: game.description,
      url: `/game/${slug}`,
    },
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) notFound();

  const GameComponent = GAME_COMPONENTS[slug];
  if (!GameComponent) notFound();

  const content = getGameContent(slug);

  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <GameJsonLd
        name={game.title}
        description={game.description}
        url={`/game/${slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", href: "/" },
          { name: "게임", href: "/game" },
          { name: game.title, href: `/game/${slug}` },
        ]}
      />
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "게임", href: "/game" },
          { label: game.title },
        ]}
      />

      <div className="mt-10 text-center">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Game
        </p>
        <span className="mt-4 inline-block">
          <UIIcon icon={game.icon} className="h-10 w-10" />
        </span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em]">
          {game.title}
        </h1>
        <p className="mt-2 text-text-secondary">{game.description}</p>
        <div className="mx-auto mt-6 h-px max-w-xs bg-border/60" />
      </div>

      <div className="mt-12">
        <GameComponent />
      </div>

      {content && <GameContentSection content={content} />}
      <RelatedGames currentSlug={slug} />
    </div>
  );
}
