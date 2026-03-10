# Design: quality-foundation

> 코드베이스 품질 기반 구축 - 51개 개선 항목에 대한 구현 설계

**참조**: `docs/01-plan/features/quality-foundation.plan.md`

---

## Phase 1: P0 보안 + 코드 기반 (12개 항목)

### 1. SEC-01: Stored XSS 방지 — rehype-sanitize 추가

**파일**: `lib/compile-markdown.ts`

**현재 코드**:
```typescript
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);
```

**변경 설계**:
```typescript
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// highlight.js 클래스 + slug id 허용하는 커스텀 스키마
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
    // rehype-slug이 생성하는 heading id 허용
    h1: [...(defaultSchema.attributes?.h1 || []), "id"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, sanitizeSchema)  // rehypeRaw 직후
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);
```

**주의**: `rehypeSanitize`는 `rehypeRaw` 직후, `rehypeSlug`/`rehypeHighlight` 이전에 배치해야 한다. sanitize가 먼저 실행되면 이후 플러그인이 추가하는 속성은 안전하다.

**패키지**: `pnpm add rehype-sanitize`

---

### 2. SEC-02: Admin 미리보기 XSS — DOMPurify 적용

**파일**: `components/admin/markdown-editor.tsx`

**현재 코드** (line 32-34):
```typescript
const preview = useMemo(() => {
  if (!showPreview || !value) return "";
  return marked.parse(value) as string;
}, [value, showPreview]);
```

**변경 설계**:
```typescript
import DOMPurify from "dompurify";

const preview = useMemo(() => {
  if (!showPreview || !value) return "";
  const raw = marked.parse(value) as string;
  return DOMPurify.sanitize(raw);
}, [value, showPreview]);
```

**패키지**: `pnpm add dompurify && pnpm add -D @types/dompurify`

---

### 3. SEC-03: 하드코딩 시크릿 폴백 제거

**파일**: `lib/auth.ts`

**현재 코드** (line 7-8):
```typescript
if (process.env.USE_LOCAL_DB === "true") {
  return token === (process.env.ADMIN_API_KEY ?? "dev-secret-key");
}
```

**변경 설계**:
```typescript
if (process.env.USE_LOCAL_DB === "true") {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return false;
  return timingSafeCompare(token, key);
}
```

`.env.development`에 `ADMIN_API_KEY=dev-secret-key`가 이미 설정되어 있으므로, 코드에서 폴백을 제거해도 로컬 개발에 영향 없음.

---

### 4. SEC-04: 보안 헤더 설정

**파일**: `next.config.ts` (현재 빈 설정)

**변경 설계**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**참고**: CSP는 `report-only` 모드로 먼저 배포 후 안정 확인 뒤 enforce. highlight.js CDN, Google Adsense 등 외부 리소스를 고려해 초기에는 CSP 제외.

---

### 5. SEC-05: timing-safe 토큰 비교

**파일**: `lib/auth.ts`

**변경 설계**: SEC-03과 통합. `===` 비교를 `timingSafeCompare` 헬퍼로 교체.

```typescript
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  const key = await crypto.subtle.importKey(
    "raw", aBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, bBuf);
  const expected = await crypto.subtle.sign("HMAC", key, aBuf);
  return arraysEqual(new Uint8Array(sig), new Uint8Array(expected));
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}
```

**주의**: `verifyAdminAuth`가 `async` 함수로 변경됨 → 호출부(모든 API route) 업데이트 필요. `await verifyAdminAuth(request)` 형태로 수정.

**영향받는 API 라우트**:
- `app/api/posts/route.ts` (POST)
- `app/api/posts/[slug]/route.ts` (PUT, DELETE)
- `app/api/posts/admin/route.ts` (GET)
- `app/api/admin/analytics/config/route.ts` (GET, PUT)
- `app/api/admin/analytics/usage/route.ts` (GET)
- `app/api/admin/scores/[game]/route.ts` (DELETE)
- `app/api/auth/verify/route.ts` (GET)

