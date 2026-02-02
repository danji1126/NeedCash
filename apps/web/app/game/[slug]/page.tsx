import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GAMES } from "@/lib/constants";
import { DiceGame } from "@/components/game/dice-game";
import { LottoGame } from "@/components/game/lotto-game";

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
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
        <span className="mt-4 inline-block text-4xl">{game.emoji}</span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em]">
          {game.title}
        </h1>
        <p className="mt-2 text-text-secondary">{game.description}</p>
        <div className="mx-auto mt-6 h-px max-w-xs bg-border/60" />
      </div>

      <div className="mt-12">
        <GameComponent />
      </div>
    </div>
  );
}
