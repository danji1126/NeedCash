# Completion Report: page-experience (PDCA-5)

> **Feature**: page-experience
> **상위 계획**: AdSense 승인 로드맵 > PDCA-5
> **기간**: 2026-02-25 (단일 세션)
> **Match Rate**: 100% (12/12)
> **Iteration**: 0회 (1차 Check에서 통과)

---

## 1. 요약

페이지 경험(Page Experience) 최적화를 통해 폰트 91% 감소, 이미지 93% 감소, WCAG 2.1 AA 접근성 기반 구현, GPU 가속 및 뷰포트 메타 최적화를 완료했다. 전체 12개 검증 항목을 모두 통과하여 AdSense 승인 요건 중 페이지 경험 부분을 충족했다.

---

## 2. FR 이행 결과

### FR-01: 폰트 최적화

| 지표 | 목표 | 결과 | 달성률 |
|------|------|------|--------|
| 서브셋 폰트 크기 | < 300KB | **176KB** | 141% 초과 달성 |
| 원본 폰트 삭제 | 삭제 | 삭제 완료 | 100% |

**핵심 기술 결정**:
- 설계에서는 전체 한글 유니코드 범위(U+AC00-D7AF, 11,172글리프) 서브셋을 계획
- 실행 시 전체 한글 블록으로는 1.7MB까지만 감소하여 목표(300KB) 미달
- **해결**: 사이트 실제 사용 문자(630개 한글 + 라틴 + 기호)를 추출하여 `--text-file` 서브셋 → 176KB 달성
- 도구: `pyftsubset` + `--text-file` + `--no-hinting --desubroutinize`

**변경 파일**:
- `public/fonts/PretendardVariable.subset.woff2` (CREATE, 176KB)
- `public/fonts/PretendardVariable.woff2` (DELETE, 2.0MB)
- `app/layout.tsx:16` (폰트 경로 변경)

### FR-02: 이미지 최적화

| 이미지 | 원본 (PNG) | 변환 (WebP) | 감소율 |
|--------|-----------|------------|--------|
| bullterrier-houhou-1 | 3.1MB | 177KB | 94% |
| joker-gi-1 | 1.0MB | 101KB | 90% |
| iterm2-settings-1 | 278KB | 30KB | 89% |
| iterm2-settings-2 | 145KB | 23KB | 84% |
| **합계** | **4.5MB** | **331KB** | **93%** |

**핵심 기술 결정**:
- 설계는 `sharp-cli` 사용을 계획했으나, `cwebp` CLI가 이미 설치되어 있어 대체 사용
- bullterrier 이미지: q80에서 213KB (> 200KB 목표), q75로 재변환 → 177KB
- `output: 'export'` 환경에서 Next.js `<Image />` 사용 불가 → MDX `img` 컴포넌트 수동 작성

**변경 파일**:
- `public/blog/*/\*.webp` 4개 (CREATE)
- `public/blog/*/\*.png` 4개 (DELETE)
- `content/blog/*.mdx` 3개 (`.png` → `.webp` 참조 변경)
- `components/blog/mdx-components.tsx` (img 컴포넌트 추가: `loading="lazy"`, `decoding="async"`)

### FR-03: 접근성 강화

| 항목 | 기준 | 구현 상태 |
|------|------|----------|
| Skip-to-content | WCAG 2.4.1 | `sr-only` + `focus:not-sr-only` 패턴 |
| Focus visible | WCAG 2.4.7 | `2px solid var(--accent)` + outline-offset 2px |
| Reduced motion | WCAG 2.3.3 | 전역 `*` 선택자, 모든 animation/transition 비활성화 |
| 이미지 alt 텍스트 | WCAG 1.1.1 | MDX 4개 이미지 모두 alt 존재 확인 |

**변경 파일**:
- `app/layout.tsx` (skip-to-content 링크 + `id="main-content"`)
- `app/globals.css` (`:focus-visible` + `prefers-reduced-motion` 미디어 쿼리)

### FR-04: 성능 최적화

| 항목 | 구현 | 효과 |
|------|------|------|
| Glass blur GPU 가속 | `willChange: "transform"` 3개 div | 별도 합성 레이어, GPU 처리 |
| Footer content-visibility | `content-visibility: auto` | 뷰포트 외 렌더링 지연 |

**변경 파일**:
- `components/design/glass-background.tsx` (`willChange: "transform"` 3곳)
- `app/globals.css` (footer `content-visibility`)

