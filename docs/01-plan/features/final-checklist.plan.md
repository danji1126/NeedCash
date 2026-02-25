# Plan: final-checklist (PDCA-8)

> **Feature**: final-checklist (최종 점검 + AdSense 재신청 준비)
> **상위 계획**: AdSense 승인 로드맵 > PDCA-8
> **작성일**: 2026-02-25
> **우선순위**: P2 (권장)
> **의존성**: PDCA 1-7 모두 완료

---

## 1. 배경

PDCA-1부터 PDCA-7까지 7개 사이클을 모두 100% Match Rate로 완료했다. 이 마지막 PDCA-8에서는 전체 개선 사항이 실제로 반영되어 있는지 체계적으로 검증하고, 미비한 점을 보완한 뒤 AdSense 재신청을 준비한다.

### PDCA 완료 현황

| PDCA | 항목 | Match Rate | 상태 |
|------|------|-----------|------|
| PDCA-1 | 유해 콘텐츠 제거 | - | ✅ 완료 |
| PDCA-2 | SEO 인프라 | 92% | ✅ 완료 |
| PDCA-3 | 게임 콘텐츠 보강 | 100% | ✅ 완료 |
| PDCA-4 | 사이트 구조/탐색성 | 100% | ✅ 완료 |
| PDCA-5 | 페이지 경험 최적화 | 100% | ✅ 완료 |
| PDCA-6 | 필수 페이지 보강 | 100% | ✅ 완료 |
| PDCA-7 | 내부 링크 구조 | 100% | ✅ 완료 |

---

## 2. 현재 상태 분석

### 2.1 콘텐츠 현황

| 항목 | 현재 값 | 원래 목표 | 판정 |
|------|---------|----------|------|
| 블로그 글 수 | **10개** | 15개 | ⚠️ 미달 |
| 게임 수 | **6개** | 6개 | ✅ |
| 게임 페이지 콘텐츠 | 각 1000자+ | 800자+ | ✅ |
| 카테고리 체계 | **3개** (tech/review/science) | 3개 | ✅ |

블로그 글 목록 (10개):
- **tech** (4): hello-world, getting-started, iterm2-korean-fix, nextjs-mdx-blog-guide
- **review** (3): speak-100-days, bullterrier, joker-gi
- **science** (3): reaction-speed, color-sense, color-memory

### 2.2 기술 SEO 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| sitemap.xml | ✅ 구현됨 | `app/sitemap.ts` (정적/블로그/게임/이력서) |
| robots.txt | ✅ 구현됨 | `app/robots.ts` (Allow: /) |
| Schema.org JSON-LD | ✅ 구현됨 | `components/seo/json-ld.tsx` |
| 메타태그 | ✅ 구현됨 | 각 페이지 metadata export |
| canonical | ⚠️ 미확인 | Next.js metadataBase 의존 |
| hreflang | ⚠️ 미확인 | 이력서 다국어 페이지 |

### 2.3 정책 준수 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| /ads 라우트 | ✅ 제거됨 | 디렉토리 없음 |
| 광고 플레이스홀더 | ✅ 없음 | AdSense 스크립트는 cookie consent 후 로드 |
| Privacy Policy | ✅ 존재 | `/privacy` |
| Terms of Service | ✅ 존재 | `/terms` |
| About 페이지 | ✅ 존재 | `/about` |
| 쿠키 동의 배너 | ✅ 구현됨 | `cookie-consent.tsx` |

### 2.4 내부 링크 현황

| 방향 | 상태 |
|------|------|
| 블로그 → 게임 | ✅ science 포스트 3개에서 게임 링크 |
| 게임 → 블로그 | ✅ 3개 게임에서 관련 블로그 링크 |
| 블로그 → 블로그 | ✅ RelatedPosts (카테고리 우선) |
| 게임 → 게임 | ✅ RelatedGames 컴포넌트 |

---

## 3. 목표 (FR 정의)

### FR-01: 빌드 + 린트 무결성 검증

`pnpm build` 0 errors, `pnpm lint` 0 errors/warnings 확인.

**완료 기준**: 빌드 성공, 린트 통과, 생성 페이지 수 32개 이상

### FR-02: 콘텐츠 품질 체크리스트

코드 기반으로 검증 가능한 콘텐츠 항목을 체크한다.

| 항목 | 검증 방법 | 기준 |
|------|----------|------|
| 블로그 글 수 | `content/blog/*.mdx` 개수 | 10개 (현실적 목표) |
| 빈 페이지 없음 | 모든 page.tsx에 실질 콘텐츠 | 0개 빈 페이지 |
| 게임 페이지 콘텐츠 | `game-content.ts` 6개 게임 데이터 | 6개 모두 존재 |
| 카테고리 균형 | 각 카테고리 최소 3개 글 | tech(4), review(3), science(3) |

### FR-03: 기술 SEO 체크리스트

| 항목 | 검증 방법 | 기준 |
|------|----------|------|
| sitemap.xml | `app/sitemap.ts` 존재 + 모든 경로 포함 | 블로그/게임/정적 페이지 |
| robots.txt | `app/robots.ts` 존재 + Allow: / | 정상 설정 |
| Schema.org | `json-ld.tsx` + page.tsx에서 사용 | Article, SoftwareApplication |
| 메타태그 | 각 page.tsx에 metadata/generateMetadata | 고유 title, description |
| OG 태그 | metadata에 openGraph 포함 | 공유 시 미리보기 |

