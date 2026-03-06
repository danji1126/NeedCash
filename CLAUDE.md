# NeedCash

프로토타입 허브 - 게임, 블로그, 이력서 등 다양한 프로토타입을 관리하는 프로젝트.

## 사이트 정보

- **도메인**: https://needcash.dev
- **배포**: Cloudflare Workers (@opennextjs/cloudflare)
- **빌드 설정**: `apps/web/wrangler.toml` (Workers 설정), `apps/web/open-next.config.ts` (OpenNext 설정)

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5 (ESLint 9 flat config)
- **Theme**: next-themes (다크/라이트/커스텀)
- **Animation**: framer-motion (스크롤 인터랙션)
- **Blog**: Cloudflare D1 + Admin CMS (기존 글: shiki, 신규 글: rehype-highlight)
- **Database**: Cloudflare D1 (needcash-blog)
- **Font**: Pretendard (본문), Satoshi/Plus Jakarta Sans (헤딩), JetBrains Mono (코드)
- **Utilities**: clsx, tailwind-merge
- **AI**: @teachablemachine/image (동물상 찾기 게임)
- **Mobile**: Flutter 3 (차후 진행)

## 프로젝트 구조

```
apps/
  web/                          # Next.js 앱
    app/                        # App Router
      layout.tsx                # 루트 레이아웃 (테마, 폰트, PageViewTracker)
      page.tsx                  # 메인 홈페이지
      blog/                     # 블로그 (/blog, /blog/[slug]) - D1 SSR
      game/                     # 게임 허브 (/game, /game/[slug])
      resume/                   # 이력서 (/resume, /resume/[lang])
      admin/                    # Admin CMS (/admin, /admin/blog, /admin/analytics)
      api/                      # API Routes
        posts/                  # GET/POST /api/posts, GET/PUT/DELETE /api/posts/[slug]
        auth/verify/            # GET /api/auth/verify (Admin 인증)
        scores/                 # POST /api/scores, GET /api/scores/[game]
        analytics/              # GET /api/analytics/config, POST /api/analytics/pageview
        admin/analytics/        # GET/PUT /api/admin/analytics/config, GET /api/admin/analytics/usage
      about/                    # 소개 페이지
      privacy/                  # 개인정보처리방침
      terms/                    # 이용약관
      not-found.tsx             # 404 페이지
      sitemap.ts                # 동적 사이트맵 생성 (D1 SSR)
      robots.ts                 # robots.txt 생성 (/admin 차단)
    components/
      layout/                   # Header, Footer (디자인별 변형 포함)
        header/                 # editorial-, bento-, brutalist-, glass-header
        footer/                 # editorial-, bento-, brutalist-, glass-footer
        hero/                   # editorial-, bento-, brutalist-, glass-hero
        section-grid/           # editorial-, bento-, brutalist-, glass-grid
        posts-section/          # editorial-, bento-, brutalist-, glass-posts
      home/                     # 홈페이지 (디자인별: editorial, bento, brutalist, glass)
      design/                   # DesignProvider, DesignPicker, GlassBackground
      game/                     # 게임 컴포넌트 + 리더보드/히스토리/점수제출
      blog/                     # 블로그 컴포넌트 (toc, post-list, related-posts)
      admin/                    # Admin 컴포넌트 (auth-provider, post-form, analytics-*)
      analytics/                # page-view-tracker (sendBeacon 페이지뷰)
      resume/                   # 이력서 컴포넌트 (skill-chart, timeline, language-switcher)
      seo/                      # JSON-LD 구조화 데이터
      ui/                       # Button, Card, Tag, Icons, ScrollReveal, Breadcrumb, CookieConsent
    content/
      blog/                     # MDX 블로그 콘텐츠 (.mdx, 레거시 - D1 마이그레이션 완료)
      resume/                   # 이력서 JSON (ko, en, th, vi, ja)
    migrations/
      0001_create_posts.sql     # D1 posts 테이블 스키마
      0002_seed_data.sql        # MDX → D1 시드 데이터
      0003_create_analytics.sql # visitors, game_scores, game_sessions, analytics_counters
    lib/
      constants.ts              # SITE, NAV_LINKS, GAMES, RESUME 데이터
      db.ts                     # D1 쿼리 함수 (getAllPosts, getPostBySlug, CRUD)
      local-db.ts               # 로컬 SQLite (better-sqlite3) D1 호환 래퍼
      mdx.ts                    # D1 re-export + extractHeadings
      auth.ts                   # Admin Bearer token 인증
      compile-markdown.ts       # Markdown → HTML (rehype-highlight, Workers 호환)
      utils.ts                  # 공통 유틸리티
      game-content.ts           # 게임별 콘텐츠 데이터
      scores.ts                 # D1 점수 CRUD (submitScore, getLeaderboard, checkRateLimit)
      score-validation.ts       # 점수 범위/닉네임 검증 유틸
      analytics.ts              # 통계 수집 토글/카운터/자동차단
      game-history.ts           # localStorage 개인 게임 히스토리
      anonymous-id.ts           # 클라이언트 익명 ID (localStorage)
      visitor.ts                # 서버 HttpOnly 쿠키 (ncv_id)
      design/                   # 멀티 디자인 시스템 (editorial, bento, brutalist, glass)
      i18n/                     # 다국어 지원 (languages, resume-labels)
    public/                     # 정적 파일 (이미지, 폰트)
  mobile/
    needcash_app/               # Flutter 앱 (차후)
docs/
  01-plan/                      # 기획 문서
  02-design/                    # 설계 문서
  03-analysis/                  # 분석 문서
  04-report/                    # 보고서 (changelog.md 포함)
  brainstorm/                   # 브레인스토밍 문서 (아이디어, 회의록)
  data/                         # 원본 데이터 (resume.txt 등)
```

