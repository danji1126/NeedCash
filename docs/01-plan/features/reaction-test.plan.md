# Plan: reaction-test

> 화면 색상 변화에 반응하여 반응속도(ms)를 측정하는 스킬 기반 미니게임 추가

## 1. Overview

### Purpose
화면이 초록색으로 변하는 순간 최대한 빠르게 클릭하여 반응속도(밀리초)를 측정하는 게임을 기존 게임 허브에 추가한다. 5회 측정 후 평균을 계산하고 등급/칭호를 부여하여 SNS 공유를 유도한다.

### Background
- 프로젝트: NeedCash (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)
- 기존 게임: Dice Roller(운), Lotto Pick(운), 동물상 찾기(AI) - 스킬 기반 게임 부재
- 선정 근거: 3명 전문가 브레인스토밍 회의 결과 총 14점 만장일치 1위 선정
- 참고 문서: `docs/game-brainstorm/meeting-report.md`
- 벤치마크: Human Benchmark (humanbenchmark.com) - 틱톡 바이럴 검증 포맷

## 2. Scope

### In Scope
- 게임 메타데이터 등록 (GAMES 배열, GAME_COMPONENTS 매핑)
- `bolt` 아이콘 SVG 추가 (UIIconType 확장)
- ReactionGame 클라이언트 컴포넌트 구현
  - 3단계 화면 전환: 대기(빨강) → 준비(랜덤 딜레이) → GO(초록)
  - `performance.now()` 기반 밀리초 정밀 타이밍 측정
  - Too Early 페널티 처리
  - 5회 측정 → 평균/최고/최저 통계
  - 등급/칭호 시스템 (S~F 6단계)
  - 히스토리 기능 (최근 10건, 기존 패턴 동일)
- 모바일 반응형 (전체화면 터치 영역)

### Out of Scope
- 결과 이미지 생성/다운로드 (Canvas → PNG 공유 기능)
- 소리/효과음 (Web Audio API)
- 리더보드/랭킹 (백엔드 필요)
- 다국어 지원
- 다른 반응속도 모드 (시각 외 청각/패턴 등)

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | GAMES 배열에 reaction 게임 등록 | HIGH | slug: "reaction", title, description, icon 메타데이터 |
| FR-02 | UIIconType에 bolt 아이콘 추가 | HIGH | 번개 모양 SVG 아이콘, 기존 아이콘 패턴 동일 |
| FR-03 | ReactionGame 컴포넌트 dynamic import 등록 | HIGH | `app/game/[slug]/page.tsx`의 GAME_COMPONENTS에 추가 |
| FR-04 | 3단계 화면 전환 | CRITICAL | waiting(빨강) → ready(랜덤 2~5초 딜레이) → go(초록) |
| FR-05 | 밀리초 정밀 타이밍 측정 | CRITICAL | `performance.now()` 사용, 소수점 없이 정수 ms 표시 |
| FR-06 | Too Early 페널티 처리 | HIGH | 초록 전환 전 클릭 시 "Too Early!" 경고, 해당 라운드 재시도 |
| FR-07 | 5회 측정 후 결과 화면 | CRITICAL | 평균, 최고(최소 ms), 최저(최대 ms), 등급, 칭호 표시 |
| FR-08 | 등급/칭호 시스템 | HIGH | S(<200ms)~F(>500ms) 6단계, 동물 비유 칭호 |
| FR-09 | 히스토리 기능 | MEDIUM | 최근 10건 평균 기록 저장, 기존 게임 패턴 동일 |
| FR-10 | 모바일 전체화면 터치 | HIGH | 전체 영역 터치 가능, 한 손 조작 최적화 |
| FR-11 | 게임 중 강제 종료 | HIGH | 전체화면 오버레이에서 X 버튼으로 idle로 복귀 |
| FR-12 | 측정 횟수 사용자 설정 | HIGH | 기본 5회, 1~20회 범위 입력 가능, idle 화면에 +/- 입력 UI |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 게임(Dice, Lotto, 동물상) 동작에 영향 없어야 함 |
| NFR-02 | 빌드 성공 (`pnpm build`) - `/game/reaction` 정적 페이지 생성 |
| NFR-03 | 린트 통과 (`pnpm lint`) |
| NFR-04 | 외부 라이브러리 추가 없음 (번들 사이즈 0KB 증가) |
| NFR-05 | 단일 파일 컴포넌트 (~200줄 이내) |
| NFR-06 | setTimeout cleanup 처리 (컴포넌트 언마운트 시 메모리 누수 방지) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL FR 해결 | 3/3 (FR-04, FR-05, FR-07) |
| HIGH FR 해결 | 5/5 (FR-01, FR-02, FR-03, FR-06, FR-08, FR-10) |
| MEDIUM FR 해결 | 1/1 (FR-09) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |
| 게임 허브 페이지에 4번째 게임 표시 | Pass |
| 외부 의존성 추가 | 0개 |

## 5. Technical Design

### 게임 흐름 (Phase State Machine)

```
idle → [시작 클릭] → waiting → [랜덤 2~5초] → go → [사용자 클릭] → roundResult → [다음 라운드/5회 완료] → result
                        ↑                                                    |
                        └──── [Too Early 클릭] → tooEarly → [재시도] ─────────┘
```

