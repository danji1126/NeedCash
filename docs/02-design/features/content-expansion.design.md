# Design: content-expansion

> NeedCash 프로토타입 허브의 8단계 콘텐츠 확장 — 공유 시스템, 신규 게임 3종, 개발자 도구 섹션, 데일리 챌린지 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  lib/share.ts                              # Phase 1: 공유 유틸리티
  lib/daily.ts                              # Phase 6: 데일리 챌린지 로직
  lib/constants.ts                          # [수정] GAMES +3, TOOLS, NAV_LINKS, FOOTER_SECTIONS
  lib/game-content.ts                       # [수정] typing, math, quiz 콘텐츠 추가
  components/ui/icons.tsx                   # [수정] UIIconType +7 아이콘
  components/game/share-result.tsx          # Phase 1: 공유 버튼 컴포넌트
  components/game/typing-game.tsx           # Phase 2: 타이핑 스피드 게임
  components/game/math-game.tsx             # Phase 4: 수학 암산 게임
  components/game/personality-quiz.tsx      # Phase 8: 퍼스널리티 퀴즈
  components/game/reaction-game.tsx         # [수정] ShareResult 통합
  components/game/color-memory-game.tsx     # [수정] ShareResult 통합
  components/game/color-sense-game.tsx      # [수정] ShareResult 통합
  components/game/dice-game.tsx             # [수정] ShareResult 통합
  components/game/lotto-game.tsx            # [수정] ShareResult 통합
  components/game/animal-face.tsx           # [수정] ShareResult 통합
  components/home/daily-challenge.tsx       # Phase 6: 데일리 위젯
  components/home/home-page.tsx             # [수정] DailyChallenge 삽입
  components/tools/json-formatter.tsx       # Phase 3: JSON 포매터
  components/tools/base64-tool.tsx          # Phase 3: Base64 인코더
  components/tools/color-palette.tsx        # Phase 3: 색상 팔레트
  components/tools/sort-visualizer.tsx      # Phase 7: 정렬 시각화
  app/tools/page.tsx                        # Phase 3: 도구 허브
  app/tools/[slug]/page.tsx                 # Phase 3: 개별 도구 라우트
  app/game/[slug]/page.tsx                  # [수정] 3개 게임 dynamic import
  app/sitemap.ts                            # [수정] /tools 페이지 추가
```

### 1.2 의존성 관계

```
share-result.tsx
  ├── react (useState, useCallback)
  ├── framer-motion (motion, AnimatePresence)
  └── @/lib/share (buildShareText, copyToClipboard)

typing-game.tsx / math-game.tsx
  ├── react (useState, useRef, useCallback, useEffect)
  ├── framer-motion (motion, AnimatePresence)
  ├── @/components/ui/button (Button)
  └── @/components/game/share-result (ShareResult)

personality-quiz.tsx
  ├── react (useState, useCallback)
  ├── framer-motion (motion, AnimatePresence)
  ├── @/components/ui/button (Button)
  └── @/components/game/share-result (ShareResult)

daily-challenge.tsx
  ├── react (useState, useEffect)
  ├── framer-motion (motion)
  ├── next/link (Link)
  ├── @/lib/constants (GAMES)
  ├── @/lib/daily (getDailyGame, getStreak, updateStreak)
  └── @/components/ui/icons (UIIcon)

sort-visualizer.tsx
  ├── react (useState, useRef, useCallback, useEffect)
  └── @/components/ui/button (Button)

json-formatter.tsx / base64-tool.tsx / color-palette.tsx
  ├── react (useState)
  └── @/components/ui/button (Button)
```

외부 라이브러리 추가: 없음 (번들 사이즈 증가 0KB — 모든 컴포넌트 dynamic import로 코드 스플리팅)

---

## 2. Phase 1: 게임 결과 공유 시스템

### 2.1 공유 유틸리티 (`lib/share.ts`)

```typescript
interface ShareOptions {
  game: string;     // slug
  title: string;    // 게임 타이틀
  lines: string[];  // 결과 라인들
}

