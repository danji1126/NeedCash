# Gap Analysis: color-sense

> Design 문서와 실제 구현 코드 간 Gap 분석 보고서

---

## 1. 분석 개요

| 항목 | 값 |
|------|-----|
| Feature | color-sense |
| Design 문서 | `docs/02-design/features/color-sense.design.md` |
| 분석 일시 | 2026-02-11 |
| 분석 대상 파일 수 | 4개 |

### 분석 대상 파일

| 파일 | 역할 |
|------|------|
| `apps/web/components/game/color-sense-game.tsx` | 메인 게임 컴포넌트 (308줄) |
| `apps/web/components/ui/icons.tsx` | eye 아이콘 추가 |
| `apps/web/lib/constants.ts` | GAMES 배열 등록 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import 등록 |

---

## 2. Match Rate

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| FR (기능 요구사항) | 100% (12/12) | PASS |
| NFR (비기능 요구사항) | 83% (5/6) | WARN |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **95%** | **PASS** |

---

## 3. FR (기능 요구사항) 분석 - 12/12 PASS

| FR | 요구사항 | 결과 | 비고 |
|----|---------|:----:|------|
| FR-01 | GAMES 배열 등록 | MATCH | slug: "color-sense", title, description, icon: "eye" 완전 일치 |
| FR-02 | eye 아이콘 추가 | MATCH | UIIconType 확장, SVG path 완전 일치 (눈 + 동공) |
| FR-03 | Dynamic import 등록 | MATCH | import 패턴, GAME_COMPONENTS 완전 일치 |
| FR-04 | 타일 그리드 및 정답 판별 | MATCH | N개 타일 중 diffIndex 기반 정답 판별, onClick 핸들러 |
| FR-05 | 라운드별 난이도 상승 | MATCH | 라운드 1~3: 2x2, 4~6: 3x3, 7~10: 4x4 |
| FR-06 | HSL 색상 생성 | MATCH | generateColors 함수, hue/saturation/lightness 랜덤, 라운드별 hueDiff 감소 |
| FR-07 | 10초 타이머 | MATCH | TIME_LIMIT=10000, setInterval 100ms, 타이머 바 시각적 표시 |
| FR-08 | 남은 시간 기반 점수 | MATCH | `Math.round((remaining / TIME_LIMIT) * 100)` 라운드 최대 100점 |
| FR-09 | 등급/칭호 시스템 | MATCH | S(>=900)~F(0) 6단계, 한국어 칭호 일치 |
| FR-10 | 10라운드 클리어 결과 | MATCH | TOTAL_ROUNDS=10, 총점+등급+칭호+라운드별 결과 표시 |
| FR-11 | 실패 조건 처리 | MATCH | wrong(오답 클릭), timeout(시간 초과) 각각 게임 오버 화면 |
| FR-12 | 히스토리 기능 | MATCH | 최근 10건, `prev.slice(0, 9)` FIFO, 기존 패턴 동일 |

---

## 4. NFR (비기능 요구사항) 분석 - 5/6

| NFR | 요구사항 | 결과 | 비고 |
|-----|---------|:----:|------|
| NFR-01 | 기존 게임 영향 없음 | PASS | additive 변경만 수행, dynamic import로 코드 분리 |
| NFR-02 | 빌드 성공 | PASS | `pnpm build` 통과, `/game/color-sense` 정적 페이지 생성 확인 |
| NFR-03 | 린트 통과 | PASS | `pnpm lint` 통과 확인 |
| NFR-04 | 외부 라이브러리 없음 | PASS | react, framer-motion, 내부 컴포넌트만 사용 |
| NFR-05 | 단일 파일 ~300줄 | FAIL | 308줄 (3% 초과) |
| NFR-06 | setInterval cleanup | PASS | clearTimer 헬퍼 + clearFeedbackTimer + useEffect cleanup |

### NFR-05 분석

Design 문서 Section 12에서 "인라인 구성, 별도 파일 불필요"라고 명시. 308줄은 목표 300줄 대비 3% 초과로, 6개 phase별 렌더링(idle, playing, correct, wrong, timeout, result)과 타이머 로직, 색상 생성 함수가 자연스럽게 줄 수를 증가시킴. 기능 분리 없이 단일 파일 308줄은 합리적 범위.

---

## 5. Design 대비 변경사항 (BLUE)

| 항목 | Design | 구현 | 영향 |
|------|--------|------|------|
| 타이머 바 구현 | `motion.div` + `width` style | 일반 `div` + CSS `transition-all` | 없음 - 더 가벼운 구현 |
| 타이머 바 색상 전환 | framer-motion animate | 인라인 style + 3단계 조건부 색상 | 없음 - 동일 시각 결과 |
| feedbackTimer 분리 | 단일 timerRef | timerRef(interval) + feedbackTimerRef(timeout) 분리 | 개선 - 타이머 충돌 방지 |
| scoreRef / roundRef 추가 | state만 사용 | ref로 최신 값 참조 | 개선 - 클로저 stale state 방지 |
| wrong/timeout 통합 뷰 | 별도 설계 | 조건부 렌더링으로 통합 | 개선 - 코드 중복 제거 |
| 타일 aria-label | 미명시 | `aria-label="타일 ${i + 1}"` 추가 | 개선 - 접근성 향상 |

---

## 6. 누락 사항 (RED) - 없음

Design에 명시된 모든 기능이 구현됨.

---

## 7. 추가 구현 사항 (YELLOW)

| 항목 | 위치 | 설명 |
|------|------|------|
| feedbackTimerRef 분리 | `color-sense-game.tsx:100-104` | correct 피드백 타이머를 별도 ref로 관리 |
| scoreRef / roundRef | `color-sense-game.tsx:97-98` | 비동기 콜백 내 stale state 방지용 ref |
| lastRoundScore state | `color-sense-game.tsx:93` | correct 피드백 화면에 해당 라운드 점수 표시용 |
| 타일 aria-label | `color-sense-game.tsx:299` | 접근성을 위한 각 타일 레이블 추가 |

---

## 8. 결론

**Match Rate: 95% - PASS**

모든 기능 요구사항(FR 12개)이 Design 대로 정확히 구현됨. NFR-05(줄 수 제한)만 308줄로 3% 초과하나, 6개 phase별 UI 렌더링과 색상 생성 로직이 포함된 단일 파일 구조에서 합리적 범위. 구현에서 Design 대비 여러 개선사항(feedbackTimer 분리, ref를 통한 stale state 방지, 접근성 aria-label)이 적용됨.

**권장 조치**: 없음 (matchRate >= 90%, 기능 완전 일치)

---

**Created**: 2026-02-11
**Feature**: color-sense
**Phase**: Check (Gap Analysis)
**Match Rate**: 95%
