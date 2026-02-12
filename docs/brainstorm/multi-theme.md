# NeedCash 멀티 테마 디자인 시스템 회의 결과

> **작성일**: 2026-02-12
> **참여자**: System Architect, Frontend Architect, UI/UX Designer
> **목적**: 감각적인 디자인 개선 + 사용자 테마 선택 기능 설계

---

## 1. 현재 아키텍처 평가

### 현재 구조
```
globals.css          → CSS variables 정의 (:root, [data-theme="dark"])
@theme inline        → Tailwind 4가 CSS vars를 utility class로 매핑
theme-provider.tsx   → next-themes (attribute="data-theme", themes=["dark","light"])
theme-switcher.tsx   → dark/light 토글 버튼
components/*.tsx     → Tailwind classes (bg-bg, text-text, border-border 등)
```

### 확장성 평가: **9/10**

| 요소 | 평가 | 이유 |
|------|------|------|
| CSS variables | 완벽 | 11개 시맨틱 변수가 모든 색상을 제어 |
| Tailwind 4 `@theme inline` | 완벽 | CSS vars → utility class 자동 매핑 |
| next-themes | 완벽 | `themes` 배열에 추가만 하면 됨 |
| 컴포넌트 결합도 | 완벽 | 하드코딩된 색상값 0개, 모두 시맨틱 토큰 사용 |
| 정적 export 호환 | 완벽 | CSS-only 방식이라 SSG와 100% 호환 |

**핵심 발견**: `globals.css`에 `[data-theme="새테마"]` 블록만 추가하면 전체 사이트에 즉시 적용. 컴포넌트 수정 불필요.

---

## 2. 멀티 테마 아키텍처 설계

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────┐
│                  Theme Registry                  │
│           lib/themes/index.ts                    │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐   │
│  │light │ dark │craft │neon  │ocean │ ...  │   │
│  └──────┴──────┴──────┴──────┴──────┴──────┘   │
└────────────────────┬────────────────────────────┘
                     │ TypeScript 타입 검증
                     ▼
┌─────────────────────────────────────────────────┐
│              globals.css                         │
│  :root { ... }                ← light (default)  │
│  [data-theme="dark"] {}       ← dark             │
│  [data-theme="warm-craft"] {} ← 새 테마          │
│  [data-theme="neon-terminal"]{}← 새 테마         │
└────────────────────┬────────────────────────────┘
                     │ @theme inline (Tailwind 4)
                     ▼
┌─────────────────────────────────────────────────┐
│         Tailwind Utility Classes                 │
│  bg-bg, text-text, border-border, ...           │
│  (변경 없음 - 자동 반영)                         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ ThemeProvider │→ │ ThemePicker  │→ │ Components  │
│ (next-themes) │  │ (Popover UI) │  │ (변경 없음) │
└──────────────┘  └──────────────┘  └─────────────┘
```

### 파일 구조

```
lib/
  themes/
    index.ts              # 테마 레지스트리 + 타입 정의
components/
  theme/
    theme-provider.tsx     # next-themes 래퍼 (themes 배열 동적 생성)
    theme-picker.tsx       # 멀티 테마 선택 Popover UI (신규)
app/
  globals.css              # [data-theme="X"] 블록 추가
```

### TypeScript 타입 정의

```typescript
// lib/themes/index.ts

export interface ThemeTokens {
  bg: string;
  'bg-secondary': string;
  'bg-tertiary': string;
  text: string;
  'text-secondary': string;
  'text-muted': string;
  border: string;
  accent: string;
  'accent-hover': string;
  'card-bg': string;
  'card-border': string;
  'code-bg': string;
}

export interface ThemeConfig {
  id: string;                    // data-theme 속성값
  name: string;                  // UI 표시명
  group: 'light' | 'dark';      // 밝은/어두운 계열
  tokens: ThemeTokens;           // CSS variable 값들
}

