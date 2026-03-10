# 백엔드팀 분석 보고서

> 분석일: 2026-03-10

## 1. 아키텍처 개요

### 인프라
- **런타임**: Cloudflare Workers (via @opennextjs/cloudflare)
- **DB**: Cloudflare D1 (SQLite 호환)
- **KV**: Cloudflare KV (설정 저장)
- **AE**: Cloudflare Analytics Engine (페이지뷰 기록)
- **로컬 개발**: better-sqlite3 + in-memory KV

### 환경 분기 패턴

```
USE_LOCAL_DB === "true"  →  better-sqlite3 (local-db.ts)
USE_LOCAL_DB !== "true"  →  Cloudflare D1 (getCloudflareContext())
```

## 2. API 라우트 분석

### 전체 API 목록

| 엔드포인트 | 메서드 | 인증 | 기능 |
|-----------|--------|------|------|
| `/api/posts` | GET | 없음 | 공개 포스트 목록 |
| `/api/posts` | POST | Admin | 포스트 생성 |
| `/api/posts/[slug]` | GET | 없음 | 포스트 상세 |
| `/api/posts/[slug]` | PUT | Admin | 포스트 수정 |
| `/api/posts/[slug]` | DELETE | Admin | 포스트 삭제 |
| `/api/posts/admin` | GET | Admin | 전체 포스트 (draft 포함) |
| `/api/auth/verify` | GET | Admin | 인증 검증 |
| `/api/scores` | POST | 없음 | 점수 제출 (rate limit) |
| `/api/scores/[game]` | GET | 없음 | 리더보드 조회 |
| `/api/analytics/pageview` | POST | 없음 | 페이지뷰 기록 |
| `/api/analytics/config` | GET | 없음 | 통계 설정 조회 |
| `/api/admin/analytics/config` | GET/PUT | Admin | 통계 설정 관리 |
| `/api/admin/analytics/usage` | GET | Admin | 사용량 조회 |
| `/api/admin/scores/[game]` | DELETE | Admin | 점수 삭제 |

### API 패턴 분석

**일관된 패턴:**
- Bearer token 인증 (`verifyAdminAuth()`)
- `Response.json()` 응답 형식
- D1 prepared statements (SQL injection 방지)

**비일관적인 패턴:**
- 에러 처리: `pageview/route.ts`만 try-catch 사용, 나머지는 없음
- 입력 검증: `scores/route.ts`는 체계적, `posts/route.ts`는 최소한
- 응답 헤더: `scores/route.ts`는 수동 Headers 설정, 나머지는 `Response.json()`

## 3. 데이터베이스 계층

### D1 스키마 (migrations/)

```sql
-- 0001: posts 테이블
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  updated_at TEXT,
  category TEXT DEFAULT 'etc',
  tags TEXT DEFAULT '[]',  -- JSON 배열
  published INTEGER DEFAULT 1,
  reading_time INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 0003: analytics 테이블들
CREATE TABLE visitors (id TEXT PRIMARY KEY, ...);
CREATE TABLE game_scores (id INTEGER PRIMARY KEY, visitor_id TEXT, game_slug TEXT, ...);
CREATE TABLE game_sessions (...);
CREATE TABLE analytics_counters (date TEXT PRIMARY KEY, count INTEGER);
```

### 데이터 접근 계층

| 파일 | 역할 | 함수 수 |
|------|------|---------|
| `lib/db.ts` | 블로그 CRUD | 9개 (getAllPosts, getPostBySlug, create, update, delete...) |
| `lib/scores.ts` | 점수 관리 | 3개 (submitScore, getLeaderboard, checkRateLimit) |
| `lib/analytics.ts` | 통계 관리 | 6개 (isEnabled, setEnabled, incrementCounter, checkAutoBlock...) |
| `lib/local-db.ts` | 로컬 D1 래퍼 | LocalD1Database, LocalD1PreparedStatement 클래스 |

### 주요 이슈: getDB() 중복

`getDB()` 함수가 **4곳에 동일한 코드로 중복** 정의:
- `lib/db.ts:58`
- `lib/scores.ts:141`
- `lib/analytics.ts:105`
- `app/api/admin/scores/[game]/route.ts:5` (인라인)

```typescript
// 3곳에서 동일한 코드
function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}
```

**권고**: `lib/env.ts` 같은 공통 모듈로 추출하여 `getDB()`, `getKV()` 를 한 곳에서 관리

## 4. 인증 시스템

