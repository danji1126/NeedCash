# Design: analytics-leaderboard

> 방문자 통계, 사용자 접근 히스토리, 게임 리더보드 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  migrations/
    0003_create_analytics.sql          # D1 테이블 (visitors, game_scores, game_sessions, analytics_counters)

  lib/
    anonymous-id.ts                    # 익명 ID 생성/관리 (localStorage)
    visitor.ts                         # HttpOnly 쿠키 관리 (서버)
    scores.ts                          # D1 scores CRUD, 검증, 순위
    game-history.ts                    # localStorage 히스토리 CRUD
    analytics.ts                       # AE writeDataPoint, 집계, 토글 확인
    score-validation.ts                # 점수 범위/닉네임 검증 유틸

  app/api/
    scores/route.ts                    # POST (점수 제출)
    scores/[game]/route.ts             # GET (리더보드)
    analytics/pageview/route.ts        # POST (페이지뷰 기록)
    analytics/config/route.ts          # GET (수집 활성화 조회)
    admin/analytics/route.ts           # GET (통계 대시보드 데이터)
    admin/analytics/config/route.ts    # PUT (수집 ON/OFF, 임계치)
    admin/analytics/usage/route.ts     # GET (오늘 사용량/한도)
    game/session/route.ts              # POST (세션 토큰 발급, Phase 4)

  app/admin/
    analytics/page.tsx                 # 통계 대시보드 페이지

  components/
    game/
      leaderboard.tsx                  # 게임별 Top 10 리더보드
      score-submit.tsx                 # 닉네임 입력 + 점수 제출 폼
      game-history.tsx                 # localStorage 개인 히스토리 패널
      game-result-panel.tsx            # 결과 화면 공통 래퍼
    admin/
      analytics-dashboard.tsx          # 통계 대시보드 메인
      analytics-toggle.tsx             # 수집 ON/OFF 토글 + 사용량 게이지
      stat-card.tsx                    # 숫자 지표 카드
      chart-bar.tsx                    # CSS 기반 막대 차트
    analytics/
      page-view-tracker.tsx            # sendBeacon 페이지뷰 수집
```

### 1.2 의존성 관계

```
[클라이언트]
page-view-tracker.tsx
  └─ GET /api/analytics/config (수집 활성화 확인)
  └─ POST /api/analytics/pageview (sendBeacon)

game-result-panel.tsx
  ├─ score-submit.tsx
  │   └─ POST /api/scores
  │   └─ lib/anonymous-id.ts
  │   └─ lib/score-validation.ts (클라이언트 사전 검증)
  ├─ leaderboard.tsx
  │   └─ GET /api/scores/[game]
  ├─ game-history.tsx
  │   └─ lib/game-history.ts (localStorage)
  └─ share-result.tsx (기존)

analytics-dashboard.tsx
  ├─ analytics-toggle.tsx
  │   ├─ GET /api/admin/analytics/usage
  │   └─ PUT /api/admin/analytics/config
  ├─ stat-card.tsx
  ├─ chart-bar.tsx
  └─ GET /api/admin/analytics

[서버]
POST /api/scores
  ├─ lib/visitor.ts (쿠키 읽기)
  ├─ lib/score-validation.ts (서버 검증)
  └─ lib/scores.ts (D1 INSERT)

POST /api/analytics/pageview
  ├─ lib/analytics.ts (KV 토글 확인 → AE writeDataPoint)
  └─ D1 analytics_counters (카운터 증가)

GET /api/scores/[game]
  ├─ Cache API (60초 TTL)
  └─ lib/scores.ts (D1 SELECT)
```

외부 라이브러리 추가: 없음

---

## 2. D1 스키마 상세

### 2.1 마이그레이션 SQL

**파일**: `migrations/0003_create_analytics.sql`

```sql
-- 익명 방문자
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,                                    -- crypto.randomUUID()
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  visit_count INTEGER NOT NULL DEFAULT 1
);

-- 게임 점수 (리더보드)
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,                                -- 'reaction' | 'typing' | 'math' | 'color-sense' | 'color-memory'
  score REAL NOT NULL,
  score_type TEXT NOT NULL,                               -- 'ms_lower' | 'higher'
  nickname TEXT,                                          -- NULL = 익명, 3-12자
  metadata TEXT,                                          -- JSON: { grade, rounds, ... }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX IF NOT EXISTS idx_gs_game_score ON game_scores(game_slug, score);
CREATE INDEX IF NOT EXISTS idx_gs_visitor ON game_scores(visitor_id);
CREATE INDEX IF NOT EXISTS idx_gs_created ON game_scores(created_at);