## 멀티 디자인 시스템

4가지 디자인 테마를 사용자가 전환 가능:
- **Editorial**: 타이포그래피 중심, 에디토리얼 매거진 스타일
- **Bento**: 벤토 그리드 레이아웃
- **Brutalist**: 브루탈리스트 흑백 미학
- **Glass**: 글래스모피즘 반투명 효과

디자인 관련 코드: `lib/design/` (디자인 정의), `components/design/` (Provider, Picker)
각 레이아웃 컴포넌트는 `{design}-{component}.tsx` 네이밍 사용.

## 게임 목록

| slug | title | 유형 | 리더보드 | 컴포넌트 |
|------|-------|------|----------|----------|
| dice | Dice Roller | 운 | ❌ | dice-game.tsx |
| lotto | Lotto Pick | 운 | ❌ | lotto-game.tsx |
| animal-face | 동물상 찾기 | AI | ❌ | animal-face.tsx |
| reaction | Reaction Test | 반응속도 | ✅ (ASC, ms) | reaction-game.tsx |
| color-sense | Color Sense Test | 색감 | ✅ (DESC, level) | color-sense-game.tsx |
| color-memory | Color Memory | 기억력 | ✅ (DESC, level) | color-memory-game.tsx |
| typing | Typing Speed | 타자 | ✅ (DESC, WPM) | typing-game.tsx |
| math | Math Challenge | 암산 | ✅ (DESC, 문제) | math-game.tsx |
| quiz | Personality Quiz | 성격 | ❌ | personality-quiz.tsx |

게임 추가 절차: `icons.tsx`(아이콘) → `constants.ts`(GAMES 배열) → `[slug]/page.tsx`(dynamic import)
리더보드 지원 게임 추가 시: `score-validation.ts`(SCORE_ORDER, SCORE_RANGES 등)에도 등록

## 다국어 이력서

지원 언어: 한국어(ko, 기본), English(en), 日本語(ja), ไทย(th), Tiếng Việt(vi)
데이터: `content/resume/resume.{lang}.json`

## SEO 인프라

- `sitemap.ts`: 정적 페이지 + 블로그 + 게임 + 이력서 동적 생성
- `robots.ts`: 크롤러 접근 규칙
- `components/seo/json-ld.tsx`: 구조화 데이터
- `components/ui/breadcrumb.tsx`: 탐색 경로
- OG 태그: 각 페이지 metadata에 설정

