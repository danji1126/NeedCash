# 06. 테스트 코드 생성 분석 보고서

> 프로젝트 전체 Frontend/Backend 테스트 코드 작성을 위한 종합 분석

**분석일**: 2026-03-10
**분석 팀**: backend-architect, frontend-architect, quality-engineer

---

## 1. 현재 테스트 현황

### 1.1 기존 테스트

| 파일 | 대상 | 케이스 수 | 품질 |
|------|------|:---------:|------|
| `lib/__tests__/score-validation.test.ts` | 점수 검증 | 5 | 부분적 — reaction만 테스트, 4개 게임 미테스트 |
| `lib/__tests__/auth.test.ts` | 인증 | 4 | 양호 — 주요 시나리오 커버, Cloudflare 경로 미테스트 |
| `lib/__tests__/compile-markdown.test.ts` | 마크다운 | 6 | 기본적 — XSS `<script>`만 검증, 추가 벡터 미검증 |

**총 15개 테스트 케이스, 추정 커버리지 lib/ 기준 약 15%**

### 1.2 테스트 설정

```typescript
// apps/web/vitest.config.ts
environment: "node"
include: ["**/__tests__/**/*.test.ts"]
coverage: { provider: "v8", include: ["lib/**"] }
```

**개선 필요**: API Routes 미포함, 셋업 파일 없음, 컴포넌트 테스트 환경 없음

---

## 2. 테스트 전략

### 2.1 테스트 피라미드

```
        /  E2E  \          5% (핵심 유저 플로우 3-5개)
       / 통합 API \        25% (API 라우트 + DB 연동)
      / 단위 테스트  \     70% (lib/ 순수 함수 + 컴포넌트)
```

### 2.2 커버리지 목표

| 영역 | 현재 | 1차 목표 | 최종 목표 |
|------|:----:|:--------:|:--------:|
| 전체 | ~5% | 40% | 70% |
| `lib/` | ~15% | 60% | 80% |
| `app/api/` | 0% | 50% | 75% |
| `components/` | 0% | 20% | 50% |

**핵심 모듈 최소 커버리지**: `auth.ts` 90%, `score-validation.ts` 95%, `scores.ts` 80%

### 2.3 우선순위 매트릭스 (위험도 × 복잡도)

```
위험도 높음 ┃ [P1] auth.ts          [P1] scores.ts
           ┃ [P1] score-validation  [P1] api/scores/route
           ┃──────────────────────────────────────────
위험도 중간 ┃ [P2] db.ts            [P2] analytics.ts
           ┃ [P2] api/posts/route   [P2] admin-rate-limit
           ┃ [P2] visitor.ts        [P2] compile-markdown
           ┃──────────────────────────────────────────
위험도 낮음 ┃ [P3] game-history.ts  [P3] anonymous-id.ts
           ┃ [P3] utils.ts         [P3] game-content.ts
           ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             복잡도 낮음              복잡도 높음
```

---

## 3. Backend 테스트 분석

### 3.1 lib/ 모듈별 분석

