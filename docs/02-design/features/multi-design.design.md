# Design: multi-design

> 4개 디자인 모드(Editorial, Bento, Brutalist, Glass) × 4개 컬러 테마 = 16가지 조합의 2계층 디자인 시스템 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  lib/
    design/
      index.ts                          # DesignId, ThemeConfig, DesignConfig 타입 + 레지스트리
      use-design.ts                     # useDesign() hook
      designs/
        editorial.ts                    # Editorial 디자인 정의 + 4테마
        bento.ts                        # Bento 디자인 정의 + 4테마
        brutalist.ts                    # Brutalist 디자인 정의 + 4테마
        glass.ts                        # Glass 디자인 정의 + 4테마

  components/
    design/
      design-provider.tsx               # DesignContext + Provider (design/theme 상태)
      design-picker.tsx                 # 2단계 선택 UI (popover)
    layout/
      header.tsx                        # 어댑터 (switch by design)
      header/
        editorial-header.tsx            # 기존 Header 코드 이동
        bento-header.tsx                # Bento 스타일 헤더
        brutalist-header.tsx            # Brutalist 스타일 헤더
        glass-header.tsx                # Glass 스타일 헤더
      hero.tsx                          # 어댑터
      hero/
        editorial-hero.tsx              # 기존 page.tsx Hero 분리
        bento-hero.tsx
        brutalist-hero.tsx
        glass-hero.tsx
      section-grid.tsx                  # 어댑터
      section-grid/
        editorial-grid.tsx              # 기존 page.tsx Section cards 분리
        bento-grid.tsx
        brutalist-grid.tsx
        glass-grid.tsx
      posts-section.tsx                 # 어댑터
      posts-section/
        editorial-posts.tsx             # 기존 page.tsx Latest Posts 분리
        bento-posts.tsx
        brutalist-posts.tsx
        glass-posts.tsx
      footer.tsx                        # 어댑터
      footer/
        editorial-footer.tsx            # 기존 Footer 코드 이동
        bento-footer.tsx
        brutalist-footer.tsx
        glass-footer.tsx

  app/
    globals.css                         # 디자인 구조 변수 + 16개 테마 컬러 변수
    layout.tsx                          # DesignProvider 래핑 추가
    page.tsx                            # 어댑터 컴포넌트 조합
```

### 1.2 의존성 관계

```
design-provider.tsx
  ├── react (createContext, useContext, useState, useEffect, useCallback)
  └── lib/design/index.ts (DesignConfig, ThemeConfig, 레지스트리)

use-design.ts
  └── design-provider.tsx (DesignContext)

header.tsx (어댑터)
  ├── use-design.ts
  ├── header/editorial-header.tsx
  ├── header/bento-header.tsx
  ├── header/brutalist-header.tsx
  └── header/glass-header.tsx

design-picker.tsx
  ├── use-design.ts
  ├── lib/design/index.ts (레지스트리)
  └── framer-motion (AnimatePresence, motion)
```

외부 라이브러리 추가: 없음 (기존 스택 내 해결)

---

## 2. 타입 설계

### 2.1 핵심 타입 정의

```typescript
// lib/design/index.ts

export type DesignId = "editorial" | "bento" | "brutalist" | "glass";

export interface ThemeConfig {
  id: string;                   // "editorial-dark", "bento-clean" 등
  name: string;                 // UI 표시명 ("다크", "클린" 등)
  preview: string;              // 프리뷰 색상 (dot 색상)
}

export interface DesignConfig {
  id: DesignId;
  name: string;                 // "에디토리얼"
  description: string;          // 한 줄 설명
  themes: ThemeConfig[];
  defaultTheme: string;         // 기본 테마 ID
}
```

### 2.2 디자인 레지스트리

```typescript
// lib/design/index.ts

import { editorialDesign } from "./designs/editorial";
import { bentoDesign } from "./designs/bento";
import { brutalistDesign } from "./designs/brutalist";
import { glassDesign } from "./designs/glass";

export const DESIGNS: DesignConfig[] = [
  editorialDesign,
  bentoDesign,
  brutalistDesign,
  glassDesign,
];

export const DESIGN_MAP: Record<DesignId, DesignConfig> = {
  editorial: editorialDesign,
  bento: bentoDesign,
  brutalist: brutalistDesign,
  glass: glassDesign,
};

export const DEFAULT_DESIGN: DesignId = "editorial";
export const DEFAULT_THEME = "editorial-light";
```

### 2.3 디자인별 정의 파일

```typescript
// lib/design/designs/editorial.ts
import type { DesignConfig } from "../index";

export const editorialDesign: DesignConfig = {
  id: "editorial",
  name: "에디토리얼",
  description: "타이포그래피 중심의 매거진 스타일",
  defaultTheme: "editorial-light",
  themes: [
    { id: "editorial-light", name: "라이트", preview: "#ffffff" },
    { id: "editorial-dark", name: "다크", preview: "#0a0a0a" },
    { id: "editorial-cream", name: "크림", preview: "#FAF7F2" },
    { id: "editorial-ink", name: "잉크", preview: "#0B1929" },
  ],
};
```

```typescript
// lib/design/designs/bento.ts
import type { DesignConfig } from "../index";

