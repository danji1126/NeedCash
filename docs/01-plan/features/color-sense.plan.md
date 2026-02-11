# Plan: color-sense

> N개의 동일 색상 타일 중 미묘하게 다른 1개를 찾아 클릭하는 색감 테스트 미니게임 추가

## 1. Overview

### Purpose
다수의 동일 색상 타일 중 미세하게 다른 색상의 타일 1개를 찾아 클릭하는 색감 테스트 게임을 기존 게임 허브에 추가한다. 10라운드 진행하며 라운드가 올라갈수록 색상 차이가 줄어들고 타일 수가 늘어나 난이도가 상승한다. 최종 점수와 등급/칭호를 부여하여 사용자 참여를 유도한다.

### Background
- 프로젝트: NeedCash (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)
- 기존 게임: Dice Roller(운), Lotto Pick(운), 동물상 찾기(AI), Reaction Test(반응속도)
- 선정 근거: 색각 테스트는 SNS 바이럴 검증 포맷으로, 시각적 재미와 점수 경쟁 요소를 모두 갖춤
- 벤치마크: Kuku Kube, Color IQ Test 등 유사 색감 테스트 게임

## 2. Scope

### In Scope
- 게임 메타데이터 등록 (GAMES 배열, GAME_COMPONENTS 매핑)
- `eye` 아이콘 SVG 추가 (UIIconType 확장)
- ColorSenseGame 클라이언트 컴포넌트 구현
  - N개 타일 중 1개 다른 색상 타일 찾기 메카닉
  - 10라운드 진행, 라운드별 난이도 상승 (타일 수 증가 + 색차 감소)
  - 라운드당 10초 시간 제한 (타이머 바 표시)
  - 남은 시간 기반 점수 산출 (라운드별 최대 100점)
  - 실패 조건: 시간 초과 또는 틀린 타일 클릭 → 게임 오버
  - 등급/칭호 시스템 (S~F 6단계)
  - 히스토리 기능 (최근 10건, 기존 패턴 동일)
- 모바일 반응형 (타일 그리드 터치 최적화)

### Out of Scope
- 결과 이미지 생성/다운로드 (Canvas → PNG 공유 기능)
- 소리/효과음 (Web Audio API)
- 리더보드/랭킹 (백엔드 필요)
- 다국어 지원
- 색맹 모드 (별도 접근성 모드)

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | GAMES 배열에 color-sense 게임 등록 | HIGH | slug: "color-sense", title, description, icon 메타데이터 |
| FR-02 | UIIconType에 eye 아이콘 추가 | HIGH | 눈 모양 SVG 아이콘, 기존 아이콘 패턴 동일 |
| FR-03 | ColorSenseGame 컴포넌트 dynamic import 등록 | HIGH | `app/game/[slug]/page.tsx`의 GAME_COMPONENTS에 추가 |
| FR-04 | 타일 그리드 표시 및 정답 타일 클릭 감지 | CRITICAL | N개 타일 중 1개 다른 색상, 클릭 시 정답/오답 판별 |
| FR-05 | 라운드별 난이도 상승 | CRITICAL | 라운드 1~3: 2x2, 라운드 4~6: 3x3, 라운드 7~10: 4x4 |
| FR-06 | HSL 색상 공간 기반 색상 생성 | CRITICAL | 랜덤 hue, 라운드별 hue 차이 감소 (30→3) |
| FR-07 | 10초 시간 제한 타이머 | HIGH | 시각적 타이머 바, 시간 초과 시 게임 오버 |
| FR-08 | 남은 시간 기반 점수 산출 | HIGH | 라운드별 최대 100점, 빨리 찾을수록 고점수 |
| FR-09 | 등급/칭호 시스템 | HIGH | S(>=900)~F(<100) 6단계, 한국어 칭호 |
| FR-10 | 10라운드 클리어 시 최종 결과 화면 | CRITICAL | 총점 + 등급 + 칭호 + 라운드별 결과 |
| FR-11 | 실패 조건 처리 (오답 클릭 / 시간 초과) | HIGH | 게임 오버 화면 표시, 현재까지 점수로 등급 산출 |
| FR-12 | 히스토리 기능 | MEDIUM | 최근 10건 기록 저장, 기존 게임 패턴 동일 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 게임(Dice, Lotto, 동물상, Reaction) 동작에 영향 없어야 함 |
| NFR-02 | 빌드 성공 (`pnpm build`) - `/game/color-sense` 정적 페이지 생성 |
| NFR-03 | 린트 통과 (`pnpm lint`) |
| NFR-04 | 외부 라이브러리 추가 없음 (번들 사이즈 0KB 증가) |
| NFR-05 | 단일 파일 컴포넌트 (~300줄 이내) |
| NFR-06 | setInterval/setTimeout cleanup 처리 (컴포넌트 언마운트 시 메모리 누수 방지) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL FR 해결 | 4/4 (FR-04, FR-05, FR-06, FR-10) |
| HIGH FR 해결 | 6/6 (FR-01, FR-02, FR-03, FR-07, FR-08, FR-09, FR-11) |
| MEDIUM FR 해결 | 1/1 (FR-12) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |
| 게임 허브 페이지에 5번째 게임 표시 | Pass |
| 외부 의존성 추가 | 0개 |

## 5. Technical Design

### 게임 흐름 (Phase State Machine)