| 모듈 | 테스트 가능 함수 | 우선순위 | 유형 | Mock | 예상 케이스 | 상태 |
|------|-----------------|:-------:|------|------|:-----------:|------|
| `score-validation.ts` | `validateScore`, `validateNickname`, `isRankableGame`, `getScoreType` | P1 | 단위 | 없음 | 20-25 | 보강 필요 |
| `auth.ts` | `verifyAdminAuth`, `unauthorizedResponse`, `timingSafeCompare` | P1 | 단위 | Request, crypto | 10-12 | 보강 필요 |
| `scores.ts` | `submitScore`, `getLeaderboard`, `checkRateLimit` | P1 | 통합 | D1 | 15-20 | 미테스트 |
| `db.ts` | `getAllPosts`, `getPostBySlug`, `createPost`, `updatePost`, `deletePost` 등 10개 | P2 | 통합 | D1 | 25-30 | 미테스트 |
| `analytics.ts` | `isAnalyticsEnabled`, `setAnalyticsEnabled`, `incrementCounter`, `checkAutoBlock`, `getUsage`, `setThreshold` | P2 | 통합 | D1+KV | 18-22 | 미테스트 |
| `compile-markdown.ts` | `compileMarkdown`, `calculateReadingTime` | P2 | 단위 | 없음 | 12-15 | 보강 필요 |
| `env.ts` | `getDB`, `getKV` | P2 | 단위 | 환경변수 | 6-8 | 미테스트 |
| `admin-rate-limit.ts` | `checkAdminRateLimit` | P2 | 통합 | KV, Request | 5-7 | 미테스트 |
| `visitor.ts` | `getVisitorId`, `setVisitorCookie` | P2 | 단위 | Request, Headers | 8-10 | 미테스트 |
| `anonymous-id.ts` | `getAnonymousId` | P3 | 단위 | localStorage | 4-5 | 미테스트 |
| `game-history.ts` | `getGameHistory`, `addGameHistory`, `clearGameHistory` | P3 | 단위 | localStorage | 8-10 | 미테스트 |
| `game-content.ts` | `getGameContent`, `getRelatedGames` | P3 | 단위 | JSON import | 5-6 | 미테스트 |
| `utils.ts` | `cn` | P3 | 단위 | 없음 | 3-4 | 미테스트 |

### 3.2 API Routes 분석

| Route | 메서드 | 우선순위 | Mock | 예상 케이스 |
|-------|--------|:-------:|------|:-----------:|
| `/api/scores` | POST | P1 | D1, visitor cookie | 10-12 |
| `/api/posts` | GET, POST | P1 | D1, auth | 12-15 |
| `/api/posts/[slug]` | GET, PUT, DELETE | P1 | D1, auth | 15-19 |
| `/api/scores/[game]` | GET | P2 | D1, visitor cookie | 5-6 |
| `/api/posts/admin` | GET | P2 | D1, auth | 3-4 |
| `/api/analytics/pageview` | POST | P2 | D1, KV | 6-8 |
| `/api/admin/analytics/config` | GET, PUT | P2 | D1, KV, auth | 8-10 |
| `/api/admin/scores/[game]` | GET, DELETE | P2 | D1, auth | 7-9 |
| `/api/auth/verify` | GET | P3 | auth | 3 |
| `/api/analytics/config` | GET | P3 | KV | 2-3 |

### 3.3 핵심 위험 영역

1. **`updatePost` 동적 SQL 생성**: `sets.join(", ")`로 동적 SET 절 조합 — 부분 업데이트 조합 미검증
2. **`getLeaderboard` 순위 계산**: ASC/DESC 분기 + COUNT 기반 순위 + 동점자 처리 미검증
3. **`checkRateLimit` 시간 계산**: `new Date(last.created_at + "Z")` UTC 변환 호환성 미검증
4. **`pageview` 다중 부작용**: rate limit + analytics 토글 + 카운터 + 자동 차단 + AE 기록이 단일 핸들러에 결합

---

## 4. Frontend 테스트 분석

### 4.1 컴포넌트 전체 통계

| 영역 | 파일 수 | 테스트 대상 | 예상 테스트 수 | 우선순위 |
|------|:------:|:----------:|:------------:|:-------:|
| 게임 (핵심 5종) | 5 | 5 | 52-63 | 높음 |
| 게임 (보조 4종) | 4 | 4 | 15-19 | 중간 |
| 게임 (공통) | 5 | 5 | 24-30 | 높음 |
| 블로그 | 6 | 4 | 11-15 | 중간 |
| Admin | 10 | 6 | 28-35 | 중간 |
| UI 공통 | 7 | 7 | 20-27 | 낮음 |
| 디자인 시스템 | 3 | 2 | 11-13 | 중간 |
| 레이아웃 | 18 | 2 | 4-6 | 낮음 |
| 홈 | 6 | 2 | 6-8 | 낮음 |
| SEO/Analytics | 2 | 2 | 7-9 | 낮음 |
| **합계** | **66** | **39** | **178-225** | — |

