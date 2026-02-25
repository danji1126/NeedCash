# Plan: site-navigation (PDCA-4)

> **Feature**: site-navigation
> **상위 계획**: AdSense 승인 로드맵 > PDCA-4
> **작성일**: 2026-02-25
> **우선순위**: P0 (즉시)
> **의존성**: PDCA-3 (game-content) 완료

---

## 1. 목적

사이트 구조와 탐색성을 개선하여 구글봇이 사이트 계층 구조를 명확히 이해하고, 사용자가 쉽게 콘텐츠를 탐색할 수 있게 한다. Breadcrumb 내비게이션, BreadcrumbList JSON-LD 구조화 데이터, Footer 내부 링크 강화를 통해 AdSense "사이트 탐색성 부족" 거절 사유를 해소한다.

---

## 2. 현재 상태 분석

### 사이트 페이지 구조 (24페이지)

```
/ (홈)
├── /blog (블로그 목록)
│   ├── /blog/hello-world
│   ├── /blog/getting-started
│   ├── /blog/iterm2-korean-fix
│   ├── /blog/nextjs-mdx-blog-guide
│   ├── /blog/bullterrier-houhou-review
│   ├── /blog/speak-100-days-review
│   └── /blog/joker-gi-review
├── /game (게임 허브)
│   ├── /game/dice
│   ├── /game/lotto
│   ├── /game/animal-face
│   ├── /game/reaction
│   ├── /game/color-sense
│   └── /game/color-memory
├── /resume (이력서)
│   ├── /resume/en
│   ├── /resume/th
│   ├── /resume/vi
│   └── /resume/ja
├── /about
├── /privacy
└── /terms
```

### 내비게이션 현황

| 위치 | 링크 수 | 대상 |
|------|---------|------|
| Header (NAV_LINKS) | 3 | Blog, Game, Resume |
| Footer (FOOTER_LINKS) | 3 | About, Privacy, Terms |
| 게임 상세 → 관련 게임 | 3 | 다른 게임 3개 (PDCA-3에서 추가) |
| 게임 상세 → Back | 1 | /game |
| 블로그 상세 → Back | 1 | /blog |
| 홈 → 섹션 | 3 | Blog, Game, Resume |

### 핵심 문제

1. **Breadcrumb 없음**: 사이트 계층 구조를 시각적/구조적으로 표시하지 않음
2. **BreadcrumbList JSON-LD 없음**: 구글 검색 결과에 경로가 표시되지 않음
3. **Footer 내부 링크 부족**: About/Privacy/Terms만 있고 주요 섹션(Blog, Game, Resume) 링크 없음
4. **블로그 상세 → 관련 포스트 없음**: 블로그 글에서 다른 글로의 탐색 경로 부재
5. **섹션 간 교차 링크 없음**: Game → Blog, Blog → Game 등 섹션 간 이동 경로 부재

### 이미 갖춘 것

- Sitemap.xml ✅ (PDCA-2)
- Robots.txt ✅ (PDCA-2)
- WebSite JSON-LD ✅ (PDCA-2)
- Article JSON-LD ✅ (PDCA-2)
- Game JSON-LD ✅ (PDCA-2)
- 관련 게임 추천 ✅ (PDCA-3)

---

## 3. 요구사항

### FR-01: Breadcrumb 컴포넌트

- `components/ui/breadcrumb.tsx` 서버 컴포넌트 생성
- 페이지별 경로 표시:
  - 게임 상세: `홈 > 게임 > Dice Roller`
  - 블로그 상세: `홈 > 블로그 > 포스트 제목`
  - 게임 목록: `홈 > 게임`
  - 블로그 목록: `홈 > 블로그`
  - 이력서: `홈 > 이력서`
- `<nav aria-label="breadcrumb">` + `<ol>` 시맨틱 마크업
- 마지막 항목은 링크 없이 현재 페이지 텍스트
- **완료 기준**: HTML 소스에 breadcrumb 텍스트 + 링크 존재

### FR-02: BreadcrumbList JSON-LD

- `components/seo/json-ld.tsx`에 `BreadcrumbJsonLd` 컴포넌트 추가
- 게임 상세, 블로그 상세, 섹션 목록 페이지에 JSON-LD 삽입
- Schema.org BreadcrumbList 스펙 준수
- **완료 기준**: 빌드 후 HTML에 `@type: BreadcrumbList` JSON-LD 존재

### FR-03: Footer 내부 링크 강화

