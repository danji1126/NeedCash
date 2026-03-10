# Changelog

프로젝트의 모든 변경 사항을 기록합니다.

---

## [2026-03-10] - test-coverage 전체 테스트 커버리지 구축 완료

### Added
- **종합 테스트 인프라 구축**: Vitest 기반 42개 테스트 파일, 399개 테스트 케이스
  - `vitest.config.ts`: 이중 환경(node + jsdom), V8 coverage, 60% 임계값
  - `vitest.setup.ts`: 10개 글로벌 mock (framer-motion, Next.js modules)
  - `__mocks__/env.ts`: D1 + KV 스텁, 테스트 유틸리티

- **Backend 테스트** (181 케이스):
  - `lib/__tests__/`: 13개 모듈 (db, scores, analytics, auth, etc.)
  - `app/api/__tests__/`: 10개 API 라우트 (scores, posts, auth, admin)
  - Integration tests with better-sqlite3 (USE_LOCAL_DB=true)

- **Frontend 테스트** (216+ 케이스):
  - 5종 게임 컴포넌트: Reaction, Typing, Math, ColorSense, ColorMemory
  - 게임 공통: ScoreSubmit, Leaderboard, GameResultPanel, CookieConsent
  - Admin/Blog/Design: PostForm, MarkdownEditor, DesignProvider, DesignPicker
  - 19개 컴포넌트 파일

### Quality Metrics
- **Test Pass Rate**: 100% (399/399)
- **Execution Time**: 3.78초 (목표 30초 대비 8배 개선)
- **Design Match**: 91.6% (파일 100%, 케이스 87.5%)
- **Architecture Compliance**: 95%+

### Documentation
- **계획 문서**: docs/01-plan/features/test-coverage.plan.md
- **설계 문서**: docs/02-design/features/test-coverage.design.md
- **분석 보고서**: docs/03-analysis/test-coverage.analysis.md
- **완료 보고서**: docs/04-report/features/test-coverage.report.md

### Testing Scripts
```bash
pnpm test              # 전체 테스트 실행
pnpm test:watch       # Watch 모드
pnpm test:coverage    # 커버리지 리포트 생성
pnpm test:lib         # lib/ 모듈만 테스트
pnpm test:api         # API routes만 테스트
pnpm test:components  # 컴포넌트만 테스트
```

---

## [2026-03-10] - quality-foundation 품질 기반 구축 완료

### Added
- **Vitest 테스트 프레임워크**: 단위 테스트 인프라 도입
  - `vitest.config.ts` 설정
  - `lib/__tests__/score-validation.test.ts` (게임 점수 검증)
  - `lib/__tests__/auth.test.ts` (관리자 인증)
  - `lib/__tests__/compile-markdown.test.ts` (마크다운 컴파일 + XSS 방지)
  - `test`, `test:watch`, `test:coverage` npm 스크립트

- **보안 강화**:
  - `lib/env.ts`: getDB()/getKV() 통합 — 단일 소스화
  - `lib/admin-rate-limit.ts`: 관리자 API rate limiting
  - `rehype-sanitize` 적용: Stored XSS 방지 (마크다운 컴파일)
  - `dompurify`: Admin 미리보기 XSS 방지
  - Timing-safe 토큰 비교: HMAC + XOR 기반 상수시간 비교

- **접근성 개선**:
  - 4개 테마 text-muted WCAG AA 대비 조정 (4.5:1 이상)
  - 모바일 메뉴: aria-expanded, aria-controls, Escape 키, focus trap
  - Reaction 게임: 키보드 접근 (Enter/Space)
  - ScrollReveal: prefers-reduced-motion 존중

- **SEO 강화**:
  - `app/opengraph-image.tsx`: OG 이미지 동적 생성 (전역 + 블로그)
  - `<time dateTime>` 속성 추가
  - JSON-LD dateModified 필드
  - DesignPicker 접근성: aria-expanded, role="listbox"
  - 게임 컴포넌트: aria-live="polite"

- **성능 최적화**:
  - `next/dynamic`: Header, Footer, GlassBackground lazy loading
  - 블로그 목록: offset/limit 페이지네이션 + Cache-Control 60초
  - 리더보드: Promise.all()로 쿼리 병렬화
  - pageview: KV 단일 조회로 최적화