export const themes: ThemeConfig[] = [ /* ... */ ];
export const themeIds = themes.map(t => t.id);
```

---

## 3. 테마 전환 UI/UX 설계

### Popover 팔레트 피커 (추천)

#### 데스크톱
```
[헤더] ... Blog  Game  Ads  Resume  [palette icon]
                                      ↓ click
                               ┌──────────────┐
                               │  Choose Theme │
                               │               │
                               │  ○ Light      │  ← 색상 dot + 이름
                               │  ● Dark       │  ← 현재 선택 표시
                               │  ○ Warm Craft │
                               │  ○ Terminal   │
                               │  ○ Lavender   │
                               │  ○ Editorial  │
                               │  ○ Ocean      │
                               │  ○ Rose       │
                               │               │
                               │  [System ↺]   │
                               └──────────────┘
```

#### 모바일
- 동일 Popover, 하단 앵커
- 터치 타겟 44x44px 이상

#### 프리뷰 방식
- 각 테마 옵션 옆에 2~3색 원형 dot (bg + accent)
- 클릭 즉시 적용 (라이브 프리뷰 대신 **즉시 전환**)
- 기존 CSS transition 0.4s cubic-bezier로 부드러운 전환

### 전환 애니메이션

**기본**: 기존 CSS transition 유지
```css
body, header, main, footer, nav, a, button, .prose-custom {
  transition: background-color 0.4s, color 0.4s, border-color 0.4s;
}
```

**Progressive Enhancement**: View Transitions API
```typescript
function setThemeWithTransition(setTheme, newTheme) {
  if ('startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => setTheme(newTheme));
  } else {
    setTheme(newTheme);
  }
}
```

### 접근성
- `role="radiogroup"` + `aria-label="테마 선택"`
- Arrow keys 순환 탐색, Enter/Space 선택, Escape 닫기
- 모든 테마 WCAG AA 색상 대비 (본문 4.5:1 이상)
- `prefers-reduced-motion: reduce` 존중

---

## 4. 테마 후보 목록 (7가지)

### Theme 1: `minimal-mono` — 미니멀 모노 (현재 기본)

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 중립, 정제, 건축 | 중성 | Light/Dark 동등 | 디자이너/개발자 |

**컨셉**: 순수 흑백 미니멀리즘. Warren Mahoney에서 영감.

| Light | Dark |
|-------|------|
| bg: `#FFFFFF` | bg: `#0A0A0A` |
| text: `#0A0A0A` | text: `#F0F0F0` |
| accent: `#0A0A0A` | accent: `#F0F0F0` |

특수 효과: 없음 (순수 타이포그래피와 여백)

---

### Theme 2: `warm-craft` — 따뜻한 크래프트

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 유기적, 공방, 와비사비 | 따뜻 | Light 중심 | 크리에이터/작가 |

**컨셉**: 일본 와비사비 + 유럽 공방. Kinfolk, Aesop 영감. 양피지 배경에 번트 시에나 악센트.

| Light | Dark |
|-------|------|
| bg: `#FAF7F2` (양피지) | bg: `#1C1712` |
| text: `#2C2014` (딥 브라운) | text: `#E8DFD0` |
| accent: `#8A5025` (번트 시에나) | accent: `#D4894A` |

특수 효과:
- 미세 종이 질감 오버레이 (grain-texture, opacity: 0.03)
- `::selection` 배경: 따뜻한 앰버
- 행간 1.75로 여유로운 읽기 경험

레퍼런스: aesop.com, kinfolk.com, monocle.com

---

### Theme 3: `neon-terminal` — 네온 터미널

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 해커, 사이버, 기술 | 차가움 | **Dark 중심** | 개발자/해커 |

**컨셉**: 80년대 CRT 모니터와 해커 문화. 포스포 그린이 어둠 속에서 빛남.

| Light | Dark (핵심) |
|-------|------|
| bg: `#F2F4F0` | bg: `#0A0E0A` |
| text: `#0B1A0B` | text: `#D0F0D0` |
| accent: `#1A8C1A` | accent: `#33FF33` |

특수 효과:
- Dark 모드 `text-shadow: 0 0 10px rgba(51,255,51,0.3)` 글로우
- CRT 스캔라인 효과 (선택적)
- 코드 블록 `border-left: 2px solid #33FF33`
- 모노스페이스 타이포그래피 강화

레퍼런스: hyper.is, vercel.com (dark)

---

### Theme 4: `soft-lavender` — 소프트 라벤더

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 부드러움, 모던, 드리미 | 쿨 | Light 중심 | 일반 사용자 |