export const bentoDesign: DesignConfig = {
  id: "bento",
  name: "벤토",
  description: "Apple 스타일 모듈형 그리드",
  defaultTheme: "bento-clean",
  themes: [
    { id: "bento-clean", name: "클린", preview: "#F0F2F5" },
    { id: "bento-night", name: "나이트", preview: "#111113" },
    { id: "bento-pastel", name: "파스텔", preview: "#F0EEFA" },
    { id: "bento-sunset", name: "선셋", preview: "#FFF8F0" },
  ],
};
```

```typescript
// lib/design/designs/brutalist.ts
import type { DesignConfig } from "../index";

export const brutalistDesign: DesignConfig = {
  id: "brutalist",
  name: "브루탈리스트",
  description: "모노스페이스와 날것의 에너지",
  defaultTheme: "brutal-terminal",
  themes: [
    { id: "brutal-terminal", name: "터미널", preview: "#0A0E0A" },
    { id: "brutal-paper", name: "페이퍼", preview: "#FFFFFF" },
    { id: "brutal-warning", name: "워닝", preview: "#0A0A0A" },
    { id: "brutal-blueprint", name: "블루프린트", preview: "#0A1628" },
  ],
};
```

```typescript
// lib/design/designs/glass.ts
import type { DesignConfig } from "../index";

export const glassDesign: DesignConfig = {
  id: "glass",
  name: "글래스",
  description: "프로스트 글래스와 몽환적 그라디언트",
  defaultTheme: "glass-aurora",
  themes: [
    { id: "glass-aurora", name: "오로라", preview: "linear-gradient(135deg,#4C1D95,#065F46)" },
    { id: "glass-frost", name: "프로스트", preview: "linear-gradient(135deg,#BFDBFE,#E0E7FF)" },
    { id: "glass-rose", name: "로즈", preview: "linear-gradient(135deg,#831843,#78350F)" },
    { id: "glass-ocean", name: "오션", preview: "linear-gradient(135deg,#164E63,#064E3B)" },
  ],
};
```

---

## 3. Context / Provider 설계

### 3.1 DesignContext

```typescript
// components/design/design-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { DESIGN_MAP, DEFAULT_DESIGN, DEFAULT_THEME, type DesignId, type DesignConfig, type ThemeConfig } from "@/lib/design";

const STORAGE_KEY_DESIGN = "needcash-design";
const STORAGE_KEY_THEME = "needcash-theme";

interface DesignContextValue {
  design: DesignId;
  theme: string;
  setDesign: (id: DesignId) => void;
  setTheme: (id: string) => void;
  designConfig: DesignConfig;
  availableThemes: ThemeConfig[];
}

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<DesignId>(DEFAULT_DESIGN);
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  // 초기 마운트: localStorage에서 복원
  useEffect(() => {
    const savedDesign = localStorage.getItem(STORAGE_KEY_DESIGN) as DesignId | null;
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);

    if (savedDesign && DESIGN_MAP[savedDesign]) {
      setDesignState(savedDesign);
      const config = DESIGN_MAP[savedDesign];
      if (savedTheme && config.themes.some(t => t.id === savedTheme)) {
        setThemeState(savedTheme);
      } else {
        setThemeState(config.defaultTheme);
      }
    }
  }, []);

  // DOM 동기화: data-design, data-theme attribute 설정
  useEffect(() => {
    document.documentElement.setAttribute("data-design", design);
    document.documentElement.setAttribute("data-theme", theme);
  }, [design, theme]);

  const setDesign = useCallback((id: DesignId) => {
    setDesignState(id);
    const config = DESIGN_MAP[id];
    const newTheme = config.defaultTheme;
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_DESIGN, id);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  }, []);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY_THEME, id);
  }, []);

  const designConfig = DESIGN_MAP[design];
  const availableThemes = designConfig.themes;

  return (
    <DesignContext.Provider value={{ design, theme, setDesign, setTheme, designConfig, availableThemes }}>
      {children}
    </DesignContext.Provider>
  );
}

export { DesignContext };
```

### 3.2 useDesign Hook

```typescript
// lib/design/use-design.ts
"use client";

import { useContext } from "react";
import { DesignContext } from "@/components/design/design-provider";

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}
```

### 3.3 FOUC 방지 스크립트

layout.tsx `<head>`에 inline script를 삽입하여 페이지 로드 전 attribute를 설정:

```typescript
// app/layout.tsx의 <head> 또는 <body> 시작 부분에 삽입
const DESIGN_INIT_SCRIPT = `
(function(){
  try {
    var d = localStorage.getItem("needcash-design") || "editorial";
    var t = localStorage.getItem("needcash-theme") || "editorial-light";
    document.documentElement.setAttribute("data-design", d);
    document.documentElement.setAttribute("data-theme", t);
  } catch(e) {}
})();
`;
```

이 스크립트는 `<Script strategy="beforeInteractive">`가 아닌 `dangerouslySetInnerHTML`로 inline 삽입하여 렌더링 차단 방식으로 실행.

---

## 4. CSS 변수 설계

### 4.1 globals.css 전체 구조

```css
@import "tailwindcss";

@theme inline {
  --font-heading: var(--font-plus-jakarta);
  --font-body: var(--font-pretendard);
  --font-mono: var(--font-jetbrains);

  /* 컬러 토큰 → Tailwind 매핑 */
  --color-bg: var(--bg);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-tertiary: var(--bg-tertiary);
  --color-text: var(--text);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-card-bg: var(--card-bg);
  --color-card-border: var(--card-border);
  --color-code-bg: var(--code-bg);
}

