# NeedCash

프로토타입 허브 - 블로그, 게임, 광고 랜딩, 이력서 등 다양한 프로토타입을 하나의 프로젝트에서 관리합니다.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Blog | MDX (next-mdx-remote + Shiki) |
| Theme | next-themes (Dark / Light) |
| Font | Pretendard, JetBrains Mono |
| Deploy | Cloudflare Pages (Static Export) |

## Pages

- `/` - 메인 홈페이지
- `/blog` - MDX 기반 블로그
- `/game` - 게임 허브 (주사위, 로또)
- `/ads` - 광고 랜딩 페이지
- `/resume` - 이력서

## Getting Started

```bash
# 의존성 설치
cd apps/web && pnpm install

# 개발 서버
pnpm dev

# 프로덕션 빌드
pnpm build

# 린트
pnpm lint
```

## Project Structure

```
apps/web/
  app/            # App Router 페이지
  components/     # 공유 컴포넌트 (layout, ui, theme)
  content/        # MDX 블로그 콘텐츠
  lib/            # 유틸리티 (MDX 파싱, 상수)
  public/         # 정적 파일 (폰트, 이미지)
```

## Deploy

Cloudflare Pages에 정적 사이트로 배포됩니다.

- **Build command**: `cd apps/web && pnpm install && pnpm build`
- **Output directory**: `apps/web/out`

## License

Private