**컨셉**: Notion, Linear 같은 모던 SaaS의 세련된 청보라 톤.

| Light | Dark |
|-------|------|
| bg: `#FAFAFD` | bg: `#13111C` |
| text: `#1C1830` | text: `#E8E5F0` |
| accent: `#6C5CE7` (비비드 퍼플) | accent: `#A78BFA` |

특수 효과:
- 카드 hover: `box-shadow: 0 4px 20px rgba(108,92,231,0.08)` 퍼플 섀도우
- 배경 미세 라디얼 그라디언트 (선택적)
- 헤딩 weight 600 (부드러운 무게감)

레퍼런스: linear.app, notion.so, arc.net

---

### Theme 5: `editorial-bold` — 에디토리얼 볼드

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 대담, 인쇄, 권위 | 중성 | Light/Dark 동등 | 콘텐츠 크리에이터 |

**컨셉**: Bloomberg, NYT Magazine 스타일. 크림 화이트에 에디토리얼 레드 악센트.

| Light | Dark |
|-------|------|
| bg: `#FFFDF5` (크림) | bg: `#0C0C08` |
| text: `#0A0A0A` | text: `#F5F5E8` |
| accent: `#D63031` (에디토리얼 레드) | accent: `#FF4757` |

특수 효과:
- 헤딩 자간 -0.04em, weight 800 (대담한 타이포)
- 구분선 2px (magazine rule line)
- `border-left: 3px` accent 포인트 (blockquote)
- 블로그 `::first-letter` 드롭캡 (선택적)

레퍼런스: bloomberg.com, nytimes.com/magazine

---

### Theme 6: `ocean-depth` — 오션 뎁스

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 신뢰, 전문, 차분 | 차가움 | Dark 중심 | 비즈니스/테크 |

**컨셉**: 깊은 바다의 고요함. Stripe, Tailwind 같은 테크 기업 무드.

| Light | Dark |
|-------|------|
| bg: `#F5F8FA` | bg: `#0A1628` |
| text: `#0B1929` (딥 네이비) | text: `#D4E5F5` |
| accent: `#0066CC` (딥 블루) | accent: `#3FA7FF` |

특수 효과:
- Dark 배경: `radial-gradient(ellipse at bottom, #0F1D32, #0A1628)` 심해 그라디언트
- 글래스모피즘 헤더 강화
- 카드 hover: 미세 블루 글로우

레퍼런스: stripe.com, tailwindcss.com, planetscale.com

---

### Theme 7: `midnight-rose` — 미드나잇 로즈

| 무드 | 온도 | 최적 모드 | 페르소나 |
|------|------|-----------|---------|
| 럭셔리, 우아, 프리미엄 | 따뜻 | **Dark 중심** | 프리미엄 사용자 |

**컨셉**: 어둠 속의 로즈 골드. 럭셔리 브랜드의 절제된 우아함.

| Light | Dark (핵심) |
|-------|------|
| bg: `#FDF9F9` | bg: `#12090C` |
| text: `#2A1A1E` | text: `#F0E0E4` |
| accent: `#B76E79` (로즈 골드) | accent: `#D4919C` |

특수 효과:
- Dark accent `text-shadow: 0 0 20px rgba(212,145,156,0.15)` 은은한 글로우
- 헤딩 weight 500 (우아한 가벼움)
- 카드 hover: 로즈 골드 섀도우

레퍼런스: cartier.com, apple.com (dark), cosmos.so

---

## 5. 핵심 결정사항 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| 테마 적용 방식 | CSS `[data-theme]` selector | 기존 패턴 유지, 컴포넌트 수정 0건 |
| 테마 관리 | `next-themes` 유지 확장 | FOUC 방지, localStorage 내장 |
| CSS 전략 | 단일 globals.css | SSG 호환, 코드 스플리팅 불필요 (~6KB) |
| 저장 방식 | localStorage (next-themes 기본) | SSG 최적, 추가 구현 불필요 |
| 전환 애니메이션 | 기존 transition + View Transitions API | progressive enhancement |
| 테마 선택 UI | Popover 팔레트 피커 | 최소 공간, 시각적 프리뷰, 접근성 |
| 기본 테마 | `dark` (현재 light→dark 변경) | CLAUDE.md "다크 모드 기본" 준수 |
| 테마 수 | 7개 (light/dark + 5개 신규) | 다양한 무드, 각각 뚜렷한 차별화 |

