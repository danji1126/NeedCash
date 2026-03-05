"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShareResult } from "@/components/game/share-result";

// ── Types ──

type Phase = "idle" | "countdown" | "playing" | "result";
type Difficulty = "easy" | "medium" | "hard";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface Problem {
  a: number;
  b: number;
  operator: string;
  answer: number;
}

interface HistoryItem {
  id: number;
  score: number;
  grade: Grade;
  title: string;
  difficulty: Difficulty;
}

// ── Constants ──

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
const TIME_LIMIT = 60;

const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "수학 천재", min: 30 },
  { grade: "A", title: "암산 달인", min: 20 },
  { grade: "B", title: "계산기 불필요", min: 15 },
  { grade: "C", title: "평범한 계산력", min: 10 },
  { grade: "D", title: "더 연습하세요", min: 5 },
  { grade: "F", title: "계산기를 찾아주세요", min: 0 },
];

function getGrade(score: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => score >= g.min);
  return info ?? { grade: "F", title: "계산기를 찾아주세요" };
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { range: number; operators: string[]; label: string }
> = {
  easy: { range: 20, operators: ["+", "−"], label: "쉬움" },
  medium: { range: 50, operators: ["+", "−", "×", "÷"], label: "보통" },
  hard: { range: 100, operators: ["+", "−", "×", "÷"], label: "어려움" },
};

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateProblem(difficulty: Difficulty): Problem {
  const config = DIFFICULTY_CONFIG[difficulty];
  const operator =
    config.operators[Math.floor(Math.random() * config.operators.length)];

  let a: number;
  let b: number;
  let answer: number;

  switch (operator) {
    case "+": {
      a = randInt(1, config.range);
      b = randInt(1, config.range);
      answer = a + b;
      break;
    }
    case "−": {
      a = randInt(1, config.range);
      b = randInt(1, a);
      answer = a - b;
      break;
    }
    case "×": {
      const mulMax =
        difficulty === "easy" ? 12 : difficulty === "medium" ? 15 : 20;
      a = randInt(1, mulMax);
      b = randInt(1, mulMax);
      answer = a * b;
      break;
    }
    case "÷": {
      const divMax = difficulty === "hard" ? 20 : 10;
      b = randInt(2, divMax);
      answer = randInt(1, config.range);
      a = b * answer;
      break;
    }
    default: {
      a = randInt(1, config.range);
      b = randInt(1, config.range);
      answer = a + b;
    }
  }

  return { a, b, operator, answer };
}

// ── Component ──

