# Design: reaction-test

> 화면 색상 변화에 반응하여 반응속도(ms)를 측정하는 스킬 기반 미니게임 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  components/ui/icons.tsx              # UIIconType에 "bolt" 추가
  lib/constants.ts                     # GAMES 배열에 reaction 항목 추가
  app/game/[slug]/page.tsx             # ReactionGame dynamic import 등록
  components/game/reaction-game.tsx    # 게임 컴포넌트 (전체 구현)
```

### 1.2 의존성 관계

```
reaction-game.tsx
  ├── react (useState, useRef, useCallback, useEffect)
  ├── framer-motion (motion, AnimatePresence)
  └── @/components/ui/button (Button)
```

외부 라이브러리 추가: 없음 (번들 사이즈 0KB 증가)

---

## 2. 상태 설계 (State Machine)

### 2.1 Phase 흐름

```
idle ──[시작]──▶ waiting ──[랜덤 2~5초]──▶ go ──[클릭]──▶ roundResult ──[다음]──▶ waiting
                   │                                           │
                   │ [너무 빨리 클릭]                             │ [5회 완료]
                   ▼                                           ▼
                tooEarly ──[1.5초 후]──▶ waiting              result ──[다시 도전]──▶ waiting
```

### 2.2 State 정의

```typescript
type Phase = "idle" | "waiting" | "go" | "tooEarly" | "roundResult" | "result";

interface RoundResult {
  round: number;     // 1~5
  time: number;      // ms (정수)
}

interface GameResult {
  rounds: RoundResult[];
  average: number;   // 평균 ms
  best: number;      // 최소 ms
  worst: number;     // 최대 ms
  grade: Grade;
  title: string;     // 칭호
}

type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface HistoryItem {
  id: number;
  average: number;
  grade: Grade;
  title: string;
}

// Component State
const [phase, setPhase] = useState<Phase>("idle");
const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUNDS); // 사용자 설정 라운드 수
const [roundInput, setRoundInput] = useState(String(DEFAULT_ROUNDS)); // 입력 필드 값
const [round, setRound] = useState(0);             // 현재 라운드 (0~totalRounds)
const [rounds, setRounds] = useState<RoundResult[]>([]);
const [currentTime, setCurrentTime] = useState(0);  // 이번 라운드 ms
const [history, setHistory] = useState<HistoryItem[]>([]);

// Refs
const startTimeRef = useRef(0);          // performance.now() 시작 타임스탬프
const timeoutRef = useRef<NodeJS.Timeout | null>(null);  // setTimeout ID
const roundRef = useRef(0);              // phase 콜백 내 최신 라운드 참조
```

---

## 3. 등급 시스템 설계

### 3.1 등급 데이터

```typescript
interface GradeInfo {
  grade: Grade;
  title: string;
  minMs: number;  // 이상 (포함)
  maxMs: number;  // 미만
}

