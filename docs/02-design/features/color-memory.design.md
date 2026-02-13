# Design: color-memory

> 색상 순서를 기억하고 재현하는 시몬(Simon) 스타일 기억력 테스트 미니게임 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  components/ui/icons.tsx              # UIIconType에 "brain" 추가
  lib/constants.ts                     # GAMES 배열에 color-memory 항목 추가
  app/game/[slug]/page.tsx             # ColorMemoryGame dynamic import 등록
  components/game/color-memory-game.tsx # 게임 컴포넌트 (전체 구현)
```

### 1.2 의존성 관계

```
color-memory-game.tsx
  ├── react (useState, useRef, useCallback, useEffect)
  ├── framer-motion (motion, AnimatePresence)
  └── @/components/ui/button (Button)
```

외부 라이브러리 추가: 없음 (번들 사이즈 0KB 증가)

---

## 2. 상태 설계 (State Machine)

### 2.1 Phase 흐름

```
idle ──[시작]──▶ showing ──[점멸 완료]──▶ input ──[전체 정답]──▶ correct ──[0.8초]──▶ showing (다음 라운드)
                   │                       │
                   │ [그만하기]              │ [오답 클릭]
                   ▼                       ▼
                 result ◀──[1.5초]──── wrong
                   ▲
                   │ [그만하기]
                   │
                 input
```

### 2.2 State 정의

```typescript
type Phase = "idle" | "showing" | "input" | "correct" | "wrong" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface HistoryItem {
  id: number;
  round: number;      // 도달 라운드
  grade: Grade;
  title: string;
}

// Component State
const [phase, setPhase] = useState<Phase>("idle");
const [round, setRound] = useState(1);                    // 현재 라운드 (1~)
const [sequence, setSequence] = useState<number[]>([]);    // 컴퓨터 색상 시퀀스 (0~3)
const [playerInput, setPlayerInput] = useState<number[]>([]); // 플레이어 입력 시퀀스
const [activeIndex, setActiveIndex] = useState<number | null>(null); // 현재 점멸 중인 패드 인덱스
const [history, setHistory] = useState<HistoryItem[]>([]);

// Refs
const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]); // 점멸 타이머 배열
const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const roundRef = useRef(1);
```

---

## 3. 등급 시스템 설계

### 3.1 등급 데이터

```typescript
const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "천재적 기억력", min: 15 },
  { grade: "A", title: "비상한 두뇌", min: 12 },
  { grade: "B", title: "날카로운 집중력", min: 9 },
  { grade: "C", title: "평범한 기억력", min: 6 },
  { grade: "D", title: "조금 더 집중!", min: 3 },
  { grade: "F", title: "금붕어...", min: 0 },
];
```

### 3.2 등급 산출 함수

```typescript
function getGrade(round: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => round >= g.min);
  return info ?? { grade: "F", title: "금붕어..." };
}
```

---

## 4. 핵심 로직 설계

### 4.1 4색 패드 상수

```typescript
const PADS = [
  { name: "red",    hsl: "hsl(0, 70%, 45%)",   activeHsl: "hsl(0, 80%, 60%)"   },
  { name: "green",  hsl: "hsl(120, 70%, 35%)",  activeHsl: "hsl(120, 80%, 50%)" },
  { name: "blue",   hsl: "hsl(220, 70%, 45%)",  activeHsl: "hsl(220, 80%, 60%)" },
  { name: "yellow", hsl: "hsl(50, 70%, 45%)",   activeHsl: "hsl(50, 85%, 60%)"  },
] as const;

const FLASH_DURATION = 500;  // 패드 점멸 지속 시간 (ms)
const FLASH_GAP = 300;       // 패드 간 간격 (ms)
const ROUND_DELAY = 600;     // 라운드 시작 전 대기 (ms)
const CORRECT_DELAY = 800;   // 정답 피드백 표시 (ms)
const WRONG_DELAY = 1500;    // 오답 피드백 → result 전환 (ms)
```

### 4.2 시퀀스 생성

```typescript
function extendSequence(prev: number[]): number[] {
  const next = Math.floor(Math.random() * 4); // 0~3
  return [...prev, next];
}

