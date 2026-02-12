# Plan: multi-design

> 4개 디자인 모드 x 4개 컬러 테마 = 16가지 조합의 2계층 디자인 시스템 구현 + 사용자 선택 UI

## 1. Overview

### Purpose
사용자가 사이트의 **디자인 모드**(레이아웃, 타이포그래피, 컴포넌트 형태)와 **컬러 테마**를 자유롭게 선택할 수 있는 2계층 디자인 시스템을 구현한다. 단순 컬러 변경이 아닌, "진짜 다른 사이트처럼 보이는" 경험을 제공하는 것이 핵심.

### Background
- 프로젝트: NeedCash (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)
- 현재 상태: 단일 Editorial 디자인 + 다크/라이트 2개 테마만 존재
- 브레인스토밍 문서: `docs/brainstorm/multi-design.md` (v2)
- HTML 샘플: `docs/brainstorm/multi-design-samples/` (4개 디자인 인터랙티브 프로토타입)
- 핵심 변경: `data-design` (구조) + `data-theme` (색상) 2개 attribute로 분리

### 디자인 모드 개요

| ID | 이름 | 무드 | 특징 |
|----|------|------|------|
| `editorial` | 에디토리얼 | 정갈한 매거진 | border-bottom 카드, 넓은 여백, uppercase 라벨 |
| `bento` | 벤토 | Apple 모듈 | rounded-2xl 카드, CSS Grid 다양한 span, shadow |
| `brutalist` | 브루탈리스트 | 날것의 해커 | 모노스페이스, 2px 보더, 즉시 반전 hover, 번호 매김 |
| `glass` | 글래스 | 미래 몽환 | backdrop-blur, 반투명 카드, 그라디언트 메시 배경 |

## 2. Scope

### In Scope
- 2계층 디자인 시스템 인프라 (`data-design` + `data-theme`)
- DesignProvider Context + useDesign() hook
- 디자인별 CSS 변수 (구조 토큰 + 컬러 토큰) 전체 정의
- 4개 디자인 모드의 디자인별 컴포넌트 (Header, Hero, SectionGrid, Footer)
- 16개 컬러 테마 CSS 변수
- DesignPicker UI 컴포넌트 (2단계 선택: 디자인 → 테마)
- 기존 Editorial 디자인 코드 리팩토링 (호환성 유지)
- localStorage 기반 사용자 선호 저장/복원
- 모바일 반응형 지원

### Out of Scope
- URL 쿼리 파라미터 기반 디자인 공유 (`?design=bento&theme=...`)
- 게임 페이지 내부 디자인 전환 (게임 자체 UI는 유지)
- 블로그 prose 스타일 디자인별 분기
- View Transitions API 기반 페이지 전환 애니메이션
- SSR 기반 디자인 적용 (클라이언트 사이드 전환만)

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | DesignConfig / ThemeConfig 타입 정의 | CRITICAL | 디자인 모드와 테마의 TypeScript 인터페이스 정의 |
| FR-02 | 디자인 레지스트리 구축 | CRITICAL | 4개 디자인 정의 파일 + 테마 매핑 + 레지스트리 export |
| FR-03 | DesignProvider Context 구현 | CRITICAL | design/theme 상태 관리, html attribute 동기화, Context API |
| FR-04 | useDesign() hook 구현 | CRITICAL | 현재 디자인/테마 읽기 + setter 제공 |
| FR-05 | globals.css에 디자인 변수 정의 | CRITICAL | `[data-design]` 별 구조 토큰 (radius, border, shadow, font-weight 등) |
| FR-06 | globals.css에 16개 테마 변수 정의 | CRITICAL | `[data-theme]` 별 컬러 토큰 (bg, text, accent 등 12개) |
| FR-07 | Editorial 디자인 Header 컴포넌트 | HIGH | 기존 Header를 EditorialHeader로 리팩토링 |
| FR-08 | Editorial 디자인 Hero 컴포넌트 | HIGH | 기존 page.tsx Hero 섹션을 EditorialHero로 분리 |
| FR-09 | Bento 디자인 컴포넌트 (Header, Hero, Grid, Footer) | HIGH | bento.html 샘플 기반 React 구현 |
| FR-10 | Brutalist 디자인 컴포넌트 (Header, Hero, Grid, Footer) | HIGH | brutalist.html 샘플 기반 React 구현 |
| FR-11 | Glass 디자인 컴포넌트 (Header, Hero, Grid, Footer) | HIGH | glass.html 샘플 기반 React 구현, 배경 blob 애니메이션 포함 |
| FR-12 | 어댑터 컴포넌트 (Header, Hero, SectionGrid, Footer) | HIGH | useDesign()으로 분기하는 래퍼 컴포넌트 |
| FR-13 | DesignPicker UI 컴포넌트 | HIGH | 2단계 선택 UI (디자인 미니 프리뷰 + 테마 컬러 dot) |
| FR-14 | DesignPicker 헤더 통합 | HIGH | 헤더의 팔레트 아이콘 클릭 → DesignPicker popover 표시 |
| FR-15 | localStorage 저장/복원 | MEDIUM | `needcash-design`, `needcash-theme` 키로 사용자 선호 저장 |
| FR-16 | layout.tsx 통합 | HIGH | DesignProvider 래핑 + data-design/data-theme attribute 적용 |
| FR-17 | 기존 ThemeSwitcher 대체 | MEDIUM | DesignPicker가 ThemeSwitcher 기능을 흡수 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 페이지(game, blog 등) 정상 동작 유지 |
| NFR-02 | 빌드 성공 (`pnpm build`) |
| NFR-03 | 린트 통과 (`pnpm lint`) |
| NFR-04 | 디자인 전환 시 FOUC(Flash of Unstyled Content) 없음 |
| NFR-05 | 모바일(320px~) ~ 데스크톱(1920px) 반응형 지원 |
| NFR-06 | 모든 테마에서 WCAG AA 대비(4.5:1) 충족 |
| NFR-07 | 디자인/테마 전환 시 부드러운 CSS transition (color, background-color) |
| NFR-08 | 외부 라이브러리 추가 최소화 (기존 스택 내에서 해결) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL FR 해결 | 6/6 (FR-01 ~ FR-06) |
| HIGH FR 해결 | 9/9 (FR-07 ~ FR-14, FR-16) |
| MEDIUM FR 해결 | 2/2 (FR-15, FR-17) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |
| 디자인 모드 전환 동작 | 4개 모드 모두 정상 렌더링 |
| 테마 전환 동작 | 16개 테마 모두 정상 적용 |
| DesignPicker UI | 2단계 선택 정상 동작 |
| localStorage 복원 | 새로고침 후 마지막 선택 유지 |

