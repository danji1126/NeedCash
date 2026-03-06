# Analytics & Leaderboard 브레인스토밍 회의록

> 일시: 2026-03-06
> 참석자: Backend Architect, Security Engineer, Frontend Architect, Performance Engineer
> 주제: 방문자 통계, 사용자 접근 히스토리, 게임 순위(리더보드) 기능 설계

---

## 1. 요구사항 정리

| 기능 | 설명 | 대상 사용자 |
|------|------|------------|
| 방문자 통계 | 페이지뷰, UV, 인기 페이지, 일별 추이 | Admin |
| 사용자 접근 히스토리 | 내 게임 기록 조회 | 일반 방문자 |
| 게임 리더보드 | 게임별 Top 10 순위표, 내 순위 | 일반 방문자 |

### 리더보드 대상 게임

| 게임 | 점수 타입 | 정렬 | 단위 | 리더보드 |
|------|-----------|------|------|----------|
| reaction | 반응시간 | ASC (낮을수록 좋음) | ms | O |
| color-sense | 레벨 | DESC | level | O |
| color-memory | 레벨 | DESC | level | O |
| typing | WPM | DESC | WPM | O |
| math | 정답 수 | DESC | 문제 | O |
| dice | 운 기반 | - | - | X |
| lotto | 운 기반 | - | - | X |
| animal-face | AI 분석 | - | - | X |
| quiz | 성격유형 | - | - | X |

---

## 2. 아키텍처 결정 사항

### 2.1 스토리지 전략 (성능 엔지니어 + 백엔드 아키텍트 합의)

| 기능 | 스토리지 | 이유 |
|------|---------|------|
| 방문자 통계 | **Analytics Engine** | 시계열 최적화, CPU 소모 최소 (~0.5ms), 무료 100K/일 |
| 게임 리더보드 | **D1** | ORDER BY/LIMIT 쿼리 필요, 관계형 데이터 |
| 개인 히스토리 | **localStorage** | 계정 없음, 본인만 보는 데이터, DB 부하 제거 |
| 리더보드 캐싱 | **Cache API** | 무료, 60초 TTL로 D1 읽기 99% 감소 |

#### Analytics Engine vs D1 (방문자 통계)

D1에 매 페이지뷰마다 INSERT하면:
- CPU 시간 ~2-3ms/요청 (무료 10ms 한도의 30%)
- 쓰기 100K/일 제한 소모

Analytics Engine `writeDataPoint()`는:
- CPU 시간 ~0.5ms (비동기)
- 무료 100K data points/일
- 내장 시계열 집계

**결론**: 방문자 통계는 Analytics Engine, 리더보드는 D1.

### 2.2 익명 사용자 식별 (보안 엔지니어 + 백엔드 아키텍트 합의)

**선택: HttpOnly 쿠키 (1차) + localStorage anonymousId (보조)**

- 쿠키명: `ncv_id` (needcash visitor id)
- HttpOnly, Secure, SameSite=Lax, Max-Age=1년
- 쿠키 없으면 `crypto.randomUUID()` 신규 발급
- localStorage에도 동일 ID 저장 (쿠키 삭제 시 복구용)

**거부된 방안:**
- ~~Browser fingerprinting~~ - 한국 개인정보보호법상 "고유식별정보" 해당 가능, 리스크 높음
- ~~IP 기반~~ - GDPR 이슈, 동적 IP 변동으로 정확도 낮음

### 2.3 통계 수집 토글 (Admin 제어)

Admin이 방문자 통계 수집을 ON/OFF할 수 있는 기능. 무료 플랜 한도 초과를 방지하기 위한 안전장치.

**저장소**: Cloudflare KV (`SITE_CONFIG` 바인딩)

```
Key: "analytics_enabled"
Value: "true" | "false"
Default: "true"
```

**동작 흐름**:
```
PageViewTracker (클라이언트)
  └─ GET /api/analytics/config → { analyticsEnabled: true/false }
      ├─ true  → sendBeacon으로 페이지뷰 전송
      └─ false → 수집 중단 (sendBeacon 호출하지 않음)

POST /api/analytics/pageview (서버)
  └─ KV에서 analytics_enabled 확인
      ├─ true  → Analytics Engine writeDataPoint() 실행
      └─ false → 204 반환 (기록하지 않음, CPU 절약)
```

