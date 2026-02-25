import Link from "next/link";
import type { GameContent } from "@/lib/game-content";
import { getRelatedGames } from "@/lib/game-content";
import { UIIcon } from "@/components/ui/icons";

interface GameContentSectionProps {
  content: GameContent;
}

export function GameContentSection({ content }: GameContentSectionProps) {
  return (
    <section className="mt-16 space-y-12">
      <div className="mx-auto h-px max-w-xs bg-border/60" />

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          게임 소개
        </h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          {content.introduction}
        </p>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          플레이 방법
        </h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-text-secondary">
          {content.howToPlay.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          결과 해석 가이드
        </h2>
        <div className="mt-3 space-y-3">
          {content.scoreGuide.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{item.label}</span>
                <span className="text-sm text-text-muted">{item.value}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          알아두면 재미있는 이야기
        </h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          {content.background}
        </p>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          자주 묻는 질문
        </h2>
        <div className="mt-3 space-y-2">
          {content.faq.map((item, i) => (
            <details
              key={i}
              className="group rounded-lg border border-border/60"
            >
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-bg-secondary">
                {item.question}
              </summary>
              <p className="px-4 pb-4 leading-relaxed text-text-secondary">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

interface RelatedGamesProps {
  currentSlug: string;
}

export function RelatedGames({ currentSlug }: RelatedGamesProps) {
  const related = getRelatedGames(currentSlug, 3);

  return (
    <section className="mt-16">
      <div className="mx-auto h-px max-w-xs bg-border/60" />
      <h2 className="mt-12 font-heading text-xl font-semibold tracking-[-0.01em]">
        다른 게임도 즐겨보세요
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {related.map((game) => (
          <Link
            key={game.slug}
            href={`/game/${game.slug}`}
            className="group rounded-lg border border-border/60 p-4 transition-colors hover:bg-bg-secondary"
          >
            <UIIcon icon={game.icon} className="h-6 w-6" />
            <p className="mt-2 text-sm font-medium">
              {game.title}
              <span className="ml-1 inline-block text-text-muted transition-transform duration-300 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {game.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