### 4.2 높은 우선순위 컴포넌트

| 컴포넌트 | 테스트 유형 | 핵심 테스트 요소 | 예상 케이스 |
|----------|-----------|----------------|:-----------:|
| `ReactionGame` | 인터랙션 | Phase 전환 (idle→waiting→go→result), 너무 빠른 클릭 감지, 평균 계산 | 12-15 |
| `TypingGame` | 인터랙션 | WPM 산출, 정확도 계산, 언어 전환, 시간 제한 종료 | 10-12 |
| `MathGame` | 인터랙션 | 문제 생성(난이도별), 정답/오답, 연속 정답 스트릭 | 12-14 |
| `ColorSenseGame` | 인터랙션 | 색상 생성, 라운드 진행, 점수 계산 | 10-12 |
| `ColorMemoryGame` | 인터랙션 | 시퀀스 생성/확장, 패드 입력 검증 | 8-10 |
| `ScoreSubmit` | 인터랙션 | 닉네임 검증, API 호출 성공/실패/429 | 8-10 |
| `Leaderboard` | 단위 | 데이터 로딩/빈 상태/에러, 순위 메달 | 5-6 |
| `CookieConsent` | 인터랙션 | 수락/거부, localStorage 저장 | 5-6 |
| `PostForm` | 인터랙션 | 제목→슬러그 자동생성, 태그 파싱, API 호출 | 8-10 |

### 4.3 테스트 환경 요구사항

#### 필요 패키지

| 패키지 | 용도 |
|--------|------|
| `@testing-library/react` (v16+) | React 19 컴포넌트 렌더링/인터랙션 |
| `@testing-library/jest-dom` | DOM 매처 (`toBeInTheDocument` 등) |
| `@testing-library/user-event` | 사용자 인터랙션 시뮬레이션 |
| `jsdom` | 브라우저 DOM 시뮬레이션 |

#### DOM 환경 선택: jsdom

`localStorage`, `navigator.sendBeacon`, `clipboard API`, `IntersectionObserver`, `performance.now()` 등 다양한 Web API를 사용하므로 호환성이 검증된 **jsdom** 선택.

#### Next.js / 라이브러리 모킹 전략

| 대상 | 전략 |
|------|------|
| `next/navigation` | `vi.mock()` — `useRouter`, `usePathname` spy |
| `next/link` | `vi.mock()` → `<a>` 태그 대체 |
| `next/dynamic` | `vi.mock()` → 직접 컴포넌트 반환 |
| `framer-motion` | `vi.mock()` → `motion.div` → `div`, `AnimatePresence` → Fragment |
| `localStorage` | jsdom 기본 제공, `beforeEach`에서 `clear()` |
| `fetch` | `vi.fn()` 또는 MSW |
| `performance.now()` | `vi.spyOn(performance, 'now')` |
| `setTimeout`/`setInterval` | `vi.useFakeTimers()` |

---

## 5. Mock 전략

### 5.1 Cloudflare 바인딩 (D1/KV)

| 방법 | 설명 | 적합 대상 |
|------|------|----------|
| **`USE_LOCAL_DB=true` (기존 인프라)** | `getDB()` → better-sqlite3, `getKV()` → in-memory Map | 통합 테스트 (db.ts, scores.ts, analytics.ts) |
| **`vi.mock("@/lib/env")`** | getDB/getKV stub 반환 | 단위 테스트 (API routes) |

**권장**: `__mocks__/env.ts` 공통 mock 모듈 생성 → 전체 서버사이드 테스트의 single mock point

### 5.2 테스트 간 격리

