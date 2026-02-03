# Design: animal-face

> Teachable Machine 이미지 분류 모델을 활용한 "동물상 찾기" 게임 상세 기술 설계서

---

## 1. 컴포넌트 아키텍처

### 1.1 파일 구조

```
apps/web/
  lib/constants.ts                    # GAMES 배열에 animal-face 항목 추가
  app/game/[slug]/page.tsx            # AnimalFaceGame dynamic import 등록
  components/game/animal-face.tsx     # 게임 컴포넌트 (전체 구현)
```

### 1.2 의존성 관계

```
animal-face.tsx
  ├── react (useState, useRef, useEffect, useCallback)
  ├── framer-motion (motion, AnimatePresence)
  ├── @/components/ui/button (Button)
  ├── @teachablemachine/image (tmImage) ← dynamic import
  └── @tensorflow/tfjs ← tmImage 내부 의존
```

---

## 2. 상태 설계 (State Machine)

### 2.1 Phase 흐름

```
idle ──[카메라 시작]──▶ loading ──[모델+웹캠 준비]──▶ camera ──[촬영]──▶ analyzing ──[예측 완료]──▶ result
  ▲                                                                                                │
  │                                                                         [다시 하기]             │
  └─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                      (result → camera 직접 전환도 가능)
```

### 2.2 State 정의

```typescript
type Phase = "idle" | "loading" | "camera" | "analyzing" | "result";

interface Prediction {
  className: string;   // "dog" | "cat" | "fox"
  probability: number; // 0.0 ~ 1.0
}

interface AnimalResult {
  animal: string;           // 최고 확률 클래스명
  confidence: number;       // 최고 확률 값
  allPredictions: Prediction[];
}

interface HistoryItem {
  id: number;
  animal: string;
  emoji: string;
  name: string;
  confidence: number;
}

// Component State
const [phase, setPhase] = useState<Phase>("idle");
const [result, setResult] = useState<AnimalResult | null>(null);
const [history, setHistory] = useState<HistoryItem[]>([]);
const [error, setError] = useState<string | null>(null);

// Refs (리렌더 방지)
const modelRef = useRef<any>(null);
const webcamRef = useRef<any>(null);
const webcamContainerRef = useRef<HTMLDivElement>(null);
const animFrameRef = useRef<number>(0);
```

---

## 3. 모델 연동 설계

### 3.1 Teachable Machine 모델

| 항목 | 값 |
|------|-----|
| 모델 URL | `https://teachablemachine.withgoogle.com/models/V9poYecHi/` |
| model.json | `{URL}model.json` |
| metadata.json | `{URL}metadata.json` |
| 분류 클래스 | `dog`, `cat`, `fox` |
| 모델 타입 | Image Classification |

### 3.2 TypeScript 타입 선언

```typescript
// 컴포넌트 상단에 인라인 선언 (@teachablemachine/image는 타입 미제공)
declare module "@teachablemachine/image" {
  export function load(modelURL: string, metadataURL?: string): Promise<CustomImageModel>;
  export class Webcam {
    constructor(width: number, height: number, flip: boolean);
    setup(): Promise<void>;
    play(): void;
    pause(): void;
    stop(): void;
    update(): void;
    canvas: HTMLCanvasElement;
    webcam: HTMLVideoElement;
  }
  export interface CustomImageModel {
    predict(input: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement): Promise<{
      className: string;
      probability: number;
    }[]>;
    getTotalClasses(): number;
  }
}
```

### 3.3 모델 로딩 로직

```typescript
async function initModel() {
  setPhase("loading");
  setError(null);

  try {
    const tmImage = await import("@teachablemachine/image");
    const MODEL_URL = "https://teachablemachine.withgoogle.com/models/V9poYecHi/";
    const model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    modelRef.current = model;

    // 웹캠 초기화
    const webcam = new tmImage.Webcam(300, 300, true); // flip=true (셀카 미러)
    await webcam.setup({ facingMode: "user" });
    await webcam.play();
    webcamRef.current = webcam;

    // DOM에 캔버스 삽입
    if (webcamContainerRef.current) {
      webcamContainerRef.current.innerHTML = "";
      webcamContainerRef.current.appendChild(webcam.canvas);
    }

    // 프레임 업데이트 루프
    const loop = () => {
      webcam.update();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    setPhase("camera");
  } catch (err) {
    handleError(err);
  }
}
```

### 3.4 예측 로직

