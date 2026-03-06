# Design: admin-dashboard

> 어드민 대시보드 개선 - 로그인/대시보드 분리 및 요약 화면 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  app/admin/
    page.tsx                             # MODIFY - 인증 분기 (로그인 or 대시보드)

  components/admin/
    admin-login.tsx                      # NEW - 로그인 폼 (기존 page.tsx에서 추출)
    dashboard.tsx                        # NEW - 대시보드 메인 (데이터 fetch + 섹션 레이아웃)
    stat-card.tsx                        # EXISTING - 재사용 (변경 없음)
    chart-bar.tsx                        # EXISTING - 재사용 (변경 없음)
    auth-provider.tsx                    # EXISTING - 재사용 (변경 없음)
    admin-nav.tsx                        # EXISTING - 재사용 (변경 없음)
```

### 1.2 의존성 관계

```
[app/admin/page.tsx]
  ├── useAuth() → isAuthenticated 분기
  ├── isAuthenticated === false
  │     └── <AdminLogin />
  │           └── useAuth().login()
  │           └── useRouter().replace("/admin")  ← 로그인 후 대시보드 유지
  └── isAuthenticated === true
        └── <Dashboard />
              ├── useAuth().apiKey
              ├── fetch("/api/posts/admin")          → PostFull[]
              ├── fetch("/api/scores/{game}?limit=1") x 5  → { total }
              ├── <StatCard />  x 4
              └── Link → /admin/blog/new, /admin/blog, /admin/analytics
```

## 2. 컴포넌트 상세 설계

### 2.1 AdminLogin (admin-login.tsx)

기존 `/admin/page.tsx`의 로그인 로직을 그대로 추출. 변경 사항은 로그인 성공 후 리다이렉트 대상만 `/admin/blog` → `/admin`으로 변경 (실제로는 page.tsx가 인증 상태를 감지하여 대시보드를 렌더링).

```typescript
"use client";

interface AdminLoginProps {
  // props 없음 - useAuth() 내부 사용
}

// 내부 상태
// - key: string (입력된 API Key)
// - error: string (에러 메시지)
// - loading: boolean (검증 중)

// 동작
// 1. useAuth().login(key) 호출
// 2. 성공 시 → 리다이렉트 없음 (부모 page.tsx가 isAuthenticated 변경 감지 → Dashboard 렌더)
// 3. 실패 시 → "Invalid API Key" 에러 표시
```

**UI**: 기존과 동일 (중앙 정렬 폼, API Key 입력, Login 버튼)

### 2.2 Dashboard (dashboard.tsx)

대시보드 메인 컴포넌트. mount 시 블로그 + 게임 데이터를 병렬 fetch.

```typescript
"use client";

// 내부 상태
interface DashboardData {
  posts: {
    total: number;
    published: number;
    draft: number;
    recent: PostMeta[];  // 최근 5개
  };
  games: {
    totalPlays: number;
    stats: { game: string; label: string; plays: number }[];
  };
  loading: boolean;
}

// 데이터 fetch 흐름
// useEffect → Promise.all([
//   fetch("/api/posts/admin"),
//   ...RANKABLE_GAMES.map(g => fetch(`/api/scores/${g}?limit=1`))
// ])
```

**섹션 구성** (상→하 순서):

| 순서 | 섹션 | 컴포넌트 | 설명 |
|------|------|----------|------|
| 1 | 요약 카드 | `StatCard` x 4 | 총 포스트, 발행, 초안, 총 플레이 |
| 2 | 빠른 링크 | Link x 3 | 새 글, 블로그 관리, 통계 상세 |
| 3 | 최근 블로그 | 커스텀 리스트 | 최근 5개 (제목, 상태 뱃지, 날짜) |
| 4 | 게임 인기 순위 | `ChartBar` | 게임별 플레이 수 바 차트 |

### 2.3 admin/page.tsx (수정)

```typescript
"use client";