**Admin UI (`/admin/analytics`)**:
```
+----------------------------------------------+
|  통계 수집: [ON] / OFF                        |
|  상태: 수집 중 (오늘 2,341 / 100,000)         |
|  무료 한도: ████████░░ 78% 사용               |
+----------------------------------------------+
```

**자동 차단 (선택적 확장)**:

일별 사용량이 임계치(90%)에 도달하면 자동으로 수집을 중단하는 옵션.

```
Admin 설정:
  - 수동 ON/OFF 토글
  - 자동 차단 임계치: [90]% (0 = 비활성)
  - 자동 차단 시 알림: Admin 대시보드에 배너 표시
```

서버 측 구현:
```
POST /api/analytics/pageview
  1. KV에서 analytics_enabled 확인 → false면 즉시 204
  2. KV에서 today_count 확인 (INCR 패턴)
  3. today_count >= threshold(90,000)이면:
     - KV analytics_enabled = "false" 설정
     - 204 반환
  4. Analytics Engine writeDataPoint() 실행
  5. KV today_count + 1
```

일별 카운터 리셋:
```
Cron Trigger (매일 UTC 00:00):
  - KV "today_count" = "0"
  - KV "analytics_enabled" = "true" (자동 차단 해제, Admin 수동 OFF가 아닌 경우)
```

**KV 키 구조**:

| Key | Value | 설명 |
|-----|-------|------|
| `analytics_enabled` | `"true"` / `"false"` | 수집 ON/OFF |
| `analytics_auto_off` | `"true"` / `"false"` | 자동 차단으로 OFF된 경우 |
| `analytics_threshold` | `"90000"` | 자동 차단 임계치 (0 = 비활성) |
| `analytics_today_count` | `"2341"` | 오늘 수집된 data points |

**API 엔드포인트 추가**:

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/analytics/config` | - | 수집 활성화 여부 (클라이언트 확인용) |
| PUT | `/api/admin/analytics/config` | Bearer | 수집 ON/OFF 토글, 임계치 설정 |
| GET | `/api/admin/analytics/usage` | Bearer | 오늘 사용량/한도 조회 |

**wrangler.toml 추가 필요**:
```toml
[[kv_namespaces]]
binding = "SITE_CONFIG"
id = "<kv-namespace-id>"
```

**비용 영향**:
- KV 무료 플랜: 읽기 100K/일, 쓰기 1K/일
- config 읽기: 페이지뷰당 1회 → 캐싱으로 최소화 (Cache API 60초 TTL)
- today_count 쓰기: 페이지뷰당 1회 → 무료 1K/일 초과 가능
- **대안**: today_count를 D1에 저장하면 KV 쓰기 제한 회피 가능

**KV 쓰기 제한 대응 (today_count)**:

KV 무료 쓰기 1K/일이므로, 매 페이지뷰마다 KV INCR은 한도를 빠르게 소모함.

대안 1: D1에 카운터 테이블 사용
```sql
CREATE TABLE IF NOT EXISTS analytics_counters (
  date TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
-- UPDATE analytics_counters SET count = count + 1 WHERE date = ?
```

대안 2: 클라이언트에서 config만 확인, 카운터는 서버에서 AE 쿼리로 확인
```
Admin 대시보드 접속 시:
  GET /api/admin/analytics/usage
  → Analytics Engine SQL API로 오늘 data points 수 조회
  → 임계치 초과 시 Admin에게 경고 표시
```

**권장 조합**: config ON/OFF는 KV (읽기 중심), 사용량 카운터는 D1 또는 AE SQL API (Admin 접속 시에만 조회)

### 2.4 점수 조작 방지 (보안 엔지니어 주도)

모든 게임이 클라이언트 사이드이므로 완벽한 방지는 불가능. 비용 대비 효과가 높은 3단계 방어:

**Level 1 - 점수 범위 검증 (필수)**
```
reaction:     100-2000 ms
typing:       0-250 WPM
math:         0-120 문제
color-sense:  1-50 level
color-memory: 1-30 level
```

**Level 2 - Rate Limiting (필수)**
- 같은 visitor_id로 60초 이내 중복 제출 차단
- IP당 시간당 최대 30회 제출

**Level 3 - 게임 세션 토큰 (권장)**
- 게임 시작 시 서버에서 세션 UUID 발급
- 점수 제출 시 세션 검증 + 경과 시간 확인
- 1회성 소비 (재사용 불가)

---

## 3. D1 스키마 설계

### 마이그레이션: `0003_create_analytics.sql`

```sql
-- 익명 방문자
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  visit_count INTEGER NOT NULL DEFAULT 1
);

