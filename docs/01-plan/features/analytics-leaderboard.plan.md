# Plan: analytics-leaderboard

> 방문자 통계, 사용자 접근 히스토리, 게임 리더보드 기능 추가

## 1. Overview

### Purpose
방문자 통계(Admin 전용), 개인 게임 히스토리(localStorage), 게임 리더보드(D1)를 구현한다. Admin은 통계 수집을 ON/OFF 토글할 수 있으며, 무료 플랜 한도 초과 시 자동 차단된다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4)
- 인프라: Cloudflare Workers + D1 + Analytics Engine + KV
- 현재 게임 9종 (dice, lotto, animal-face, reaction, color-sense, color-memory, typing, math, quiz)
- 사용자 계정 시스템 없음 (익명 사용자)
- Admin 인증: Bearer token (ADMIN_API_KEY)
- 참고 문서: `docs/brainstorm/analytics-leaderboard.brainstorm.md`

### Decisions
- 방문자 통계: Analytics Engine (D1 대비 CPU 0.5ms, 시계열 최적화)
- 게임 리더보드: D1 (ORDER BY/LIMIT 관계형 쿼리 필요)
- 개인 히스토리: localStorage (계정 없음, DB 부하 제거)
- 리더보드 캐싱: Cache API (무료, 60초 TTL)
- 통계 수집 설정: KV (`SITE_CONFIG` 바인딩)
- 익명 사용자 식별: HttpOnly 쿠키 + localStorage anonymousId

## 2. Scope

### In Scope

**Phase 1: 기반 인프라**
- D1 마이그레이션 (visitors, game_scores, daily_stats, game_sessions, analytics_counters 테이블)
- KV 네임스페이스 생성 (SITE_CONFIG)
- Analytics Engine 바인딩
- `lib/scores.ts` - D1 scores CRUD
- `lib/anonymous-id.ts` - 익명 ID 생성/관리
- `lib/game-history.ts` - localStorage 히스토리 관리
- `lib/analytics.ts` - Analytics Engine 집계 함수
- `lib/visitor.ts` - 방문자 쿠키 관리

**Phase 2: 게임 리더보드**
- `POST /api/scores` - 점수 제출 (검증 포함)
- `GET /api/scores/[game]` - 게임별 리더보드 Top 10
- `components/game/leaderboard.tsx` - 리더보드 UI
- `components/game/score-submit.tsx` - 닉네임 입력 + 제출 폼
- `components/game/game-history.tsx` - 개인 히스토리 패널
- `components/game/game-result-panel.tsx` - 결과 화면 공통 래퍼
- 기존 5개 게임(reaction, color-sense, color-memory, typing, math) 통합

**Phase 3: 방문자 통계 + 수집 토글**
- `POST /api/analytics/pageview` - 페이지뷰 기록 (AE, 토글 연동)
- `GET /api/analytics/config` - 수집 활성화 여부 조회
- `PUT /api/admin/analytics/config` - 수집 ON/OFF 토글, 임계치 설정
- `GET /api/admin/analytics/usage` - 오늘 AE 사용량/한도 조회
- `GET /api/admin/analytics` - 통계 대시보드 데이터
- `components/analytics/page-view-tracker.tsx` - sendBeacon 기반 수집
- `components/admin/analytics-dashboard.tsx` - 통계 대시보드 (수집 토글 + 사용량 게이지)
- `components/admin/stat-card.tsx` - 숫자 지표 카드
- `components/admin/chart-bar.tsx` - CSS 기반 막대 차트

**Phase 4: 강화**
- `POST /api/game/session` - 게임 세션 토큰 발급 (조작 방지)
- ShareResult 확장 (이미지 생성 + SNS 공유)
- Cron Trigger (데이터 정리, 카운터 리셋)

### Out of Scope
- 사용자 계정/로그인 시스템
- 실시간 WebSocket 리더보드
- 게임 리플레이/관전 기능
- 외부 분석 도구 연동 (GA, Mixpanel)
- dice, lotto, animal-face, quiz 리더보드 (운/AI/성격 기반)

## 3. Requirements

### Functional Requirements

