# 프론트엔드팀 분석 보고서

> 분석일: 2026-03-10

## 1. 아키텍처 개요

### 기술 스택
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **Styling**: Tailwind CSS 4 + CSS Variables
- **Animation**: framer-motion 12.29.2
- **Theme**: CSS Custom Properties (data-design + data-theme)
- **Font**: Pretendard (로컬), Plus Jakarta Sans, JetBrains Mono (Google Fonts)

### 디렉토리 구조 분석

```
app/                    # 라우트 (페이지 13개, API 11개)
components/             # 컴포넌트 80개
  ├── admin/     (11)   # Admin CMS 컴포넌트
  ├── analytics/ (1)    # 통계 트래커
  ├── blog/      (6)    # 블로그 (TOC, 목록, 관련글)
  ├── design/    (3)    # 디자인 시스템 Provider/Picker
  ├── game/      (16)   # 게임 + 리더보드/히스토리/결과
  ├── home/      (6)    # 홈페이지 (디자인별 4개 + 통합 + 데일리)
  ├── layout/    (17)   # Header/Footer/Hero/Grid/Posts (디자인별)
  ├── resume/    (4)    # 이력서
  ├── seo/       (1)    # JSON-LD
  ├── tools/     (4)    # 유틸 도구
  └── ui/        (7)    # 공통 UI
lib/                    # 유틸리티 24개 파일
  ├── design/    (6)    # 디자인 정의 + hook
  └── i18n/      (2)    # 다국어
```

## 2. 멀티 디자인 시스템

### 구조
4가지 디자인 × 다수 서브테마로 구성:

| 디자인 | 서브테마 | 특성 |
|--------|----------|------|
| Editorial | editorial-dark, editorial-light | 타이포그래피 중심, 직각 |
| Bento | bento-dark, bento-light | 둥근 그리드, 부드러운 그림자 |
| Brutalist | brutal-terminal, brutal-paper, brutal-neon | 모노스페이스, 직각, 강한 보더 |
| Glass | glass-aurora, glass-frost, glass-rose, glass-ocean | 반투명, 블러, 그라데이션 |

### 구현 방식
- `data-design` 속성: 구조 토큰 (radius, shadow, border-width, font-weight)
- `data-theme` 속성: 색상 토큰 (bg, text, accent, border 등)
- `localStorage`에 저장 → 인라인 스크립트로 FOUC 방지
- 각 레이아웃 컴포넌트가 `{design}-{component}.tsx` 패턴으로 분리

### 평가
- **강점**: CSS Variables 기반으로 런타임 전환이 매끄러움
- **약점**: 디자인별 컴포넌트 분리로 코드 중복 발생 (Header 4개, Footer 4개, Hero 4개 등)
- **개선안**: 공통 레이아웃 로직을 추출하고 디자인별 스타일만 분리하는 방식 검토

## 3. 컴포넌트 분석

### 클라이언트 vs 서버 컴포넌트

| 유형 | 수 | 비율 |
|------|------|------|
| "use client" | 53개 | 38% |
| 서버 컴포넌트 | ~86개 | 62% |

클라이언트 컴포넌트가 38%로, 게임/인터랙티브 기능이 많은 점을 고려하면 적절한 수준이나, 일부 최적화 여지가 있음:

- `components/layout/header.tsx`: useDesign() 호출 때문에 "use client" → 디자인 분기를 서버에서 처리 가능한지 검토
- `components/layout/footer.tsx`: 동일한 패턴

### 게임 컴포넌트
9개 게임이 모두 단일 파일 패턴 (`{name}-game.tsx`)으로 일관성 유지. `GameResultPanel`이 결과 화면을 통합 관리하여 코드 재사용성이 높음.

### 공통 UI
- `Button`, `Card`, `Tag`: 기본 UI 프리미티브
- `ScrollReveal`: framer-motion 기반 등장 애니메이션
- `Breadcrumb`: SEO 친화적 탐색 경로
- `CookieConsent`: 쿠키 동의 배너

## 4. 의존성 분석

### 번들 영향 (의존성 크기 순)

