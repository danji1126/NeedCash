import type { Metadata } from "next";
import Link from "next/link";
import { GAMES } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Games",
  description: "A collection of simple web games",
};

export default function GamePage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-20">
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Playground
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
          Games
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          Simple web games to enjoy.
        </p>
        <div className="mt-6 h-px bg-border/60" />
      </ScrollReveal>

      <div className="mt-0 grid sm:grid-cols-2">
        {GAMES.map((game, i) => (
          <ScrollReveal key={game.slug} delay={i * 0.1}>
            <Link
              href={`/game/${game.slug}`}
              className="group flex flex-col border-b border-border/60 p-8 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary sm:even:border-l"
            >
              <span className="text-3xl">{game.emoji}</span>
              <h2 className="mt-4 font-heading text-xl font-semibold tracking-[-0.01em]">
                {game.title}
                <span className="ml-2 inline-block text-text-muted transition-transform duration-500 group-hover:translate-x-1">
                  &rarr;
                </span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {game.description}
              </p>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
