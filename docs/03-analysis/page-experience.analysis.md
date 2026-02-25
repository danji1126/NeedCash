   # Gap Analysis: page-experience (PDCA-5)

> **Feature**: page-experience
> **Design 문서**: `docs/02-design/features/page-experience.design.md`
> **분석일**: 2026-02-25
> **Match Rate**: **100%** (12/12 항목 통과)

---

## 1. 검증 결과 요약

| # | 항목 | 설계 기준 | 실제 결과 | 판정 |
|---|------|----------|----------|------|
| 1 | `pnpm build` 성공 | 0 errors | 29 pages, 0 errors | PASS |
| 2 | `pnpm lint` 통과 | 0 warnings | 0 errors, 0 warnings | PASS |
| 3 | 서브셋 폰트 < 300KB | < 300KB | 176KB (180,512 bytes) | PASS |
| 4 | 원본 폰트 삭제 | 파일 부존재 | `PretendardVariable.woff2` 삭제됨 | PASS |
| 5 | 블로그 이미지 .webp | 4개 모두 .webp | 4개 .webp 확인 | PASS |
| 6 | 각 WebP < 200KB | 모두 < 200KB | max 177KB (bullterrier) | PASS |
| 7 | MDX img `loading="lazy"` | 속성 존재 | mdx-components.tsx:75 확인 | PASS |
| 8 | Skip to content 링크 | HTML 소스에 존재 | layout.tsx:91-96 확인 | PASS |
| 9 | `:focus-visible` 스타일 | globals.css에 존재 | globals.css:297-301 확인 | PASS |
| 10 | `prefers-reduced-motion` | 미디어 쿼리 존재 | globals.css:244-253 확인 | PASS |
| 11 | Glass `willChange: "transform"` | 3개 div 모두 | glass-background.tsx:19,29,39 확인 | PASS |
| 12 | `Viewport` export + `theme-color` | layout.tsx에 존재 | layout.tsx:64-72 확인 | PASS |

---

## 2. FR별 상세 검증

### FR-01: 폰트 최적화 (PASS)

**설계**: `pyftsubset`으로 서브셋 생성, < 300KB 목표
**구현**: 사이트에서 실제 사용 문자(630개 한글 + 라틴 + 기호)만 추출하여 `--text-file` 서브셋
- 결과: **176KB** (2.0MB 대비 91% 감소)
- 설계보다 더 효율적인 접근 (전체 한글 블록 대신 실사용 문자만 포함)
- `layout.tsx:16`: 경로 `PretendardVariable.subset.woff2`로 변경 완료
- 원본 `PretendardVariable.woff2` 삭제 완료

**Gap**: 없음. 설계 목표를 초과 달성.

### FR-02: 이미지 최적화 (PASS)

**설계**: `sharp-cli`로 WebP 변환 + 1200px 리사이즈
**구현**: `cwebp` CLI로 변환 (동일 결과)

| 이미지 | 원본 (PNG) | 변환 (WebP) | 감소율 |
|--------|-----------|------------|--------|
| bullterrier-houhou-1 | 3.1MB | 177KB | 94% |
| joker-gi-1 | 1.0MB | 101KB | 90% |
| iterm2-settings-1 | 278KB | 30KB | 89% |
| iterm2-settings-2 | 145KB | 23KB | 84% |
| **합계** | **4.5MB** | **331KB** | **93%** |

- MDX 3개 파일: `.png` → `.webp` 참조 변경 완료 (잔여 `.png` 참조 0건)
- `mdx-components.tsx:70-80`: img 컴포넌트 `loading="lazy"` + `decoding="async"` 추가 완료
- 원본 PNG 4개 삭제 완료

**Gap**: 도구만 다름 (`sharp-cli` → `cwebp`). 결과 동일, 목표 달성.

### FR-03: 접근성 강화 (PASS)

**설계**: Skip-to-content + focus-visible + reduced-motion
**구현**:

1. **Skip-to-content**: `layout.tsx:91-96` - `sr-only` + `focus:not-sr-only` 패턴 적용
   - `href="#main-content"`, `<main id="main-content">` 연결 확인
2. **focus-visible**: `globals.css:297-305` - `2px solid var(--accent)` outline 적용
   - `:focus:not(:focus-visible)` 마우스 사용자 outline 제거
3. **reduced-motion**: `globals.css:244-253` - 전역 `*` 선택자로 모든 애니메이션 비활성화

**Gap**: 없음. 설계와 정확히 일치.

### FR-04: 성능 최적화 (PASS)

**설계**: Glass blur GPU 가속 + footer content-visibility
**구현**:

1. **willChange**: `glass-background.tsx:19,29,39` - 3개 blur div 모두 `willChange: "transform"` 적용
2. **content-visibility**: `globals.css:383-386` - footer에 `content-visibility: auto` + `contain-intrinsic-size: auto 200px`

**Gap**: 없음. 설계와 정확히 일치.

### FR-05: 메타 최적화 (PASS)

**설계**: Viewport export + theme-color + Apple 모바일 메타
**구현**:

1. **Viewport**: `layout.tsx:64-72` - `Viewport` 타입 import + export
   - `themeColor` light/dark 분기, `width: "device-width"`, `maximumScale: 5`
2. **Apple meta**: `layout.tsx:57-61` - `metadata.other`에 추가
   - `apple-mobile-web-app-capable: "yes"`, `apple-mobile-web-app-status-bar-style: "black-translucent"`

**Gap**: 없음. 설계와 정확히 일치.

---

## 3. 변경 파일 대조

| # | 설계 파일 | 변경 유형 | 구현 상태 |
|---|----------|----------|----------|
| 1 | `public/fonts/PretendardVariable.subset.woff2` | CREATE | DONE (176KB) |
| 2 | `public/fonts/PretendardVariable.woff2` | DELETE | DONE |
| 3 | `app/layout.tsx` | EDIT | DONE (폰트 경로 + skip-to-content + main id + viewport + meta) |
| 4 | `public/blog/*/*.webp` | CREATE (4개) | DONE |
| 5 | `public/blog/*/*.png` | DELETE (4개) | DONE |
| 6 | `content/blog/bullterrier-houhou-review.mdx` | EDIT | DONE (.png → .webp) |
| 7 | `content/blog/joker-gi-review.mdx` | EDIT | DONE (.png → .webp) |
| 8 | `content/blog/iterm2-korean-fix.mdx` | EDIT | DONE (.png → .webp) |
| 9 | `components/blog/mdx-components.tsx` | EDIT | DONE (img 컴포넌트) |
| 10 | `app/globals.css` | EDIT | DONE (focus-visible + reduced-motion + content-visibility) |
| 11 | `components/design/glass-background.tsx` | EDIT | DONE (willChange) |

**전체 11개 파일 변경 완료. 누락 0건.**

---

## 4. 결론

- **Match Rate: 100%** (12/12)
- 모든 FR이 설계 사양 대로 또는 초과 달성 (FR-01 폰트는 목표 300KB 대비 176KB)
- 빌드/린트 통과, 잔여 PNG 참조 0건
- **Check 통과 → Report 단계 진행 권장**