- D1 통합 테스트: `beforeEach`에서 테이블 truncate
- KV: in-memory Map은 `expirationTtl` 무시됨 → TTL 기반 테스트는 별도 mock 필요
- localStorage: `beforeEach`에서 `localStorage.clear()`
- 모듈 상태: `env.ts`의 `localKVStore` 싱글톤 → `vi.resetModules()`로 격리

---

## 6. 테스트 디렉토리 구조

```
apps/web/
  lib/__tests__/
    score-validation.test.ts     (기존 — 보강)
    auth.test.ts                 (기존 — 보강)
    compile-markdown.test.ts     (기존 — 보강)
    db.test.ts                   (신규)
    scores.test.ts               (신규)
    analytics.test.ts            (신규)
    visitor.test.ts              (신규)
    admin-rate-limit.test.ts     (신규)
    env.test.ts                  (신규)
    game-history.test.ts         (신규)
    game-content.test.ts         (신규)
  app/api/__tests__/
    scores.route.test.ts         (신규)
    posts.route.test.ts          (신규)
    auth-verify.route.test.ts    (신규)
    admin-analytics.route.test.ts(신규)
    admin-scores.route.test.ts   (신규)
    pageview.route.test.ts       (신규)
  components/__tests__/
    game/
      reaction-game.test.tsx     (신규)
      typing-game.test.tsx       (신규)
      math-game.test.tsx         (신규)
      color-sense-game.test.tsx  (신규)
      color-memory-game.test.tsx (신규)
      score-submit.test.tsx      (신규)
      leaderboard.test.tsx       (신규)
    ui/
      button.test.tsx            (신규)
      cookie-consent.test.tsx    (신규)
    admin/
      post-form.test.tsx         (신규)
      admin-login.test.tsx       (신규)
      markdown-editor.test.tsx   (신규)
    design/
      design-provider.test.tsx   (신규)
      design-picker.test.tsx     (신규)
    blog/
      post-list.test.tsx         (신규)
  __mocks__/
    env.ts                       (신규 — getDB/getKV 공통 mock)
  vitest.setup.ts                (신규 — 환경변수, 글로벌 mock)
  vitest.config.ts               (수정 — 환경 분리, 커버리지 확장)
```

---

## 7. 구현 로드맵

### Phase 1: 인프라 구축 + 기존 테스트 보강 (예상: 45-55 케이스)

**목표**: 테스트 환경 완성 + 기존 3개 파일 보강 + 핵심 lib 모듈

| 작업 | 내용 | 예상 케이스 |
|------|------|:-----------:|
| 환경 구축 | 패키지 설치, vitest.config.ts 수정, vitest.setup.ts, `__mocks__/env.ts` | — |
| `score-validation` 보강 | 5개 게임 전체 경계값, 닉네임 정규식 전체, `getScoreType` | +15-20 |
| `auth` 보강 | Bearer 형식 변형, 빈 토큰, `unauthorizedResponse()` | +6-8 |
| `compile-markdown` 보강 | 추가 XSS 벡터, GFM, 한글 readingTime | +6-9 |
| `env.ts` 신규 | 환경 분기 로직 | 6-8 |
| `utils.ts` 신규 | `cn()` 함수 | 3-4 |

### Phase 2: Backend 핵심 모듈 (예상: 60-80 케이스)

**목표**: 데이터 계층 + 점수/인증 API

| 작업 | 내용 | 예상 케이스 |
|------|------|:-----------:|
| `db.ts` | CRUD 전체, rowToMeta JSON.parse 에러 | 25-30 |
| `scores.ts` | submitScore, getLeaderboard, checkRateLimit | 15-20 |
| `analytics.ts` | 토글, 카운터, 자동 차단 | 18-22 |
| `POST /api/scores` | 검증 실패, rate limit, 정상 제출 | 10-12 |

### Phase 3: API Routes + 보조 lib (예상: 50-65 케이스)

**목표**: 블로그 API + 나머지 모듈

