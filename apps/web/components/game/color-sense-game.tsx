"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// ── Types ──

type Phase = "idle" | "playing" | "correct" | "wrong" | "timeout" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface RoundResult {
  round: number;
  score: number;
}

interface HistoryItem {
  id: number;
  totalScore: number;
  grade: Grade;
  title: string;
  rounds: number;
}

interface ColorData {
  baseColor: string;
  diffColor: string;
  diffIndex: number;
  gridSize: number;
}

// ── Constants ──

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 10000;
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "테트라크로맷", min: 900 },
  { grade: "A", title: "예술가의 눈", min: 700 },
  { grade: "B", title: "날카로운 감각", min: 500 },
  { grade: "C", title: "평범한 시력", min: 300 },
  { grade: "D", title: "조금 더 집중!", min: 100 },
  { grade: "F", title: "색맹 의심...", min: 0 },
];

function getGrade(totalScore: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => totalScore >= g.min);
  return info ?? { grade: "F", title: "색맹 의심..." };
}

function generateColors(round: number): ColorData {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20);
  const lightness = 50 + Math.floor(Math.random() * 10);

  let hueDiff: number;
  if (round <= 3) {
    hueDiff = 30 - (round - 1) * 5;
  } else if (round <= 6) {
    hueDiff = 15 - (round - 4) * 2.5;
  } else {
    hueDiff = Math.max(8 - (round - 7) * 1.5, 3);
  }

  const direction = Math.random() > 0.5 ? 1 : -1;
  const diffHue = (hue + hueDiff * direction + 360) % 360;

  let gridSize: number;
  if (round <= 3) gridSize = 2;
  else if (round <= 6) gridSize = 3;
  else gridSize = 4;

  const totalTiles = gridSize * gridSize;
  const diffIndex = Math.floor(Math.random() * totalTiles);

  return {
    baseColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    diffColor: `hsl(${diffHue}, ${saturation}%, ${lightness}%)`,
    diffIndex,
    gridSize,
  };
}

// ── Component ──