export default function AdminPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <AdminLogin />;
  return <Dashboard />;
}
```

기존 로직 대비 변경:
- `useRouter`, `useEffect` 리다이렉트 제거
- 인증 상태에 따른 단순 분기만 수행

## 3. UI 상세 설계

### 3.1 요약 카드 섹션

```
grid grid-cols-2 gap-4 sm:grid-cols-4

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ 총 포스트    │ │ 발행        │ │ 초안        │ │ 총 플레이    │
│ {total}    │ │ {published}│ │ {draft}    │ │ {plays}    │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

- `StatCard` 컴포넌트 그대로 사용 (label + value)
- `change` prop은 사용하지 않음 (비교 데이터 없음)

### 3.2 빠른 링크 섹션

```
flex flex-wrap gap-3 mt-8

[+ 새 글 작성]      → /admin/blog/new
[블로그 관리]        → /admin/blog
[통계 상세]          → /admin/analytics
```

스타일:
- 첫 번째: `bg-text text-bg` (Primary 강조)
- 나머지: `border border-border` (Secondary)
- 호버: `hover:opacity-90` / `hover:bg-bg-secondary`

### 3.3 최근 블로그 섹션

```
rounded-lg border border-border/60 p-4

최근 블로그                              [더보기 →]
─────────────────────────────────────────
title1         [Published]      2025-03-01
title2         [Draft]          2025-02-28
title3         [Published]      2025-02-25
```

- 제목: `text-sm font-medium`, 클릭 시 `/admin/blog/{slug}/edit`로 이동
- 상태 뱃지: Published = `bg-green-500/10 text-green-400`, Draft = `bg-yellow-500/10 text-yellow-400`
- 날짜: `text-xs text-text-muted`
- "더보기 →": `Link` to `/admin/blog`
- 포스트 0건: "아직 작성된 글이 없습니다." + "새 글 작성" 링크

### 3.4 게임 인기 순위 섹션

```
rounded-lg border border-border/60 p-4

게임 인기 순위                            [더보기 →]
─────────────────────────────────────────
<ChartBar data={gameStats} unit="회" />
```

- `ChartBar` 컴포넌트 재사용
- data: 플레이 수 기준 내림차순 정렬
- "더보기 →": `Link` to `/admin/analytics`
- 전체 플레이 0건: "아직 게임 플레이 기록이 없습니다."

### 3.5 로딩 상태

데이터 로딩 중 스켈레톤 UI:

```
grid grid-cols-2 gap-4 sm:grid-cols-4
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ ████████   │ │ ████████   │ │ ████████   │ │ ████████   │
│ ████       │ │ ████       │ │ ████       │ │ ████       │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

mt-8
████████████████████████████████████  (빠른 링크 자리)

mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2
┌──────────────────┐ ┌──────────────────┐
│ ████████████████ │ │ ████████████████ │
│ ████████████     │ │ ████████████     │
│ ████████████     │ │ ████████████     │
└──────────────────┘ └──────────────────┘
```

스켈레톤: `h-{n} animate-pulse rounded bg-surface-hover/50`

### 3.6 반응형 레이아웃

| 뷰포트 | 요약 카드 | 하단 2칼럼 |
|---------|-----------|------------|
| < 640px (mobile) | 2x2 grid | 1칼럼 (세로 스택) |
| >= 640px (sm) | 4x1 grid | 1칼럼 |
| >= 1024px (lg) | 4x1 grid | 2칼럼 (side-by-side) |

## 4. 데이터 흐름

### 4.1 블로그 데이터

```
GET /api/posts/admin
  Headers: { Authorization: "Bearer {apiKey}" }
  Response: PostFull[]

클라이언트 집계:
  total = posts.length
  published = posts.filter(p => p.published).length
  draft = total - published
  recent = posts.slice(0, 5)  // 이미 date DESC 정렬
```

### 4.2 게임 데이터

```
GET /api/scores/{game}?limit=1   (x 5 games: reaction, color-sense, color-memory, typing, math)
  Response: { leaderboard: [...], myRank: null, total: number }

클라이언트 집계:
  각 게임별 { game, label, plays: total }
  totalPlays = sum(plays)
  정렬: plays DESC
```

### 4.3 게임 라벨 매핑