function buildShareText({ game, title, lines }: ShareOptions): string;
// → "[NeedCash] {title}\n{lines.join('\n')}\nhttps://needcash.dev/game/{slug}"

async function copyToClipboard(text: string): Promise<boolean>;
// → navigator.clipboard.writeText (primary)
// → document.execCommand("copy") (fallback for older browsers)
```

### 2.2 ShareResult 컴포넌트 (`components/game/share-result.tsx`)

```typescript
interface ShareResultProps {
  game: string;     // slug
  title: string;    // 게임 타이틀
  lines: string[];  // 결과 라인들
}
```

**동작 흐름**:
```
[클릭] → buildShareText() → copyToClipboard() → setCopied(true) → 2초 후 리셋
```

**UI 상태**:
| 상태 | 아이콘 | 텍스트 |
|------|--------|--------|
| 기본 | 📋 (복사 아이콘) | "결과 공유" |
| 복사됨 | ✓ (체크 아이콘) | "복사됨!" |

텍스트 전환은 `AnimatePresence mode="wait"` + y축 슬라이드

### 2.3 게임별 통합 위치

| 게임 | 조건 | 공유 lines |
|------|------|-----------|
| reaction-game | phase === "result" | `["등급: {grade} · {title}", "평균: {avg}ms"]` |
| color-memory-game | phase === "result" | `["등급: {grade} · {title}", "{round}라운드 도달"]` |
| color-sense-game | phase === "result" | `["등급: {grade} · {title}", "점수: {score}"]` |
| dice-game | !rolling && history.length > 0 | `["주사위: {value}"]` |
| lotto-game | !drawing && result | `["번호: {numbers.join(', ')}"]` |
| animal-face | phase === "result" | `["{resultAnimal}"]` |

---

## 3. Phase 2: 타이핑 스피드 게임

### 3.1 상태 머신

```
idle ──[시작]──▶ countdown(3,2,1) ──[0도달]──▶ playing(60초) ──[시간종료]──▶ result
                                                  │
                                                  ├── 문자 입력 → 실시간 정오답 색상
                                                  └── WPM/정확도 실시간 계산
```

### 3.2 State 정의

```typescript
type Phase = "idle" | "countdown" | "playing" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";
type Lang = "ko" | "en";

interface HistoryItem {
  id: number;
  wpm: number;
  grade: Grade;
  title: string;
  lang: Lang;
}

const [phase, setPhase] = useState<Phase>("idle");
const [lang, setLang] = useState<Lang>("en");
const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);  // 60
const [currentText, setCurrentText] = useState("");
const [userInput, setUserInput] = useState("");
const [history, setHistory] = useState<HistoryItem[]>([]);
```

### 3.3 등급 시스템

| 등급 | WPM | 칭호 |
|:----:|:---:|------|
| S | 100+ | "타자의 신" |
| A | 80-99 | "번개 손가락" |
| B | 60-79 | "빠른 타이핑" |
| C | 40-59 | "평범한 속도" |
| D | 20-39 | "연습이 필요해요" |
| F | <20 | "초보 타이피스트" |

### 3.4 핵심 로직

```typescript
// WPM 계산
const wpm = Math.round((totalChars / 5) / ((TIME_LIMIT - timeLeft) / 60));

// 정확도 계산
const accuracy = Math.round((correctChars / totalChars) * 100);

// 문자별 색상 표시
// - 정답: text-emerald-400
// - 오답: text-red-400 bg-red-400/20
// - 미입력: text-text-muted/40
```

### 3.5 텍스트 코퍼스

- `KO_TEXTS[]`: 한국어 6개 문단 (일상, 기술, 자연, 습관 등)
- `EN_TEXTS[]`: 영어 6개 문단 (동일 주제)
- 파일 내 상수로 정의 (외부 파일 불필요)

---

## 4. Phase 3: 개발자 유틸리티 도구

### 4.1 라우팅 구조

```
app/tools/
├── page.tsx          ← 서버 컴포넌트, TOOLS.map() 그리드
└── [slug]/
    └── page.tsx      ← 서버 컴포넌트, TOOL_COMPONENTS[slug] dynamic import