#### Phase 1: 기반 인프라

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | D1 마이그레이션 | CRITICAL | visitors, game_scores, game_sessions, analytics_counters 테이블 생성 |
| FR-02 | KV 네임스페이스 생성 | HIGH | `SITE_CONFIG` 바인딩, wrangler.toml 업데이트 |
| FR-03 | Analytics Engine 바인딩 | HIGH | `ANALYTICS` 바인딩, wrangler.toml 업데이트 |
| FR-04 | 익명 ID 관리 | HIGH | HttpOnly 쿠키 `ncv_id` + localStorage 보조, `lib/anonymous-id.ts` |
| FR-05 | 방문자 쿠키 관리 | HIGH | 쿠키 발급/갱신/읽기, `lib/visitor.ts` |
| FR-06 | 게임 히스토리 유틸 | HIGH | localStorage CRUD, 게임별 최대 100건 FIFO, `lib/game-history.ts` |
| FR-07 | 점수 CRUD 함수 | HIGH | D1 기반 점수 제출/조회/순위 계산, `lib/scores.ts` |

#### Phase 2: 게임 리더보드

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-10 | 점수 제출 API | CRITICAL | `POST /api/scores`, 점수 범위 검증 + Rate limiting |
| FR-11 | 리더보드 조회 API | CRITICAL | `GET /api/scores/[game]`, Top 10 + 내 순위, Cache API 60초 TTL |
| FR-12 | 점수 범위 검증 | CRITICAL | reaction: 100-2000ms, typing: 0-250WPM, math: 0-120, color-sense: 1-50, color-memory: 1-30 |
| FR-13 | Rate limiting | HIGH | 같은 visitor_id로 60초 이내 중복 제출 차단 |
| FR-14 | 닉네임 검증 | HIGH | 3-12자, 한글/영문/숫자만, 예약어(admin, 관리자 등) 차단 |
| FR-15 | 리더보드 컴포넌트 | CRITICAL | Top 10 표시, 1-3위 강조, 내 순위/최고점 표시, 반응형 |
| FR-16 | 점수 제출 컴포넌트 | HIGH | 닉네임 입력, 등록/건너뛰기 버튼, localStorage에 마지막 닉네임 저장 |
| FR-17 | 게임 히스토리 컴포넌트 | HIGH | 날짜별 그룹핑, 통계(총 횟수, 평균, 최고), 전체 삭제 |
| FR-18 | 결과 패널 래퍼 | HIGH | ScoreSubmit + Leaderboard + GameHistory 통합 래퍼 |
| FR-19 | 기존 게임 통합 | CRITICAL | reaction, color-sense, color-memory, typing, math 결과 화면에 래퍼 적용 |
| FR-20 | 점수 정렬 방향 | HIGH | reaction: ASC (낮을수록 좋음), 나머지: DESC (높을수록 좋음) |

#### Phase 3: 방문자 통계 + 수집 토글

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-30 | 통계 수집 토글 API | CRITICAL | `PUT /api/admin/analytics/config`, KV에 analytics_enabled 저장 |
| FR-31 | 수집 활성화 조회 API | HIGH | `GET /api/analytics/config`, Cache API 60초 TTL |
| FR-32 | 사용량 조회 API | HIGH | `GET /api/admin/analytics/usage`, 오늘 수집 건수/한도 |
| FR-33 | 자동 차단 | HIGH | 일별 사용량이 임계치(기본 90%)에 도달 시 자동으로 수집 중단 |
| FR-34 | 페이지뷰 기록 API | CRITICAL | `POST /api/analytics/pageview`, 토글 확인 후 AE writeDataPoint |
| FR-35 | PageViewTracker | CRITICAL | `navigator.sendBeacon`, pathname 변경 감지, /admin 제외, 토글 연동 |
| FR-36 | 통계 대시보드 API | HIGH | `GET /api/admin/analytics`, 기간별 방문/UV/게임/인기페이지 |
| FR-37 | 통계 대시보드 UI | HIGH | 수집 토글 스위치 + 사용량 게이지 + 지표 카드 + 막대 차트 |
| FR-38 | 자동 차단 알림 | MEDIUM | 자동 차단 시 Admin 대시보드에 배너 표시 |
| FR-39 | IP 익명화 | CRITICAL | IP 원본 저장 금지, SHA-256 해시 + 일별 솔트 |