const GRADES: GradeInfo[] = [
  { grade: "S", title: "번개 반사신경", minMs: 0,   maxMs: 200 },
  { grade: "A", title: "매의 눈",       minMs: 200, maxMs: 250 },
  { grade: "B", title: "민첩한 고양이",  minMs: 250, maxMs: 300 },
  { grade: "C", title: "평범한 인간",    minMs: 300, maxMs: 400 },
  { grade: "D", title: "느긋한 거북이",  minMs: 400, maxMs: 500 },
  { grade: "F", title: "졸린 나무늘보",  minMs: 500, maxMs: Infinity },
];
```

### 3.2 등급 산출 함수

```typescript
function getGrade(averageMs: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => averageMs >= g.minMs && averageMs < g.maxMs);
  return info ? { grade: info.grade, title: info.title } : { grade: "F", title: "졸린 나무늘보" };
}
```

---

## 4. 핵심 로직 설계

### 4.1 게임 시작

```typescript
const startRound = useCallback(() => {
  // 이전 타이머 정리
  if (timeoutRef.current) clearTimeout(timeoutRef.current);

  setPhase("waiting");

  // 랜덤 딜레이 2~5초 후 초록으로 전환
  const delay = 2000 + Math.random() * 3000;
  timeoutRef.current = setTimeout(() => {
    startTimeRef.current = performance.now();
    setPhase("go");
  }, delay);
}, []);
```

### 4.2 화면 클릭 핸들러

```typescript
const handleClick = useCallback(() => {
  if (phase === "idle") return;

  if (phase === "waiting") {
    // Too Early!
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("tooEarly");
    timeoutRef.current = setTimeout(() => {
      startRound();
    }, 1500);
    return;
  }

  if (phase === "go") {
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setCurrentTime(elapsed);

    const newRound = roundRef.current + 1;
    const newRounds = [...rounds, { round: newRound, time: elapsed }];
    setRounds(newRounds);
    setRound(newRound);
    roundRef.current = newRound;

    if (newRound >= 5) {
      // 5회 완료 → 결과
      const times = newRounds.map((r) => r.time);
      const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const { grade, title } = getGrade(average);

      setHistory((prev) => [
        { id: prev.length + 1, average, grade, title },
        ...prev.slice(0, 9),
      ]);
      setPhase("result");
    } else {
      setPhase("roundResult");
      // 1.5초 후 자동으로 다음 라운드
      timeoutRef.current = setTimeout(() => {
        startRound();
      }, 1500);
    }
    return;
  }

  if (phase === "roundResult") {
    // 클릭으로 즉시 다음 라운드
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    startRound();
    return;
  }
}, [phase, rounds, startRound]);
```

### 4.3 게임 리셋

```typescript
const resetGame = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  setRound(0);
  setRounds([]);
  setCurrentTime(0);
  roundRef.current = 0;
  startRound();
}, [startRound]);
```

### 4.4 Cleanup

```typescript
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);
```

---

## 5. UI 와이어프레임

### 5.1 idle 상태

```
┌──────────────────────────────────────────────────────┐
│  ← Back                                              │
│                                                      │
│              Game                                     │
│              bolt icon                                │
│              Reaction Test                            │
│              당신의 반응속도는 몇 ms? 지금 테스트하세요     │
│              ──────────────                           │
│                                                      │
│              [AdBanner]                               │
│                                                      │
│         화면이 초록색으로 변하면                           │
│         최대한 빠르게 클릭하세요!                          │
│                                                      │
│         5번 측정한 평균으로 등급을 매겨드려요.              │
│                                                      │
│              [ 시작하기 ]                               │
│                                                      │
│              [AdBanner]                               │
└──────────────────────────────────────────────────────┘
```

### 5.2 waiting 상태 (전체화면 터치 영역)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│             bg: red-500/red-600 계열                   │
│                                                      │
│                                                      │
│              Round N / 5                              │
│                                                      │
│              초록색이 되면 클릭!                          │
│                                                      │
│              (기다리세요...)                             │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.3 go 상태 (전체화면 터치 영역)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│             bg: green-500/emerald-500 계열             │
│                                                      │
│                                                      │
│                                                      │
│              클릭!                                     │
│              (대형 텍스트)                               │
│                                                      │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.4 tooEarly 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│             bg: amber-500/yellow-500 계열              │
│                                                      │
│                                                      │
│              너무 빨라요!                               │
│              초록색이 될 때까지 기다리세요                  │
│                                                      │
│              (1.5초 후 자동 재시도)                      │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.5 roundResult 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│              Round N / 5                              │
│                                                      │
│              256 ms                                   │
│              (대형 숫자, scale bounce)                   │
│                                                      │
│              클릭하여 다음 라운드                         │
│                                                      │
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
│              "민첩한 고양이"                             │
│              칭호 텍스트                                │
│                                                      │
│              평균: 278 ms                              │
│              최고: 231 ms | 최저: 342 ms               │
│                                                      │
│         ┌─────────────────────────────────────┐      │
│         │ R1: 256ms  R2: 231ms  R3: 302ms    │      │
│         │ R4: 259ms  R5: 342ms               │      │
│         └─────────────────────────────────────┘      │
│                                                      │
│              [ 다시 도전 ]                              │
│                                                      │
│  ─────────────────────────────────────               │
│  History                                              │
│  #3  B  민첩한 고양이  278ms                            │
│  #2  A  매의 눈       245ms                            │
│  #1  C  평범한 인간    356ms                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 6. 애니메이션 설계

### 6.1 프로젝트 표준 easing

```typescript
const EASING = [0.215, 0.61, 0.355, 1]; // cubic-bezier - 기존 게임과 동일
```

### 6.2 Phase별 애니메이션

| 요소 | 트리거 | 동작 | duration |
|------|--------|------|----------|
| 전체 phase 전환 | phase 변경 | AnimatePresence mode="wait", fade | 0.2s |
| waiting 배경 | waiting 진입 | opacity 0→1, 빨강 배경 | 0.3s |
| go 배경 | go 전환 | 빨강→초록, scale 1→1.02→1 (pulse) | 0.15s |
| tooEarly 배경 | tooEarly | 노랑 배경 + shake x: [-5, 5, -3, 3, 0] | 0.4s |
| roundResult ms 숫자 | roundResult | scale 0.5→1.1→1 (bounce) | 0.4s |
| result 등급 | result | scale 0→1.3→1 (bounce) | 0.6s |
| result 칭호 | result | opacity 0→1, y 10→0 (0.2s delay) | 0.4s |
| result 통계 | result | opacity 0→1 (0.3s delay) | 0.4s |
| result 라운드별 | result | opacity 0→1 (stagger 0.05s) | 0.3s |

### 6.3 AnimatePresence 구조

```tsx
{phase === "idle" ? (
  <IdleView onStart={resetGame} />
) : phase === "result" ? (
  <ResultView
    rounds={rounds}
    history={history}
    onRetry={resetGame}
  />
) : (
  <motion.div
    className="fixed inset-0 z-50 flex cursor-pointer select-none flex-col items-center justify-center"
    onPointerDown={handleClick}
    animate={{ backgroundColor: BG_COLORS[phase] }}
    transition={{ duration: 0.15 }}
  >
    <AnimatePresence mode="wait">
      {phase === "waiting" && <WaitingView key="waiting" round={round} />}
      {phase === "go" && <GoView key="go" />}
      {phase === "tooEarly" && <TooEarlyView key="tooEarly" />}
      {phase === "roundResult" && <RoundResultView key="roundResult" time={currentTime} round={round} />}
    </AnimatePresence>
  </motion.div>
)}
```

### 6.4 배경색 상수

```typescript
const BG_COLORS: Record<string, string> = {
  waiting: "#dc2626",    // red-600
  go: "#16a34a",         // green-600
  tooEarly: "#d97706",   // amber-600
  roundResult: "#1e293b", // slate-800
};
```

---

## 7. 전체화면 인터랙션 설계

### 7.1 게임 중 레이아웃

- waiting / go / tooEarly / roundResult 상태에서는 **전체화면 오버레이**
- `fixed inset-0 z-50` 으로 페이지 전체를 덮음
- `cursor-pointer select-none` 으로 텍스트 선택 방지
- `onPointerDown` 사용 (onClick보다 빠름, 터치 디바이스 최적)

### 7.3 게임 중 강제 종료

- 전체화면 오버레이 우상단에 X(닫기) 버튼 배치
- `e.stopPropagation()`으로 `handleClick` 전파 방지
- 클릭 시 타이머 정리 + 모든 상태 초기화 + `idle` 복귀
- `handleExit` 함수: `clearTimer()` → state reset → `setPhase("idle")`
- 스타일: `text-white/40 hover:text-white/80`, 반투명으로 게임 방해 최소화

### 7.2 모바일 대응

| 항목 | 대응 |
|------|------|
| 터치 이벤트 | `onPointerDown` (touch + mouse 통합) |
| 텍스트 선택 방지 | `select-none` |
| 스크롤 방지 | `overflow-hidden` on body (게임 중) |
| 글자 크기 | `text-6xl sm:text-8xl` (모바일에서도 가독성) |
| 터치 영역 | 전체 화면 (최대 터치 영역) |

---

## 8. 라우팅 & 등록 설계

### 8.1 아이콘 등록 (`components/ui/icons.tsx`)

```typescript
// UIIconType에 "bolt" 추가
export type UIIconType = "camera" | "video" | "capture" | "search" | "robot" | "warning" | "dice" | "clover" | "paw" | "bolt";

