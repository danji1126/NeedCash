# Plan: adsense-harmful-removal (PDCA-1)

> **피처명**: adsense-harmful-removal
> **우선순위**: P0 (즉시)
> **상위 계획**: `docs/01-plan/adsense-approval.plan.md` > PDCA-1
> **작성일**: 2026-02-24
> **목표**: 애드센스 심사에 치명적인 부정적 신호를 제거하여 재신청 기반 마련

---

## 1. 배경

구글 애드센스 심사에서 "가치가 별로 없는 콘텐츠"로 거절됨. 전문가 패널 분석 결과, 다음 항목이 **즉시 제거해야 할 치명적 요소**로 합의됨:

- **Ads 페이지**: 빈 광고 템플릿 → "광고 목적 사이트" 인상
- **AdBanner 컴포넌트 사용**: 승인 전 광고 배치 → 정책적 부정 신호
- **네비게이션 Ads 링크**: 빈 페이지로의 유도

## 2. 요구사항

### FR-01: Ads 페이지 라우트 삭제
- `apps/web/app/ads/page.tsx` 파일 삭제
- `/ads` 접근 시 404 반환 확인

### FR-02: 네비게이션에서 Ads 링크 제거
- `apps/web/lib/constants.ts` > `NAV_LINKS`에서 `/ads` 항목 제거
- `apps/web/app/page.tsx` > `SECTIONS`에서 `/ads` 항목 제거

### FR-03: 게임 페이지에서 AdBanner 제거
- `apps/web/app/game/[slug]/page.tsx`에서 AdBanner import 및 사용 제거

### FR-04: 블로그 페이지에서 AdBanner 제거
- `apps/web/app/blog/[slug]/page.tsx`에서 AdBanner import 및 사용 제거

### FR-05: AdBanner 컴포넌트 파일 삭제
- `apps/web/components/ads/ad-banner.tsx` 삭제
- `apps/web/components/ads/` 디렉토리 삭제

### FR-06: 사이트 설명 업데이트
- `apps/web/lib/constants.ts` > `SITE.description`에서 "광고" 문구 제거
- 현재: "프로토타입 허브 - 게임, 블로그, 광고, 이력서를 하나의 공간에서."
- 변경: "프로토타입 허브 - 게임, 블로그, 이력서를 하나의 공간에서."

### 유지 항목 (삭제하지 않음)
- `apps/web/app/layout.tsx`의 adsbygoogle 스크립트 → 애드센스 사이트 인증에 필요
- `apps/web/app/layout.tsx`의 `google-adsense-account` 메타태그 → 소유권 확인용

## 3. 영향 범위

| 파일 | 작업 | 변경 유형 |
|------|------|----------|
| `apps/web/app/ads/page.tsx` | 삭제 | DELETE |
| `apps/web/components/ads/ad-banner.tsx` | 삭제 | DELETE |
| `apps/web/components/ads/` | 디렉토리 삭제 | DELETE |
| `apps/web/lib/constants.ts` | NAV_LINKS, SITE.description 수정 | EDIT |
| `apps/web/app/page.tsx` | SECTIONS에서 /ads 제거 | EDIT |
| `apps/web/app/game/[slug]/page.tsx` | AdBanner import/usage 제거 | EDIT |
| `apps/web/app/blog/[slug]/page.tsx` | AdBanner import/usage 제거 | EDIT |

## 4. 완료 기준

- [ ] `/ads` 경로 접근 시 404 반환
- [ ] 사이트 어디에서도 "Ads" 네비게이션 링크 없음
- [ ] 게임/블로그 페이지에 광고 배너 없음
- [ ] `components/ads/` 디렉토리 존재하지 않음
- [ ] `pnpm build` 성공 (빌드 에러 없음)
- [ ] `pnpm lint` 통과

## 5. PDCA 사이클

- **Plan**: 이 문서 (현재 단계)
- **Design**: 별도 설계 불필요 (삭제 작업)
- **Do**: 7개 파일 수정/삭제 실행
- **Check**: 빌드 성공 + /ads 404 + 네비게이션 확인
- **Act**: 문제 발견 시 즉시 수정

> **다음 단계**: 이 문서 승인 후 바로 Do 단계로 진입 (`/pdca do adsense-harmful-removal`)
