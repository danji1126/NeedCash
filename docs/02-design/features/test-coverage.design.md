# Design: test-coverage

> 프로젝트 전체 테스트 코드 작성 설계서 — Backend/Frontend 295-380개 테스트 케이스

**설계일**: 2026-03-10
**Plan 문서**: `docs/01-plan/features/test-coverage.plan.md`
**분석 보고서**: `docs/05-analysis-report/06-test-coverage.md`
**설계 팀**: backend-architect, frontend-architect, quality-engineer

---

## 1. 개요

### 목적
NeedCash 프로젝트의 테스트 인프라를 체계적으로 구축하고, lib/ 13개 모듈, API Routes 10개, 컴포넌트 39개에 대한 상세 테스트 명세를 정의한다.

### 범위
- Vitest 설정 완성 (환경 분리, 커버리지, 글로벌 mock)
- 공통 mock 모듈 (`__mocks__/env.ts`) 설계
- Backend 테스트 명세 (lib + API Routes)
- Frontend 테스트 명세 (게임 + Admin + UI + 디자인 시스템)
- 5단계 구현 로드맵 상세화

### 현재 상태 → 목표 상태

| 항목 | 현재 | 목표 |
|------|------|------|
| 테스트 파일 | 3개 | ~35개 |
| 테스트 케이스 | 15개 | 295-380개 |
| 추정 커버리지 | ~5% | 70% |
| 환경 설정 | node only, 셋업 없음 | node + jsdom, 글로벌 셋업 완비 |
| Mock 체계 | 테스트별 ad-hoc | `__mocks__/env.ts` 중앙 관리 |

---

## 2. 테스트 인프라 설계

