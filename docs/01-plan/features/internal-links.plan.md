# Plan: internal-links (PDCA-7)

> **Feature**: internal-links (내부 링크 구조 + 카테고리 재편)
> **상위 계획**: AdSense 승인 로드맵 > PDCA-7
> **우선순위**: P2 (권장)
> **의존성**: PDCA-5, PDCA-6 완료 후 (링크할 콘텐츠 존재)
> **작성일**: 2026-02-25

---

## 1. 목적

모든 페이지 간 자연스러운 내부 링크 그물망을 구축하여 사이트 전체의 토피컬 오소리티를 강화한다. 게임 → 블로그 역방향 링크를 추가하고, RelatedPosts의 관련성을 개선한다.

---

## 2. 현재 상태 분석

### 내부 링크 현황

| 방향 | 현재 상태 | 문제 |
|------|----------|------|
| 블로그 → 게임 | ✅ science 포스트 3개에 게임 링크 | 양호 |
| 게임 → 블로그 | ❌ 없음 | **역방향 링크 부재** |
| 게임 → 게임 | ✅ RelatedGames 컴포넌트 | 양호 |
| 블로그 → 블로그 | ⚠️ RelatedPosts (최신 3개, 카테고리 무관) | 관련성 부족 |

### 블로그 카테고리 현황

| 카테고리 | 포스트 수 | 포스트 |
|----------|----------|--------|
| etc | 1 | hello-world |
| tech | 1 | getting-started |
| dev | 2 | iterm2-korean-fix, nextjs-mdx-blog-guide |
| review | 3 | speak-100-days, bullterrier, joker-gi |
| science | 3 | reaction-speed, color-sense, color-memory |

### 게임-블로그 매핑 (가능한 크로스 링크)

| 게임 | 관련 블로그 | 관계 |
|------|-----------|------|
| reaction | reaction-speed-science | 직접 연관 |
| color-sense | color-sense-guide | 직접 연관 |
| color-memory | color-memory-science | 직접 연관 |
| dice | - | 관련 포스트 없음 |
| lotto | - | 관련 포스트 없음 |
| animal-face | - | 관련 포스트 없음 |

---

## 3. 범위 (Scope)

### FR-01: 게임 → 블로그 크로스 링크

각 게임 페이지 하단에 관련 블로그 포스트 링크 섹션을 추가한다.

| 항목 | 상세 |
|------|------|
| 대상 | 관련 블로그가 있는 게임 3개 (reaction, color-sense, color-memory) |
| 위치 | GameContentSection 뒤, RelatedGames 앞 |
| 데이터 | game-content.ts에 `relatedBlog` 필드 추가 |
| UI | "더 알아보기" 섹션, 블로그 포스트 카드 1개 |

**완료 기준**: 3개 게임 페이지에서 관련 블로그 포스트로 이동 가능

### FR-02: RelatedPosts 카테고리 기반 추천

현재 최신 3개만 보여주는 RelatedPosts를 동일 카테고리 우선으로 개선한다.

| 항목 | 상세 |
|------|------|
| 로직 | 1순위: 같은 카테고리 포스트, 2순위: 최신 포스트 |
| 수량 | 3개 유지 |
| 데이터 | `getAllPosts()` 결과에서 카테고리 필터링 |

**완료 기준**: science 포스트에서 다른 science 포스트가 우선 표시됨

### FR-03: 블로그 카테고리 정리

현재 5개 카테고리(etc, tech, dev, review, science)를 4개로 통합 정리한다.

| 현재 | 변경 | 이유 |
|------|------|------|
| etc | tech | hello-world는 사이트/기술 소개 → tech이 적합 |
| tech | tech | 유지 |
| dev | tech | tech과 dev 구분 모호 → tech으로 통합 |
| review | review | 유지 |
| science | science | 유지 |

결과: **tech(4), review(3), science(3)** = 3개 카테고리

**완료 기준**: `etc`, `dev` 카테고리 포스트가 `tech`로 변경됨, 블로그 목록에 3개 카테고리만 표시

### FR-04: 블로그 목록 카테고리 필터