---

### 6. CODE-01: getDB()/getKV() 통합 — lib/env.ts

**신규 파일**: `lib/env.ts`

```typescript
// lib/env.ts — Cloudflare 바인딩 접근 단일 소스

export function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}

export function getKV(): KVNamespace {
  if (process.env.USE_LOCAL_DB === "true") {
    if (!localKVStore) localKVStore = new Map<string, string>();
    return {
      get: async (key: string) => localKVStore!.get(key) ?? null,
      put: async (key: string, value: string) => { localKVStore!.set(key, value); },
    } as unknown as KVNamespace;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.SITE_CONFIG;
}

let localKVStore: Map<string, string> | null = null;
```

**변경 대상**: 4곳의 `getDB()` 제거, `import { getDB } from "@/lib/env"` 로 교체
- `lib/db.ts:58-68` → 삭제, `import { getDB } from "./env"` 추가
- `lib/scores.ts:141-151` → 삭제, `import { getDB } from "./env"` 추가
- `lib/analytics.ts:89-115` → `getDB()`, `getKV()` 모두 삭제, import로 교체
- `app/api/admin/scores/[game]/route.ts:5` → import로 교체

---

### 7. CODE-02: API 에러 처리 통일

**대상**: 11개 API route.ts

**공통 패턴 설계**:
```typescript
// 모든 API 핸들러에 적용할 try-catch 래퍼
export async function POST(request: Request) {
  try {
    // 기존 로직
  } catch (error) {
    console.error("[POST /api/xxx]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**JSON 파싱 안전 패턴**:
```typescript
let body: Record<string, unknown>;
try {
  body = await request.json();
} catch {
  return Response.json({ error: "Invalid JSON" }, { status: 400 });
}
```

**적용 순서**: `verifyAdminAuth` async 변환(SEC-05) → 각 route에 try-catch + JSON 안전 파싱 적용

---

### 8. BUNDLE-01: 미사용 의존성 제거

**제거 대상** (import 0건 확인 필요):
```bash
pnpm remove next-themes next-mdx-remote gray-matter
```

**사전 확인**: `grep -r "next-themes\|next-mdx-remote\|gray-matter" apps/web/` 실행으로 import 없음 확인

---

### 9. BUNDLE-02: 디자인 변형 lazy loading

**파일**: `components/layout/header.tsx`, `footer.tsx`

**현재**: 4개 디자인 컴포넌트 정적 import (선택되지 않은 3개도 번들에 포함)

**변경 설계**:
```typescript
"use client";

import dynamic from "next/dynamic";
import { useDesign } from "@/lib/design/use-design";

const EditorialHeader = dynamic(() => import("./header/editorial-header").then(m => ({ default: m.EditorialHeader })));
const BentoHeader = dynamic(() => import("./header/bento-header").then(m => ({ default: m.BentoHeader })));
const BrutalistHeader = dynamic(() => import("./header/brutalist-header").then(m => ({ default: m.BrutalistHeader })));
const GlassHeader = dynamic(() => import("./header/glass-header").then(m => ({ default: m.GlassHeader })));

export function Header() {
  const { design } = useDesign();
  switch (design) {
    case "bento": return <BentoHeader />;
    case "brutalist": return <BrutalistHeader />;
    case "glass": return <GlassHeader />;
    default: return <EditorialHeader />;
  }
}
```

Footer, `home-page.tsx`도 동일 패턴 적용. SSR: false 옵션은 사용하지 않음 (서버에서 렌더링되어야 함).

**FOUC 방지**: `layout.tsx`의 인라인 스크립트가 `data-design` 속성을 미리 설정하므로, dynamic import 시 올바른 디자인이 즉시 로드됨.

---

### 10. ACC-01: text-muted WCAG AA 대비 조정

**파일**: `app/globals.css`

**조정 대상 테마와 목표값**:

| 테마 | 현재 text-muted | 배경 | 현재 비율 | 목표 색상 | 목표 비율 |
|------|----------------|------|-----------|-----------|-----------|
| brutal-terminal | `#3D6A3D` | `#0A0E0A` | ~2.5:1 | `#6BAF6B` | ~5.0:1 |
| editorial-dark | `#666666` | `#0a0a0a` | ~3.9:1 | `#8a8a8a` | ~5.5:1 |
| glass-aurora | `#6060A0` | `#0A0A1A` | ~3.0:1 | `#8888CC` | ~4.8:1 |
| glass-ocean | `#3D5A73` | `#0A1628` | ~2.8:1 | `#6B90AD` | ~5.0:1 |

