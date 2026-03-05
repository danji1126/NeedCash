"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShareResult } from "@/components/game/share-result";

// ── Types ──

type Phase = "idle" | "quiz" | "result";
type PersonalityType = "explorer" | "creator" | "analyst" | "connector";

interface Question {
  text: string;
  options: { text: string; weights: Record<PersonalityType, number> }[];
}

// ── Constants ──

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

const PERSONALITY_TYPES: Record<
  PersonalityType,
  { name: string; emoji: string; title: string; description: string; traits: string[] }
> = {
  explorer: {
    name: "탐험가",
    emoji: "🧭",
    title: "호기심 가득한 탐험가",
    description:
      "새로운 경험과 도전을 즐기며, 미지의 세계에 대한 끝없는 호기심을 가진 당신!",
    traits: ["모험심", "적응력", "창의성", "독립심"],
  },
  creator: {
    name: "창작자",
    emoji: "🎨",
    title: "영감 넘치는 창작자",
    description:
      "독창적인 아이디어로 새로운 것을 만들어내며, 예술적 감각이 뛰어난 당신!",
    traits: ["상상력", "표현력", "감수성", "직관력"],
  },
  analyst: {
    name: "분석가",
    emoji: "🔬",
    title: "냉철한 분석가",
    description:
      "논리적 사고와 체계적 분석으로 문제를 해결하며, 데이터를 사랑하는 당신!",
    traits: ["논리력", "집중력", "정확성", "전략적사고"],
  },
  connector: {
    name: "연결자",
    emoji: "🤝",
    title: "따뜻한 연결자",
    description:
      "사람들 사이의 관계를 소중히 여기며, 공감과 소통의 달인인 당신!",
    traits: ["공감력", "소통력", "리더십", "협동심"],
  },
};