-- 게임 세션 (Phase 4: 조작 방지)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,                                    -- crypto.randomUUID()
  game TEXT NOT NULL,
  started_at INTEGER NOT NULL,                            -- Date.now()
  used INTEGER NOT NULL DEFAULT 0,                        -- 0=미사용, 1=소비됨
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 통계 수집 카운터 (D1, KV 쓰기 제한 회피)
CREATE TABLE IF NOT EXISTS analytics_counters (
  date TEXT PRIMARY KEY,                                  -- 'YYYY-MM-DD'
  count INTEGER NOT NULL DEFAULT 0
);
```

### 2.2 리더보드 쿼리 패턴

```sql
-- Top 10 (higher is better)
SELECT id, nickname, score, metadata, created_at
FROM game_scores
WHERE game_slug = ?
ORDER BY score DESC
LIMIT 10;

-- Top 10 (lower is better, reaction)
SELECT id, nickname, score, metadata, created_at
FROM game_scores
WHERE game_slug = 'reaction'
ORDER BY score ASC
LIMIT 10;

-- 내 최고 기록 + 순위
SELECT score, nickname,
  (SELECT COUNT(*) + 1 FROM game_scores g2
   WHERE g2.game_slug = g1.game_slug
   AND g2.score < g1.score) as rank         -- reaction (ASC)
FROM game_scores g1
WHERE visitor_id = ? AND game_slug = ?
ORDER BY score ASC
LIMIT 1;

-- 총 참가자 수
SELECT COUNT(DISTINCT visitor_id) as total
FROM game_scores
WHERE game_slug = ?;

-- Rate limit 확인
SELECT created_at FROM game_scores
WHERE visitor_id = ? AND game_slug = ?
ORDER BY created_at DESC
LIMIT 1;
```

---

## 3. lib 모듈 설계

### 3.1 `lib/anonymous-id.ts`

```typescript
const ANON_KEY = "needcash-anonymous-id";

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}
```

### 3.2 `lib/visitor.ts`

```typescript
const VISITOR_COOKIE = "ncv_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1년

export function getVisitorId(request: Request): { id: string; isNew: boolean } {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/ncv_id=([a-f0-9-]{36})/);
  if (match) return { id: match[1], isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

export function setVisitorCookie(headers: Headers, visitorId: string): void {
  headers.append(
    "Set-Cookie",
    `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure; HttpOnly`
  );
}
```

### 3.3 `lib/score-validation.ts`

```typescript
export type RankableGame = "reaction" | "color-sense" | "color-memory" | "typing" | "math";

export const SCORE_ORDER: Record<RankableGame, "ASC" | "DESC"> = {
  reaction: "ASC",
  "color-sense": "DESC",
  "color-memory": "DESC",
  typing: "DESC",
  math: "DESC",
};

export const SCORE_UNIT: Record<RankableGame, string> = {
  reaction: "ms",
  "color-sense": "level",
  "color-memory": "level",
  typing: "WPM",
  math: "문제",
};

export const SCORE_RANGES: Record<RankableGame, { min: number; max: number }> = {
  reaction: { min: 100, max: 2000 },
  "color-sense": { min: 1, max: 50 },
  "color-memory": { min: 1, max: 30 },
  typing: { min: 0, max: 250 },
  math: { min: 0, max: 120 },
};

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_\-]{3,12}$/;
const RESERVED_NAMES = ["admin", "system", "관리자", "운영자", "needcash"];

export function isRankableGame(slug: string): slug is RankableGame {
  return slug in SCORE_ORDER;
}

export function validateScore(game: RankableGame, score: number): boolean {
  const range = SCORE_RANGES[game];
  return Number.isFinite(score) && score >= range.min && score <= range.max;
}

export function validateNickname(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: true }; // 빈 닉네임 = 익명
  if (!NICKNAME_REGEX.test(trimmed))
    return { valid: false, error: "한글, 영문, 숫자, _, - (3-12자)" };
  if (RESERVED_NAMES.includes(trimmed.toLowerCase()))
    return { valid: false, error: "사용할 수 없는 닉네임" };
  return { valid: true };
}

export function getScoreType(game: RankableGame): string {
  return SCORE_ORDER[game] === "ASC" ? "ms_lower" : "higher";
}
```

### 3.4 `lib/scores.ts`

```typescript
import type { RankableGame } from "./score-validation";
import { SCORE_ORDER, getScoreType } from "./score-validation";