**확인 도구**: Chrome DevTools → Accessibility → Color contrast ratio

---

### 11. UX-01: loading.tsx / error.tsx 추가

**추가 위치 및 설계**:

**`app/loading.tsx`** (루트 — 전체 페이지 전환):
```tsx
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-muted border-t-text" />
    </div>
  );
}
```

**`app/error.tsx`** (루트 — 런타임 에러 바운더리):
```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">문제가 발생했습니다</h2>
      <p className="text-text-muted">{error.digest ? `오류 코드: ${error.digest}` : "페이지를 불러오는 중 오류가 발생했습니다."}</p>
      <button onClick={reset} className="rounded-lg bg-accent px-4 py-2 text-bg transition-opacity hover:opacity-80">
        다시 시도
      </button>
    </div>
  );
}
```

**추가 라우트별 loading.tsx**: `app/blog/loading.tsx`, `app/game/loading.tsx`

---

### 12. TEST-01: vitest 환경 구성 + 초기 테스트

**패키지**: `pnpm add -D vitest @vitest/coverage-v8`

**`apps/web/vitest.config.ts`**:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

**초기 테스트 파일**:

**`lib/__tests__/score-validation.test.ts`**:
```typescript
import { describe, it, expect } from "vitest";
import { validateScore, validateNickname, isRankableGame } from "../score-validation";

describe("validateScore", () => {
  it("reaction 유효 범위", () => {
    expect(validateScore("reaction", 150)).toBe(true);
    expect(validateScore("reaction", 99)).toBe(false);
    expect(validateScore("reaction", 2001)).toBe(false);
  });
  it("NaN/Infinity 거부", () => {
    expect(validateScore("reaction", NaN)).toBe(false);
    expect(validateScore("reaction", Infinity)).toBe(false);
  });
});

describe("validateNickname", () => {
  it("유효 닉네임 허용", () => {
    expect(validateNickname("플레이어1").valid).toBe(true);
  });
  it("예약어 거부", () => {
    expect(validateNickname("admin").valid).toBe(false);
  });
  it("빈 문자열 허용", () => {
    expect(validateNickname("").valid).toBe(true);
  });
});

describe("isRankableGame", () => {
  it("등록된 게임 true", () => expect(isRankableGame("reaction")).toBe(true));
  it("미등록 게임 false", () => expect(isRankableGame("dice")).toBe(false));
});
```