- 4개 Footer 디자인 모두에 주요 섹션 링크 추가
- 구조: 섹션 링크(Blog, Game, Resume) + 법적 링크(About, Privacy, Terms) 분리
- 게임 개별 링크 6개 추가 (사이트 전체 페이지에서 게임으로 접근 가능)
- **완료 기준**: Footer에 최소 12개 내부 링크 (섹션 3 + 게임 6 + 법적 3)

### FR-04: 블로그 상세 페이지 관련 포스트

- 블로그 글 하단에 "다른 글도 읽어보세요" 섹션 추가
- 현재 글 제외 최근 포스트 3개 표시
- 서버 컴포넌트로 렌더링 (HTML에 텍스트 포함)
- **완료 기준**: 각 블로그 상세 페이지에 관련 포스트 3개 링크

### FR-05: 페이지별 Breadcrumb + JSON-LD 통합

- 게임 상세 페이지(`app/game/[slug]/page.tsx`)에 Breadcrumb + JSON-LD 추가
- 블로그 상세 페이지(`app/blog/[slug]/page.tsx`)에 Breadcrumb + JSON-LD 추가
- 게임 목록(`app/game/page.tsx`), 블로그 목록(`app/blog/page.tsx`)에 Breadcrumb 추가
- **완료 기준**: 해당 페이지 HTML에 breadcrumb + JSON-LD 존재

---

## 4. 변경 대상 파일 (예상)

| 파일 | 변경 유형 | FR |
|------|----------|-----|
| `components/ui/breadcrumb.tsx` | CREATE | FR-01 |
| `components/seo/json-ld.tsx` | EDIT | FR-02 |
| `components/layout/footer/editorial-footer.tsx` | EDIT | FR-03 |
| `components/layout/footer/bento-footer.tsx` | EDIT | FR-03 |
| `components/layout/footer/brutalist-footer.tsx` | EDIT | FR-03 |
| `components/layout/footer/glass-footer.tsx` | EDIT | FR-03 |
| `lib/constants.ts` | EDIT | FR-03 |
| `components/blog/related-posts.tsx` | CREATE | FR-04 |
| `app/game/[slug]/page.tsx` | EDIT | FR-05 |
| `app/blog/[slug]/page.tsx` | EDIT | FR-05 |
| `app/game/page.tsx` | EDIT | FR-05 |
| `app/blog/page.tsx` | EDIT | FR-05 |

---

## 5. 내부 링크 목표 (Before → After)

| 위치 | Before | After |
|------|--------|-------|
| Header | 3 (Blog, Game, Resume) | 3 (변경 없음) |
| Footer | 3 (About, Privacy, Terms) | 12+ (섹션 3 + 게임 6 + 법적 3) |
| 게임 상세 | 4 (Back + 관련 3) | 6 (Breadcrumb 2 + Back + 관련 3) |
| 블로그 상세 | 1 (Back) | 5 (Breadcrumb 2 + 관련 포스트 3) |
| 게임 목록 | 6 (게임 카드) | 8 (Breadcrumb 1 + 게임 6 + 자체) |
| 블로그 목록 | 7 (포스트 카드) | 8 (Breadcrumb 1 + 포스트 7) |

---

## 6. 구현 순서

```
FR-01 (Breadcrumb) → FR-02 (JSON-LD) → FR-03 (Footer) → FR-04 (관련 포스트) → FR-05 (통합)
```

1. **FR-01**: Breadcrumb 서버 컴포넌트 생성
2. **FR-02**: BreadcrumbList JSON-LD 컴포넌트 추가
3. **FR-03**: 4개 Footer 디자인에 내부 링크 강화
4. **FR-04**: 블로그 관련 포스트 컴포넌트 생성
5. **FR-05**: 각 페이지에 Breadcrumb + JSON-LD 통합

---

## 7. 검증 방법

| 항목 | 방법 | 기준 |
|------|------|------|
| 빌드 성공 | `pnpm build` | 0 errors |
| 린트 통과 | `pnpm lint` | 0 warnings |
| Breadcrumb HTML | 빌드 후 HTML 소스 확인 | `<nav aria-label` + `<ol>` 존재 |
| BreadcrumbList JSON-LD | HTML 소스에서 `BreadcrumbList` 검색 | 게임 6 + 블로그 7 페이지 |
| Footer 링크 | HTML 소스에서 링크 수 확인 | 12개+ 내부 링크 |
| 관련 포스트 | 블로그 상세 HTML 확인 | 3개 포스트 링크 |
| 접근성 | `aria-label="breadcrumb"` 확인 | 모든 breadcrumb에 존재 |

---

## 8. 다음 단계

Plan 승인 후 → `/pdca design site-navigation`으로 Design 문서 작성
