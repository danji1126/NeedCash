import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/constants";
import { AdBanner } from "@/components/ads/ad-banner";
import { UIIcon } from "@/components/ui/icons";

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

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
  reaction: ReactionGame,
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
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) notFound();

  const GameComponent = GAME_COMPONENTS[slug];
  if (!GameComponent) notFound();

  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <Link
        href="/game"
        className="text-[13px] tracking-wide text-text-muted transition-opacity hover:opacity-50"
      >
        &larr; Back
      </Link>

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

      <AdBanner className="mt-10" />

      <div className="mt-12">
        <GameComponent />
      </div>

      <AdBanner className="mt-12" />
    </div>
  );
}