/* ══════════════════════════════════════
   THEME LAYER: 컬러 변수 (data-theme)
   ══════════════════════════════════════ */

/* ── Editorial 테마 ── */

:root,
[data-theme="editorial-light"] {
  --bg: #ffffff; --bg-secondary: #f7f7f7; --bg-tertiary: #ececec;
  --text: #0a0a0a; --text-secondary: #555555; --text-muted: #999999;
  --border: #e0e0e0; --accent: #0a0a0a; --accent-hover: #333333;
  --card-bg: #ffffff; --card-border: #ececec; --code-bg: #f5f5f5;
}

[data-theme="editorial-dark"] {
  --bg: #0a0a0a; --bg-secondary: #141414; --bg-tertiary: #1e1e1e;
  --text: #f0f0f0; --text-secondary: #a0a0a0; --text-muted: #666666;
  --border: #222222; --accent: #f0f0f0; --accent-hover: #cccccc;
  --card-bg: #111111; --card-border: #1e1e1e; --code-bg: #1a1a1a;
}

[data-theme="editorial-cream"] {
  --bg: #FAF7F2; --bg-secondary: #F0EBE1; --bg-tertiary: #E6DFD1;
  --text: #2C2014; --text-secondary: #6B5B4A; --text-muted: #A09181;
  --border: #DDD4C4; --accent: #8A5025; --accent-hover: #A46332;
  --card-bg: #FAF7F2; --card-border: #E6DFD1; --code-bg: #F0EBE1;
}

[data-theme="editorial-ink"] {
  --bg: #0B1929; --bg-secondary: #0F2340; --bg-tertiary: #152D50;
  --text: #D4E5F5; --text-secondary: #8AACC8; --text-muted: #4A7090;
  --border: #1A3555; --accent: #C9A84C; --accent-hover: #D9BC6E;
  --card-bg: #0D1E35; --card-border: #1A3555; --code-bg: #0F2340;
}

/* ── Bento 테마 ── */

[data-theme="bento-clean"] {
  --bg: #F0F2F5; --bg-secondary: #E4E7EB; --bg-tertiary: #D5D9E0;
  --text: #1A1A2E; --text-secondary: #4A4A6A; --text-muted: #8888A8;
  --border: #D0D4DC; --accent: #0066CC; --accent-hover: #0055AA;
  --card-bg: #FFFFFF; --card-border: #E8EBF0; --code-bg: #F5F6F8;
}

[data-theme="bento-night"] {
  --bg: #111113; --bg-secondary: #1A1A1F; --bg-tertiary: #242430;
  --text: #E8E8F0; --text-secondary: #9898B0; --text-muted: #5A5A78;
  --border: #2A2A38; --accent: #00D4AA; --accent-hover: #00E8BB;
  --card-bg: #1A1A1F; --card-border: #2A2A38; --code-bg: #1E1E28;
}

[data-theme="bento-pastel"] {
  --bg: #F0EEFA; --bg-secondary: #E6E0F5; --bg-tertiary: #DAD2EF;
  --text: #2A2040; --text-secondary: #5A4E78; --text-muted: #9088B0;
  --border: #D0C8E8; --accent: #6C5CE7; --accent-hover: #7D6FF0;
  --card-bg: #FFFFFF; --card-border: #E8E2F5; --code-bg: #F5F0FF;
}

[data-theme="bento-sunset"] {
  --bg: #FFF8F0; --bg-secondary: #FFF0E0; --bg-tertiary: #FFE8D0;
  --text: #2A1A10; --text-secondary: #6A4A30; --text-muted: #A08868;
  --border: #F0D8C0; --accent: #E8633A; --accent-hover: #F07040;
  --card-bg: #FFFFFF; --card-border: #F5E8DA; --code-bg: #FFF5EE;
}

/* ── Brutalist 테마 ── */

[data-theme="brutal-terminal"] {
  --bg: #0A0E0A; --bg-secondary: #0F150F; --bg-tertiary: #151D15;
  --text: #D0F0D0; --text-secondary: #7AB87A; --text-muted: #3D6A3D;
  --border: #1A2A1A; --accent: #33FF33; --accent-hover: #66FF66;
  --card-bg: #0D120D; --card-border: #1A2A1A; --code-bg: #0F150F;
}

[data-theme="brutal-paper"] {
  --bg: #FFFFFF; --bg-secondary: #F5F5F5; --bg-tertiary: #EEEEEE;
  --text: #000000; --text-secondary: #333333; --text-muted: #888888;
  --border: #000000; --accent: #000000; --accent-hover: #333333;
  --card-bg: #FFFFFF; --card-border: #000000; --code-bg: #F5F5F5;
}

[data-theme="brutal-warning"] {
  --bg: #0A0A0A; --bg-secondary: #111111; --bg-tertiary: #1A1A1A;
  --text: #FFD600; --text-secondary: #CCAA00; --text-muted: #887700;
  --border: #FFD600; --accent: #FFD600; --accent-hover: #FFE640;
  --card-bg: #0E0E0E; --card-border: #FFD600; --code-bg: #111111;
}

[data-theme="brutal-blueprint"] {
  --bg: #0A1628; --bg-secondary: #0E1E38; --bg-tertiary: #142848;
  --text: #E0F0FF; --text-secondary: #90B8E0; --text-muted: #4A7AA8;
  --border: #4A9EFF; --accent: #4A9EFF; --accent-hover: #70B4FF;
  --card-bg: #0C1A30; --card-border: #4A9EFF; --code-bg: #0E1E38;
}

