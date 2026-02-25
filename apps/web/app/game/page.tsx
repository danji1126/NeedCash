import type { Metadata } from "next";
import Link from "next/link";
import { GAMES } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { UIIcon } from "@/components/ui/icons";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "게임",
  description:
    "반응속도 테스트, 색감 테스트, 색상 기억력 게임 등 두뇌 훈련과 재미를 동시에 즐기는 웹 게임 모음입니다.",
  openGraph: {
    title: "게임 | NeedCash",
    description:
      "반응속도 테스트, 색감 테스트, 색상 기억력 게임 등 두뇌 훈련과 재미를 동시에 즐기는 웹 게임 모음입니다.",
    url: "/game",
  },
};

export default function GamePage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-20">
      <Breadcrumb
        items={[
          { label: "홈", href: "/" },
          { label: "게임" },
        ]}
      />
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Playground
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
          게임
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          두뇌 훈련부터 확률 실험까지, 다양한 웹 게임을 즐겨보세요.
        </p>
        <div className="mt-6 h-px bg-border/60" />
      </ScrollReveal>

      <div className="px-8 py-6">
        <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            NeedCash 게임 섹션은 단순한 오락을 넘어 인지 능력 훈련과 과학적
            호기심을 충족하는 인터랙티브 웹 게임들을 제공합니다. 모든 게임은
            별도의 설치나 회원가입 없이 브라우저에서 바로 플레이할 수 있으며,
            결과를 통해 자신의 능력을 확인해보세요.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
                두뇌 훈련
              </p>
              <p className="mt-1">
                반응속도 테스트, 색감 테스트, 색상 기억력 게임으로 인지 능력을
                측정하고 개선할 수 있습니다.
              </p>
            </div>
            <div>
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
                확률과 랜덤
              </p>
              <p className="mt-1">
                주사위 굴리기와 로또 번호 생성기로 확률의 세계를 직접
                체험해보세요.
              </p>
            </div>
            <div>
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
                AI 체험
              </p>
              <p className="mt-1">
                동물상 찾기로 AI 이미지 분석 기술을 재미있게 체험할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-0 grid sm:grid-cols-2">
        {GAMES.map((game, i) => (
          <ScrollReveal key={game.slug} delay={i * 0.1}>
            <Link
              href={`/game/${game.slug}`}
              className="group flex flex-col border-b border-border/60 p-8 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary sm:even:border-l"
            >
              <UIIcon icon={game.icon} className="h-8 w-8" />
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