// 초기 시퀀스 (라운드 1): 2개
function createInitialSequence(): number[] {
  return [
    Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 4),
  ];
}
```

### 4.3 점멸 애니메이션 (showing phase)

```typescript
const playSequence = useCallback((seq: number[]) => {
  setPhase("showing");
  setActiveIndex(null);

  // 기존 타이머 전체 정리
  clearAllTimeouts();

  seq.forEach((padIndex, i) => {
    // 각 패드 점멸 시작
    const onTimeout = setTimeout(() => {
      setActiveIndex(padIndex);
    }, ROUND_DELAY + i * (FLASH_DURATION + FLASH_GAP));

    // 각 패드 점멸 종료
    const offTimeout = setTimeout(() => {
      setActiveIndex(null);
    }, ROUND_DELAY + i * (FLASH_DURATION + FLASH_GAP) + FLASH_DURATION);

    timeoutRefs.current.push(onTimeout, offTimeout);
  });

  // 전체 점멸 완료 → input phase 전환
  const totalTime = ROUND_DELAY + seq.length * (FLASH_DURATION + FLASH_GAP);
  const completeTimeout = setTimeout(() => {
    setPhase("input");
    setPlayerInput([]);
  }, totalTime);

  timeoutRefs.current.push(completeTimeout);
}, []);
```

### 4.4 플레이어 입력 핸들러

```typescript
const handlePadClick = useCallback((padIndex: number) => {
  if (phase !== "input") return;

  const newInput = [...playerInput, padIndex];
  setPlayerInput(newInput);

  // 현재 입력 위치의 정답 확인
  const currentPos = newInput.length - 1;
  if (newInput[currentPos] !== sequence[currentPos]) {
    // 오답 → 게임 오버
    clearAllTimeouts();
    const currentRound = roundRef.current;
    const { grade, title } = getGrade(currentRound - 1);
    setHistory((prev) => [
      { id: prev.length + 1, round: currentRound - 1, grade, title },
      ...prev.slice(0, 9),
    ]);
    setPhase("wrong");

    feedbackTimerRef.current = setTimeout(() => {
      setPhase("result");
    }, WRONG_DELAY);
    return;
  }

  // 시퀀스 전체 입력 완료
  if (newInput.length === sequence.length) {
    setPhase("correct");

    feedbackTimerRef.current = setTimeout(() => {
      const nextRound = roundRef.current + 1;
      setRound(nextRound);
      roundRef.current = nextRound;
      const newSeq = extendSequence(sequence);
      setSequence(newSeq);
      playSequence(newSeq);
    }, CORRECT_DELAY);
  }
}, [phase, playerInput, sequence, playSequence]);
```

### 4.5 강제 종료 핸들러 (FR-13)

```typescript
const handleQuit = useCallback(() => {
  clearAllTimeouts();
  clearFeedbackTimer();

  const currentRound = roundRef.current;
  // 라운드 1에서 그만하기 시 0라운드 클리어로 처리
  const clearedRound = phase === "correct" ? currentRound : currentRound - 1;
  const { grade, title } = getGrade(clearedRound);
  setHistory((prev) => [
    { id: prev.length + 1, round: clearedRound, grade, title },
    ...prev.slice(0, 9),
  ]);
  setPhase("result");
}, [phase]);
```

### 4.6 타이머 정리

```typescript
const clearAllTimeouts = useCallback(() => {
  timeoutRefs.current.forEach(clearTimeout);
  timeoutRefs.current = [];
}, []);

const clearFeedbackTimer = useCallback(() => {
  if (feedbackTimerRef.current) {
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = null;
  }
}, []);