- **UX 개선**:
  - `app/loading.tsx`, `app/error.tsx`: 루트 + blog/game 로딩/에러 페이지
  - BrutalistHeader: 모바일 메뉴 추가
  - 각 game-content.ts 데이터를 `content/games/*.json`으로 분리

- **문서화**:
  - About 페이지: Next.js 16, Cloudflare Workers, D1 기술 스택 반영
  - CLAUDE.md: Tools 시스템 섹션 추가
  - 구조화 데이터: ArticleJsonLd image, PersonJsonLd 컴포넌트

### Changed
- **API 에러 처리 통일**: 11개 route에 try-catch + JSON 안전 파싱
  - 성공: `{ data, error? }`
  - 에러: `{ error: string }`, status: 400/500

- **보안 헤더 추가** (next.config.ts):
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera/microphone/geolocation 비활성화

- **Auth 시스템**: verifyAdminAuth() async 변환
  - 하드코딩 폴백 제거 → 환경변수 필수화
  - Timing-safe 비교 적용
  - 모든 관리자 API(7개) 업데이트

- **마이그레이션 시스템**:
  - `_migrations` 추적 테이블 추가 (idempotent 보장)
  - game_sessions 미사용 테이블 정리

- **Admin 인증**:
  - slug 포맷 검증: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
  - metadata 크기 제한: JSON 1KB
  - rate limiting: 분당 20회 (관리자), 100회 (pageview)

- **테마 변수**:
  - `--gradient-1/2/3` 모든 테마에 기본값(transparent) 설정
  - highlight.js CSS: CDN → 로컬 파일 (`/styles/github-dark.min.css`)

- **package.json**:
  - 추가: `dompurify`, `@types/dompurify`, `vitest`, `@vitest/coverage-v8`
  - 제거: `next-themes`, `next-mdx-remote`, `gray-matter`
  - 설정: `optimizePackageImports: ['framer-motion']`

### Removed
- 미사용 의존성: next-themes, next-mdx-remote, gray-matter
- 미사용 테이블: game_sessions (D1)
- 중복 API 라우트: /api/admin/analytics/usage (config 통합)
- Non-null assertions: lib/db.ts, lib/scores.ts

### Fixed
- XSS 취약점: Stored XSS (마크다운), Reflected XSS (Admin 미리보기)
- 타이밍 공격: 토큰 비교 시간 의존성 제거
- 접근성 오류: WCAG AA 대비 미달 (text-muted)
- 성능 이슈: pageview 연산 과다 → 2회 DB/KV로 축소
- API 일관성: 에러 처리 형식 통일

### Quality Metrics

**Match Rate**: 29.4% → 90.2% (46/51)

| Phase | 목표 | 구현 | 달성률 |
|-------|:----:|:----:|:------:|
| P0 보안+코드 | 12 | 12 | 100% |
| P1 안정성+UX | 16 | 16 | 100% |
| P2 유지보수 | 15 | 11 | 73.3% |
| P3 문서화 | 8 | 7 | 87.5% |

**의도적 보류**: 5개 (대규모 리팩토링/호환성 미검증 항목)
- CODE-11: API 응답 형식 통일 (범위 큼)
- FE-04: 디자인 컴포넌트 공통화 (구조 상이)
- FE-05: 게임 훅 추출 (로직 독립적)
- FE-06: @tailwindcss/typography (호환성 미검증)
- FE-08: Header/Footer 서버 컴포넌트 (기술 제약)

**완료 보고서**: docs/04-report/features/quality-foundation.report.md

### Testing
- `pnpm test`: 전체 테스트 통과 ✅
- `pnpm build`: 빌드 성공 ✅
- `pnpm lint`: 0 에러 ✅
- CSP 헤더: report-only 모드로 배포 권장

### Documentation
- **Plan**: docs/01-plan/features/quality-foundation.plan.md
- **Design**: docs/02-design/features/quality-foundation.design.md
- **Analysis**: docs/03-analysis/quality-foundation.analysis.md
- **Report**: docs/04-report/features/quality-foundation.report.md

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
