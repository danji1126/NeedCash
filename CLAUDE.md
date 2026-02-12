# NeedCash

프로토타입 허브 - 게임, 블로그, 광고, 이력서 등 다양한 프로토타입을 관리하는 프로젝트.
Backend와 DB는 현재 만들지 않고, 차후 추가 가능한 구조를 유지한다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5 (ESLint flat config)
- **Theme**: next-themes (다크/라이트/커스텀)
- **Animation**: framer-motion (스크롤 인터랙션)
- **Blog**: MDX (next-mdx-remote + shiki 코드 하이라이팅)
- **Font**: Pretendard (본문), Satoshi/Plus Jakarta Sans (헤딩), JetBrains Mono (코드)
- **Mobile**: Flutter 3 (차후 진행)

## 프로젝트 구조

```
apps/
  web/                          # Next.js 앱
    app/                        # App Router
      layout.tsx                # 루트 레이아웃 (테마, 폰트)
      page.tsx                  # 메인 홈페이지
      blog/                     # MDX 블로그
      game/                     # 게임 허브
      ads/                      # 광고 랜딩 페이지
      resume/                   # 이력서
    components/                 # 공유 컴포넌트
      layout/                   # Header, Footer, Nav
      ui/                       # Button, Card, Modal
      theme/                    # ThemeProvider, ThemeSwitcher
    content/                    # MDX 블로그 콘텐츠 (.mdx)
    lib/                        # 유틸리티 (mdx 파싱 등)
    styles/                     # 글로벌 CSS, 테마 변수
    public/                     # 정적 파일 (이미지, 폰트)
  mobile/
    needcash_app/               # Flutter 앱 (차후)
docs/
  01-plan/                      # 기획 문서
  02-design/                    # 설계 문서
  03-analysis/                  # 분석 문서
  04-report/                    # 보고서
  brainstorm/                   # 브레인스토밍 문서 (아이디어, 회의록)
```

## 문서 규칙

- **브레인스토밍/아이디어 문서**: `docs/brainstorm/` 폴더에 생성
- **PDCA 문서**: `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`에 각각 생성
- 브레인스토밍 문서 네이밍: `{주제}.brainstorm.md` (예: `multi-design.brainstorm.md`)

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
# Next.js 개발 서버
cd apps/web && pnpm dev

# 빌드
cd apps/web && pnpm build

# 린트
cd apps/web && pnpm lint

# Flutter (차후)
cd apps/mobile/needcash_app && flutter run
```

## 제약 사항

- Backend/DB 현재 미구현 (차후 API Routes + ORM으로 추가 가능)
- 인증/로그인 없음 (차후 추가)
- 블로그는 MDX 파일 기반 정적 생성
- 게임은 클라이언트 사이드 렌더링
- 모바일 앱은 웹 완성 후 진행