### 현재 구현 (`lib/auth.ts`)
- Bearer token 방식 (Authorization 헤더)
- 로컬: `process.env.ADMIN_API_KEY` (기본값 `dev-secret-key`)
- 운영: `wrangler secret` (env.ADMIN_API_KEY)

### 취약점
1. **토큰 복잡도 미검증**: API Key 길이/복잡도에 대한 정책 없음
2. **Rate Limiting 없음**: Admin API에 요청 제한 없음 (brute force 가능)
3. **세션 관리 없음**: 토큰 만료 없음, 회전 없음
4. **감사 로그 없음**: 관리 작업 기록 없음

### 권고
- 현재 1인 운영 프로젝트에서는 적정 수준
- 협업자 추가 시 JWT + 역할 기반 접근 제어 고려
- Admin API에 IP 화이트리스트 또는 rate limit 추가 권장

## 5. 점수 시스템

### 보안 체크포인트
1. **서버 사이드 점수 범위 검증** ✅ (`validateScore()`)
2. **닉네임 정규식 검증** ✅ (`validateNickname()`)
3. **예약어 차단** ✅ (`RESERVED_NAMES`)
4. **Rate Limiting** ✅ (60초 간격)
5. **익명 식별** ✅ (HttpOnly 쿠키 `ncv_id`)

### 잠재적 문제
- `metadata` 필드가 `Record<string, unknown>` 타입으로 JSON.stringify 후 저장 → 크기 제한 없음
- 리더보드 쿼리에서 `ORDER BY score ${order}` → SQL injection은 아니나 (enum값) 패턴 개선 여지

## 6. 통계 시스템

### 구조
```
클라이언트 (sendBeacon) → POST /api/analytics/pageview → D1 카운터 + Analytics Engine
                                                       ↓
                                                  KV 토글 체크 → 자동 차단 (임계치 초과 시)
```

### 자동 차단 메커니즘
- 일일 pageview 카운터가 threshold(기본 90,000) 도달 시 자동 OFF
- KV에 `analytics_auto_off: "true"` 설정
- Admin에서 수동 재활성화 가능

## 7. 로컬 개발 호환성

### LocalD1Database 래퍼
- `prepare()`, `bind()`, `all()`, `first()`, `run()`, `batch()`, `exec()` 지원
- `batch()`는 순차 실행 (D1의 트랜잭션 배치와 다름)
- WAL 모드 + 외래키 활성화
- 마이그레이션 자동 실행 (errors 무시 → 멱등성)

### 제한사항
- KV Mock은 in-memory Map → 프로세스 재시작 시 초기화
- Analytics Engine은 로컬에서 미사용
- `batch()` 트랜잭션 보장 없음 (로컬에서만)

## 8. 개선 권고

### P0 (즉시)
1. **getDB()/getKV() 공통 모듈화**: 4곳 중복 해소 → `lib/env.ts` 생성
2. **API 에러 처리 통일**: 모든 API 라우트에 try-catch + 일관된 에러 응답 형식
3. **`request.json()` 파싱 에러 처리**: 잘못된 JSON 요청 시 unhandled rejection 발생 → try-catch 필수

### P1 (중요)
4. **metadata 필드 크기 제한**: `submitScore()`에서 metadata JSON 크기 검증 추가 (ex: 1KB)
5. **Admin API rate limiting**: Cloudflare Workers의 Rate Limiting 또는 KV 기반 구현
6. **API 입력 검증 강화**: `POST /api/posts`에서 slug 포맷 정규식 검증
7. **Non-null assertion 제거**: `row!.id`, `countRow!.total` 등 → 방어적 null 체크
8. **pageview 엔드포인트 최적화**: 현재 요청당 6회 DB/KV 연산 → threshold 캐싱 등으로 축소

### P2 (권장)
9. **`game_sessions` 테이블 정리**: 스키마는 존재하나 코드에서 미사용 → 삭제 또는 구현
10. **`getAllPostsAdmin`** `SELECT *` → metadata만 조회: 리스트 뷰에서 HTML 불필요
11. **`api/admin/analytics/usage` 중복 라우트 정리**: config GET과 기능 중복
12. **리더보드 N+1 쿼리**: 3개 순차 쿼리 → `Promise.all`로 병렬화 가능 (count + myRank)
13. **DB 마이그레이션 버전 관리**: 현재 에러 무시 방식 → 마이그레이션 테이블로 적용 여부 추적
14. **블로그 목록 API 캐싱**: `GET /api/posts`에 Cache-Control 추가
15. **블로그 목록 API 페이지네이션**: 현재 전체 반환 → offset/limit 지원