## 5. Technical Design

### 2계층 아키텍처

```html
<html data-design="editorial" data-theme="editorial-dark">
```

- `data-design` → 레이아웃, 타이포그래피, 컴포넌트 형태, 애니메이션 제어
- `data-theme` → 컬러 팔레트(bg, text, accent 등 12개 변수) 제어

### CSS 변수 구조

```css
/* Design Layer (구조 토큰) */
[data-design="bento"] {
  --radius-card: 16px;
  --radius-button: 12px;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08);
  --card-hover-scale: 1.02;
  --border-width: 1px;
  --transition-duration: 0.3s;
  --font-heading-weight: 500;
  --letter-spacing-heading: -0.02em;
}

/* Theme Layer (컬러 토큰) */
[data-theme="bento-clean"] {
  --bg: #F0F2F5;
  --text: #1A1A2E;
  --accent: #0066CC;
  /* ... 12개 컬러 변수 */
}
```

### 컴포넌트 분기 전략

| 분기 방식 | 적용 대상 | 이유 |
|----------|----------|------|
| CSS-only | Card, Button, Label, Divider | 스타일만 다르고 HTML 구조 동일 |
| React 분기 | Header, Hero, SectionGrid, Footer | HTML 구조 자체가 디자인별로 다름 |

어댑터 패턴:
```tsx
// components/layout/header.tsx
export function Header() {
  const { design } = useDesign();
  switch (design) {
    case 'editorial': return <EditorialHeader />;
    case 'bento':     return <BentoHeader />;
    case 'brutalist': return <BrutalistHeader />;
    case 'glass':     return <GlassHeader />;
  }
}
```

### DesignPicker UI

```
┌────────────────────────────────────┐
│  Customize                         │
│                                    │
│  Design                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │ Ed │ │ Be │ │ Br │ │ Gl │     │
│  │ ── │ │ ▢▢ │ │ ██ │ │ ░░ │     │
│  │●   │ │    │ │    │ │    │     │
│  └────┘ └────┘ └────┘ └────┘     │
│  Editorial                         │
│                                    │
│  Theme                             │
│  ● ○ ○ ○                          │
│  Light Dark Cream Ink              │
└────────────────────────────────────┘
```

- 상단: 4개 디자인 미니 와이어프레임 프리뷰 카드
- 하단: 선택된 디자인의 테마 컬러 dot
- 헤더의 팔레트 아이콘(기존 ThemeSwitcher 위치)으로 진입
- Popover 형태, 모바일에서는 하단 시트