```

### 4.2 TOOLS 데이터

```typescript
interface Tool {
  slug: string;
  title: string;
  description: string;
  icon: UIIconType;
  category: "formatter" | "encoder" | "design" | "visualizer";
}

const TOOLS: Tool[] = [
  { slug: "json-formatter", title: "JSON Formatter", icon: "braces", ... },
  { slug: "base64", title: "Base64 Encoder", icon: "code", ... },
  { slug: "color-palette", title: "Color Palette", icon: "palette", ... },
  { slug: "sort-visualizer", title: "Sort Visualizer", icon: "chart-bar", ... },
];
```

### 4.3 도구 허브 페이지 (`app/tools/page.tsx`)

```
┌──────────────────────────────────────────────────┐
│  홈 > 도구                                        │
│                                                    │
│  Developer Tools                                   │
│  개발자 도구                                        │
│  무료 온라인 유틸리티 도구 모음                        │
│  ────────────────                                  │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ {} icon      │  │ </> icon     │                │
│  │ JSON Format  │  │ Base64       │                │
│  │ description  │  │ description  │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 🎨 icon      │  │ 📊 icon     │                │
│  │ Color Palette│  │ Sort Visual  │                │
│  │ description  │  │ description  │                │
│  └──────────────┘  └──────────────┘                │
└──────────────────────────────────────────────────┘
```

레이아웃: `grid gap-4 sm:grid-cols-2`

### 4.4 JSON Formatter

```
입력(textarea) → [Format | Minify | Validate] → 출력(pre/code) + 복사
```

**상태**: input(string), output(string), error(string|null), success(string|null), copied(boolean)

### 4.5 Base64 Tool

```
encode: btoa(unescape(encodeURIComponent(input)))   // UTF-8 안전
decode: decodeURIComponent(escape(atob(input)))
```

**모드**: encode ↔ decode 토글, 자동 감지 가능

### 4.6 Color Palette

```
기본색(hex) → HSL 변환 → 보색(H+180°), 유사색(H±30°), 삼색(H±120°) 생성
각 swatch: hex/rgb/hsl 표시 + 복사
```

---

## 5. Phase 4: 수학 암산 게임

### 5.1 상태 머신

```
idle ──[난이도 선택 + 시작]──▶ countdown(3,2,1) ──▶ playing(60초) ──▶ result
                                                       │
                                                       ├── 문제 표시 → 정답 입력
                                                       ├── 정답 시 → 다음 문제 + 점수++
                                                       └── 오답 시 → 흔들림 + 다음 문제
```

### 5.2 State 정의

```typescript
type Phase = "idle" | "countdown" | "playing" | "result";
type Difficulty = "easy" | "medium" | "hard";