### 2.1 vitest.config.ts 상세 설계

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["components/__tests__/**", "jsdom"],
    ],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
        "components/**/*.tsx",
      ],
      exclude: [
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/*.d.ts",
        "node_modules/**",
        "lib/local-db.ts",
        "lib/design/**",
        "lib/i18n/**",
        "lib/constants.ts",
        "lib/game-content.ts",
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

### 2.2 vitest.setup.ts 설계

```typescript
import { vi, afterEach, beforeEach } from "vitest";

// ─── 환경변수 설정 ───
process.env.USE_LOCAL_DB = "true";
process.env.ADMIN_API_KEY = "test-secret-key-for-vitest";

// ─── framer-motion 글로벌 mock ───
vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return ({
          children,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => {
          const {
            initial: _i, animate: _a, exit: _e, transition: _t,
            whileHover: _wh, whileTap: _wt, whileInView: _wiv,
            variants: _v, layout: _l, layoutId: _li,
            ...domProps
          } = props;
          const React = require("react");
          return React.createElement(prop, domProps, children);
        };
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useInView: () => true,
    useScroll: () => ({
      scrollY: { get: () => 0, onChange: vi.fn() },
      scrollYProgress: { get: () => 0, onChange: vi.fn() },
    }),
    useTransform: () => 0,
    useMotionValue: (initial: number) => ({
      get: () => initial, set: vi.fn(), onChange: vi.fn(),
    }),
    useReducedMotion: () => false,
  };
});

// ─── next/navigation 글로벌 mock ───
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(),
    forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ─── next/link mock ───
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

// ─── next/image mock ───
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

// ─── 테스트 격리 cleanup ───
afterEach(() => {
  if (typeof localStorage !== "undefined") localStorage.clear();
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  vi.useRealTimers();
  vi.clearAllMocks();
});
```

### 2.3 `__mocks__/env.ts` 설계

```typescript
import { vi } from "vitest";

// ─── In-Memory KV Store ───
let kvStore = new Map<string, string>();

export const mockKV: KVNamespace = {
  get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
  put: vi.fn(async (key: string, value: string) => { kvStore.set(key, value); }),
  delete: vi.fn(async (key: string) => { kvStore.delete(key); }),
  list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: "" })),
  getWithMetadata: vi.fn(async () => ({ value: null, metadata: null })),
} as unknown as KVNamespace;

// ─── D1 Database Stub ───
function createMockStatement() {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
  };
  stmt.bind.mockReturnValue(stmt);
  return stmt;
}

export const mockDB: D1Database = {
  prepare: vi.fn(() => createMockStatement()),
  batch: vi.fn(async (stmts: unknown[]) => ({
    results: stmts.map(() => ({ meta: { changes: 0 } })),
  })),
  exec: vi.fn(),
  dump: vi.fn(),
} as unknown as D1Database;

// ─── Export ───
export const getDB = vi.fn((): D1Database => mockDB);
export const getKV = vi.fn((): KVNamespace => mockKV);

// ─── 테스트 유틸리티 ───
export function resetMocks(): void {
  kvStore = new Map<string, string>();
  (mockKV.get as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string) => kvStore.get(key) ?? null
  );
  (mockKV.put as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string, value: string) => { kvStore.set(key, value); }
  );
  vi.clearAllMocks();
}

export function seedKV(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) kvStore.set(key, value);
}

export function resetToLocalDB(): void {
  const { getLocalDB } = require("../lib/local-db");
  getDB.mockReturnValue(getLocalDB() as unknown as D1Database);
}

export function mockDBFirstResult(result: unknown): void {
  const stmt = createMockStatement();
  stmt.first.mockResolvedValue(result);
  (mockDB.prepare as ReturnType<typeof vi.fn>).mockReturnValue(stmt);
}

export function mockDBAllResults(results: unknown[]): void {
  const stmt = createMockStatement();
  stmt.all.mockResolvedValue({ results });
  (mockDB.prepare as ReturnType<typeof vi.fn>).mockReturnValue(stmt);
}
```

### 2.4 패키지 의존성

```bash
cd apps/web && pnpm add -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2.5 package.json 스크립트

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:lib": "vitest run lib/",
    "test:api": "vitest run app/api/",
    "test:components": "vitest run components/"
  }
}
```

---

## 3. Backend 테스트 설계

### 3.1 lib/ 모듈별 테스트 명세

#### 3.1.1 `lib/score-validation.ts`

**Export**: `validateScore`, `validateNickname`, `isRankableGame`, `getScoreType`, `SCORE_ORDER`, `SCORE_UNIT`, `SCORE_RANGES`
**Mock**: 없음 (순수 함수)

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-SV-001 | reaction 최소 경계값 허용 | `validateScore("reaction", 100)` | `true` | 단위 |
| LIB-SV-002 | reaction 최대 경계값 허용 | `validateScore("reaction", 2000)` | `true` | 단위 |
| LIB-SV-003 | reaction 최소 미만 거부 | `validateScore("reaction", 99)` | `false` | 단위 |
| LIB-SV-004 | reaction 최대 초과 거부 | `validateScore("reaction", 2001)` | `false` | 단위 |
| LIB-SV-005 | color-sense 범위 허용 (1-50) | `validateScore("color-sense", 1)` / `50` | `true` | 단위 |
| LIB-SV-006 | color-sense 범위 초과 거부 | `validateScore("color-sense", 51)` | `false` | 단위 |
| LIB-SV-007 | color-memory 범위 허용 (1-30) | `validateScore("color-memory", 1)` / `30` | `true` | 단위 |
| LIB-SV-008 | color-memory 범위 초과 거부 | `validateScore("color-memory", 31)` | `false` | 단위 |
| LIB-SV-009 | typing 범위 허용 (0-250) | `validateScore("typing", 0)` / `250` | `true` | 단위 |
| LIB-SV-010 | typing 범위 초과 거부 | `validateScore("typing", 251)` | `false` | 단위 |
| LIB-SV-011 | math 범위 허용 (0-120) | `validateScore("math", 0)` / `120` | `true` | 단위 |
| LIB-SV-012 | math 범위 초과 거부 | `validateScore("math", 121)` | `false` | 단위 |
| LIB-SV-013 | NaN 거부 | `validateScore("reaction", NaN)` | `false` | 단위 |
| LIB-SV-014 | Infinity 거부 | `validateScore("reaction", Infinity)` | `false` | 단위 |
| LIB-SV-015 | 소수점 점수 허용 | `validateScore("reaction", 150.5)` | `true` | 단위 |
| LIB-SV-016 | 유효 한글 닉네임 허용 | `validateNickname("플레이어")` | `{ valid: true }` | 단위 |
| LIB-SV-017 | 유효 영문 닉네임 허용 | `validateNickname("player1")` | `{ valid: true }` | 단위 |
| LIB-SV-018 | 빈 문자열 허용 (익명) | `validateNickname("")` | `{ valid: true }` | 단위 |
| LIB-SV-019 | 2자 닉네임 거부 | `validateNickname("ab")` | `{ valid: false }` | 단위 |
| LIB-SV-020 | 3자 닉네임 허용 | `validateNickname("abc")` | `{ valid: true }` | 단위 |
| LIB-SV-021 | 12자 닉네임 허용 | `validateNickname("a".repeat(12))` | `{ valid: true }` | 단위 |
| LIB-SV-022 | 13자 닉네임 거부 | `validateNickname("a".repeat(13))` | `{ valid: false }` | 단위 |
| LIB-SV-023 | 특수문자 닉네임 거부 | `validateNickname("user@!")` | `{ valid: false }` | 단위 |
| LIB-SV-024 | 예약어 "admin" 거부 | `validateNickname("admin")` | `{ valid: false, error: "사용할 수 없는 닉네임" }` | 단위 |
| LIB-SV-025 | 예약어 대소문자 무관 | `validateNickname("ADMIN")` | `{ valid: false }` | 단위 |
| LIB-SV-026 | 예약어 "관리자" 거부 | `validateNickname("관리자")` | `{ valid: false }` | 단위 |
| LIB-SV-027 | 예약어 "needcash" 거부 | `validateNickname("needcash")` | `{ valid: false }` | 단위 |
| LIB-SV-028 | isRankableGame 5종 true | `reaction`, `typing`, `math`, `color-sense`, `color-memory` | `true` | 단위 |
| LIB-SV-029 | isRankableGame 비랭킹 false | `dice`, `lotto`, `animal-face`, `quiz` | `false` | 단위 |
| LIB-SV-030 | getScoreType reaction = ms_lower | `getScoreType("reaction")` | `"ms_lower"` | 단위 |
| LIB-SV-031 | getScoreType typing = higher | `getScoreType("typing")` | `"higher"` | 단위 |

---

#### 3.1.2 `lib/auth.ts`

**Export**: `verifyAdminAuth`, `unauthorizedResponse`
**Mock**: `process.env` 조작

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-AUTH-001 | 유효 토큰 인증 성공 | `Bearer test-key`, `ADMIN_API_KEY=test-key` | `true` | 단위 |
| LIB-AUTH-002 | 잘못된 토큰 인증 실패 | `Bearer wrong-key` | `false` | 단위 |
| LIB-AUTH-003 | Authorization 헤더 없음 | 헤더 없음 | `false` | 단위 |
| LIB-AUTH-004 | ADMIN_API_KEY 미설정 | 환경변수 없음 | `false` | 단위 |
| LIB-AUTH-005 | Bearer 접두사 없이 토큰만 | `Authorization: test-key` | `false` | 단위 |
| LIB-AUTH-006 | Basic 인증 형식 거부 | `Authorization: Basic dGVzdA==` | `false` | 단위 |
| LIB-AUTH-007 | Bearer 뒤 빈 토큰 | `Authorization: Bearer ` | `false` | 단위 |
| LIB-AUTH-008 | unauthorizedResponse 상태코드 | 호출 | `status: 401` | 단위 |
| LIB-AUTH-009 | unauthorizedResponse WWW-Authenticate | 호출 | 헤더에 `Bearer` 포함 | 단위 |
| LIB-AUTH-010 | unauthorizedResponse body | 호출 | `{ error: "Unauthorized" }` | 단위 |
| LIB-AUTH-011 | timing-safe: 길이 다른 토큰 | 짧은 토큰 vs 긴 키 | `false` | 단위 |

---

#### 3.1.3 `lib/scores.ts`

**Export**: `submitScore`, `getLeaderboard`, `checkRateLimit`
**Mock**: `vi.mock("@/lib/env")` 또는 `USE_LOCAL_DB=true`

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-SCR-001 | 정상 점수 제출 | 유효 데이터 | `{ id: number }` 반환 | 통합 |
| LIB-SCR-002 | 신규 방문자 삽입 | 새 visitorId | visitors 테이블 레코드 생성 | 통합 |
| LIB-SCR-003 | 기존 방문자 visit_count 증가 | 동일 visitorId 2회 | `visit_count = 2` | 통합 |
| LIB-SCR-004 | nickname null 허용 | `nickname: null` | 정상 저장 | 통합 |
| LIB-SCR-005 | metadata JSON 직렬화 | `{ accuracy: 95 }` | DB에 JSON 문자열 저장 | 통합 |
| LIB-SCR-006 | 리더보드 ASC 정렬 (reaction) | 150, 200, 100 | `[100, 150, 200]` | 통합 |
| LIB-SCR-007 | 리더보드 DESC 정렬 (typing) | 50, 100, 80 | `[100, 80, 50]` | 통합 |
| LIB-SCR-008 | 리더보드 limit 적용 | 15개, limit=10 | 10개 반환 | 통합 |
| LIB-SCR-009 | 리더보드 total: DISTINCT visitor_id | 동일 방문자 3회 | `total: 1` | 통합 |
| LIB-SCR-010 | myRank 정상 반환 | 유효 visitorId + 점수 | `{ rank, score, nickname }` | 통합 |
| LIB-SCR-011 | myRank null (visitorId null) | null | `myRank: null` | 통합 |
| LIB-SCR-012 | myRank 순위 계산 ASC | reaction: 200, 기존 100/150 | `rank: 3` | 통합 |
| LIB-SCR-013 | 빈 리더보드 | 점수 없음 | `{ leaderboard: [], myRank: null, total: 0 }` | 통합 |
| LIB-SCR-014 | checkRateLimit 첫 제출 허용 | 이전 없음 | `true` | 통합 |
| LIB-SCR-015 | checkRateLimit 60초 이내 거부 | 방금 제출 | `false` | 통합 |
| LIB-SCR-016 | checkRateLimit 60초 경과 허용 | 60초 전 제출 | `true` | 통합 |

---

#### 3.1.4 `lib/db.ts`

**Export**: `getAllPosts`, `getPostBySlug`, `getPostBySlugAdmin`, `createPost`, `updatePost`, `deletePost`, `getAllSlugs` 등
**Mock**: `USE_LOCAL_DB=true` + better-sqlite3

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-DB-001 | getAllPosts 발행 글만 반환 | published 혼합 | 발행 글만 | 통합 |
| LIB-DB-002 | getAllPosts date DESC 정렬 | 날짜 다른 3개 | 최신순 | 통합 |
| LIB-DB-003 | getAllPosts offset/limit | 5개, offset=2, limit=2 | 2개 반환 | 통합 |
| LIB-DB-004 | getPostBySlug 존재하는 발행 글 | 유효 slug | PostFull 반환 | 통합 |
| LIB-DB-005 | getPostBySlug 미발행 null | 미발행 slug | `null` | 통합 |
| LIB-DB-006 | getPostBySlug 미존재 null | `"non-existent"` | `null` | 통합 |
| LIB-DB-007 | getPostBySlugAdmin 미발행 포함 | 미발행 slug | PostFull 반환 | 통합 |
| LIB-DB-008 | createPost 정상 생성 | 필수 필드 | PostFull, id 존재 | 통합 |
| LIB-DB-009 | createPost tags JSON 직렬화 | `["js","react"]` | `'["js","react"]'` | 통합 |
| LIB-DB-010 | createPost 중복 slug 에러 | 동일 slug 2회 | throw | 통합 |
| LIB-DB-011 | updatePost 단일 필드 | `{ title: "New" }` | title만 변경 | 통합 |
| LIB-DB-012 | updatePost 다중 필드 | title, description | 모두 변경 | 통합 |
| LIB-DB-013 | updatePost tags JSON 직렬화 | `{ tags: ["new"] }` | `'["new"]'` | 통합 |
| LIB-DB-014 | updatePost published boolean→int | `{ published: false }` | DB에 `0` | 통합 |
| LIB-DB-015 | updatePost 빈 data | `{}` | 변경 없이 기존 글 반환 | 통합 |
| LIB-DB-016 | updatePost 미존재 slug | `"non-existent"` | `null` | 통합 |
| LIB-DB-017 | updatePost updated_at 자동 설정 | 아무 필드 | 오늘 날짜 | 통합 |
| LIB-DB-018 | deletePost 존재하는 글 | 유효 slug | `true` | 통합 |
| LIB-DB-019 | deletePost 미존재 slug | `"non-existent"` | `false` | 통합 |
| LIB-DB-020 | getAllSlugs 발행 글만 | 혼합 | 발행 slug 배열 | 통합 |
| LIB-DB-021 | rowToMeta tags JSON.parse | `'["a","b"]'` | `["a","b"]` | 통합 |
| LIB-DB-022 | rowToMeta published 1→true | `published: 1` | `true` | 통합 |

---

#### 3.1.5 `lib/analytics.ts`

**Export**: `isAnalyticsEnabled`, `setAnalyticsEnabled`, `incrementCounter`, `checkAutoBlock`, `getUsage`, `setThreshold`
**Mock**: `vi.mock("@/lib/env")` → D1 + KV stub

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-AN-001 | isAnalyticsEnabled 기본 true | KV 비어있음 | `true` | 통합 |
| LIB-AN-002 | isAnalyticsEnabled "false" | KV 설정 | `false` | 통합 |
| LIB-AN-003 | setAnalyticsEnabled true | 호출 | KV에 `"true"` | 통합 |
| LIB-AN-004 | setAnalyticsEnabled manual=true | 호출 | auto_off 리셋 | 통합 |
| LIB-AN-005 | incrementCounter 첫 호출 | 없음 | `1` 반환 | 통합 |
| LIB-AN-006 | incrementCounter 연속 | 3회 | `3` 반환 | 통합 |
| LIB-AN-007 | checkAutoBlock 임계치 미달 | 99/100 | `false` | 통합 |
| LIB-AN-008 | checkAutoBlock 임계치 도달 | 100/100 | `true`, KV 차단 | 통합 |
| LIB-AN-009 | getUsage 기본값 | 비어있음 | `{ today: 0, threshold: 90000, enabled: true, autoOff: false }` | 통합 |
| LIB-AN-010 | getUsage 설정값 반환 | 모두 설정 | 정확한 값 | 통합 |
| LIB-AN-011 | setThreshold 설정 | `50000` | KV에 `"50000"` | 통합 |

---

#### 3.1.6 `lib/env.ts`

**Export**: `getDB`, `getKV`
**Mock**: `process.env` 조작, `vi.resetModules()`

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-ENV-001 | getDB 로컬 → better-sqlite3 | `USE_LOCAL_DB=true` | prepare 메서드 존재 | 단위 |
| LIB-ENV-002 | getKV 로컬 → in-memory Map | `USE_LOCAL_DB=true` | get/put 동작 | 단위 |
| LIB-ENV-003 | getKV 미존재 키 null | get("absent") | `null` | 단위 |
| LIB-ENV-004 | getKV 싱글톤 유지 | 두 번 호출 | 동일 데이터 공유 | 단위 |

---

#### 3.1.7 `lib/visitor.ts`

**Export**: `getVisitorId`, `setVisitorCookie`
**Mock**: Request 직접 생성

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-VIS-001 | 쿠키에서 ID 추출 | `Cookie: ncv_id=<UUID>` | `{ id, isNew: false }` | 단위 |
| LIB-VIS-002 | 쿠키 없으면 신규 생성 | Cookie 없음 | `{ id, isNew: true }` | 단위 |
| LIB-VIS-003 | 유효하지 않은 쿠키 → 신규 | 잘못된 형식 | `{ id, isNew: true }` | 단위 |
| LIB-VIS-004 | setVisitorCookie 속성 확인 | 호출 | HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=31536000 | 단위 |

---

#### 3.1.8 `lib/admin-rate-limit.ts`

**Export**: `checkAdminRateLimit`
**Mock**: KV stub, Request

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-ARL-001 | 첫 요청 허용 | KV 비어있음 | `true` | 통합 |
| LIB-ARL-002 | 19번째 허용 | count=19 | `true` | 통합 |
| LIB-ARL-003 | 20번째 거부 | count=20 | `false` | 통합 |
| LIB-ARL-004 | IP별 독립 카운트 | IP-A: 20, IP-B: 0 | A 거부, B 허용 | 통합 |
| LIB-ARL-005 | IP 없으면 "unknown" | 헤더 없음 | key=`admin_rate:unknown` | 통합 |

---

#### 3.1.9 `lib/compile-markdown.ts`

**Export**: `compileMarkdown`, `calculateReadingTime`
**Mock**: 없음

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-CM-001 | 기본 마크다운 변환 | `"# Hello"` | `<h1>` 포함 | 단위 |
| LIB-CM-002 | GFM 테이블 지원 | 테이블 문법 | `<table>` 포함 | 단위 |
| LIB-CM-003 | 코드 블록 highlight.js | ` ```js ``` ` | `hljs` 클래스 | 단위 |
| LIB-CM-004 | XSS: script 제거 | `<script>alert(1)</script>` | `<script>` 없음 | 단위 |
| LIB-CM-005 | XSS: onerror 제거 | `<img onerror="...">` | `onerror` 없음 | 단위 |
| LIB-CM-006 | XSS: javascript: URL 제거 | `[link](javascript:...)` | `javascript:` 없음 | 단위 |
| LIB-CM-007 | XSS: iframe 제거 | `<iframe>` | 없음 | 단위 |
| LIB-CM-008 | rehype-slug 헤딩 id | `"## Hello World"` | `id="hello-world"` | 단위 |
| LIB-CM-009 | readingTime 200단어 = 1분 | 200단어 | `1` | 단위 |
| LIB-CM-010 | readingTime 201단어 = 2분 | 201단어 | `2` (ceil) | 단위 |
| LIB-CM-011 | readingTime 빈 문자열 | `""` | `1` (최소) | 단위 |

---

#### 3.1.10 `lib/game-history.ts`

**Export**: `getGameHistory`, `addGameHistory`, `clearGameHistory`
**Mock**: jsdom (localStorage)

| ID | 테스트 명 | 입력/조건 | 기대 결과 | 유형 |
|----|----------|----------|----------|------|
| LIB-GH-001 | 빈 상태 | localStorage 비어있음 | `[]` | 단위 |
| LIB-GH-002 | 게임별 필터링 | 3게임 혼합 | 해당 게임만 | 단위 |
| LIB-GH-003 | 잘못된 JSON → 빈 배열 | invalid json | `[]` | 단위 |
| LIB-GH-004 | 항목 추가 + 자동 id/date | 새 항목 | UUID, ISO 날짜 포함 | 단위 |
| LIB-GH-005 | 최신 항목 맨 앞 | 2개 순차 | index 0이 최신 | 단위 |
| LIB-GH-006 | 게임당 100개 제한 | 101개 | 100개 유지 | 단위 |
| LIB-GH-007 | clearGameHistory 특정 게임 | `game="reaction"` | reaction만 삭제 | 단위 |

---

#### 3.1.11 나머지 lib 모듈

| 모듈 | 함수 | 케이스 수 | 유형 |
|------|------|:---------:|------|
| `anonymous-id.ts` | `getAnonymousId` | 4 | 단위 (localStorage) |
| `game-content.ts` | `getGameContent`, `getRelatedGames` | 6 | 단위 (순수 함수) |
| `utils.ts` | `cn` | 5 | 단위 (순수 함수) |

---

### 3.2 기존 테스트 보강 명세

| 파일 | 현재 갭 | 추가 케이스 |
|------|---------|:-----------:|
| `score-validation.test.ts` | reaction만 테스트, 4게임 경계값 미테스트 | +20-25 |
| `auth.test.ts` | Bearer 변형, unauthorizedResponse 미테스트 | +6-8 |
| `compile-markdown.test.ts` | XSS 벡터 부족, GFM/readingTime 경계값 | +6-9 |

---

### 3.3 API Routes 테스트 명세

#### 3.3.1 `POST /api/scores`

| ID | 테스트 명 | 요청 조건 | 기대 응답 |
|----|----------|----------|----------|
| API-SCR-001 | 정상 점수 제출 | 유효 body + 쿠키 | `201`, `{ id }` |
| API-SCR-002 | Invalid JSON | 잘못된 body | `400` |
| API-SCR-003 | 미등록 게임 거부 | `gameSlug: "dice"` | `400` |
| API-SCR-004 | 범위 밖 점수 | `score: 9999` | `400` |
| API-SCR-005 | metadata 1KB 초과 | 큰 metadata | `400` |
| API-SCR-006 | 닉네임 검증 실패 | `nickname: "ab"` | `400` |
| API-SCR-007 | rate limit 초과 | 60초 이내 재제출 | `429` |
| API-SCR-008 | 신규 방문자 Set-Cookie | 쿠키 없음 | `201` + Set-Cookie |

#### 3.3.2 `GET /api/scores/[game]`

| ID | 테스트 명 | 요청 조건 | 기대 응답 |
|----|----------|----------|----------|
| API-SG-001 | 정상 조회 | `game=reaction` | `200`, LeaderboardResult |
| API-SG-002 | 미등록 게임 | `game=dice` | `400` |
| API-SG-003 | limit 파라미터 | `?limit=5` | limit=5 |
| API-SG-004 | limit 최대 50 | `?limit=100` | limit=50 |
| API-SG-005 | Cache-Control 설정 | 정상 | `s-maxage=60` |

#### 3.3.3 `GET/POST /api/posts`

| ID | 테스트 명 | 요청 조건 | 기대 응답 |
|----|----------|----------|----------|
| API-PG-001 | GET 정상 목록 | 기본 | `200`, PostMeta[] |
| API-PG-002 | GET offset/limit | 파라미터 | 적용됨 |
| API-PP-001 | POST 정상 생성 | 인증 + 유효 body | `201` |
| API-PP-002 | POST 인증 실패 | 토큰 없음 | `401` |
| API-PP-003 | POST 잘못된 slug | `"Hello World"` | `400` |
| API-PP-004 | POST 필수 필드 누락 | title 없음 | `400` |

#### 3.3.4 `GET/PUT/DELETE /api/posts/[slug]`

| ID | 테스트 명 | 요청 조건 | 기대 응답 |
|----|----------|----------|----------|
| API-PS-001 | GET 발행 글 | 비인증 | `200` |
| API-PS-002 | GET 미발행 (비인증) | 비인증 | `404` |
| API-PS-003 | GET 미발행 (인증) | 인증 | `200` (admin) |
| API-PS-004 | PUT 정상 업데이트 | 인증 + body | `200` |
| API-PS-005 | PUT content → html 재컴파일 | content 포함 | compileMarkdown 호출 |
| API-PS-006 | DELETE 정상 | 인증 + slug | `200` |
| API-PS-007 | DELETE 미존재 | 없는 slug | `404` |

#### 3.3.5 나머지 API Routes

| Route | 메서드 | 핵심 테스트 | 케이스 수 |
|-------|--------|-----------|:---------:|
| `/api/auth/verify` | GET | 유효/무효 토큰 | 3 |
| `/api/analytics/pageview` | POST | rate limit, 자동 차단, AE 스킵 | 7 |
| `/api/analytics/config` | GET | enabled 상태 반환 | 3 |
| `/api/admin/analytics/config` | GET, PUT | 인증, rate limit, 토글/threshold | 10 |
| `/api/admin/scores/[game]` | GET, DELETE | 인증, rate limit, 유효 게임 | 9 |
| `/api/posts/admin` | GET | 인증, 전체 목록 | 3 |

---

### 3.4 Backend Mock 전략 상세

| 테스트 대상 | Mock 전략 | 이유 |
|-----------|----------|------|
| `lib/db.ts`, `lib/scores.ts`, `lib/analytics.ts` | `USE_LOCAL_DB=true` + better-sqlite3 | 실제 SQL 검증 필요 |
| `app/api/**` 라우트 핸들러 | `vi.mock("@/lib/env")` + `__mocks__/env.ts` | lib 모듈 격리 |
| `lib/auth.ts`, `lib/visitor.ts` | Request 직접 생성 | mock 불필요 |

**테스트 격리**:
- D1: `beforeEach`에서 `DELETE FROM game_scores/visitors/posts/analytics_counters`
- KV: `resetMocks()` → in-memory Map 초기화
- 모듈 상태: `vi.resetModules()` (env.ts 싱글톤 격리)
- 타이머: `vi.useFakeTimers()` + `afterEach`에서 `vi.useRealTimers()`

---

## 4. Frontend 테스트 설계

### 4.1 게임 컴포넌트 테스트 명세

#### 4.1.1 ReactionGame (24 케이스)

| ID | 테스트 명 | 핵심 검증 | Mock |
|----|----------|----------|------|
| FE-RCT-001 | idle 초기 렌더링 | 측정 횟수 입력(기본 5), "시작하기" 버튼 | 없음 |
| FE-RCT-002 | 측정 횟수 증/감/범위 제한 | min=1, max=20, 비정상 입력 보정 | 없음 |
| FE-RCT-003 | 시작 → waiting 전환 | 빨간 배경, "초록색이 되면 클릭!" | `vi.useFakeTimers` |
| FE-RCT-004 | waiting → go (2~5초) | 초록 배경, `performance.now()` 호출 | `vi.useFakeTimers`, `performance.now` spy |
| FE-RCT-005 | waiting 중 클릭 → tooEarly | "너무 빨라요!", 1.5초 후 재시작 | `vi.useFakeTimers` |
| FE-RCT-006 | go 클릭 → roundResult | 반응시간(ms) 계산 | `performance.now` spy |
| FE-RCT-007 | roundResult → 다음 라운드 (1.5초 or 클릭) | 자동/수동 전환 | `vi.useFakeTimers` |
| FE-RCT-008 | 마지막 라운드 → result | 평균/최고/최저, 등급, addGameHistory | `performance.now` spy |
| FE-RCT-009 | 등급 S (< 200ms) / F (≥ 500ms) | grade/title 정확성 | |
| FE-RCT-010 | "다시 도전" / 종료 | 상태 초기화, 타이머 정리 | `vi.useFakeTimers` |
| FE-RCT-011 | 키보드 접근성 | Enter/Space → handleClick | |
| FE-RCT-012 | aria-label, aria-live | role="button", polite | |

#### 4.1.2 TypingGame (22 케이스)

| ID | 테스트 명 | 핵심 검증 | Mock |
|----|----------|----------|------|
| FE-TYP-001 | idle + 언어 선택 | ko/en 전환 | 없음 |
| FE-TYP-002 | countdown 3→2→1→playing | 1초마다 카운트 | `vi.useFakeTimers` |
| FE-TYP-003 | 정확/틀린 문자 색상 | emerald-400 / red-400 | `vi.useFakeTimers` |
| FE-TYP-004 | 문장 완료 → 새 문장 | correct/typed 갱신, completedTexts+1 | `Math.random` spy |
| FE-TYP-005 | 60초 타임아웃 → result | WPM/정확도/등급 계산 | `vi.useFakeTimers`, `performance.now` |
| FE-TYP-006 | WPM 계산 정확성 | (correct/5) / (elapsed/60) | `performance.now` spy |
| FE-TYP-007 | 등급 S (≥100 WPM) / F (<20 WPM) | grade/title | |
| FE-TYP-008 | 진행바 색상 변화 | 30/10초 기준 초록→노랑→빨강 | `vi.useFakeTimers` |

#### 4.1.3 MathGame (24 케이스)

| ID | 테스트 명 | 핵심 검증 | Mock |
|----|----------|----------|------|
| FE-MTH-001 | idle + 난이도 선택 | easy/medium/hard | 없음 |
| FE-MTH-002 | 문제 생성 난이도별 범위 | easy: 1-20 덧뺄, hard: 1-100 사칙 | `Math.random` spy |
| FE-MTH-003 | 정답 제출 → 점수+1 | score, streak 증가 | `vi.useFakeTimers` |
| FE-MTH-004 | 오답 제출 → streak 초기화 | feedback="wrong" | `vi.useFakeTimers` |
| FE-MTH-005 | 빈/NaN 입력 무시 | 상태 변경 없음 | |
| FE-MTH-006 | 연속 정답 스트릭 표시 | streak ≥ 3 → 텍스트 | |
| FE-MTH-007 | 60초 → result | score/정확도/등급 | `vi.useFakeTimers` |

#### 4.1.4 ColorSenseGame (20 케이스)

| ID | 테스트 명 | 핵심 검증 | Mock |
|----|----------|----------|------|
| FE-CLR-001 | 라운드별 그리드 (2→3→4) | round 1-3/4-6/7-10 | `Math.random` spy |
| FE-CLR-002 | 라운드별 색상 차이 감소 | hueDiff 30→3 | |
| FE-CLR-003 | 정답 클릭 → 점수 (남은 시간 비례) | roundScore 계산 | `performance.now` spy |
| FE-CLR-004 | 오답 클릭 → wrong | addGameHistory 호출 | |
| FE-CLR-005 | 시간 초과 → timeout | 10초 | `vi.useFakeTimers` |
| FE-CLR-006 | 10라운드 완료 → result | 등급 S/F | |

#### 4.1.5 ColorMemoryGame (20 케이스)

| ID | 테스트 명 | 핵심 검증 | Mock |
|----|----------|----------|------|
| FE-CMM-001 | showing → input 전환 | 패턴 재생 후 입력 모드 | `vi.useFakeTimers` |
| FE-CMM-002 | 정답 순서 입력 → correct | phase 전환 | `vi.useFakeTimers` |
| FE-CMM-003 | correct → 다음 라운드 (800ms) | sequence 확장 | `vi.useFakeTimers` |
| FE-CMM-004 | 오답 → wrong → result | 1500ms 후 result | `vi.useFakeTimers` |
| FE-CMM-005 | "그만하기" - showing/input/correct | 각 상태별 score 계산 | |
| FE-CMM-006 | 등급 S (≥15) / F (<3) | round-1 기준 | |
| FE-CMM-007 | 패드 disabled (showing) | disabled=true | |

---

### 4.2 게임 공통 컴포넌트 테스트 명세

#### 4.2.1 ScoreSubmit (15 케이스)

| ID | 핵심 검증 |
|----|----------|
| FE-SSB-001~003 | 초기 렌더링, localStorage 닉네임 복원, 유효성 검사 |
| FE-SSB-004~006 | 정상 등록, localStorage 저장, onSubmitted 호출 |
| FE-SSB-007~009 | 429 처리, 일반 오류, 네트워크 오류 |
| FE-SSB-010~012 | "건너뛰기", submitting disabled, done 상태 |
| FE-SSB-013~015 | errorMsg 초기화, aria-invalid, fetch body 확인 |

#### 4.2.2 Leaderboard (11 케이스)

| ID | 핵심 검증 |
|----|----------|
| FE-LDB-001~003 | 로딩 스켈레톤, 빈 상태, 엔트리 렌더링 |
| FE-LDB-004~006 | 메달 표시, 4위 이하, null 닉네임 |
| FE-LDB-007~009 | 내 순위, 미존재, API 오류 |
| FE-LDB-010~011 | role="table" 접근성, game prop 변경 |

#### 4.2.3 GameResultPanel (6 케이스)

rankable/non-rankable 분기, 점수 제출 후 ScoreSubmit 숨김 + Leaderboard 리프레시

#### 4.2.4 ShareResult (5 케이스)

복사 성공/실패, 2초 후 상태 복귀, buildShareText 호출

#### 4.2.5 GameHistoryPanel (11 케이스)

통계, 날짜 그룹핑(오늘/어제/이전), 최대 20개, 삭제, refreshKey

---

### 4.3 Admin 컴포넌트 테스트 명세

#### 4.3.1 AdminLogin (7 케이스)

초기 렌더링, 로그인 성공/실패, 로딩 disabled, 접근성(htmlFor-id)

#### 4.3.2 PostForm (19 케이스)

| ID | 핵심 검증 |
|----|----------|
| FE-PFM-001~002 | create/edit 모드 초기 렌더링 |
| FE-PFM-003~005 | 제목→슬러그 자동 생성, 한글, 특수문자 |
| FE-PFM-006~009 | autoSlug 토글, 태그 파싱, 빈 태그 필터 |
| FE-PFM-010~015 | Publish/Draft, 저장 성공→리다이렉트, API 오류, 네트워크 오류, disabled |
| FE-PFM-016~019 | Cancel, Preview 토글, Authorization 헤더, URL/method 분기 |

#### 4.3.3 MarkdownEditor (13 케이스)

5개 툴바 버튼(B/I/H/Code/Link), 선택 있음/없음, 프리뷰 DOMPurify

---

### 4.4 UI 공통 컴포넌트 테스트 명세

#### 4.4.1 CookieConsent (8 케이스)

미동의 렌더링, 수락/거부 → localStorage, granted/denied 상태, role="alertdialog"

#### 4.4.2 Button (10 케이스)

variant(default/outline/ghost), size(sm/md/lg), disabled, className 병합

#### 4.4.3 ScrollReveal (8 케이스)

reduced motion, IntersectionObserver 트리거, direction(up/left/right), delay, 한 번만 트리거

---

### 4.5 디자인 시스템 테스트 명세

#### 4.5.1 DesignProvider (10 케이스)

초기값 (localStorage/폴백), setDesign/setTheme, DOM 속성 업데이트, SSR 안전성, localStorage 예외

#### 4.5.2 DesignPicker (13 케이스)

열기/닫기(재클릭/외부/Escape), 디자인/테마 선택, 활성 스타일, aria-expanded/controls/listbox

---

### 4.6 블로그 컴포넌트 테스트 명세

#### 4.6.1 PostList (12 케이스)

카테고리/태그 필터링, 토글 해제, 빈 결과, 포스트 링크, 인라인 태그 클릭, 정렬

---

### 4.7 Frontend Mock 전략 상세

| 대상 | 전략 | 사용 컴포넌트 |
|------|------|-------------|
| `next/navigation` | `vi.mock()` → useRouter/usePathname spy | PostForm, PostList |
| `next/link` | `vi.mock()` → `<a>` 대체 | CookieConsent, PostList |
| `next/dynamic` | `vi.mock()` → 동기 컴포넌트 | 게임 페이지 |
| `framer-motion` | 글로벌 Proxy mock (vitest.setup.ts) | 모든 게임, UI |
| `fetch` | `vi.fn()` per test | ScoreSubmit, Leaderboard, PostForm |
| `localStorage` | jsdom 기본 + `beforeEach clear()` | ScoreSubmit, CookieConsent, DesignProvider |
| `performance.now()` | `vi.spyOn(performance, 'now')` | Reaction, Typing, Math, ColorSense |
| `setTimeout/setInterval` | `vi.useFakeTimers()` | 모든 게임 |
| `Math.random()` | `vi.spyOn(Math, 'random')` | Typing, Math, ColorSense, ColorMemory |
| `IntersectionObserver` | MockIntersectionObserver 클래스 | ScrollReveal |
| `addGameHistory` | `vi.mock("@/lib/game-history")` | 모든 게임 result |
| Context 래퍼 | AuthProvider, DesignProvider | Admin, DesignPicker |

---

## 5. 구현 로드맵 상세

### Phase 1: 인프라 + 기존 보강 (45-55 케이스, ~20%)

| 순서 | 작업 | 파일 | 케이스 |
|:----:|------|------|:------:|
| 1 | 패키지 설치 | package.json | — |
| 2 | vitest 설정 수정 | vitest.config.ts | — |
| 3 | 글로벌 셋업 생성 | vitest.setup.ts | — |
| 4 | 공통 mock 생성 | __mocks__/env.ts | — |
| 5 | score-validation 보강 | lib/__tests__/score-validation.test.ts | +20 |
| 6 | auth 보강 | lib/__tests__/auth.test.ts | +7 |
| 7 | compile-markdown 보강 | lib/__tests__/compile-markdown.test.ts | +7 |
| 8 | env.ts 신규 | lib/__tests__/env.test.ts | 4 |
| 9 | utils.ts 신규 | lib/__tests__/utils.test.ts | 5 |

### Phase 2: Backend 핵심 (60-80 케이스, ~35%)

| 순서 | 작업 | 파일 | 케이스 |
|:----:|------|------|:------:|
| 1 | db.ts | lib/__tests__/db.test.ts | 22 |
| 2 | scores.ts | lib/__tests__/scores.test.ts | 16 |
| 3 | analytics.ts | lib/__tests__/analytics.test.ts | 11 |
| 4 | POST /api/scores | app/api/__tests__/scores.route.test.ts | 8 |

### Phase 3: API Routes + 보조 lib (50-65 케이스, ~50%)

| 순서 | 작업 | 케이스 |
|:----:|------|:------:|
| 1 | GET/POST /api/posts | 6 |
| 2 | GET/PUT/DELETE /api/posts/[slug] | 7 |
| 3 | visitor.ts | 4 |
| 4 | admin-rate-limit.ts | 5 |
| 5 | 나머지 API (auth, pageview, admin) | 35 |

### Phase 4: Frontend 핵심 (75-95 케이스, ~60%)

| 순서 | 작업 | 케이스 |
|:----:|------|:------:|
| 1 | ReactionGame | 24 |
| 2 | TypingGame | 22 |
| 3 | MathGame | 24 |
| 4 | ColorSenseGame | 20 |
| 5 | ColorMemoryGame | 20 |
| 6 | ScoreSubmit + Leaderboard | 26 |
| 7 | CookieConsent | 8 |
| 8 | PostForm | 19 |

### Phase 5: Frontend 보조 (65-85 케이스, ~70%)

| 순서 | 작업 | 케이스 |
|:----:|------|:------:|
| 1 | 게임 보조 4종 | 15-19 |
| 2 | 게임 공통 (Result, Share, History) | 22 |
| 3 | Admin (Login, Editor) | 20 |
| 4 | 디자인 (Provider, Picker) | 23 |
| 5 | 블로그 (PostList) | 12 |
| 6 | UI (Button, ScrollReveal) | 18 |

---

## 6. 품질 기준

### 6.1 모듈별 커버리지 목표

| 모듈 | 1차 | 최종 | 근거 |
|------|:---:|:----:|------|
| `auth.ts` | 80% | 90% | 보안 핵심 |
| `score-validation.ts` | 90% | 95% | 입력 검증 |
| `scores.ts` | 70% | 80% | 순위 계산 |
| `db.ts` | 60% | 75% | 동적 SQL |
| `analytics.ts` | 60% | 75% | 자동 차단 |
| `compile-markdown.ts` | 70% | 85% | XSS 방지 |
| `env.ts` | 80% | 90% | 환경 분기 |
| `app/api/**` | 50% | 75% | API 계약 |
| `components/**` | 20% | 50% | 핵심 인터랙션 |

### 6.2 테스트 작성 규칙

- **Naming**: `describe("모듈/함수") → it("[조건] → [결과]")`
- **AAA**: Arrange → Act → Assert
- **격리**: `beforeEach(() => resetMocks())`, `vi.clearAllMocks()`, `localStorage.clear()`
- **에러 케이스**: 잘못된 입력, 경계값, 빈 입력, 인증 실패, DB 에러, rate limit

### 6.3 CI/CD 통합

```yaml
# .github/workflows/test.yml
- run: pnpm test:coverage
- uses: actions/upload-artifact@v4
  with: { name: coverage-report, path: apps/web/coverage/ }
```

---

## 7. 디렉토리 구조

```
apps/web/
├── vitest.config.ts                      # 수정
├── vitest.setup.ts                       # 신규
├── __mocks__/
│   └── env.ts                            # 신규
├── lib/__tests__/
│   ├── score-validation.test.ts          # 기존 보강
│   ├── auth.test.ts                      # 기존 보강
│   ├── compile-markdown.test.ts          # 기존 보강
│   ├── env.test.ts                       # 신규
│   ├── utils.test.ts                     # 신규
│   ├── db.test.ts                        # 신규
│   ├── scores.test.ts                    # 신규
│   ├── analytics.test.ts                 # 신규
│   ├── visitor.test.ts                   # 신규
│   ├── admin-rate-limit.test.ts          # 신규
│   ├── game-history.test.ts              # 신규
│   ├── game-content.test.ts              # 신규
│   └── anonymous-id.test.ts              # 신규
├── app/api/__tests__/
│   ├── scores.route.test.ts              # 신규
│   ├── scores-game.route.test.ts         # 신규
│   ├── posts.route.test.ts              # 신규
│   ├── posts-slug.route.test.ts         # 신규
│   ├── posts-admin.route.test.ts        # 신규
│   ├── auth-verify.route.test.ts        # 신규
│   ├── pageview.route.test.ts           # 신규
│   ├── analytics-config.route.test.ts   # 신규
│   ├── admin-analytics.route.test.ts    # 신규
│   └── admin-scores.route.test.ts       # 신규
└── components/__tests__/
    ├── game/
    │   ├── reaction-game.test.tsx         # 신규
    │   ├── typing-game.test.tsx           # 신규
    │   ├── math-game.test.tsx             # 신규
    │   ├── color-sense-game.test.tsx      # 신규
    │   ├── color-memory-game.test.tsx     # 신규
    │   ├── score-submit.test.tsx          # 신규
    │   ├── leaderboard.test.tsx           # 신규
    │   ├── game-result-panel.test.tsx     # 신규
    │   ├── share-result.test.tsx          # 신규
    │   └── game-history-panel.test.tsx    # 신규
    ├── ui/
    │   ├── button.test.tsx                # 신규
    │   ├── cookie-consent.test.tsx         # 신규
    │   └── scroll-reveal.test.tsx          # 신규
    ├── admin/
    │   ├── admin-login.test.tsx            # 신규
    │   ├── post-form.test.tsx             # 신규
    │   └── markdown-editor.test.tsx        # 신규
    ├── design/
    │   ├── design-provider.test.tsx        # 신규
    │   └── design-picker.test.tsx          # 신규
    └── blog/
        └── post-list.test.tsx             # 신규
```

**총 ~55개 테스트 파일** (기존 3 + 신규 ~52)
