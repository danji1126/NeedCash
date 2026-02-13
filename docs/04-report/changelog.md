# Changelog

프로젝트의 모든 변경 사항을 기록합니다.

---

## [2026-02-13] - color-memory 게임 추가

### Added
- **Color Memory Game**: 시몬(Simon) 스타일 색상 기억력 테스트 미니게임
  - 4색 패드(빨강, 초록, 파랑, 노랑) 2x2 그리드 레이아웃
  - 컴퓨터가 색상 순서 점멸 → 플레이어가 순서대로 클릭하여 재현
  - 라운드별 패턴 길이 증가 (라운드 N: N+1개)
  - 등급/칭호 시스템 (S~F 6단계)
  - 히스토리 기능 (최근 10건)
  - 게임 중 강제 종료 버튼 ("그만하기")

- **Brain 아이콘**: 새로운 UI 아이콘 추가
  - 게임 카드의 아이콘으로 사용

### Changed
- **GAMES 배열**: color-memory 게임 등록
  - slug: "color-memory"
  - title: "Color Memory"
  - icon: "brain"

- **Dynamic Import**: [slug]/page.tsx에 ColorMemoryGame 등록
  - GAME_COMPONENTS에 "color-memory" 키 추가

### Technical Details
- **구현 파일**:
  - `components/game/color-memory-game.tsx` (421줄)
  - `components/ui/icons.tsx` (brain 아이콘)
  - `lib/constants.ts` (GAMES 배열)
  - `app/game/[slug]/page.tsx` (import 등록)

- **기술 스택**: React 19, TypeScript 5, Tailwind CSS 4, framer-motion
- **외부 의존성**: 추가 없음 (번들 사이즈 0KB 증가)
- **빌드**: pnpm build ✅ (28 페이지, /game/color-memory 정적 생성)
- **린트**: pnpm lint ✅ (0 에러)

### Bug Fixes
- **BUG-001**: flex items-center 내부 grid 너비 축소
  - grid 컨테이너에 `w-full` 추가로 해결
  - Design 문서 섹션 9.3에 Known Issues로 기록

### Quality Metrics
- **Design Match Rate**: 97%
  - FR 완성도: 13/13 (100%)
  - NFR 완성도: 5/6 (83%, NFR-05 목표 대비 5% 초과)

- **Testing**:
  - pnpm lint: PASS
  - pnpm build: PASS
  - Playwright E2E: PASS (20 테스트 항목)

- **Code Stats**:
  - 총 추가 라인: 428줄
  - 메인 컴포넌트: 421줄 (단일 파일)
  - 메모리 누수: 없음 (useEffect cleanup)

### Documentation
- **계획 문서**: docs/01-plan/features/color-memory.plan.md
- **설계 문서**: docs/02-design/features/color-memory.design.md
- **완료 보고서**: docs/04-report/features/color-memory.report.md

### Game Hub Updates
- **게임 개수**: 5개 → 6개
  1. Dice Roller (운)
  2. Lotto Pick (운)
  3. 동물상 찾기 (AI)
  4. Reaction Test (반응속도)
  5. Color Sense Test (색감)
  6. Color Memory (기억력) ← NEW

---

## [2026-01-?] - 이전 변경 사항

(이전 게임 추가 기록)

