# Design: color-sense

> N개의 동일 색상 타일 중 미묘하게 다른 1개를 찾아 클릭하는 색감 테스트 미니게임 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  components/ui/icons.tsx              # UIIconType에 "eye" 추가
  lib/constants.ts                     # GAMES 배열에 color-sense 항목 추가
  app/game/[slug]/page.tsx             # ColorSenseGame dynamic import 등록
  components/game/color-sense-game.tsx # 게임 컴포넌트 (전체 구현)
```

### 1.2 의존성 관계

```
color-sense-game.tsx
  ├── react (useState, useRef, useCallback, useEffect)
  ├── framer-motion (motion, AnimatePresence)
  └── @/components/ui/button (Button)
```

외부 라이브러리 추가: 없음 (번들 사이즈 0KB 증가)

---

## 2. 상태 설계 (State Machine)

### 2.1 Phase 흐름

```
idle ──[시작]──▶ playing ──[정답 클릭]──▶ correct ──[0.8초]──▶ playing (다음 라운드)
                   │                                              │
                   │ [틀린 타일]          [시간 초과]              │ [10라운드 완료]
                   ▼                        ▼                     ▼
                 wrong                   timeout                result
                   │                        │
                   └────── 게임 오버 ─────────┘
```

### 2.2 State 정의

```typescript
type Phase = "idle" | "playing" | "correct" | "wrong" | "timeout" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface RoundResult {
  round: number;     // 1~10
  score: number;     // 0~100
  timeLeft: number;  // 남은 시간 (ms)
}

interface HistoryItem {
  id: number;
  totalScore: number;
  grade: Grade;
  title: string;
  rounds: number;    // 클리어한 라운드 수
}

// Component State
const [phase, setPhase] = useState<Phase>("idle");
const [round, setRound] = useState(1);              // 현재 라운드 (1~10)
const [score, setScore] = useState(0);               // 누적 점수
const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
const [timeLeft, setTimeLeft] = useState(TIME_LIMIT); // 남은 시간 (ms)
const [colors, setColors] = useState<{ baseColor: string; diffColor: string; diffIndex: number; gridSize: number }>({ baseColor: "", diffColor: "", diffIndex: 0, gridSize: 2 });
const [history, setHistory] = useState<HistoryItem[]>([]);

// Refs
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const startTimeRef = useRef(0);                      // 라운드 시작 타임스탬프
```

---

## 3. 등급 시스템 설계

### 3.1 등급 데이터

```typescript
const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 10000; // 10초 (ms)

const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "테트라크로맷", min: 900 },
  { grade: "A", title: "예술가의 눈", min: 700 },
  { grade: "B", title: "날카로운 감각", min: 500 },
  { grade: "C", title: "평범한 시력", min: 300 },
  { grade: "D", title: "조금 더 집중!", min: 100 },
  { grade: "F", title: "색맹 의심...", min: 0 },
];
```

### 3.2 등급 산출 함수

```typescript
function getGrade(totalScore: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => totalScore >= g.min);
  return info ?? { grade: "F", title: "색맹 의심..." };
}
```

---

## 4. 핵심 로직 설계

### 4.1 색상 생성 함수

```typescript
function generateColors(round: number) {
  // 기본 색상: 랜덤 HSL
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60~80%
  const lightness = 50 + Math.floor(Math.random() * 10);  // 50~60%

  // 라운드별 hue 차이
  let hueDiff: number;
  if (round <= 3) {
    hueDiff = 30 - (round - 1) * 5;   // 30, 25, 20
  } else if (round <= 6) {
    hueDiff = 15 - (round - 4) * 2.5; // 15, 12.5, 10
  } else {
    hueDiff = 8 - (round - 7) * 1.5;  // 8, 6.5, 5, 3.5 → 최소 3
    hueDiff = Math.max(hueDiff, 3);
  }

  // +/- 방향 랜덤
  const direction = Math.random() > 0.5 ? 1 : -1;
  const diffHue = (hue + hueDiff * direction + 360) % 360;

  // 그리드 크기
  let gridSize: number;
  if (round <= 3) gridSize = 2;
  else if (round <= 6) gridSize = 3;
  else gridSize = 4;

  // 정답 타일 인덱스 (랜덤)
  const totalTiles = gridSize * gridSize;
  const diffIndex = Math.floor(Math.random() * totalTiles);

  const baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const diffColor = `hsl(${diffHue}, ${saturation}%, ${lightness}%)`;

  return { baseColor, diffColor, diffIndex, gridSize };
}
```

### 4.2 라운드 시작

```typescript
const startRound = useCallback((currentRound: number) => {
  const newColors = generateColors(currentRound);
  setColors(newColors);
  setTimeLeft(TIME_LIMIT);
  setPhase("playing");
  startTimeRef.current = performance.now();

  // 타이머 시작 (100ms 간격)
  timerRef.current = setInterval(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, TIME_LIMIT - elapsed);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      clearTimer();
      setPhase("timeout");
    }
  }, 100);
}, []);
```

### 4.3 타일 클릭 핸들러

```typescript
const handleTileClick = useCallback((index: number) => {
  if (phase !== "playing") return;

  clearTimer();

  if (index === colors.diffIndex) {
    // 정답
    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, TIME_LIMIT - elapsed);
    const roundScore = Math.round((remaining / TIME_LIMIT) * 100);

    const newScore = score + roundScore;
    setScore(newScore);
    setRoundResults((prev) => [...prev, { round, score: roundScore, timeLeft: remaining }]);
    setPhase("correct");

    // 0.8초 후 다음 라운드 또는 결과
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        // 10라운드 완료 → 결과
        const { grade, title } = getGrade(newScore);
        setHistory((prev) => [
          { id: prev.length + 1, totalScore: newScore, grade, title, rounds: round },
          ...prev.slice(0, 9),
        ]);
        setPhase("result");
      } else {
        // 다음 라운드
        const nextRound = round + 1;
        setRound(nextRound);
        startRound(nextRound);
      }
    }, 800);
  } else {
    // 오답 → 게임 오버
    setPhase("wrong");
    const { grade, title } = getGrade(score);
    setHistory((prev) => [
      { id: prev.length + 1, totalScore: score, grade, title, rounds: round - 1 },
      ...prev.slice(0, 9),
    ]);
  }
}, [phase, colors, score, round, startRound]);
```

### 4.4 타이머 정리

```typescript
const clearTimer = useCallback(() => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}, []);

