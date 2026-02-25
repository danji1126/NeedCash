# Design: game-content (PDCA-3)

> **Feature**: game-content
> **Plan 문서**: `docs/01-plan/features/game-content.plan.md`
> **작성일**: 2026-02-25

---

## 1. 개요

6개 게임 상세 페이지에 서버 렌더링되는 정적 텍스트 콘텐츠를 추가하여 "씬 콘텐츠(thin content)" 문제를 해소한다. 게임 소개, 플레이 방법, 결과 해석, 과학적 배경, FAQ, 관련 게임 추천을 포함한다.

### 제약 사항
- `output: 'export'` (정적 빌드) → 모든 콘텐츠는 빌드 타임에 결정
- 콘텐츠 컴포넌트는 **서버 컴포넌트**여야 함 (`"use client"` 사용 불가)
- FAQ 아코디언은 `<details>/<summary>` 네이티브 HTML 사용 (JS 불필요)
- 게임당 서버 렌더링 텍스트 **1000자+** 필수

---

## 2. 요구사항별 상세 설계

### FR-01: 게임 콘텐츠 데이터 구조

**파일**: `lib/game-content.ts` (CREATE)

#### 타입 정의

```typescript
export interface GameContent {
  slug: string;
  introduction: string;
  howToPlay: string[];
  scoreGuide: {
    label: string;
    value: string;
    description: string;
  }[];
  background: string;
  faq: {
    question: string;
    answer: string;
  }[];
}
```

#### 6개 게임 데이터