// D1 접근 패턴은 기존 db.ts와 동일 (getDB() 사용)

export interface ScoreEntry {
  id: number;
  nickname: string | null;
  score: number;
  metadata: string | null;
  createdAt: string;
}

export interface LeaderboardResult {
  leaderboard: (ScoreEntry & { rank: number })[];
  myRank: { rank: number; score: number; nickname: string | null } | null;
  total: number;
}

export async function submitScore(data: {
  visitorId: string;
  gameSlug: RankableGame;
  score: number;
  nickname: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ id: number }> {
  const db = getDB();
  const scoreType = getScoreType(data.gameSlug);

  // visitor upsert
  await db.batch([
    db.prepare(
      `INSERT OR IGNORE INTO visitors (id) VALUES (?)`
    ).bind(data.visitorId),
    db.prepare(
      `UPDATE visitors SET last_seen = datetime('now'), visit_count = visit_count + 1 WHERE id = ?`
    ).bind(data.visitorId),
  ]);

  const row = await db.prepare(
    `INSERT INTO game_scores (visitor_id, game_slug, score, score_type, nickname, metadata)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id`
  ).bind(
    data.visitorId,
    data.gameSlug,
    data.score,
    scoreType,
    data.nickname || null,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ).first<{ id: number }>();

  return { id: row!.id };
}

export async function getLeaderboard(
  gameSlug: RankableGame,
  visitorId: string | null,
  limit: number = 10,
): Promise<LeaderboardResult> {
  const db = getDB();
  const order = SCORE_ORDER[gameSlug];

  const { results } = await db.prepare(
    `SELECT id, nickname, score, metadata, created_at as createdAt
     FROM game_scores
     WHERE game_slug = ?
     ORDER BY score ${order}
     LIMIT ?`
  ).bind(gameSlug, limit).all<ScoreEntry>();

  const leaderboard = results.map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));

  // 총 참가자 수
  const countRow = await db.prepare(
    `SELECT COUNT(DISTINCT visitor_id) as total FROM game_scores WHERE game_slug = ?`
  ).bind(gameSlug).first<{ total: number }>();

  // 내 순위
  let myRank = null;
  if (visitorId) {
    const op = order === "ASC" ? "<" : ">";
    const myBest = await db.prepare(
      `SELECT score, nickname FROM game_scores
       WHERE visitor_id = ? AND game_slug = ?
       ORDER BY score ${order} LIMIT 1`
    ).bind(visitorId, gameSlug).first<{ score: number; nickname: string | null }>();

    if (myBest) {
      const rankRow = await db.prepare(
        `SELECT COUNT(*) + 1 as rank FROM game_scores
         WHERE game_slug = ? AND score ${op} ?`
      ).bind(gameSlug, myBest.score).first<{ rank: number }>();

      myRank = {
        rank: rankRow!.rank,
        score: myBest.score,
        nickname: myBest.nickname,
      };
    }
  }

  return { leaderboard, myRank, total: countRow!.total };
}

export async function checkRateLimit(
  visitorId: string,
  gameSlug: string,
  intervalMs: number = 60_000,
): Promise<boolean> {
  const db = getDB();
  const last = await db.prepare(
    `SELECT created_at FROM game_scores
     WHERE visitor_id = ? AND game_slug = ?
     ORDER BY created_at DESC LIMIT 1`
  ).bind(visitorId, gameSlug).first<{ created_at: string }>();

  if (!last) return true;
  const elapsed = Date.now() - new Date(last.created_at + "Z").getTime();
  return elapsed >= intervalMs;
}

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}
```

### 3.5 `lib/game-history.ts`

```typescript
export interface GameHistoryEntry {
  id: string;
  game: string;
  score: number;
  grade: string;
  title: string;
  metadata: Record<string, unknown>;
  playedAt: string;
}

const HISTORY_KEY = "needcash-game-history";
const MAX_PER_GAME = 100;

export function getGameHistory(game?: string): GameHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const all: GameHistoryEntry[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
    return game ? all.filter((e) => e.game === game) : all;
  } catch {
    return [];
  }
}

export function addGameHistory(
  entry: Omit<GameHistoryEntry, "id" | "playedAt">
): void {
  if (typeof window === "undefined") return;
  const all = getGameHistory();
  const newEntry: GameHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
  };
  const sameGame = all.filter((e) => e.game === entry.game);
  const others = all.filter((e) => e.game !== entry.game);
  const updated = [newEntry, ...sameGame].slice(0, MAX_PER_GAME);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([...updated, ...others]));
}