/* ── Glass 테마 ── */

[data-theme="glass-aurora"] {
  --bg: #0A0A1A; --bg-secondary: #12122A; --bg-tertiary: #1A1A3A;
  --text: #F0F0F0; --text-secondary: #B0B0D0; --text-muted: #6060A0;
  --border: rgba(255,255,255,0.12); --accent: #A78BFA; --accent-hover: #B9A3FB;
  --card-bg: rgba(255,255,255,0.06); --card-border: rgba(255,255,255,0.10);
  --code-bg: rgba(255,255,255,0.04);
  --gradient-1: #4C1D95; --gradient-2: #065F46; --gradient-3: #1E1B4B;
}

[data-theme="glass-frost"] {
  --bg: #E8F0F8; --bg-secondary: #D8E8F5; --bg-tertiary: #C8D8F0;
  --text: #0A1929; --text-secondary: #3D5A73; --text-muted: #7A97AD;
  --border: rgba(0,0,0,0.08); --accent: #3B82F6; --accent-hover: #60A5FA;
  --card-bg: rgba(255,255,255,0.60); --card-border: rgba(255,255,255,0.80);
  --code-bg: rgba(255,255,255,0.40);
  --gradient-1: #BFDBFE; --gradient-2: #E0E7FF; --gradient-3: #DBEAFE;
}

[data-theme="glass-rose"] {
  --bg: #12090C; --bg-secondary: #1A0F13; --bg-tertiary: #24161B;
  --text: #F0E0E4; --text-secondary: #B09098; --text-muted: #704858;
  --border: rgba(255,255,255,0.10); --accent: #D4919C; --accent-hover: #E0A5AE;
  --card-bg: rgba(255,255,255,0.05); --card-border: rgba(255,255,255,0.08);
  --code-bg: rgba(255,255,255,0.03);
  --gradient-1: #831843; --gradient-2: #78350F; --gradient-3: #1C0A10;
}

[data-theme="glass-ocean"] {
  --bg: #0A1628; --bg-secondary: #0F1D32; --bg-tertiary: #15253D;
  --text: #D4E5F5; --text-secondary: #7A97AD; --text-muted: #3D5A73;
  --border: rgba(255,255,255,0.10); --accent: #06B6D4; --accent-hover: #22D3EE;
  --card-bg: rgba(255,255,255,0.05); --card-border: rgba(255,255,255,0.08);
  --code-bg: rgba(255,255,255,0.03);
  --gradient-1: #164E63; --gradient-2: #064E3B; --gradient-3: #0A1628;
}
```

### 4.2 디자인 구조 변수 (CSS-only 분기)

```css
/* ══════════════════════════════════════
   DESIGN LAYER: 구조 변수 (data-design)
   ══════════════════════════════════════ */

/* Editorial은 기본값이므로 :root에 정의 */
:root {
  --radius-card: 0px;
  --radius-button: 0px;
  --card-shadow: none;
  --card-hover-shadow: none;
  --card-hover-scale: 1;
  --border-width: 0px;
  --card-border-bottom: 1px;
  --transition-duration: 0.4s;
  --transition-easing: cubic-bezier(0.215, 0.61, 0.355, 1);
  --font-heading-weight: 700;
  --font-body-weight: 400;
  --letter-spacing-heading: -0.03em;
  --text-transform-label: uppercase;
  --max-content-width: 72rem;
}

[data-design="bento"] {
  --radius-card: 20px;
  --radius-button: 12px;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08);
  --card-hover-shadow: 0 8px 30px rgba(0,0,0,0.1);
  --card-hover-scale: 1.02;
  --border-width: 1px;
  --card-border-bottom: 0px;
  --transition-duration: 0.3s;
  --transition-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
  --font-heading-weight: 600;
  --letter-spacing-heading: -0.02em;
  --text-transform-label: none;
  --max-content-width: 80rem;
}

[data-design="brutalist"] {
  --radius-card: 0px;
  --radius-button: 0px;
  --card-shadow: none;
  --card-hover-shadow: none;
  --card-hover-scale: 1;
  --border-width: 2px;
  --card-border-bottom: 2px;
  --transition-duration: 0.05s;
  --transition-easing: linear;
  --font-heading-weight: 800;
  --letter-spacing-heading: 0.05em;
  --text-transform-label: uppercase;
  --max-content-width: 100%;
}

[data-design="glass"] {
  --radius-card: 20px;
  --radius-button: 14px;
  --card-shadow: none;
  --card-hover-shadow: 0 8px 40px color-mix(in srgb, var(--accent) 15%, transparent);
  --card-hover-scale: 1.01;
  --border-width: 1px;
  --card-border-bottom: 0px;
  --transition-duration: 0.5s;
  --transition-easing: ease-in-out;
  --font-heading-weight: 300;
  --letter-spacing-heading: 0.01em;
  --text-transform-label: none;
  --max-content-width: 64rem;
}

/* ── Brutalist: 터미널 테마 전용 CRT scanline ── */
[data-design="brutalist"][data-theme="brutal-terminal"] body::after {
  content: ''; position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px
  );
}

/* ── Glass: 배경 blob ── */
[data-design="glass"] .bg-mesh .blob {
  position: absolute; border-radius: 50%; filter: blur(80px);
  animation: glass-float 20s ease-in-out infinite;
  opacity: 0.4;
}