```typescript
const GAME_CONTENTS: GameContent[] = [
  {
    slug: "dice",
    introduction:
      "Dice Roller는 가상 주사위를 굴려 다양한 확률 실험을 해볼 수 있는 시뮬레이터입니다. 실제 주사위와 동일한 확률 분포를 따르는 난수 생성 알고리즘을 사용하여, 보드게임 연습부터 확률 학습까지 다양한 용도로 활용할 수 있습니다. 주사위 2개를 동시에 굴려 합계의 분포를 직접 확인해보세요.",
    howToPlay: [
      "Roll 버튼을 클릭하면 주사위 2개가 동시에 굴려집니다",
      "각 주사위의 눈금과 합계가 화면에 표시됩니다",
      "여러 번 굴려서 나온 결과의 패턴을 관찰해보세요",
      "결과 히스토리에서 이전 기록을 확인할 수 있습니다",
    ],
    scoreGuide: [
      { label: "2 (Snake Eyes)", value: "2.78%", description: "가장 낮은 확률, 두 주사위 모두 1이 나와야 합니다" },
      { label: "7", value: "16.67%", description: "가장 높은 확률의 합계, 6가지 조합이 가능합니다" },
      { label: "12 (Boxcars)", value: "2.78%", description: "가장 낮은 확률, 두 주사위 모두 6이 나와야 합니다" },
    ],
    background:
      "주사위는 인류 역사상 가장 오래된 난수 생성 도구 중 하나로, 기원전 3000년경 메소포타미아에서 처음 사용된 것으로 추정됩니다. 현대 확률론의 기초는 17세기 파스칼과 페르마가 주사위 도박 문제를 연구하면서 확립되었습니다. '큰 수의 법칙'에 따르면, 주사위를 충분히 많이 굴리면 각 눈금의 출현 빈도가 이론적 확률(1/6)에 수렴합니다. 이 시뮬레이터에서 직접 실험하며 확률의 기본 원리를 체험해보세요.",
    faq: [
      {
        question: "이 주사위는 공정한가요?",
        answer: "네, Web Crypto API 기반의 의사 난수 생성기를 사용하여 각 눈금이 정확히 1/6 확률로 나옵니다. 실제 물리적 주사위보다 오히려 더 균일한 분포를 보장합니다.",
      },
      {
        question: "주사위 2개의 합이 7이 가장 잘 나오는 이유는?",
        answer: "합이 7이 되는 조합은 (1,6), (2,5), (3,4), (4,3), (5,2), (6,1)로 총 6가지입니다. 반면 합이 2나 12가 되는 조합은 각각 1가지뿐이므로, 7이 나올 확률이 가장 높습니다.",
      },
      {
        question: "확률 분포를 어떻게 확인할 수 있나요?",
        answer: "여러 번 반복하여 굴린 후 히스토리를 확인해보세요. 횟수가 많아질수록 각 합계의 빈도가 이론적 확률에 가까워지는 '큰 수의 법칙'을 직접 관찰할 수 있습니다.",
      },
    ],
  },
  {
    slug: "lotto",
    introduction:
      "Lotto Pick은 한국 로또 6/45 규칙에 맞춰 무작위 번호를 생성하는 시뮬레이터입니다. 1부터 45까지의 숫자 중 중복 없이 6개를 선택하며, 암호학적으로 안전한 난수 생성 알고리즘을 사용합니다. 실제 로또 추첨과 동일한 조합 확률을 제공하여, 번호 선택의 재미를 경험해보세요.",
    howToPlay: [
      "Generate 버튼을 클릭하면 6개의 번호가 무작위로 선택됩니다",
      "번호는 자동으로 오름차순 정렬되어 표시됩니다",
      "마음에 드는 번호 조합이 나올 때까지 반복할 수 있습니다",
      "결과 히스토리에서 이전에 생성한 번호들을 확인할 수 있습니다",
    ],
    scoreGuide: [
      { label: "1등 (6개 일치)", value: "1/8,145,060", description: "약 814만 분의 1 확률, 모든 번호가 일치해야 합니다" },
      { label: "2등 (5개 + 보너스)", value: "1/1,357,510", description: "5개 일치 + 보너스 번호 일치" },
      { label: "3등 (5개 일치)", value: "1/35,724", description: "보너스 번호 제외 5개 일치" },
    ],
    background:
      "로또 번호 생성은 조합 수학(Combinatorics)의 대표적인 응용 사례입니다. 45개 중 6개를 선택하는 조합의 수는 C(45,6) = 8,145,060가지입니다. 컴퓨터의 난수 생성기는 Fisher-Yates 셔플 알고리즘을 기반으로, 모든 조합이 동일한 확률로 선택되도록 보장합니다. 흥미롭게도 '모든 번호는 동일한 당첨 확률을 가진다'는 수학적 사실에도 불구하고, 사람들은 특정 패턴(연속 번호, 생일 기반 등)을 선호하는 경향이 있습니다.",
    faq: [
      {
        question: "로또 1등 당첨 확률은 얼마인가요?",
        answer: "45개 중 6개를 맞추는 확률은 약 814만 분의 1(1/8,145,060)입니다. 이는 매주 1장씩 구매할 경우 평균 약 15만 6천 년이 걸리는 확률입니다.",
      },
      {
        question: "특정 번호가 더 잘 나오나요?",
        answer: "수학적으로 모든 번호 조합은 완전히 동일한 확률을 가집니다. '1,2,3,4,5,6'이 나올 확률과 '3,17,22,31,38,45'가 나올 확률은 정확히 같습니다.",
      },
      {
        question: "이전 당첨 번호를 분석하면 유리한가요?",
        answer: "각 추첨은 완전히 독립적인 사건이므로, 이전 결과가 다음 결과에 영향을 주지 않습니다. 이를 '도박사의 오류(Gambler's Fallacy)'라고 합니다.",
      },
    ],
  },
  {
    slug: "animal-face",
    introduction:
      "동물상 찾기는 AI 얼굴 분석 기술을 활용하여 당신의 얼굴이 어떤 동물과 닮았는지 알려주는 테스트입니다. 카메라로 셀카를 찍으면 얼굴의 특징점을 분석하여 가장 닮은 동물상을 찾아줍니다. 강아지상, 고양이상, 곰상, 토끼상 등 다양한 결과와 함께 재미있는 성격 분석도 제공합니다.",
    howToPlay: [
      "카메라 접근 권한을 허용해주세요",
      "화면에 얼굴이 나오면 촬영 버튼을 눌러주세요",
      "AI가 얼굴 특징을 분석하여 닮은 동물을 찾습니다",
      "결과 화면에서 동물상과 성격 특성을 확인하세요",
    ],
    scoreGuide: [
      { label: "강아지상", value: "충성적", description: "둥근 눈, 부드러운 인상으로 친근하고 다정한 이미지" },
      { label: "고양이상", value: "독립적", description: "날카로운 눈매, 세련된 인상으로 도도하고 매력적인 이미지" },
      { label: "곰상", value: "듬직한", description: "넓은 이마, 큰 눈으로 믿음직하고 포근한 이미지" },
      { label: "토끼상", value: "사랑스러운", description: "작은 얼굴, 큰 눈으로 귀엽고 밝은 이미지" },
    ],
    background:
      "얼굴 인식 AI는 딥러닝의 CNN(합성곱 신경망) 기술을 기반으로 합니다. 얼굴의 68개 이상의 특징점(랜드마크)을 검출하고, 눈 사이 거리, 코 길이, 턱선 각도 등의 비율을 분석합니다. 이 분석 결과를 동물 얼굴 특징 데이터베이스와 비교하여 유사도를 계산합니다. 재미를 위한 엔터테인먼트 목적이며, 과학적으로 '동물상'이 성격을 결정하는 것은 아닙니다.",
    faq: [
      {
        question: "촬영한 사진은 서버에 저장되나요?",
        answer: "아니요, 모든 분석은 브라우저 내에서 처리되며 사진은 서버로 전송되지 않습니다. 페이지를 떠나면 촬영 데이터는 완전히 삭제됩니다.",
      },
      {
        question: "결과의 정확도는 어느 정도인가요?",
        answer: "동물상 테스트는 엔터테인먼트 목적으로 설계되었습니다. 얼굴 특징점 분석은 정확하지만, 동물 유사도 매칭은 재미를 위한 것이므로 과학적 정확도와는 다릅니다.",
      },
      {
        question: "조명이나 각도에 따라 결과가 달라지나요?",
        answer: "네, 조명과 촬영 각도가 얼굴 특징점 검출에 영향을 줄 수 있습니다. 정면에서 균일한 조명으로 촬영하면 가장 일관된 결과를 얻을 수 있습니다.",
      },
    ],
  },
  {
    slug: "reaction",
    introduction:
      "Reaction Test는 시각 자극에 대한 반응 속도를 밀리초(ms) 단위로 정밀하게 측정하는 테스트입니다. 화면 색상이 변하는 순간 최대한 빠르게 클릭하여 당신의 반응 시간을 확인해보세요. 여러 라운드의 평균값으로 보다 정확한 측정이 가능하며, 인간의 평균 반응 속도인 200-250ms와 비교해볼 수 있습니다.",
    howToPlay: [
      "시작 버튼을 클릭하면 화면이 빨간색으로 변합니다",
      "빨간색 화면이 초록색으로 바뀌는 순간을 기다리세요",
      "초록색이 보이면 최대한 빠르게 화면을 클릭하세요",
      "여러 라운드를 진행하여 평균 반응 속도를 확인하세요",
    ],
    scoreGuide: [
      { label: "번개 (< 150ms)", value: "상위 1%", description: "프로 게이머 수준의 뛰어난 반응 속도" },
      { label: "빠름 (150-200ms)", value: "상위 15%", description: "평균 이상의 우수한 반응 속도" },
      { label: "보통 (200-250ms)", value: "평균", description: "일반적인 성인의 평균 반응 속도 범위" },
      { label: "느림 (250-350ms)", value: "평균 이하", description: "피로나 집중력 저하 시 나타나는 수준" },
      { label: "거북이 (> 350ms)", value: "하위 15%", description: "컨디션이 좋지 않거나 주의가 산만한 상태" },
    ],
    background:
      "반응 시간은 자극 인지부터 근육 반응까지의 전체 신경 처리 과정을 측정합니다. 빛 자극이 망막에 도달하면 시신경을 통해 뇌의 시각 피질로 전달되고(약 50ms), 전두엽에서 판단 후(약 100ms) 운동 피질이 근육에 명령을 보냅니다(약 50ms). 이 과정에서 총 약 200ms가 소요됩니다. 나이, 수면, 카페인 섭취, 운동 등이 반응 속도에 영향을 미치며, 꾸준한 훈련으로 10-20ms 정도 개선이 가능합니다.",
    faq: [
      {
        question: "인간의 평균 반응속도는 얼마인가요?",
        answer: "시각 자극에 대한 평균 반응 시간은 약 200-250ms입니다. 청각 자극은 약 150ms, 촉각 자극은 약 155ms로 더 빠릅니다.",
      },
      {
        question: "반응속도를 향상시킬 수 있나요?",
        answer: "규칙적인 운동, 충분한 수면, 적절한 카페인 섭취가 도움이 됩니다. 비디오 게임도 반응 속도 향상에 효과적이라는 연구 결과가 있습니다. 다만 유전적 요인도 크게 작용합니다.",
      },
      {
        question: "모바일과 PC의 결과가 다른 이유는?",
        answer: "터치스크린과 마우스 클릭의 입력 지연 시간이 다르며, 디스플레이 주사율에 따른 화면 갱신 차이도 있습니다. 일반적으로 PC에서 더 빠른 결과가 나옵니다.",
      },
    ],
  },
  {
    slug: "color-sense",
    introduction:
      "Color Sense Test는 미세한 색상 차이를 구별하는 능력을 측정하는 테스트입니다. 여러 개의 동일한 색상 타일 중에서 하나만 다른 색의 타일을 찾아야 합니다. 레벨이 올라갈수록 색상 차이가 미세해지며, 당신의 색각 민감도가 상위 몇 퍼센트인지 확인할 수 있습니다.",
    howToPlay: [
      "화면에 여러 개의 색상 타일이 표시됩니다",
      "하나만 다른 색상의 타일을 찾아 클릭하세요",
      "정답을 맞추면 다음 레벨로 진행되며 난이도가 올라갑니다",
      "오답 시 또는 시간 초과 시 게임이 종료되고 점수를 확인합니다",
    ],
    scoreGuide: [
      { label: "레벨 1-10", value: "입문", description: "누구나 쉽게 구별할 수 있는 큰 색상 차이" },
      { label: "레벨 11-20", value: "양호", description: "보통 수준의 색각 능력, 일반적인 범위" },
      { label: "레벨 21-30", value: "우수", description: "평균 이상의 색감, 디자인 관련 직군에 유리" },
      { label: "레벨 31+", value: "탁월", description: "상위 5% 이내의 뛰어난 색각 민감도" },
    ],
    background:
      "인간의 색각은 망막의 세 종류 추상체(원추세포)에 의해 결정됩니다. 빨강(L), 초록(M), 파랑(S) 파장에 반응하는 각 추상체의 민감도 차이가 색 구별 능력을 결정합니다. 대부분의 사람은 약 100만 가지 색을 구별할 수 있지만, 테트라크로맷(4색형 색각자)은 최대 1억 가지까지 구별할 수 있다고 알려져 있습니다. 이 테스트는 색각의 민감도를 측정하는 것으로, 색맹/색약 진단과는 다릅니다.",
    faq: [
      {
        question: "이 테스트로 색맹인지 알 수 있나요?",
        answer: "이 테스트는 색각 민감도를 측정하는 것이지 색맹/색약 진단 도구가 아닙니다. 색맹 검사는 이시하라 색각 검사표 등 전문 검사를 받으셔야 합니다.",
      },
      {
        question: "색감 능력을 훈련으로 향상할 수 있나요?",
        answer: "색 구별 훈련을 통해 어느 정도 향상이 가능합니다. 디자이너, 화가 등 색상을 자주 다루는 직업군이 일반인보다 미세한 색차를 더 잘 구별한다는 연구가 있습니다.",
      },
      {
        question: "모니터에 따라 결과가 달라지나요?",
        answer: "네, 모니터의 색역(Color Gamut), 밝기, 캘리브레이션 상태에 따라 결과가 달라질 수 있습니다. 정확한 측정을 위해 sRGB 이상의 색역을 지원하는 모니터를 권장합니다.",
      },
    ],
  },
  {
    slug: "color-memory",
    introduction:
      "Color Memory는 사이먼 게임(Simon Game)에서 영감을 받은 색상 패턴 기억력 테스트입니다. 화면에 표시되는 색상 순서를 기억하고 똑같이 따라해야 합니다. 라운드가 진행될수록 기억해야 할 색상 수가 늘어나며, 당신의 작업 기억(Working Memory) 용량을 측정할 수 있습니다.",
    howToPlay: [
      "게임이 시작되면 색상 패드가 순서대로 깜빡입니다",
      "패턴을 주의 깊게 관찰하고 기억하세요",
      "패턴이 끝나면 동일한 순서로 색상 패드를 클릭하세요",
      "정답이면 패턴이 하나 더 추가되고, 오답이면 게임이 종료됩니다",
    ],
    scoreGuide: [
      { label: "라운드 1-4", value: "입문", description: "기본적인 단기 기억 수준" },
      { label: "라운드 5-7", value: "보통", description: "밀러의 법칙(7±2)에 해당하는 평균 작업 기억 용량" },
      { label: "라운드 8-10", value: "우수", description: "평균 이상의 작업 기억력" },
      { label: "라운드 11+", value: "탁월", description: "뛰어난 순차 기억 능력, 상위 10%" },
    ],
    background:
      "작업 기억(Working Memory)은 정보를 일시적으로 저장하고 조작하는 인지 기능입니다. 심리학자 조지 밀러가 1956년 발표한 '마법의 숫자 7±2' 논문에 따르면, 인간은 평균적으로 한 번에 7개(±2) 항목을 기억할 수 있습니다. 사이먼 게임은 1978년 Milton Bradley사에서 출시되어 전 세계적으로 유행했으며, 순차적 패턴 기억력을 테스트하는 대표적인 도구입니다. 음악가, 체스 선수 등은 청킹(Chunking) 전략을 통해 이 한계를 넘어서기도 합니다.",
    faq: [
      {
        question: "기억력을 향상시킬 수 있는 방법이 있나요?",
        answer: "청킹(Chunking) 전략 - 여러 항목을 하나의 덩어리로 묶어 기억하기, 규칙적인 수면, 유산소 운동, 명상 등이 작업 기억 향상에 도움이 됩니다.",
      },
      {
        question: "사이먼 게임과 어떤 관계가 있나요?",
        answer: "Color Memory는 1978년 출시된 클래식 전자 게임 '사이먼(Simon)'에서 영감을 받았습니다. 같은 원리의 색상-순서 기억 게임이지만, 웹에서 무료로 즐길 수 있도록 만들었습니다.",
      },
      {
        question: "나이가 들면 기억력이 떨어지나요?",
        answer: "작업 기억 용량은 20대에 최고점에 도달하고 이후 서서히 감소합니다. 그러나 꾸준한 인지 훈련을 통해 감소 속도를 늦출 수 있으며, 패턴 인식 능력은 경험으로 보완됩니다.",
      },
    ],
  },
];

export function getGameContent(slug: string): GameContent | undefined {
  return GAME_CONTENTS.find((g) => g.slug === slug);
}

export function getRelatedGames(currentSlug: string, count: number = 3): Game[] {
  return GAMES.filter((g) => g.slug !== currentSlug).slice(0, count);
}
```

