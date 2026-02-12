# Gap Analysis: multi-design

> Plan 문서 대비 구현 코드 Gap 분석 (Check Phase)

## Summary

| 항목 | 값 |
|------|-----|
| Feature | multi-design |
| Plan 문서 | `docs/01-plan/features/multi-design.plan.md` |
| 분석 일시 | 2026-02-12 |
| Match Rate | **97%** (Act-1 후) |
| FR 충족률 | 16.75 / 17 (98.5%) |
| NFR 충족률 | 8.0 / 8 (100%) |
| 전체 충족률 | 24.75 / 25 (99%) → 보정 **97%** |
| Iteration | 1 |

## Functional Requirements Analysis

### CRITICAL (FR-01 ~ FR-06)

| FR | 요구사항 | 상태 | 점수 | 비고 |
|----|---------|------|------|------|
| FR-01 | DesignConfig / ThemeConfig 타입 정의 | ✅ Pass | 1.0 | `lib/design/index.ts`에 `DesignId`, `ThemeConfig`, `DesignConfig` 타입 정의 |
| FR-02 | 디자인 레지스트리 구축 | ✅ Pass | 1.0 | 4개 디자인 파일(`editorial.ts`, `bento.ts`, `brutalist.ts`, `glass.ts`) + `DESIGNS`, `DESIGN_MAP` export |
| FR-03 | DesignProvider Context 구현 | ✅ Pass | 1.0 | `design-provider.tsx` — design/theme state, html attribute 동기화, lazy initializer |
| FR-04 | useDesign() hook 구현 | ✅ Pass | 1.0 | `use-design.ts` — DesignContext에서 design/theme/setter/config 제공 |
| FR-05 | globals.css 디자인 구조 토큰 | ✅ Pass | 1.0 | **Act-1에서 수정**: 4개 `[data-design]`에 `--radius-card`, `--radius-button`, `--card-shadow`, `--border-width`, `--transition-duration`, `--font-heading-weight`, `--letter-spacing-heading` 추가 |
| FR-06 | 16개 테마 CSS 변수 | ✅ Pass | 1.0 | 16개 `[data-theme]` 셀렉터 모두 정의 (editorial 4 + bento 4 + brutal 4 + glass 4) |

**CRITICAL 소계**: 6.0 / 6

### HIGH (FR-07 ~ FR-14, FR-16)

| FR | 요구사항 | 상태 | 점수 | 비고 |
|----|---------|------|------|------|
| FR-07 | Editorial Header | ✅ Pass | 1.0 | `editorial-header.tsx` — sticky, bg/90 backdrop-blur, uppercase logo, thin divider |
| FR-08 | Editorial Hero | ✅ Pass | 1.0 | `editorial-hero.tsx` — 85vh centered, border-bottom CTA |
| FR-09 | Bento 컴포넌트 (4종) | ✅ Pass | 1.0 | BentoHeader, BentoHero, BentoGrid, BentoFooter + BentoPosts 구현 |
| FR-10 | Brutalist 컴포넌트 (4종) | ✅ Pass | 1.0 | BrutalistHeader, BrutalistHero, BrutalistGrid, BrutalistFooter + BrutalistPosts 구현 |
| FR-11 | Glass 컴포넌트 (4종) | ✅ Pass | 1.0 | GlassHeader, GlassHero, GlassGrid, GlassFooter + GlassPosts + GlassBackground blob 애니메이션 |
| FR-12 | 어댑터 컴포넌트 | ⚠️ Partial | 0.75 | **Gap**: Plan은 Header/Hero/SectionGrid/Footer 4개 어댑터. 구현: Header ✅, Footer ✅, HomePage ✅(추가). Hero, SectionGrid 어댑터 파일 미생성 — 대신 HomePage 어댑터가 디자인별 Home에서 Hero+Grid+Posts를 내부적으로 처리 |
| FR-13 | DesignPicker UI | ✅ Pass | 1.0 | `design-picker.tsx` — 2단계 선택 (Design 2x2 grid + Theme color dots) |
| FR-14 | DesignPicker 헤더 통합 | ✅ Pass | 1.0 | 4개 모든 헤더에 `<DesignPicker />` 포함 확인 |
| FR-16 | layout.tsx 통합 | ✅ Pass | 1.0 | DesignProvider 래핑 + FOUC script + GlassBackground + data-design/data-theme |