@keyframes glass-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
```

---

## 5. 어댑터 컴포넌트 설계

### 5.1 Header 어댑터

```typescript
// components/layout/header.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialHeader } from "./header/editorial-header";
import { BentoHeader } from "./header/bento-header";
import { BrutalistHeader } from "./header/brutalist-header";
import { GlassHeader } from "./header/glass-header";

export function Header() {
  const { design } = useDesign();

  switch (design) {
    case "editorial": return <EditorialHeader />;
    case "bento":     return <BentoHeader />;
    case "brutalist": return <BrutalistHeader />;
    case "glass":     return <GlassHeader />;
  }
}
```

### 5.2 Hero 어댑터

```typescript
// components/layout/hero.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialHero } from "./hero/editorial-hero";
import { BentoHero } from "./hero/bento-hero";
import { BrutalistHero } from "./hero/brutalist-hero";
import { GlassHero } from "./hero/glass-hero";

export function Hero() {
  const { design } = useDesign();

  switch (design) {
    case "editorial": return <EditorialHero />;
    case "bento":     return <BentoHero />;
    case "brutalist": return <BrutalistHero />;
    case "glass":     return <GlassHero />;
  }
}
```

### 5.3 SectionGrid 어댑터

```typescript
// components/layout/section-grid.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialGrid } from "./section-grid/editorial-grid";
import { BentoGrid } from "./section-grid/bento-grid";
import { BrutalistGrid } from "./section-grid/brutalist-grid";
import { GlassGrid } from "./section-grid/glass-grid";

const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/ads", label: "Ads", desc: "Landing page experiments" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
] as const;

export function SectionGrid() {
  const { design } = useDesign();

  switch (design) {
    case "editorial": return <EditorialGrid sections={SECTIONS} />;
    case "bento":     return <BentoGrid sections={SECTIONS} />;
    case "brutalist": return <BrutalistGrid sections={SECTIONS} />;
    case "glass":     return <GlassGrid sections={SECTIONS} />;
  }
}
```

### 5.4 PostsSection 어댑터

```typescript
// components/layout/posts-section.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialPosts } from "./posts-section/editorial-posts";
import { BentoPosts } from "./posts-section/bento-posts";
import { BrutalistPosts } from "./posts-section/brutalist-posts";
import { GlassPosts } from "./posts-section/glass-posts";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

export function PostsSection({ posts }: { posts: Post[] }) {
  const { design } = useDesign();

  if (posts.length === 0) return null;

  switch (design) {
    case "editorial": return <EditorialPosts posts={posts} />;
    case "bento":     return <BentoPosts posts={posts} />;
    case "brutalist": return <BrutalistPosts posts={posts} />;
    case "glass":     return <GlassPosts posts={posts} />;
  }
}
```

### 5.5 Footer 어댑터

```typescript
// components/layout/footer.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialFooter } from "./footer/editorial-footer";
import { BentoFooter } from "./footer/bento-footer";
import { BrutalistFooter } from "./footer/brutalist-footer";
import { GlassFooter } from "./footer/glass-footer";

