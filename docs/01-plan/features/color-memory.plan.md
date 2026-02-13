# Plan: color-memory

> 색상 순서를 기억하고 재현하는 시몬(Simon) 스타일 기억력 테스트 미니게임 추가

## 1. Overview

### Purpose
4~9개의 색상 버튼 중 순차적으로 점멸하는 색상 패턴을 기억하고, 동일한 순서로 클릭하여 재현하는 기억력 테스트 게임을 게임 허브에 추가한다. 라운드가 올라갈수록 패턴 길이가 증가하여 난이도가 상승한다. 최종 도달 라운드와 등급/칭호를 부여하여 사용자 참여를 유도한다.

### Background
- 프로젝트: NeedCash (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)
- 기존 게임: Dice Roller(운), Lotto Pick(운), 동물상 찾기(AI), Reaction Test(반응속도), Color Sense Test(색감)
- 선정 근거: 시몬(Simon) 게임은 전 세계적으로 검증된 기억력 테스트 포맷으로, 단순하지만 중독성 높은 게임플레이 제공
- 벤치마크: Simon Game, Human Benchmark Sequence Memory, Memory Matrix

## 2. Scope

### In Scope
- 게임 메타데이터 등록 (GAMES 배열, GAME_COMPONENTS 매핑)
- `brain` 아이콘 SVG 추가 (UIIconType 확장)
- ColorMemoryGame 클라이언트 컴포넌트 구현
  - 4개 색상 패드(빨강, 초록, 파랑, 노랑) 2x2 그리드 배치
  - 컴퓨터가 색상 순서를 보여줌 (점멸 애니메이션)
  - 플레이어가 동일 순서로 클릭하여 재현
  - 라운드별 패턴 길이 증가 (라운드 1: 2개 → 라운드 N: N+1개)
  - 틀리면 게임 오버, 현재 라운드까지 점수로 등급 산출
  - 등급/칭호 시스템 (S~F 6단계)
  - 히스토리 기능 (최근 10건)
  - 게임 중 강제 종료 버튼 (현재까지 결과로 즉시 결과 화면 이동)
- 모바일 반응형 (색상 패드 터치 최적화)

### Out of Scope
- 사운드/효과음 (Web Audio API)
- 리더보드/랭킹 (백엔드 필요)
- 다국어 지원
- 커스텀 색상/패드 개수 설정
- 결과 이미지 공유 기능

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | GAMES 배열에 color-memory 게임 등록 | HIGH | slug: "color-memory", title: "Color Memory", description, icon: "brain" |
| FR-02 | UIIconType에 brain 아이콘 추가 | HIGH | 뇌 모양 SVG 아이콘, 기존 아이콘 패턴 동일 |
| FR-03 | ColorMemoryGame 컴포넌트 dynamic import 등록 | HIGH | `app/game/[slug]/page.tsx`의 GAME_COMPONENTS에 추가 |
| FR-04 | 4색 패드 그리드 표시 | CRITICAL | 빨강, 초록, 파랑, 노랑 2x2 원형/사각 패드 레이아웃 |
| FR-05 | 색상 순서 점멸 애니메이션 | CRITICAL | 컴퓨터가 보여주는 패턴을 순차적으로 밝게 점멸 (각 0.5초, 간격 0.3초) |
| FR-06 | 플레이어 입력 및 순서 검증 | CRITICAL | 클릭한 색상이 패턴 순서와 일치하는지 실시간 검증 |
| FR-07 | 라운드별 패턴 길이 증가 | CRITICAL | 라운드 1: 2개, 이후 라운드마다 +1개 추가 |
| FR-08 | 게임 오버 처리 | HIGH | 틀린 패드 클릭 시 게임 오버, 현재 라운드 표시 |
| FR-09 | 등급/칭호 시스템 | HIGH | S(>=15라운드)~F(<3라운드) 6단계, 한국어 칭호 |
| FR-10 | 결과 화면 | HIGH | 도달 라운드 + 총 정답 수 + 등급 + 칭호 표시 |
| FR-11 | 히스토리 기능 | MEDIUM | 최근 10건 기록 저장, 기존 게임 패턴 동일 |
| FR-12 | 점멸 중 입력 차단 | HIGH | 컴퓨터가 패턴을 보여주는 동안 클릭 비활성화 |
| FR-13 | 게임 중 강제 종료 | HIGH | showing/input 단계에서 "그만하기" 버튼 클릭 시 현재까지 결과로 즉시 result 화면 이동, 진행 중 타이머 정리 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 게임(Dice, Lotto, 동물상, Reaction, Color Sense) 동작에 영향 없어야 함 |
| NFR-02 | 빌드 성공 (`pnpm build`) - `/game/color-memory` 정적 페이지 생성 |
| NFR-03 | 린트 통과 (`pnpm lint`) |
| NFR-04 | 외부 라이브러리 추가 없음 (번들 사이즈 0KB 증가) |
| NFR-05 | 단일 파일 컴포넌트 (~400줄 이내) |
| NFR-06 | setTimeout/setInterval cleanup 처리 (컴포넌트 언마운트 시 메모리 누수 방지) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL FR 해결 | 4/4 (FR-04, FR-05, FR-06, FR-07) |
| HIGH FR 해결 | 6/6 (FR-01, FR-02, FR-03, FR-08, FR-09, FR-10, FR-12, FR-13) |
| MEDIUM FR 해결 | 1/1 (FR-11) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |
| 게임 허브 페이지에 6번째 게임 표시 | Pass |
| 외부 의존성 추가 | 0개 |