## 문서 규칙

- **브레인스토밍/아이디어 문서**: `docs/brainstorm/` 폴더에 생성
- **PDCA 문서**: `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`에 각각 생성
- 브레인스토밍 문서 네이밍: `{주제}.brainstorm.md` (예: `backend-hosting.brainstorm.md`)
- 변경 이력: `docs/04-report/changelog.md`에 기록

## 디자인 가이드

참고 사이트:
- https://httpster.net/ (타이포그래피 중심, 미니멀, 비표준 레이아웃)
- https://www.designspiration.com/ (모듈식 그리드, 흑백 미학)
- https://savee.it/ (미니멀리스트, 깔끔한 UI)
- https://www.cosmos.so/ (다크 테마, 고해상도, 세련된 타이포)

디자인 원칙:
- **타이포그래피 퍼스트**: 대담한 서체, 폰트가 디자인의 핵심
- **미니멀 레이아웃**: 여백 충분히 활용, 콘텐츠 집중
- **스크롤 인터랙션**: 부드러운 등장/전환 애니메이션
- **다크 모드 기본**: 기본 다크 + 라이트 전환 지원
- **반응형 필수**: 320px(모바일) ~ 1920px(데스크톱) 대응

## 개발 커맨드

```bash
# Next.js 개발 서버 (로컬 SQLite 사용)
cd apps/web && pnpm dev

# 빌드
cd apps/web && pnpm build

# Workers 로컬 프리뷰 (Cloudflare 바인딩 사용)
cd apps/web && pnpm preview

# Workers 배포
cd apps/web && pnpm cf-deploy

# 린트
cd apps/web && pnpm lint

# D1 마이그레이션 적용 (운영)
cd apps/web && wrangler d1 migrations apply needcash-blog

# KV namespace 생성 (최초 1회)
wrangler kv namespace create SITE_CONFIG

# Flutter (차후)
cd apps/mobile/needcash_app && flutter run
```

## 로컬 개발 환경 (Local Dev)

### 환경 분기 구조

`USE_LOCAL_DB` 환경변수로 로컬/운영 환경을 분기한다.

| 환경 | `USE_LOCAL_DB` | DB | KV | AE | 인증 |
|------|----------------|----|----|----|----|
| `pnpm dev` | `true` (.env.development) | better-sqlite3 (`data/local.sqlite`) | in-memory Map (싱글톤) | 미사용 | `dev-secret-key` |
| `pnpm preview` | `false` (wrangler 바인딩) | Cloudflare D1 | Cloudflare KV | Analytics Engine | wrangler secret |
| 운영 (Workers) | `false` | Cloudflare D1 | Cloudflare KV | Analytics Engine | wrangler secret |

### 환경 설정 파일

- **`.env.development`**: 로컬 개발용 (`USE_LOCAL_DB=true`, `ADMIN_API_KEY=dev-secret-key`)
- **`wrangler.toml`**: Cloudflare 바인딩 (D1, KV, AE)
- **`cloudflare-env.d.ts`**: CloudflareEnv 타입 선언 (DB, ASSETS, ADMIN_API_KEY, SITE_CONFIG, ANALYTICS)

### 로컬 DB 동작 방식

- `lib/local-db.ts`: better-sqlite3를 D1 호환 래퍼로 감싸서 `.prepare()`, `.bind()`, `.all()`, `.first()`, `.run()`, `.batch()`, `.exec()` 지원
- `migrations/` 폴더의 `.sql` 파일을 자동 실행 (`CREATE IF NOT EXISTS`로 멱등성 보장)
- DB 파일 위치: `apps/web/data/local.sqlite` (`.gitignore`에 포함)
- KV Mock: `analytics.ts` 내부의 싱글톤 `Map<string, string>` (프로세스 재시작 시 초기화)

### 새 기능 개발 시 로컬 호환 체크리스트

서버 사이드에서 Cloudflare 바인딩(D1, KV, AE)을 사용하는 코드를 작성할 때:

