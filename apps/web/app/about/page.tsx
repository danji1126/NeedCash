import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "NeedCash 소개 및 연락처",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
        About
      </p>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
        NeedCash
      </h1>
      <p className="mt-3 text-text-secondary leading-relaxed">
        프로토타입 허브 - 다양한 아이디어를 하나의 공간에서.
      </p>
      <div className="mt-6 h-px bg-border/60" />

      <article className="prose-custom mt-12 space-y-8 text-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            사이트 소개
          </h2>
          <p className="mt-3">
            NeedCash는 개발, 블로그, 게임, 이력서 등 다양한 프로토타입을
            하나의 공간에서 관리하는 개인 프로젝트 허브입니다. 개발 과정에서
            배운 것들을 기록하고, 다양한 실험을 공유하는 공간입니다.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            제공 서비스
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-text-primary">Blog</strong> - 개발 팁,
              제품 리뷰, 라이프스타일 등 다양한 주제의 글
            </li>
            <li>
              <strong className="text-text-primary">Game</strong> - 주사위
              굴리기, 로또 번호 생성기 등 간단한 웹 게임
            </li>
            <li>
              <strong className="text-text-primary">Resume</strong> -
              개발자 포트폴리오 및 이력서
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            기술 스택
          </h2>
          <p className="mt-3">
            본 사이트는 다음 기술로 제작되었습니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Next.js 15 (App Router, Static Export)</li>
            <li>TypeScript 5</li>
            <li>Tailwind CSS 4</li>
            <li>MDX (블로그 콘텐츠)</li>
            <li>Framer Motion (애니메이션)</li>
            <li>Cloudflare Pages (호스팅)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            연락처
          </h2>
          <p className="mt-3">
            문의사항이나 피드백은 아래로 연락해 주시기 바랍니다.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              이메일:{" "}
              <a
                href="mailto:danji1126@gmail.com"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                danji1126@gmail.com
              </a>
            </li>
            <li>
              GitHub:{" "}
              <a
                href="https://github.com/danji1126"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/danji1126
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            법적 안내
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <Link
                href="/privacy"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-text-primary underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                이용약관
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
