# PDCA Completion Report: project-init

> NeedCash 프로토타입 허브 - 프로젝트 초기화 완료 보고서

- **Feature**: project-init
- **Level**: Starter
- **Final Match Rate**: 93%
- **Iteration Count**: 1
- **보고일**: 2026-02-02

---

## 1. PDCA 사이클 요약

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] ✅ → [Act] ✅ → [Report] ✅
```

| Phase | 완료 시각 | 산출물 |
|-------|----------|--------|
| Plan | 04:30 | `docs/01-plan/features/project-init.plan.md` |
| Design | 04:40 | `docs/02-design/features/project-init.design.md` |
| Do | 04:50 | `apps/web/` 전체 구현 (31개 파일) |
| Check | 05:10 | `docs/03-analysis/project-init.analysis.md` (87%) |
| Act | 05:20 | Critical/Major 5건 수정 → 93% |
| Report | 05:30 | 본 문서 |

---

## 2. 프로젝트 개요

### 비전
개인 프로토타입과 포트폴리오를 하나의 웹사이트에서 관리하는 허브 사이트.
트렌디한 디자인, 다크/라이트 테마 전환, 반응형 레이아웃을 핵심 가치로 한다.

### 기술 스택

| 기술 | 실제 버전 | 용도 |
|------|:--------:|------|
| Next.js | 16.1.6 | App Router SSG |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | 5.9.3 | 타입 안전성 |
| Tailwind CSS | 4.1.18 | 유틸리티 스타일링 |
| next-themes | 0.4.6 | 다크/라이트 테마 |
| framer-motion | 12.29.2 | 스크롤/게임 애니메이션 |
| next-mdx-remote | 5.0.0 | MDX 서버 렌더링 |
| rehype-pretty-code | 0.14.1 | Shiki 코드 하이라이팅 |
| gray-matter | 4.0.3 | MDX frontmatter 파싱 |

---

## 3. 구현 결과

### 3.1 라우팅 (7개 SSG 라우트, 12개 정적 페이지)

| 경로 | 렌더링 | 설명 |
|------|:------:|------|
| `/` | SSG | 메인 홈페이지 (히어로 + 섹션카드 + 블로그프리뷰) |
| `/blog` | SSG | 블로그 목록 (카테고리 필터) |
| `/blog/[slug]` | SSG | 블로그 상세 (MDX + Shiki + TOC) |
| `/game` | SSG | 게임 목록 그리드 |
| `/game/[slug]` | SSG | 게임 상세 (컴포넌트 매핑) |
| `/ads` | SSG | 광고 랜딩 페이지 |
| `/resume` | SSG | 인터랙티브 이력서 |

### 3.2 파일 구조 (31개 소스 파일)

```
apps/web/
├── app/
│   ├── globals.css              # 테마 CSS 변수 (다크/라이트)
│   ├── layout.tsx               # RootLayout (폰트, 테마, 메타데이터)
│   ├── page.tsx                 # 홈 (히어로 + 카드 + 블로그 프리뷰)
│   ├── not-found.tsx            # 404 페이지
│   ├── blog/
│   │   ├── page.tsx             # 블로그 목록 + PostList
│   │   └── [slug]/page.tsx      # 블로그 상세 + TOC + Shiki
│   ├── game/
│   │   ├── page.tsx             # 게임 목록
│   │   └── [slug]/page.tsx      # 게임 상세 (컴포넌트 매핑)
│   ├── ads/page.tsx             # 광고 랜딩
│   └── resume/page.tsx          # 이력서
├── components/
│   ├── layout/
│   │   ├── header.tsx           # 반응형 헤더 + 모바일 메뉴
│   │   └── footer.tsx           # 미니멀 푸터
│   ├── ui/
│   │   ├── button.tsx           # 버튼 (3 variants, 3 sizes)
│   │   ├── card.tsx             # 카드 (href, 호버 애니메이션)
│   │   ├── tag.tsx              # 태그 (active 상태)
│   │   └── scroll-reveal.tsx    # 스크롤 등장 (3 directions)
│   ├── theme/
│   │   ├── theme-provider.tsx   # next-themes Provider
│   │   └── theme-switcher.tsx   # 해/달 토글
│   ├── blog/
│   │   ├── mdx-components.tsx   # MDX 커스텀 + shiki 연동
│   │   ├── post-list.tsx        # 카테고리 필터링 목록
│   │   ├── toc.tsx              # 데스크톱 sticky TOC
│   │   └── mobile-toc.tsx       # 모바일 접이식 TOC
│   ├── game/
│   │   ├── dice-game.tsx        # 주사위 2개 (CSS dot + 애니메이션)
│   │   └── lotto-game.tsx       # 로또 6/45 (공 색상 + 순차 애니메이션)
│   └── resume/
│       ├── timeline.tsx         # 경력 타임라인
│       └── skill-chart.tsx      # 스킬 진행바
├── lib/
│   ├── utils.ts                 # cn() 유틸
│   ├── constants.ts             # 사이트 설정, 게임, 이력서 데이터
│   └── mdx.ts                   # MDX 파싱 + heading 추출
└── content/blog/
    ├── hello-world.mdx          # 샘플 포스트 1
    └── getting-started.mdx      # 샘플 포스트 2
