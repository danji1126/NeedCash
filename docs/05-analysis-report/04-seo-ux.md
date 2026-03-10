# SEO/UX팀 분석 보고서

> 분석일: 2026-03-10

## 1. SEO 분석

### 1.1 Metadata 설정

| 페이지 | title | description | OG | 상태 |
|--------|-------|-------------|-----|------|
| 루트 레이아웃 | ✅ `SITE.name` + template | ✅ `SITE.description` | ✅ 완전 설정 | 양호 |
| About | ✅ "About" | ✅ "NeedCash 소개 및 연락처" | 상속 | 양호 |
| Blog | 확인 필요 | 확인 필요 | - | - |
| Game | 확인 필요 | 확인 필요 | - | - |
| Resume | 확인 필요 | 확인 필요 | - | - |

**루트 레이아웃 메타데이터 (양호):**
```typescript
metadata: {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  openGraph: { type: "website", locale: "ko_KR", ... },
  twitter: { card: "summary_large_image", ... },
  alternates: { canonical: "./" },
  other: { "google-adsense-account": "...", "mobile-web-app-capable": "yes" }
}
```

### 1.2 구조화 데이터

`components/seo/json-ld.tsx`에서 WebSite JSON-LD 제공:
- 루트 레이아웃에 `<WebSiteJsonLd />` 포함 ✅
- 블로그 포스트별 Article JSON-LD 추가 권장

### 1.3 사이트맵 & Robots

- `app/sitemap.ts`: 정적 페이지 + D1에서 동적 블로그/게임 URL 생성 ✅
- `app/robots.ts`: `/admin` 경로 차단 ✅
- `alternates.canonical` 설정 ✅

### 1.4 SEO 강점
- Breadcrumb 컴포넌트 존재 (`components/ui/breadcrumb.tsx`)
- SSR 기반 블로그 → 검색엔진 크롤링 우수
- `<html lang="ko">` 적절한 언어 설정
- Google Adsense 계정 연결

### 1.5 SEO 개선점
1. **OG 이미지 미설정**: 각 페이지별 고유 OG 이미지 생성 권장 (Next.js `opengraph-image.tsx` 활용)
2. **블로그 포스트 Article JSON-LD**: 작성자, 발행일, 카테고리 포함
3. **다국어 이력서 hreflang**: `/resume/ko`, `/resume/en` 등에 alternate hreflang 태그 추가
4. **게임 페이지 메타**: 각 게임별 고유 description + 키워드

## 2. 접근성 분석

### 2.1 양호한 부분

| 항목 | 구현 | 상태 |
|------|------|------|
| Skip Navigation | `<a href="#main-content">본문으로 건너뛰기</a>` | ✅ |
| Focus Visible | `:focus-visible` 스타일 (accent 색상) | ✅ |
| Focus Non-visible | `:focus:not(:focus-visible)` outline 제거 | ✅ |
| 키보드 네비게이션 | focus-visible 스타일 + skip link | ✅ 기본 지원 |
| Reduced Motion | `@media (prefers-reduced-motion: reduce)` | ✅ |
| Font Swap | `display: "swap"` | ✅ |
| Viewport | `maximumScale: 5` (줌 차단 없음) | ✅ |
| 외부 링크 | `target="_blank" rel="noopener noreferrer"` | ✅ |

### 2.2 개선 필요

| 항목 | 현재 상태 | 권고 |
|------|-----------|------|
| TOC nav | `<nav>` 태그만, aria-label 없음 | `aria-label="목차"` 추가 |
| MobileToc 토글 | `<button>` 사용 ✅, aria-expanded 없음 | `aria-expanded={open}` 추가 |
| 디자인 Picker | 확인 필요 | aria-label, role="radiogroup" 검토 |
| 게임 인터랙션 | 시각 의존적 게임 (Color Sense, Color Memory) | aria-live 영역으로 결과 알림 |
| 이미지 alt | 확인 필요 | 모든 이미지에 의미 있는 alt 텍스트 |
| 색상 대비 | 다크 테마 기본 → `text-muted` 대비 확인 필요 | WCAG AA 기준 4.5:1 검증 |

### 2.3 색상 대비 분석 (CSS Variables 기준)

**Editorial Dark 테마:**
- `--text: #E0E0E0` on `--bg: #0A0A0A` → 대비 약 17:1 ✅
- `--text-muted: #555` on `--bg: #0A0A0A` → 대비 약 3.5:1 ⚠️ (AA 미달)

**Brutalist Terminal 테마:**
- `--text: #33FF33` on `--bg: #0A0A0A` → 대비 약 10:1 ✅
- `--text-muted: #1A661A` on `--bg: #0A0A0A` → 대비 약 3.2:1 ⚠️

**권고**: `text-muted` 색상의 밝기를 조정하여 최소 4.5:1 대비 확보

## 3. UX 분석

### 3.1 네비게이션 구조

```
Header: [NeedCash] [Blog] [Game] [Resume] [About] [디자인 Picker]
Footer: 사이트 링크 + SNS + 법적 안내
Breadcrumb: 블로그/게임 상세에서 경로 표시
```

