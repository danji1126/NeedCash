# Plan: page-experience (PDCA-5)

> **Feature**: page-experience
> **상위 계획**: AdSense 승인 로드맵 > PDCA-5
> **작성일**: 2026-02-25
> **우선순위**: P1 (필수)
> **의존성**: PDCA-4 완료 후

---

## 1. 목적

페이지 경험(Page Experience) 지표를 최적화하여 구글 검색 순위와 AdSense 승인 가능성을 높인다. Core Web Vitals, 접근성, 모바일 최적화, 리소스 최적화에 집중한다.

---

## 2. 현상 분석

### 2.1 리소스 문제

| 리소스 | 현재 상태 | 문제점 |
|--------|----------|--------|
| PretendardVariable.woff2 | **2.0MB** | 한글 전체 글리프 포함, 첫 로드 시 병목 |
| bullterrier-houhou-1.png | **3.1MB** | 최적화 안 됨, WebP/AVIF 미사용 |
| joker-gi-1.png | **1.0MB** | 최적화 안 됨 |
| iterm2 이미지 2개 | 278K + 145K | 비교적 양호하나 WebP 전환 가능 |

### 2.2 성능 문제

| 항목 | 현재 상태 | 영향 |
|------|----------|------|
| `output: 'export'` | Next.js Image 최적화 불가 | LCP 악화 |
| Glass 배경 애니메이션 | 3개 500px blur div, 상시 animation | 저사양 기기 성능 저하 |
| 16개 테마 CSS 전부 로드 | 전체 CSS에 포함 | 불필요한 CSS 크기 |
| 테마 초기화 인라인 스크립트 | `<head>`에 동기 실행 | 렌더 블로킹은 아니나 FOUC 가능성 |

### 2.3 접근성 문제

| 항목 | 현재 상태 | 기준 |
|------|----------|------|
| Skip to content 링크 | 없음 | WCAG 2.1 AA 필수 |
| 키보드 네비게이션 포커스 | 미확인 | visible focus ring 필요 |
| color contrast | 테마별 미검증 | 4.5:1 비율 필수 |
| prefers-reduced-motion | 미대응 | Glass 애니메이션 대체 필요 |
| `<img>` alt 속성 | MDX 이미지 일부 누락 가능 | 모든 이미지 필수 |

### 2.4 모바일 최적화

| 항목 | 현재 상태 | 문제점 |
|------|----------|--------|
| viewport meta | 기본값 (Next.js 자동) | 양호 |
| 터치 타겟 크기 | 미검증 | 44x44px 최소 필요 |
| 반응형 | Tailwind responsive 사용 | 320px 대응 확인 필요 |
| 2MB 폰트 모바일 로드 | 전체 다운로드 | 모바일 데이터 절약 필요 |

---

## 3. 목표

| 지표 | 현재 추정 | 목표 |
|------|----------|------|
| Lighthouse Performance | ~70 | 90+ |
| Lighthouse Accessibility | ~80 | 95+ |
| LCP (Largest Contentful Paint) | ~3s | < 2.5s |
| CLS (Cumulative Layout Shift) | 미측정 | < 0.1 |
| INP (Interaction to Next Paint) | 미측정 | < 200ms |
| 폰트 파일 크기 | 2.0MB | < 300KB |
| 최대 이미지 크기 | 3.1MB | < 200KB |

---

## 4. 범위 (FR)

### FR-01: 폰트 최적화

| 작업 | 상세 | 완료 기준 |
|------|------|----------|
| Pretendard 서브셋 생성 | 한글 가나다~, 영문, 숫자, 특수문자만 포함 | woff2 < 300KB |
| 폰트 preload 추가 | `<link rel="preload">` | `<head>`에 preload 존재 |
| font-display: swap 유지 | 이미 적용됨 | 변경 없음 |

### FR-02: 이미지 최적화

| 작업 | 상세 | 완료 기준 |
|------|------|----------|
| PNG → WebP 변환 | 블로그 이미지 4개 변환 | WebP 파일로 교체 |
| 이미지 리사이즈 | 최대 폭 1200px | 각 이미지 < 200KB |
| MDX 이미지에 width/height | CLS 방지 | 모든 `<img>`에 크기 속성 |
| lazy loading 속성 | `loading="lazy"` | 스크롤 아래 이미지에 적용 |