-- 게임 점수 (리더보드)
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  score REAL NOT NULL,
  score_type TEXT NOT NULL,       -- 'ms_lower' | 'higher'
  nickname TEXT,                   -- 선택적 (3-12자)
  metadata TEXT,                   -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX idx_gs_game_score ON game_scores(game_slug, score);
CREATE INDEX idx_gs_visitor ON game_scores(visitor_id);
CREATE INDEX idx_gs_created ON game_scores(created_at);

-- 일별 통계 집계 (Cron 배치)
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  path TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  UNIQUE(date, path)
);

-- 게임 세션 (조작 방지)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### score_type 매핑

| game_slug | score_type | 정렬 |
|-----------|-----------|------|
| reaction | `ms_lower` | ASC |
| typing | `higher` | DESC |
| math | `higher` | DESC |
| color-sense | `higher` | DESC |
| color-memory | `higher` | DESC |

---

## 4. API 설계

### 엔드포인트 목록

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/scores` | - | 게임 점수 제출 |
| GET | `/api/scores/[game]` | - | 게임별 리더보드 Top 10 |
| GET | `/api/scores/[game]/my` | Cookie | 내 최고 기록 |
| POST | `/api/analytics/pageview` | - | 페이지뷰 기록 (AE, 토글 연동) |
| GET | `/api/analytics/config` | - | 수집 활성화 여부 조회 |
| GET | `/api/admin/analytics` | Bearer | 통계 대시보드 데이터 |
| PUT | `/api/admin/analytics/config` | Bearer | 수집 ON/OFF 토글, 임계치 설정 |
| GET | `/api/admin/analytics/usage` | Bearer | 오늘 AE 사용량/한도 조회 |
| POST | `/api/game/session` | - | 게임 세션 토큰 발급 |

### 주요 응답 형태

**GET `/api/scores/reaction?limit=10&me={anonId}`**
```json
{
  "leaderboard": [
    { "rank": 1, "nickname": "speedster", "score": 142, "createdAt": "..." }
  ],
  "myRank": { "rank": 37, "score": 234 },
  "total": 1523
}
```

**GET `/api/admin/analytics?period=30d`**
```json
{
  "summary": { "totalViews": 12453, "uniqueVisitors": 8721, "totalGamesPlayed": 5234 },
  "topPages": [{ "path": "/game/reaction", "views": 2341 }],
  "gameStats": [{ "game": "reaction", "plays": 1523, "avgScore": 234 }],
  "dailyViews": [{ "date": "2026-03-01", "views": 423 }]
}
```

---

## 5. 프론트엔드 컴포넌트 설계

### 파일 구조

```
components/
  game/
    leaderboard.tsx        # 게임 내 Top 10 리더보드
    score-submit.tsx       # 닉네임 입력 + 점수 제출 폼
    game-history.tsx       # localStorage 개인 히스토리 패널
    game-result-panel.tsx  # 결과 화면 공통 래퍼
    share-result.tsx       # (확장) SNS 공유 + 이미지 생성
  admin/
    analytics-dashboard.tsx  # 통계 대시보드
    stat-card.tsx            # 숫자 지표 카드
    chart-bar.tsx            # CSS 기반 막대 차트
  analytics/
    page-view-tracker.tsx    # sendBeacon 기반 페이지뷰 수집