export function clearGameHistory(game?: string): void {
  if (typeof window === "undefined") return;
  if (!game) {
    localStorage.removeItem(HISTORY_KEY);
    return;
  }
  const all = getGameHistory();
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(all.filter((e) => e.game !== game))
  );
}
```

### 3.6 `lib/analytics.ts`

```typescript
// Analytics Engine + 수집 토글 관리

export async function isAnalyticsEnabled(): Promise<boolean> {
  // KV에서 확인 (서버 사이드)
  const kv = getKV();
  const enabled = await kv.get("analytics_enabled");
  return enabled !== "false"; // 기본값 true
}

export async function incrementCounter(): Promise<number> {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  await db.prepare(
    `INSERT INTO analytics_counters (date, count) VALUES (?, 1)
     ON CONFLICT(date) DO UPDATE SET count = count + 1`
  ).bind(today).run();

  const row = await db.prepare(
    `SELECT count FROM analytics_counters WHERE date = ?`
  ).bind(today).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function checkAutoBlock(threshold: number): Promise<boolean> {
  // 임계치 도달 시 자동 차단
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  const row = await db.prepare(
    `SELECT count FROM analytics_counters WHERE date = ?`
  ).bind(today).first<{ count: number }>();

  if (row && row.count >= threshold) {
    const kv = getKV();
    await kv.put("analytics_enabled", "false");
    await kv.put("analytics_auto_off", "true");
    return true; // 차단됨
  }
  return false;
}

export async function getUsage(): Promise<{ today: number; threshold: number }> {
  const db = getDB();
  const kv = getKV();
  const today = new Date().toISOString().split("T")[0];

  const row = await db.prepare(
    `SELECT count FROM analytics_counters WHERE date = ?`
  ).bind(today).first<{ count: number }>();

  const thresholdStr = await kv.get("analytics_threshold");
  return {
    today: row?.count ?? 0,
    threshold: thresholdStr ? parseInt(thresholdStr) : 90_000,
  };
}

function getKV(): KVNamespace {
  if (process.env.USE_LOCAL_DB === "true") {
    // 로컬 개발용 Mock KV (또는 실제 KV 바인딩)
    return { get: async () => null, put: async () => {} } as unknown as KVNamespace;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.SITE_CONFIG;
}

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}
```

---

## 4. API 설계 상세

### 4.1 `POST /api/scores`

```typescript
// app/api/scores/route.ts
import { NextRequest } from "next/server";

interface ScoreRequestBody {
  gameSlug: string;
  score: number;
  nickname?: string;
  metadata?: Record<string, unknown>;
}

// Request:
// POST /api/scores
// Cookie: ncv_id=<uuid>
// Body: { gameSlug, score, nickname?, metadata? }

// Response 201:
// { id: 42 }
// Set-Cookie: ncv_id=<uuid> (신규 방문자 시)

// Response 400: { error: "Invalid score" }
// Response 429: { error: "Too fast", retryAfter: 45 }

// 처리 흐름:
// 1. getVisitorId(request) → 쿠키에서 visitor_id
// 2. isRankableGame(gameSlug) 확인
// 3. validateScore(gameSlug, score) 범위 검증
// 4. validateNickname(nickname) 닉네임 검증
// 5. checkRateLimit(visitorId, gameSlug) 60초 간격
// 6. submitScore({ visitorId, gameSlug, score, nickname, metadata })
// 7. setVisitorCookie (신규 시)
```

### 4.2 `GET /api/scores/[game]`

```typescript
// app/api/scores/[game]/route.ts

// Request:
// GET /api/scores/reaction?limit=10
// Cookie: ncv_id=<uuid> (선택)

// Response 200 (Cache-Control: public, s-maxage=60):
// {
//   "leaderboard": [
//     { "rank": 1, "nickname": "speedster", "score": 142, "metadata": null, "createdAt": "..." }
//   ],
//   "myRank": { "rank": 37, "score": 234, "nickname": "player1" },
//   "total": 1523
// }

// 처리 흐름:
// 1. Cache API 확인 → HIT면 즉시 반환
// 2. isRankableGame(game) 확인
// 3. getVisitorId(request) → 쿠키에서 (없으면 null)
// 4. getLeaderboard(game, visitorId, limit)
// 5. Cache API에 저장 (s-maxage=60)
```

### 4.3 `POST /api/analytics/pageview`

```typescript
// app/api/analytics/pageview/route.ts

// Request:
// POST /api/analytics/pageview
// Body: { path: "/game/reaction", referrer: "https://google.com" }

// Response: 204 No Content

// 처리 흐름:
// 1. isAnalyticsEnabled() → false면 즉시 204
// 2. incrementCounter() → 카운터 증가
// 3. checkAutoBlock(threshold) → 임계치 초과 시 자동 차단
// 4. AE writeDataPoint({ blobs: [path, country, referrer], doubles: [1] })
// 5. 204 반환
```

### 4.4 `GET /api/analytics/config`

```typescript
// 클라이언트가 수집 활성화 여부 확인용 (공개 API)

// Response 200 (Cache-Control: public, s-maxage=60):
// { "enabled": true }
```

### 4.5 `PUT /api/admin/analytics/config`

```typescript
// Admin 전용: 수집 ON/OFF, 임계치 설정

// Request:
// PUT /api/admin/analytics/config
// Authorization: Bearer <ADMIN_API_KEY>
// Body: { enabled?: boolean, threshold?: number }

// Response 200:
// { "enabled": true, "threshold": 90000, "autoOff": false }

// 처리 흐름:
// 1. verifyAdminAuth(request) → 401
// 2. KV put analytics_enabled
// 3. KV put analytics_threshold (있으면)
// 4. enabled=true로 설정 시 analytics_auto_off = "false"
```

### 4.6 `GET /api/admin/analytics/usage`

```typescript
// Admin 전용: 오늘 사용량 조회

// Response 200:
// { "today": 2341, "threshold": 90000, "enabled": true, "autoOff": false }
```

### 4.7 `GET /api/admin/analytics`

```typescript
// Admin 전용: 통계 대시보드 데이터

// Request:
// GET /api/admin/analytics?period=30d

// Response 200:
// {
//   "summary": {
//     "totalViews": 12453,
//     "uniqueVisitors": 8721,
//     "totalGamesPlayed": 5234,
//     "avgPagesPerVisit": 2.3
//   },
//   "topPages": [
//     { "path": "/game/reaction", "views": 2341 }
//   ],
//   "gameStats": [
//     { "game": "reaction", "plays": 1523, "avgScore": 234, "uniquePlayers": 892 }
//   ],
//   "dailyViews": [
//     { "date": "2026-03-01", "views": 423, "uniqueVisitors": 189 }
//   ]
// }

// Analytics Engine SQL API 쿼리로 집계
```

---

## 5. 컴포넌트 설계 상세

### 5.1 `components/game/leaderboard.tsx`

```typescript
"use client";

// Props
interface LeaderboardProps {
  game: RankableGame;
}

// State
const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
const [myRank, setMyRank] = useState<MyRank | null>(null);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(true);

// Fetch on mount
useEffect(() => {
  const anonId = getAnonymousId();
  fetch(`/api/scores/${game}?limit=10`)
    .then(res => res.json())
    .then(data => { setEntries(data.leaderboard); setMyRank(data.myRank); setTotal(data.total); setLoading(false); })
    .catch(() => setLoading(false));
}, [game]);
```

**UI 구조**:
```
<section>
  <h3>Top 10 Leaderboard</h3>

  {loading && <Skeleton rows={5} />}

  {!loading && entries.length === 0 && <EmptyState />}

  {!loading && entries.length > 0 && (
    <div role="table" aria-label="리더보드">
      {entries.map(entry => (
        <div role="row" key={entry.id}>
          <span>{entry.rank <= 3 ? medal[entry.rank] : `#${entry.rank}`}</span>
          <span>{entry.nickname || "익명"}</span>
          <span>{entry.score}{SCORE_UNIT[game]}</span>
        </div>
      ))}
    </div>
  )}

  {myRank && (
    <div className="border-t">
      내 순위: #{myRank.rank} / {total.toLocaleString()}명
      내 최고: {myRank.score}{SCORE_UNIT[game]}
    </div>
  )}
</section>
```

**반응형**:
- 모바일(~640px): 닉네임 8자 truncate, 순위+점수만
- 데스크톱(640px~): 풀 닉네임 + 날짜 표시

**애니메이션**: framer-motion `staggerChildren: 0.05`, 각 행 `fadeIn + slideUp`

### 5.2 `components/game/score-submit.tsx`

```typescript
"use client";

interface ScoreSubmitProps {
  game: RankableGame;
  score: number;
  metadata?: Record<string, unknown>;
  onSubmitted?: () => void;
  onSkipped?: () => void;
}

// State
const [nickname, setNickname] = useState(() =>
  typeof window !== "undefined"
    ? localStorage.getItem("needcash-nickname") || ""
    : ""
);
const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
const [errorMsg, setErrorMsg] = useState("");
```

**UI 구조**:
```
{status === "done" ? (
  <SuccessMessage />
) : (
  <form onSubmit={handleSubmit}>
    <label>리더보드에 등록</label>
    <input
      value={nickname}
      onChange={...}
      placeholder="닉네임 (3-12자, 선택)"
      maxLength={12}
      aria-invalid={!!errorMsg}
      aria-describedby="nickname-error"
    />
    {errorMsg && <p id="nickname-error">{errorMsg}</p>}
    <div className="flex gap-2">
      <Button type="submit" disabled={status === "submitting"}>등록</Button>
      <Button variant="ghost" onClick={onSkipped}>건너뛰기</Button>
    </div>
  </form>
)}
```

**제출 흐름**:
1. 닉네임 클라이언트 검증 (validateNickname)
2. `localStorage.setItem("needcash-nickname", nickname)`
3. `POST /api/scores` 호출
4. 성공 → `status = "done"`, `onSubmitted()`
5. 실패 → `status = "error"`, 에러 메시지 표시

### 5.3 `components/game/game-history.tsx`

```typescript
"use client";

interface GameHistoryProps {
  game: string;
}

// useGameHistory 커스텀 훅 내장
// State: entries, stats (total, average, best)
```

**UI 구조**:
```
<section>
  <div className="flex justify-between">
    <h3>내 기록</h3>
    <button onClick={clear}>전체 삭제</button>
  </div>

  {/* 통계 요약 */}
  <div className="grid grid-cols-3 gap-2 text-center">
    <div>총 {stats.total}회</div>
    <div>평균 {stats.average}{unit}</div>
    <div>최고 {stats.best}{unit}</div>
  </div>

  {/* 날짜별 그룹 */}
  {groupedByDate.map(([label, items]) => (
    <div key={label}>
      <h4>{label}</h4>  {/* "오늘", "어제", "이번 주", "이전" */}
      {items.map(item => (
        <div key={item.id}>
          <span>{item.grade}</span>
          <span>{item.title}</span>
          <span>{item.score}{unit}</span>
          <span>{formatTime(item.playedAt)}</span>
        </div>
      ))}
    </div>
  ))}
</section>
```

### 5.4 `components/game/game-result-panel.tsx`

기존 게임 결과 화면에 래퍼로 사용. 각 게임 컴포넌트의 수정을 최소화.

```typescript
"use client";

interface GameResultPanelProps {
  game: RankableGame;
  score: number;
  grade: string;
  title: string;
  shareLines: string[];
  children?: React.ReactNode; // 게임별 추가 결과 UI
}

export function GameResultPanel({
  game, score, grade, title, shareLines, children
}: GameResultPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <>
      {children}

      {!submitted && (
        <ScoreSubmit
          game={game}
          score={score}
          metadata={{ grade }}
          onSubmitted={() => { setSubmitted(true); setShowLeaderboard(true); }}
          onSkipped={() => setSubmitted(true)}
        />
      )}

      <ShareResult game={game} title={title} lines={shareLines} />

      <Leaderboard game={game} key={showLeaderboard ? "refresh" : "init"} />

      <GameHistory game={game} />
    </>
  );
}
```

### 5.5 기존 게임 통합 패턴

**reaction-game.tsx 변경 예시** (최소 변경):

기존 `phase === "result"` 블록에서 ShareResult, history 부분을 `GameResultPanel`로 교체.

```diff
  // 기존
