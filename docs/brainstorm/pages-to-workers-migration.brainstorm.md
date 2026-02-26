# Cloudflare Pages → Workers 마이그레이션 브레인스토밍

> NeedCash 프론트엔드를 Cloudflare Pages에서 Workers로 전환하는 방법과 순서

## 왜 전환해야 하는가?

- Cloudflare는 **2025년 4월 Pages를 Deprecated** 선언, 모든 신규 기능은 Workers에 집중
- 차후 Pages 프로젝트는 Workers로 자동 마이그레이션 예정
- Workers 전환 시 **D1(DB), KV(캐시), R2(Storage)** 등 백엔드 리소스에 직접 바인딩 가능
- API Routes(SSR) 사용 가능 → 현재 정적 export 전용에서 풀스택으로 확장

## 현재 상태 분석

```
현재 구성:
├── wrangler.toml          → pages_build_output_dir = "./apps/web/out" (Pages 모드)
├── next.config.ts         → output: 'export' (정적 빌드, SSR 불가)
├── Next.js 16.1.6         → @opennextjs/cloudflare 미설치
├── _headers / _redirects  → 미사용
└── Pages Functions        → 미사용
```

**핵심 포인트:** 현재 정적 export만 사용 중이므로 마이그레이션 복잡도가 낮음.
Pages 고유 기능(_headers, _redirects, Functions)을 쓰지 않아 충돌 위험 없음.

## 전환 후 달라지는 점

| 항목 | Pages (현재) | Workers (전환 후) |
|------|-------------|-------------------|
| **렌더링** | SSG only (`output: 'export'`) | SSG + SSR + API Routes |
| **백엔드 바인딩** | 불가 | D1, KV, R2, Queues 직접 바인딩 |
| **런타임** | 정적 파일 서빙 | Edge Runtime (workerd) |
| **빌드 도구** | `next build` | `opennextjs-cloudflare build` |
| **배포 명령** | `wrangler pages deploy` | `wrangler deploy` |
| **개발 서버 포트** | 8788 | 8787 |
| **Node.js 호환** | 해당 없음 | `nodejs_compat` 플래그 필요 |

---

## 마이그레이션 단계

### Phase 1: 패키지 설치

```bash
cd apps/web
npm i @opennextjs/cloudflare@latest
npm i -D wrangler@latest
```

- `@opennextjs/cloudflare`: Next.js를 Cloudflare Workers 런타임에서 실행 가능하게 변환
- `wrangler`: Cloudflare Workers 개발/배포 CLI

---

### Phase 2: next.config.ts 수정

**변경 전:**
```ts
const nextConfig: NextConfig = {
  output: 'export',
};
```

**변경 후:**
```ts
const nextConfig: NextConfig = {
  // output: 'export' 제거 → SSR/API Routes 활성화
};
```

> `output: 'export'` 제거가 핵심. 이것이 있으면 SSR과 API Routes를 쓸 수 없음.
> 제거해도 기존 정적 페이지들은 자동으로 SSG로 빌드됨 (변경 사항 없음).

---

### Phase 3: OpenNext 설정 파일 생성

프로젝트 루트(`apps/web/`)에 `open-next.config.ts` 생성:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig();
```

---

### Phase 4: wrangler.toml 수정

**변경 전 (프로젝트 루트의 현재 파일):**
```toml
name = "needcash-hub"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./apps/web/out"
```

**변경 후:**
```toml
name = "needcash-hub"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

**주요 변경:**
- `pages_build_output_dir` 제거 → Pages 모드 해제
- `main` 추가 → Worker 엔트리 포인트 지정
- `compatibility_flags = ["nodejs_compat"]` → Node.js API 호환성 활성화
- `[assets]` 섹션 → 정적 자산 경로를 OpenNext 빌드 출력으로 변경

**wrangler.toml 위치 고려사항:**
- 현재 프로젝트 루트(`/`)에 있음
- OpenNext 빌드 출력은 `apps/web/.open-next/`에 생성됨
- wrangler.toml을 `apps/web/`으로 이동하거나, 경로를 상대적으로 조정 필요

```toml
# 옵션 A: wrangler.toml을 apps/web/으로 이동
main = ".open-next/worker.js"

[assets]
directory = ".open-next/assets"
```

```toml
# 옵션 B: 프로젝트 루트에 유지
main = "./apps/web/.open-next/worker.js"

[assets]
directory = "./apps/web/.open-next/assets"
```

---

### Phase 5: package.json 스크립트 수정