const QUESTIONS: Question[] = [
  {
    text: "주말에 자유 시간이 생겼을 때, 가장 끌리는 활동은?",
    options: [
      { text: "가보지 않은 동네를 산책하며 탐험하기", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "카페에서 그림 그리기나 글쓰기", weights: { explorer: 0, creator: 3, analyst: 1, connector: 0 } },
      { text: "관심 분야의 다큐멘터리나 강의 시청", weights: { explorer: 1, creator: 0, analyst: 3, connector: 0 } },
      { text: "친구들과 만나서 수다 떨기", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "팀 프로젝트에서 당신이 자연스럽게 맡게 되는 역할은?",
    options: [
      { text: "새로운 방향이나 아이디어를 제안하는 사람", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "독창적인 컨셉이나 디자인을 담당하는 사람", weights: { explorer: 0, creator: 3, analyst: 0, connector: 1 } },
      { text: "자료 조사와 데이터 분석을 맡는 사람", weights: { explorer: 0, creator: 0, analyst: 3, connector: 1 } },
      { text: "팀원들 의견을 조율하고 분위기를 이끄는 사람", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "스트레스를 받을 때 주로 하는 행동은?",
    options: [
      { text: "혼자 여행이나 드라이브를 떠난다", weights: { explorer: 3, creator: 0, analyst: 1, connector: 0 } },
      { text: "음악을 듣거나 창작 활동에 몰두한다", weights: { explorer: 0, creator: 3, analyst: 0, connector: 1 } },
      { text: "문제의 원인을 분석하고 해결책을 찾는다", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "신뢰하는 사람에게 이야기를 나눈다", weights: { explorer: 0, creator: 1, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "서점에서 가장 먼저 눈이 가는 코너는?",
    options: [
      { text: "여행기, 모험 에세이", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "예술, 사진, 디자인 서적", weights: { explorer: 0, creator: 3, analyst: 0, connector: 0 } },
      { text: "과학, 기술, 경제 분석서", weights: { explorer: 1, creator: 0, analyst: 3, connector: 0 } },
      { text: "심리학, 자기계발, 인간관계 책", weights: { explorer: 0, creator: 0, analyst: 1, connector: 3 } },
    ],
  },
  {
    text: "새로운 것을 배울 때 선호하는 방식은?",
    options: [
      { text: "직접 부딪혀보며 체험으로 배운다", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "자유롭게 실험하고 나만의 방식을 찾는다", weights: { explorer: 1, creator: 3, analyst: 0, connector: 0 } },
      { text: "체계적인 교재와 단계별 커리큘럼을 따른다", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "스터디 그룹이나 멘토와 함께 배운다", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "가장 보람을 느끼는 순간은?",
    options: [
      { text: "낯선 곳에서 새로운 경험을 할 때", weights: { explorer: 3, creator: 0, analyst: 0, connector: 1 } },
      { text: "나만의 작품이나 결과물을 완성했을 때", weights: { explorer: 0, creator: 3, analyst: 1, connector: 0 } },
      { text: "복잡한 문제의 핵심을 꿰뚫었을 때", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "누군가에게 도움이 되었다는 말을 들을 때", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "친구가 고민을 상담할 때 당신의 반응은?",
    options: [
      { text: "\"기분 전환이 필요해! 같이 나가자\"", weights: { explorer: 3, creator: 0, analyst: 0, connector: 1 } },
      { text: "\"네 감정이 어떤지 충분히 표현해봐\"", weights: { explorer: 0, creator: 3, analyst: 0, connector: 1 } },
      { text: "\"상황을 정리해보자. 원인이 뭘까?\"", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "\"내가 옆에 있을게. 언제든 얘기해\"", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "이상적인 업무 환경은?",
    options: [
      { text: "자유롭고 변화가 많은 환경", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "창의성을 발휘할 수 있는 자율적인 공간", weights: { explorer: 1, creator: 3, analyst: 0, connector: 0 } },
      { text: "체계적이고 효율적인 시스템이 갖춰진 곳", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "팀워크와 소통이 활발한 분위기", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "SNS에서 주로 올리는 게시물은?",
    options: [
      { text: "여행지, 맛집 등 새로운 장소 사진", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "직접 만든 작품이나 취미 활동", weights: { explorer: 0, creator: 3, analyst: 0, connector: 0 } },
      { text: "관심 분야의 정보나 인사이트 공유", weights: { explorer: 0, creator: 0, analyst: 3, connector: 1 } },
      { text: "친구들과의 추억, 일상 공유", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "갑자기 100만원이 생긴다면?",
    options: [
      { text: "즉흥 여행을 떠난다", weights: { explorer: 3, creator: 0, analyst: 0, connector: 1 } },
      { text: "배우고 싶던 악기나 장비를 산다", weights: { explorer: 0, creator: 3, analyst: 0, connector: 0 } },
      { text: "투자하거나 알뜰하게 계획을 세운다", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "소중한 사람들에게 선물을 한다", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "꿈속에서 자주 등장하는 장면은?",
    options: [
      { text: "미지의 세계를 탐험하는 모험", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "환상적이고 비현실적인 풍경", weights: { explorer: 1, creator: 3, analyst: 0, connector: 0 } },
      { text: "퍼즐을 풀거나 수수께끼를 해결하는 장면", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "가족이나 친구들과 함께하는 따뜻한 장면", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "모임에서 당신의 포지션은?",
    options: [
      { text: "새로운 활동이나 장소를 제안하는 사람", weights: { explorer: 3, creator: 0, analyst: 0, connector: 1 } },
      { text: "독특한 아이디어로 분위기를 띄우는 사람", weights: { explorer: 0, creator: 3, analyst: 0, connector: 1 } },
      { text: "조용히 관찰하다 핵심을 짚는 사람", weights: { explorer: 0, creator: 0, analyst: 3, connector: 0 } },
      { text: "모두가 즐거운지 살피며 챙기는 사람", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "가장 좋아하는 영화 장르는?",
    options: [
      { text: "어드벤처, 액션", weights: { explorer: 3, creator: 0, analyst: 1, connector: 0 } },
      { text: "판타지, 예술 영화", weights: { explorer: 0, creator: 3, analyst: 0, connector: 1 } },
      { text: "미스터리, SF, 스릴러", weights: { explorer: 1, creator: 0, analyst: 3, connector: 0 } },
      { text: "로맨스, 가족 드라마", weights: { explorer: 0, creator: 1, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "인생에서 가장 중요하다고 생각하는 것은?",
    options: [
      { text: "자유와 새로운 경험", weights: { explorer: 3, creator: 1, analyst: 0, connector: 0 } },
      { text: "자기표현과 창의적 성취", weights: { explorer: 0, creator: 3, analyst: 0, connector: 0 } },
      { text: "지식과 성장", weights: { explorer: 1, creator: 0, analyst: 3, connector: 0 } },
      { text: "사랑과 인간관계", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
  {
    text: "나를 한마디로 표현한다면?",
    options: [
      { text: "\"끊임없이 움직이는 바람\"", weights: { explorer: 3, creator: 0, analyst: 0, connector: 1 } },
      { text: "\"세상에 없던 것을 만드는 사람\"", weights: { explorer: 0, creator: 3, analyst: 1, connector: 0 } },
      { text: "\"모든 것의 이유를 찾는 탐정\"", weights: { explorer: 1, creator: 0, analyst: 3, connector: 0 } },
      { text: "\"사람 사이의 다리를 놓는 사람\"", weights: { explorer: 0, creator: 0, analyst: 0, connector: 3 } },
    ],
  },
];

const TYPE_KEYS: PersonalityType[] = ["explorer", "creator", "analyst", "connector"];

// ── Component ──

export function PersonalityQuiz() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<PersonalityType, number>>({
    explorer: 0,
    creator: 0,
    analyst: 0,
    connector: 0,
  });
  const [direction, setDirection] = useState(1);

  const handleStart = useCallback(() => {
    setPhase("quiz");
    setCurrentQuestion(0);
    setScores({ explorer: 0, creator: 0, analyst: 0, connector: 0 });
    setDirection(1);
  }, []);

  const handleAnswer = useCallback(
    (weights: Record<PersonalityType, number>) => {
      const newScores = { ...scores };
      for (const key of TYPE_KEYS) {
        newScores[key] += weights[key];
      }
      setScores(newScores);

      if (currentQuestion < QUESTIONS.length - 1) {
        setDirection(1);
        setCurrentQuestion((prev) => prev + 1);
      } else {
        setPhase("result");
      }
    },
    [scores, currentQuestion],
  );

  const getResultType = useCallback((): PersonalityType => {
    let maxType: PersonalityType = "explorer";
    let maxScore = -1;
    for (const key of TYPE_KEYS) {
      if (scores[key] > maxScore) {
        maxScore = scores[key];
        maxType = key;
      }
    }
    return maxType;
  }, [scores]);

  const getTotalScore = useCallback((): number => {
    return TYPE_KEYS.reduce((sum, key) => sum + scores[key], 0);
  }, [scores]);

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center leading-relaxed text-text-secondary">
          15개의 질문에 답하고
          <br />
          나의 성격 유형을 알아보세요!
          <br />
          탐험가, 창작자, 분석가, 연결자 중
          <br />
          당신은 어떤 유형일까요?
        </p>

        <div className="mx-auto mt-8 grid w-full max-w-xs grid-cols-2 gap-3">
          {TYPE_KEYS.map((key) => (
            <div
              key={key}
              className="flex flex-col items-center rounded-2xl border border-border/60 p-4"
            >
              <span className="text-3xl">{PERSONALITY_TYPES[key].emoji}</span>
              <span className="mt-2 text-sm font-bold">{PERSONALITY_TYPES[key].name}</span>
            </div>
          ))}
        </div>

        <Button onClick={handleStart} size="lg" className="mt-8">
          시작하기
        </Button>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const resultType = getResultType();
    const personality = PERSONALITY_TYPES[resultType];
    const total = getTotalScore();

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASING }}
          className="text-7xl sm:text-9xl"
        >
          {personality.emoji}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASING }}
          className="mt-3 font-heading text-2xl font-bold sm:text-3xl"
        >
          {personality.name}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASING }}
          className="mt-1 text-lg text-text-secondary sm:text-xl"
        >
          {personality.title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-4 max-w-xs text-center text-sm leading-relaxed text-text-muted"
        >
          {personality.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {personality.traits.map((trait, i) => (
            <motion.span
              key={trait}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.3, ease: EASING }}
              className="rounded-full border border-border/60 px-3 py-1 text-sm text-text-secondary"
            >
              {trait}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-8 w-full max-w-xs"
        >
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            유형별 점수
          </p>
          <div className="mt-3 space-y-3">
            {TYPE_KEYS.map((key) => {
              const pct = total > 0 ? Math.round((scores[key] / total) * 100) : 0;
              const isResult = key === resultType;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isResult ? "font-bold" : "text-text-muted"}>
                      {PERSONALITY_TYPES[key].emoji} {PERSONALITY_TYPES[key].name}
                    </span>
                    <span className={isResult ? "font-bold" : "text-text-muted"}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.8, duration: 0.6, ease: EASING }}
                      className={`h-full rounded-full ${
                        isResult ? "bg-text-primary" : "bg-text-muted/40"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <ShareResult
          game="성격 유형 테스트"
          title="당신의 성격 유형은?"
          lines={[
            `유형: ${personality.emoji} ${personality.name}`,
            `"${personality.title}"`,
          ]}
        />

        <Button onClick={handleStart} size="lg" className="mt-6">
          다시 하기
        </Button>
      </div>
    );
  }

  // ── quiz ──
  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            {currentQuestion + 1} / {QUESTIONS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
          <motion.div
            className="h-full rounded-full bg-text-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: EASING }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentQuestion}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.3, ease: EASING }}
          className="mt-8 w-full max-w-sm"
        >
          <p className="text-center text-lg font-bold leading-relaxed sm:text-xl">
            {question.text}
          </p>

          <div className="mt-6 space-y-3">
            {question.options.map((option, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.3, ease: EASING }}
                onClick={() => handleAnswer(option.weights)}
                className="w-full cursor-pointer rounded-xl border border-border/60 px-4 py-3.5 text-left text-sm leading-relaxed text-text-secondary transition-colors hover:border-text-muted hover:bg-surface-hover"
                whileTap={{ scale: 0.98 }}
              >
                {option.text}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