```
idle → [시작 클릭] → playing → [정답 클릭] → correct → [0.8초 후] → playing (다음 라운드)
                        │                                              │
                        │ [틀린 타일 클릭]                               │ [10라운드 완료]
                        ▼                                              ▼
                      wrong → 게임 오버                               result
                        │
                        │ [시간 초과]
                        ▼
                      timeout → 게임 오버
```

### Phase별 상태

| Phase | 화면 내용 | 사용자 액션 | 전환 조건 |
|-------|----------|-----------|-----------|
| `idle` | 게임 설명 + "시작하기" 버튼 | "시작하기" 클릭 | → playing |
| `playing` | 타일 그리드 + 타이머 바 + 라운드/점수 | 타일 클릭 | → correct / wrong / timeout |
| `correct` | "정답!" 피드백 | 자동 (0.8초 후) | → playing (다음 라운드) 또는 → result |
| `wrong` | "틀렸습니다" + 게임 오버 | "다시 도전" 클릭 | → playing (새 게임) |
| `timeout` | "시간 초과!" + 게임 오버 | "다시 도전" 클릭 | → playing (새 게임) |
| `result` | 총점 + 등급 + 칭호 + 라운드별 결과 | "다시 도전" 클릭 | → playing (새 게임) |

### 등급 시스템

| 등급 | 점수 범위 | 칭호 |
|:----:|-----------|------|
| S | >= 900 | "테트라크로맷" |
| A | 700~899 | "예술가의 눈" |
| B | 500~699 | "날카로운 감각" |
| C | 300~499 | "평범한 시력" |
| D | 100~299 | "조금 더 집중!" |
| F | < 100 | "색맹 의심..." |

### 색상 생성 로직

| 항목 | 방식 |
|------|------|
| **색상 공간** | HSL (Hue, Saturation, Lightness) |
| **기본 색상** | hue: 랜덤 0~360, saturation: 60~80%, lightness: 50~60% |
| **다른 타일 색상** | hue 오프셋 적용 (라운드별 감소) |
| **라운드 1~3** | hue 차이 30~20 |
| **라운드 4~6** | hue 차이 15~10 |
| **라운드 7~10** | hue 차이 8~3 |

### 타일 그리드 구성

| 라운드 | 그리드 | 타일 수 |
|:------:|:------:|:-------:|
| 1~3 | 2x2 | 4 |
| 4~6 | 3x3 | 9 |
| 7~10 | 4x4 | 16 |

### 점수 산출

```
라운드 점수 = Math.round((남은 시간 / 10초) * 100)
총점 = 모든 라운드 점수의 합 (최대 1000점)
```

### 핵심 기술 요소

| 항목 | 방식 |
|------|------|
| **상태 관리** | `useState` - phase, round, score, colors, history |
| **타이머** | `useRef` + `setInterval` (10ms 단위 카운트다운) |
| **색상 생성** | `generateColors(round)` - HSL 기반 색상 배열 생성 |
| **타이머 정리** | `useRef`로 interval ID 관리, `useEffect` cleanup |
| **애니메이션** | framer-motion `animate` + 타일 등장/피드백 전환 |
| **히스토리** | `useState` 배열, `prev.slice(0, 9)` FIFO |

## 6. Implementation Order

### Phase 1: 등록 및 아이콘
1. **FR-02**: `components/ui/icons.tsx` - UIIconType에 `eye` 추가, SVG 아이콘 구현
2. **FR-01**: `lib/constants.ts` - GAMES 배열에 color-sense 게임 추가
3. **FR-03**: `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Phase 2: 핵심 게임 로직
4. **FR-06**: HSL 색상 생성 함수
5. **FR-04**: 타일 그리드 표시 및 정답 판별
6. **FR-05**: 라운드별 난이도 상승

### Phase 3: 타이머 및 점수
7. **FR-07**: 10초 타이머 바
8. **FR-08**: 남은 시간 기반 점수 산출

### Phase 4: 결과 및 UX
9. **FR-10**: 10라운드 클리어 결과 화면
10. **FR-09**: 등급/칭호 시스템
11. **FR-11**: 실패 조건 처리 (오답/시간초과)
12. **FR-12**: 히스토리 기능

### Phase 5: 검증
13. `pnpm lint` 실행
14. `pnpm build` 실행 - `/game/color-sense` 페이지 생성 확인

## 7. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `apps/web/components/ui/icons.tsx` | UIIconType에 `eye` 추가 + SVG 구현 | 1 |
| `apps/web/lib/constants.ts` | GAMES 배열에 color-sense 게임 추가 | 1 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import + GAME_COMPONENTS 추가 | 1 |
| `apps/web/components/game/color-sense-game.tsx` | 새 게임 컴포넌트 (전체 구현) | 2-4 |

## 8. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 모니터/디스플레이별 색상 재현 차이 | MEDIUM | HIGH | HSL 색상 공간 사용으로 hue 차이 기반 난이도 조절, 극단적 채도/명도 회피 |
| 색맹/색약 사용자 플레이 불가 | LOW | MEDIUM | Out of Scope 명시, 향후 색맹 모드 추가 가능 |
| 타이머 정확도 (setInterval drift) | LOW | LOW | 시작 시간 기준 경과 시간 계산으로 drift 보정 |
| 타일 수 증가 시 모바일 터치 영역 부족 | MEDIUM | MEDIUM | 최대 4x4(16타일), 충분한 padding과 gap으로 터치 영역 확보 |
| 색상 랜덤 생성 시 배경색과 유사한 색상 | LOW | LOW | saturation 60~80%, lightness 50~60% 범위로 제한하여 가시성 확보 |

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
**Feature**: color-sense
**Phase**: Plan
