# Backend Hosting Platform 브레인스토밍

> NeedCash 프로젝트에 백엔드를 별도 서비스로 도입하기 위한 무료 호스팅 플랫폼 조사 및 비교

## 현재 상황

- **프론트엔드**: Next.js 15 App Router → **Cloudflare Pages**에 배포 중
- **백엔드**: 미구현 → 별도 서비스로 배포 예정
- **아키텍처**: 프론트엔드(Cloudflare) ↔ 백엔드 API(별도 호스팅) 분리 구조
- 인증/로그인 없음, 블로그 MDX 정적 생성, 게임 클라이언트 사이드 렌더링

## 아키텍처 고려사항

```
┌─────────────────────┐         ┌─────────────────────┐
│  Cloudflare Pages   │  HTTPS  │   Backend Service   │
│  (Next.js Frontend) │ ◄─────► │   (별도 호스팅)      │
│  - SSG/SSR 페이지    │  API    │   - REST/GraphQL    │
│  - 정적 자산         │  호출    │   - Auth            │
│  - 클라이언트 로직    │         │   - Database        │
└─────────────────────┘         └─────────────────────┘
```

**분리 배포 시 체크포인트:**
- CORS 설정 (Cloudflare 도메인 허용)
- API 엔드포인트 URL 환경변수 관리
- 인증 토큰 전달 방식 (Cookie vs Bearer Token)
- 프론트엔드 → 백엔드 네트워크 지연 (리전 선택)

---

## 무료 백엔드 호스팅 플랫폼 비교

### 1. Cloudflare Workers + D1

| 항목 | 내용 |
|------|------|
| **유형** | Edge Serverless + SQL DB |
| **DB** | D1 (SQLite 기반, 서버리스) |
| **무료 티어** | Workers 100K 요청/일, D1 읽기 5M/일, 쓰기 100K/일, Storage 5GB |
| **주요 기능** | Workers (API), D1 (DB), KV (캐시), R2 (Storage), Queues |

**추천 이유:**
- **이미 Cloudflare 사용 중** → 같은 플랫폼에서 백엔드 추가, 별도 계정/결제 불필요
- CORS 문제 최소화 (같은 Cloudflare 인프라, 커스텀 도메인 라우팅 가능)
- D1 무료 5GB + 일 500만 읽기는 사이드 프로젝트에 매우 넉넉
- KV(1GB, 10만 읽기/일)로 세션/캐시 처리 가능
- Edge 실행 → 전 세계 저지연 응답
- R2 Storage(무료 10GB)로 파일 업로드 가능

**단점:**
- D1은 SQLite 기반 → PostgreSQL 대비 기능 제한 (JOIN 지원하지만 고급 기능 부족)
- Workers CPU 시간 10ms/요청 제한 (무료) → 복잡한 연산 불가
- Auth 기본 미제공 → 직접 구현 또는 서드파티(Clerk, Lucia 등) 필요
- Workers 런타임은 Node.js가 아님 → 일부 npm 패키지 비호환

**NeedCash 활용 예시:**
- 게임 점수 CRUD API (D1에 저장)
- KV로 리더보드 캐싱
- R2로 사용자 프로필 이미지 저장

---

### 2. Supabase

| 항목 | 내용 |
|------|------|
| **유형** | BaaS (Backend as a Service) |
| **DB** | PostgreSQL |
| **무료 티어** | API 요청 무제한, MAU 50,000, DB 500MB, Storage 1GB |
| **주요 기능** | Auth, Realtime, Edge Functions, Storage, Vector(pgvector) |

**추천 이유:**
- Auth(소셜 로그인 포함) 기본 제공 → 별도 인증 구현 불필요
- PostgreSQL 기반 → SQL 학습 및 확장에 유리, ORM 호환
- Realtime 기능으로 게임 리더보드 등 실시간 업데이트 가능
- 클라이언트 SDK로 프론트엔드에서 직접 호출 가능 (별도 API 서버 불필요)
- 오픈소스 → 벤더 락인 없음, 셀프 호스팅 가능

**단점:**
- 무료 프로젝트 1주일 미사용 시 일시 중지 (재시작 가능)
- 무료 티어에서 프로젝트 2개 제한
- DB 500MB 용량 제한
- Cloudflare와 별개 플랫폼 → 계정/관리 포인트 분리

**NeedCash 활용 예시:**
- 게임 점수 저장 및 Realtime 리더보드
- 블로그 댓글/좋아요 시스템
- 소셜 로그인 (Google, GitHub)

---

### 3. Appwrite

