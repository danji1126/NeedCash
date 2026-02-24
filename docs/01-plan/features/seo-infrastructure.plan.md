# Plan: seo-infrastructure (PDCA-2)

> **Feature**: seo-infrastructure
> **상위 계획**: `docs/brainstorm/adsense-approval.plan.md` > PDCA-2
> **작성일**: 2026-02-24
> **우선순위**: P0 (즉시)
> **의존성**: PDCA-1 (adsense-harmful-removal) 완료

---

## 1. 목적

구글봇이 사이트의 모든 콘텐츠를 정확히 인식하고 인덱싱할 수 있는 기술 SEO 기반을 구축한다.
이후 추가되는 모든 콘텐츠(PDCA-3~6)가 자동으로 SEO 혜택을 받는 인프라를 만든다.

---

## 2. 현재 상태 분석

### 있는 것
| 항목 | 위치 | 문제 |
|------|------|------|
| sitemap.xml | `public/sitemap.xml` | 정적 파일. 게임 4개 누락(animal-face, reaction, color-sense, color-memory), 이력서 다국어 누락 |
| robots.txt | `public/robots.txt` | 정적 파일. 기본 설정만 있음 |
| 페이지별 Metadata | 각 page.tsx | title/description 있으나 OG 태그, canonical 없음 |
| hreflang | resume 페이지만 | 이력서 5개 언어 상호 참조 구현됨 |
| AdSense 인증 | layout.tsx | 메타태그 + 스크립트 보존됨 |

### 없는 것
| 항목 | 영향 |
|------|------|
| 동적 sitemap 생성 (`app/sitemap.ts`) | 콘텐츠 추가 시 수동 업데이트 필요 |
| 동적 robots.txt (`app/robots.ts`) | 관리 편의성 |
| Schema.org JSON-LD | 리치 결과 불가, 콘텐츠 유형 인식 불가 |
| OpenGraph / Twitter Card | 소셜 공유 시 미리보기 없음 |
| canonical URL | 중복 콘텐츠 리스크 |

### 제약 사항
- `next.config.ts`에 `output: 'export'` → 정적 빌드 전용
- `app/sitemap.ts`, `app/robots.ts`는 빌드 시 정적 파일로 생성됨 (Route Handler 아님)
- API Routes 사용 불가 → 모든 SEO 요소는 빌드 타임에 결정

---

## 3. 요구사항

### FR-01: 동적 Sitemap 생성
- `app/sitemap.ts` 구현 (Next.js MetadataRoute.Sitemap)
- 포함 대상: 정적 페이지 + 블로그 전체 + 게임 전체 + 이력서 다국어
- `public/sitemap.xml` 삭제 (충돌 방지)
- **완료 기준**: `pnpm build` 후 `out/sitemap.xml`에 모든 페이지 URL 포함

### FR-02: 동적 Robots.txt 생성
- `app/robots.ts` 구현 (Next.js MetadataRoute.Robots)
- Allow: / + Sitemap URL 포함 + Disallow 불필요 경로
- `public/robots.txt` 삭제 (충돌 방지)
- **완료 기준**: `pnpm build` 후 `out/robots.txt` 정상 출력

### FR-03: OpenGraph + Twitter Card 메타태그
- 루트 `layout.tsx`의 metadata에 기본 OG 설정 추가
- 각 페이지별 고유 OG 메타데이터:
  - 홈: 사이트 소개
  - 블로그 목록/개별: 포스트 제목, 설명
  - 게임 목록/개별: 게임 이름, 설명
  - 이력서: 이력서 정보
- Twitter card type: `summary_large_image`
- **완료 기준**: 각 페이지 `<head>`에 `og:title`, `og:description`, `og:url`, `twitter:card` 존재

### FR-04: Canonical URL
- 루트 `layout.tsx`에 `metadataBase` 설정 (`https://needcash.dev`)
- 각 페이지 metadata에 `alternates.canonical` 설정
- **완료 기준**: 모든 페이지에 `<link rel="canonical" href="...">` 존재