export function MathGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [countdown, setCountdown] = useState(3);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const startTimeRef = useRef(0);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    if (feedbackRef.current) {
      clearTimeout(feedbackRef.current);
      feedbackRef.current = null;
    }
  }, []);

  const nextProblem = useCallback(
    (diff: Difficulty) => {
      setProblem(generateProblem(diff));
      setInput("");
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [],
  );

  const endGame = useCallback(() => {
    clearAllTimers();
    const finalScore = scoreRef.current;
    const finalAttempts = attemptsRef.current;
    const finalCorrect = correctRef.current;
    setScore(finalScore);
    setTotalAttempts(finalAttempts);
    setCorrectCount(finalCorrect);

    const { grade, title } = getGrade(finalScore);
    setHistory((prev) => [
      {
        id: prev.length + 1,
        score: finalScore,
        grade,
        title,
        difficulty,
      },
      ...prev.slice(0, 9),
    ]);
    setPhase("result");
  }, [clearAllTimers, difficulty]);

  const startPlaying = useCallback(
    (diff: Difficulty) => {
      scoreRef.current = 0;
      attemptsRef.current = 0;
      correctRef.current = 0;
      setScore(0);
      setTotalAttempts(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(TIME_LIMIT);
      setPhase("playing");
      nextProblem(diff);

      startTimeRef.current = performance.now();
      timerRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearAllTimers();
          const finalScore = scoreRef.current;
          const finalAttempts = attemptsRef.current;
          const finalCorrect = correctRef.current;
          setScore(finalScore);
          setTotalAttempts(finalAttempts);
          setCorrectCount(finalCorrect);

          const { grade, title } = getGrade(finalScore);
          setHistory((prev) => [
            {
              id: prev.length + 1,
              score: finalScore,
              grade,
              title,
              difficulty: diff,
            },
            ...prev.slice(0, 9),
          ]);
          setPhase("result");
        }
      }, 100);
    },
    [clearAllTimers, nextProblem],
  );

  const startCountdown = useCallback(
    (diff: Difficulty) => {
      clearAllTimers();
      setDifficulty(diff);
      setCountdown(3);
      setPhase("countdown");

      let count = 3;
      const tick = () => {
        count -= 1;
        if (count <= 0) {
          startPlaying(diff);
        } else {
          setCountdown(count);
          countdownRef.current = setTimeout(tick, 1000);
        }
      };
      countdownRef.current = setTimeout(tick, 1000);
    },
    [clearAllTimers, startPlaying],
  );

  const handleSubmit = useCallback(() => {
    if (!problem || phase !== "playing") return;

    const parsed = parseInt(input, 10);
    if (isNaN(parsed)) return;

    attemptsRef.current += 1;
    setTotalAttempts(attemptsRef.current);

    if (parsed === problem.answer) {
      scoreRef.current += 1;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrectCount(correctRef.current);
      setStreak((prev) => prev + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    feedbackRef.current = setTimeout(() => {
      nextProblem(difficulty);
    }, 300);
  }, [problem, phase, input, difficulty, nextProblem]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center leading-relaxed text-text-secondary">
          60초 동안 최대한 많은 문제를 풀어보세요!
          <br />
          난이도를 선택하고 시작하세요.
        </p>

        <div className="mt-6 flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded border px-4 py-2 text-sm transition-colors ${
                difficulty === d
                  ? "border-text-primary bg-text-primary text-bg font-bold"
                  : "border-border/60 text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-text-muted">
          {difficulty === "easy" && "1~20 범위, 덧셈·뺄셈"}
          {difficulty === "medium" && "1~50 범위, 사칙연산"}
          {difficulty === "hard" && "1~100 범위, 사칙연산"}
        </p>

        <Button
          onClick={() => startCountdown(difficulty)}
          size="lg"
          className="mt-6"
        >
          시작하기
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
                  <span className="text-text-muted">
                    {DIFFICULTY_CONFIG[item.difficulty].label}
                  </span>
                  <span>{item.score}문제</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── countdown ──
  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASING }}
            className="font-heading text-8xl font-bold sm:text-9xl"
          >
            {countdown}
          </motion.p>
        </AnimatePresence>
        <p className="mt-4 text-text-muted">준비하세요!</p>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const { grade, title } = getGrade(score);
    const accuracy =
      totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

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
            <span className="ml-1 text-lg text-text-muted">문제</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            정확도 {accuracy}%
          </p>
        </motion.div>

        <ShareResult
          game="암산 게임"
          title={title}
          lines={[
            `등급: ${grade} · ${title}`,
            `점수: ${score}문제 (${DIFFICULTY_CONFIG[difficulty].label})`,
            `정확도: ${accuracy}%`,
          ]}
        />

        <Button
          onClick={() => startCountdown(difficulty)}
          size="lg"
          className="mt-8"
        >
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
                  <span className="text-text-muted">
                    {DIFFICULTY_CONFIG[item.difficulty].label}
                  </span>
                  <span>{item.score}문제</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── playing ──
  const timePercent = (timeLeft / TIME_LIMIT) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-sm items-center justify-between text-sm">
        <span className="text-text-muted">
          {DIFFICULTY_CONFIG[difficulty].label}
        </span>
        <span className="font-bold">
          {score}
          <span className="ml-1 text-text-muted">문제</span>
        </span>
        <span className="tabular-nums text-text-muted">
          {Math.ceil(timeLeft)}초
        </span>
      </div>

      <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-border/30">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${timePercent}%`,
            backgroundColor:
              timeLeft > 30
                ? "#22c55e"
                : timeLeft > 10
                  ? "#eab308"
                  : "#ef4444",
          }}
        />
      </div>

      {streak >= 3 && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-sm font-bold text-amber-400"
        >
          {streak} 연속 정답!
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={problem ? `${problem.a}-${problem.operator}-${problem.b}` : ""}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            x:
              feedback === "wrong"
                ? [0, -5, 5, -3, 3, 0]
                : 0,
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: EASING }}
          className="mt-8 text-center"
        >
          <p
            className={`font-heading text-4xl font-bold transition-colors duration-150 sm:text-5xl ${
              feedback === "correct"
                ? "text-emerald-400"
                : feedback === "wrong"
                  ? "text-red-400"
                  : ""
            }`}
          >
            {problem?.a} {problem?.operator} {problem?.b} = ?
          </p>
        </motion.div>
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mt-6 flex items-center gap-3"
      >
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-12 w-32 rounded border border-border/60 bg-transparent text-center text-xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          autoFocus
          placeholder="?"
        />
      </form>

      <p className="mt-3 text-sm text-text-muted">
        Enter를 눌러 제출
      </p>
    </div>
  );
}