| 항목 | 내용 |
|------|------|
| **유형** | BaaS (Backend as a Service, 오픈소스) |
| **DB** | MariaDB (내부), REST/GraphQL API 제공 |
| **무료 티어** | 대역폭 10GB, Storage 2GB, 실행 750K/월, DB 무제한 |
| **주요 기능** | Auth, Database, Functions, Storage, Messaging |

**추천 이유:**
- **DB 용량 무제한** → 용량 걱정 없이 데이터 저장
- Auth, DB, Storage, Functions 올인원 제공
- REST + GraphQL API 자동 생성 → API 직접 설계 불필요
- 완전 오픈소스 → 셀프 호스팅 가능
- 클라이언트 SDK로 프론트엔드에서 직접 호출 가능

**단점:**
- MariaDB 기반 → PostgreSQL 대비 생태계 작음
- Supabase 대비 커뮤니티/튜토리얼 규모 작음
- Cloudflare와 별개 플랫폼 → 관리 포인트 분리
- Realtime 기능이 Supabase 대비 제한적

**NeedCash 활용 예시:**
- 용량 제한 없는 게임 데이터 저장
- 소셜 로그인 + 사용자 프로필 관리
- 블로그 댓글 시스템

---

### 4. Firebase (Google)

| 항목 | 내용 |
|------|------|
| **유형** | BaaS (Backend as a Service) |
| **DB** | Firestore (NoSQL) / Data Connect (PostgreSQL, 2026 신규) |
| **무료 티어** | Storage 1GB, 대역폭 10GB/월, Firestore 읽기 50K/일 |
| **주요 기능** | Auth, Firestore, Cloud Functions, Hosting, Analytics |

**추천 이유:**
- Google 생태계 통합 (Analytics, AdMob)
- Firebase Auth가 매우 성숙하고 안정적
- Flutter 앱 개발 시 SDK 통합이 가장 쉬움
- 클라이언트 SDK로 프론트엔드에서 직접 호출

**단점:**
- 사용량 기반 과금 → 트래픽 증가 시 비용 예측 어려움
- NoSQL(Firestore) 구조는 복잡한 쿼리에 불리
- 벤더 락인 (Google 종속)
- Cloudflare와 별개 플랫폼

**NeedCash 활용 예시:**
- Flutter 모바일 앱과 웹 동시 백엔드
- AdSense/Analytics 통합

---

### 5. Railway

| 항목 | 내용 |
|------|------|
| **유형** | PaaS (Platform as a Service) |
| **DB** | PostgreSQL, MySQL, Redis, MongoDB 등 |
| **무료 티어** | Trial: $5 크레딧 일회성, Hobby: $5/월 + $5 크레딧 |
| **주요 기능** | 원클릭 DB 배포, Docker 지원, Git 연동, Private Networking |

**추천 이유:**
- 자체 Node.js/Express/Fastify 서버를 자유롭게 구축 가능
- Docker 컨테이너 기반 → 어떤 런타임이든 지원
- 원클릭 PostgreSQL, Redis 등 DB 배포
- Git push 자동 배포

**단점:**
- 완전 무료가 아님 (Hobby $5/월)
- Auth, Storage 등 직접 구현 필요
- 커스텀 서버 운영 부담
- Trial은 $5 일회성 크레딧만

**NeedCash 활용 예시:**
- Express/Fastify로 커스텀 REST API 서버
- 자유로운 백엔드 로직 구현

---

### 6. Neon

| 항목 | 내용 |
|------|------|
| **유형** | Serverless PostgreSQL (DB only) |
| **DB** | PostgreSQL (Serverless) |
| **무료 티어** | Storage 512MB, Compute 190시간/월, Branching 지원 |
| **주요 기능** | DB Branching, Autoscaling, Serverless Driver |

**추천 이유:**
- 순수 PostgreSQL → ORM(Prisma, Drizzle)과 완벽 호환
- DB Branching → 개발/프로덕션 DB 분리
- Serverless Driver로 Edge Runtime(Cloudflare Workers 포함)에서 동작

**단점:**
- DB만 제공 → API 서버, Auth, Storage 모두 별도 필요
- 단독으로는 백엔드 역할 불가 → 다른 서비스와 조합 필수

**NeedCash 활용 예시:**
- Cloudflare Workers + Neon 조합 (Workers에서 Neon DB 연결)
- 커스텀 API 서버의 DB로 사용

---

## 비교 요약표