### FR-05: 메타 최적화

| 항목 | 구현 |
|------|------|
| Viewport export | Next.js 15 `Viewport` 타입, `themeColor` light/dark 분기 |
| maximumScale | 5 (접근성: pinch-to-zoom 허용) |
| Apple meta | `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` |

**변경 파일**:
- `app/layout.tsx` (`Viewport` import/export + `metadata.other` Apple 메타)

---

## 3. 리소스 최적화 종합

### Before vs After

| 리소스 | Before | After | 절감 |
|--------|--------|-------|------|
| Pretendard 폰트 | 2.0MB | 176KB | **-91%** |
| 블로그 이미지 합계 | 4.5MB | 331KB | **-93%** |
| **총 리소스** | **6.5MB** | **507KB** | **-92%** |

### 페이지 로드 예상 개선

- **첫 방문 데이터 전송**: ~6.5MB → ~507KB (92% 감소)
- **LCP 개선**: 폰트/이미지 병목 제거로 < 2.5s 달성 예상
- **모바일 사용자**: 6MB+ 다운로드 → 500KB 수준으로 모바일 데이터 절약

---

## 4. 변경 파일 전체 목록 (11개)

| # | 파일 | 변경 | FR |
|---|------|------|-----|
| 1 | `public/fonts/PretendardVariable.subset.woff2` | CREATE | FR-01 |
| 2 | `public/fonts/PretendardVariable.woff2` | DELETE | FR-01 |
| 3 | `app/layout.tsx` | EDIT | FR-01, 03, 05 |
| 4 | `public/blog/*/*.webp` (4개) | CREATE | FR-02 |
| 5 | `public/blog/*/*.png` (4개) | DELETE | FR-02 |
| 6 | `content/blog/bullterrier-houhou-review.mdx` | EDIT | FR-02 |
| 7 | `content/blog/joker-gi-review.mdx` | EDIT | FR-02 |
| 8 | `content/blog/iterm2-korean-fix.mdx` | EDIT | FR-02 |
| 9 | `components/blog/mdx-components.tsx` | EDIT | FR-02 |
| 10 | `app/globals.css` | EDIT | FR-03, 04 |
| 11 | `components/design/glass-background.tsx` | EDIT | FR-04 |

---

## 5. 교훈 (Lessons Learned)

### 5.1 폰트 서브셋은 실사용 문자 기반이 효과적

전체 한글 유니코드 블록(11,172자)을 포함하면 가변 폰트 특성상 크기 감소가 제한적이다. 실제 사이트에서 사용하는 문자(630자)만 추출하여 서브셋하면 극적인 크기 감소(176KB)를 달성할 수 있다. 단, 콘텐츠 추가 시 폰트 서브셋을 재생성해야 하는 유지보수 비용이 있다.

### 5.2 `output: 'export'`에서의 이미지 전략

Next.js `output: 'export'` 모드에서는 `<Image />` 컴포넌트의 자동 최적화가 불가능하다. 따라서 빌드 전 수동 변환(cwebp/sharp) + MDX 커스텀 img 컴포넌트로 `loading="lazy"` + `decoding="async"`를 적용하는 전략이 필요하다.

### 5.3 접근성은 글로벌 스타일로 적용

`prefers-reduced-motion`은 개별 컴포넌트가 아닌 전역 `*` 선택자로 적용하면 향후 추가되는 모든 애니메이션도 자동 대응된다. `!important`는 접근성 필수 요건이므로 허용 가능한 예외이다.

---

## 6. AdSense 승인 로드맵 진행 상황

| PDCA | 항목 | Match Rate | 상태 |
|------|------|-----------|------|
| PDCA-1 | 유해 콘텐츠 제거 | - | ✅ 완료 |
| PDCA-2 | SEO 인프라 | 92% | ✅ 완료 |
| PDCA-3 | 콘텐츠 품질 강화 | 100% | ✅ 완료 |
| PDCA-4 | 사이트 구조/탐색성 | 100% | ✅ 완료 |
| **PDCA-5** | **페이지 경험 최적화** | **100%** | **✅ 완료** |
| PDCA-6 | 필수 페이지 보강 | - | ⏳ 대기 |
| PDCA-7 | AdSense 재신청 | - | ⏳ 대기 |
| PDCA-8 | 모니터링/반복 | - | ⏳ 대기 |

**다음 단계**: PDCA-6 (필수 페이지 보강) Plan 작성