export function Footer() {
  const { design } = useDesign();

  switch (design) {
    case "editorial": return <EditorialFooter />;
    case "bento":     return <BentoFooter />;
    case "brutalist": return <BrutalistFooter />;
    case "glass":     return <GlassFooter />;
  }
}
```

---

## 6. 디자인별 컴포넌트 상세

### 6.1 Editorial (기존 코드 분리)

EditorialHeader, EditorialHero, EditorialGrid, EditorialPosts, EditorialFooter는 현재 `header.tsx`, `page.tsx`, `footer.tsx`의 코드를 그대로 이동. 변경 없이 기존 동작 유지.

### 6.2 Bento 컴포넌트 핵심 패턴

**BentoHeader**: 투명 오버레이, fixed 아님 (relative)
```tsx
// position: relative (스크롤 시 숨김)
// padding: 1.5rem 2rem
// max-width: 80rem
// 로고: font-size 16px, font-weight 600
```

**BentoHero**: CSS Grid hero-card (span-2, span-2)
```tsx
// bento-card.hero-card: grid-column span 2, grid-row span 2
// rounded-[20px], bg-card-bg, border card-border, padding 3rem
// h1: clamp(2rem, 4vw, 3.5rem), font-weight 700
// hero-actions: primary(bg-accent) + secondary(bg-bg-secondary)
```

**BentoGrid**: 3col grid + 각 카드에 accent-dot + arrow
```tsx
// grid: grid-template-columns repeat(3, 1fr), gap 16px
// card: rounded-[20px], bg-card-bg, border, padding 2rem
// hover: scale(1.02) + box-shadow
// arrow: 36px circle, bg-bg → hover: bg-accent + white
```

**BentoPosts**: 3col 미니 카드 그리드
```tsx
// container: full-width card, rounded-[20px]
// inner grid: repeat(3, 1fr), gap 12px
// post-mini: rounded-[14px], bg-bg, border, hover translateY(-2px)
```

### 6.3 Brutalist 컴포넌트 핵심 패턴

**BrutalistHeader**: 풀-width, 이중 보더
```tsx
// border-bottom: 3px solid
// header-top: flex justify-between, border-bottom 1px
// logo: font-size 18px, weight 800, uppercase, tracking 0.1em
// logo::after: " ///"
// nav: 버튼 형태 [BLOG] [GAME], padding 6px 16px, border 1px
// hover: bg-accent, color-bg (즉시 반전)
```

**BrutalistHero**: 전폭 + cursor 깜빡임
```tsx
// padding: 5rem 2rem, border-bottom 3px
// h1: clamp(2.5rem, 7vw, 6rem), weight 800, uppercase
// cursor: inline-block, w-0.6em h-0.08em, bg-accent, blink animation
// hero-commands: border 2px, inline-block
// command links: ::before "> ", color accent
```

**BrutalistGrid**: 번호 매김 + 즉시 반전
```tsx
// grid: 2col
// card: padding 2rem, border-bottom 2px, even: border-left 2px
// card-num: "001 //", font-size 12px
// card-title: 20px, weight 700, uppercase
// hover: bg-accent, color-bg (전체 반전)
```

**BrutalistPosts**: 리스트 형태, 번호 매김
```tsx
// section-label: "=== LATEST POSTS =========="
// post-item: flex, padding 1rem 2rem, border-bottom 1px
// post-num: "001", width 4rem
// post-title: 14px, weight 500, uppercase
// hover: bg-accent, color-bg (반전)
```

### 6.4 Glass 컴포넌트 핵심 패턴

**GlassHeader**: 플로팅 pill
```tsx
// padding: 1.5rem 2rem
// nav: max-w-64rem, margin auto
// background: card-bg (rgba), border: card-border (rgba)
// backdrop-filter: blur(20px), border-radius: 99px (pill)
// logo-dot: 10px circle, bg-accent, box-shadow glow
```

**GlassHero**: 플로팅 glass 카드 + float 애니메이션
```tsx
// hero-card: bg-card-bg, border-card-border, backdrop-blur(24px)
// border-radius: 24px, padding 4rem 3rem, text-align center
// animation: heroFloat 6s ease-in-out infinite (±6px)
// h1: clamp(2rem, 5vw, 4rem), weight 300
// hero-actions: primary(bg-accent, shadow glow) + secondary(glass card)
```

**GlassGrid**: 2col 플로팅 glass 카드
```tsx
// grid: 2col, gap 16px
// card: bg-card-bg, border-card-border, backdrop-blur(20px)
// border-radius: 20px, padding 2rem
// hover: scale(1.01) + translateY(-4px) + glow shadow
// icon: 40px square, rounded-12px, bg accent/15%, font-size 20px
```

**Glass 배경 blob 컴포넌트**:
```tsx
// components/layout/glass-background.tsx
// 3개 blob (position fixed, z-index 0)
// blob-1: 600px, top -10%, left -5%, gradient-1
// blob-2: 500px, top 40%, right -10%, gradient-2
// blob-3: 400px, bottom -5%, left 30%, gradient-3
// filter: blur(80px), opacity 0.4
// glass-float animation
// 조건부 렌더링: design === "glass"일 때만 표시
```

---

## 7. DesignPicker 컴포넌트 설계

### 7.1 UI 구조

```
┌──────────────────────────────────────┐
│  Customize                      [X]  │
│                                      │
│  Design Mode                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ ━━━ │ │ ▢ ▢ │ │ ███ │ │ ░░░ │   │
│  │ ━━━ │ │ ▢   │ │ ███ │ │ ░░░ │   │
│  │ ━━━ │ │     │ │     │ │     │   │
│  │ ●   │ │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│  에디토리얼                           │
│  타이포그래피 중심의 매거진 스타일     │
│                                      │
│  Color Theme                         │
│  ⬤ ○ ○ ○                            │
│  라이트  다크  크림  잉크             │
│                                      │
└──────────────────────────────────────┘
```

### 7.2 상태 및 인터랙션

```typescript
// components/design/design-picker.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesign } from "@/lib/design/use-design";
import { DESIGNS, type DesignId } from "@/lib/design";