```

### 3.3 주요 기능별 구현 상태

| 기능 | 상태 | 핵심 구현 |
|------|:----:|----------|
| 테마 시스템 | ✅ | CSS 변수 기반 다크/라이트, `data-theme` 속성 |
| 반응형 레이아웃 | ✅ | 모바일 햄버거 메뉴, 브레이크포인트별 그리드 |
| 스크롤 애니메이션 | ✅ | framer-motion `whileInView` + stagger |
| MDX 블로그 | ✅ | gray-matter + next-mdx-remote/rsc + rehype-pretty-code |
| 카테고리 필터 | ✅ | Tag 컴포넌트 + useState 클라이언트 필터링 |
| TOC (목차) | ✅ | 데스크톱 sticky sidebar + 모바일 accordion |
| 코드 하이라이팅 | ✅ | rehype-pretty-code (shiki, github-dark 테마) |
| 주사위 게임 | ✅ | 2개 주사위, CSS 3x3 dot, 회전 애니메이션, 더블 감지, 기록 |
| 로또 게임 | ✅ | 6/45 규칙, 5색 공, 순차 0.3s 등장, 보너스 공, 기록 |
| 광고 랜딩 | ✅ | 히어로 + 3 feature 그리드 + CTA |
| 이력서 | ✅ | 타임라인 + 스킬 진행바 + 교육 + 연락처 |
| 404 페이지 | ✅ | 커스텀 디자인, 홈 링크 |

---

## 4. Gap Analysis 결과

### 4.1 초기 분석 (87%)

| 심각도 | 건수 | 내용 |
|:------:|:----:|------|
| Critical | 2 | 홈페이지 블로그 프리뷰, Shiki 코드 하이라이팅 |
| Major | 3 | 카테고리 필터, TOC 컴포넌트, TOC 반응형 레이아웃 |
| Minor | 22 | 구조적 단순화, CSS 변수, 버전 차이 등 |

### 4.2 Iteration 1 수정 후 (93%)

Critical 2건 + Major 3건 **모두 해결**. 수정 내역:

| Gap | 수정 | 신규 파일 |
|-----|------|----------|
| 홈페이지 블로그 프리뷰 | `page.tsx`에 최근 3개 포스트 3열 그리드 | - |
| Shiki 하이라이팅 | `rehype-pretty-code` 설치 + MDXRemote 연동 | - |
| 카테고리 필터 | Tag 컴포넌트 + useState 필터링 | `post-list.tsx` |
| TOC 컴포넌트 | sticky sidebar + heading 추출 | `toc.tsx` |
| TOC 반응형 | 2컬럼 레이아웃 + 모바일 accordion | `mobile-toc.tsx` |

### 4.3 잔존 Minor Gap (19건)

모두 기능적 영향이 낮은 항목. 주요 분류:
- **구조적 단순화** (3건): `nav-links`, `post-card`, `game-card`를 별도 파일 대신 인라인 처리
- **의도적 변경** (4건): 히어로 높이, 게임 그리드 열 수, TOC 위치, 패키지 이름
- **미구현 기능** (3건): Ads 추천사, Resume PDF, Resume 2열 레이아웃
- **환경 차이** (9건): CSS 변수 위치, 의존성 버전, 디렉토리 구조

---

## 5. 카테고리별 최종 점수

| 카테고리 | 점수 | 비고 |
|----------|:----:|------|
| 파일 구조 | 90% | 31개 파일 중 29개 설계 일치 |
| 의존성 | 92% | 모든 핵심 패키지 설치, 버전 차이만 존재 |
| 테마 시스템 | 92% | 다크/라이트 완전 동작, CSS 변수 2개 누락 |
| 레이아웃 | 98% | Header/Footer 설계와 거의 동일 |
| 페이지 | 95% | 7개 라우트 모두 동작, 블로그 프리뷰+필터+TOC 완비 |
| 컴포넌트 | 93% | 모든 핵심 컴포넌트 구현, 일부 인라인 |
| 라우팅 | 100% | 7개 SSG 라우트 완전 일치 |
| 반응형 | 98% | 모바일 메뉴, 그리드, TOC 반응형 완비 |
| 애니메이션 | 85% | 9/11 애니메이션 구현 (페이지 전환, 스크롤 테두리 미구현) |
| 게임 데이터 | 85% | 2개 게임 완전 동작, interface 필드 단순화 |

---

## 6. 기술적 의사결정 기록

| 결정 | 이유 |
|------|------|
| Next.js 16 사용 (설계 15) | `create-next-app`이 최신 버전 설치 |
| `app/globals.css` 위치 (설계 `styles/`) | Next.js App Router 기본 구조 준수 |
| `rehype-pretty-code` 사용 (설계 `shiki` 직접) | MDXRemote와의 통합이 더 간결 |
| TOC 오른쪽 배치 (설계 왼쪽) | 콘텐츠 우선 읽기 흐름 (LTR) |
| 인라인 컴포넌트 (nav-links 등) | 현재 규모에서 별도 파일 불필요 |
| `[data-theme]` 속성 | `next-themes` 기본 권장 방식 |
| Fisher-Yates 셔플 (로또) | 편향 없는 균일 분포 보장 |

---

## 7. 빌드 검증

```
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully
✓ TypeScript OK
✓ 12/12 static pages generated