| 작업 | 내용 | 예상 케이스 |
|------|------|:-----------:|
| `/api/posts` GET/POST | pagination, 인증, slug 검증 | 12-15 |
| `/api/posts/[slug]` | GET/PUT/DELETE, 동적 SQL | 15-19 |
| `visitor.ts` | 쿠키 파싱/설정 | 8-10 |
| `admin-rate-limit.ts` | IP 기반 rate limit | 5-7 |
| 나머지 API routes | admin, pageview 등 | 15-20 |

### Phase 4: Frontend 컴포넌트 - 핵심 (예상: 75-95 케이스)

**목표**: 게임 + 점수 제출 + 핵심 UI

| 작업 | 내용 | 예상 케이스 |
|------|------|:-----------:|
| 게임 5종 | Reaction, Typing, Math, ColorSense, ColorMemory | 52-63 |
| ScoreSubmit + Leaderboard | API 인터랙션, 데이터 표시 | 13-16 |
| CookieConsent | 동의/거부 흐름 | 5-6 |
| PostForm | 폼 인터랙션 | 8-10 |

### Phase 5: Frontend 컴포넌트 - 보조 (예상: 65-85 케이스)

**목표**: 나머지 컴포넌트 + 디자인 시스템

| 작업 | 내용 | 예상 케이스 |
|------|------|:-----------:|
| 게임 보조 4종 | Dice, Lotto, Quiz, AnimalFace | 15-19 |
| 게임 공통 | GameHistoryPanel, ShareResult 등 | 15-20 |
| Admin | Login, MarkdownEditor, AnalyticsToggle | 15-19 |
| 디자인 시스템 | DesignProvider, DesignPicker | 11-13 |
| 블로그 | PostList, MobileToc | 9-12 |
| UI 공통 | Button, Card, Tag, Breadcrumb | 12-16 |

---

## 8. vitest.config.ts 수정안

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      // 컴포넌트 테스트는 jsdom 환경
      ["components/__tests__/**", "jsdom"],
    ],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "components/**"],
      exclude: ["**/__tests__/**", "**/__mocks__/**", "node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

---

## 9. 종합 통계

| 지표 | 현재 | 전체 구현 후 |
|------|:----:|:----------:|
| 테스트 파일 수 | 3 | ~35 |
| 테스트 케이스 수 | 15 | 295-380 |
| Backend 테스트 | 15 | 155-200 |
| Frontend 테스트 | 0 | 140-180 |
| 추정 커버리지 | ~5% | 60-70% |
| 테스트된 lib 모듈 | 3/13 | 13/13 |
| 테스트된 API Routes | 0/10 | 10/10 |
| 테스트된 컴포넌트 | 0/39 | 25-30/39 |

### 예상 작업량

| Phase | 예상 케이스 | 누적 커버리지 |
|:-----:|:-----------:|:------------:|
| Phase 1 (인프라+보강) | 45-55 | ~20% |
| Phase 2 (Backend 핵심) | 60-80 | ~35% |
| Phase 3 (API+보조 lib) | 50-65 | ~50% |
| Phase 4 (Frontend 핵심) | 75-95 | ~60% |
| Phase 5 (Frontend 보조) | 65-85 | ~70% |

---

## 10. 특이 사항

| 항목 | 설명 |
|------|------|
| React 19 호환 | `@testing-library/react` v16+ 필요 |
| framer-motion 모킹 | 대부분 컴포넌트가 사용 → 글로벌 mock 필수 |
| 타이머 기반 게임 | `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 패턴 |
| AnimalFace 난이도 | getUserMedia, TensorFlow 등 모킹 복잡 → E2E 테스트 권장 |
| D1 통합 테스트 | `USE_LOCAL_DB=true` + better-sqlite3 활용 (이미 구현됨) |
| KV TTL 미지원 | in-memory Map mock은 `expirationTtl` 무시 → TTL 테스트 별도 mock |
| Context 래퍼 | AuthProvider, DesignProvider 하위 컴포넌트 테스트 시 래퍼 필요 |