useEffect(() => {
  return () => {
    clearAllTimeouts();
    clearFeedbackTimer();
  };
}, [clearAllTimeouts, clearFeedbackTimer]);
```

### 4.7 게임 시작/리셋

```typescript
const startGame = useCallback(() => {
  clearAllTimeouts();
  clearFeedbackTimer();
  setRound(1);
  roundRef.current = 1;
  setPlayerInput([]);

  const initialSeq = createInitialSequence();
  setSequence(initialSeq);
  playSequence(initialSeq);
}, [clearAllTimeouts, clearFeedbackTimer, playSequence]);
```

---

## 5. UI 와이어프레임

### 5.1 idle 상태

```
┌──────────────────────────────────────────────────────┐
│  ← Back                                              │
│                                                      │
│              Game                                     │
│              brain icon                               │
│              Color Memory                             │
│              색상 순서를 기억하고 따라해보세요!              │
│              ──────────────                           │
│                                                      │
│              [AdBanner]                               │
│                                                      │
│         색상 패드가 점멸하는 순서를 기억하고                │
│         같은 순서로 클릭하세요!                           │
│         라운드가 올라갈수록 패턴이 길어집니다.              │
│                                                      │
│         ┌────────┬────────┐                           │
│         │  🔴    │  🟢    │  ← 비활성 (어둡게)         │
│         ├────────┼────────┤                           │
│         │  🔵    │  🟡    │                           │
│         └────────┴────────┘                           │
│                                                      │
│              [ 시작하기 ]                               │
│                                                      │
│              [AdBanner]                               │
└──────────────────────────────────────────────────────┘
```

### 5.2 showing 상태 (점멸 중)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Round 3          패턴 길이: 4                  │
│                                                      │
│         ┌────────┬────────┐                           │
│         │  🔴    │ 🟢💡  │  ← 현재 점멸 중 (밝게)     │
│         ├────────┼────────┤                           │
│         │  🔵    │  🟡    │                           │
│         └────────┴────────┘                           │
│                                                      │
│         패턴을 기억하세요... (3/4)                      │
│                                                      │
│              [ 그만하기 ]                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.3 input 상태 (입력 대기)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Round 3          패턴 길이: 4                  │
│                                                      │
│         ┌────────┬────────┐                           │
│         │  🔴    │  🟢    │  ← 활성 (클릭 가능)       │
│         ├────────┼────────┤                           │
│         │  🔵    │  🟡    │                           │
│         └────────┴────────┘                           │
│                                                      │
│         입력 진행: ●●○○ (2/4)                         │
│                                                      │
│              [ 그만하기 ]                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.4 correct 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              정답!                                    │
│              (0.8초 후 자동 다음 라운드)                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.5 wrong 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              틀렸습니다!                               │
│                                                      │
│         정답 패턴:                                     │
│         🔴 → 🟢 → 🔵 → 🟡                            │
│         당신의 입력:                                    │
│         🔴 → 🟢 → 🟡 ✗                               │
│                                                      │
│              (1.5초 후 결과 화면)                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.6 result 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              등급 (S/A/B/C/D/F)                        │
│              (대형, scale bounce)                      │
│                                                      │
│              "비상한 두뇌"                              │
│              칭호 텍스트                                │
│                                                      │
│              12라운드 도달                              │
│              (시퀀스 최대 길이: 13)                      │
│                                                      │
│              [ 다시 도전 ]                              │
│                                                      │
│  History                                              │
│  #3  A  비상한 두뇌           12R                      │
│  #2  B  날카로운 집중력         9R                      │
│  #1  D  조금 더 집중!          4R                      │
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
| 패드 점멸 (showing) | setTimeout 체인 | 배경색 hsl→activeHsl + scale 1.05 | 500ms |
| 패드 클릭 피드백 (input) | 플레이어 클릭 | 배경색 activeHsl (150ms) + scale 0.95→1 | 150ms |
| 정답 피드백 | correct 진입 | scale 0.5→1, opacity 0→1 | 0.3s |
| 오답 피드백 | wrong 진입 | shake + fade-in | 0.4s |
| result 등급 | result 진입 | scale 0→1 (bounce) | 0.6s |
| result 칭호 | result 진입 | opacity 0→1, y 10→0 (0.2s delay) | 0.4s |
| result 라운드 | result 진입 | opacity 0→1 (0.3s delay) | 0.4s |
| 입력 진행 dots | input 중 | scale 0→1 (stagger 0.05s) | 0.2s |
| 그만하기 버튼 | showing/input | opacity fade-in | 0.3s |

### 6.3 패드 점멸 시각 처리

```tsx
// 각 패드의 배경색 결정
function getPadColor(padIndex: number, isActive: boolean): string {
  const pad = PADS[padIndex];
  return isActive ? pad.activeHsl : pad.hsl;
}

// 패드 컴포넌트
<motion.button
  onClick={() => handlePadClick(padIndex)}
  disabled={phase !== "input"}
  className="aspect-square rounded-2xl cursor-pointer disabled:cursor-default"
  style={{
    backgroundColor: getPadColor(padIndex, activeIndex === padIndex),
  }}
  animate={{
    scale: activeIndex === padIndex ? 1.05 : 1,
  }}
  transition={{ duration: 0.15 }}
  whileTap={phase === "input" ? { scale: 0.95 } : undefined}