- 4가지 디자인에 맞는 Header/Footer 변형 제공
- 모바일 햄버거 메뉴 존재 여부 확인 필요

### 3.2 로딩 상태

| 영역 | 로딩 처리 | 상태 |
|------|-----------|------|
| 블로그 목록 | SSR (서버 렌더링) | ✅ |
| 블로그 상세 | SSR | ✅ |
| 게임 | dynamic import + "use client" | ⚠️ 로딩 인디케이터 확인 필요 |
| 리더보드 | 클라이언트 fetch | ⚠️ 스켈레톤/로딩 상태 확인 필요 |
| Admin | 클라이언트 fetch | ⚠️ |

### 3.3 에러 상태

| 유형 | 구현 | 상태 |
|------|------|------|
| 404 | `not-found.tsx` 커스텀 페이지 | ✅ |
| 500 | Next.js 기본 에러 페이지 | ⚠️ 커스텀 error.tsx 추가 권장 |
| API 에러 | 클라이언트 처리 | 확인 필요 |

### 3.4 멀티 디자인 시스템 UX

**강점:**
- localStorage 기반 즉시 적용 (FOUC 방지 인라인 스크립트)
- 디자인 전환 시 CSS transition으로 부드러운 전환
- 각 디자인이 일관된 구조를 유지하면서 고유한 미학 제공

**약점:**
- 디자인 Picker가 하단에 위치 → 첫 방문자가 발견하기 어려울 수 있음
- 11개 서브테마 선택이 사용자에게 과부하가 될 수 있음
- 디자인 전환 시 레이아웃 시프트 가능성 (radius, shadow 변경)

### 3.5 반응형 디자인

| 브레이크포인트 | 용도 |
|---------------|------|
| 기본 | 모바일 (320px~) |
| md (768px) | 폰트 크기 16px 전환 |
| lg (1024px) | 2컬럼 레이아웃 (블로그 TOC) |

- `html { font-size: 15px }` → `md: 16px` 반응형 타이포그래피 ✅
- `max-w-3xl` 콘텐츠 너비 제한 ✅
- MobileToc: `lg:hidden`으로 모바일 전용 표시 ✅

### 3.6 About 페이지 정보 불일치

현재 About 페이지의 기술 스택 정보가 구식:
- "Next.js 15" → 실제 16.1.6
- "Static Export" → 실제 Cloudflare Workers
- "MDX (블로그 콘텐츠)" → 실제 D1 + Markdown
- "Cloudflare Pages (호스팅)" → 실제 Cloudflare Workers

## 4. 개선 우선순위

### P0 (즉시)
1. **text-muted 색상 대비 개선**: 다수 테마에서 WCAG AA 4.5:1 미달
   - brutal-terminal: `#3D6A3D` on `#0A0E0A` → ~2.5:1
   - editorial-dark: `#666666` on `#0a0a0a` → ~3.9:1
   - glass-aurora: `#6060A0` on `#0A0A1A` → ~3.0:1
   - glass-ocean: `#3D5A73` on `#0A1628` → ~2.8:1
2. **`loading.tsx` / `error.tsx` 추가**: 전체 app에 하나도 없음 → D1 SSR 페이지에서 로딩 피드백 없음
3. **About 페이지 기술 스택 업데이트**: "Next.js 15" → 16, "Static Export" → Workers, "MDX" → D1

### P1 (중요)
4. **OG 이미지 생성**: 모든 페이지에 OG 이미지가 없음 → 소셜 공유 시 미리보기 없음
5. **모바일 메뉴 접근성**: `aria-expanded` 누락, focus trap 없음, Escape 키 미지원 (3개 헤더)
6. **BrutalistHeader 모바일 메뉴 추가**: 유일하게 햄버거 메뉴 없는 헤더
7. **Reaction 게임 키보드 접근성**: `onPointerDown` 사용 → 키보드 유저 완전 차단
8. **ScrollReveal + prefers-reduced-motion**: framer-motion은 CSS가 아닌 JS → `useReducedMotion()` 훅 필요
9. **`<time datetime>` 속성 추가**: 블로그 날짜에 `datetime` 속성 누락
10. **Article JSON-LD에 `dateModified` 추가**: `post.updatedAt` 데이터 존재하나 미사용

### P2 (권장)
11. **사이트맵 lastModified 수정**: 게임/이력서 페이지에 `new Date()` 사용 → 고정 날짜로 교체
12. **DesignPicker 접근성**: `aria-expanded`, Escape 키, 테마 스와치에 텍스트 라벨 추가
13. **현재 페이지 표시**: 4개 헤더 모두 active link indicator 없음
14. **Cookie consent `role` 추가**: `role="alertdialog"` 또는 `role="dialog"`
15. **WebSite JSON-LD에 SearchAction 추가**: 사이트링크 검색 활성화
16. **Person JSON-LD**: 이력서 페이지에 개인 브랜딩 스키마 추가
17. **게임 `aria-live` 영역**: 상태 변경 시 스크린리더 알림 (reaction, color-sense 등)