interface Problem {
  a: number;
  b: number;
  operator: string;  // "+", "−", "×", "÷"
  answer: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { range: number; operators: string[]; label: string }> = {
  easy: { range: 20, operators: ["+", "−"], label: "쉬움" },
  medium: { range: 50, operators: ["+", "−", "×", "÷"], label: "보통" },
  hard: { range: 100, operators: ["+", "−", "×", "÷"], label: "어려움" },
};
```

### 5.3 문제 생성 로직

```typescript
// 나눗셈 정수 보장:
// b = randInt(2, range), answer = randInt(1, range)
// a = b × answer → a ÷ b = answer (항상 정수)

// 뺄셈: a ≥ b 보장 (음수 결과 방지)
```

### 5.4 등급 시스템

| 등급 | 정답 수 | 칭호 |
|:----:|:------:|------|
| S | 30+ | "수학 천재" |
| A | 20-29 | "암산 달인" |
| B | 15-19 | "계산기 불필요" |
| C | 10-14 | "평범한 계산력" |
| D | 5-9 | "더 연습하세요" |
| F | <5 | "계산기를 찾아주세요" |

---

## 6. Phase 5: 콘텐츠 간 연결 강화

### 6.1 FOOTER_SECTIONS 확장

기존 게임 섹션에 typing, math, quiz 링크 추가.
신규 "도구" 섹션에 json-formatter, base64, color-palette, sort-visualizer 링크 추가.

### 6.2 NAV_LINKS 변경

```typescript
// 기존: 블로그, 게임, 이력서, 소개
// 변경: 블로그, 게임, 도구, 이력서, 소개
```

NAV_LINKS 변경만으로 4개 디자인 헤더(editorial, bento, brutalist, glass) 모두 자동 반영.

---

## 7. Phase 6: 데일리 챌린지

### 7.1 시드 PRNG (`lib/daily.ts`)

```typescript
// 날짜 문자열("YYYY-MM-DD") → 해시 → LCG(Linear Congruential Generator)
function seededRandom(seed: string): number {
  // djb2 해시 → LCG(a=1103515245, c=12345) → 0~1 범위 반환
}

function getDailyGame(games: { slug: string }[]): string {
  const today = new Date().toISOString().split("T")[0];
  const rand = seededRandom(today);
  return games[Math.floor(rand * games.length)].slug;
}
```

### 7.2 스트릭 관리

```typescript
interface StreakData {
  current: number;   // 현재 연속 방문일
  best: number;      // 최고 기록
  lastVisit: string; // "YYYY-MM-DD"
}

const STREAK_KEY = "needcash-daily-streak";

function getStreak(): StreakData;    // localStorage 읽기 (SSR 안전)
function updateStreak(): StreakData; // 방문 기록 + 스트릭 갱신
```

**스트릭 로직**:
```
오늘 이미 방문 → 기존 데이터 반환 (중복 카운트 방지)
어제 방문 → current + 1 (연속)
그 외 → current = 1 (리셋)
best = max(best, current)
```

### 7.3 DailyChallenge 위젯

```
┌──────────────────────────────────────────────────┐
│  📅 오늘의 게임                                     │
│                                                    │
│  🎲 Dice Roller                                    │
│  주사위를 굴려 행운을 시험해보세요!                     │
│                                                    │
│  [ 도전하기 → ]                                     │
│                                                    │
│  ────────────────                                  │
│  🔥 연속 방문 5일 (최고 12일)                         │
│  꾸준히 방문하고 계시네요! 대단해요 👏                  │
└──────────────────────────────────────────────────┘
```

### 7.4 home-page.tsx 통합

```tsx
// 기존: switch(design) → return <DesignHome />
// 변경: switch(design) → content = <DesignHome />; break;
// → return <>{content}<DailyChallenge /></>

// DailyChallenge는 디자인 컴포넌트 아래 공통 영역에 렌더
// 4개 디자인 컴포넌트 수정 불필요
```

---

## 8. Phase 7: 정렬 알고리즘 시각화

### 8.1 알고리즘 사전 계산

```typescript
type Algorithm = "bubble" | "quick" | "merge";

interface Snapshot {
  array: number[];
  comparing: number[];   // 비교 중 인덱스
  swapping: number[];    // 교환 중 인덱스
  sorted: number[];      // 정렬 완료 인덱스
}

function computeBubbleSort(arr: number[]): Snapshot[];
function computeQuickSort(arr: number[]): Snapshot[];
function computeMergeSort(arr: number[]): Snapshot[];
```

### 8.2 애니메이션 재생

```typescript
// steps: Snapshot[] (사전 계산 완료)
// stepIndex: 현재 재생 위치
// setInterval로 stepIndex 증가 → 배열 렌더링
// 컨트롤: Play/Pause/Step/Reset/Speed
```

### 8.3 바 색상 규칙

| 상태 | 색상 |
|------|------|
| 기본 | bg-blue-500 |
| 비교 중 | bg-yellow-400 |
| 교환 중 | bg-red-400 |
| 정렬 완료 | bg-emerald-400 |

---

## 9. Phase 8: 퍼스널리티 퀴즈

### 9.1 상태 머신

```
idle ──[시작]──▶ quiz(15문항) ──[완료]──▶ result
                     │
                     └── 각 문항 → 선택지 클릭 → 가중치 누적 → 다음 문항
```

### 9.2 State 정의

```typescript
type Phase = "idle" | "quiz" | "result";
type PersonalityType = "explorer" | "creator" | "analyst" | "connector";

interface Question {
  text: string;
  options: { text: string; weights: Record<PersonalityType, number> }[];
}
```

### 9.3 4가지 성격 유형

| 유형 | key | 이모지 | 칭호 | 특성 |
|------|-----|--------|------|------|
| 탐험가 | explorer | 🧭 | 호기심 가득한 탐험가 | 모험심, 적응력, 창의성, 독립심 |
| 창작자 | creator | 🎨 | 영감 넘치는 창작자 | 상상력, 표현력, 감수성, 직관력 |
| 분석가 | analyst | 🔬 | 냉철한 분석가 | 논리력, 집중력, 정확성, 전략적사고 |
| 연결자 | connector | 🤝 | 따뜻한 연결자 | 공감력, 소통력, 리더십, 협동심 |

### 9.4 점수 산출

```typescript
// 각 답변의 weights를 PersonalityType별로 누적
// 최고 점수 유형 = 결과 유형
const scores: Record<PersonalityType, number> = { explorer: 0, creator: 0, analyst: 0, connector: 0 };

// 각 선택에서 weights 합산
selectedOption.weights → scores[type] += weight

// 최종 유형 = Object.entries(scores).sort((a,b) => b[1]-a[1])[0]
```

---

## 10. 아이콘 등록 설계

### 10.1 추가 아이콘 (7종)

| 아이콘명 | Phase | 용도 | SVG 패턴 |
|---------|-------|------|---------|
| keyboard | 2 | 타이핑 게임 | 키보드 외곽 + 키캡 3줄 |
| calculator | 4 | 수학 게임 | 계산기 외곽 + 디스플레이 + 버튼 그리드 |
| sparkles | 8 | 퍼스널리티 퀴즈 | 별 3개 (큰+작은2) |
| braces | 3 | JSON Formatter | `{ }` 중괄호 |
| code | 3 | Base64 Tool | `</>` 태그 |
| palette | 3 | Color Palette | 팔레트 + 점 3개 |
| chart-bar | 7 | Sort Visualizer | 막대 차트 3개 |

```typescript
export type UIIconType = /* 기존 12개 */ | "keyboard" | "calculator" | "sparkles"
  | "braces" | "code" | "palette" | "chart-bar";
```

---

## 11. 라우팅 & 등록 설계

### 11.1 게임 등록 (Phase 2, 4, 8)

```typescript
// app/game/[slug]/page.tsx

// Dynamic imports
const TypingGame = dynamic(() => import("@/components/game/typing-game").then((m) => m.TypingGame));
const MathGame = dynamic(() => import("@/components/game/math-game").then((m) => m.MathGame));
const PersonalityQuiz = dynamic(() => import("@/components/game/personality-quiz").then((m) => m.PersonalityQuiz));

// GAME_COMPONENTS에 추가
const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  // ...기존 6개
  typing: TypingGame,
  math: MathGame,
  quiz: PersonalityQuiz,
};
```

### 11.2 도구 등록 (Phase 3, 7)

```typescript
// app/tools/[slug]/page.tsx

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "json-formatter": JsonFormatter,
  base64: Base64Tool,
  "color-palette": ColorPalette,
  "sort-visualizer": SortVisualizer,
};
```

### 11.3 사이트맵 업데이트

```typescript
// app/sitemap.ts
import { TOOLS } from "@/lib/constants";

