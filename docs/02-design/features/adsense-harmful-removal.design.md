# Design: adsense-harmful-removal (PDCA-1)

> **피처명**: adsense-harmful-removal
> **Plan 문서**: `docs/01-plan/features/adsense-harmful-removal.plan.md`
> **작성일**: 2026-02-24
> **설계 유형**: 삭제/수정 작업 (신규 컴포넌트 없음)

---

## 1. 설계 개요

애드센스 심사에 치명적인 부정적 신호(빈 Ads 페이지, 승인 전 광고 배너, 네비게이션 Ads 링크)를 제거한다. 삭제 중심 작업이므로 복잡한 아키텍처 설계는 불필요하며, 정확한 코드 변경 명세에 집중한다.

## 2. 변경 명세

### FR-01: Ads 페이지 라우트 삭제

**대상 파일**: `apps/web/app/ads/page.tsx` (92줄)
**작업**: 파일 전체 삭제

```
rm apps/web/app/ads/page.tsx
```

- `apps/web/app/ads/` 디렉토리에 다른 파일이 없으면 디렉토리도 함께 삭제
- 삭제 후 `/ads` 경로 접근 시 Next.js 기본 404 페이지 반환 확인

---

### FR-02: 네비게이션에서 Ads 링크 제거

**대상 파일**: `apps/web/lib/constants.ts`

#### 변경 1: NAV_LINKS에서 /ads 항목 제거

**Before** (Line 7-12):
```ts
export const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/game", label: "Game" },
  { href: "/ads", label: "Ads" },
  { href: "/resume", label: "Resume" },
] as const;
```

**After**:
```ts
export const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/game", label: "Game" },
  { href: "/resume", label: "Resume" },
] as const;
```

#### 변경 2: SITE.description에서 "광고" 문구 제거

**대상 파일**: `apps/web/lib/constants.ts`

**Before** (Line 3):
```ts
description: "프로토타입 허브 - 게임, 블로그, 광고, 이력서를 하나의 공간에서.",
```

**After**:
```ts
description: "프로토타입 허브 - 게임, 블로그, 이력서를 하나의 공간에서.",
```

---

**대상 파일**: `apps/web/app/page.tsx`

#### 변경 3: SECTIONS에서 /ads 항목 제거

**Before** (Line 4-9):
```ts
const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/ads", label: "Ads", desc: "Landing page experiments" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
];
```

**After**:
```ts
const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
];
```

---

### FR-03: 게임 페이지에서 AdBanner 제거

**대상 파일**: `apps/web/app/game/[slug]/page.tsx` (96줄)

#### 변경 1: import 문 제거

**Before** (Line 6):
```ts
import { AdBanner } from "@/components/ads/ad-banner";
```

**After**: 해당 줄 삭제

#### 변경 2: 게임 컴포넌트 위 AdBanner 제거

**Before** (Line 86):
```tsx
      <AdBanner className="mt-10" />

      <div className="mt-12">
```

**After**:
```tsx
      <div className="mt-12">
```

#### 변경 3: 게임 컴포넌트 아래 AdBanner 제거

**Before** (Line 92):
```tsx
      <AdBanner className="mt-12" />
```

**After**: 해당 줄 삭제

---

### FR-04: 블로그 페이지에서 AdBanner 제거

**대상 파일**: `apps/web/app/blog/[slug]/page.tsx` (97줄)

#### 변경 1: import 문 제거

**Before** (Line 10):
```ts
import { AdBanner } from "@/components/ads/ad-banner";
```

**After**: 해당 줄 삭제

#### 변경 2: Mobile TOC 아래 AdBanner 제거

**Before** (Line 72):
```tsx
      <AdBanner className="my-8" />
```

**After**: 해당 줄 삭제

#### 변경 3: 본문 아래 AdBanner 제거

**Before** (Line 93):
```tsx
      <AdBanner className="mt-12" />
```

**After**: 해당 줄 삭제

---

### FR-05: AdBanner 컴포넌트 파일 삭제

**대상 파일**: `apps/web/components/ads/ad-banner.tsx` (39줄)
**작업**: 파일 삭제

```
rm apps/web/components/ads/ad-banner.tsx
```

- `apps/web/components/ads/` 디렉토리에 다른 파일이 없으면 디렉토리도 함께 삭제

---

### FR-06: 사이트 설명 업데이트

FR-02 변경 2에 포함 (SITE.description 수정). 별도 작업 불필요.

---

## 3. 유지 항목 (삭제하지 않음)

**대상 파일**: `apps/web/app/layout.tsx`

다음 항목은 애드센스 사이트 인증에 필요하므로 **반드시 유지**:

1. **adsbygoogle 스크립트** (Line 70-75):
```tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7452986546914975"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

2. **google-adsense-account 메타태그** (Line 43):
```tsx
"google-adsense-account": "ca-pub-7452986546914975",
```

---

## 4. 구현 순서

| 순서 | 작업 | FR | 이유 |
|------|------|-----|------|
| 1 | 게임 페이지 AdBanner 제거 | FR-03 | import 참조 먼저 제거 |
| 2 | 블로그 페이지 AdBanner 제거 | FR-04 | import 참조 먼저 제거 |
| 3 | AdBanner 컴포넌트 삭제 | FR-05 | 참조 제거 후 안전하게 삭제 |
| 4 | constants.ts 수정 | FR-02, FR-06 | NAV_LINKS + description |
| 5 | page.tsx SECTIONS 수정 | FR-02 | 홈페이지 섹션 정리 |
| 6 | Ads 페이지 삭제 | FR-01 | 라우트 최종 제거 |
| 7 | 빌드 검증 | - | `pnpm build` + `pnpm lint` |

---

## 5. 검증 체크리스트

- [ ] `pnpm build` 성공 (빌드 에러 없음)
- [ ] `pnpm lint` 통과
- [ ] `/ads` 경로 접근 시 404 반환
- [ ] 네비게이션 바에 "Ads" 링크 없음
- [ ] 홈페이지 SECTIONS에 "Ads" 항목 없음
- [ ] 게임 상세 페이지에 광고 배너 없음
- [ ] 블로그 상세 페이지에 광고 배너 없음
- [ ] `components/ads/` 디렉토리 존재하지 않음
- [ ] `app/ads/` 디렉토리 존재하지 않음
- [ ] layout.tsx의 adsbygoogle 스크립트 유지 확인
- [ ] layout.tsx의 google-adsense-account 메타태그 유지 확인

---

## 6. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| AdBanner import 누락 삭제 | 빌드 실패 | grep으로 전체 프로젝트 검색 확인 |
| layout.tsx 실수 수정 | 사이트 인증 실패 | layout.tsx 변경 금지 명시 |
| 다른 컴포넌트에서 AdBanner 참조 | 빌드 실패 | 구현 전 grep 확인 필수 |
