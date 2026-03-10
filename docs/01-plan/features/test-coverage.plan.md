# Plan: test-coverage

> 프로젝트 전체 테스트 코드 작성 - Backend/Frontend 295-380개 테스트 케이스 구현 로드맵

## 1. Overview

### Purpose
NeedCash 프로젝트의 테스트 커버리지를 ~5%에서 70%로 확대한다. 13개 lib 모듈, 10개 API 라우트, 39개 컴포넌트를 대상으로 단위/통합 테스트를 체계적으로 작성한다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + Vitest)
- 분석 출처: `docs/05-analysis-report/06-test-coverage.md` (3개 팀 통합 분석)
- 현재 상태: 3개 테스트 파일, 15개 케이스, lib/ 기준 ~15%
- 테스트 프레임워크: Vitest (node 환경) + V8 coverage

### Current State Analysis

| 영역 | 현재 | 목표 | 간극 |
|------|:----:|:----:|:----:|
| 전체 커버리지 | ~5% | 70% | 65%p |
| `lib/` 모듈 | 3/13 | 13/13 | 10개 |
| API Routes | 0/10 | 10/10 | 10개 |
| 컴포넌트 | 0/39 | 25-30/39 | 25-30개 |
| 테스트 케이스 | 15 | 295-380 | 280-365개 |

### Decisions
- 5단계 Phase로 구현 (인프라 → Backend 핵심 → API+보조 → Frontend 핵심 → Frontend 보조)
- TDD 방식 적용 (Red → Green → Refactor)
- Cloudflare 바인딩: `USE_LOCAL_DB=true` + better-sqlite3 통합 테스트, `vi.mock` 단위 테스트
- 컴포넌트 테스트: jsdom + @testing-library/react v16+ (React 19 호환)
- framer-motion 글로벌 mock 적용

## 2. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|:--------:|
| FR-01 | 테스트 인프라 구축 (vitest.config.ts, vitest.setup.ts, __mocks__/env.ts) | P0 |
| FR-02 | 기존 3개 테스트 파일 보강 (score-validation, auth, compile-markdown) | P0 |
| FR-03 | lib/ 핵심 모듈 테스트 (db.ts, scores.ts, analytics.ts) | P1 |
| FR-04 | API Routes 테스트 (scores, posts, auth, admin) | P1 |
| FR-05 | 보조 lib 모듈 테스트 (env, visitor, admin-rate-limit, game-history 등) | P2 |
| FR-06 | 게임 컴포넌트 테스트 (5종 핵심 + 공통) | P2 |
| FR-07 | Admin/Blog/UI 컴포넌트 테스트 | P3 |
| FR-08 | 디자인 시스템/레이아웃 컴포넌트 테스트 | P3 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|----------|
| NFR-01 | 테스트 실행 시간 30초 이내 (전체 suite) |
| NFR-02 | 테스트 간 격리 보장 (DB truncate, localStorage clear, module reset) |
| NFR-03 | CI/CD 호환 (headless, 환경변수 분기) |
| NFR-04 | 커버리지 리포트 V8 provider + lib/api/components 포함 |

## 3. Implementation Phases

### Phase 1: 인프라 + 기존 보강 (45-55 케이스)
- 환경 구축, 패키지 설치, 설정 파일 생성
- score-validation, auth, compile-markdown 테스트 보강
- env.ts, utils.ts 신규 테스트

### Phase 2: Backend 핵심 (60-80 케이스)
- db.ts CRUD 전체, scores.ts, analytics.ts
- POST /api/scores 통합 테스트

### Phase 3: API Routes + 보조 lib (50-65 케이스)
- 블로그 API, visitor.ts, admin-rate-limit.ts
- 나머지 API routes

### Phase 4: Frontend 핵심 (75-95 케이스)
- 게임 5종, ScoreSubmit, Leaderboard, CookieConsent, PostForm

### Phase 5: Frontend 보조 (65-85 케이스)
- 게임 보조 4종, 게임 공통, Admin, 디자인 시스템, 블로그, UI 공통

## 4. Success Criteria

| 지표 | 기준 |
|------|------|
| 전체 커버리지 | ≥ 60% |
| lib/ 커버리지 | ≥ 80% |
| API Routes 커버리지 | ≥ 75% |
| 테스트 통과율 | 100% |
| 회귀 감지 능력 | 핵심 비즈니스 로직 변경 시 테스트 실패 |