lib/
  scores.ts          # D1 scores CRUD
  analytics.ts       # Analytics Engine 집계 함수
  game-history.ts    # localStorage 히스토리 관리
  anonymous-id.ts    # 익명 ID 생성/관리
```

### 게임 컴포넌트 통합 패턴

기존 게임 결과 화면에 `GameResultPanel` 래퍼를 추가:

```
[기존 결과 UI: 등급, 점수, 상세]
       |
[ScoreSubmit] - 닉네임 입력, 리더보드 등록 (opt-in)
       |
[ShareResult] - 텍스트 복사 + 이미지 생성 + SNS 공유
       |
[Leaderboard] - Top 10 순위표 + 내 순위
       |
[GameHistory] - localStorage 기반 개인 기록
```

### 리더보드 UI 와이어프레임

```
+------------------------------------+
|  Top 10 Leaderboard                |
+------------------------------------+
|  #1  speedster         142ms       |
|  #2  flash             155ms       |
|  #3  thunder           168ms       |
|  ...                               |
|  #10 slowpoke          245ms       |
+------------------------------------+
|  내 순위: #37 / 1,523명            |
|  내 최고: 234ms                    |
+------------------------------------+
```

### Admin 통계 대시보드 와이어프레임

```
+-------------------------------------------+
|  기간: [7일] [30일] [90일]                 |
|                                           |
|  +-------+ +-------+ +-------+ +-------+ |
|  |12,453 | | 8,721 | | 5,234 | |  2.3  | |
|  |방문   | |순방문 | |게임   | |페이지 | |
|  |+12%   | |+8%    | |+23%   | |-5%    | |
|  +-------+ +-------+ +-------+ +-------+ |
|                                           |
|  일별 방문자 추이 (CSS 막대 차트)          |
|  인기 페이지 Top 10                       |
|  게임별 플레이 통계                        |
+-------------------------------------------+
```

### 페이지뷰 수집 방식

`navigator.sendBeacon` + Analytics Engine:
- 루트 레이아웃에 `<PageViewTracker />` 추가
- pathname 변경 시 비동기 전송
- 서버 부담 최소, 봇 트래픽 자연 필터링
- /admin 페이지 제외

---

## 6. 보안 체크리스트

### 필수 (구현 전 반드시)

- [ ] 점수 범위 서버 검증 (game별 min/max)
- [ ] 닉네임 입력 검증 (3-12자, 한글/영문/숫자만, 예약어 차단)
- [ ] Rate limiting (Cloudflare Rules 또는 D1 기반)
- [ ] 개인정보처리방침 업데이트 (수집항목, 보유기간 명시)
- [ ] IP 원본 저장 금지 (해시 + 일별 솔트 사용)
- [ ] CORS 헤더 설정 (`needcash.dev`만 허용)
- [ ] D1 prepared statements 필수 (SQL injection 방지)

### 권장 (Phase 2에서)

- [ ] 게임 세션 토큰 (시작-종료 시간 검증)
- [ ] Admin 인증 폴백 `"dev-secret-key"` 제거
- [ ] CSP 헤더 설정
- [ ] 통계적 이상 탐지 (비정상 점수 패턴)

### 데이터 보존 정책

| 데이터 | 원본 보존 | 집계 보존 |
|--------|----------|----------|
| 방문 통계 (AE) | AE 내부 관리 | 무기한 |
| 리더보드 | 게임당 1,000건 | - |
| 게임 세션 | 1시간 | - |
| Rate limit | 1시간 | - |

---

## 7. Cloudflare 인프라 비용 추정

| 규모 | 일 방문자 | 월 비용 | D1 Writes 사용률 |
|------|----------|--------|-----------------|
| 소규모 | ~100 | **$0** | 0.4% |
| 중규모 | ~1,000 | **$0** | 4% |
| 중규모+ | ~5,000 | **$5** | 유료 전환 권장 |
| 대규모 | ~10,000 | **$5-10** | 캐싱 필수 |

### 무료 플랜 한계 도달 임계점

- D1 Writes (100K/일): 일 방문자 ~25,000명
- AE Data Points (100K/일): 일 페이지뷰 ~33,000회
- Workers CPU (10ms/req): AE + Cache API 조합으로 1-2ms 유지 가능

---

## 8. 구현 우선순위 (합의)

| Phase | 작업 | 난이도 | 의존성 |
|-------|------|--------|--------|
| **Phase 1: 기반** | | | |
| 1-1 | D1 마이그레이션 (테이블 생성) | 낮음 | 없음 |
| 1-2 | `lib/scores.ts`, `lib/anonymous-id.ts` | 낮음 | 1-1 |
| 1-3 | `lib/game-history.ts` (localStorage) | 낮음 | 없음 |
| **Phase 2: 리더보드** | | | |
| 2-1 | `POST /api/scores` + 검증 로직 | 중간 | 1-2 |
| 2-2 | `GET /api/scores/[game]` (리더보드 API) | 중간 | 2-1 |
| 2-3 | `Leaderboard`, `ScoreSubmit` 컴포넌트 | 중간 | 2-2 |
| 2-4 | `GameHistory` 컴포넌트 | 낮음 | 1-3 |
| 2-5 | 기존 게임 컴포넌트 통합 | 중간 | 2-3, 2-4 |
| **Phase 3: 통계** | | | |
| 3-1 | KV 바인딩 (`SITE_CONFIG`) + 수집 토글 API | 낮음 | 없음 |
| 3-2 | Analytics Engine 바인딩 + `PageViewTracker` (토글 연동) | 중간 | 3-1 |
| 3-3 | `/api/admin/analytics` API + 사용량 조회 | 중간 | 3-2 |
| 3-4 | Admin 통계 대시보드 UI (수집 토글 + 사용량 게이지 포함) | 중간 | 3-3 |
| **Phase 4: 강화** | | | |
| 4-1 | 게임 세션 토큰 (조작 방지) | 중간 | 2-1 |
| 4-2 | ShareResult 확장 (이미지 + SNS) | 중간 | 없음 |
| 4-3 | Cron Trigger (데이터 정리) | 높음 | 3-1 |

---

## 9. 기술적 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Workers CPU 10ms 초과 | 요청 실패 | AE + Cache API로 CPU 1-2ms 유지 |
| D1 쓰기 100K/일 초과 | 쓰기 실패 | 방문 통계를 AE로 분리, D1은 리더보드만 |
| AE 무료 100K/일 초과 | 통계 유실 | **Admin 수집 토글 + 자동 차단 임계치(90%)** |
| KV 무료 쓰기 1K/일 초과 | 카운터 실패 | 카운터는 D1 또는 AE SQL API로 대체 |
| 점수 조작 | 리더보드 신뢰도 하락 | 범위 검증 + Rate limit + 세션 토큰 |
| 개인정보보호법 위반 | 법적 리스크 | IP 해시 + 일별 솔트, 방침 업데이트 |
| @opennextjs/cloudflare Cron 미지원 | 배치 집계 불가 | 별도 Cron Worker 또는 Admin API 트리거 |

---

## 10. 회의 결론

1. **방문자 통계는 Analytics Engine**, **리더보드는 D1**, **개인 히스토리는 localStorage** - 각 기능에 최적화된 스토리지 사용
2. **무료 플랜에서 시작** 가능 (일 10,000 방문자까지 충분)
3. **Admin 수집 토글**: 방문자 통계 수집을 ON/OFF할 수 있는 기능 추가. 무료 플랜 한도(AE 100K/일) 초과 방지를 위해 자동 차단 임계치(기본 90%) 설정 가능. KV에 config 저장, 카운터는 D1 또는 AE SQL API 활용
4. **점수 조작 방지**는 범위 검증 + Rate limiting을 필수로, 게임 세션 토큰을 Phase 2에서 도입
5. **개인정보보호법 준수**를 위해 IP 원본 저장 금지, 개인정보처리방침 업데이트 필수
6. **Phase 1(기반) -> Phase 2(리더보드) -> Phase 3(통계+수집토글) -> Phase 4(강화)** 순서로 점진적 구현
