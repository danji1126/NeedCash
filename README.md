# NeedCash

프로토타입 허브 - 블로그, 게임, 이력서 등 다양한 프로토타입을 하나의 프로젝트에서 관리합니다.

**Live**: https://needcash-hub.danji1126.workers.dev

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| React | 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Blog | Cloudflare D1 + Admin CMS |
| Database | Cloudflare D1 (SQLite) |
| Theme | next-themes (Dark / Light / 4 Design Themes) |
| Font | Pretendard (본문), Satoshi / Plus Jakarta Sans (헤딩), JetBrains Mono (코드) |
| AI | @teachablemachine/image (동물상 찾기) |
| Deploy | Cloudflare Workers (@opennextjs/cloudflare) |

## Pages

- `/` - 메인 홈페이지 (4가지 디자인 테마 전환 가능)
- `/blog` - D1 기반 블로그 (SSR)
- `/game` - 게임 허브 (주사위, 로또, 동물상 찾기, 반응속도, 색감, 색기억력)
- `/resume` - 다국어 이력서 (ko, en, ja, th, vi)
- `/admin` - Admin CMS (블로그 CRUD, API Key 인증)
- `/about` - 소개 페이지
- `/privacy` - 개인정보처리방침
- `/terms` - 이용약관

## Prerequisites

| Tool | Version | 설치 방법 |
|------|---------|----------|
| Node.js | >= 22 | https://nodejs.org/ 또는 `nvm install 22` |
| pnpm | >= 10 | `corepack enable && corepack prepare pnpm@latest --activate` |
| Wrangler | >= 3 | `pnpm add -g wrangler` (배포 시 필요) |

## Getting Started

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd NeedCash
cd apps/web && pnpm install
```

### 2. 로컬 개발 서버 (Local SQLite)

D1 없이 로컬에서 블로그/Admin/sitemap을 테스트할 수 있습니다.

```bash
cd apps/web

# .env.local이 이미 설정되어 있음 (USE_LOCAL_DB=true)
# 개발 서버 시작
pnpm dev
```

첫 실행 시 자동으로:
- `data/local.sqlite` 파일 생성
- `migrations/` 폴더의 SQL 자동 실행 (테이블 생성 + 시드 데이터)
- WAL 모드 + foreign_keys 활성화

주요 URL:
- http://localhost:3000 - 메인 페이지
- http://localhost:3000/blog - 블로그 (로컬 SQLite)
- http://localhost:3000/admin - Admin CMS (API Key: `dev-secret-key`)
- http://localhost:3000/sitemap.xml - 동적 사이트맵

로컬 DB 초기화 (데이터 리셋):
```bash
pnpm db:reset
# 다음 pnpm dev 실행 시 자동 재생성
```

### 3. Cloudflare Workers 로컬 프리뷰

실제 D1 바인딩과 Workers 런타임으로 테스트합니다.

```bash
cd apps/web

# Wrangler 로그인 (최초 1회)
wrangler login

# Workers 로컬 프리뷰
pnpm preview
```

## Environment Variables

### 로컬 개발 (`apps/web/.env.local`)

```env
USE_LOCAL_DB=true
ADMIN_API_KEY=dev-secret-key
```

### 프로덕션 (Cloudflare Workers)

```bash
# Admin API Key 설정 (Wrangler Secret)
wrangler secret put ADMIN_API_KEY
```

D1 바인딩은 `wrangler.toml`에 설정되어 있습니다.

## Production Deployment

### Cloudflare Workers 배포

```bash
cd apps/web

# Wrangler 로그인 (최초 1회)
wrangler login

# D1 마이그레이션 실행 (스키마 변경 시)
wrangler d1 execute needcash-blog --remote --file=migrations/0001_create_posts.sql
wrangler d1 execute needcash-blog --remote --file=migrations/0002_seed_data.sql

# 빌드 + 배포 (한 번에)
pnpm cf-deploy
```

`pnpm cf-deploy`는 내부적으로 다음을 수행합니다:
1. `opennextjs-cloudflare build` - Next.js를 Workers 호환 형태로 빌드
2. `opennextjs-cloudflare deploy` - Cloudflare Workers에 배포

배포 설정:
- **Worker 이름**: `needcash-hub`
- **Workers URL**: `needcash-hub.danji1126.workers.dev`
- **D1 데이터베이스**: `needcash-blog`

## Project Structure

```
NeedCash/
  apps/
    web/                        # Next.js 앱
      app/                      # App Router
        blog/                   # 블로그 (D1 SSR)
        game/                   # 게임 허브
        resume/                 # 다국어 이력서
        admin/                  # Admin CMS
        api/                    # API Routes (posts, auth)
        sitemap.ts              # 동적 사이트맵
      components/
        layout/                 # Header, Footer (디자인별 변형)
        home/                   # 홈페이지 (editorial, bento, brutalist, glass)
        design/                 # DesignProvider, DesignPicker
        game/                   # 게임 컴포넌트
        blog/                   # 블로그 컴포넌트
        admin/                  # Admin 컴포넌트
        resume/                 # 이력서 컴포넌트
        ui/                     # 공통 UI (Button, Card, ScrollReveal 등)
      content/
        resume/                 # 이력서 JSON (ko, en, ja, th, vi)
      migrations/               # D1 SQL 마이그레이션
      lib/
        db.ts                   # D1 쿼리 (로컬 SQLite 자동 분기)
        local-db.ts             # D1 호환 SQLite 래퍼 (dev only)
        auth.ts                 # Admin 인증
        compile-markdown.ts     # Markdown -> HTML
        constants.ts            # 사이트 상수
        design/                 # 멀티 디자인 시스템
      data/                     # 로컬 SQLite DB (gitignored)
  docs/                         # PDCA 문서 (Plan, Design, Analysis, Report)
```

## Design Themes

4가지 디자인 테마를 실시간 전환할 수 있습니다:

| Theme | Style |
|-------|-------|
| Editorial | 타이포그래피 중심 매거진 스타일 |
| Bento | 벤토 그리드 레이아웃 |
| Brutalist | 흑백 브루탈리스트 미학 |
| Glass | 글래스모피즘 반투명 효과 |

## Games

| Slug | Title | Type |
|------|-------|------|
| dice | Dice Roller | 운 |
| lotto | Lotto Pick | 운 |
| animal-face | 동물상 찾기 | AI |
| reaction | Reaction Test | 반응속도 |
| color-sense | Color Sense Test | 색감 |
| color-memory | Color Memory | 기억력 |

## Commands

```bash
pnpm dev          # 개발 서버 (로컬 SQLite)
pnpm build        # Next.js 빌드
pnpm preview      # Cloudflare Workers 로컬 프리뷰
pnpm cf-deploy    # Cloudflare Workers 배포
pnpm lint         # ESLint
pnpm db:reset     # 로컬 SQLite 초기화
```

## License

Private