**`lib/__tests__/auth.test.ts`**:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("verifyAdminAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.USE_LOCAL_DB = "true";
    process.env.ADMIN_API_KEY = "test-key-123";
  });

  it("유효 토큰 인증 성공", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer test-key-123" },
    });
    expect(await verifyAdminAuth(req)).toBe(true);
  });

  it("잘못된 토큰 인증 실패", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("Authorization 헤더 없음", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost");
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("환경변수 없으면 인증 실패", async () => {
    delete process.env.ADMIN_API_KEY;
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer anything" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });
});
```

**`lib/__tests__/compile-markdown.test.ts`**:
```typescript
import { describe, it, expect } from "vitest";
import { compileMarkdown, calculateReadingTime } from "../compile-markdown";

describe("compileMarkdown", () => {
  it("기본 마크다운 변환", async () => {
    const html = await compileMarkdown("# Hello\n\nWorld");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("script 태그 제거 (XSS 방지)", async () => {
    const html = await compileMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain("<script");
  });

  it("코드 블록 하이라이팅 유지", async () => {
    const html = await compileMarkdown("```js\nconst x = 1;\n```");
    expect(html).toContain("hljs");
  });
});

describe("calculateReadingTime", () => {
  it("200단어 = 1분", () => expect(calculateReadingTime("word ".repeat(200)).valueOf()).toBe(1));
  it("400단어 = 2분", () => expect(calculateReadingTime("word ".repeat(400)).valueOf()).toBe(2));
  it("빈 문자열 = 1분 (최소값)", () => expect(calculateReadingTime("")).toBe(1));
});
```

**package.json 스크립트 추가**:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Phase 2: P1 기능 안정성 + UX (16개 항목)

### 13. SEC-06: slug 포맷 검증

**파일**: `app/api/posts/route.ts` (POST)

```typescript
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// POST 핸들러 내부
if (!slug || !SLUG_REGEX.test(slug) || slug.length > 100) {
  return Response.json({ error: "Invalid slug format" }, { status: 400 });
}
```

---

### 14. SEC-07: ncv_id 쿠키 보안 속성

**파일**: `lib/visitor.ts`

**현재 확인**: 이미 `SameSite=Lax; Secure; HttpOnly` 설정되어 있음.

**상태**: ✅ 이미 해결됨 — 추가 작업 불필요.

---

### 15. SEC-08: metadata 크기/깊이 제한

**파일**: `app/api/scores/route.ts`

```typescript
// metadata 검증
if (metadata) {
  const json = JSON.stringify(metadata);
  if (json.length > 1024) {
    return Response.json({ error: "Metadata too large (max 1KB)" }, { status: 400 });
  }
}
```

---

### 16. SEC-09: Admin API rate limiting

**파일**: 신규 `lib/admin-rate-limit.ts`

```typescript
export async function checkAdminRateLimit(request: Request): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const kv = getKV();
  const key = `admin_rate:${ip}`;
  const count = parseInt(await kv.get(key) || "0");
  if (count >= 20) return false; // 분당 20회
  await kv.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}
```

Admin 인증 실패 시에만 rate limit 카운트 증가하는 방식도 고려.

---

### 17. ACC-02: 모바일 메뉴 접근성

**파일**: `editorial-header.tsx`, `bento-header.tsx`, `glass-header.tsx`

**추가 속성**:
```tsx
<button
  aria-expanded={menuOpen}
  aria-controls="mobile-menu"
  aria-label="메뉴 열기"
  onClick={() => setMenuOpen(!menuOpen)}
>
```

**Escape 핸들러 + focus trap**:
```typescript
useEffect(() => {
  if (!menuOpen) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMenuOpen(false);
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [menuOpen]);
```

---

### 18. ACC-03: BrutalistHeader 모바일 메뉴

**파일**: `components/layout/header/brutalist-header.tsx`

다른 3개 헤더의 모바일 메뉴 패턴을 참고하여 햄버거 버튼 + 드롭다운 메뉴 추가. brutalist 스타일(흑백, 직각, 굵은 테두리)에 맞게 디자인.

---

### 19. ACC-04: Reaction 게임 키보드 접근

**파일**: `components/game/reaction-game.tsx`

`onPointerDown` → `onClick`으로 변경, 추가로 `onKeyDown` 핸들러:
```tsx
onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleClick();
  }
}}
tabIndex={0}
role="button"
```

---

### 20. ACC-05: ScrollReveal reduced motion

**파일**: `components/ui/scroll-reveal.tsx`

```typescript
import { useReducedMotion } from "framer-motion";

export function ScrollReveal({ children, delay = 0, direction = "up", className }: ScrollRevealProps) {
  const shouldReduce = useReducedMotion();

  // reduced motion 시 애니메이션 없이 즉시 표시
  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  // ... 기존 로직
}
```

---

### 21. CODE-03: Non-null assertion 제거

**파일**: `lib/db.ts:161`, `lib/scores.ts:55,118`

```typescript
// Before
return rowToFull(row!);

// After
if (!row) throw new Error("Failed to create post");
return rowToFull(row);
```

```typescript
// Before
return { id: row!.id };

// After
if (!row) throw new Error("Failed to submit score");
return { id: row.id };
```

```typescript
// Before
return { leaderboard, myRank, total: countRow!.total };

// After
return { leaderboard, myRank, total: countRow?.total ?? 0 };
```

---

### 22. CODE-04: pageview 과다 연산 최적화

**파일**: `app/api/analytics/pageview/route.ts`

**현재**: `isAnalyticsEnabled` + `incrementCounter` + `getUsage` + `checkAutoBlock` = 6회 DB/KV

**최적화**:
```typescript
export async function POST(request: Request) {
  try {
    const enabled = await isAnalyticsEnabled();
    if (!enabled) return new Response(null, { status: 204 });

    const count = await incrementCounter();

    // getUsage의 threshold만 필요 → KV 단일 조회로 축소
    const kv = getKV();
    const thresholdStr = await kv.get("analytics_threshold");
    const threshold = thresholdStr ? parseInt(thresholdStr) : 90_000;

    if (count >= threshold) {
      await kv.put("analytics_enabled", "false");
      await kv.put("analytics_auto_off", "true");
    }

    // AE 기록 (기존 유지)
    // ...
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
```

---

### 23. SEO-01: OG 이미지 생성

**신규 파일**: `app/opengraph-image.tsx` (전역 기본)

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NeedCash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0A0A0A", color: "#fff", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 72, fontWeight: "bold" }}>NeedCash</div>
        <div style={{ fontSize: 28, color: "#888", marginTop: 16 }}>프로토타입 허브</div>
      </div>
    ),
    { ...size }
  );
}
```

**블로그용**: `app/blog/[slug]/opengraph-image.tsx` — 포스트 제목/카테고리 포함.

**주의**: Workers 환경에서 `ImageResponse`의 font loading 제약 확인 필요. 기본 시스템 폰트 사용.

---

### 24. SEO-02: `<time datetime>` 속성

**파일**: `app/blog/[slug]/page.tsx`

```tsx
// Before
<time>{post.date}</time>

// After
<time dateTime={post.date}>{post.date}</time>
```

---

### 25. SEO-03: JSON-LD dateModified

**파일**: `components/seo/json-ld.tsx`

```typescript
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;  // 추가
  tags?: string[];
}

// jsonLd 객체에 추가
dateModified: dateModified || datePublished,
```

**호출부** (`app/blog/[slug]/page.tsx`):
```tsx
<ArticleJsonLd
  ...
  dateModified={post.updatedAt}
/>
```

---

### 26. FE-01: highlight.js CSS 로컬화

**현재** (`app/layout.tsx:87-89`):
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" />
```

**변경**:
1. CSS 파일을 `public/styles/github-dark.min.css`로 복사
2. `layout.tsx`에서 로컬 경로로 변경:
```html
<link rel="stylesheet" href="/styles/github-dark.min.css" />
```

또는 `globals.css`에서 `@import`로 번들링.

---

### 27. FE-02: shiki/rehype-pretty-code 제거 검토

**확인 방법**: `grep -r "rehype-pretty-code\|shiki" apps/web/`

기존 블로그 글의 HTML이 이미 DB에 인라인 style로 저장되어 있으므로 런타임에 shiki가 필요 없을 가능성이 높음. 확인 후 제거:

```bash
pnpm remove rehype-pretty-code shiki
```

---

### 28. FE-03: GlassBackground 조건부 로딩

**파일**: `app/layout.tsx`

```tsx
// Before
import { GlassBackground } from "@/components/design/glass-background";
// <GlassBackground />

// After
import dynamic from "next/dynamic";
const GlassBackground = dynamic(
  () => import("@/components/design/glass-background").then(m => ({ default: m.GlassBackground })),
  { ssr: true }
);

// layout 내부에서 useDesign 사용 불가 (서버 컴포넌트)이므로,
// GlassBackground 자체에서 디자인 체크하여 glass가 아니면 null 반환하도록 수정
```

**대안**: `GlassBackground` 컴포넌트 내부에서 `useDesign()`으로 디자인 체크 → glass가 아니면 `return null`. 이미 "use client"이므로 가능.

---

## Phase 3: P2 유지보수성 + 최적화 (15개 항목)

### 29. CODE-05: getAllPostsAdmin 경량 쿼리

```typescript
export async function getAllPostsAdminList(): Promise<PostMeta[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT id, slug, title, description, date, updated_at, category, tags, published, reading_time, created_at FROM posts ORDER BY date DESC`)
    .all<PostRow>();
  return results.map(rowToMeta);
}
```

Admin 리스트에서는 `getAllPostsAdminList()` 사용, 편집 시에만 `getPostBySlugAdmin()` 사용.

---

### 30. CODE-06: 리더보드 쿼리 병렬화

```typescript
const [countResult, myBestResult] = await Promise.all([
  db.prepare(`SELECT COUNT(DISTINCT visitor_id) as total FROM game_scores WHERE game_slug = ?`)
    .bind(gameSlug).first<{ total: number }>(),
  visitorId
    ? db.prepare(`SELECT score, nickname FROM game_scores WHERE visitor_id = ? AND game_slug = ? ORDER BY score ${order} LIMIT 1`)
        .bind(visitorId, gameSlug).first<{ score: number; nickname: string | null }>()
    : Promise.resolve(null),
]);
```

---

### 31. CODE-07: 중복 API 라우트 통합

`/api/admin/analytics/usage`와 `/api/admin/analytics/config`를 하나의 `/api/admin/analytics` 엔드포인트로 통합.

GET → config + usage 통합 반환, PUT → config 업데이트.

---

### 32. CODE-08: game_sessions 미사용 테이블

코드에서 미참조 확인 후 마이그레이션에 `DROP TABLE IF EXISTS game_sessions` 추가, 또는 향후 anti-cheat용으로 보존 결정.

---

### 33. CODE-09: 마이그레이션 버전 관리

```typescript
// local-db.ts — 마이그레이션 추적 테이블
db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
)`);

// 각 마이그레이션 실행 전 체크
const applied = db.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(file);
if (!applied) {
  db.exec(sql);
  db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
}
```

---

### 34. CODE-10: 블로그 목록 캐싱 + 페이지네이션

```typescript
// GET /api/posts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const posts = await getAllPosts(offset, Math.min(limit, 100));
  return Response.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
```

---

### 35. CODE-11: API 응답 형식 통일

```typescript
// 성공
Response.json({ data: result, meta: { total: 10 } });

// 에러
Response.json({ error: "message" }, { status: 4xx });
```

Phase 2의 CODE-02(try-catch)가 선행되어야 함.

---

### 36. SEC-10: pageview rate limiting

IP 기반 간단한 rate limit. `CF-Connecting-IP` 헤더 활용.

```typescript
// pageview route 내부
const ip = request.headers.get("CF-Connecting-IP") || "unknown";
const kv = getKV();
const rateKey = `pv_rate:${ip}`;
const count = parseInt(await kv.get(rateKey) || "0");
if (count > 100) return new Response(null, { status: 429 }); // 분당 100회
await kv.put(rateKey, String(count + 1), { expirationTtl: 60 });
```

---

### 37-39. FE-04~06: 컴포넌트 리팩토링

**FE-04** (디자인별 컴포넌트 중복): 공통 인터페이스 추출 → 디자인별 스타일만 분리. `BaseHeader`, `BaseFooter` 공통 컴포넌트 패턴.

**FE-05** (게임 컴포넌트 훅 추출): `useGameTimer()`, `useScoreSubmission()` 커스텀 훅.

**FE-06** (@tailwindcss/typography): `pnpm add @tailwindcss/typography` → `globals.css`의 `.prose-custom` 수동 규칙을 `prose` 클래스로 대체.

---

### 40-42. SEO-04~06

**SEO-04** (사이트맵): `new Date()` → 상수 빌드 날짜 또는 `new Date("2026-03-01")` 같은 고정값.

**SEO-05** (DesignPicker): `aria-expanded`, `role="listbox"`, Escape 닫기, `aria-label` 추가.

**SEO-06** (active link): `usePathname()` + `aria-current="page"` + 시각적 스타일.

---

## Phase 4: P3 문서화 + 선택적 개선 (8개 항목)

### 43. DOC-01: About 페이지 기술 스택

"Next.js 15" → "Next.js 16", "Static Export" → "Cloudflare Workers", "MDX" → "D1 + Markdown", "Cloudflare Pages" → "Cloudflare Workers"

### 44. DOC-02: tools/ 문서화

CLAUDE.md에 tools 컴포넌트 섹션 추가.

### 45-48. FE-07~10

**FE-07**: `next.config.ts`에 `experimental.optimizePackageImports: ['framer-motion']`
**FE-08**: Header/Footer 서버 컴포넌트 전환 — 쿠키에서 디자인 읽기 검토
**FE-09**: `--gradient-1/2/3` 모든 테마에 기본값 (transparent) 설정
**FE-10**: `game-content.ts` → `content/games/*.json`으로 분리 (선택)

### 49-50. SEO-07~08

**SEO-07**: WebSite에 `SearchAction`, Article에 `image`, 이력서에 `Person` 스키마
**SEO-08**: 게임에 `aria-live="polite"`, CookieConsent에 `role="alertdialog"`

---

## 구현 순서 요약

```
Phase 1 (12개):
  1. CODE-01 (lib/env.ts 생성, getDB/getKV 통합) ← 다른 변경의 기반
  2. SEC-03 + SEC-05 (auth.ts — 폴백 제거 + timing-safe) ← async 변환
  3. CODE-02 (API 에러 처리 — auth async 변환 반영)
  4. SEC-01 (rehype-sanitize)
  5. SEC-02 (DOMPurify)
  6. SEC-04 (보안 헤더)
  7. BUNDLE-01 (미사용 패키지 제거)
  8. BUNDLE-02 (디자인 lazy loading)
  9. ACC-01 (text-muted 대비)
  10. UX-01 (loading/error.tsx)
  11. TEST-01 (vitest + 초기 테스트)
  → 빌드 확인 → pnpm preview 검증

Phase 2 (16개):
  12-28. SEC-06~09, ACC-02~05, CODE-03~04, SEO-01~03, FE-01~03
  → API 통합 테스트 추가

Phase 3 (15개):
  29-42. CODE-05~11, SEC-10, FE-04~06, SEO-04~06
  → E2E 테스트 추가

Phase 4 (8개):
  43-50. DOC-01~02, FE-07~10, SEO-07~08
```

---

## 검증 체크리스트

### Phase 1 완료 후
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 전체 통과
- [ ] `<script>alert(1)</script>` 마크다운이 sanitize됨
- [ ] 환경변수 없이 인증 실패 확인
- [ ] 보안 헤더 응답 확인 (`curl -I`)
- [ ] text-muted WCAG AA 4.5:1 이상
- [ ] loading/error 페이지 렌더링 확인
- [ ] 미사용 패키지 제거 후 빌드 정상

### Phase 2 완료 후
- [ ] 잘못된 slug 포맷 400 응답
- [ ] 모바일 메뉴 Escape 키, focus trap 동작
- [ ] OG 이미지 소셜 공유 미리보기 확인
- [ ] `<time>` datetime 속성 존재

### Phase 3 완료 후
- [ ] API 응답 `{ data, error, meta }` 형식 통일
- [ ] 리더보드 쿼리 병렬 실행
- [ ] active link 표시 동작

### Phase 4 완료 후
- [ ] About 페이지 기술 스택 정확
- [ ] 구조화 데이터 확장 확인