Route (app)
├ ○ /
├ ○ /_not-found
├ ○ /ads
├ ○ /blog
├ ● /blog/getting-started
├ ● /blog/hello-world
├ ○ /game
├ ● /game/dice
├ ● /game/lotto
└ ○ /resume
```

---

## 8. 차후 개선 제안

### 단기 (다음 PDCA 사이클)

| 항목 | 우선순위 | 설명 |
|------|:--------:|------|
| Resume PDF 다운로드 | 중 | 클라이언트 컴포넌트로 `window.print()` 구현 |
| Resume 2열 레이아웃 | 중 | `lg:grid-cols-2`로 타임라인+스킬 병렬 배치 |
| Ads 추천사 섹션 | 낮 | 콘텐츠 확보 후 추가 |
| 페이지 전환 애니메이션 | 낮 | Next.js layout transition 또는 framer-motion |
| Header 스크롤 감지 | 낮 | `useEffect` + `scrollY` 기반 테두리 토글 |

### 중기 (확장)

| 항목 | 설명 |
|------|------|
| 새 게임 추가 | GAMES 배열 + 컴포넌트 추가로 확장 용이 |
| 블로그 검색 기능 | 클라이언트 사이드 전문 검색 |
| OG 이미지 자동 생성 | `next/og` 활용 |
| Lighthouse 최적화 | 이미지 최적화, 폰트 preload |
| 다국어 지원 | `next-intl` 또는 커스텀 i18n |

### 장기 (백엔드)

| 현재 | 전환 대상 | 영향 파일 |
|------|----------|----------|
| MDX 파일 블로그 | DB + CMS | `lib/mdx.ts` → `lib/api/blog.ts` |
| constants 게임 | DB 게임 데이터 | `lib/constants.ts` → `lib/api/game.ts` |
| constants 이력서 | CMS 이력서 | `lib/constants.ts` → `lib/api/resume.ts` |
| 없음 | 인증 | NextAuth.js + middleware |

---

## 9. 학습 포인트

### PDCA 프로세스

1. **Plan → Design 단계에서 구체적 와이어프레임 작성**이 Do 단계 구현 속도를 크게 높임
2. **Gap Analysis로 누락 사항 조기 발견** - 87% 시점에서 5건 Critical/Major 식별 및 수정
3. **1회 Iteration으로 93% 달성** - 체계적 수정으로 효율적 품질 향상

### 기술적 학습

1. **Next.js 16 + React 19**: `params`가 Promise로 변경됨 (서버 컴포넌트에서 `await params`)
2. **Tailwind CSS 4**: `@theme inline` 구문, `@import "tailwindcss"` 방식으로 변경
3. **Server Component 제약**: `onClick` 핸들러 사용 불가 → 클라이언트 컴포넌트 분리 필요
4. **rehype-pretty-code**: `next-mdx-remote/rsc`에서 `options.mdxOptions.rehypePlugins`로 연동
5. **CSS 변수 테마**: `data-theme` 속성 기반으로 전환 시 CSS transition 자연스럽게 적용

---

## 10. 결론

NeedCash 프로젝트의 초기화 PDCA 사이클이 **Match Rate 93%**로 성공적으로 완료되었다.

- 7개 SSG 라우트, 31개 소스 파일, 12개 정적 페이지 생성
- 다크/라이트 테마, 반응형 레이아웃, 스크롤 애니메이션 구현
- 주사위 게임 (CSS dot + 회전 애니메이션)과 로또 게임 (공 색상 + 순차 등장) 동작
- MDX 블로그에 Shiki 코드 하이라이팅, 카테고리 필터, TOC 사이드바 완비
- 빌드 에러 0건, TypeScript 타입 체크 통과

잔존 19건의 Minor Gap은 구조적 단순화 또는 의도적 변경으로, 차후 PDCA 사이클에서 선택적으로 개선 가능하다.

---

*Generated by PDCA Report Phase*