### 파일 구조

```
lib/
  design/
    index.ts              # DesignConfig, ThemeConfig 타입 + 레지스트리
    use-design.ts          # useDesign() hook
    designs/
      editorial.ts         # Editorial 디자인 정의 + 4개 테마
      bento.ts             # Bento 디자인 정의 + 4개 테마
      brutalist.ts         # Brutalist 디자인 정의 + 4개 테마
      glass.ts             # Glass 디자인 정의 + 4개 테마

components/
  design/
    design-provider.tsx    # Context: design + theme 상태 관리
    design-picker.tsx      # 2단계 선택 UI (popover)
  layout/
    header.tsx             # 어댑터 (디자인별 분기)
    header/
      editorial-header.tsx
      bento-header.tsx
      brutalist-header.tsx
      glass-header.tsx
    hero.tsx               # 어댑터
    hero/
      editorial-hero.tsx
      bento-hero.tsx
      brutalist-hero.tsx
      glass-hero.tsx
    section-grid.tsx       # 어댑터
    section-grid/
      editorial-grid.tsx
      bento-grid.tsx
      brutalist-grid.tsx
      glass-grid.tsx
    footer.tsx             # 어댑터
    footer/
      editorial-footer.tsx
      bento-footer.tsx
      brutalist-footer.tsx
      glass-footer.tsx
  ui/
    card.tsx               # CSS 변수 기반 (CSS-only 분기)
    button.tsx             # CSS 변수 기반

app/
  globals.css              # 디자인 변수 + 16개 테마 변수
  layout.tsx               # DesignProvider 통합
  page.tsx                 # 어댑터 컴포넌트 사용
```

### 상태 관리

```typescript
// localStorage 구조
{
  "needcash-design": "bento",
  "needcash-theme": "bento-night"
}

// Context 값
interface DesignContextValue {
  design: DesignId;           // "editorial" | "bento" | "brutalist" | "glass"
  theme: string;              // "editorial-dark" | "bento-clean" 등
  setDesign: (id: DesignId) => void;
  setTheme: (id: string) => void;
  availableThemes: ThemeConfig[];  // 현재 디자인의 테마 목록
  designConfig: DesignConfig;      // 현재 디자인 설정
}
```

### 디자인 전환 시 테마 자동 매핑

디자인을 변경하면 해당 디자인의 defaultTheme으로 자동 전환:
```
editorial 선택 → editorial-light (기본)
bento 선택 → bento-clean (기본)
brutalist 선택 → brutal-terminal (기본)
glass 선택 → glass-aurora (기본)
```

## 6. Implementation Order

### Phase 1: 인프라 구축 (FR-01 ~ FR-06)
1. **FR-01**: `lib/design/index.ts` — DesignConfig, ThemeConfig 타입 정의
2. **FR-02**: `lib/design/designs/*.ts` — 4개 디자인 정의 파일 + 레지스트리
3. **FR-03**: `components/design/design-provider.tsx` — DesignProvider Context
4. **FR-04**: `lib/design/use-design.ts` — useDesign() hook
5. **FR-05**: `globals.css` — `[data-design]` 구조 토큰 추가
6. **FR-06**: `globals.css` — `[data-theme]` 16개 컬러 토큰 추가
7. **FR-16**: `app/layout.tsx` — DesignProvider 래핑

### Phase 2: Editorial 리팩토링 (FR-07, FR-08)
8. **FR-07**: 기존 Header → EditorialHeader로 분리
9. **FR-08**: 기존 page.tsx Hero → EditorialHero로 분리
10. EditorialGrid, EditorialFooter 분리
11. 어댑터 컴포넌트 (Header, Hero, SectionGrid, Footer) 생성 (FR-12 일부)

### Phase 3: 추가 디자인 구현 (FR-09 ~ FR-11)
12. **FR-09**: Bento — BentoHeader, BentoHero, BentoGrid, BentoFooter
13. **FR-10**: Brutalist — BrutalistHeader, BrutalistHero, BrutalistGrid, BrutalistFooter
14. **FR-11**: Glass — GlassHeader, GlassHero, GlassGrid, GlassFooter + 배경 blob

### Phase 4: 선택 UI + 마무리 (FR-13 ~ FR-17)
15. **FR-13**: DesignPicker 컴포넌트 (2단계 선택 UI)
16. **FR-14**: 헤더에 DesignPicker 진입점 통합
17. **FR-15**: localStorage 저장/복원
18. **FR-17**: 기존 ThemeSwitcher 대체/제거