export function ColorSenseGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [colors, setColors] = useState<ColorData>({
    baseColor: "",
    diffColor: "",
    diffIndex: 0,
    gridSize: 2,
  });
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const roundRef = useRef(1);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const startRound = useCallback(
    (currentRound: number) => {
      clearTimer();
      const newColors = generateColors(currentRound);
      setColors(newColors);
      setTimeLeft(TIME_LIMIT);
      setPhase("playing");
      startTimeRef.current = performance.now();

      timerRef.current = setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current;
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearTimer();
          const currentScore = scoreRef.current;
          const currentRoundNum = roundRef.current;
          const { grade, title } = getGrade(currentScore);
          setHistory((prev) => [
            {
              id: prev.length + 1,
              totalScore: currentScore,
              grade,
              title,
              rounds: currentRoundNum - 1,
            },
            ...prev.slice(0, 9),
          ]);
          setPhase("timeout");
        }
      }, 100);
    },
    [clearTimer],
  );

  const startGame = useCallback(() => {
    clearTimer();
    clearFeedbackTimer();
    setRound(1);
    setScore(0);
    setRoundResults([]);
    scoreRef.current = 0;
    roundRef.current = 1;
    startRound(1);
  }, [clearTimer, clearFeedbackTimer, startRound]);

  const handleTileClick = useCallback(
    (index: number) => {
      if (phase !== "playing") return;

      clearTimer();

      if (index === colors.diffIndex) {
        const elapsed = performance.now() - startTimeRef.current;
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        const roundScore = Math.round((remaining / TIME_LIMIT) * 100);

        const newScore = scoreRef.current + roundScore;
        setScore(newScore);
        scoreRef.current = newScore;
        setLastRoundScore(roundScore);
        setRoundResults((prev) => [...prev, { round, score: roundScore }]);
        setPhase("correct");

        feedbackTimerRef.current = setTimeout(() => {
          if (roundRef.current >= TOTAL_ROUNDS) {
            const { grade, title } = getGrade(newScore);
            setHistory((prev) => [
              {
                id: prev.length + 1,
                totalScore: newScore,
                grade,
                title,
                rounds: TOTAL_ROUNDS,
              },
              ...prev.slice(0, 9),
            ]);
            setPhase("result");
          } else {
            const nextRound = roundRef.current + 1;
            setRound(nextRound);
            roundRef.current = nextRound;
            startRound(nextRound);
          }
        }, 800);
      } else {
        const currentScore = scoreRef.current;
        const currentRound = roundRef.current;
        const { grade, title } = getGrade(currentScore);
        setHistory((prev) => [
          {
            id: prev.length + 1,
            totalScore: currentScore,
            grade,
            title,
            rounds: currentRound - 1,
          },
          ...prev.slice(0, 9),
        ]);
        setPhase("wrong");
      }
    },
    [phase, colors.diffIndex, round, startRound, clearTimer],
  );

  useEffect(() => {
    return () => {
      clearTimer();
      clearFeedbackTimer();
    };
  }, [clearTimer, clearFeedbackTimer]);

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center leading-relaxed text-text-secondary">
          여러 타일 중 다른 색을 찾아 클릭하세요!
          <br />
          라운드가 올라갈수록 색 차이가 줄어듭니다.
          <br />
          10라운드를 모두 통과해보세요!
        </p>
        <Button onClick={startGame} size="lg" className="mt-8">
          시작하기
        </Button>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const { grade, title } = getGrade(score);

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASING }}
          className="font-heading text-7xl font-bold sm:text-9xl"
        >
          {grade}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASING }}
          className="mt-3 text-xl text-text-secondary sm:text-2xl"
        >
          {title}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="font-heading text-3xl font-bold tracking-[-0.02em]">
            {score}
            <span className="ml-1 text-lg text-text-muted">점</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 flex w-full max-w-xs flex-wrap justify-center gap-2"
        >
          {roundResults.map((r, i) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05, ease: EASING }}
              className="flex w-14 flex-col items-center border border-border/60 py-2"
            >
              <span className="text-[11px] text-text-muted">R{r.round}</span>
              <span className="text-sm font-bold">{r.score}</span>
            </motion.div>
          ))}
        </motion.div>

        <Button onClick={startGame} size="lg" className="mt-8">
          다시 도전
        </Button>

        {history.length > 0 && (
          <div className="mt-12 w-full max-w-xs">
            <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
              History
            </p>
            <div className="mt-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm"
                >
                  <span className="text-text-muted">#{item.id}</span>
                  <span className="font-bold">{item.grade}</span>
                  <span className="text-text-secondary">{item.title}</span>
                  <span className="text-text-muted">{item.rounds}R</span>
                  <span>{item.totalScore}점</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── wrong / timeout (game over) ──
  if (phase === "wrong" || phase === "timeout") {
    const { grade, title } = getGrade(score);

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, x: [-5, 5, -3, 3, 0] }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold sm:text-4xl"
        >
          {phase === "wrong" ? "틀렸습니다!" : "시간 초과!"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="font-heading text-5xl font-bold">{grade}</p>
          <p className="mt-2 text-lg text-text-secondary">{title}</p>
          <p className="mt-3 text-text-muted">
            총 점수: {score}점 &middot; {round - 1}라운드 클리어
          </p>
        </motion.div>

        {roundResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-6 flex w-full max-w-xs flex-wrap justify-center gap-2"
          >
            {roundResults.map((r, i) => (
              <motion.div
                key={r.round}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, ease: EASING }}
                className="flex w-14 flex-col items-center border border-border/60 py-2"
              >
                <span className="text-[11px] text-text-muted">R{r.round}</span>
                <span className="text-sm font-bold">{r.score}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Button onClick={startGame} size="lg" className="mt-8">
          다시 도전
        </Button>

        {history.length > 0 && (
          <div className="mt-12 w-full max-w-xs">
            <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
              History
            </p>
            <div className="mt-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm"
                >
                  <span className="text-text-muted">#{item.id}</span>
                  <span className="font-bold">{item.grade}</span>
                  <span className="text-text-secondary">{item.title}</span>
                  <span className="text-text-muted">{item.rounds}R</span>
                  <span>{item.totalScore}점</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── playing / correct ──
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-sm items-center justify-between text-sm">
        <span className="text-text-muted">
          Round {round} / {TOTAL_ROUNDS}
        </span>
        <span className="font-bold">
          {score}
          <span className="ml-1 text-text-muted">점</span>
        </span>
      </div>

      <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-border/30">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${(timeLeft / TIME_LIMIT) * 100}%`,
            backgroundColor:
              timeLeft > 5000
                ? "#22c55e"
                : timeLeft > 2000
                  ? "#eab308"
                  : "#ef4444",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === "correct" ? (
          <motion.div
            key="correct"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASING }}
            className="mt-8 flex flex-col items-center"
          >
            <p className="text-3xl font-bold text-emerald-400 sm:text-4xl">
              정답!
            </p>
            <p className="mt-2 text-lg text-text-secondary">
              +{lastRoundScore}점
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`grid-${round}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 w-full max-w-sm"
          >
            <div
              className="mx-auto grid gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${colors.gridSize}, 1fr)`,
              }}
            >
              {Array.from({
                length: colors.gridSize * colors.gridSize,
              }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleTileClick(i)}
                  className="aspect-square cursor-pointer rounded-lg"
                  style={{
                    backgroundColor:
                      i === colors.diffIndex
                        ? colors.diffColor
                        : colors.baseColor,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.3,
                    ease: EASING,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`타일 ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