1. **DB 접근**: `getDB()` 헬퍼 사용 → `USE_LOCAL_DB` 분기 자동 처리
2. **KV 접근**: `getKV()` 헬퍼 사용 → 로컬에서는 in-memory Map
3. **AE 접근**: `process.env.USE_LOCAL_DB !== "true"` 가드로 감싸기
4. **인증**: `verifyAdminAuth()` 내부에서 `.env` 또는 wrangler secret 자동 분기
5. **마이그레이션**: `migrations/` 에 `.sql` 추가하면 로컬 DB 자동 반영
6. **`getDB()` 패턴 복사**: 기존 `lib/db.ts` 또는 `lib/scores.ts` 하단의 `getDB()` 참고

```typescript
// 패턴: 서버 사이드 Cloudflare 바인딩 접근
function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}
```

### 주의사항

- **`export const runtime = "edge"` 사용 금지** — `local-db.ts`가 Node.js `fs`/`better-sqlite3`를 사용하므로 edge runtime과 호환 불가. 운영 배포 시 `@opennextjs/cloudflare`가 자동으로 Workers에서 실행하므로 명시 불필요.
- 로컬 KV는 in-memory이므로 프로세스 재시작 시 설정값 초기화 (analytics_enabled 등)
- Analytics Engine은 로컬에서 미사용 → pageview API는 카운터만 증가, AE 기록 생략
- `local-db.ts`의 `batch()`는 순차 실행 (D1은 트랜잭션 배치)
- `data/local.sqlite` 삭제 시 마이그레이션 재실행으로 테이블 자동 생성

## 블로그 시스템

- **저장소**: Cloudflare D1 (`needcash-blog` 데이터베이스)
- **기존 글**: `rehype-pretty-code`(shiki)로 컴파일된 HTML (인라인 style)
- **신규 글**: `rehype-highlight`(highlight.js)로 컴파일된 HTML (class 기반)
- **Admin**: `/admin` - API Key 인증, 포스트 CRUD, Markdown 에디터 + 미리보기
- **API**: `/api/posts` (GET/POST), `/api/posts/[slug]` (GET/PUT/DELETE), `/api/auth/verify` (GET)
- **인증**: Bearer token (`ADMIN_API_KEY` wrangler secret), localStorage에 저장
- **D1 바인딩**: `wrangler.toml` → `env.DB`, `cloudflare-env.d.ts`에 타입 선언
- **마이그레이션**: `scripts/migrate-blog-to-d1.mjs` → `migrations/0002_seed_data.sql`

## 리더보드 & 통계 시스템

- **리더보드**: 5개 rankable 게임 (reaction, typing, math, color-sense, color-memory)
- **점수 제출**: `POST /api/scores` → 서버에서 범위 검증 + 닉네임 검증 + 60초 rate limit
- **리더보드 조회**: `GET /api/scores/[game]` → Cache-Control 60초 + 내 순위 포함
- **개인 히스토리**: localStorage (`needcash-game-history`) → `GameHistoryPanel` 컴포넌트
- **결과 화면**: `GameResultPanel`이 ScoreSubmit + ShareResult + Leaderboard + GameHistoryPanel 통합
- **익명 식별**: 서버 HttpOnly 쿠키 (`ncv_id`) + 클라이언트 localStorage (`needcash-anonymous-id`)
- **통계 수집**: `PageViewTracker` (sendBeacon) → `/api/analytics/pageview`
- **Admin 토글**: `/admin/analytics` → KV 기반 ON/OFF + D1 카운터 + 자동 차단 (90% 임계치)
- **Cloudflare 바인딩**: D1 (`DB`), KV (`SITE_CONFIG`), Analytics Engine (`ANALYTICS`)

## 제약 사항

- 게임은 클라이언트 사이드 렌더링 ("use client")
- 모바일 앱은 웹 완성 후 진행
- D1 접근이 필요한 라우트는 `force-dynamic` 설정 (빌드타임 D1 접근 불가)
- Admin 인증은 환경변수 API Key 방식 (사용자 계정 시스템 없음)