**HIGH 소계**: 8.75 / 9

### MEDIUM (FR-15, FR-17)

| FR | 요구사항 | 상태 | 점수 | 비고 |
|----|---------|------|------|------|
| FR-15 | localStorage 저장/복원 | ✅ Pass | 1.0 | `needcash-design`, `needcash-theme` 키로 저장. 새로고침 시 FOUC script로 즉시 복원 |
| FR-17 | ThemeSwitcher 대체 | ✅ Pass | 1.0 | **Act-1에서 수정**: 레거시 파일 (`theme-provider.tsx`, `theme-switcher.tsx`) 삭제 완료. DesignPicker가 전체 기능 흡수 |

**MEDIUM 소계**: 2.0 / 2

### FR 종합: 16.75 / 17 (98.5%)

## Non-Functional Requirements Analysis

| NFR | 요구사항 | 상태 | 점수 | 비고 |
|-----|---------|------|------|------|
| NFR-01 | 기존 페이지 정상 동작 | ✅ Pass | 1.0 | `pnpm build` 27페이지 생성 (game, blog, ads, resume 포함) |
| NFR-02 | 빌드 성공 | ✅ Pass | 1.0 | `pnpm build` 성공 확인 |
| NFR-03 | 린트 통과 | ✅ Pass | 1.0 | `pnpm lint` 에러 0건 |
| NFR-04 | FOUC 없음 | ✅ Pass | 1.0 | `<head>` inline script로 localStorage → data-attribute 즉시 설정 |
| NFR-05 | 반응형 지원 | ✅ Pass | 1.0 | 모바일 햄버거 메뉴 (Editorial, Bento, Glass), 반응형 그리드 레이아웃 |
| NFR-06 | WCAG AA 대비 | ✅ Pass | 1.0 | **Act-1에서 검증**: 16개 테마 + root 모두 WCAG AA (4.5:1) 충족. 최저 비율 glass-ocean secondary 5.92:1 |
| NFR-07 | CSS transition | ✅ Pass | 1.0 | `globals.css` transition 규칙: body, header, nav, a, button 등 0.4s cubic-bezier |
| NFR-08 | 외부 라이브러리 추가 없음 | ✅ Pass | 1.0 | 기존 스택만 사용 (react, tailwindcss, next) |

### NFR 종합: 8.0 / 8 (100%)

## Gap Details

### ~~Gap 1: CSS 디자인 구조 토큰 미구현 (FR-05)~~ — ✅ Act-1에서 해결

`globals.css`에 4개 `[data-design]` 셀렉터에 구조 토큰 추가:
- `--radius-card`, `--radius-button`, `--card-shadow`, `--border-width`
- `--transition-duration`, `--font-heading-weight`, `--letter-spacing-heading`

### Gap 2: Hero/SectionGrid 어댑터 파일 미생성 (FR-12)

**Plan 명세**: `components/layout/hero.tsx`, `components/layout/section-grid.tsx` 어댑터 파일 생성

**실제 구현**: HomePage 어댑터(`components/home/home-page.tsx`)가 디자인별 홈페이지 컴포넌트로 분기. 각 홈 컴포넌트가 Hero, Grid, Posts를 직접 import.

**영향**: 기능 동일. HomePage 어댑터가 더 상위 레벨에서 분기하므로 Hero/Grid를 개별 재사용하기 어려움.

**개선 방안**: 향후 다른 페이지에서 Hero나 Grid를 재사용할 필요가 생기면 어댑터 파일 추가.

### ~~Gap 3: 레거시 ThemeSwitcher 파일 잔존 (FR-17)~~ — ✅ Act-1에서 해결

`components/theme/theme-provider.tsx`, `theme-switcher.tsx` 삭제 완료. `components/theme/` 디렉토리 제거.

### ~~Gap 4: WCAG AA 대비율 미검증 (NFR-06)~~ — ✅ Act-1에서 해결

16개 테마 + root 대비율 자동 검증 완료:
- Primary text (--text vs --bg): 17/17 PASS (최저 bento-pastel 13.28:1)
- Secondary text (--text-secondary vs --bg): 17/17 PASS (최저 glass-ocean 5.92:1)
- 100% WCAG AA (4.5:1) 충족

