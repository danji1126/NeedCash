# NeedCash 프로젝트 종합 분석 보고서

> 분석일: 2026-03-10
> 분석 대상: needcash.dev (Prototype Hub)
> 브랜치: feature/backend-service

## 프로젝트 요약

| 항목 | 수치 |
|------|------|
| 총 TS/TSX 파일 | 139개 |
| 총 코드 라인 | ~13,134줄 |
| 컴포넌트 수 | 80개 |
| API 라우트 | 11개 |
| 게임 수 | 9개 (리더보드 5개) |
| 디자인 테마 | 4종 |
| 다국어 이력서 | 5개 언어 |

## 분석 팀 구성

| 팀 | 보고서 | 담당 영역 |
|----|--------|-----------|
| 프론트엔드팀 | [01-frontend.md](./01-frontend.md) | 아키텍처, 컴포넌트, 디자인 시스템 |
| 백엔드팀 | [02-backend.md](./02-backend.md) | API, DB, 인증, 통계 |
| 보안/품질팀 | [03-security-quality.md](./03-security-quality.md) | 보안, 성능, 코드 품질 |
| SEO/UX팀 | [04-seo-ux.md](./04-seo-ux.md) | SEO, 접근성, UX |

## 종합 평가

### 강점
- Cloudflare Workers 기반 글로벌 엣지 배포
- 멀티 디자인 시스템으로 높은 시각적 다양성
- 로컬/운영 환경 분기를 통한 개발 편의성
- TypeScript strict 모드 + ESLint 9 적용
- 서버 사이드 점수 검증으로 게임 무결성 확보

### 주요 개선 필요 사항
1. **보안**: Stored XSS 위험 (allowDangerousHtml + rehypeRaw), timing-unsafe 토큰 비교, 보안 헤더 미설정
2. **코드 중복**: `getDB()` 함수가 4곳에 중복 정의
3. **에러 처리**: API 라우트에 try-catch 거의 없음 (11개 중 1개만)
4. **접근성**: text-muted WCAG AA 미달, 모바일 메뉴 focus trap 없음, 게임 키보드 접근 불가
5. **번들 최적화**: 미사용 의존성 3개 (next-themes, next-mdx-remote, gray-matter), 디자인 변형 미지연 로딩
6. **UX**: loading.tsx / error.tsx 부재, OG 이미지 없음
7. **테스트**: 테스트 코드 0%

### 우선순위별 액션 아이템

| 우선순위 | 항목 | 팀 |
|----------|------|----|
| P0 | Stored XSS 방지 (rehype-sanitize 추가) | 보안 |
| P0 | 하드코딩 시크릿 폴백 제거 + timing-safe 비교 | 보안 |
| P0 | 보안 헤더 설정 (CSP, HSTS, X-Frame-Options) | 보안 |
| P0 | text-muted 색상 대비 WCAG AA 충족 | SEO/UX |
| P0 | loading.tsx / error.tsx 추가 | SEO/UX |
| P0 | getDB() 4곳 중복 해소 → 공통 모듈화 | 백엔드 |
| P0 | 미사용 의존성 제거 + 디자인 변형 lazy loading | 프론트엔드 |
| P1 | API 에러 처리 통일 (try-catch + request.json()) | 백엔드 |
| P1 | 모바일 메뉴 접근성 (aria-expanded, focus trap, Escape) | SEO/UX |
| P1 | OG 이미지 생성 | SEO/UX |
| P1 | Reaction 게임 키보드 접근성 | SEO/UX |
| P2 | 테스트 코드 작성 (score-validation, compile-markdown) | 전체 |
| P2 | highlight.js CSS 셀프 호스팅 | 프론트엔드 |
| P2 | pageview 엔드포인트 최적화 (6회 → 2-3회 연산) | 백엔드 |
| P3 | About 페이지 기술 스택 업데이트 | SEO/UX |
| P3 | game_sessions 미사용 테이블 정리 | 백엔드 |