export function DesignPicker() {
  const { design, theme, setDesign, setTheme, designConfig, availableThemes } = useDesign();
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭으로 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={pickerRef}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text"
        aria-label="디자인 선택"
      >
        <PaletteIcon />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-bg p-4 shadow-lg z-50"
          >
            {/* 디자인 선택 */}
            <p className="text-xs font-medium text-text-muted mb-3">Design Mode</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesign(d.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 border transition-all",
                    design === d.id
                      ? "border-accent bg-accent/10"
                      : "border-transparent hover:bg-bg-secondary"
                  )}
                >
                  <DesignPreviewIcon design={d.id} />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium">{designConfig.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{designConfig.description}</p>

            {/* 테마 선택 */}
            <p className="text-xs font-medium text-text-muted mt-4 mb-3">Color Theme</p>
            <div className="flex gap-2">
              {availableThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      theme === t.id
                        ? "border-accent shadow-[0_0_0_2px] shadow-accent"
                        : "border-border hover:scale-110"
                    )}
                    style={{
                      background: t.preview.startsWith("linear-gradient")
                        ? t.preview
                        : t.preview,
                    }}
                    title={t.name}
                  />
                  <span className="text-[10px] text-text-muted">{t.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 7.3 미니 프리뷰 아이콘

각 디자인 모드를 추상적으로 표현하는 24x24 SVG 아이콘:

```typescript
function DesignPreviewIcon({ design }: { design: DesignId }) {
  switch (design) {
    case "editorial":
      // 수평선 3줄 (매거진 레이아웃)
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="16" y2="12" />
          <line x1="4" y1="17" x2="12" y2="17" />
        </svg>
      );
    case "bento":
      // 4칸 그리드 (벤토 박스)
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="4" rx="1" />
          <rect x="13" y="9" width="8" height="4" rx="1" />
          <rect x="3" y="13" width="18" height="8" rx="2" />
        </svg>
      );
    case "brutalist":
      // 두꺼운 사각형 (브루탈)
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
          <rect x="3" y="3" width="18" height="18" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="10" x2="12" y2="21" />
        </svg>
      );
    case "glass":
      // 둥근 블러 원들 (글래스)
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <circle cx="9" cy="9" r="6" />
          <circle cx="16" cy="14" r="5" />
          <circle cx="10" cy="17" r="4" />
        </svg>
      );
  }
}
```

### 7.4 PaletteIcon

```typescript
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2" />
      <circle cx="17.5" cy="10.5" r="2" />
      <circle cx="8.5" cy="7.5" r="2" />
      <circle cx="6.5" cy="12.5" r="2" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
```

---

## 8. layout.tsx 통합 설계

### 8.1 수정된 RootLayout

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { DesignProvider } from "@/components/design/design-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GlassBackground } from "@/components/layout/glass-background";
import { SITE } from "@/lib/constants";
import Script from "next/script";
import "./globals.css";

// ... font 정의 동일 ...

const DESIGN_INIT_SCRIPT = `
(function(){
  try {
    var d = localStorage.getItem("needcash-design") || "editorial";
    var t = localStorage.getItem("needcash-theme") || "editorial-light";
    document.documentElement.setAttribute("data-design", d);
    document.documentElement.setAttribute("data-theme", t);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DESIGN_INIT_SCRIPT }} />
      </head>
      <body className={`${pretendard.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}>
        <DesignProvider>
          <GlassBackground />
          <div className="relative z-[1]">
            <Header />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
            <Footer />
          </div>
        </DesignProvider>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7452986546914975"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

### 8.2 GlassBackground 컴포넌트

```typescript
// components/layout/glass-background.tsx
"use client";

import { useDesign } from "@/lib/design/use-design";

export function GlassBackground() {
  const { design } = useDesign();

  if (design !== "glass") return null;

  return (
    <div className="bg-mesh fixed inset-0 z-0 overflow-hidden">
      <div
        className="blob absolute rounded-full"
        style={{
          width: 600, height: 600, top: "-10%", left: "-5%",
          background: "var(--gradient-1)",
          filter: "blur(80px)", opacity: 0.4,
          animation: "glass-float 20s ease-in-out infinite",
        }}
      />
      <div
        className="blob absolute rounded-full"
        style={{
          width: 500, height: 500, top: "40%", right: "-10%",
          background: "var(--gradient-2)",
          filter: "blur(80px)", opacity: 0.4,
          animation: "glass-float 20s ease-in-out infinite -7s",
        }}
      />
      <div
        className="blob absolute rounded-full"
        style={{
          width: 400, height: 400, bottom: "-5%", left: "30%",
          background: "var(--gradient-3)",
          filter: "blur(80px)", opacity: 0.4,
          animation: "glass-float 20s ease-in-out infinite -14s",
        }}
      />
    </div>
  );
}
```

---

## 9. page.tsx 리팩토링

### 9.1 수정된 Home 페이지

```typescript
// app/page.tsx
import { Hero } from "@/components/layout/hero";
import { SectionGrid } from "@/components/layout/section-grid";
import { PostsSection } from "@/components/layout/posts-section";
import { getAllPosts } from "@/lib/mdx";

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <>
      <Hero />
      <SectionGrid />
      <PostsSection posts={recentPosts} />
    </>
  );
}
```

page.tsx가 Server Component로 유지되고, 어댑터 컴포넌트들이 Client Component로 디자인 분기를 처리.

**주의**: `getAllPosts()`는 서버에서 실행되므로 page.tsx는 Server Component. posts 데이터를 props로 어댑터에 전달.

---

## 10. 기존 ThemeProvider 마이그레이션

### 10.1 ThemeProvider 제거 전략

현재 `next-themes`의 `ThemeProvider`가 `data-theme` attribute를 제어하고 있음. 이를 DesignProvider로 대체:

1. `components/theme/theme-provider.tsx` — 삭제하지 않고, DesignProvider 내부에서 `data-theme` 관리
2. `components/theme/theme-switcher.tsx` — DesignPicker로 대체, 파일 삭제
3. `next-themes` 패키지 — DesignProvider에서 직접 `data-theme` 관리하므로 next-themes 불필요해짐

**마이그레이션 순서**:
1. DesignProvider가 `data-design` + `data-theme` 모두 관리
2. layout.tsx에서 `<ThemeProvider>` → `<DesignProvider>`로 교체
3. Header에서 `<ThemeSwitcher>` → `<DesignPicker>`로 교체
4. `next-themes` 패키지 제거 가능 (선택)

### 10.2 기존 data-theme 호환성

현재 CSS:
- `:root` → light (기본)
- `[data-theme="dark"]` → dark

마이그레이션 후:
- `:root`, `[data-theme="editorial-light"]` → editorial light (기본)
- `[data-theme="editorial-dark"]` → editorial dark
- 기존 `[data-theme="dark"]` 제거

---

## 11. 구현 순서 (FR 매핑)

| # | 파일 | FR | 설명 |
|---|------|-----|------|
| 1 | `lib/design/index.ts` | FR-01 | 타입 + 레지스트리 |
| 2 | `lib/design/designs/editorial.ts` | FR-02 | Editorial 정의 |
| 3 | `lib/design/designs/bento.ts` | FR-02 | Bento 정의 |
| 4 | `lib/design/designs/brutalist.ts` | FR-02 | Brutalist 정의 |
| 5 | `lib/design/designs/glass.ts` | FR-02 | Glass 정의 |
| 6 | `components/design/design-provider.tsx` | FR-03 | DesignProvider |
| 7 | `lib/design/use-design.ts` | FR-04 | useDesign hook |
| 8 | `app/globals.css` | FR-05, FR-06 | 디자인+테마 CSS 변수 |
| 9 | `app/layout.tsx` | FR-16 | DesignProvider 통합 + FOUC 방지 |
| 10 | `components/layout/header/editorial-header.tsx` | FR-07 | 기존 Header 분리 |
| 11 | `components/layout/hero/editorial-hero.tsx` | FR-08 | 기존 Hero 분리 |
| 12 | `components/layout/section-grid/editorial-grid.tsx` | FR-08 | 기존 Grid 분리 |
| 13 | `components/layout/posts-section/editorial-posts.tsx` | FR-08 | 기존 Posts 분리 |
| 14 | `components/layout/footer/editorial-footer.tsx` | FR-08 | 기존 Footer 분리 |
| 15 | `components/layout/header.tsx` | FR-12 | Header 어댑터 |
| 16 | `components/layout/hero.tsx` | FR-12 | Hero 어댑터 |
| 17 | `components/layout/section-grid.tsx` | FR-12 | SectionGrid 어댑터 |
| 18 | `components/layout/posts-section.tsx` | FR-12 | PostsSection 어댑터 |
| 19 | `components/layout/footer.tsx` | FR-12 | Footer 어댑터 |
| 20 | `app/page.tsx` | FR-12 | 어댑터 조합 리팩토링 |
| 21 | `components/layout/header/bento-header.tsx` | FR-09 | Bento 헤더 |
| 22 | `components/layout/hero/bento-hero.tsx` | FR-09 | Bento 히어로 |
| 23 | `components/layout/section-grid/bento-grid.tsx` | FR-09 | Bento 그리드 |
| 24 | `components/layout/posts-section/bento-posts.tsx` | FR-09 | Bento 포스트 |
| 25 | `components/layout/footer/bento-footer.tsx` | FR-09 | Bento 푸터 |
| 26 | `components/layout/header/brutalist-header.tsx` | FR-10 | Brutalist 헤더 |
| 27 | `components/layout/hero/brutalist-hero.tsx` | FR-10 | Brutalist 히어로 |
| 28 | `components/layout/section-grid/brutalist-grid.tsx` | FR-10 | Brutalist 그리드 |
| 29 | `components/layout/posts-section/brutalist-posts.tsx` | FR-10 | Brutalist 포스트 |
| 30 | `components/layout/footer/brutalist-footer.tsx` | FR-10 | Brutalist 푸터 |
| 31 | `components/layout/header/glass-header.tsx` | FR-11 | Glass 헤더 |
| 32 | `components/layout/hero/glass-hero.tsx` | FR-11 | Glass 히어로 |
| 33 | `components/layout/section-grid/glass-grid.tsx` | FR-11 | Glass 그리드 |
| 34 | `components/layout/posts-section/glass-posts.tsx` | FR-11 | Glass 포스트 |
| 35 | `components/layout/footer/glass-footer.tsx` | FR-11 | Glass 푸터 |
| 36 | `components/layout/glass-background.tsx` | FR-11 | Glass 배경 blob |
| 37 | `components/design/design-picker.tsx` | FR-13 | DesignPicker UI |
| 38 | 각 헤더에 DesignPicker 통합 | FR-14 | 헤더 통합 |
| 39 | DesignProvider localStorage | FR-15 | 저장/복원 |
| 40 | `theme-switcher.tsx` 참조 제거 | FR-17 | ThemeSwitcher 대체 |

---

## 12. 검증 항목

| # | 검증 항목 | 방법 |
|---|----------|------|
| 1 | Editorial 4개 테마 전환 | 수동 확인 (DesignPicker) |
| 2 | Bento 4개 테마 전환 | 수동 확인 |
| 3 | Brutalist 4개 테마 전환 | 수동 확인 |
| 4 | Glass 4개 테마 전환 | 수동 확인 |
| 5 | 디자인 전환 시 테마 자동 리셋 | editorial → bento 전환 시 bento-clean으로 자동 변경 |
| 6 | localStorage 저장/복원 | 새로고침 후 마지막 선택 유지 |
| 7 | FOUC 없음 | 새로고침 시 깜빡임 없이 올바른 디자인 표시 |
| 8 | 모바일 반응형 (320px) | 각 디자인의 모바일 레이아웃 확인 |
| 9 | 기존 /game 페이지 정상 | 게임 페이지 렌더링 영향 없음 |
| 10 | 기존 /blog 페이지 정상 | 블로그 페이지 렌더링 영향 없음 |
| 11 | `pnpm lint` | 통과 |
| 12 | `pnpm build` | 통과 |

---

**Created**: 2026-02-12
**Feature**: multi-design
**Phase**: Design
**Plan Reference**: `docs/01-plan/features/multi-design.plan.md`
**Brainstorm Reference**: `docs/brainstorm/multi-design.md`
**HTML Samples**: `docs/brainstorm/multi-design-samples/`