## 5. Technical Design

### 게임 흐름 (Phase State Machine)

```
idle → [시작 클릭] → showing → [점멸 완료] → input → [정답] → correct → [0.8초 후] → showing (다음 라운드)
                       │                      │
                       │ [그만하기]             │ [오답 클릭]
                       ▼                      ▼
                     result ← ─ ─ ─ ─ ─ ─  wrong
                       ▲
                       │ [그만하기]
                       │
                     input
```

### Phase별 상태

| Phase | 화면 내용 | 사용자 액션 | 전환 조건 |
|-------|----------|-----------|-----------|
| `idle` | 게임 설명 + 4색 패드 (비활성) + "시작하기" 버튼 | "시작하기" 클릭 | → showing |
| `showing` | 패턴 점멸 애니메이션 (입력 차단) + "그만하기" 버튼 | "그만하기" 클릭 | → input (점멸 완료 후) / → result (그만하기) |
| `input` | 4색 패드 활성화 + 라운드/진행률 + "그만하기" 버튼 | 패드 클릭 / "그만하기" 클릭 | → correct / wrong / → result (그만하기) |
| `correct` | "정답!" 피드백 | 자동 (0.8초 후) | → showing (다음 라운드) |
| `wrong` | "틀렸습니다!" + 정답 패턴 하이라이트 | 없음 (자동) | → result (1.5초 후) |
| `result` | 도달 라운드 + 등급 + 칭호 + 히스토리 | "다시 도전" 클릭 | → showing (새 게임) |

### 4색 패드 구성

| 위치 | 색상 | HSL | 활성(밝음) HSL |
|:----:|:----:|:---:|:-------------:|
| 좌상 | 빨강 | hsl(0, 70%, 45%) | hsl(0, 80%, 60%) |
| 우상 | 초록 | hsl(120, 70%, 35%) | hsl(120, 80%, 50%) |
| 좌하 | 파랑 | hsl(220, 70%, 45%) | hsl(220, 80%, 60%) |
| 우하 | 노랑 | hsl(50, 70%, 45%) | hsl(50, 85%, 60%) |

### 등급 시스템

| 등급 | 도달 라운드 | 칭호 |
|:----:|:----------:|------|
| S | >= 15 | "천재적 기억력" |
| A | 12~14 | "비상한 두뇌" |
| B | 9~11 | "날카로운 집중력" |
| C | 6~8 | "평범한 기억력" |
| D | 3~5 | "조금 더 집중!" |
| F | < 3 | "금붕어..." |

### 패턴 생성 로직