**import 의존성**: `GAMES` from `@/lib/constants`

**완료 기준**: 6개 게임 모두 데이터 정의, 게임당 총 1000자+

---

### FR-02: 게임 콘텐츠 컴포넌트

**파일**: `components/game/game-content-section.tsx` (CREATE)

서버 컴포넌트 (`"use client"` 없음)

```tsx
import type { GameContent } from "@/lib/game-content";

interface GameContentSectionProps {
  content: GameContent;
}

export function GameContentSection({ content }: GameContentSectionProps) {
  return (
    <section className="mt-16 space-y-12">
      {/* 구분선 */}
      <div className="mx-auto h-px max-w-xs bg-border/60" />

      {/* 게임 소개 */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          게임 소개
        </h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          {content.introduction}
        </p>
      </div>

      {/* 플레이 방법 */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          플레이 방법
        </h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-text-secondary">
          {content.howToPlay.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* 결과 해석 가이드 */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          결과 해석 가이드
        </h2>
        <div className="mt-3 space-y-3">
          {content.scoreGuide.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{item.label}</span>
                <span className="text-sm text-text-muted">{item.value}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 알아두면 재미있는 이야기 */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          알아두면 재미있는 이야기
        </h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          {content.background}
        </p>
      </div>

      {/* 자주 묻는 질문 */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
          자주 묻는 질문
        </h2>
        <div className="mt-3 space-y-2">
          {content.faq.map((item, i) => (
            <details
              key={i}
              className="group rounded-lg border border-border/60"
            >
              <summary className="cursor-pointer px-4 py-3 font-medium transition-colors hover:bg-bg-secondary">
                {item.question}
              </summary>
              <p className="px-4 pb-4 leading-relaxed text-text-secondary">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**핵심 결정사항**:
- `<details>/<summary>` HTML 네이티브 아코디언 사용 → JS 불필요, 키보드 접근성 자동 지원
- `"use client"` 없음 → 서버 컴포넌트로 동작, HTML에 모든 텍스트 포함
- Tailwind 클래스는 기존 프로젝트 패턴 준수 (text-text-secondary, border-border/60 등)

**완료 기준**: 서버 렌더링됨, `pnpm build` 후 HTML 소스에 H2 섹션과 텍스트 존재

---

### FR-03: 게임 상세 페이지 통합

**파일**: `app/game/[slug]/page.tsx` (EDIT)

#### 변경 사항

**import 추가**:
```typescript
import { getGameContent } from "@/lib/game-content";
import { GameContentSection } from "@/components/game/game-content-section";
```

**GameDetailPage 함수 수정**:

기존 `<div className="mt-12">` 블록 아래에 콘텐츠 섹션 추가:

```tsx
export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) notFound();

  const GameComponent = GAME_COMPONENTS[slug];
  if (!GameComponent) notFound();

  const content = getGameContent(slug);

  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <GameJsonLd
        name={game.title}
        description={game.description}
        url={`/game/${slug}`}
      />
      <Link
        href="/game"
        className="text-[13px] tracking-wide text-text-muted transition-opacity hover:opacity-50"
      >
        &larr; Back
      </Link>

      <div className="mt-10 text-center">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Game
        </p>
        <span className="mt-4 inline-block">
          <UIIcon icon={game.icon} className="h-10 w-10" />
        </span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em]">
          {game.title}
        </h1>
        <p className="mt-2 text-text-secondary">{game.description}</p>
        <div className="mx-auto mt-6 h-px max-w-xs bg-border/60" />
      </div>

      <div className="mt-12">
        <GameComponent />
      </div>

      {/* ↓ 새로 추가: 서버 렌더링 콘텐츠 + 관련 게임 */}
      {content && <GameContentSection content={content} />}
      <RelatedGames currentSlug={slug} />
    </div>
  );
}
```

**완료 기준**: 6개 게임 페이지 모두에서 `<GameContentSection>` 렌더링

---

### FR-04: 관련 게임 추천

**파일**: `components/game/game-content-section.tsx` (EDIT - FR-02 파일에 추가)

`RelatedGames` 컴포넌트를 같은 파일 또는 별도 export:

```tsx
import Link from "next/link";
import { getRelatedGames } from "@/lib/game-content";
import { GAMES } from "@/lib/constants";
import { UIIcon } from "@/components/ui/icons";