### FR-04: 정책 준수 체크리스트

| 항목 | 검증 방법 | 기준 |
|------|----------|------|
| /ads 라우트 없음 | `app/ads/` 디렉토리 부재 | 디렉토리 없음 |
| Privacy Policy | `/privacy` 페이지 존재 | 접근 가능 |
| Terms of Service | `/terms` 페이지 존재 | 접근 가능 |
| About 페이지 | `/about` 페이지 존재 | 접근 가능 |
| 쿠키 동의 | `cookie-consent.tsx` 구현 | 동작 확인 |
| AdSense 메타 태그 | layout.tsx에 google-adsense-account | 존재 |

### FR-05: 내부 링크 무결성

| 항목 | 검증 방법 | 기준 |
|------|----------|------|
| 게임→블로그 링크 | `game-content.ts` relatedBlog 3개 | slug 일치 확인 |
| RelatedPosts 카테고리 우선 | `related-posts.tsx` 로직 | category prop 사용 |
| 데드 링크 없음 | relatedBlog slug가 실제 mdx와 일치 | 3개 모두 일치 |
| RelatedGames 동작 | `getRelatedGames()` 함수 | 각 게임에서 3개 추천 |

### FR-06: canonical URL 확인 (보완)

Next.js의 `metadataBase` 설정을 통해 canonical URL이 자동 생성되는지 확인한다.

**완료 기준**: `app/layout.tsx`에 `metadataBase` 설정 존재, 또는 각 페이지에서 `alternates.canonical` 설정

### FR-07: Lighthouse 검증 (수동)

빌드 후 Lighthouse로 주요 페이지의 SEO, 접근성, 성능 점수를 확인한다.

| 페이지 | SEO 목표 | 접근성 목표 |
|--------|---------|-----------|
| `/` (홈) | 90+ | 90+ |
| `/blog` | 90+ | 90+ |
| `/game` | 90+ | 90+ |
| `/blog/{slug}` (아무 글) | 90+ | 90+ |
| `/game/{slug}` (아무 게임) | 90+ | 90+ |

**참고**: Lighthouse는 빌드된 사이트에서 수동 확인. 자동화 범위 밖.

---

## 4. 범위 외 (Out of Scope)

| 항목 | 이유 |
|------|------|
| Google Search Console 설정 | 배포 환경 필요 (로컬에서 불가) |
| 실제 AdSense 재신청 | 수동 작업 (Google 계정 필요) |
| 블로그 글 추가 작성 | 별도 PDCA 사이클 필요시 진행 |
| Lighthouse 자동화 | CI/CD 환경 미구축 |

---

## 5. 구현 계획

### Phase 1: 자동 검증 (코드 기반)

1. `pnpm build` 실행 → 0 errors 확인
2. `pnpm lint` 실행 → 0 errors 확인
3. 파일 기반 검증:
   - blog MDX 파일 수 확인 (10개)
   - game-content.ts 6개 게임 데이터 확인
   - sitemap.ts, robots.ts 존재 확인
   - json-ld.tsx 존재 확인
   - privacy, terms, about 페이지 존재 확인
   - cookie-consent.tsx 존재 확인
   - /ads 디렉토리 부재 확인

### Phase 2: 코드 레벨 검증

1. metadataBase / canonical 설정 확인
2. 각 페이지 metadata export 확인
3. relatedBlog slug ↔ 실제 MDX slug 일치 확인
4. 내부 링크 무결성 확인

### Phase 3: 미비 사항 보완

- canonical URL 미설정 시 추가
- 누락된 메타태그 보완
- 기타 발견된 이슈 수정

---

## 6. 예상 변경 파일

| # | 파일 | 변경 유형 | FR |
|---|------|----------|-----|
| 1 | 없음 (검증만) | READ | FR-01~05 |
| 2 | `app/layout.tsx` | EDIT (필요시) | FR-06 |
| 3 | 각 `page.tsx` | EDIT (필요시) | FR-06 |

**참고**: 이 PDCA는 주로 검증 작업이며, 코드 변경은 미비 사항 발견 시에만 발생.

---

## 7. 성공 기준

| 지표 | 목표 |
|------|------|
| 빌드 에러 | 0개 |
| 린트 에러 | 0개 |
| FR-01~06 검증 통과율 | 100% |
| 미비 사항 발견 시 수정 | 완료 |
| 최종 체크리스트 전체 통과 | ✅ |

---

## 8. 다음 단계

이 Plan의 Design 문서에서 각 FR의 구체적 검증 방법과 통과 기준을 정의한다. Do 단계에서 실제 검증을 수행하고, 미비 사항을 수정한다.

**AdSense 재신청 준비 완료 후**:
1. 사이트 배포 (Vercel 등)
2. Google Search Console에 sitemap 제출
3. 주요 페이지 인덱싱 요청
4. 인덱싱 확인 후 AdSense 재신청