#### Phase 4: 강화

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-40 | 게임 세션 토큰 | MEDIUM | 게임 시작 시 서버에서 UUID 발급, 점수 제출 시 검증, 1회성 소비 |
| FR-41 | ShareResult 이미지 생성 | MEDIUM | Canvas API로 OG 이미지(1200x630) 생성, 등급/점수 표시 |
| FR-42 | SNS 공유 | MEDIUM | Twitter, 카카오톡, Web Share API |
| FR-43 | Cron Trigger | LOW | 매일 카운터 리셋, 자동 차단 해제, 오래된 세션 삭제 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | Workers CPU 시간 | 요청당 10ms 이내 (무료 플랜) |
| NFR-02 | 리더보드 응답 시간 | Cache HIT: <50ms, Cache MISS: <200ms |
| NFR-03 | D1 쓰기 사용량 | 일 100K 이내 (무료 플랜 한도) |
| NFR-04 | AE 사용량 | 일 100K data points 이내 (토글로 제어) |
| NFR-05 | 개인정보보호법 준수 | IP 미저장, 개인정보처리방침 업데이트 |
| NFR-06 | 접근성 | 리더보드 테이블 WCAG 2.1 AA, 키보드 접근 |
| NFR-07 | 반응형 | 320px~1920px 대응 |
| NFR-08 | 번들 영향 | 차트 라이브러리 미사용 (CSS 기반), dynamic import |

## 4. Technical Specification

### 4.1 D1 스키마

**마이그레이션**: `migrations/0003_create_analytics.sql`

```sql
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  visit_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  score REAL NOT NULL,
  score_type TEXT NOT NULL,
  nickname TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX idx_gs_game_score ON game_scores(game_slug, score);
CREATE INDEX idx_gs_visitor ON game_scores(visitor_id);
CREATE INDEX idx_gs_created ON game_scores(created_at);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_counters (
  date TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
```

### 4.2 wrangler.toml 추가 바인딩

```toml
[[kv_namespaces]]
binding = "SITE_CONFIG"
id = "<kv-namespace-id>"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "needcash_analytics"
```

### 4.3 API 엔드포인트

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/scores` | - | 게임 점수 제출 |
| GET | `/api/scores/[game]` | - | 게임별 리더보드 Top 10 |
| POST | `/api/analytics/pageview` | - | 페이지뷰 기록 (토글 연동) |
| GET | `/api/analytics/config` | - | 수집 활성화 여부 |
| GET | `/api/admin/analytics` | Bearer | 통계 대시보드 데이터 |
| PUT | `/api/admin/analytics/config` | Bearer | 수집 ON/OFF, 임계치 설정 |
| GET | `/api/admin/analytics/usage` | Bearer | 오늘 사용량/한도 |
| POST | `/api/game/session` | - | 게임 세션 토큰 발급 |

### 4.4 점수 정렬 및 검증

| game_slug | score_type | 정렬 | 유효 범위 | 단위 |
|-----------|-----------|------|----------|------|
| reaction | ms_lower | ASC | 100-2000 | ms |
| typing | higher | DESC | 0-250 | WPM |
| math | higher | DESC | 0-120 | 문제 |
| color-sense | higher | DESC | 1-50 | level |
| color-memory | higher | DESC | 1-30 | level |

### 4.5 통계 수집 토글 (KV)

| Key | Value | 설명 |
|-----|-------|------|
| `analytics_enabled` | `"true"` / `"false"` | 수집 ON/OFF |
| `analytics_auto_off` | `"true"` / `"false"` | 자동 차단 여부 |
| `analytics_threshold` | `"90000"` | 자동 차단 임계치 |

카운터는 D1 `analytics_counters` 테이블 사용 (KV 쓰기 1K/일 제한 회피).

### 4.6 파일 구조

```
lib/
  scores.ts            # D1 scores CRUD, 점수 검증, 순위 계산
  analytics.ts         # AE writeDataPoint, SQL API 집계
  game-history.ts      # localStorage 히스토리 CRUD
  anonymous-id.ts      # 익명 ID 생성/관리
  visitor.ts           # HttpOnly 쿠키 관리

app/api/
  scores/
    route.ts           # POST (점수 제출)
  scores/[game]/
    route.ts           # GET (리더보드)
  analytics/
    pageview/route.ts  # POST (페이지뷰 기록)
    config/route.ts    # GET (수집 활성화 조회)
  admin/
    analytics/
      route.ts         # GET (통계 데이터)
      config/route.ts  # PUT (수집 토글)
      usage/route.ts   # GET (사용량)
  game/
    session/route.ts   # POST (세션 토큰)

app/admin/
  analytics/
    page.tsx           # 통계 대시보드 페이지

components/
  game/
    leaderboard.tsx
    score-submit.tsx
    game-history.tsx
    game-result-panel.tsx
  admin/
    analytics-dashboard.tsx
    stat-card.tsx
    chart-bar.tsx
  analytics/
    page-view-tracker.tsx