```typescript
async function capture() {
  if (!modelRef.current || !webcamRef.current) return;
  setPhase("analyzing");

  // 프레임 업데이트 중지
  cancelAnimationFrame(animFrameRef.current);
  webcamRef.current.pause();

  try {
    const predictions = await modelRef.current.predict(webcamRef.current.canvas);
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    const top = sorted[0];

    const newResult: AnimalResult = {
      animal: top.className,
      confidence: top.probability,
      allPredictions: predictions,
    };

    setResult(newResult);

    const info = ANIMAL_INFO[top.className];
    setHistory((prev) => [
      {
        id: prev.length + 1,
        animal: top.className,
        emoji: info?.emoji ?? "?",
        name: info?.name ?? top.className,
        confidence: top.probability,
      },
      ...prev.slice(0, 9),
    ]);

    setPhase("result");
  } catch {
    setError("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
    retryCamera();
  }
}
```

---

## 4. 동물상 데이터 설계

```typescript
interface AnimalInfo {
  emoji: string;
  name: string;
  description: string;
}

const ANIMAL_INFO: Record<string, AnimalInfo> = {
  dog: {
    emoji: "\uD83D\uDC36",  // dog face
    name: "강아지상",
    description: "충성스럽고 활발한 에너지! 사교적이고 따뜻한 성격으로 주변 사람들에게 사랑받는 타입",
  },
  cat: {
    emoji: "\uD83D\uDC31",  // cat face
    name: "고양이상",
    description: "독립적이고 신비로운 매력! 차분하고 우아한 분위기로 자신만의 세계가 확실한 타입",
  },
  fox: {
    emoji: "\uD83E\uDD8A",  // fox face
    name: "여우상",
    description: "영리하고 매력적인 인상! 날카로운 관찰력과 재치로 사람들의 시선을 사로잡는 타입",
  },
};
```

---

## 5. UI 와이어프레임

### 5.1 idle 상태

```
┌──────────────────────────────────────────────────────┐
│  ← Back                                              │
│                                                      │
│              Game                                     │
│              paw emoji                                │
│              동물상 찾기                                │
│              카메라로 셀카를 찍으면 당신의 동물상을 알려드려요   │
│              ──────────────                           │
│                                                      │
│              [AdBanner]                               │
│                                                      │
│         강아지상emoji  고양이상emoji  여우상emoji           │
│                                                      │
│         AI가 당신의 얼굴을 분석하여                       │
│         어떤 동물과 닮았는지 알려드려요!                    │
│                                                      │
│              [ 카메라 시작 ]                            │
│                                                      │
│              [AdBanner]                               │
└──────────────────────────────────────────────────────┘
```

### 5.2 loading 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         ┌────────────────────┐                       │
│         │                    │                       │
│         │    (펄스 아이콘)     │                       │
│         │     AI 모델을       │                       │
│         │     로딩중...       │                       │
│         │                    │                       │
│         └────────────────────┘                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.3 camera 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         ┌────────────────────┐                       │
│         │                    │                       │
│         │   웹캠 프리뷰       │  300x300              │
│         │   (실시간 영상)      │  aspect-ratio 1:1     │
│         │                    │                       │
│         └────────────────────┘                       │
│                                                      │
│              [ 촬영하기 ]                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.4 analyzing 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         ┌────────────────────┐                       │
│         │                    │                       │
│         │   정지된 프레임      │                       │
│         │                    │                       │
│         └────────────────────┘                       │
│                                                      │
│              분석중...                                 │
│              (스피너 애니메이션)                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.5 result 상태

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              (대형 이모지, scale bounce)                │
│              동물상이름                                 │
│                                                      │
│         ┌─ 강아지상 ───────────── 75% ─────┐          │
│         ┌─ 고양이상 ──────── 15% ──┐        │          │
│         ┌─ 여우상 ──── 10% ─┐       │        │          │
│                                                      │
│         성격 설명 텍스트...                              │
│                                                      │
│              [ 다시 하기 ]                              │
│                                                      │
│  ─────────────────────────────────────               │
│  History                                              │
│  #3  강아지상emoji  강아지상  75%                        │
│  #2  여우상emoji   여우상    62%                        │
│  #1  고양이상emoji  고양이상  81%                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.6 error 상태 (phase 위에 오버레이)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         warning emoji  에러 메시지 텍스트                │
│                                                      │
│              [ 다시 시도 ]                              │
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
| 전체 phase 전환 | phase 변경 | AnimatePresence mode="wait", fade + slide | 0.3s |
| 로딩 아이콘 | loading phase | 펄스 (opacity 0.5↔1, scale 0.95↔1.05) | 1.5s loop |
| 웹캠 프리뷰 | camera phase | opacity 0→1, scale 0.95→1 | 0.4s |
| 분석 스피너 | analyzing phase | rotate 360deg 반복 | 1s loop |
| 결과 이모지 | result phase | scale 0→1.2→1 (bounce) | 0.6s |
| 결과 텍스트 | result phase | opacity 0→1, y 10→0 (0.2s delay) | 0.4s |
| 신뢰도 바 | result phase | width 0%→target% (stagger 0.1s) | 0.8s |
| 성격 설명 | result phase | opacity 0→1 (0.5s delay) | 0.4s |
| 에러 메시지 | error 발생 | opacity 0→1, y -10→0 | 0.3s |