### FR-05: Schema.org JSON-LD (블로그)
- 블로그 개별 페이지 (`blog/[slug]/page.tsx`)에 Article JSON-LD 삽입
- 필수 필드: `@type`, `headline`, `datePublished`, `author`, `description`, `url`
- `<script type="application/ld+json">` 태그로 삽입
- **완료 기준**: Google Rich Results Test에서 Article 스키마 감지

### FR-06: Schema.org JSON-LD (게임)
- 게임 개별 페이지 (`game/[slug]/page.tsx`)에 SoftwareApplication JSON-LD 삽입
- 필수 필드: `@type`, `name`, `description`, `applicationCategory`, `operatingSystem`
- **완료 기준**: Google Rich Results Test에서 SoftwareApplication 스키마 감지

### FR-07: Schema.org JSON-LD (사이트)
- 루트 `layout.tsx` 또는 홈 `page.tsx`에 WebSite + Organization JSON-LD 삽입
- WebSite: `name`, `url`, `description`
- Organization: `name`, `url`, `logo`
- **완료 기준**: Google Rich Results Test에서 WebSite 스키마 감지

### FR-08: 이력서 hreflang 보강
- 현재 resume 페이지에만 hreflang 설정됨 → 유지
- `x-default` hreflang 추가 (기본 한국어 페이지)
- **완료 기준**: resume 페이지에 `x-default` + 5개 언어 hreflang 태그 존재

---

## 4. 구현 순서

```
FR-04 (metadataBase/canonical) → FR-01 (sitemap.ts) → FR-02 (robots.ts)
                                                     ↘
FR-03 (OG/Twitter)                                    FR-05~07 (JSON-LD)
                                                     ↗
FR-08 (hreflang 보강)
```

1. **FR-04**: `metadataBase` 설정 (다른 FR의 기반)
2. **FR-01**: `app/sitemap.ts` 생성 + `public/sitemap.xml` 삭제
3. **FR-02**: `app/robots.ts` 생성 + `public/robots.txt` 삭제
4. **FR-03**: OG/Twitter 메타태그 추가
5. **FR-05~07**: JSON-LD 스키마 삽입
6. **FR-08**: hreflang x-default 추가

---

## 5. 변경 대상 파일 (예상)

| 파일 | 변경 유형 | FR |
|------|----------|-----|
| `app/sitemap.ts` | CREATE | FR-01 |
| `public/sitemap.xml` | DELETE | FR-01 |
| `app/robots.ts` | CREATE | FR-02 |
| `public/robots.txt` | DELETE | FR-02 |
| `app/layout.tsx` | EDIT | FR-03, FR-04, FR-07 |
| `app/page.tsx` | EDIT | FR-03 |
| `app/blog/page.tsx` | EDIT | FR-03 |
| `app/blog/[slug]/page.tsx` | EDIT | FR-03, FR-05 |
| `app/game/page.tsx` | EDIT | FR-03 |
| `app/game/[slug]/page.tsx` | EDIT | FR-03, FR-06 |
| `app/resume/page.tsx` | EDIT | FR-03, FR-08 |
| `app/resume/[lang]/page.tsx` | EDIT | FR-03, FR-08 |
| `components/seo/json-ld.tsx` | CREATE | FR-05, FR-06, FR-07 |

---

## 6. 검증 방법

| 항목 | 방법 | 기준 |
|------|------|------|
| sitemap.xml | `pnpm build` → `out/sitemap.xml` 확인 | 전체 페이지 URL 포함 (20+ URLs) |
| robots.txt | `pnpm build` → `out/robots.txt` 확인 | Allow + Sitemap 포함 |
| OG 태그 | 빌드 후 HTML 소스 확인 | 각 페이지 og:title, og:description 존재 |
| canonical | 빌드 후 HTML 소스 확인 | `<link rel="canonical">` 존재 |
| JSON-LD | 빌드 후 HTML 소스 확인 | `<script type="application/ld+json">` 존재 |
| hreflang | 빌드 후 HTML 소스 확인 | x-default + 5개 언어 |
| 빌드 성공 | `pnpm build` | 0 errors |
| 린트 통과 | `pnpm lint` | 0 warnings |

---

## 7. 다음 단계

Plan 승인 후 → `/pdca design seo-infrastructure`로 Design 문서 작성