```
시퀀스 배열: number[] (0~3 인덱스, 각각 빨/초/파/노)
라운드 N 시작 시: 기존 시퀀스 + 랜덤 1개 추가
초기 시퀀스 길이: 2 (라운드 1)
라운드 N의 시퀀스 길이: N + 1
```

### 점멸 타이밍

| 항목 | 값 |
|------|-----|
| 패드 점멸 지속 시간 | 500ms |
| 패드 간 간격 | 300ms |
| 라운드 시작 전 대기 | 600ms |
| 정답 피드백 표시 | 800ms |
| 오답 피드백 표시 | 1500ms |

### 핵심 기술 요소

| 항목 | 방식 |
|------|------|
| **상태 관리** | `useState` - phase, round, sequence, playerInput, history |
| **점멸 제어** | `useRef` + `setTimeout` 체인 (순차 점멸) |
| **입력 검증** | playerInput 배열과 sequence 배열 인덱스 비교 |
| **타이머 정리** | `useRef`로 timeout ID 관리, `useEffect` cleanup |
| **애니메이션** | framer-motion `animate` + 패드 밝기/스케일 전환 |
| **히스토리** | `useState` 배열, `prev.slice(0, 9)` FIFO |

## 6. Implementation Order

### Phase 1: 등록 및 아이콘
1. **FR-02**: `components/ui/icons.tsx` - UIIconType에 `brain` 추가, SVG 아이콘 구현
2. **FR-01**: `lib/constants.ts` - GAMES 배열에 color-memory 게임 추가
3. **FR-03**: `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Phase 2: 핵심 게임 로직
4. **FR-04**: 4색 패드 2x2 그리드 레이아웃
5. **FR-05**: 색상 순서 점멸 애니메이션
6. **FR-06**: 플레이어 입력 및 순서 검증
7. **FR-07**: 라운드별 패턴 길이 증가
8. **FR-12**: 점멸 중 입력 차단

### Phase 3: 결과 및 UX
9. **FR-08**: 게임 오버 처리 (오답 시)
10. **FR-09**: 등급/칭호 시스템
11. **FR-10**: 결과 화면
12. **FR-11**: 히스토리 기능
13. **FR-13**: 게임 중 강제 종료 ("그만하기" 버튼)

### Phase 4: 검증
13. `pnpm lint` 실행
14. `pnpm build` 실행 - `/game/color-memory` 페이지 생성 확인

## 7. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `apps/web/components/ui/icons.tsx` | UIIconType에 `brain` 추가 + SVG 구현 | 1 |
| `apps/web/lib/constants.ts` | GAMES 배열에 color-memory 게임 추가 | 1 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import + GAME_COMPONENTS 추가 | 1 |
| `apps/web/components/game/color-memory-game.tsx` | 새 게임 컴포넌트 (전체 구현) | 2-3 |

## 8. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 점멸 타이밍 부정확 (setTimeout drift) | MEDIUM | LOW | 시작 시간 기준 계산, requestAnimationFrame 고려 |
| 빠른 연속 클릭 시 이중 입력 | MEDIUM | MEDIUM | 입력 처리 중 추가 클릭 무시 (debounce) |
| 장시간 플레이 시 시퀀스 배열 메모리 | LOW | LOW | 실질적으로 20라운드 이상 도달 어려움, 문제 없음 |
| 모바일에서 패드 터치 영역 부족 | MEDIUM | LOW | 2x2 그리드로 충분한 크기 확보, min-size 설정 |
| 다크/라이트 모드 전환 시 색상 가시성 | LOW | MEDIUM | HSL 값 고정으로 테마 영향 최소화, 패드 자체 배경색 사용 |

## 9. Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| (없음) | - | 외부 의존성 추가 없음, 기존 프로젝트 라이브러리만 사용 |

기존 사용 라이브러리:
- `react` (useState, useRef, useCallback, useEffect)
- `framer-motion` (motion, AnimatePresence)
- `tailwindcss` (유틸리티 클래스)

---

**Created**: 2026-02-13
**Feature**: color-memory
**Phase**: Plan