| 패키지 | 예상 크기 | 용도 | 비고 |
|--------|-----------|------|------|
| shiki | ~2-5MB | 코드 하이라이트 (레거시 글) | 번들 크기 주의 |
| framer-motion | ~150KB | 애니메이션 | 트리쉐이킹 지원 |
| @teachablemachine/image | ~100KB | 동물상 AI | 특정 게임에서만 사용 |
| marked | ~40KB | Markdown 파싱 (Admin 미리보기) | 클라이언트 사이드 |
| rehype-highlight | ~30KB | 코드 하이라이트 (신규 글) | 서버 사이드 |

### 미사용/중복 의존성 (에이전트 정밀 분석 결과)

| 패키지 | 상태 | 근거 |
|--------|------|------|
| `next-themes` | **미사용 확실** | import 0건. `DesignProvider`가 자체 구현으로 대체 |
| `next-mdx-remote` | **미사용 추정** | D1 기반으로 전환 완료. MDX 클라이언트 컴파일 불필요 |
| `shiki` + `rehype-pretty-code` | **레거시 전용** | 기존 글 HTML이 DB에 저장되어 있으므로 런타임 불필요 가능 |
| `gray-matter` | **미사용 추정** | MDX frontmatter 파싱용. D1 전환 후 불필요 |
| `marked` | **Admin 전용** | unified 파이프라인과 기능 중복. Admin 미리보기에서만 사용 |

## 5. 폰트 전략

| 폰트 | 로딩 방식 | 용도 |
|-------|-----------|------|
| Pretendard Variable | 로컬 (woff2 subset) | 본문 |
| Plus Jakarta Sans | Google Fonts | Glass 디자인 헤딩 |
| JetBrains Mono | Google Fonts | Brutalist 디자인, 코드 블록 |

- `display: "swap"` 적용으로 FOUT 최소화
- Pretendard subset woff2로 로딩 성능 최적화
- highlight.js CSS가 CDN 외부 링크로 로드 → 셀프 호스팅 고려

## 6. 개선 권고

### P0 (즉시)
1. **디자인 변형 컴포넌트 lazy loading**: Header/Footer/Hero/Grid 4종이 모두 정적 import → `next/dynamic` 적용하여 선택되지 않은 디자인 코드 번들 제거
2. **`next.config.ts` 보안 헤더 추가**: 현재 완전 비어있음 → CSP, X-Frame-Options, HSTS 등 설정
3. **미사용 의존성 제거**: `next-themes`, `next-mdx-remote`, `gray-matter` 즉시 제거 가능

### P1 (중요)
4. **highlight.js CSS 셀프 호스팅**: CDN 의존성 제거, 번들에 포함하여 로딩 안정성 확보
5. **디자인별 컴포넌트 중복 축소**: 공통 구조를 추출하고 스타일 변형만 props/CSS로 분리
6. **shiki/rehype-pretty-code 제거 검토**: 레거시 글 HTML이 이미 DB에 저장되어 있으므로 런타임 불필요 가능
7. **`GlassBackground` 조건부 로딩**: 현재 모든 디자인에서 마운트 → glass 디자인에서만 로드
8. **게임 컴포넌트 분리**: 400-700줄 단일 파일 → `useGameTimer`, `useScoreTracking` 등 커스텀 훅 추출

### P2 (권장)
9. **`@tailwindcss/typography` 도입 검토**: `.prose-custom` 20+ 규칙이 수동 작성 → 공식 플러그인으로 대체
10. **Header/Footer 서버 컴포넌트 전환**: 디자인 정보를 쿠키/서버에서 읽어 SSR 처리
11. **about 페이지 기술 스택 정보 업데이트**: "Next.js 15" → 16, "Static Export" → Workers, "MDX" → D1
12. **`next.config.ts`에 `optimizePackageImports` 추가**: framer-motion 번들 사이즈 최적화

### P3 (선택)
13. **Glass 전용 gradient 토큰**: `--gradient-1/2/3`이 glass에만 정의 → 다른 디자인에서 사용 시 undefined
14. **tools/ 컴포넌트**: CLAUDE.md에 미문서화 → 문서 업데이트
15. **`game-content.ts` (437줄)**: 순수 데이터 → JSON으로 분리 검토