### Phase 5: 검증
19. `pnpm lint` 실행
20. `pnpm build` 실행
21. 4개 디자인 × 4개 테마 = 16가지 조합 수동 확인

## 7. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `lib/design/index.ts` | 타입 정의 + 디자인 레지스트리 (신규) | 1 |
| `lib/design/use-design.ts` | useDesign() hook (신규) | 1 |
| `lib/design/designs/editorial.ts` | Editorial 디자인 정의 (신규) | 1 |
| `lib/design/designs/bento.ts` | Bento 디자인 정의 (신규) | 1 |
| `lib/design/designs/brutalist.ts` | Brutalist 디자인 정의 (신규) | 1 |
| `lib/design/designs/glass.ts` | Glass 디자인 정의 (신규) | 1 |
| `components/design/design-provider.tsx` | DesignProvider Context (신규) | 1 |
| `components/design/design-picker.tsx` | 2단계 선택 UI (신규) | 4 |
| `app/globals.css` | 디자인 변수 + 16개 테마 변수 추가 | 1 |
| `app/layout.tsx` | DesignProvider 래핑 추가 | 1 |
| `components/layout/header.tsx` | 어댑터 패턴으로 리팩토링 | 2 |
| `components/layout/header/editorial-header.tsx` | 기존 헤더 분리 (신규) | 2 |
| `components/layout/header/bento-header.tsx` | Bento 헤더 (신규) | 3 |
| `components/layout/header/brutalist-header.tsx` | Brutalist 헤더 (신규) | 3 |
| `components/layout/header/glass-header.tsx` | Glass 헤더 (신규) | 3 |
| `components/layout/hero.tsx` | 어댑터 (신규) | 2 |
| `components/layout/hero/*.tsx` | 디자인별 Hero (신규 4개) | 2-3 |
| `components/layout/section-grid.tsx` | 어댑터 (신규) | 2 |
| `components/layout/section-grid/*.tsx` | 디자인별 Grid (신규 4개) | 2-3 |
| `components/layout/footer.tsx` | 어댑터 패턴으로 리팩토링 | 2 |
| `components/layout/footer/*.tsx` | 디자인별 Footer (신규 4개) | 2-3 |
| `app/page.tsx` | 어댑터 컴포넌트 사용으로 리팩토링 | 2 |
| `components/theme/theme-switcher.tsx` | 제거 (DesignPicker로 대체) | 4 |
| `components/ui/card.tsx` | CSS 변수 기반으로 수정 | 2 |

## 8. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 디자인 전환 시 FOUC | HIGH | MEDIUM | localStorage → 초기 렌더 전 data attribute 설정 (script 주입) |
| CSS 변수 충돌 | MEDIUM | LOW | 네이밍 컨벤션 통일 (`--design-*`, `--theme-*` 접두사) |
| 컴포넌트 수 폭증 (4디자인 × 4컴포넌트) | MEDIUM | HIGH | 공통 로직은 훅/유틸로 추출, 렌더링만 분리 |
| 16개 테마 대비율(contrast) 미충족 | HIGH | MEDIUM | HTML 샘플 기반 검증된 값 사용, 구현 후 WCAG 대비 체크 |
| 기존 page 회귀 (game, blog 등) | HIGH | LOW | Editorial을 기본값으로, 기존 코드 동작 유지 |
| static export 호환성 | HIGH | LOW | 모든 디자인 전환을 클라이언트에서 처리, SSG에 영향 없음 |
| 번들 사이즈 증가 | MEDIUM | MEDIUM | dynamic import로 디자인별 컴포넌트 분리 검토 |

## 9. Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| (없음) | - | 외부 의존성 추가 없음 |

기존 사용 라이브러리:
- `react` (useState, useEffect, useContext, createContext)
- `next-themes` (기존 테마 인프라 참고, DesignProvider로 확장)
- `framer-motion` (디자인 전환 애니메이션, Glass blob 애니메이션)
- `tailwindcss` (유틸리티 클래스, CSS 변수 매핑)

## 10. 참고 문서

- 브레인스토밍: `docs/brainstorm/multi-design.md`
- HTML 샘플: `docs/brainstorm/multi-design-samples/`
  - `editorial.html` — Editorial 디자인 4개 테마
  - `bento.html` — Bento 디자인 4개 테마
  - `brutalist.html` — Brutalist 디자인 4개 테마
  - `glass.html` — Glass 디자인 4개 테마
  - `index.html` — 4개 디자인 개요 (iframe 프리뷰)

---

**Created**: 2026-02-12
**Feature**: multi-design
**Phase**: Plan