useEffect(() => {
  return () => clearTimer();
}, [clearTimer]);
```

### 4.5 게임 시작/리셋

```typescript
const startGame = useCallback(() => {
  clearTimer();
  setRound(1);
  setScore(0);
  setRoundResults([]);
  startRound(1);
}, [clearTimer, startRound]);
```

---

## 5. UI 와이어프레임

### 5.1 idle 상태

```
┌──────────────────────────────────────────────────────┐
│  ← Back                                              │
│                                                      │
│              Game                                     │
│              eye icon                                 │
│              Color Sense Test                         │
│              남들과 다른 색을 찾아보세요!                   │
│              당신의 색감 능력은?                           │
│              ──────────────                           │
│                                                      │
│              [AdBanner]                               │
│                                                      │
│         여러 타일 중 다른 색을 찾아 클릭하세요!             │
│         라운드가 올라갈수록 색 차이가 줄어듭니다.            │
│         10라운드를 모두 통과해보세요!                      │
│                                                      │
│              [ 시작하기 ]                               │
│                                                      │
│              [AdBanner]                               │
└──────────────────────────────────────────────────────┘
```

### 5.2 playing 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Round 4 / 10          Score: 287              │
│                                                      │
│         ┌─────────────────────────────────┐           │
│         │  타이머 바 (남은 시간 비율)         │           │
│         └─────────────────────────────────┘           │
│                                                      │
│         ┌──────┬──────┬──────┐                       │
│         │      │      │ DIFF │                       │
│         │ BASE │ BASE │      │                       │
│         ├──────┼──────┼──────┤                       │
│         │      │      │      │                       │
│         │ BASE │ BASE │ BASE │                       │
│         ├──────┼──────┼──────┤                       │
│         │      │      │      │                       │
│         │ BASE │ BASE │ BASE │                       │
│         └──────┴──────┴──────┘                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.3 correct 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              정답!                                    │
│              +78점                                    │
│              (0.8초 후 자동 다음 라운드)                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.4 wrong / timeout 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              틀렸습니다! / 시간 초과!                     │
│              총 점수: 287점                             │
│              등급: B - 날카로운 감각                      │
│                                                      │
│              [ 다시 도전 ]                               │
│                                                      │
│  History                                              │
│  #2  A  예술가의 눈    752점  10R                       │
│  #1  C  평범한 시력    420점   6R                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.5 result 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              등급 (S/A/B/C/D/F)                        │
│              (대형, scale bounce)                      │
│                                                      │
│              "예술가의 눈"                               │
│              칭호 텍스트                                │
│                                                      │
│              총점: 752점                               │
│                                                      │
│         ┌──────────────────────────────────────┐      │
│         │ R1: 95  R2: 88  R3: 82  R4: 78       │      │
│         │ R5: 71  R6: 65  R7: 60  R8: 55       │      │
│         │ R9: 48  R10: 40                       │      │
│         └──────────────────────────────────────┘      │
│                                                      │
│              [ 다시 도전 ]                              │
│                                                      │
│  History                                              │
│  #2  A  예술가의 눈    752점  10R                       │
│  #1  C  평범한 시력    420점   6R                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 6. 애니메이션 설계

### 6.1 프로젝트 표준 easing

```typescript
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
```

### 6.2 Phase별 애니메이션

| 요소 | 트리거 | 동작 | duration |
|------|--------|------|----------|
| 타일 그리드 등장 | playing 진입 | stagger fade-in + scale | 0.3s (stagger 0.03s) |
| 타이머 바 | playing 진입 | width 100%→0% (linear) | 10s |
| 정답 피드백 | correct 진입 | scale 0→1, opacity 0→1 | 0.3s |
| 오답/시간초과 | wrong/timeout | shake + fade-in | 0.4s |
| result 등급 | result 진입 | scale 0→1 (bounce) | 0.6s |
| result 칭호 | result 진입 | opacity 0→1, y 10→0 (0.2s delay) | 0.4s |
| result 점수 | result 진입 | opacity 0→1 (0.3s delay) | 0.4s |
| result 라운드별 | result 진입 | opacity 0→1 (stagger 0.05s) | 0.3s |

### 6.3 타이머 바 설계

```tsx
<div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
  <motion.div
    className="h-full rounded-full"
    initial={{ width: "100%" }}
    style={{
      width: `${(timeLeft / TIME_LIMIT) * 100}%`,
      backgroundColor: timeLeft > 5000 ? "#22c55e" : timeLeft > 2000 ? "#eab308" : "#ef4444",
    }}
  />