- <ShareResult game="reaction" title="Reaction Test" lines={...} />
- {history.length > 0 && <HistorySection />}

  // 변경
+ <GameResultPanel
+   game="reaction"
+   score={average}
+   grade={grade}
+   title={title}
+   shareLines={[`등급: ${grade} · ${title}`, `평균: ${average}ms`]}
+ >
+   {/* 기존 라운드별 결과 등 게임 고유 UI */}
+ </GameResultPanel>
```

기존 `history` useState와 관련 로직은 GameResultPanel 내부의 GameHistory가 대체하므로 제거 가능.

### 5.6 `components/analytics/page-view-tracker.tsx`

```typescript
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageViewTracker() {
  const pathname = usePathname();
  const enabledRef = useRef<boolean | null>(null);
  const checkedRef = useRef(false);

  // 수집 활성화 확인 (1회, 60초 캐싱)
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    fetch("/api/analytics/config")
      .then((res) => res.json())
      .then((data) => { enabledRef.current = data.enabled; })
      .catch(() => { enabledRef.current = false; });
  }, []);

  // pathname 변경 시 전송
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (enabledRef.current === false) return;

    // enabledRef.current가 null이면 아직 확인 안 됨 → 전송 (서버에서 재확인)
    const data = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    });
    navigator.sendBeacon("/api/analytics/pageview", data);
  }, [pathname]);

  return null;
}
```

루트 `app/layout.tsx`에 추가:
```diff
+ import { PageViewTracker } from "@/components/analytics/page-view-tracker";

  // body 내부