### FR-03: 접근성 강화

| 작업 | 상세 | 완료 기준 |
|------|------|----------|
| Skip to content 링크 | `layout.tsx`에 추가, 포커스 시 표시 | 키보드 Tab으로 확인 |
| Focus visible 스타일 | `:focus-visible` outline 스타일 | 모든 인터랙티브 요소에 적용 |
| prefers-reduced-motion | Glass 애니메이션 비활성화 | `@media` 쿼리 적용 |
| 이미지 alt 텍스트 확인 | MDX 블로그 이미지 전수 확인 | alt 누락 0건 |

### FR-04: 성능 최적화

| 작업 | 상세 | 완료 기준 |
|------|------|----------|
| Glass blur 최적화 | `will-change: transform` + GPU 가속 | Glass 디자인 60fps |
| content-visibility 확장 | 게임 목록, 블로그 목록 카드에 적용 | 스크롤 외 영역 렌더링 지연 |
| AdSense 스크립트 로드 최적화 | 이미 `afterInteractive` | 변경 없음 확인 |
| CSS 최적화 확인 | Tailwind purge 동작 확인 | 미사용 CSS 0 |

### FR-05: 메타 최적화

| 작업 | 상세 | 완료 기준 |
|------|------|----------|
| viewport 메타 확인 | Next.js 기본값 확인 | `viewport-fit=cover` 포함 |
| theme-color 메타 | 테마별 적절한 색상 | `<meta name="theme-color">` |
| Apple 모바일 메타 | `apple-mobile-web-app-capable` 등 | PWA 기본 메타 추가 |

---

## 5. 범위 외 (Out of Scope)

- PWA Service Worker 구현 (차후 고려)
- SSR 전환 (`output: 'export'` 유지)
- CDN 이미지 최적화 서비스 (Cloudflare Pages 기본 기능만 사용)
- 폰트 CDN 전환 (로컬 폰트 유지)

---

## 6. 검증 항목

| # | 항목 | 검증 방법 |
|---|------|----------|
| 1 | `pnpm build` 성공 (0 errors) | 빌드 실행 |
| 2 | `pnpm lint` 통과 (0 warnings) | 린트 실행 |
| 3 | 폰트 파일 크기 < 300KB | `du -sh` 확인 |
| 4 | 블로그 이미지 모두 WebP, 각 < 200KB | `ls -la` 확인 |
| 5 | Skip to content 링크 존재 | HTML 소스 확인 |
| 6 | `:focus-visible` 스타일 정의 | CSS 확인 |
| 7 | `prefers-reduced-motion` 미디어 쿼리 존재 | CSS 확인 |
| 8 | MDX 이미지 alt 속성 100% | 전수 확인 |
| 9 | Glass blur에 `will-change` 적용 | 코드 확인 |
| 10 | `theme-color` 메타태그 존재 | HTML 소스 확인 |
| 11 | Lighthouse Performance 90+ | 로컬 빌드 후 측정 |
| 12 | Lighthouse Accessibility 95+ | 로컬 빌드 후 측정 |

---

## 7. PDCA 사이클

- **Plan**: 이 문서 (현재)
- **Design**: `docs/02-design/features/page-experience.design.md` 작성 필요
- **Do**: FR-01~05 순서대로 구현
- **Check**: 검증 항목 12개 확인 + Lighthouse 측정
- **Act**: 미달 항목 보완

---

## 8. AdSense 승인 로드맵 진행 상황

| PDCA | 항목 | 상태 |
|------|------|------|
| PDCA-1 | 유해 콘텐츠 제거 | ✅ 완료 |
| PDCA-2 | SEO 인프라 | ✅ 완료 (92%) |
| PDCA-3 | 콘텐츠 품질 강화 | ✅ 완료 (100%) |
| PDCA-4 | 사이트 구조/탐색성 | ✅ 완료 (100%) |
| **PDCA-5** | **페이지 경험 최적화** | **📝 Plan 작성** |
| PDCA-6 | 필수 페이지 보강 | ⏳ 대기 |
| PDCA-7 | AdSense 재신청 | ⏳ 대기 |
| PDCA-8 | 모니터링/반복 | ⏳ 대기 |