</div>
```

---

## 7. 타일 그리드 설계

### 7.1 그리드 레이아웃

```tsx
<div
  className="grid gap-2 sm:gap-3"
  style={{ gridTemplateColumns: `repeat(${colors.gridSize}, 1fr)` }}
>
  {Array.from({ length: colors.gridSize * colors.gridSize }).map((_, i) => (
    <motion.button
      key={i}
      onClick={() => handleTileClick(i)}
      className="aspect-square rounded-lg cursor-pointer"
      style={{
        backgroundColor: i === colors.diffIndex ? colors.diffColor : colors.baseColor,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: i * 0.03, duration: 0.3, ease: EASING }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    />
  ))}
</div>
```

### 7.2 타일 크기 (반응형)

| 그리드 | 모바일 (gap-2) | 데스크톱 (gap-3) |
|:------:|:--------------:|:----------------:|
| 2x2 | 큰 타일 | 큰 타일 |
| 3x3 | 중간 타일 | 중간 타일 |
| 4x4 | 작은 타일 | 중간 타일 |

컨테이너 최대 너비: `max-w-sm` (384px)로 제한하여 타일이 너무 넓어지지 않도록 함.

---

## 8. 라우팅 & 등록 설계

### 8.1 아이콘 등록 (`components/ui/icons.tsx`)

```typescript
// UIIconType에 "eye" 추가
export type UIIconType = "camera" | "video" | "capture" | "search" | "robot" | "warning" | "dice" | "clover" | "paw" | "bolt" | "eye";

// icons Record에 eye SVG 추가
eye: (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="눈">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
),
```

### 8.2 GAMES 배열 등록 (`lib/constants.ts`)

```typescript
{
  slug: "color-sense",
  title: "Color Sense Test",
  description: "남들과 다른 색을 찾아보세요! 당신의 색감 능력은?",
  icon: "eye",
}
```

### 8.3 Dynamic Import 등록 (`app/game/[slug]/page.tsx`)

```typescript
const ColorSenseGame = dynamic(() =>
  import("@/components/game/color-sense-game").then((m) => m.ColorSenseGame),
);

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
  reaction: ReactionGame,
  "color-sense": ColorSenseGame,
};
```

---

## 9. 스타일 설계

### 9.1 프로젝트 기존 패턴 준수

| 요소 | Tailwind 클래스 | 참고 |
|------|-----------------|------|
| 섹션 제목 | `text-[13px] uppercase tracking-[0.2em] text-text-muted` | 기존 게임 동일 |
| 구분선 | `h-px bg-border/60` | page 레이아웃 |
| 히스토리 행 | `flex items-center justify-between border-b border-border/60 py-2.5 text-sm` | 기존 게임 동일 |
| 버튼 | `<Button size="lg">` | 기존 게임 동일 |
| 컨테이너 | `flex flex-col items-center` | 기존 게임 동일 |

### 9.2 게임 고유 스타일

| 요소 | 스타일 |
|------|--------|
| 타이머 바 | `h-2 w-full rounded-full overflow-hidden` |
| 타이머 바 색상 | 초록(>5초) → 노랑(>2초) → 빨강(<2초) |
| 타일 그리드 | `grid gap-2 sm:gap-3 max-w-sm mx-auto` |
| 타일 | `aspect-square rounded-lg cursor-pointer` |
| 정답 피드백 | `text-3xl sm:text-4xl font-bold text-emerald-400` |
| 오답/시간초과 | `text-3xl sm:text-4xl font-bold text-red-400` |
| 등급 (대형) | `text-7xl sm:text-9xl font-bold font-heading` |
| 칭호 텍스트 | `text-xl sm:text-2xl text-text-secondary` |
| 라운드/점수 헤더 | `flex items-center justify-between text-sm text-text-muted` |

---

## 10. 구현 순서 (Plan 문서 기반)

### Step 1: 등록 (FR-01, FR-02, FR-03)
1. `components/ui/icons.tsx` - UIIconType에 `eye` 추가 + SVG 구현
2. `lib/constants.ts` - GAMES 배열에 color-sense 게임 추가
3. `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Step 2: 핵심 게임 로직 (FR-04, FR-05, FR-06)
4. `components/game/color-sense-game.tsx` 생성
   - Phase type 정의
   - 상수(GRADES, TIME_LIMIT, TOTAL_ROUNDS) 정의
   - generateColors 함수 구현
   - startRound, handleTileClick, startGame 로직
   - clearTimer 헬퍼

