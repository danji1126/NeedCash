# Plan: admin-dashboard

> 어드민 대시보드 개선 - 로그인/대시보드 분리 및 요약 화면 구성

## 1. Overview

### Purpose
현재 `/admin` 페이지는 로그인 전용이며, 인증 후 `/admin/blog`로 리다이렉트된다. 네비게이션에 "대시보드" 링크가 있지만 실제 대시보드가 없어 블로그 관리와 동일하게 느껴지는 문제를 해결한다. 인증 후 사이트 전체 현황을 한눈에 파악할 수 있는 대시보드를 구성한다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4)
- 인프라: Cloudflare Workers + D1 + KV
- 어드민 인증: Bearer token (ADMIN_API_KEY)
- 현재 어드민 페이지: `/admin` (로그인), `/admin/blog` (포스트 CRUD), `/admin/analytics` (게임 통계)
- 기존 컴포넌트: `stat-card.tsx`, `chart-bar.tsx` 재활용 가능

### Current State Analysis

| 경로 | 현재 역할 | 문제점 |
|------|-----------|--------|
| `/admin` (page.tsx) | 로그인 폼 → 인증 후 `/admin/blog` 리다이렉트 | 대시보드 역할 없음 |
| `/admin/blog` (page.tsx) | 블로그 포스트 목록, 필터, 삭제, 발행 토글 | 정상 |
| `/admin/analytics` (page.tsx) | 게임 통계 + 리더보드 관리 | 정상 |
| `admin-nav.tsx` | 대시보드/블로그/통계 네비게이션 | "대시보드" 클릭 시 로그인 페이지로 이동 |

### Decisions
- `/admin/page.tsx` 하나에서 인증 상태에 따라 로그인/대시보드를 분기 (별도 경로 불필요)
- 대시보드 데이터는 기존 API 재활용 (`/api/posts/admin`, `/api/scores/*`)
- 기존 `stat-card.tsx`, `chart-bar.tsx` 컴포넌트 재사용
- 대시보드 전용 API 엔드포인트는 Phase 1에서는 만들지 않음 (클라이언트 집계)

## 2. Scope

### In Scope

**Phase 1: 로그인/대시보드 분리**
- `/admin/page.tsx` 수정: 인증 전 → 로그인 폼, 인증 후 → 대시보드 렌더링
- `components/admin/admin-login.tsx`: 기존 로그인 폼을 별도 컴포넌트로 분리
- `components/admin/dashboard.tsx`: 대시보드 메인 컴포넌트 (데이터 fetch + 레이아웃)

**Phase 2: 대시보드 섹션 구성**
- 상단 요약 카드: 총 포스트 수, 발행/초안 수, 총 게임 플레이 수
- 빠른 링크: 새 글 작성, 블로그 관리, 통계 상세
- 최근 블로그: 최근 포스트 3~5개 (제목, 상태, 날짜)
- 게임 요약: 게임별 플레이 수 상위 3개

**Phase 3: 리팩터링 (선택)**
- 대시보드 전용 집계 API 추가 (단일 요청으로 모든 데이터 조회)
- 최근 활동 피드 (점수 제출, 글 수정 등 시간순 통합)

### Out of Scope
- 방문자 통계 차트 (이미 `/admin/analytics`에 존재)
- 리더보드 관리 (이미 `/admin/analytics`에 존재)
- 사용자 계정/권한 시스템
- 실시간 데이터 업데이트 (WebSocket 등)

## 3. Technical Design

### 3.1 Page Structure

```
/admin/page.tsx
  ├── isAuthenticated === false → <AdminLogin />
  └── isAuthenticated === true  → <Dashboard />

/admin/blog/page.tsx          (변경 없음)
/admin/analytics/page.tsx     (변경 없음)
```

### 3.2 Component Structure

```
components/admin/
  ├── admin-login.tsx           (NEW - 로그인 폼 분리)
  ├── dashboard.tsx             (NEW - 대시보드 메인)
  ├── stat-card.tsx             (EXISTING - 재사용)
  ├── chart-bar.tsx             (EXISTING - 재사용)
  ├── admin-nav.tsx             (EXISTING - 변경 없음)
  ├── auth-provider.tsx         (EXISTING - 변경 없음)
  └── ...
```

### 3.3 Dashboard Data Flow

```
Dashboard mount
  ├── fetch("/api/posts/admin")          → 블로그 요약 데이터
  │     headers: { Authorization: Bearer ${apiKey} }
  │     response: PostFull[]
  │     계산: total, published, draft, recent 3
  │
  └── fetch("/api/scores/{game}?limit=1") x 5 games  → 게임 요약 데이터
        response: { total, scores }
        계산: totalPlays, top 3 games
```