/>
```

---

## 7. 패드 그리드 설계

### 7.1 그리드 레이아웃

```tsx
<div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs mx-auto">
  {PADS.map((pad, i) => (
    <motion.button
      key={pad.name}
      onClick={() => handlePadClick(i)}
      disabled={phase !== "input"}
      className="aspect-square rounded-2xl cursor-pointer disabled:cursor-default transition-colors"
      style={{
        backgroundColor: getPadColor(i, activeIndex === i),
      }}
      animate={{
        scale: activeIndex === i ? 1.05 : 1,
      }}
      transition={{ duration: 0.15 }}
      whileTap={phase === "input" ? { scale: 0.95 } : undefined}
      aria-label={`${pad.name} 패드`}
    />
  ))}
</div>
```

### 7.2 패드 크기 (반응형)

| 요소 | 모바일 | 데스크톱 |
|:----:|:------:|:-------:|
| 그리드 gap | gap-3 (12px) | gap-4 (16px) |
| 컨테이너 | max-w-xs (320px) | max-w-xs (320px) |
| 패드 모서리 | rounded-2xl | rounded-2xl |
| 최소 터치 영역 | 140x140px | 148x148px |

### 7.3 입력 진행률 표시

```tsx
// 시퀀스 길이만큼 dot 표시, 입력 완료분은 채운 dot
<div className="flex justify-center gap-1.5 mt-4">
  {sequence.map((_, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: i * 0.05, duration: 0.2 }}
      className={`w-2.5 h-2.5 rounded-full ${
        i < playerInput.length
          ? "bg-text-primary"
          : "bg-border/40"
      }`}
    />
  ))}
</div>
```

---

## 8. 라우팅 & 등록 설계

### 8.1 아이콘 등록 (`components/ui/icons.tsx`)

```typescript
// UIIconType에 "brain" 추가
export type UIIconType = "camera" | "video" | "capture" | "search" | "robot" | "warning" | "dice" | "clover" | "paw" | "bolt" | "eye" | "brain";

// icons Record에 brain SVG 추가
brain: (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="두뇌">
    <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4-.2.6-.3 1.2-.3 1.8a4 4 0 0 0 4 4h.5a4 4 0 0 0 3.8-3h0a4 4 0 0 0 3.8 3h.5a4 4 0 0 0 4-4c0-.6-.1-1.2-.3-1.8a4 4 0 0 0 2-3.4 4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
    <path d="M12 2v20" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
  </svg>
),
```

### 8.2 GAMES 배열 등록 (`lib/constants.ts`)

```typescript
{
  slug: "color-memory",
  title: "Color Memory",
  description: "색상 순서를 기억하고 따라해보세요! 당신의 기억력은?",
  icon: "brain",
}
```

### 8.3 Dynamic Import 등록 (`app/game/[slug]/page.tsx`)

```typescript
const ColorMemoryGame = dynamic(() =>
  import("@/components/game/color-memory-game").then((m) => m.ColorMemoryGame),
);

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
  reaction: ReactionGame,
  "color-sense": ColorSenseGame,
  "color-memory": ColorMemoryGame,
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
| 패드 그리드 | `grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs mx-auto` |
| 패드 | `aspect-square rounded-2xl cursor-pointer` |
| 입력 진행 dot (완료) | `w-2.5 h-2.5 rounded-full bg-text-primary` |
| 입력 진행 dot (미완) | `w-2.5 h-2.5 rounded-full bg-border/40` |
| 정답 피드백 | `text-3xl sm:text-4xl font-bold text-emerald-400` |
| 오답 피드백 | `text-3xl sm:text-4xl font-bold text-red-400` |
| 등급 (대형) | `text-7xl sm:text-9xl font-bold font-heading` |
| 칭호 텍스트 | `text-xl sm:text-2xl text-text-secondary` |
| 라운드 헤더 | `flex items-center justify-between text-sm text-text-muted` |
| 그만하기 버튼 | `text-sm text-text-muted underline hover:text-text-secondary` |
| 안내 텍스트 (showing) | `text-sm text-text-muted animate-pulse` |

---

## 9.3 구현 시 주의사항 (Known Issues)