// icons Record에 bolt SVG 추가
bolt: (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="번개">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
),
```

### 8.2 GAMES 배열 등록 (`lib/constants.ts`)

```typescript
{
  slug: "reaction",
  title: "Reaction Test",
  description: "당신의 반응속도는 몇 ms? 지금 테스트하세요",
  icon: "bolt",
}
```

### 8.3 Dynamic Import 등록 (`app/game/[slug]/page.tsx`)

```typescript
const ReactionGame = dynamic(() =>
  import("@/components/game/reaction-game").then((m) => m.ReactionGame),
);

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
  reaction: ReactionGame,
};
```

---

## 9. 스타일 설계

### 9.1 프로젝트 기존 패턴 준수

| 요소 | Tailwind 클래스 | 참고 |
|------|-----------------|------|
| 섹션 제목 | `text-[13px] uppercase tracking-[0.2em] text-text-muted` | dice/lotto 동일 |
| 구분선 | `h-px bg-border/60` | page 레이아웃 |
| 히스토리 행 | `border-b border-border/60 py-2.5 text-sm` | dice-game.tsx |
| 버튼 | `<Button size="lg">` | 기존 게임 동일 |
| 컨테이너 | `flex flex-col items-center` | 기존 게임 동일 |

### 9.2 게임 고유 스타일

| 요소 | 스타일 |
|------|--------|
| ms 숫자 (대형) | `text-6xl sm:text-8xl font-bold font-heading tracking-[-0.03em]` |
| 등급 (대형) | `text-7xl sm:text-9xl font-bold font-heading` |
| 칭호 텍스트 | `text-xl sm:text-2xl text-text-secondary` |
| 라운드 표시 | `text-lg text-white/70` |
| 전체화면 안내 | `text-2xl sm:text-3xl font-bold text-white` |
| 라운드 결과 그리드 | `grid grid-cols-5 gap-2 text-center` |

---

## 10. 구현 순서 (Plan 문서 기반)

### Step 1: 등록 (FR-01, FR-02, FR-03)
1. `components/ui/icons.tsx` - UIIconType에 `bolt` 추가 + SVG 구현
2. `lib/constants.ts` - GAMES 배열에 reaction 게임 추가
3. `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Step 2: 핵심 게임 로직 (FR-04, FR-05, FR-06)
4. `components/game/reaction-game.tsx` 생성
   - Phase type 정의
   - 상수(GRADES, BG_COLORS) 정의
   - startRound, handleClick, resetGame 로직
   - Too Early 페널티 처리
   - performance.now() 타이밍 측정

