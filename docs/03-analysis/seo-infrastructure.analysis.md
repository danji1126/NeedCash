# Gap Analysis: seo-infrastructure (PDCA-2)

> **Feature**: seo-infrastructure
> **Design 문서**: `docs/02-design/features/seo-infrastructure.design.md`
> **분석일**: 2026-02-24
> **Match Rate**: 92% (11/12 검증 항목 통과)

---

## 1. FR별 Gap 분석

### FR-01: 동적 Sitemap 생성 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 파일 위치 | `app/sitemap.ts` CREATE | `app/sitemap.ts` 존재 | ✅ |
| 정적 페이지 7개 | home, blog, game, resume, about, privacy, terms | 동일 | ✅ |
| 블로그 동적 생성 | `getAllPosts().map(...)` | 동일 | ✅ |
| 게임 동적 생성 | `GAMES.map(...)` | 동일 | ✅ |
| 이력서 다국어 | `SUPPORTED_LANGUAGES.filter(...)` | 동일 | ✅ |
| `public/sitemap.xml` 삭제 | DELETE | 삭제됨 | ✅ |
| 빌드 출력 20+ URL | 20+ | **24 URLs** | ✅ |

**추가 구현**: `export const dynamic = "force-static"` (빌드 오류 대응, 설계 미반영이나 필수)

### FR-02: 동적 Robots.txt 생성 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 파일 위치 | `app/robots.ts` CREATE | `app/robots.ts` 존재 | ✅ |
| User-Agent | `"*"` | `"*"` | ✅ |
| Allow | `"/"` | `"/"` | ✅ |
| Sitemap | `${SITE.url}/sitemap.xml` | 동일 | ✅ |
| `public/robots.txt` 삭제 | DELETE | 삭제됨 | ✅ |

**추가 구현**: `export const dynamic = "force-static"` (FR-01과 동일 사유)

### FR-03: OpenGraph + Twitter Card ✅ 100%

| 페이지 | OG title | OG description | OG url | OG type | 기타 |
|--------|----------|----------------|--------|---------|------|
| FR-03a: 루트 레이아웃 | ✅ | ✅ | ✅ | website ✅ | locale, siteName, twitter ✅ |
| FR-03b: 블로그 목록 | ✅ | ✅ | ✅ | - | - |
| FR-03c: 블로그 개별 | ✅ | ✅ | ✅ | article ✅ | publishedTime, tags ✅ |
| FR-03d: 게임 목록 | ✅ | ✅ | ✅ | - | - |
| FR-03e: 게임 개별 | ✅ | ✅ | ✅ | - | - |
| FR-03f: 이력서 | ✅ | ✅ | ✅ | - | - |
| FR-03g: 이력서 다국어 | ✅ | ✅ | ✅ | - | - |

### FR-04: Canonical URL ⚠️ 50%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| `metadataBase` 설정 | `new URL(SITE.url)` | `new URL(SITE.url)` | ✅ |
| HTML `<link rel="canonical">` 존재 | 모든 페이지에 존재해야 함 | **존재하지 않음** | ❌ |

**Gap 상세**: 설계 문서에서 "metadataBase 설정만으로 Next.js가 자동으로 canonical URL 생성"이라고 가정했으나, Next.js는 `metadataBase`만으로 canonical 태그를 자동 생성하지 않음. `alternates.canonical`을 명시적으로 설정해야 함.

**수정 방안**: `app/layout.tsx`의 metadata에 `alternates: { canonical: "./" }` 추가하면 모든 하위 페이지에 canonical 자동 적용.

### FR-05: Article JSON-LD ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 컴포넌트 | `ArticleJsonLd` | 동일 | ✅ |
| @type | Article | Article | ✅ |
| headline, description, url | props 기반 | 동일 | ✅ |
| datePublished | props 기반 | 동일 | ✅ |
| author/publisher | Person/Organization | 동일 | ✅ |
| keywords | tags.join(", ") | 동일 | ✅ |
| blog/[slug] 삽입 | article 내부 최상단 | 동일 | ✅ |

### FR-06: Game JSON-LD ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 컴포넌트 | `GameJsonLd` | 동일 | ✅ |
| @type | SoftwareApplication | SoftwareApplication | ✅ |
| applicationCategory | GameApplication | GameApplication | ✅ |
| offers | price: "0", KRW | 동일 | ✅ |
| game/[slug] 삽입 | div 내부 최상단 | 동일 | ✅ |

### FR-07: WebSite JSON-LD ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 컴포넌트 | `WebSiteJsonLd` | 동일 | ✅ |
| @type | WebSite | WebSite | ✅ |
| name, description, url | SITE 상수 | 동일 | ✅ |
| 배치 | body 직후, DesignProvider 앞 | 동일 | ✅ |

### FR-08: hreflang 보강 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| resume/page.tsx x-default | `"x-default": "/resume"` | 동일 | ✅ |
| resume/[lang]/page.tsx x-default | `"x-default": "/resume"` | 동일 | ✅ |
| 지원 언어 | ko, en, th, vi, ja | 동일 | ✅ |
| HTML 출력 확인 | 6개 hreflang 태그 | 6개 확인 (ko,en,th,vi,ja,x-default) | ✅ |

---

## 2. 검증 체크리스트

| # | 항목 | 결과 |
|---|------|------|
| 1 | `pnpm build` 성공 (0 errors) | ✅ |
| 2 | `pnpm lint` 통과 | ✅ |
| 3 | `out/sitemap.xml` 존재 + 20+ URL | ✅ 24 URLs |
| 4 | `out/robots.txt` 존재 + Allow + Sitemap | ✅ |
| 5 | 홈페이지: og:title, og:description, twitter:card | ✅ |
| 6 | 홈페이지: WebSite JSON-LD | ✅ |
| 7 | 블로그 개별: og:type="article", Article JSON-LD | ✅ |
| 8 | 게임 개별: og:title, SoftwareApplication JSON-LD | ✅ |
| 9 | 이력서: hreflang="x-default" | ✅ |
| 10 | 모든 페이지: `<link rel="canonical">` | ❌ 미생성 |
| 11 | `public/sitemap.xml` 삭제됨 | ✅ |
| 12 | `public/robots.txt` 삭제됨 | ✅ |

**통과율**: 11/12 = **91.7%**

---

## 3. Gap 요약

| Gap ID | FR | 심각도 | 설명 | 수정 방안 |
|--------|-----|--------|------|----------|
| GAP-01 | FR-04 | Medium | Canonical URL 미생성 (설계 가정 오류) | layout.tsx에 `alternates: { canonical: "./" }` 추가 |

---

## 4. 결론

- **Match Rate**: 92% (≥ 90% 기준 충족)
- **Gap 1건**: FR-04 canonical URL (설계 문서의 Next.js 동작 가정 오류)
- **권장**: GAP-01 수정 후 Report 단계 진행 가능