interface RelatedGamesProps {
  currentSlug: string;
}

export function RelatedGames({ currentSlug }: RelatedGamesProps) {
  const related = getRelatedGames(currentSlug, 3);

  return (
    <section className="mt-16">
      <div className="mx-auto h-px max-w-xs bg-border/60" />
      <h2 className="mt-12 font-heading text-xl font-semibold tracking-[-0.01em]">
        다른 게임도 즐겨보세요
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {related.map((game) => (
          <Link
            key={game.slug}
            href={`/game/${game.slug}`}
            className="group rounded-lg border border-border/60 p-4 transition-colors hover:bg-bg-secondary"
          >
            <UIIcon icon={game.icon} className="h-6 w-6" />
            <p className="mt-2 font-medium text-sm">
              {game.title}
              <span className="ml-1 inline-block text-text-muted transition-transform duration-300 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {game.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**완료 기준**: 각 게임 페이지에 현재 게임 제외 3개 관련 게임 카드 + 내부 링크 존재

---

## 3. 변경 파일 목록

| # | 파일 | 변경 유형 | FR | 상세 |
|---|------|----------|-----|------|
| 1 | `lib/game-content.ts` | CREATE | FR-01, FR-04 | 6개 게임 콘텐츠 데이터 + getGameContent() + getRelatedGames() |
| 2 | `components/game/game-content-section.tsx` | CREATE | FR-02, FR-04 | GameContentSection + RelatedGames 서버 컴포넌트 |
| 3 | `app/game/[slug]/page.tsx` | EDIT | FR-03 | import 추가 + GameContentSection + RelatedGames 삽입 |

---

## 4. 구현 순서

```
Step 1: FR-01 → lib/game-content.ts 생성 (타입 + 6개 데이터 + 헬퍼 함수)
Step 2: FR-02 → components/game/game-content-section.tsx 생성 (GameContentSection)
Step 3: FR-04 → 같은 파일에 RelatedGames 컴포넌트 추가
Step 4: FR-03 → app/game/[slug]/page.tsx 수정 (import + 렌더링)
Step 5: 빌드 + 검증
```

---

## 5. 검증 체크리스트

- [ ] `pnpm build` 성공 (0 errors)
- [ ] `pnpm lint` 통과
- [ ] `out/game/dice.html`: H2 "게임 소개", "플레이 방법", "결과 해석 가이드", "알아두면 재미있는 이야기", "자주 묻는 질문" 텍스트 존재
- [ ] `out/game/lotto.html`: 동일한 5개 H2 섹션 텍스트 존재
- [ ] `out/game/animal-face.html`: 동일한 5개 H2 섹션 텍스트 존재
- [ ] `out/game/reaction.html`: 동일한 5개 H2 섹션 텍스트 존재
- [ ] `out/game/color-sense.html`: 동일한 5개 H2 섹션 텍스트 존재
- [ ] `out/game/color-memory.html`: 동일한 5개 H2 섹션 텍스트 존재
- [ ] 각 게임 HTML에서 콘텐츠 섹션 한글 텍스트 1000자 이상
- [ ] 각 게임 페이지에 "다른 게임도 즐겨보세요" 섹션 + 3개 링크 존재
- [ ] `<details>/<summary>` FAQ 아코디언 키보드 접근성 (Enter/Space로 토글)
- [ ] 관련 게임 링크가 `/game/{slug}` 형식의 유효한 내부 링크
