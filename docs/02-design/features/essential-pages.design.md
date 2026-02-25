# Design: essential-pages (PDCA-6)

> **Feature**: essential-pages
> **Plan 문서**: `docs/01-plan/features/essential-pages.plan.md`
> **작성일**: 2026-02-25
> **구현 순서**: FR-02 → FR-05 → FR-01 → FR-03 → FR-04

---

## 1. FR-02: 쿠키 동의 배너

### 1.1 컴포넌트 생성

**`apps/web/components/ui/cookie-consent.tsx`** (CREATE):

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";

const STORAGE_KEY = "needcash-cookie-consent";

export function CookieConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setConsent("granted");
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setConsent("denied");
  };

  return (
    <>
      {consent === "granted" && (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7452986546914975"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {consent === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              이 사이트는 서비스 개선과 맞춤 광고를 위해 쿠키를 사용합니다.{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                개인정보처리방침
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleDecline}
                className="rounded-[var(--radius-button,0px)] border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
              >
                거부
              </button>
              <button
                onClick={handleAccept}
                className="rounded-[var(--radius-button,0px)] bg-accent px-4 py-2 text-sm text-bg transition-colors hover:bg-accent-hover"
              >
                수락
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### 1.2 레이아웃 수정

**`apps/web/app/layout.tsx`** (EDIT):

1. `import Script from "next/script";` 제거 (더 이상 직접 사용하지 않음)
2. `import { CookieConsent } from "@/components/ui/cookie-consent";` 추가
3. `<Script ... adsbygoogle .../>` 삭제 (CookieConsent 내부로 이동)
4. `</DesignProvider>` 뒤, `</body>` 전에 `<CookieConsent />` 추가

변경 후 layout.tsx body 부분:

```tsx
<body className={`${pretendard.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}>
  <a href="#main-content" className="sr-only focus:not-sr-only ...">
    본문으로 건너뛰기
  </a>
  <WebSiteJsonLd />
  <DesignProvider>
    <GlassBackground />
    <Header />
    <main id="main-content" className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    <Footer />
  </DesignProvider>
  <CookieConsent />
</body>
```

`Script` import와 `<Script async src="...adsbygoogle..." />` 제거.

---

## 2. FR-05: E-E-A-T 신호

### 2.1 PostMeta 인터페이스 확장

**`apps/web/lib/mdx.ts`** (EDIT):

`PostMeta` 인터페이스에 `updatedAt` 필드 추가:

```tsx
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;  // 추가
  category: string;
  tags: string[];
  published: boolean;
  readingTime: number;
}
```

`getAllPosts()` 함수에서 `updatedAt` 파싱 추가:

```tsx
return {
  slug,
  title: data.title ?? slug,
  description: data.description ?? "",
  date: data.date ?? "",
  updatedAt: data.updatedAt ?? undefined,  // 추가
  category: data.category ?? "etc",
  tags: data.tags ?? [],
  published: data.published !== false,
  readingTime,
} satisfies PostMeta;
```

`getPostBySlug()` 함수도 동일하게 `updatedAt` 추가.

### 2.2 저자 프로필 컴포넌트

**`apps/web/components/blog/author-profile.tsx`** (CREATE):

```tsx
export function AuthorProfile() {
  return (
    <div className="mt-16 border-t border-border/60 pt-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-lg font-bold text-text-muted">
          JB
        </div>
        <div>
          <p className="font-heading text-sm font-semibold">Jiinbae</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            7년차 풀스택 개발자. 웹 기술과 인터랙티브 경험에 관심이 많습니다.
            NeedCash에서 개발 과정과 다양한 실험을 기록합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 2.3 블로그 포스트 페이지에 통합

**`apps/web/app/blog/[slug]/page.tsx`** (EDIT):

1. `import { AuthorProfile } from "@/components/blog/author-profile";` 추가
2. 날짜 표시 영역에 `updatedAt` 지원 추가
3. `<RelatedPosts />` 전에 `<AuthorProfile />` 추가

날짜 표시 변경 (header 내부):

```tsx
<div className="mt-4 flex flex-wrap gap-3 text-[13px] text-text-muted">
  <time>{post.meta.date}</time>
  {post.meta.updatedAt && (
    <>
      <span>&middot;</span>
      <time>(수정: {post.meta.updatedAt})</time>
    </>
  )}
  <span>&middot;</span>
  <span>{post.meta.readingTime} min read</span>
</div>
```

AuthorProfile 위치 (MDX 콘텐츠 + TOC div 닫힌 뒤):

```tsx
      </div>  {/* lg:grid 닫힘 */}

      <AuthorProfile />
      <RelatedPosts currentSlug={slug} />
    </article>
```

### 2.4 About 페이지 개인 소개 추가

**`apps/web/app/about/page.tsx`** (EDIT):

"사이트 소개" 섹션 뒤에 "운영자 소개" 섹션 추가:

```tsx
<section>
  <h2 className="font-heading text-xl font-semibold text-text-primary">
    운영자 소개
  </h2>
  <p className="mt-3">
    안녕하세요, NeedCash를 운영하는 Jiinbae입니다. 7년차 풀스택 개발자로
    웹 프론트엔드, 모바일 앱, 서버 개발 경험을 가지고 있습니다. 새로운
    기술을 탐구하고 실험하는 것을 좋아하며, 그 과정에서 배운 것들을 이
    사이트에 기록하고 있습니다.
  </p>
  <p className="mt-3">
    주짓수를 즐기는 취미 운동인이기도 하며, 도복 리뷰와 같은 라이프스타일
    콘텐츠도 함께 다루고 있습니다.
  </p>
</section>
```

---

## 3. FR-01: 기존 블로그 씬 콘텐츠 보강

### 3.1 hello-world.mdx 보강

**`content/blog/hello-world.mdx`** (EDIT, 전체 교체):

현재 ~400자 → 목표 1,500자+

보강 내용:
- 프로젝트를 시작하게 된 배경과 동기 (개인 프로젝트 허브 필요성)
- NeedCash라는 이름의 의미
- 블로그 섹션: 개발 팁, 제품 리뷰, 라이프스타일
- 게임 섹션: 두뇌 훈련, 확률 게임 소개
- 기술 스택 선택 이유 (왜 Next.js 15, 왜 MDX, 왜 Tailwind CSS 4)
- 디자인 시스템 소개 (4가지 디자인 x 4가지 테마 = 16 조합)
- 향후 계획과 로드맵

frontmatter에 `updatedAt` 추가:

```yaml
---
title: "Hello World - NeedCash를 소개합니다"
description: "개발자의 프로토타입 허브 NeedCash를 소개합니다. 블로그, 게임, 이력서를 하나의 공간에서 만나보세요."
date: "2026-02-01"
updatedAt: "2026-02-25"
category: "etc"
tags: ["intro", "needcash", "nextjs"]
published: true
---
```

### 3.2 getting-started.mdx 보강

**`content/blog/getting-started.mdx`** (EDIT, 전체 교체):

현재 ~600자 → 목표 1,500자+

보강 내용:
- 개발 환경 사전 요구사항 (Node.js, pnpm 설치 설명)
- 저장소 클론 및 실행 단계 상세화
- 프로젝트 구조 각 디렉토리별 상세 설명
- MDX 블로그 글 작성 가이드 (frontmatter 필드 설명, 마크다운 문법)
- 게임 추가 가이드 (컴포넌트 → 아이콘 → 상수 → 페이지 흐름)
- 디자인/테마 시스템 작동 원리 소개
- 배포 프로세스 (Cloudflare Pages)
- 기여 가이드 (PR 방법)

frontmatter에 `updatedAt` 추가:

```yaml
---
title: "NeedCash 시작하기: 로컬 개발 환경부터 블로그 작성까지"
description: "NeedCash 프로젝트를 로컬에서 실행하고, 블로그 글을 작성하고, 게임을 추가하는 방법을 단계별로 안내합니다."
date: "2026-02-02"
updatedAt: "2026-02-25"
category: "tech"
tags: ["nextjs", "guide", "mdx", "development"]
published: true
---
```

---

## 4. FR-03: 게임 허브 한국어 소개 보강

### 4.1 메타데이터 한국어 전환

**`apps/web/app/game/page.tsx`** (EDIT):

```tsx
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
```

### 4.2 소개 텍스트 보강

GamePage 컴포넌트 내부, 기존 소개 영역 교체:

```tsx
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
      별도의 설치나 회원가입 없이 브라우저에서 바로 플레이할 수 있습니다.
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
```

---

## 5. FR-04: 신규 블로그 포스트 3개

### 5.1 반응속도 과학

**`content/blog/reaction-speed-science.mdx`** (CREATE):

```yaml
---
title: "반응 속도의 과학: 당신의 뇌는 얼마나 빠를까?"
description: "인간의 반응 속도는 어떻게 결정될까? 신경과학의 관점에서 반응 속도의 원리를 알아보고, 직접 테스트해보세요."
date: "2026-02-25"
category: "science"
tags: ["brain", "reaction-time", "neuroscience", "game"]
published: true
---
```

구조:
1. 도입 (~300자): 일상에서 반응속도가 중요한 순간들
2. 반응 속도란? (~400자): 자극 → 인지 → 반응의 과정, 평균 반응시간 (200-250ms)
3. 신경과학적 배경 (~500자): 시냅스 전달, 수초화, 신경 경로
4. 반응 속도에 영향을 주는 요인 (~400자): 나이, 수면, 카페인, 연습
5. 직접 테스트하기 (~200자): `/game/reaction` 링크, 점수 해석 가이드
6. 일상에서 반응속도 개선하기 (~300자): 수면, 운동, 두뇌 훈련 팁
7. 참고 자료

### 5.2 색감의 세계

**`content/blog/color-sense-guide.mdx`** (CREATE):

```yaml
---
title: "색감 테스트로 알아보는 색각의 세계"
description: "인간의 눈은 얼마나 많은 색을 구별할 수 있을까? 색각의 과학과 색감 능력을 알아보고, 직접 테스트해보세요."
date: "2026-02-25"
category: "science"
tags: ["color", "vision", "perception", "game"]
published: true
---
```

구조:
1. 도입 (~300자): 색상 인식의 일상적 중요성 (디자인, 패션 등)
2. 색각의 과학 (~500자): 원추세포 3종류(L, M, S), 색상 인식 메커니즘
3. 사람마다 다른 색감 (~400자): 4색형 색각, 색각 이상, 성별 차이
4. 색감 능력 측정 (~300자): 먼셀 색상 테스트, 디지털 색감 테스트 원리
5. 직접 테스트하기 (~200자): `/game/color-sense` 링크, 난이도 설명
6. 색감 향상 팁 (~300자): 색상 관찰 습관, 디자인 도구 활용
7. 참고 자료

### 5.3 기억력과 패턴 인식

**`content/blog/color-memory-science.mdx`** (CREATE):

```yaml
---
title: "기억력과 패턴 인식: 사이먼 게임의 인지과학"
description: "작업 기억은 어떻게 작동할까? 인지과학의 관점에서 기억력의 원리를 알아보고, 색상 기억력 게임으로 직접 훈련해보세요."
date: "2026-02-25"
category: "science"
tags: ["memory", "cognitive-science", "pattern", "game"]
published: true
---
```

구조:
1. 도입 (~300자): 사이먼(Simon) 게임의 역사, 일상에서의 기억력
2. 작업 기억이란? (~500자): 밀러의 법칙(7±2), 단기 기억 vs 장기 기억
3. 패턴 인식의 원리 (~400자): 청킹(chunking), 반복 효과
4. 게임으로 두뇌 훈련하기 (~300자): 게이미피케이션 효과, 난이도 점진적 증가
5. 직접 도전하기 (~200자): `/game/color-memory` 링크, 레벨 설명
6. 기억력 향상 전략 (~300자): 시각화, 스토리 기법, 규칙적 수면
7. 참고 자료

---

## 6. 구현 순서 및 변경 파일 요약

### 구현 순서

```
1. FR-02: 쿠키 동의 배너 (cookie-consent.tsx + layout.tsx)
2. FR-05: E-E-A-T 신호 (author-profile.tsx + mdx.ts + blog/[slug]/page.tsx + about/page.tsx)
3. FR-01: 기존 씬 콘텐츠 보강 (hello-world.mdx + getting-started.mdx)
4. FR-03: 게임 허브 한국어 보강 (game/page.tsx)
5. FR-04: 신규 블로그 포스트 (3개 MDX 파일)
```

### 변경 파일 목록 (11개)

| # | 파일 | 변경 | FR |
|---|------|------|-----|
| 1 | `components/ui/cookie-consent.tsx` | CREATE | FR-02 |
| 2 | `app/layout.tsx` | EDIT (Script → CookieConsent) | FR-02 |
| 3 | `components/blog/author-profile.tsx` | CREATE | FR-05 |
| 4 | `lib/mdx.ts` | EDIT (updatedAt 필드) | FR-05 |
| 5 | `app/blog/[slug]/page.tsx` | EDIT (updatedAt 표시 + AuthorProfile) | FR-05 |
| 6 | `app/about/page.tsx` | EDIT (운영자 소개 추가) | FR-05 |
| 7 | `content/blog/hello-world.mdx` | EDIT (전체 보강) | FR-01 |
| 8 | `content/blog/getting-started.mdx` | EDIT (전체 보강) | FR-01 |
| 9 | `app/game/page.tsx` | EDIT (한국어 + 소개 텍스트) | FR-03 |
| 10 | `content/blog/reaction-speed-science.mdx` | CREATE | FR-04 |
| 11 | `content/blog/color-sense-guide.mdx` | CREATE | FR-04 |
| 12 | `content/blog/color-memory-science.mdx` | CREATE | FR-04 |

---

## 7. 검증 항목 (12개)

| # | 항목 | 검증 방법 | FR |
|---|------|----------|-----|
| 1 | `pnpm build` 성공 (0 errors) | 빌드 실행 | ALL |
| 2 | `pnpm lint` 통과 (0 warnings) | 린트 실행 | ALL |
| 3 | 쿠키 동의 배너 표시 | 빌드 HTML에 쿠키 관련 텍스트 존재 | FR-02 |
| 4 | AdSense 스크립트 layout.tsx에서 제거 | layout.tsx에 adsbygoogle Script 없음 | FR-02 |
| 5 | 저자 프로필 컴포넌트 존재 | author-profile.tsx 파일 존재 + blog 페이지에 import | FR-05 |
| 6 | updatedAt 필드 지원 | mdx.ts PostMeta에 updatedAt 타입 존재 | FR-05 |
| 7 | About 페이지 운영자 소개 | "운영자 소개" 텍스트 존재 | FR-05 |
| 8 | hello-world 1,500자+ | 글자 수 카운트 | FR-01 |
| 9 | getting-started 1,500자+ | 글자 수 카운트 | FR-01 |
| 10 | 게임 허브 한국어 메타 + 소개 300자+ | metadata.title = "게임", 소개 텍스트 확인 | FR-03 |
| 11 | 신규 블로그 3개 각 2,000자+ | 글자 수 카운트 | FR-04 |
| 12 | 총 블로그 포스트 10개 | content/blog/*.mdx 파일 개수 | FR-04 |

---

## 8. 기술 결정 근거

### 8.1 쿠키 동의 → AdSense 조건부 로드

`output: 'export'` 환경에서 서버 사이드 쿠키 읽기가 불가능하므로 localStorage 기반 동의 관리를 사용한다. AdSense `<Script>` 태그를 CookieConsent 컴포넌트 내부로 이동하여 동의(granted) 시에만 로드한다.

### 8.2 저자 프로필 정적 컴포넌트

단일 저자 사이트이므로 JSON/DB 기반 동적 저자 데이터 불필요. 하드코딩된 정적 컴포넌트로 충분하다. 향후 복수 저자 지원 시 리팩토링 가능.

### 8.3 updatedAt optional 필드

기존 7개 포스트 중 보강하는 2개만 updatedAt을 추가한다. 나머지 5개는 변경 없으므로 optional 필드로 처리하여 하위 호환성 유지.

### 8.4 블로그 포스트 카테고리 "science"

기존 카테고리: etc, tech, dev, review. 게임 연결 교육 포스트는 "science" 카테고리를 신설하여 기존 콘텐츠와 구분한다.
