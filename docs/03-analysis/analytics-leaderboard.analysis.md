# Analysis: analytics-leaderboard

> Design vs Implementation Gap Analysis

---

## 1. Summary

| Metric | Value |
|--------|-------|
| 총 검증 항목 | 78 |
| 일치 | 56 |
| 부분 일치 | 10 |
| 미구현 | 12 |
| **Match Rate** | **71.8%** |

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 🔄 71.8%
```

---

## 2. Phase별 달성률

| Phase | 상태 | 달성률 | 비고 |
|-------|------|--------|------|
| Phase 1: 인프라 | ✅ 완료 | 100% | D1 스키마, lib 모듈, 바인딩 설정 모두 일치 |
| Phase 2: 리더보드 | ✅ 완료 | 95% | API, 컴포넌트, 5개 게임 통합 완료. 일부 UI 디테일 차이 |
| Phase 3: 통계 + 토글 | 🔄 부분 완료 | 65% | 토글/카운터/페이지뷰 완료. 대시보드 데이터 API, AE 연동 미완 |
| Phase 4: 강화 | ❌ 미구현 | 0% | 세션 토큰, 이미지 공유, SNS, Cron 전부 미구현 |

---

## 3. 일치 항목 (56건)

### D1 스키마 (Section 2)
- visitors, game_scores, game_sessions, analytics_counters 테이블 — 정확히 일치
- idx_gs_game_score, idx_gs_visitor, idx_gs_created 인덱스 — 일치

### lib 모듈 (Section 3)
- `anonymous-id.ts` — 정확히 일치
- `visitor.ts` — 정확히 일치
- `score-validation.ts` — RankableGame, SCORE_ORDER, SCORE_UNIT, SCORE_RANGES, validateScore, validateNickname, getScoreType, isRankableGame 모두 일치
- `game-history.ts` — 정확히 일치
- `scores.ts` — submitScore, getLeaderboard, checkRateLimit, getDB 모두 일치

### API (Section 4)
- POST /api/scores — 전체 검증 체인 일치
- GET /api/scores/[game] — 일치 (Cache-Control 방식 차이만 존재)
- POST /api/analytics/pageview — 토글 확인 → 카운터 → 자동차단 → AE 기록 흐름 일치
- GET /api/analytics/config — `{enabled}` + Cache-Control 일치
- PUT /api/admin/analytics/config — 인증 → KV 업데이트 일치
- GET /api/admin/analytics/usage — 인증 → getUsage 일치

### 컴포넌트 (Section 5)
- score-submit.tsx — Props, State, 검증 흐름, UI 일치
- leaderboard.tsx — 핵심 기능 일치 (메달, myRank, 스켈레톤, 빈 상태)
- game-result-panel.tsx — ScoreSubmit + Leaderboard + GameHistoryPanel + ShareResult 통합 일치
- page-view-tracker.tsx — 정확히 일치
- analytics-toggle.tsx — 토글 스위치, 사용량 게이지, 자동차단 배너 일치
- stat-card.tsx, chart-bar.tsx — Props와 UI 일치
- 5개 게임 통합 (reaction, color-sense, color-memory, typing, math) — 모두 완료

### 설정
- wrangler.toml — KV + AE 바인딩 추가 완료
- cloudflare-env.d.ts — SITE_CONFIG, ANALYTICS 타입 추가 완료
- app/layout.tsx — PageViewTracker 추가 완료

---

## 4. 부분 일치 항목 (10건)

| # | 항목 | Design | Implementation | Gap |
|---|------|--------|---------------|-----|
| P1 | 히스토리 컴포넌트 파일명 | `game-history.tsx` | `game-history-panel.tsx` | 네이밍 차이 (기능 동일) |
| P2 | Leaderboard 반응형 | 모바일: 8자 truncate, 데스크톱: 풀 닉네임 + 날짜 | 단일 `truncate` 클래스, 날짜 미표시 | 반응형 분기 없음 |
| P3 | Leaderboard 애니메이션 | `staggerChildren: 0.05` | 개별 `delay: i * 0.05` | 시각적 결과 동일, API 방식 차이 |
| P4 | 히스토리 날짜 그룹 | "오늘", "어제", "이번 주", "이전" | "오늘", "어제", 날짜 문자열 | "이번 주" 그룹 누락 |
| P5 | analytics.ts getUsage | `{ today, threshold }` 반환 | `{ today, threshold, enabled, autoOff }` 반환 | 추가 필드 (개선) |
| P6 | GET /api/scores/[game] 캐싱 | Cache API (`caches.default`) 명시적 사용 | `Cache-Control` 헤더만 사용 | CDN 캐싱으로 기능적 동등, 아키텍처 차이 |
| P7 | admin analytics config | PUT만 명시 | GET + PUT 구현 | GET 핸들러 추가 (개선) |
| P8 | AnalyticsDashboard 데이터 | `GET /api/admin/analytics?period=30d` | 게임별 `/api/scores/{game}` 개별 호출 | 간소화된 접근 |
| P9 | 대시보드 UI | 기간 선택기, 일별 뷰 차트, 인기 페이지 차트 | 게임별 플레이 수 차트만 존재 | 기능 축소 |
| P10 | setAnalyticsEnabled/setThreshold | 미명시 | 별도 헬퍼 함수로 구현 | 추가 구현 (개선) |

---

## 5. 미구현 항목 (12건)

| # | 항목 | Design 섹션 | Plan FR | 심각도 |
|---|------|------------|---------|--------|
| M1 | `GET /api/admin/analytics` 라우트 | 4.7 | FR-36 | HIGH |
| M2 | Analytics Engine SQL API 쿼리 | 4.7 | FR-36 | HIGH |
| M3 | 대시보드 기간 선택기 (`[7d] [30d] [90d]`) | 5.10 | FR-37 | MEDIUM |
| M4 | 대시보드 일별 방문자 차트 | 5.10 | FR-37 | MEDIUM |
| M5 | 대시보드 인기 페이지 차트 | 5.10 | FR-37 | MEDIUM |
| M6 | IP 익명화 (SHA-256 + daily salt) | 보안 | FR-39 | HIGH |
| M7 | CORS 제한 (needcash.dev만) | 보안 | - | MEDIUM |
| M8 | IP 기반 rate limiting (시간당 30회) | 보안 | - | MEDIUM |
| M9 | 게임 세션 토큰 API | Phase 4 | FR-40 | LOW (Phase 4) |
| M10 | ShareResult Canvas 이미지 생성 | Phase 4 | FR-41 | LOW (Phase 4) |
| M11 | SNS 공유 확장 (Twitter, KakaoTalk) | Phase 4 | FR-42 | LOW (Phase 4) |
| M12 | Cron Trigger (카운터 리셋, 세션 정리) | Phase 4 | FR-43 | LOW (Phase 4) |

---

## 6. Plan FR 이행 현황

### Phase 1: Foundation (FR-01 ~ FR-07) — 100%

| FR | 설명 | 상태 |
|----|------|------|
| FR-01 | D1 마이그레이션 | ✅ |
| FR-02 | KV namespace (SITE_CONFIG) | ✅ |
| FR-03 | Analytics Engine 바인딩 | ✅ |
| FR-04 | 익명 ID (쿠키 + localStorage) | ✅ |
| FR-05 | 방문자 쿠키 관리 | ✅ |
| FR-06 | 게임 히스토리 유틸 | ✅ |
| FR-07 | 점수 CRUD 함수 | ✅ |

### Phase 2: Leaderboard (FR-10 ~ FR-20) — 90%

| FR | 설명 | 상태 |
|----|------|------|
| FR-10 | 점수 제출 API | ✅ |
| FR-11 | 리더보드 API | ✅ |
| FR-12 | 점수 범위 검증 | ✅ |
| FR-13 | Rate limiting (60초) | ✅ |
| FR-14 | 닉네임 검증 | ✅ |
| FR-15 | 리더보드 컴포넌트 | 🔄 반응형 디테일 부족 |
| FR-16 | 점수 제출 컴포넌트 | ✅ |
| FR-17 | 히스토리 컴포넌트 | 🔄 "이번 주" 그룹 누락 |
| FR-18 | 결과 패널 래퍼 | ✅ |
| FR-19 | 5개 게임 통합 | ✅ |
| FR-20 | 정렬 방향 (ASC/DESC) | ✅ |

### Phase 3: Stats + Toggle (FR-30 ~ FR-39) — 70%

| FR | 설명 | 상태 |
|----|------|------|
| FR-30 | 토글 API | ✅ |
| FR-31 | config 확인 API | ✅ |
| FR-32 | 사용량 조회 API | ✅ |
| FR-33 | 자동 차단 | ✅ |
| FR-34 | 페이지뷰 기록 API | ✅ |
| FR-35 | PageViewTracker | ✅ |
| FR-36 | 통계 대시보드 API | ❌ 미구현 |
| FR-37 | 통계 대시보드 UI | 🔄 부분 구현 |
| FR-38 | 자동차단 알림 | ✅ |
| FR-39 | IP 익명화 | ❌ 미구현 |

### Phase 4: Enhancement (FR-40 ~ FR-43) — 0%

| FR | 설명 | 상태 |
|----|------|------|
| FR-40 | 게임 세션 토큰 | ❌ |
| FR-41 | Canvas 이미지 생성 | ❌ |
| FR-42 | SNS 공유 확장 | ❌ |
| FR-43 | Cron Trigger | ❌ |

---

## 7. 핵심 발견사항

1. **Phase 1~2 실질적 완성** — 인프라와 리더보드는 Design과 거의 정확히 일치. 핵심 기능 모두 동작.

2. **Phase 3 부분 완성** (~65%) — 토글/카운터/페이지뷰 메커니즘은 완성. `GET /api/admin/analytics` 라우트와 AE SQL API 연동 대시보드가 주요 Gap.

3. **Phase 4 전체 미구현** — 계획적으로 후속 작업으로 분류된 항목들 (세션 토큰, 이미지 공유, SNS, Cron).

4. **보안 Gap** — IP 익명화 (FR-39, HIGH), CORS 제한 (MEDIUM), IP 기반 rate limiting (MEDIUM) 미구현.

5. **캐싱 접근 차이** — Design은 Cache API (`caches.default`) 명시, 구현은 `Cache-Control` 헤더 방식. Cloudflare Workers 환경에서 기능적으로 동등하나 아키텍처 차이.

---

## 8. 권장 조치

### 90% 달성을 위한 필수 항목 (현재 71.8% → 목표 90%)

1. **[HIGH] Leaderboard 반응형** — 모바일/데스크톱 레이아웃 분기 (P2)
2. **[HIGH] 히스토리 "이번 주" 그룹** — 날짜 그룹 로직 보완 (P4)
3. **[HIGH] `GET /api/admin/analytics` 라우트** — 게임 통계 집계 API (M1)
4. **[HIGH] 대시보드 기간 선택기 + 차트** — 7d/30d/90d 탭 + 일별/인기 페이지 (M3~M5)
5. **[HIGH] IP 익명화** — pageview API에 SHA-256 + daily salt 적용 (M6)
6. **[MEDIUM] CORS 제한** — API 라우트에 origin 검증 (M7)

### Phase 4 (선택)
- M9~M12는 Design에서 Phase 4로 분류, 별도 일정에 구현 가능.

---

*Generated: 2026-03-06*
*Design: docs/02-design/features/analytics-leaderboard.design.md*
*Plan: docs/01-plan/features/analytics-leaderboard.plan.md*