```typescript
const GAME_LABELS: Record<string, string> = {
  reaction: "Reaction Test",
  "color-sense": "Color Sense",
  "color-memory": "Color Memory",
  typing: "Typing Speed",
  math: "Math Challenge",
};
```

기존 `analytics-dashboard.tsx`의 `GAME_LABELS`와 동일. 중복이지만 별도 상수 파일 추출은 Phase 3에서 고려.

## 5. 구현 순서

### Step 1: AdminLogin 컴포넌트 추출

1. `components/admin/admin-login.tsx` 생성
2. 기존 `app/admin/page.tsx`의 로그인 폼 로직 이동
3. `useAuth()`, `useState`, `useRouter` 유지
4. 로그인 성공 후 `router.replace("/admin")` (대시보드로)

### Step 2: Dashboard 컴포넌트 생성

1. `components/admin/dashboard.tsx` 생성
2. `useAuth()`에서 `apiKey` 획득
3. `useEffect`로 블로그 + 게임 데이터 병렬 fetch
4. 4개 섹션 렌더링 (요약 카드, 빠른 링크, 최근 블로그, 게임 순위)
5. 로딩 스켈레톤 구현

### Step 3: admin/page.tsx 수정

1. 기존 로그인 로직 제거
2. `isAuthenticated` 분기: `<AdminLogin />` or `<Dashboard />`
3. `useRouter`, `useEffect` 리다이렉트 제거

### Step 4: 검증

1. 미인증 → 로그인 폼 표시 확인
2. 인증 → 대시보드 표시 확인 (리다이렉트 없음)
3. 네비 "대시보드" 활성 상태 확인
4. 각 섹션 데이터 정확성 확인
5. 모바일 반응형 확인

## 6. 기존 코드 영향 분석

| 파일 | 변경 유형 | 영향 |
|------|-----------|------|
| `app/admin/page.tsx` | MODIFY (전면 교체) | 로그인 + 대시보드 분기 |
| `app/admin/blog/page.tsx` | 없음 | 기존 동작 유지 |
| `app/admin/analytics/page.tsx` | 없음 | 기존 동작 유지 |
| `components/admin/admin-nav.tsx` | 없음 | "대시보드" 링크가 자연스럽게 동작 |
| `components/admin/auth-provider.tsx` | 없음 | useAuth() 인터페이스 변경 없음 |
| `components/admin/stat-card.tsx` | 없음 | 그대로 재사용 |
| `components/admin/chart-bar.tsx` | 없음 | 그대로 재사용 |

## 7. 에러 처리

| 시나리오 | 처리 |
|----------|------|
| 블로그 API 실패 | 블로그 섹션만 "데이터를 불러올 수 없습니다" 표시, 게임 섹션은 정상 |
| 게임 API 일부 실패 | 실패한 게임은 plays: 0 처리, 나머지 정상 표시 |
| 전체 API 실패 | 스켈레톤 해제 후 "데이터를 불러오는 중 문제가 발생했습니다" + 재시도 버튼 |
| 인증 만료 | fetch 401 → logout() 호출 → 로그인 폼으로 전환 |

## 8. 검증 기준

- [ ] 미인증: `/admin` → 로그인 폼 렌더링
- [ ] 인증: `/admin` → 대시보드 렌더링 (리다이렉트 없음)
- [ ] 로그인 성공 → 대시보드 즉시 표시
- [ ] 요약 카드 4개: 총 포스트, 발행, 초안, 총 플레이 수 정확
- [ ] 빠른 링크 3개: 각각 올바른 경로로 이동
- [ ] 최근 블로그: 최근 5개, 제목 클릭 → 편집 페이지
- [ ] 게임 순위: ChartBar 정상 렌더, 내림차순 정렬
- [ ] 로딩 스켈레톤: 데이터 로딩 중 표시
- [ ] 반응형: mobile(2x2 + 1col), sm(4x1 + 1col), lg(4x1 + 2col)
- [ ] 네비 "대시보드" active 상태 정상
- [ ] API 실패 시 에러 UI 표시 (크래시 없음)