## Implementation Inventory

### 신규 파일 (30개)

**인프라 (6개)**:
- `lib/design/index.ts` — 타입 + 레지스트리
- `lib/design/use-design.ts` — useDesign() hook
- `lib/design/designs/editorial.ts` — Editorial 디자인 정의
- `lib/design/designs/bento.ts` — Bento 디자인 정의
- `lib/design/designs/brutalist.ts` — Brutalist 디자인 정의
- `lib/design/designs/glass.ts` — Glass 디자인 정의

**디자인 컴포넌트 (3개)**:
- `components/design/design-provider.tsx` — DesignProvider Context
- `components/design/design-picker.tsx` — 2단계 선택 UI
- `components/design/glass-background.tsx` — Glass 배경 blob 애니메이션

**디자인별 헤더 (4개)**:
- `components/layout/header/editorial-header.tsx`
- `components/layout/header/bento-header.tsx`
- `components/layout/header/brutalist-header.tsx`
- `components/layout/header/glass-header.tsx`

**디자인별 히어로 (4개)**:
- `components/layout/hero/editorial-hero.tsx`
- `components/layout/hero/bento-hero.tsx`
- `components/layout/hero/brutalist-hero.tsx`
- `components/layout/hero/glass-hero.tsx`

**디자인별 그리드 (4개)**:
- `components/layout/section-grid/editorial-grid.tsx`
- `components/layout/section-grid/bento-grid.tsx`
- `components/layout/section-grid/brutalist-grid.tsx`
- `components/layout/section-grid/glass-grid.tsx`

**디자인별 포스트 (4개)**:
- `components/layout/posts-section/editorial-posts.tsx`
- `components/layout/posts-section/bento-posts.tsx`
- `components/layout/posts-section/brutalist-posts.tsx`
- `components/layout/posts-section/glass-posts.tsx`

**디자인별 푸터 (4개)**:
- `components/layout/footer/editorial-footer.tsx`
- `components/layout/footer/bento-footer.tsx`
- `components/layout/footer/brutalist-footer.tsx`
- `components/layout/footer/glass-footer.tsx`

**홈페이지 (5개)**:
- `components/home/home-page.tsx` — 어댑터
- `components/home/editorial-home.tsx`
- `components/home/bento-home.tsx`
- `components/home/brutalist-home.tsx`
- `components/home/glass-home.tsx`

### 수정 파일 (4개)

- `app/globals.css` — 16개 테마 + 디자인 CSS 변수 + :root 기본값
- `app/layout.tsx` — DesignProvider + FOUC script + GlassBackground
- `app/page.tsx` — HomePage 어댑터 사용
- `components/layout/header.tsx` — 어댑터 패턴으로 리팩토링
- `components/layout/footer.tsx` — 어댑터 패턴으로 리팩토링

### 레거시 파일 — ✅ Act-1에서 삭제 완료

- ~~`components/theme/theme-provider.tsx`~~ — 삭제됨
- ~~`components/theme/theme-switcher.tsx`~~ — 삭제됨

## Recommendations

1. ~~**즉시 수행 (Act)**: 레거시 ThemeSwitcher 파일 삭제~~ — ✅ Done
2. ~~**단기**: `globals.css`에 `[data-design]` 구조 토큰 CSS 변수 추가~~ — ✅ Done
3. ~~**단기**: WCAG AA 대비율 자동 검증 실시~~ — ✅ Done (100% Pass)
4. **중기**: Hero/SectionGrid 어댑터 파일 생성 (다른 페이지에서 재사용 시) — 유일한 잔여 Gap

## Conclusion

Match Rate **97%** (Act-1 후). Plan 대비 핵심 기능 모두 구현. 4개 디자인 × 4개 테마 = 16가지 조합 정상 동작. Playwright 시각적 검증 + WCAG AA 대비율 100% 통과. 유일한 잔여 Gap은 Hero/SectionGrid 어댑터 파일(FR-12)으로, HomePage 어댑터가 상위 레벨에서 동일 기능을 대체.

---

**Created**: 2026-02-12
**Updated**: 2026-02-12 (Act-1)
**Feature**: multi-design
**Phase**: Check → Act-1
**Match Rate**: 92% → **97%**
**Iteration**: 1
