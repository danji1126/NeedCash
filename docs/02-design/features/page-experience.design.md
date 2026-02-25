# Design: page-experience (PDCA-5)

> **Feature**: page-experience
> **Plan 문서**: `docs/01-plan/features/page-experience.plan.md`
> **작성일**: 2026-02-25
> **구현 순서**: FR-01 → FR-02 → FR-03 → FR-04 → FR-05

---

## 1. FR-01: 폰트 최적화

### 1.1 현재 상태

- 파일: `public/fonts/PretendardVariable.woff2` (2.0MB, 11,172 글리프)
- 로딩: `next/font/local` + `display: swap` + `preload: true`
- 문제: 전체 한글 + CJK 글리프 포함으로 과대

### 1.2 구현: `pyftsubset`으로 서브셋 생성

빌드 타임에 한 번 실행하는 일회성 작업.

**서브셋 범위** (유니코드 블록):
```
U+0000-007F       # Basic Latin (ASCII)
U+0080-00FF       # Latin-1 Supplement
U+2000-206F       # General Punctuation (—, –, …, ', ', ", ")
U+2190-21FF       # Arrows (→, ←, ↑, ↓)
U+2200-22FF       # Mathematical Operators
U+25A0-25FF       # Geometric Shapes
U+3000-303F       # CJK Symbols (「」、。 등)
U+3130-318F       # Hangul Compatibility Jamo
U+AC00-D7AF       # Hangul Syllables (가~힣)
U+FF00-FFEF       # Halfwidth/Fullwidth Forms
```

**실행 명령**:
```bash
pip install fonttools brotli
pyftsubset public/fonts/PretendardVariable.woff2 \
  --output-file=public/fonts/PretendardVariable.subset.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --unicodes="U+0000-00FF,U+2000-206F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+3000-303F,U+3130-318F,U+AC00-D7AF,U+FF00-FFEF"
```

**목표**: 2.0MB → **< 300KB**

### 1.3 파일 변경

**`apps/web/app/layout.tsx`** (EDIT, line 14-18):

```tsx
const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/PretendardVariable.subset.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
  preload: true,
});
```

변경 사항: `PretendardVariable.woff2` → `PretendardVariable.subset.woff2`

### 1.4 정리

서브셋 생성 후 원본 `PretendardVariable.woff2` (2.0MB)는 삭제한다.

---

## 2. FR-02: 이미지 최적화

### 2.1 현재 상태

| 파일 | 크기 | 경로 |
|------|------|------|
| bullterrier-houhou-1.png | 3.1MB | `public/blog/bullterrier-houhou/` |
| joker-gi-1.png | 1.0MB | `public/blog/joker-gi/` |
| iterm2-settings-1.png | 278KB | `public/blog/iterm2-korean-fix/` |
| iterm2-settings-2.png | 145KB | `public/blog/iterm2-korean-fix/` |

### 2.2 구현: `sharp` CLI로 WebP 변환

**설치 및 변환**:
```bash
pnpm add -D sharp-cli
# 또는 npx sharp 사용

# 각 이미지를 WebP로 변환 + 최대 폭 1200px 리사이즈
npx sharp -i public/blog/bullterrier-houhou/bullterrier-houhou-1.png -o public/blog/bullterrier-houhou/bullterrier-houhou-1.webp --resize 1200 --format webp --quality 80
npx sharp -i public/blog/joker-gi/joker-gi-1.png -o public/blog/joker-gi/joker-gi-1.webp --resize 1200 --format webp --quality 80
npx sharp -i public/blog/iterm2-korean-fix/iterm2-settings-1.png -o public/blog/iterm2-korean-fix/iterm2-settings-1.webp --resize 1200 --format webp --quality 80
npx sharp -i public/blog/iterm2-korean-fix/iterm2-settings-2.png -o public/blog/iterm2-korean-fix/iterm2-settings-2.webp --resize 1200 --format webp --quality 80
```

**목표**: 각 이미지 < 200KB (총 4.5MB → < 500KB)

### 2.3 MDX 파일 변경 (4개)

**`content/blog/bullterrier-houhou-review.mdx`** (EDIT):
```diff
- ![불테리어 호우호우 도복 - 화려한 봉황 자수가 인상적인 패키지](/blog/bullterrier-houhou/bullterrier-houhou-1.png)
+ ![불테리어 호우호우 도복 - 화려한 봉황 자수가 인상적인 패키지](/blog/bullterrier-houhou/bullterrier-houhou-1.webp)
```

**`content/blog/joker-gi-review.mdx`** (EDIT):
```diff
- ![조커 도복 착용 모습 - 블랙 베이스에 보라색과 초록색 포인트](/blog/joker-gi/joker-gi-1.png)
+ ![조커 도복 착용 모습 - 블랙 베이스에 보라색과 초록색 포인트](/blog/joker-gi/joker-gi-1.webp)
```