### 6.3 AnimatePresence 구조

```tsx
<AnimatePresence mode="wait">
  {phase === "idle" && <IdleView key="idle" />}
  {phase === "loading" && <LoadingView key="loading" />}
  {phase === "camera" && <CameraView key="camera" />}
  {phase === "analyzing" && <AnalyzingView key="analyzing" />}
  {phase === "result" && <ResultView key="result" />}
</AnimatePresence>

{error && <ErrorOverlay />}
```

---

## 7. 에러 처리 설계

### 7.1 에러 매핑

| 에러 조건 | 감지 방법 | 메시지 | 복구 동작 |
|-----------|----------|--------|-----------|
| 카메라 권한 거부 | `NotAllowedError` | 카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요. | → idle |
| 카메라 미감지 | `NotFoundError` / `NotReadableError` | 카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요. | → idle |
| 모델 로딩 실패 | `tmImage.load` reject | AI 모델을 불러오는데 실패했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요. | → idle |
| 예측 실패 | `model.predict` reject | 분석 중 오류가 발생했습니다. 다시 시도해 주세요. | → camera (재시도) |

### 7.2 에러 핸들링 함수

```typescript
function handleError(err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));

  if (error.name === "NotAllowedError") {
    setError("카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.");
  } else if (error.name === "NotFoundError" || error.name === "NotReadableError") {
    setError("카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요.");
  } else {
    setError("AI 모델을 불러오는데 실패했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.");
  }

  cleanup();
  setPhase("idle");
}
```

---

## 8. 리소스 관리 설계

### 8.1 Cleanup 함수

```typescript
function cleanup() {
  cancelAnimationFrame(animFrameRef.current);

  if (webcamRef.current) {
    webcamRef.current.stop();
    webcamRef.current = null;
  }

  // 컨테이너 내부의 canvas/video 요소 제거
  if (webcamContainerRef.current) {
    webcamContainerRef.current.innerHTML = "";
  }
}
```

### 8.2 컴포넌트 언마운트 시

```typescript
useEffect(() => {
  return () => {
    cleanup();
  };
}, []);
```

### 8.3 "다시 하기" 동작

```typescript
function retryCamera() {
  // 프레임 업데이트 재개
  if (webcamRef.current) {
    webcamRef.current.play();

    const loop = () => {
      webcamRef.current?.update();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    setPhase("camera");
  }
}
```

---

## 9. 라우팅 & 등록 설계

### 9.1 GAMES 배열 등록 (`lib/constants.ts`)

```typescript
// GAMES 배열에 추가
{
  slug: "animal-face",
  title: "동물상 찾기",
  description: "카메라로 셀카를 찍으면 당신의 동물상을 알려드려요",
  emoji: "\uD83D\uDC3E",  // paw prints
}
```

> 이미 이전 세션에서 추가 완료 상태

### 9.2 Dynamic Import 등록 (`app/game/[slug]/page.tsx`)

```typescript
const AnimalFaceGame = dynamic(() =>
  import("@/components/game/animal-face").then((m) => m.AnimalFaceGame),
);

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  dice: DiceGame,
  lotto: LottoGame,
  "animal-face": AnimalFaceGame,
};
```

### 9.3 Code Splitting 효과

- `@tensorflow/tfjs` (~1.5MB) 와 `@teachablemachine/image` 는 `/game/animal-face` 진입 시에만 로드
- `next/dynamic` 기본 동작으로 별도 chunk 분리
- 다른 게임 페이지에 영향 없음

---

## 10. 모바일 대응 설계

### 10.1 카메라 설정

```typescript
// facingMode: "user" → 모바일 전면 카메라
// flip: true → 셀카 미러 효과 (좌우 반전)
const webcam = new tmImage.Webcam(300, 300, true);
await webcam.setup({ facingMode: "user" });
```

### 10.2 iOS Safari 대응

- `tmImage.Webcam` 내부에서 video 요소에 `playsinline`, `muted` 자동 설정
- 별도 polyfill 불필요 (TM 라이브러리 내장)

### 10.3 반응형 웹캠 크기