+ <PageViewTracker />
```

### 5.7 `components/admin/analytics-toggle.tsx`

```typescript
"use client";

interface AnalyticsToggleProps {
  apiKey: string;
}

// State
const [enabled, setEnabled] = useState(true);
const [autoOff, setAutoOff] = useState(false);
const [usage, setUsage] = useState({ today: 0, threshold: 90000 });
const [loading, setLoading] = useState(true);
```

**UI 구조**:
```
<div className="rounded-lg border border-border/60 p-4">
  <div className="flex items-center justify-between">
    <div>
      <h3>통계 수집</h3>
      <p className="text-sm text-text-muted">
        {autoOff ? "자동 차단됨 (한도 초과)" : enabled ? "수집 중" : "수집 중지"}
      </p>
    </div>
    <ToggleSwitch checked={enabled} onChange={handleToggle} />
  </div>

  {/* 사용량 게이지 */}
  <div className="mt-3">
    <div className="flex justify-between text-xs text-text-muted">
      <span>오늘 {usage.today.toLocaleString()}</span>
      <span>{usage.threshold.toLocaleString()}</span>
    </div>
    <div className="mt-1 h-2 rounded-full bg-surface-hover">
      <div
        className={cn("h-full rounded-full", percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-green-500")}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
    <p className="mt-1 text-xs text-text-muted">{percentage.toFixed(1)}% 사용</p>
  </div>

  {autoOff && (
    <div className="mt-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
      일별 한도에 도달하여 자동 차단되었습니다. 다음 날 자동 해제됩니다.
    </div>
  )}
</div>
```

### 5.8 `components/admin/stat-card.tsx`

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;      // 전 기간 대비 변화율 (%)
}
```

**UI**: 라벨 + 큰 숫자 + 변화율(+/-%) 카드. 4개 가로 배치 (모바일: 2x2 그리드).

### 5.9 `components/admin/chart-bar.tsx`

CSS-only 수평 막대 차트. 외부 라이브러리 없음.

```typescript
interface ChartBarProps {
  data: { label: string; value: number }[];
  unit?: string;
}
```

**구현**: Tailwind `width` style 비율 계산, `bg-text/20` 바, `aria-label` 접근성.

### 5.10 `app/admin/analytics/page.tsx`

```typescript
"use client";

// useAuth() 로 인증 확인
// 미인증 시 로그인 폼 표시 (기존 admin 패턴)

// State
const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
const [data, setData] = useState<DashboardData | null>(null);

// Layout:
// 1. AnalyticsToggle (수집 ON/OFF + 사용량)
// 2. StatCard x4 (방문, 순방문, 게임 플레이, 페이지/방문)
// 3. 기간 선택 탭 [7일] [30일] [90일]
// 4. ChartBar: 일별 방문자 추이
// 5. ChartBar: 인기 페이지 Top 10
// 6. 게임별 플레이 통계 테이블
```

---

## 6. wrangler.toml 변경

```toml
# 기존
[[d1_databases]]
binding = "DB"
database_name = "needcash-blog"
database_id = "3cc1a2e8-ee84-4e7d-95b4-e0b5895395d8"

# 추가
[[kv_namespaces]]
binding = "SITE_CONFIG"
id = "<생성 후 ID 입력>"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "needcash_analytics"
```

**cloudflare-env.d.ts 업데이트**:
```typescript
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_API_KEY: string;
  // 추가
  SITE_CONFIG: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}
```

---

## 7. 캐싱 전략

| 대상 | 방법 | TTL | 무효화 |
|------|------|-----|--------|
| 리더보드 Top 10 | Cache API | 60초 | TTL 만료 |
| 수집 활성화 config | Cache API | 60초 | TTL 만료 |
| Admin 통계 데이터 | 없음 (Admin 접근 빈도 낮음) | - | - |

Cache API 사용 패턴 (Workers 환경):
```typescript
const cacheKey = new Request(`https://cache.internal/scores/${game}`);
const cache = caches.default;
const cached = await cache.match(cacheKey);
if (cached) return cached;

// ... D1 쿼리 ...

const response = Response.json(data);
response.headers.set("Cache-Control", "public, s-maxage=60");
await cache.put(cacheKey, response.clone());
return response;
```

---

## 8. 보안 구현

### 8.1 점수 제출 검증 체인

```
클라이언트 → POST /api/scores
  1. isRankableGame(gameSlug)           → 400
  2. validateScore(gameSlug, score)     → 400 "Invalid score range"
  3. validateNickname(nickname)         → 400 "Invalid nickname"
  4. checkRateLimit(visitorId, 60000)   → 429 "Too fast"
  5. submitScore(...)                   → 201
```

### 8.2 Admin API 인증 체인

```
클라이언트 → GET/PUT /api/admin/analytics/*
  1. verifyAdminAuth(request)           → 401
  2. 처리 로직
```

기존 `lib/auth.ts`의 `verifyAdminAuth` + `unauthorizedResponse` 패턴 그대로 사용.

---

## 9. 에러 처리

| 상황 | HTTP 코드 | 응답 |
|------|----------|------|
| 유효하지 않은 게임 | 400 | `{ error: "Invalid game" }` |
| 점수 범위 초과 | 400 | `{ error: "Score out of range" }` |
| 닉네임 검증 실패 | 400 | `{ error: "한글, 영문, 숫자, _, - (3-12자)" }` |
| Rate limit 초과 | 429 | `{ error: "Too fast", retryAfter: <seconds> }` |
| Admin 미인증 | 401 | `{ error: "Unauthorized" }` |
| D1 에러 | 500 | `{ error: "Internal server error" }` |

---

## 10. 구현 순서 (Phase별)

### Phase 1: 기반 (1-2일)

1. `migrations/0003_create_analytics.sql` 작성
2. `wrangler.toml` KV + AE 바인딩 추가
3. `cloudflare-env.d.ts` 타입 업데이트
4. `lib/score-validation.ts` 작성
5. `lib/anonymous-id.ts` 작성
6. `lib/visitor.ts` 작성
7. `lib/scores.ts` 작성
8. `lib/game-history.ts` 작성
9. `lib/analytics.ts` 작성

### Phase 2: 리더보드 (2-3일)

1. `app/api/scores/route.ts` (POST)
2. `app/api/scores/[game]/route.ts` (GET + Cache API)
3. `components/game/score-submit.tsx`
4. `components/game/leaderboard.tsx`
5. `components/game/game-history.tsx`
6. `components/game/game-result-panel.tsx`
7. 기존 5개 게임 컴포넌트 통합 (reaction, color-sense, color-memory, typing, math)

### Phase 3: 통계 + 수집 토글 (2-3일)

1. `app/api/analytics/config/route.ts` (GET)
2. `app/api/admin/analytics/config/route.ts` (PUT)
3. `app/api/admin/analytics/usage/route.ts` (GET)
4. `app/api/analytics/pageview/route.ts` (POST + 토글 + 자동 차단)
5. `components/analytics/page-view-tracker.tsx`
6. `app/layout.tsx`에 `<PageViewTracker />` 추가
7. `app/api/admin/analytics/route.ts` (GET)
8. `components/admin/analytics-toggle.tsx`
9. `components/admin/stat-card.tsx`
10. `components/admin/chart-bar.tsx`
11. `components/admin/analytics-dashboard.tsx`
12. `app/admin/analytics/page.tsx`

### Phase 4: 강화 (1-2일)

1. `app/api/game/session/route.ts`
2. ShareResult 확장 (Canvas 이미지 + SNS 공유)
3. Cron Trigger 설정 (별도 Worker 또는 Admin API)
4. 개인정보처리방침 업데이트

---

## 11. 테스트 시나리오

| 시나리오 | 검증 항목 |
|---------|----------|
| 점수 제출 정상 | 201 반환, D1에 INSERT 확인 |
| 범위 외 점수 | 400 반환, D1 미삽입 |
| 60초 이내 재제출 | 429 반환 |
| 금지 닉네임 "admin" | 400 반환 |
| 리더보드 조회 | Top 10 정렬 확인 (ASC/DESC) |
| 리더보드 캐싱 | 60초 내 재요청 시 Cache HIT |
| 통계 토글 OFF | pageview API 204 반환, AE 미기록 |
| 자동 차단 | 카운터 >= threshold 시 KV 업데이트 |
| Admin 미인증 | 401 반환 |
| 신규 방문자 | Set-Cookie: ncv_id 발급 |