**`content/blog/iterm2-korean-fix.mdx`** (EDIT):
```diff
- ![iTerm2 설정 - Profiles > Text에서 Normalization을 NFC로 변경](/blog/iterm2-korean-fix/iterm2-settings-1.png)
+ ![iTerm2 설정 - Profiles > Text에서 Normalization을 NFC로 변경](/blog/iterm2-korean-fix/iterm2-settings-1.webp)

- ![한글이 정상적으로 표시되는 터미널 화면](/blog/iterm2-korean-fix/iterm2-settings-2.png)
+ ![한글이 정상적으로 표시되는 터미널 화면](/blog/iterm2-korean-fix/iterm2-settings-2.webp)
```

### 2.4 MDX 이미지 컴포넌트 추가

**`apps/web/components/blog/mdx-components.tsx`** (EDIT):

기존 `mdxComponents` 객체에 `img` 컴포넌트 추가:

```tsx
img: (props: any) => (
  <img
    {...props}
    loading="lazy"
    decoding="async"
    className="rounded-lg"
    style={{ maxWidth: "100%", height: "auto" }}
  />
),
```

이 컴포넌트는:
- `loading="lazy"`: 뷰포트 밖 이미지 지연 로드
- `decoding="async"`: 메인 스레드 블로킹 방지
- `style={{ maxWidth: "100%", height: "auto" }}`: 반응형 + CLS 최소화

### 2.5 원본 PNG 삭제

WebP 변환 확인 후 원본 PNG 4개 삭제:
- `bullterrier-houhou-1.png`
- `joker-gi-1.png`
- `iterm2-settings-1.png`
- `iterm2-settings-2.png`

---

## 3. FR-03: 접근성 강화

### 3.1 Skip to content 링크

**`apps/web/app/layout.tsx`** (EDIT):

`<body>` 태그 바로 다음, `<WebSiteJsonLd />` 전에 추가:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-bg focus:outline-none"
>
  본문으로 건너뛰기
</a>
```

그리고 `<main>` 태그에 `id="main-content"` 추가:

```tsx
<main id="main-content" className="min-h-[calc(100vh-3.5rem)]">
  {children}
</main>
```

### 3.2 Focus visible 스타일

**`apps/web/app/globals.css`** (EDIT):

`/* GLOBAL STYLES */` 섹션 내 `::selection` 뒤에 추가:

```css
/* Focus visible for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove default outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 3.3 prefers-reduced-motion

**`apps/web/app/globals.css`** (EDIT):

`@keyframes blink` 뒤, `/* GLOBAL STYLES */` 전에 추가:

```css
/* ── Reduced motion preference ── */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

이 미디어 쿼리는:
- Glass 배경 `glass-float` 애니메이션 비활성화
- Brutalist `blink` 애니메이션 비활성화
- 모든 transition (테마 전환 포함) 즉시 적용
- 스크롤 동작 즉시 이동

### 3.4 MDX 이미지 alt 텍스트 확인

현재 MDX 이미지 4개 모두 alt 텍스트가 존재:
1. `bullterrier-houhou-review.mdx`: "불테리어 호우호우 도복 - 화려한 봉황 자수가 인상적인 패키지" ✅
2. `joker-gi-review.mdx`: "조커 도복 착용 모습 - 블랙 베이스에 보라색과 초록색 포인트" ✅
3. `iterm2-korean-fix.mdx` (1): "iTerm2 설정 - Profiles > Text에서 Normalization을 NFC로 변경" ✅
4. `iterm2-korean-fix.mdx` (2): "한글이 정상적으로 표시되는 터미널 화면" ✅

**별도 코드 변경 불필요.**

---

## 4. FR-04: 성능 최적화

### 4.1 Glass 배경 GPU 가속

**`apps/web/components/design/glass-background.tsx`** (EDIT):

각 blur div의 `style` 객체에 `willChange: "transform"` 추가:

```tsx
// 첫 번째 div (line 14-18)
style={{
  background: "var(--gradient-1, #4C1D95)",
  top: "10%",
  left: "15%",
  animation: "glass-float 20s ease-in-out infinite",
  willChange: "transform",
}}

// 두 번째 div (line 24-28)
style={{
  background: "var(--gradient-2, #065F46)",
  top: "50%",
  right: "10%",
  animation: "glass-float 20s ease-in-out infinite 6.6s",
  willChange: "transform",
}}

// 세 번째 div (line 34-38)
style={{
  background: "var(--gradient-3, #1E1B4B)",
  bottom: "10%",
  left: "40%",
  animation: "glass-float 20s ease-in-out infinite 13.3s",
  willChange: "transform",
}}
```

`willChange: "transform"`은 브라우저에게 해당 요소가 변형될 것임을 알려 별도 레이어로 합성(composite)하게 한다. `blur-[80px]`과 결합되어 GPU 합성으로 처리된다.

### 4.2 content-visibility 확장

**`apps/web/app/globals.css`** (EDIT):

기존 `.list-item-offscreen` 뒤에 추가:

```css
/* Footer offscreen optimization */
footer {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}
```

Footer는 뷰포트 아래에 있으므로 초기 렌더링에서 제외한다.

---

## 5. FR-05: 메타 최적화

### 5.1 viewport 및 theme-color

**`apps/web/app/layout.tsx`** (EDIT):

`metadata` export 뒤에 `viewport` export 추가:

```tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
```

Next.js 15에서는 `viewport`를 `metadata`와 분리하여 export한다. `Viewport` 타입을 import하고 별도 export로 작성한다.

### 5.2 Apple 모바일 메타

**`apps/web/app/layout.tsx`** (EDIT):

`metadata.other`에 추가:

```tsx
other: {
  "google-adsense-account": "ca-pub-7452986546914975",
  "apple-mobile-web-app-capable": "yes",
  "apple-mobile-web-app-status-bar-style": "black-translucent",
},
```

---

## 6. 구현 순서 및 변경 파일 요약

### 구현 순서

```
1. FR-01: 폰트 서브셋 (pyftsubset → layout.tsx 수정)
2. FR-02: 이미지 WebP 변환 (sharp → MDX 수정 → mdx-components.tsx)
3. FR-03: 접근성 (layout.tsx + globals.css)
4. FR-04: 성능 (glass-background.tsx + globals.css)
5. FR-05: 메타 (layout.tsx)
```

### 변경 파일 목록 (10개)

| # | 파일 | 변경 | FR |
|---|------|------|-----|
| 1 | `public/fonts/PretendardVariable.subset.woff2` | CREATE (서브셋) | FR-01 |
| 2 | `public/fonts/PretendardVariable.woff2` | DELETE (원본) | FR-01 |
| 3 | `app/layout.tsx` | EDIT (폰트 경로 + skip-to-content + main id + viewport + meta) | FR-01, 03, 05 |
| 4 | `public/blog/*/\*.webp` | CREATE (WebP 4개) | FR-02 |
| 5 | `public/blog/*/\*.png` | DELETE (PNG 4개) | FR-02 |
| 6 | `content/blog/bullterrier-houhou-review.mdx` | EDIT (.png → .webp) | FR-02 |
| 7 | `content/blog/joker-gi-review.mdx` | EDIT (.png → .webp) | FR-02 |
| 8 | `content/blog/iterm2-korean-fix.mdx` | EDIT (.png → .webp) | FR-02 |
| 9 | `components/blog/mdx-components.tsx` | EDIT (img 컴포넌트 추가) | FR-02 |
| 10 | `app/globals.css` | EDIT (focus-visible + reduced-motion + content-visibility) | FR-03, 04 |
| 11 | `components/design/glass-background.tsx` | EDIT (willChange 추가) | FR-04 |

---

## 7. 검증 항목 (12개)

| # | 항목 | 검증 방법 | FR |
|---|------|----------|-----|
| 1 | `pnpm build` 성공 (0 errors) | 빌드 실행 | ALL |
| 2 | `pnpm lint` 통과 (0 warnings) | 린트 실행 | ALL |
| 3 | 서브셋 폰트 파일 < 300KB | `ls -la` 확인 | FR-01 |
| 4 | 원본 폰트 2MB 삭제됨 | 파일 부존재 확인 | FR-01 |
| 5 | 블로그 이미지 4개 모두 .webp | `ls` 확인 | FR-02 |
| 6 | 각 WebP 이미지 < 200KB | `ls -la` 확인 | FR-02 |
| 7 | MDX img에 `loading="lazy"` | mdx-components.tsx 확인 | FR-02 |
| 8 | Skip to content 링크 존재 | HTML 소스에 "본문으로 건너뛰기" | FR-03 |
| 9 | `:focus-visible` 스타일 존재 | globals.css 확인 | FR-03 |
| 10 | `prefers-reduced-motion` 미디어 쿼리 존재 | globals.css 확인 | FR-03 |
| 11 | Glass blur에 `willChange: "transform"` | glass-background.tsx 확인 | FR-04 |
| 12 | `theme-color` meta + `Viewport` export 존재 | layout.tsx 확인 | FR-05 |

---

## 8. 범위 외 확인

- ~~PWA Service Worker~~ (Out of Scope)
- ~~SSR 전환~~ (Out of Scope, `output: 'export'` 유지)
- ~~CDN 이미지 서비스~~ (Out of Scope)
- ~~Lighthouse 90+ 측정~~ (Check 단계에서 수행)

---

## 9. 기술 결정 근거

### 9.1 pyftsubset 선택 이유

- `fonttools`는 폰트 서브셋팅 표준 도구
- 유니코드 범위 지정으로 정확한 글리프 제어
- woff2 압축 지원 (`brotli` 패키지 필요)
- 일회성 작업이므로 npm 의존성 추가 불필요

### 9.2 sharp 대신 수동 변환 고려

- `sharp-cli`는 dev dependency로 추가 가능하나, 이미지 4개뿐이므로 `cwebp` CLI나 온라인 도구도 가능
- 핵심은 WebP 변환 + 1200px 리사이즈 + quality 80
- 빌드 파이프라인에 통합하지 않음 (일회성)

### 9.3 prefers-reduced-motion 전역 적용

- 개별 애니메이션 `@media` 쿼리보다 전역 `*` 선택자가 유지보수에 유리
- 향후 추가되는 애니메이션도 자동으로 대응
- `!important`는 이 경우 접근성 필수 요건이므로 허용