```css
/* 웹캠 컨테이너 */
.webcam-container {
  width: 300px;
  height: 300px;
  max-width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.webcam-container canvas {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
```

Tailwind 클래스로 구현:
```
w-[300px] max-w-full aspect-square overflow-hidden
```

---

## 11. 스타일 설계

### 11.1 프로젝트 기존 패턴 준수

| 요소 | Tailwind 클래스 | 참고 |
|------|-----------------|------|
| 섹션 제목 | `text-[13px] uppercase tracking-[0.2em] text-text-muted` | dice/lotto 동일 |
| 구분선 | `h-px bg-border/60` | page 레이아웃 |
| 히스토리 행 | `border-b border-border/60 py-2.5 text-sm` | dice-game.tsx |
| 버튼 | `<Button size="lg">` | 기존 게임 동일 |
| 컨테이너 | `flex flex-col items-center` | 기존 게임 동일 |
| 신뢰도 바 | `h-2 bg-border/30` (배경) + `h-full bg-text` (채움) | 커스텀 |

### 11.2 신뢰도 바 컴포넌트

```tsx
function ConfidenceBar({
  label,
  emoji,
  value,
  delay,
}: {
  label: string;
  emoji: string;
  value: number;  // 0~1
  delay: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-center">{emoji}</span>
      <span className="w-20 text-sm text-text-secondary">{label}</span>
      <div className="flex-1 h-2 bg-border/30 overflow-hidden">
        <motion.div
          className="h-full bg-text"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ duration: 0.8, delay, ease: EASING }}
        />
      </div>
      <span className="w-12 text-right text-sm font-bold">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
```

---

## 12. 구현 순서 (Plan 문서 기반)

### Step 1: 등록 (FR-01, FR-02)
1. `lib/constants.ts` - GAMES 배열 확인 (이미 추가됨)
2. `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 추가

### Step 2: 핵심 컴포넌트 (FR-03, FR-04, FR-05)
3. `components/game/animal-face.tsx` 생성
   - declare module 타입 선언
   - ANIMAL_INFO 상수
   - phase state machine
   - initModel (모델 로딩 + 웹캠 초기화)
   - capture (촬영 + 예측)
   - cleanup (리소스 정리)

### Step 3: UX 완성 (FR-06, FR-07, FR-08)
4. ConfidenceBar 컴포넌트 (신뢰도 바)
5. 동물상 성격 설명 표시
6. History 리스트

### Step 4: 안정성 (FR-09, FR-10)
7. 에러 처리 (handleError)
8. 모바일/iOS 대응

### Step 5: 검증
9. `pnpm lint`
10. `pnpm build` - `/game/animal-face` 정적 페이지 생성 확인

---

## 13. FR 매핑 (Plan ↔ Design)

| Plan FR | Design 섹션 | 구현 파일 |
|---------|------------|-----------|
| FR-01 GAMES 배열 등록 | 9.1 | `lib/constants.ts` |
| FR-02 Dynamic import 등록 | 9.2 | `app/game/[slug]/page.tsx` |
| FR-03 웹캠 연동 | 3.3 | `components/game/animal-face.tsx` |
| FR-04 TM 모델 로딩 | 3.3, 3.2 | `components/game/animal-face.tsx` |
| FR-05 이미지 분류 + 결과 | 3.4, 5.5 | `components/game/animal-face.tsx` |
| FR-06 신뢰도 바 | 11.2, 6.2 | `components/game/animal-face.tsx` |
| FR-07 성격 설명 | 4, 5.5 | `components/game/animal-face.tsx` |
| FR-08 히스토리 | 2.2, 5.5 | `components/game/animal-face.tsx` |
| FR-09 에러 처리 | 7 | `components/game/animal-face.tsx` |
| FR-10 모바일 대응 | 10 | `components/game/animal-face.tsx` |

---

## 14. NFR 설계 대응

| NFR | 대응 방법 |
|-----|-----------|
| NFR-01 기존 게임 영향 없음 | dynamic import로 코드 분리, GAME_COMPONENTS에 키 추가만 |
| NFR-02 빌드 성공 | generateStaticParams가 GAMES에서 slug 자동 수집 |
| NFR-03 린트 통과 | declare module + 기존 ESLint 설정 준수 |
| NFR-04 TF.js 번들 분리 | next/dynamic이 자동으로 별도 chunk 생성 |
| NFR-05 웹캠 리소스 정리 | useEffect return에서 cleanup() 호출 |

---

**Created**: 2026-02-03
**Feature**: animal-face
**Phase**: Design
**Based on**: docs/01-plan/features/animal-face.plan.md