| 플랫폼 | 유형 | DB | Auth | 무료 DB 용량 | 같은 Cloudflare 인프라 | 완전 무료 |
|--------|------|-----|------|-------------|---------------------|----------|
| **Cloudflare Workers+D1** | Edge Serverless | SQLite(D1) | X | 5GB | **O** | O |
| **Supabase** | BaaS | PostgreSQL | **O** | 500MB | X | O |
| **Appwrite** | BaaS | MariaDB | **O** | **무제한** | X | O |
| **Firebase** | BaaS | NoSQL | **O** | 1GB | X | O |
| **Railway** | PaaS | PostgreSQL 등 | X | $5 크레딧 | X | **X** |
| **Neon** | DB only | PostgreSQL | X | 512MB | X | O |

## 조합별 아키텍처 비교

### 조합 A: Cloudflare 통합 (Workers + D1)

```
Cloudflare Pages (Frontend)  ──┐
                                ├── 같은 Cloudflare 계정
Cloudflare Workers (Backend)  ──┘
  └── D1 (DB) + KV (캐시) + R2 (Storage)
```

- 장점: 관리 포인트 하나, CORS 간편, 무료 용량 넉넉(5GB)
- 단점: Auth 직접 구현, SQLite 기반, Workers 런타임 제약
- 적합: API 로직이 단순하고 인증 요구사항이 적은 경우

### 조합 B: Cloudflare + BaaS (Supabase/Appwrite)

```
Cloudflare Pages (Frontend)
  └── Supabase/Appwrite SDK (클라이언트에서 직접 호출)
        └── Auth + DB + Storage + Realtime
```

- 장점: Auth/DB/Storage 올인원, API 서버 구축 불필요
- 단점: 외부 서비스 의존, CORS 설정 필요, 플랫폼 분리 관리
- 적합: 인증이 필요하고 빠르게 백엔드를 구축하고 싶은 경우

### 조합 C: Cloudflare + Workers + Neon

```
Cloudflare Pages (Frontend)
  └── Cloudflare Workers (API Layer)
        └── Neon PostgreSQL (DB)
```

- 장점: PostgreSQL 사용 가능, Workers에서 API 로직 자유 구현
- 단점: Auth 별도 구현, 서비스 2개 관리 (Cloudflare + Neon)
- 적합: PostgreSQL이 필요하면서 API 로직도 커스텀하고 싶은 경우

---

## NeedCash 프로젝트 추천

### 1순위: Cloudflare Workers + D1 (조합 A)

**이유:**
1. **이미 Cloudflare 사용 중** → 추가 계정/플랫폼 없이 바로 시작
2. **D1 무료 5GB** → 비교 대상 중 가장 넉넉한 DB 용량 (Appwrite 무제한 제외)
3. **관리 포인트 통합** → 프론트엔드와 백엔드를 한 대시보드에서 관리
4. **CORS 간편** → 같은 도메인 하위 라우팅 가능 (`/api/*` → Workers)
5. **Edge 저지연** → 전 세계 사용자에게 빠른 API 응답
6. **비용 0원** → 일 10만 요청, DB 5GB 완전 무료

**적합한 첫 번째 기능:** 게임 리더보드 API (단순 CRUD, 인증 불필요)

### 2순위: Supabase (조합 B)

**이유:**
1. **Auth가 필요해질 때** → 소셜 로그인, 회원 관리 기본 제공
2. **Realtime** → 리더보드 실시간 업데이트
3. **PostgreSQL** → 학습 가치 높고 확장성 좋음

**적합한 시나리오:** 로그인/회원가입이 핵심 기능으로 들어올 때 전환

### 3순위: Appwrite (조합 B)

**이유:**
1. **DB 무제한** → 데이터 양이 많아질 경우
2. **Auth 포함** → Supabase 대안
3. **오픈소스** → 셀프 호스팅으로 완전 무료 운영 가능

**적합한 시나리오:** DB 용량이 중요하거나 셀프 호스팅을 원할 때

---

## 다음 단계

1. 백엔드 첫 기능 결정 (게임 리더보드 / 블로그 댓글 / 사용자 인증)
2. 선택한 플랫폼으로 PoC 구축
3. 프론트엔드 ↔ 백엔드 API 통신 패턴 설계
4. CLAUDE.md에 선택한 백엔드 스택 반영

## 참고 자료

- [Cloudflare Workers 가격](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 가격](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare Workers 개발 가이드 2026](https://www.digitalapplied.com/blog/edge-computing-cloudflare-workers-development-guide-2026)
- [Supabase vs Firebase 2026 비교](https://www.zignuts.com/blog/firebase-vs-supabase)
- [Appwrite vs Supabase vs Firebase 비교](https://uibakery.io/blog/appwrite-vs-supabase-vs-firebase)
- [Railway vs Render 비교](https://northflank.com/blog/railway-vs-render)