---

## 6. 새 테마 추가 비용 (확장성)

```
Step 1: globals.css에 [data-theme="새이름"] { 11개 CSS 변수 } 추가
Step 2: lib/themes/index.ts의 themes 배열에 ThemeConfig 객체 추가
끝. 컴포넌트 수정 0건.
```

---

## 7. 구현 우선순위

| 단계 | 작업 | 복잡도 | 변경 파일 |
|------|------|--------|-----------|
| 1 | `lib/themes/index.ts` 테마 레지스트리 생성 | 낮음 | 신규 1개 |
| 2 | `globals.css`에 7개 테마 CSS variable 블록 추가 | 중간 | 수정 1개 |
| 3 | `theme-provider.tsx` themes 배열 확장 + defaultTheme 변경 | 낮음 | 수정 1개 |
| 4 | `theme-picker.tsx` Popover UI 구현 | 중간 | 신규 1개 |
| 5 | `header.tsx` ThemeSwitcher→ThemePicker 교체 | 낮음 | 수정 1개 |
| 6 | View Transitions API progressive enhancement | 낮음 | 신규 1개 |
| 7 | 접근성 테스트 및 대비 검증 | 중간 | - |

**총 변경**: 신규 파일 3개, 수정 파일 3개, 삭제 1개 (theme-switcher.tsx)

---

## 8. 테마별 전체 컬러 팔레트 (구현용)

### minimal-mono (Light)
```css
:root {
  --bg: #FFFFFF; --bg-secondary: #F7F7F7; --bg-tertiary: #ECECEC;
  --text: #0A0A0A; --text-secondary: #555555; --text-muted: #999999;
  --border: #E0E0E0; --accent: #0A0A0A; --accent-hover: #333333;
  --card-bg: #FFFFFF; --card-border: #ECECEC; --code-bg: #F5F5F5;
}
```

### minimal-mono (Dark)
```css
[data-theme="dark"] {
  --bg: #0A0A0A; --bg-secondary: #141414; --bg-tertiary: #1E1E1E;
  --text: #F0F0F0; --text-secondary: #A0A0A0; --text-muted: #666666;
  --border: #222222; --accent: #F0F0F0; --accent-hover: #CCCCCC;
  --card-bg: #111111; --card-border: #1E1E1E; --code-bg: #1A1A1A;
}
```

### warm-craft (Light)
```css
[data-theme="warm-craft"] {
  --bg: #FAF7F2; --bg-secondary: #F0EBE1; --bg-tertiary: #E6DFD1;
  --text: #2C2014; --text-secondary: #6B5B4A; --text-muted: #A09181;
  --border: #DDD4C4; --accent: #8A5025; --accent-hover: #A46332;
  --card-bg: #FAF7F2; --card-border: #E6DFD1; --code-bg: #F0EBE1;
}
```

### warm-craft (Dark)
```css
[data-theme="warm-craft-dark"] {
  --bg: #1C1712; --bg-secondary: #252018; --bg-tertiary: #302920;
  --text: #E8DFD0; --text-secondary: #A09181; --text-muted: #6B5B4A;
  --border: #302920; --accent: #D4894A; --accent-hover: #E09B5C;
  --card-bg: #211C15; --card-border: #302920; --code-bg: #252018;
}
```

### neon-terminal (Light)
```css
[data-theme="neon-terminal"] {
  --bg: #F2F4F0; --bg-secondary: #E8EBE4; --bg-tertiary: #DEE1D8;
  --text: #0B1A0B; --text-secondary: #3D5A3D; --text-muted: #7A917A;
  --border: #C8D0C0; --accent: #1A8C1A; --accent-hover: #22A722;
  --card-bg: #F2F4F0; --card-border: #DEE1D8; --code-bg: #E8EBE4;
}
```

