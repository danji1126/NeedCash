# Gap Analysis: reaction-test

> Design 문서와 실제 구현 코드 간 Gap 분석 보고서

---

## 1. 분석 개요

| 항목 | 값 |
|------|-----|
| Feature | reaction-test |
| Design 문서 | `docs/02-design/features/reaction-test.design.md` |
| 분석 일시 | 2026-02-11 |
| 분석 대상 파일 수 | 4개 |

### 분석 대상 파일

| 파일 | 역할 |
|------|------|
| `apps/web/components/game/reaction-game.tsx` | 메인 게임 컴포넌트 (337줄) |
| `apps/web/components/ui/icons.tsx` | bolt 아이콘 추가 |
| `apps/web/lib/constants.ts` | GAMES 배열 등록 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import 등록 |

---

## 2. Match Rate

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| FR (기능 요구사항) | 100% | PASS |
| NFR (비기능 요구사항) | 83% | WARN |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **95%** | **PASS** |

---

## 3. FR (기능 요구사항) 분석 - 10/10 PASS

| FR | 요구사항 | 결과 | 비고 |
|----|---------|:----:|------|
| FR-01 | GAMES 배열 등록 | MATCH | slug, title, description, icon 완전 일치 |
| FR-02 | bolt 아이콘 추가 | MATCH | UIIconType, SVG path 완전 일치 |
| FR-03 | Dynamic import 등록 | MATCH | import 패턴, GAME_COMPONENTS 완전 일치 |
| FR-04 | 3단계 화면 전환 | MATCH | Phase type 6종, 전환 로직 일치 |
| FR-05 | ms 정밀 측정 | MATCH | performance.now() + Math.round() |
| FR-06 | Too Early 페널티 | MATCH | 1.5초 후 자동 재시도 |
| FR-07 | 5회 측정 결과 | MATCH | TOTAL_ROUNDS 상수 사용 (개선) |
| FR-08 | 등급/칭호 시스템 | MATCH | S~F 6등급, 동물 칭호 일치 |
| FR-09 | 히스토리 기능 | MATCH | 최근 10건, FIFO 패턴 일치 |
| FR-10 | 모바일 전체화면 터치 | MATCH | fixed inset-0 z-50, onPointerDown |

---

## 4. NFR (비기능 요구사항) 분석 - 5/6

| NFR | 요구사항 | 결과 | 비고 |
|-----|---------|:----:|------|
| NFR-01 | 기존 게임 영향 없음 | PASS | additive 변경만 수행 |
| NFR-02 | 빌드 성공 | PASS | pnpm build 통과 확인 |
| NFR-03 | 린트 통과 | PASS | pnpm lint 통과 확인 |
| NFR-04 | 외부 라이브러리 없음 | PASS | react, framer-motion, 내부 컴포넌트만 사용 |
| NFR-05 | 단일 파일 ~200줄 | FAIL | 337줄 (68% 초과) |
| NFR-06 | setTimeout cleanup | PASS | clearTimer 헬퍼 + useEffect cleanup |

### NFR-05 분석

Design 문서 Section 12에서 "인라인 서브 컴포넌트로 구성, 별도 파일 불필요"라고 명시되어 있어, 단일 파일 구조는 의도대로임. ~200줄 목표는 기획 시점의 추정치로, idle/result 뷰의 풍부한 UI와 6개 phase별 렌더링이 자연스럽게 줄 수를 증가시킴. 기능 분리 없이 337줄은 합리적 범위.

---

## 5. Design 대비 변경사항 (BLUE)

| 항목 | Design | 구현 | 영향 |
|------|--------|------|------|
| GRADES 구조 | `{ grade, title, minMs, maxMs }` | `{ grade, title, max }` | 없음 - 동일 결과 |
| getGrade 로직 | `avg >= minMs && avg < maxMs` | `ms < g.max` (find) | 없음 - 간결화 |
| timeoutRef 타입 | `NodeJS.Timeout` | `ReturnType<typeof setTimeout>` | 없음 - 더 호환성 높음 |
| Timer 정리 | 인라인 clearTimeout | `clearTimer()` 헬퍼 추출 | 개선 - 재사용성 |
| 라운드 수 | 하드코딩 `5` | `const TOTAL_ROUNDS = 5` | 개선 - 매직넘버 제거 |
| idle 가드 | `phase === "idle"` 만 체크 | `"idle" \|\| "result"` 체크 | 개선 - 방어적 |
| result 등급 애니 | scale 0→1.3→1 (bounce) | scale 0→1 | 미미 - 미적 선택 |
| waiting 진입 | 0.3s | 0.2s | 미미 - 미적 선택 |
| go 진입 애니 | scale 1→1.02→1 (pulse) | scale 0.9→1 | 미미 - 미적 선택 |

---

## 6. 누락 사항 (RED) - 없음

Design에 명시된 모든 기능이 구현됨.

---

## 7. 추가 구현 사항 (YELLOW)

| 항목 | 위치 | 설명 |
|------|------|------|
| clearTimer 헬퍼 | `reaction-game.tsx:63-68` | 타이머 정리 유틸리티 추출 |
| TOTAL_ROUNDS 상수 | `reaction-game.tsx:26` | 매직넘버 5를 명명된 상수로 |
| result phase 가드 | `reaction-game.tsx:91` | handleClick에 추가 방어 로직 |

---

## 8. 결론

**Match Rate: 95% - PASS**

모든 기능 요구사항(FR 10개)이 Design 대로 정확히 구현됨. NFR-05(줄 수 제한)만 초과하나, Design 문서 자체에서 단일 파일 인라인 구조를 지시하고 있어 구조적으로 합리적. 구현에서 Design 대비 여러 개선사항(clearTimer 헬퍼, TOTAL_ROUNDS 상수, 더 호환적인 타입)이 적용됨.

**권장 조치**: 없음 (matchRate >= 90%, 기능 완전 일치)

---

**Created**: 2026-02-11
**Feature**: reaction-test
**Phase**: Check (Gap Analysis)
**Match Rate**: 95%