`apps/web/package.json`에 빌드/배포 스크립트 추가:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "lint": "eslint"
  }
}
```

- `preview`: 로컬에서 Workers 환경으로 테스트 (실제 배포 전 검증)
- `deploy`: 빌드 후 Cloudflare Workers에 배포

---

### Phase 6: 로컬 테스트

```bash
cd apps/web

# 1. 기존 Next.js 개발 서버 (변경 사항 없는지 확인)
pnpm dev

# 2. Workers 환경 프리뷰 (실제 Edge Runtime에서 동작 확인)
pnpm preview
```

**확인 사항:**
- [ ] 메인 페이지 정상 렌더링
- [ ] 게임 페이지 클라이언트 사이드 렌더링 정상
- [ ] 블로그 MDX 페이지 정상
- [ ] 다크/라이트 테마 전환 정상
- [ ] framer-motion 애니메이션 정상
- [ ] 이미지/폰트 등 정적 자산 로드 정상

---

### Phase 7: Cloudflare 배포

```bash
cd apps/web
pnpm deploy
```

**배포 후 확인:**
- [ ] 프로덕션 URL에서 모든 페이지 접근 가능
- [ ] HTTPS 정상 동작
- [ ] 커스텀 도메인 연결 확인

---

### Phase 8: 기존 Pages 프로젝트 정리

배포 확인 후 기존 Pages 프로젝트 삭제:

```bash
# Pages 프로젝트 삭제 (Workers로 완전 전환 확인 후)
npx wrangler pages project delete needcash-hub
```

> 커스텀 도메인이 Pages에 연결되어 있다면, Workers에 먼저 도메인을 연결한 후 Pages를 삭제해야 함.

---

### Phase 9 (선택): 백엔드 리소스 바인딩 추가

마이그레이션 완료 후, wrangler.toml에 백엔드 리소스 추가:

```toml
name = "needcash-hub"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

# D1 데이터베이스 바인딩
[[d1_databases]]
binding = "DB"
database_name = "needcash-db"
database_id = "<생성 후 ID 입력>"

# KV 네임스페이스 바인딩 (캐시용)
[[kv_namespaces]]
binding = "CACHE"
id = "<생성 후 ID 입력>"
```

D1 데이터베이스 생성:
```bash
npx wrangler d1 create needcash-db
```

---

## 주의사항 및 리스크

### 확인이 필요한 항목

1. **`@teachablemachine/image` 호환성**
   - TensorFlow.js 기반 패키지 → Workers Edge Runtime에서 동작하는지 확인 필요
   - 동작하지 않으면 해당 기능만 클라이언트 사이드로 유지 (`"use client"`)

2. **MDX 빌드 호환성**
   - `next-mdx-remote` + `shiki`가 OpenNext 빌드에서 정상 동작하는지 확인
   - 빌드 타임에 처리되므로 대부분 문제 없을 것으로 예상

3. **framer-motion 호환성**
   - 클라이언트 사이드 라이브러리이므로 문제 없을 것으로 예상
   - `"use client"` 컴포넌트에서만 사용 중이면 안전

4. **커스텀 도메인 전환**
   - Pages → Workers 도메인 전환 시 다운타임 발생 가능
   - DNS 전파 시간 고려 (수 분 ~ 수 시간)

### 롤백 계획

문제 발생 시 되돌리는 방법:
1. `next.config.ts`에 `output: 'export'` 다시 추가
2. `wrangler.toml`을 원래 Pages 설정으로 복원
3. `wrangler pages deploy` 로 Pages에 재배포

---

## 작업 순서 요약

```
Phase 1: 패키지 설치 (@opennextjs/cloudflare, wrangler)
    ↓
Phase 2: next.config.ts에서 output: 'export' 제거
    ↓
Phase 3: open-next.config.ts 생성
    ↓
Phase 4: wrangler.toml을 Workers 설정으로 변경
    ↓
Phase 5: package.json 스크립트 추가 (preview, deploy)
    ↓
Phase 6: 로컬 테스트 (pnpm dev → pnpm preview)
    ↓
Phase 7: Workers로 배포 (pnpm deploy)
    ↓
Phase 8: 기존 Pages 프로젝트 정리
    ↓
Phase 9: D1, KV 등 백엔드 리소스 바인딩 추가
```

## 참고 자료

- [공식 가이드: Pages → Workers 마이그레이션](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- [Next.js on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext.js Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [Cloudflare Pages Deprecated 마이그레이션 가이드](https://vibecodingwithfred.com/blog/pages-to-workers-migration/)
- [Pages와 Workers 통합 공식 발표](https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/)