### neon-terminal (Dark)
```css
[data-theme="neon-terminal-dark"] {
  --bg: #0A0E0A; --bg-secondary: #0F150F; --bg-tertiary: #151D15;
  --text: #D0F0D0; --text-secondary: #7AB87A; --text-muted: #3D6A3D;
  --border: #1A2A1A; --accent: #33FF33; --accent-hover: #66FF66;
  --card-bg: #0D120D; --card-border: #1A2A1A; --code-bg: #0F150F;
}
```

### soft-lavender (Light)
```css
[data-theme="soft-lavender"] {
  --bg: #FAFAFD; --bg-secondary: #F3F1F8; --bg-tertiary: #EBE8F3;
  --text: #1C1830; --text-secondary: #5B5473; --text-muted: #9490A8;
  --border: #DDD9EA; --accent: #6C5CE7; --accent-hover: #7D6FF0;
  --card-bg: #FFFFFF; --card-border: #EBE8F3; --code-bg: #F5F3FA;
}
```

### soft-lavender (Dark)
```css
[data-theme="soft-lavender-dark"] {
  --bg: #13111C; --bg-secondary: #1A1726; --bg-tertiary: #221E30;
  --text: #E8E5F0; --text-secondary: #9490A8; --text-muted: #5B5473;
  --border: #221E30; --accent: #A78BFA; --accent-hover: #B9A3FB;
  --card-bg: #16141F; --card-border: #221E30; --code-bg: #1A1726;
}
```

### editorial-bold (Light)
```css
[data-theme="editorial-bold"] {
  --bg: #FFFDF5; --bg-secondary: #F5F3E8; --bg-tertiary: #EBEBDB;
  --text: #0A0A0A; --text-secondary: #3A3A3A; --text-muted: #7A7A6A;
  --border: #C8C8B8; --accent: #D63031; --accent-hover: #E84142;
  --card-bg: #FFFDF5; --card-border: #EBEBDB; --code-bg: #F5F3E8;
}
```

### editorial-bold (Dark)
```css
[data-theme="editorial-bold-dark"] {
  --bg: #0C0C08; --bg-secondary: #15150F; --bg-tertiary: #1E1E16;
  --text: #F5F5E8; --text-secondary: #A0A090; --text-muted: #606050;
  --border: #1E1E16; --accent: #FF4757; --accent-hover: #FF6B7A;
  --card-bg: #100F0B; --card-border: #1E1E16; --code-bg: #15150F;
}
```

### ocean-depth (Light)
```css
[data-theme="ocean-depth"] {
  --bg: #F5F8FA; --bg-secondary: #EBF1F5; --bg-tertiary: #DFE8EF;
  --text: #0B1929; --text-secondary: #3D5A73; --text-muted: #7A97AD;
  --border: #CEDBE5; --accent: #0066CC; --accent-hover: #1A7ADE;
  --card-bg: #F9FBFC; --card-border: #DFE8EF; --code-bg: #EDF2F7;
}
```

### ocean-depth (Dark)
```css
[data-theme="ocean-depth-dark"] {
  --bg: #0A1628; --bg-secondary: #0F1D32; --bg-tertiary: #15253D;
  --text: #D4E5F5; --text-secondary: #7A97AD; --text-muted: #3D5A73;
  --border: #15253D; --accent: #3FA7FF; --accent-hover: #5CBAFF;
  --card-bg: #0D1A2E; --card-border: #15253D; --code-bg: #0F1D32;
}
```

### midnight-rose (Light)
```css
[data-theme="midnight-rose"] {
  --bg: #FDF9F9; --bg-secondary: #F8F0F0; --bg-tertiary: #F0E5E5;
  --text: #2A1A1E; --text-secondary: #6B4F58; --text-muted: #A08890;
  --border: #E8D8DC; --accent: #B76E79; --accent-hover: #C98290;
  --card-bg: #FFFFFF; --card-border: #F0E5E5; --code-bg: #F8F0F0;
}
```

### midnight-rose (Dark)
```css
[data-theme="midnight-rose-dark"] {
  --bg: #12090C; --bg-secondary: #1A0F13; --bg-tertiary: #24161B;
  --text: #F0E0E4; --text-secondary: #A08890; --text-muted: #6B4F58;
  --border: #24161B; --accent: #D4919C; --accent-hover: #E0A5AE;
  --card-bg: #160C10; --card-border: #24161B; --code-bg: #1A0F13;
}
```