### 3.4 Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│  NeedCash Admin      [대시보드] [블로그] [통계]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Summary Cards (grid 2x2 → sm:4x1)             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ 총 포스트 │ │  발행   │ │  초안   │ │총 플레이│  │
│  │   12    │ │   8    │ │   4    │ │  342   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                 │
│  Quick Links                                    │
│  [+ 새 글 작성]  [블로그 관리]  [통계 상세]        │
│                                                 │
│  ┌── 최근 블로그 ──────┐ ┌── 게임 인기 순위 ───┐  │
│  │ title1  Published  │ │ 1. reaction  142회  │  │
│  │ title2  Draft      │ │ 2. typing    98회   │  │
│  │ title3  Published  │ │ 3. math      55회   │  │
│  │        [더보기 →]   │ │       [더보기 →]    │  │
│  └────────────────────┘ └────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 4. Implementation Tasks

### Phase 1: 로그인/대시보드 분리

| # | Task | File | Description |
|---|------|------|-------------|
| 1.1 | 로그인 폼 컴포넌트 분리 | `components/admin/admin-login.tsx` | 기존 `/admin/page.tsx`의 로그인 로직을 독립 컴포넌트로 추출 |
| 1.2 | 대시보드 컴포넌트 생성 | `components/admin/dashboard.tsx` | 대시보드 메인 컴포넌트 (데이터 fetch, 레이아웃 구성) |
| 1.3 | admin page 수정 | `app/admin/page.tsx` | 인증 상태 분기: `<AdminLogin />` or `<Dashboard />` |

### Phase 2: 대시보드 섹션 구현

| # | Task | Description |
|---|------|-------------|
| 2.1 | 요약 카드 섹션 | `StatCard` 재사용, 블로그/게임 집계 표시 |
| 2.2 | 빠른 링크 섹션 | 새 글 작성, 블로그 관리, 통계 상세 바로가기 |
| 2.3 | 최근 블로그 섹션 | 최근 3~5개 포스트 (제목, 발행 상태, 날짜) |
| 2.4 | 게임 요약 섹션 | 플레이 수 기준 상위 3개 게임 |

### Phase 3: 선택적 개선

| # | Task | Description |
|---|------|-------------|
| 3.1 | 대시보드 집계 API | `GET /api/admin/dashboard` - 단일 요청으로 모든 요약 데이터 반환 |
| 3.2 | 최근 활동 피드 | 점수 제출 + 글 수정 등 시간순 통합 피드 |
| 3.3 | 환영 메시지 | 시간대별 인사말 + 마지막 접속 시간 표시 |

## 5. Dependencies

### Existing APIs (재활용)
- `GET /api/posts/admin` - 전체 포스트 목록 (인증 필요)
- `GET /api/scores/{game}?limit=1` - 게임별 총 플레이 수

### Existing Components (재사용)
- `components/admin/stat-card.tsx` - 숫자 요약 카드
- `components/admin/chart-bar.tsx` - 바 차트 (필요시)
- `components/admin/auth-provider.tsx` - 인증 컨텍스트

### No New Infrastructure
- 추가 D1 테이블 없음
- 추가 KV 네임스페이스 없음
- 추가 wrangler 설정 없음

## 6. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 대시보드 로딩 시 다중 API 호출 지연 | 느린 초기 로딩 | `Promise.all`로 병렬 fetch, 로딩 스켈레톤 표시 |
| 기존 로그인 플로우 깨짐 | 어드민 접근 불가 | 로그인 컴포넌트 분리 시 기존 로직 100% 보존 |
| 네비게이션 active 상태 오작동 | UX 혼란 | `admin-nav.tsx`의 pathname 매칭 로직 확인 |

## 7. Validation Criteria

- [ ] 미인증 상태에서 `/admin` 접근 시 로그인 폼 표시
- [ ] 인증 후 `/admin`에서 대시보드 표시 (블로그로 리다이렉트 안 됨)
- [ ] 대시보드에 블로그 요약 (총/발행/초안 수) 정확히 표시
- [ ] 대시보드에 게임 요약 (총 플레이 수, 상위 게임) 표시
- [ ] 빠른 링크로 각 관리 페이지 이동 정상 작동
- [ ] 네비게이션 "대시보드" 선택 시 active 상태 정상
- [ ] 모바일 반응형 레이아웃 정상
- [ ] 로딩 중 스켈레톤 UI 표시