> **[BUG-001] flex items-center 내부 grid 요소 축소 버그**
>
> - **증상**: 4색 패드 그리드가 화면에 보이지 않음 (버튼 크기 0x0px)
> - **원인**: 부모 컨테이너가 `flex flex-col items-center`일 때, 자식 grid에 `w-full`이 없으면 콘텐츠 없는 버튼들의 너비가 0으로 축소됨. `max-w-xs`는 최대값만 제한하고 최소값을 보장하지 않음.
> - **해결**: grid 컨테이너에 반드시 `w-full` 포함 → `grid w-full max-w-xs grid-cols-2`
> - **적용 범위**: idle 상태 그리드, playing 상태 그리드 모두 동일하게 적용
> - **일반 규칙**: `flex items-center` 부모 안에서 `max-w-*`로 너비를 제한하는 자식 요소에는 항상 `w-full`을 함께 사용할 것
>
> ```tsx
> // BAD - 콘텐츠 없는 자식이면 너비 0으로 축소
> <div className="flex flex-col items-center">
>   <div className="grid max-w-xs grid-cols-2">
>
> // GOOD - w-full이 부모 너비를 채운 뒤 max-w-xs가 제한
> <div className="flex flex-col items-center">
>   <div className="grid w-full max-w-xs grid-cols-2">
> ```

---

## 10. 구현 순서 (Plan 문서 기반)

### Step 1: 등록 (FR-01, FR-02, FR-03)
1. `components/ui/icons.tsx` - UIIconType에 `brain` 추가 + SVG 구현
2. `lib/constants.ts` - GAMES 배열에 color-memory 게임 추가
3. `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Step 2: 핵심 게임 로직 (FR-04, FR-05, FR-06, FR-07, FR-12)
4. `components/game/color-memory-game.tsx` 생성
   - Phase type, PADS 상수, GRADES 정의
   - createInitialSequence, extendSequence 함수
   - playSequence 함수 (setTimeout 체인 점멸)
   - handlePadClick 함수 (입력 검증)
   - phase === "showing" 일 때 입력 차단 (disabled)

### Step 3: 결과 및 UX (FR-08, FR-09, FR-10, FR-11, FR-13)
5. 오답 시 게임 오버 + wrong → result 전환
6. 등급/칭호 시스템 (getGrade 함수)
7. result 화면 (등급 + 칭호 + 도달 라운드 + 히스토리)
8. 히스토리 기능 (최근 10건 FIFO)
9. "그만하기" 버튼 (showing/input에서 즉시 result 이동)

### Step 4: 검증
10. `pnpm lint` 실행
11. `pnpm build` 실행 - `/game/color-memory` 페이지 생성 확인

---

## 11. FR 매핑 (Plan <-> Design)

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| FR-01 GAMES 배열 등록 | 8.2 | `lib/constants.ts` |
| FR-02 brain 아이콘 추가 | 8.1 | `components/ui/icons.tsx` |
| FR-03 Dynamic import 등록 | 8.3 | `app/game/[slug]/page.tsx` |
| FR-04 4색 패드 그리드 | 4.1, 7 | `components/game/color-memory-game.tsx` |
| FR-05 점멸 애니메이션 | 4.3, 6 | `components/game/color-memory-game.tsx` |
| FR-06 입력 및 순서 검증 | 4.4 | `components/game/color-memory-game.tsx` |
| FR-07 라운드별 패턴 증가 | 4.2 | `components/game/color-memory-game.tsx` |
| FR-08 게임 오버 처리 | 4.4, 5.5 | `components/game/color-memory-game.tsx` |
| FR-09 등급/칭호 시스템 | 3 | `components/game/color-memory-game.tsx` |
| FR-10 결과 화면 | 5.6 | `components/game/color-memory-game.tsx` |
| FR-11 히스토리 | 2.2, 5.6 | `components/game/color-memory-game.tsx` |
| FR-12 점멸 중 입력 차단 | 4.3, 7.1 | `components/game/color-memory-game.tsx` |
| FR-13 게임 중 강제 종료 | 4.5, 5.2, 5.3 | `components/game/color-memory-game.tsx` |

---

## 12. NFR 설계 대응

| NFR | 대응 방법 |
|-----|-----------|
| NFR-01 기존 게임 영향 없음 | dynamic import로 코드 분리, GAME_COMPONENTS에 키 추가만 |
| NFR-02 빌드 성공 | generateStaticParams가 GAMES에서 slug 자동 수집 |
| NFR-03 린트 통과 | 기존 ESLint 설정 준수, "use client" 지시어 |
| NFR-04 외부 라이브러리 없음 | React + framer-motion + Tailwind만 사용 |
| NFR-05 단일 파일 ~400줄 | 인라인 구성, 별도 파일 불필요 |
| NFR-06 setTimeout cleanup | clearAllTimeouts + clearFeedbackTimer + useEffect cleanup |

---

**Created**: 2026-02-13
**Feature**: color-memory
**Phase**: Design
**Based on**: docs/01-plan/features/color-memory.plan.md