const toolsPages: MetadataRoute.Sitemap = [
  { url: `${baseUrl}/tools`, priority: 0.7 },
  ...TOOLS.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    priority: 0.5,
  })),
];
```

---

## 12. 스타일 설계

### 12.1 프로젝트 표준 패턴

| 요소 | Tailwind 클래스 |
|------|-----------------|
| 섹션 서브타이틀 | `text-[13px] uppercase tracking-[0.2em] text-text-muted` |
| 페이지 헤딩 | `font-heading text-3xl font-bold tracking-[-0.03em]` |
| 구분선 | `mx-auto h-px max-w-xs bg-border/60` |
| 히스토리 행 | `flex items-center justify-between border-b border-border/60 py-2.5 text-sm` |
| 카드 컨테이너 | `border border-border/60 p-6 transition-colors hover:bg-surface-hover` |
| 버튼 (CTA) | `<Button size="lg">` |
| 전체 컨테이너 | `mx-auto max-w-3xl px-8 py-20` (게임), `max-w-4xl` (도구) |

### 12.2 표준 애니메이션

```typescript
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
```

| 애니메이션 | motion props |
|-----------|-------------|
| 페이드인 | `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` |
| 슬라이드업 | `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` |
| 등급 바운스 | `initial={{ scale: 0 }} animate={{ scale: 1 }}` (spring) |
| 텍스트 전환 | `AnimatePresence mode="wait"` + y축 슬라이드 |

### 12.3 공유 버튼 스타일

```
rounded border border-border/60 px-4 py-2 text-sm text-text-secondary
transition-colors hover:bg-surface-hover
```

delay 0.5s 페이드인으로 결과 화면 렌더 후 등장.

---

## 13. 구현 순서 (Plan 문서 기반)

### Step 1: Phase 1 — 공유 시스템 (P1-01 ~ P1-09)
1. `lib/share.ts` — buildShareText + copyToClipboard
2. `components/game/share-result.tsx` — ShareResult 컴포넌트
3. 기존 6개 게임에 ShareResult 통합

### Step 2: Phase 2 — 타이핑 게임 (P2-01 ~ P2-14)
4. `icons.tsx` — keyboard 아이콘
5. `constants.ts` — GAMES + FOOTER_SECTIONS
6. `game-content.ts` — typing 콘텐츠
7. `components/game/typing-game.tsx` — 게임 구현
8. `[slug]/page.tsx` — dynamic import

### Step 3: Phase 3 — 도구 섹션 (P3-01 ~ P3-10)
9. `icons.tsx` — braces, code, palette 아이콘
10. `constants.ts` — NAV_LINKS, TOOLS, FOOTER_SECTIONS
11. `app/tools/page.tsx` — 허브
12. `app/tools/[slug]/page.tsx` — 개별 라우트
13. 3개 도구 컴포넌트 생성
14. `sitemap.ts` — /tools 추가

### Step 4: Phase 4 — 수학 게임 (P4-01 ~ P4-07)
15. icons + constants + content + page 등록
16. `components/game/math-game.tsx` — 게임 구현

### Step 5: Phase 5 — 연결 강화 (P5-01 ~ P5-04)
17. FOOTER_SECTIONS 확장 (자동 적용됨)

### Step 6: Phase 6 — 데일리 챌린지 (P6-01 ~ P6-05)
18. `lib/daily.ts` — PRNG + 스트릭
19. `components/home/daily-challenge.tsx` — 위젯
20. `components/home/home-page.tsx` — 통합

### Step 7: Phase 7 — 정렬 시각화 (P7-01 ~ P7-06)
21. icons + constants + page 등록
22. `components/tools/sort-visualizer.tsx` — 시각화 구현

### Step 8: Phase 8 — 퍼스널리티 퀴즈 (P8-01 ~ P8-06)
23. icons + constants + content + page 등록
24. `components/game/personality-quiz.tsx` — 퀴즈 구현

---

## 14. FR 매핑 (Plan ↔ Design)

### Phase 1: 공유 시스템

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P1-01 공유 텍스트 유틸 | 2.1 | `lib/share.ts` |
| P1-02 클립보드 유틸 | 2.1 | `lib/share.ts` |
| P1-03 ShareResult 컴포넌트 | 2.2 | `components/game/share-result.tsx` |
| P1-04~09 게임 통합 | 2.3 | 기존 6개 게임 파일 |

### Phase 2: 타이핑 게임

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P2-01 keyboard 아이콘 | 10.1 | `components/ui/icons.tsx` |
| P2-02~03 GAMES/FOOTER 등록 | 11.1 | `lib/constants.ts` |
| P2-04 게임 콘텐츠 | — | `lib/game-content.ts` |
| P2-05 한/영 선택 | 3.2 | `components/game/typing-game.tsx` |
| P2-06 60초 타이머 | 3.1 | `components/game/typing-game.tsx` |
| P2-07 정오답 표시 | 3.4 | `components/game/typing-game.tsx` |
| P2-08 WPM 계산 | 3.4 | `components/game/typing-game.tsx` |
| P2-09 정확도 계산 | 3.4 | `components/game/typing-game.tsx` |
| P2-10 등급 시스템 | 3.3 | `components/game/typing-game.tsx` |
| P2-11 히스토리 | 3.2 | `components/game/typing-game.tsx` |
| P2-12 ShareResult | 2.2 | `components/game/typing-game.tsx` |
| P2-13 라우트 등록 | 11.1 | `app/game/[slug]/page.tsx` |
| P2-14 텍스트 코퍼스 | 3.5 | `components/game/typing-game.tsx` |

### Phase 3: 도구 섹션

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P3-01 NAV_LINKS | 6.2 | `lib/constants.ts` |
| P3-02 FOOTER | 6.1 | `lib/constants.ts` |
| P3-03 TOOLS 배열 | 4.2 | `lib/constants.ts` |
| P3-04 허브 페이지 | 4.3 | `app/tools/page.tsx` |
| P3-05 개별 페이지 | 11.2 | `app/tools/[slug]/page.tsx` |
| P3-06 JSON Formatter | 4.4 | `components/tools/json-formatter.tsx` |
| P3-07 Base64 | 4.5 | `components/tools/base64-tool.tsx` |
| P3-08 Color Palette | 4.6 | `components/tools/color-palette.tsx` |
| P3-09 sitemap | 11.3 | `app/sitemap.ts` |
| P3-10 아이콘 | 10.1 | `components/ui/icons.tsx` |

### Phase 4: 수학 게임

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P4-01 등록 | 10.1, 11.1 | icons, constants, content, page |
| P4-02 난이도 선택 | 5.2 | `components/game/math-game.tsx` |
| P4-03 문제 생성 | 5.3 | `components/game/math-game.tsx` |
| P4-04 60초 타이머 | 5.1 | `components/game/math-game.tsx` |
| P4-05 피드백 | 5.1 | `components/game/math-game.tsx` |
| P4-06 등급 | 5.4 | `components/game/math-game.tsx` |
| P4-07 히스토리+공유 | 2.2 | `components/game/math-game.tsx` |

### Phase 6: 데일리 챌린지

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P6-01 시드 PRNG | 7.1 | `lib/daily.ts` |
| P6-02 getDailyGame | 7.1 | `lib/daily.ts` |
| P6-03 스트릭 관리 | 7.2 | `lib/daily.ts` |
| P6-04 위젯 | 7.3 | `components/home/daily-challenge.tsx` |
| P6-05 통합 | 7.4 | `components/home/home-page.tsx` |

### Phase 7: 정렬 시각화

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P7-01 TOOLS 등록 | 11.2 | `lib/constants.ts`, `app/tools/[slug]/page.tsx` |
| P7-02 3가지 알고리즘 | 8.1 | `components/tools/sort-visualizer.tsx` |
| P7-03 사전 계산 | 8.1 | `components/tools/sort-visualizer.tsx` |
| P7-04 애니메이션 | 8.2 | `components/tools/sort-visualizer.tsx` |
| P7-05 컨트롤 UI | 8.2 | `components/tools/sort-visualizer.tsx` |
| P7-06 상태 색상 | 8.3 | `components/tools/sort-visualizer.tsx` |

### Phase 8: 퍼스널리티 퀴즈

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| P8-01 등록 | 10.1, 11.1 | icons, constants, content, page |
| P8-02 15문항 가중치 | 9.2 | `components/game/personality-quiz.tsx` |
| P8-03 4가지 유형 | 9.3 | `components/game/personality-quiz.tsx` |
| P8-04 결과 화면 | 9.3 | `components/game/personality-quiz.tsx` |
| P8-05 ShareResult | 2.2 | `components/game/personality-quiz.tsx` |
| P8-06 히스토리 | 9.2 | `components/game/personality-quiz.tsx` |

---

## 15. NFR 설계 대응

| NFR | 대응 방법 |
|-----|-----------|
| NFR-01 기존 기능 영향 없음 | 모든 신규 컴포넌트는 dynamic import로 코드 분리. 기존 게임은 ShareResult 추가만 (기존 로직 변경 없음) |
| NFR-02 빌드 성공 | generateStaticParams가 GAMES/TOOLS에서 slug 자동 수집 |
| NFR-03 린트 통과 | 기존 ESLint 설정 준수, "use client" 지시어 |
| NFR-04 외부 라이브러리 없음 | React + framer-motion + Tailwind + next/dynamic만 사용 |
| NFR-05 클라이언트 전용 | 모든 게임/도구 컴포넌트에 "use client" 선언 |
| NFR-06 타이머 cleanup | useEffect return에서 clearInterval/clearTimeout. useRef로 타이머 ID 관리 |
| NFR-07 반응형 | Tailwind responsive prefixes (sm:, md:), max-w-3xl/4xl 컨테이너 |
| NFR-08 다크/라이트 호환 | CSS 변수 기반 디자인 토큰 사용 (text-text-primary, bg-bg-secondary 등) |

---

## 16. 검증 체크리스트

### 기능 검증

- [ ] **Phase 1**: 6개 게임 결과 화면에서 "결과 공유" 버튼 → 클립보드 복사 → "복사됨!" 피드백
- [ ] **Phase 2**: `/game/typing` → 한/영 선택 → 60초 플레이 → WPM + 등급 + 히스토리
- [ ] **Phase 3**: `/tools` 허브 → 4개 도구 그리드 표시, 각 도구 정상 동작
- [ ] **Phase 4**: `/game/math` → 난이도 선택 → 60초 플레이 → 점수 + 등급
- [ ] **Phase 5**: 네비게이션에 "도구" 링크 표시, 푸터에 게임/도구 링크 확장
- [ ] **Phase 6**: 홈페이지 하단에 "오늘의 게임" 위젯 + 스트릭 카운터
- [ ] **Phase 7**: `/tools/sort-visualizer` → 알고리즘 선택 → 배열 생성 → 애니메이션 재생
- [ ] **Phase 8**: `/game/quiz` → 15문항 → 성격 유형 결과 + 공유

### 빌드/품질 검증

- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공 (모든 정적 라우트 생성)
- [ ] 4개 디자인 테마에서 헤더/푸터 링크 정상 표시
- [ ] 모바일 (320px) ~ 데스크톱 (1920px) 반응형
- [ ] 다크/라이트 모드 전환 시 스타일 정상

---

**Created**: 2026-03-05
**Feature**: content-expansion
**Phase**: Design
**Based on**: docs/01-plan/features/content-expansion.plan.md