### Phase별 상태

| Phase | 배경색 | 사용자 액션 | 전환 조건 |
|-------|--------|-----------|-----------|
| `idle` | 기본 테마 | "시작하기" 클릭 | → waiting |
| `waiting` | 빨강 계열 | 화면 클릭 | → tooEarly (페널티) |
| `go` | 초록 계열 | 화면 클릭 | → roundResult (ms 기록) |
| `tooEarly` | 노랑 계열 | 자동 (1.5초 후) / X 버튼 | → waiting (재시도) / → idle (종료) |
| `roundResult` | 기본 테마 | 자동 (1.5초 후) / 클릭 / X 버튼 | → waiting (다음 라운드) 또는 → result (5회 완료) / → idle (종료) |
| `result` | 기본 테마 | "다시 도전" 클릭 | → waiting (새 세션) |

### 등급 시스템

| 등급 | 범위 | 칭호 |
|:----:|------|------|
| S | < 200ms | "번개 반사신경" |
| A | 200~250ms | "매의 눈" |
| B | 250~300ms | "민첩한 고양이" |
| C | 300~400ms | "평범한 인간" |
| D | 400~500ms | "느긋한 거북이" |
| F | > 500ms | "졸린 나무늘보" |

### 핵심 기술 요소

| 항목 | 방식 |
|------|------|
| **상태 관리** | `useState` - phase, 라운드 번호, 결과 배열, 히스토리 |
| **타이밍 측정** | `performance.now()` 차이 계산 (startTime ref) |
| **랜덤 딜레이** | `setTimeout(fn, 2000 + Math.random() * 3000)` |
| **타이머 정리** | `useRef`로 timeout ID 관리, `useEffect` cleanup |
| **애니메이션** | framer-motion `animate` + 배경색/스케일 전환 |
| **히스토리** | `useState` 배열, `prev.slice(0, 9)` FIFO |

### UI 구성 (Phase별)

| Phase | 화면 요소 |
|-------|----------|
| idle | 게임 설명 + 규칙 안내 + "시작하기" 버튼 |
| waiting | 빨간 배경 + "초록색이 되면 클릭!" 안내 + 라운드 표시 (N/5) |
| go | 초록 배경 + "클릭!" 대형 텍스트 |
| tooEarly | 노란 배경 + "너무 빨라요!" 경고 |
| roundResult | 측정된 ms 대형 표시 + 이번 라운드 결과 |
| result | 평균 ms + 등급 + 칭호 + 5회 개별 결과 + "다시 도전" 버튼 + 히스토리 |

## 6. Implementation Order

### Phase 1: 등록 및 아이콘
1. **FR-02**: `components/ui/icons.tsx` - UIIconType에 `bolt` 추가, SVG 아이콘 구현
2. **FR-01**: `lib/constants.ts` - GAMES 배열에 reaction 게임 추가
3. **FR-03**: `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Phase 2: 핵심 게임 로직
4. **FR-04**: 3단계 화면 전환 (waiting → go, 랜덤 딜레이)
5. **FR-05**: `performance.now()` 기반 ms 측정
6. **FR-06**: Too Early 페널티 처리

### Phase 3: 결과 및 UX
7. **FR-07**: 5회 측정 후 결과 화면 (통계 계산)
8. **FR-08**: 등급/칭호 시스템
9. **FR-09**: 히스토리 기능

### Phase 4: 반응형
10. **FR-10**: 모바일 전체화면 터치 최적화

### Phase 5: 검증
11. `pnpm lint` 실행
12. `pnpm build` 실행 - `/game/reaction` 페이지 생성 확인

## 7. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `apps/web/components/ui/icons.tsx` | UIIconType에 `bolt` 추가 + SVG 구현 | 1 |
| `apps/web/lib/constants.ts` | GAMES 배열에 reaction 게임 추가 | 1 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import + GAME_COMPONENTS 추가 | 1 |
| `apps/web/components/game/reaction-game.tsx` | 새 게임 컴포넌트 (전체 구현) | 2-4 |

## 8. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| `performance.now()` 정밀도 브라우저별 차이 | LOW | MEDIUM | 정수 반올림으로 충분, ms 단위에서 유의미한 차이 없음 |
| setTimeout 정확도 한계 | LOW | LOW | 딜레이는 정확할 필요 없음 (랜덤이므로), 측정만 정밀하면 됨 |
| 모바일 터치 이벤트 지연 | MEDIUM | LOW | `onPointerDown` 사용 (touch보다 빠름) |
| 빠른 더블클릭으로 상태 꼬임 | MEDIUM | MEDIUM | phase 기반 상태 머신으로 방어, 전환 중 클릭 무시 |
| framer-motion 배경색 전환 지연 | LOW | LOW | CSS transition 대비 framer-motion이 더 제어 가능 |

## 9. Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| (없음) | - | 외부 의존성 추가 없음, 기존 프로젝트 라이브러리만 사용 |

기존 사용 라이브러리:
- `react` (useState, useRef, useCallback, useEffect)
- `framer-motion` (motion, AnimatePresence)
- `tailwindcss` (유틸리티 클래스)

---

**Created**: 2026-02-11
**Feature**: reaction-test
**Phase**: Plan
**Reference**: docs/game-brainstorm/meeting-report.md