### Step 3: 타이머 및 점수 (FR-07, FR-08)
5. setInterval 기반 타이머 바 구현
6. 남은 시간 기반 점수 산출

### Step 4: 결과 및 UX (FR-09, FR-10, FR-11, FR-12)
7. 10라운드 클리어 결과 화면
8. 등급/칭호 시스템 (getGrade 함수)
9. 실패 조건 처리 (오답/시간초과)
10. 히스토리 기능

### Step 5: 검증
11. `pnpm lint` 실행
12. `pnpm build` 실행 - `/game/color-sense` 페이지 생성 확인

---

## 11. FR 매핑 (Plan <-> Design)

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| FR-01 GAMES 배열 등록 | 8.2 | `lib/constants.ts` |
| FR-02 eye 아이콘 추가 | 8.1 | `components/ui/icons.tsx` |
| FR-03 Dynamic import 등록 | 8.3 | `app/game/[slug]/page.tsx` |
| FR-04 타일 그리드 및 정답 판별 | 4.3, 7 | `components/game/color-sense-game.tsx` |
| FR-05 라운드별 난이도 상승 | 4.1 | `components/game/color-sense-game.tsx` |
| FR-06 HSL 색상 생성 | 4.1 | `components/game/color-sense-game.tsx` |
| FR-07 10초 타이머 | 4.2, 6.3 | `components/game/color-sense-game.tsx` |
| FR-08 남은 시간 기반 점수 | 4.3 | `components/game/color-sense-game.tsx` |
| FR-09 등급/칭호 시스템 | 3 | `components/game/color-sense-game.tsx` |
| FR-10 10라운드 클리어 결과 | 5.5 | `components/game/color-sense-game.tsx` |
| FR-11 실패 조건 처리 | 4.3, 5.4 | `components/game/color-sense-game.tsx` |
| FR-12 히스토리 | 2.2, 5.5 | `components/game/color-sense-game.tsx` |

---

## 12. NFR 설계 대응

| NFR | 대응 방법 |
|-----|-----------|
| NFR-01 기존 게임 영향 없음 | dynamic import로 코드 분리, GAME_COMPONENTS에 키 추가만 |
| NFR-02 빌드 성공 | generateStaticParams가 GAMES에서 slug 자동 수집 |
| NFR-03 린트 통과 | 기존 ESLint 설정 준수, "use client" 지시어 |
| NFR-04 외부 라이브러리 없음 | React + framer-motion + Tailwind만 사용 |
| NFR-05 단일 파일 ~300줄 | 인라인 구성, 별도 파일 불필요 |
| NFR-06 setInterval cleanup | clearTimer 헬퍼 + useEffect cleanup |

---

**Created**: 2026-02-11
**Feature**: color-sense
**Phase**: Design
**Based on**: docs/01-plan/features/color-sense.plan.md