블로그 목록 페이지에 카테고리 필터 UI를 추가한다.

| 항목 | 상세 |
|------|------|
| UI | 탭/칩 형태의 카테고리 필터 (전체, tech, review, science) |
| 동작 | 클릭 시 해당 카테고리 포스트만 표시 |
| 위치 | 블로그 목록 상단, h1 아래 |
| 구현 | URL 파라미터 없이 클라이언트 사이드 필터링 |

**완료 기준**: 카테고리 클릭 시 해당 포스트만 표시, 전체 클릭 시 모든 포스트 표시

---

## 4. 기술 결정 사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 게임-블로그 매핑 저장소 | `game-content.ts`에 `relatedBlog` 필드 | 기존 데이터 구조 활용, 별도 매핑 파일 불필요 |
| 카테고리 필터 방식 | 클라이언트 사이드 (useState) | `output: 'export'` 정적 빌드이므로 서버 필터 불가 |
| dev/etc → tech 통합 | MDX frontmatter 직접 수정 | 포스트 수 적어 수동 변경이 효율적 |
| RelatedPosts 개선 | category prop 전달 | 기존 컴포넌트에 category 파라미터 추가 |

---

## 5. 변경 예상 파일

| # | 파일 | 변경 유형 | FR |
|---|------|----------|-----|
| 1 | `lib/game-content.ts` | EDIT | FR-01 |
| 2 | `components/game/game-content-section.tsx` | EDIT | FR-01 |
| 3 | `components/blog/related-posts.tsx` | EDIT | FR-02 |
| 4 | `app/blog/[slug]/page.tsx` | EDIT | FR-02 |
| 5 | `content/blog/hello-world.mdx` | EDIT | FR-03 |
| 6 | `content/blog/iterm2-korean-fix.mdx` | EDIT | FR-03 |
| 7 | `content/blog/nextjs-mdx-blog-guide.mdx` | EDIT | FR-03 |
| 8 | `app/blog/page.tsx` | EDIT | FR-04 |

---

## 6. 완료 기준

| # | 검증 항목 | FR |
|---|----------|-----|
| 1 | 게임 3개(reaction, color-sense, color-memory) 페이지에 관련 블로그 링크 표시 | FR-01 |
| 2 | 블로그 포스트에서 동일 카테고리 관련 글이 우선 표시 | FR-02 |
| 3 | `etc`, `dev` 카테고리 포스트가 `tech`으로 변경됨 | FR-03 |
| 4 | 블로그 목록에 카테고리 필터 UI 동작 | FR-04 |
| 5 | `pnpm build` 성공 (0 errors) | ALL |
| 6 | `pnpm lint` 통과 (0 warnings) | ALL |
| 7 | 페이지당 내부 링크 2개 이상 | ALL |
| 8 | 데드 링크 0건 | ALL |

---

## 7. PDCA 사이클

- **Plan**: 이 문서 (현재)
- **Design**: `docs/02-design/features/internal-links.design.md` 작성 필요
- **Do**: 구현 (FR-01 → FR-03 → FR-02 → FR-04 순서)
- **Check**: Gap Analysis (`/pdca analyze internal-links`)
- **Act**: Match Rate < 90% 시 자동 개선

---

## 8. AdSense 로드맵 진행 상황

| PDCA | 항목 | Match Rate | 상태 |
|------|------|-----------|------|
| PDCA-1 | 유해 콘텐츠 제거 | - | ✅ 완료 |
| PDCA-2 | SEO 인프라 | 92% | ✅ 완료 |
| PDCA-3 | 콘텐츠 품질 강화 | 100% | ✅ 완료 |
| PDCA-4 | 사이트 구조/탐색성 | 100% | ✅ 완료 |
| PDCA-5 | 페이지 경험 최적화 | 100% | ✅ 완료 |
| PDCA-6 | 필수 페이지 보강 | 100% | ✅ 완료 |
| **PDCA-7** | **내부 링크 구조** | **-** | **📝 Plan** |
| PDCA-8 | 최종 점검 + 재신청 | - | ⏳ 대기 |
