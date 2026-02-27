# Report: local-sqlite-setup

> **Feature**: local-sqlite-setup (로컬 SQLite 개발 환경 구축)
> **완료일**: 2026-02-27
> **Match Rate**: 95.8%
> **Iteration**: 0 (Act 불필요)

---

## 1. 개요

`pnpm dev` (Next.js dev server)에서 Cloudflare D1 없이 블로그/Admin/sitemap 기능을 테스트할 수 있는 로컬 SQLite 개발 환경을 구축했다. `better-sqlite3`를 D1Database 인터페이스로 래핑하는 Adapter 패턴을 적용하여 기존 코드 변경을 최소화했다.

---

## 2. PDCA 진행 요약

| 단계 | 상태 | 산출물 |
|------|:----:|--------|
| Plan | ✅ | `docs/01-plan/features/local-sqlite-setup.plan.md` |
| Design | ✅ | `docs/02-design/features/local-sqlite-setup.design.md` |
| Do | ✅ | 코드 구현 완료 (6 Steps) |
| Check | ✅ | `docs/03-analysis/local-sqlite-setup.analysis.md` (95.8%) |
| Act | - | 불필요 (>= 90%) |
| Report | ✅ | 본 문서 |

---

## 3. 구현 내역

### 신규 파일

| 파일 | 역할 |
|------|------|
| `lib/local-db.ts` | D1Database 호환 SQLite 래퍼 (93줄) |
| `.env.local` | `USE_LOCAL_DB=true`, `ADMIN_API_KEY=dev-secret-key` |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/db.ts` | top-level import 제거, `getDB()` 환경 감지 분기 (동적 require) |
| `lib/auth.ts` | top-level import 제거, `verifyAdminAuth()` 환경 감지 분기 |
| `package.json` | `better-sqlite3` v12 devDep, `onlyBuiltDependencies`, `db:reset` script |
| `.gitignore` | `data/local.sqlite*` 패턴 추가 |

### 변경하지 않은 파일

- `app/blog/**`, `app/api/**`, `app/admin/**`, `app/sitemap.ts`
- `migrations/**`, `wrangler.toml`, `components/**`

---

## 4. 기술 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| SQLite 라이브러리 | `better-sqlite3` v12 | 최고 성능, RETURNING 지원, D1 동일 엔진 |
| 환경 감지 방식 | `USE_LOCAL_DB` 환경변수 | 명시적, 디버깅 용이, `.env.local` 자동 로드 |
| import 방식 | 동적 `require()` | Workers 빌드 시 네이티브 모듈 번들 방지 |
| DB 파일 경로 | `data/local.sqlite` | `.wrangler/` 충돌 방지, 명확한 위치 |
| 마이그레이션 | 싱글턴 초기화 시 자동 실행 | NFR-04 충족 (별도 셋업 불필요) |

---

## 5. 요구사항 충족도

### 기능 요구사항 (8개)

| ID | 요구사항 | 결과 |
|----|----------|:----:|
| FR-01 | 블로그 SSR | ✅ |
| FR-02 | Admin CRUD | ✅ |
| FR-03 | sitemap 동적 생성 | ✅ |
| FR-04 | 자동 초기화 | ✅ |
| FR-05 | Production 무영향 | ✅ |
| FR-06 | `pnpm db:reset` | ✅ |
| FR-07 | RETURNING 호환 | ✅ (버전 차이만) |
| FR-08 | 로컬 인증 | ✅ |

### 비기능 요구사항 (4개)

| ID | 요구사항 | 결과 |
|----|----------|:----:|
| NFR-01 | 최소 코드 변경 | ✅ |
| NFR-02 | devDep만 추가 | ✅ |
| NFR-03 | .gitignore | ✅ |
| NFR-04 | 자동 초기화 | ✅ |

---

## 6. 검증 결과

### 엔드포인트 테스트 (`pnpm dev` + `USE_LOCAL_DB=true`)

| 엔드포인트 | HTTP | 응답 시간 |
|-----------|:----:|:---------:|
| `GET /blog` | 200 | 135ms |
| `GET /blog/[slug]` | 200 | 317ms |
| `GET /api/posts` | 200 | 677ms |
| `GET /sitemap.xml` | 200 | 138ms |
| `GET /api/auth/verify` | 200 | 47ms |

### 단위 검증

| 항목 | 결과 |
|------|:----:|
| DB 초기화 + 마이그레이션 | ✅ |
| 시드 데이터 로드 (10개 포스트) | ✅ |
| `RETURNING *` 네이티브 지원 | ✅ |
| INSERT + DELETE 트랜잭션 | ✅ |

---

## 7. Gap 및 향후 개선

### 유일한 Gap

**FR-07 버전 차이**: Design `^11.0.0` vs 구현 `^12.6.2`. 기능적으로 완전 호환. Design 문서 업데이트로 해소 가능.

### 향후 개선 가능 사항 (현재 범위 외)

- HMR 시 SQLite 커넥션 재생성 방지 (global 캐싱)
- `wrangler d1 execute --local` 연동 스크립트
- 시스템 레벨 `sqlite3` CLI 디버깅 가이드

---

## 8. 개발 워크플로우

```bash
# 최초 설정 (1회)
cd apps/web
pnpm add -D better-sqlite3 @types/better-sqlite3

# 일상 개발
pnpm dev
# → 자동 SQLite 초기화 + 마이그레이션
# → http://localhost:3000/blog
# → http://localhost:3000/admin (Key: dev-secret-key)

# 데이터 리셋
pnpm db:reset

# 프로덕션 테스트
pnpm preview
```