```

## 5. Security Considerations

| 항목 | 대응 |
|------|------|
| SQL Injection | D1 prepared statements + .bind() 필수 |
| XSS | 닉네임 React 텍스트 렌더링, dangerouslySetInnerHTML 금지 |
| 닉네임 검증 | 서버: 3-12자, `/^[가-힣a-zA-Z0-9_\-]{3,12}$/`, 예약어 차단 |
| 점수 조작 | Level 1: 범위 검증, Level 2: Rate limit, Level 3: 세션 토큰 |
| IP 보호 | 원본 저장 금지, SHA-256(IP + daily_salt) |
| CORS | `needcash.dev` 도메인만 허용 |
| Rate Limiting | visitor_id당 60초 간격, IP당 시간당 30회 |
| 개인정보 | 처리방침 업데이트 (수집항목, 보유기간 명시) |

## 6. Infrastructure Cost

| 규모 | 일 방문자 | 월 비용 | 비고 |
|------|----------|--------|------|
| 소규모 | ~100 | $0 | 무료 플랜 충분 |
| 중규모 | ~1,000 | $0 | 무료 플랜 내 |
| 중규모+ | ~5,000 | $5 | 유료 전환 권장 |
| 대규모 | ~10,000 | $5-10 | 캐싱 필수 |

무료 플랜 한계:
- D1 Writes: 100K/일 (일 25,000 방문자까지)
- AE Data Points: 100K/일 (일 33,000 페이지뷰까지, **토글로 제어**)
- Workers CPU: 10ms/req (AE + Cache API로 1-2ms 유지)

## 7. Implementation Order

| Phase | 작업 | 난이도 | 의존성 |
|-------|------|--------|--------|
| **1: 기반** | | | |
| 1-1 | D1 마이그레이션 (0003_create_analytics.sql) | 낮음 | 없음 |
| 1-2 | wrangler.toml 바인딩 추가 (KV, AE) | 낮음 | 없음 |
| 1-3 | `lib/scores.ts`, `lib/anonymous-id.ts`, `lib/visitor.ts` | 낮음 | 1-1 |
| 1-4 | `lib/game-history.ts` (localStorage) | 낮음 | 없음 |
| 1-5 | `lib/analytics.ts` | 낮음 | 1-2 |
| **2: 리더보드** | | | |
| 2-1 | `POST /api/scores` + 검증 로직 | 중간 | 1-3 |
| 2-2 | `GET /api/scores/[game]` + Cache API | 중간 | 2-1 |
| 2-3 | `leaderboard.tsx`, `score-submit.tsx` | 중간 | 2-2 |
| 2-4 | `game-history.tsx`, `game-result-panel.tsx` | 낮음 | 1-4 |
| 2-5 | 기존 5개 게임 컴포넌트 통합 | 중간 | 2-3, 2-4 |
| **3: 통계 + 수집 토글** | | | |
| 3-1 | 수집 토글 API (`/api/analytics/config`, `/api/admin/analytics/config`) | 낮음 | 1-2 |
| 3-2 | `page-view-tracker.tsx` + `/api/analytics/pageview` (토글 연동) | 중간 | 3-1 |
| 3-3 | 자동 차단 로직 (D1 카운터 + 임계치 확인) | 중간 | 3-2 |
| 3-4 | `/api/admin/analytics` + `/api/admin/analytics/usage` | 중간 | 3-2 |
| 3-5 | Admin 통계 대시보드 UI (토글 + 게이지 + 차트) | 중간 | 3-4 |
| **4: 강화** | | | |
| 4-1 | 게임 세션 토큰 (`/api/game/session`) | 중간 | 2-1 |
| 4-2 | ShareResult 확장 (Canvas 이미지 + SNS) | 중간 | 없음 |
| 4-3 | Cron Trigger (별도 Worker 또는 Admin API) | 높음 | 3-1 |
| 4-4 | 개인정보처리방침 업데이트 | 낮음 | 없음 |

## 8. Risks

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Workers CPU 10ms 초과 | 낮음 | 높음 | AE + Cache API로 1-2ms 유지 |
| AE 무료 100K/일 초과 | 중간 | 중간 | Admin 수집 토글 + 자동 차단(90%) |
| D1 쓰기 100K/일 초과 | 낮음 | 중간 | 통계는 AE로 분리, D1은 리더보드만 |
| KV 무료 쓰기 1K/일 초과 | 높음 | 낮음 | 카운터는 D1 사용, KV는 config 읽기만 |
| 점수 조작 | 높음 | 중간 | 범위 검증 + Rate limit + 세션 토큰 |
| 개인정보보호법 위반 | 낮음 | 높음 | IP 해시 + 일별 솔트, 처리방침 업데이트 |
| @opennextjs/cloudflare Cron 미지원 | 중간 | 중간 | 별도 Cron Worker 또는 Admin API 트리거 |
