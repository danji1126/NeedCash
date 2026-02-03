# Plan: react-best-practices

> Vercel React Best Practices 기준 코드 품질 개선

## 1. Overview

### Purpose
Vercel React Best Practices 57개 룰 기준으로 NeedCash 프로젝트 코드를 검증한 결과, CRITICAL~HIGH 수준의 개선 항목이 발견됨.
번들 사이즈 최적화, 렌더링 성능, JS 성능 관련 수정을 통해 프로덕션 품질 향상을 목표로 함.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + Static Export)
- 검증 기준: Vercel React Best Practices v1.0.0 (8개 카테고리, 57개 룰)
- 검증 결과: CRITICAL 3건, HIGH 3건, MEDIUM 2건 발견

## 2. Scope

### In Scope
- Next.js `<Script>` 태그 위치 수정 (layout.tsx)
- 게임 컴포넌트 dynamic import 적용 (game/[slug]/page.tsx)
- 전역 CSS `*` transition 최적화 (globals.css)
- 정적 객체/배열 모듈 레벨 호이스팅 (scroll-reveal.tsx, dice-game.tsx)
- RegExp 모듈 레벨 호이스팅 (mdx.ts)
- PostList filter 로직 단일화 (post-list.tsx)
- content-visibility 적용 (블로그 목록, 게임 히스토리)
- 서버-클라이언트 직렬화 최소화 검토

### Out of Scope
- 새로운 기능 추가
- UI/디자인 변경
- 외부 라이브러리 교체 (framer-motion 등)
- Backend/API 관련 작업
- 테스트 코드 작성

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 관련 룰 |
|----|---------|---------|---------|
| FR-01 | `<Script>` 태그를 `<body>` 안으로 이동 | CRITICAL | Next.js best practice |
| FR-02 | DiceGame, LottoGame에 `next/dynamic` 적용 | CRITICAL | `bundle-dynamic-imports` |
| FR-03 | `*` 셀렉터 transition 제거 또는 범위 제한 | CRITICAL | CSS performance |
| FR-04 | ScrollReveal의 offsets 객체를 모듈 레벨에 호이스팅 | HIGH | `rendering-hoist-jsx` |
| FR-05 | DiceFace의 grid indices 배열을 모듈 레벨에 호이스팅 | HIGH | `rendering-hoist-jsx` |
| FR-06 | extractHeadings의 RegExp를 모듈 레벨에 호이스팅 | HIGH | `js-hoist-regexp` |
| FR-07 | PostList의 filter 2회 호출을 단일 filter로 통합 | MEDIUM | `js-combine-iterations` |
| FR-08 | 블로그 목록/게임 히스토리에 content-visibility 적용 | MEDIUM | `rendering-content-visibility` |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 기능 동작에 영향 없어야 함 (시각적/기능적 회귀 없음) |
| NFR-02 | 빌드 성공 (`pnpm build`) |
| NFR-03 | 린트 통과 (`pnpm lint`) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL 항목 해결 | 3/3 (100%) |
| HIGH 항목 해결 | 3/3 (100%) |
| MEDIUM 항목 해결 | 2/2 (100%) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |

## 5. Implementation Order

### Phase 1: CRITICAL 수정 (3건)
1. **FR-01**: `layout.tsx` - `<Script>` 태그 `<head>` → `<body>` 이동
2. **FR-02**: `game/[slug]/page.tsx` - `next/dynamic` 적용
3. **FR-03**: `globals.css` - `*` transition 최적화

### Phase 2: HIGH 수정 (3건)
4. **FR-04**: `scroll-reveal.tsx` - offsets 호이스팅
5. **FR-05**: `dice-game.tsx` - GRID_INDICES 호이스팅
6. **FR-06**: `mdx.ts` - HEADING_REGEX 호이스팅

### Phase 3: MEDIUM 수정 (2건)
7. **FR-07**: `post-list.tsx` - filter 통합
8. **FR-08**: 해당 컴포넌트에 content-visibility CSS 적용

### Phase 4: 검증
9. `pnpm lint` 실행
10. `pnpm build` 실행
11. 개발 서버에서 시각적 회귀 테스트

## 6. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `apps/web/app/layout.tsx` | Script 태그 위치 이동 | 1 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import 적용 | 1 |
| `apps/web/app/globals.css` | * transition 최적화 | 1 |
| `apps/web/components/ui/scroll-reveal.tsx` | offsets 호이스팅 | 2 |
| `apps/web/components/game/dice-game.tsx` | GRID_INDICES 호이스팅 | 2 |
| `apps/web/lib/mdx.ts` | HEADING_REGEX 호이스팅 | 2 |
| `apps/web/components/blog/post-list.tsx` | filter 통합 | 3 |
| `apps/web/app/globals.css` | content-visibility 추가 | 3 |

## 7. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| dynamic import로 인한 게임 로딩 지연 | LOW | LOW | loading fallback 추가 가능 |
| * transition 제거 시 테마 전환 시각 효과 손실 | MEDIUM | HIGH | 주요 요소에만 개별 적용으로 대체 |
| RegExp lastIndex 리셋 누락 | LOW | MEDIUM | 함수 진입 시 lastIndex=0 리셋 |
| content-visibility로 인한 스크롤 점프 | LOW | LOW | contain-intrinsic-size 지정 |

## 8. Dependencies

- 추가 라이브러리 설치 불필요
- 기존 의존성 범위 내에서 모든 수정 가능

---

**Created**: 2026-02-03
**Feature**: react-best-practices
**Phase**: Plan