### Step 3: 결과 및 UX (FR-07, FR-08, FR-09)
5. 5회 완료 후 결과 화면 (통계 계산)
6. 등급/칭호 시스템 (getGrade 함수)
7. 히스토리 기능

### Step 4: 반응형 (FR-10)
8. 전체화면 오버레이 (fixed inset-0)
9. 모바일 터치 최적화 (onPointerDown)

### Step 5: 검증
10. `pnpm lint` 실행
11. `pnpm build` 실행 - `/game/reaction` 페이지 생성 확인

---

## 11. FR 매핑 (Plan ↔ Design)

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| FR-01 GAMES 배열 등록 | 8.2 | `lib/constants.ts` |
| FR-02 bolt 아이콘 추가 | 8.1 | `components/ui/icons.tsx` |
| FR-03 Dynamic import 등록 | 8.3 | `app/game/[slug]/page.tsx` |
| FR-04 3단계 화면 전환 | 2.1, 4.1, 6.3 | `components/game/reaction-game.tsx` |
| FR-05 ms 정밀 측정 | 4.2 | `components/game/reaction-game.tsx` |
| FR-06 Too Early 페널티 | 4.2 | `components/game/reaction-game.tsx` |
| FR-07 5회 측정 결과 | 4.2, 5.6 | `components/game/reaction-game.tsx` |
| FR-08 등급/칭호 시스템 | 3 | `components/game/reaction-game.tsx` |
| FR-09 히스토리 | 2.2, 5.6 | `components/game/reaction-game.tsx` |
| FR-10 모바일 전체화면 | 7 | `components/game/reaction-game.tsx` |
| FR-11 게임 중 강제 종료 | 7.3 | `components/game/reaction-game.tsx` |
| FR-12 측정 횟수 사용자 설정 | 2.2, 5.1 | `components/game/reaction-game.tsx` |

---

## 12. NFR 설계 대응

| NFR | 대응 방법 |
|-----|-----------|
| NFR-01 기존 게임 영향 없음 | dynamic import로 코드 분리, GAME_COMPONENTS에 키 추가만 |
| NFR-02 빌드 성공 | generateStaticParams가 GAMES에서 slug 자동 수집 |
| NFR-03 린트 통과 | 기존 ESLint 설정 준수, "use client" 지시어 |
| NFR-04 외부 라이브러리 없음 | React + framer-motion + Tailwind만 사용 |
| NFR-05 단일 파일 ~200줄 | 인라인 서브 컴포넌트로 구성, 별도 파일 불필요 |
| NFR-06 setTimeout cleanup | useEffect return + timeoutRef.current 정리 |

---

**Created**: 2026-02-11
**Feature**: reaction-test
**Phase**: Design
**Based on**: docs/01-plan/features/reaction-test.plan.md
