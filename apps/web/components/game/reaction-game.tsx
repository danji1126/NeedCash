"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// ── Types ──

type Phase = "idle" | "waiting" | "go" | "tooEarly" | "roundResult" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

interface RoundResult {
  round: number;
  time: number;
}

interface HistoryItem {
  id: number;
  average: number;
  grade: Grade;
  title: string;
  rounds: number;
}

// ── Constants ──

const DEFAULT_ROUNDS = 5;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

const GRADES: { grade: Grade; title: string; max: number }[] = [
  { grade: "S", title: "번개 반사신경", max: 200 },
  { grade: "A", title: "매의 눈", max: 250 },
  { grade: "B", title: "민첩한 고양이", max: 300 },
  { grade: "C", title: "평범한 인간", max: 400 },
  { grade: "D", title: "느긋한 거북이", max: 500 },
  { grade: "F", title: "졸린 나무늘보", max: Infinity },
];

function getGrade(ms: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => ms < g.max);
  return info ?? { grade: "F", title: "졸린 나무늘보" };
}

const BG_COLORS: Record<string, string> = {
  waiting: "#dc2626",
  go: "#16a34a",
  tooEarly: "#d97706",
  roundResult: "#1e293b",
};

// ── Component ──

export function ReactionGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUNDS);
  const [roundInput, setRoundInput] = useState(String(DEFAULT_ROUNDS));
  const [round, setRound] = useState(0);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    clearTimer();
    setPhase("waiting");

    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }, [clearTimer]);

  const resetGame = useCallback(() => {
    clearTimer();
    const parsed = parseInt(roundInput, 10);
    const clamped = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, isNaN(parsed) ? DEFAULT_ROUNDS : parsed));
    setTotalRounds(clamped);
    setRoundInput(String(clamped));
    setRound(0);
    setRounds([]);
    setCurrentTime(0);
    roundRef.current = 0;
    startRound();
  }, [clearTimer, startRound, roundInput]);

  const handleExit = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setRound(0);
    setRounds([]);
    setCurrentTime(0);
    roundRef.current = 0;
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (phase === "idle" || phase === "result") return;

    if (phase === "waiting") {
      clearTimer();
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
      const newRounds: RoundResult[] = [...rounds, { round: newRound, time: elapsed }];
      setRounds(newRounds);
      setRound(newRound);
      roundRef.current = newRound;

      if (newRound >= totalRounds) {
        const times = newRounds.map((r) => r.time);
        const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const { grade, title } = getGrade(average);

        setHistory((prev) => [
          { id: prev.length + 1, average, grade, title, rounds: totalRounds },
          ...prev.slice(0, 9),
        ]);
        setPhase("result");
      } else {
        setPhase("roundResult");
        timeoutRef.current = setTimeout(() => {
          startRound();
        }, 1500);
      }
      return;
    }

    if (phase === "roundResult") {
      clearTimer();
      startRound();
    }
  }, [phase, rounds, totalRounds, clearTimer, startRound]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-text-secondary leading-relaxed">
          화면이 초록색으로 변하면
          <br />
          최대한 빠르게 클릭하세요!
        </p>
        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="round-input" className="text-sm text-text-muted">
            측정 횟수
          </label>
          <div className="flex items-center">
            <button
              onClick={() => {
                const v = Math.max(MIN_ROUNDS, (parseInt(roundInput, 10) || DEFAULT_ROUNDS) - 1);
                setRoundInput(String(v));
              }}
              className="flex h-9 w-9 items-center justify-center rounded-l-md border border-border/60 text-text-secondary transition-colors hover:bg-surface-hover"
              aria-label="횟수 줄이기"
            >
              -
            </button>
            <input
              id="round-input"
              type="number"
              min={MIN_ROUNDS}
              max={MAX_ROUNDS}
              value={roundInput}
              onChange={(e) => setRoundInput(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(roundInput, 10);
                const clamped = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, isNaN(parsed) ? DEFAULT_ROUNDS : parsed));
                setRoundInput(String(clamped));
              }}
              className="h-9 w-12 border-y border-border/60 bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => {
                const v = Math.min(MAX_ROUNDS, (parseInt(roundInput, 10) || DEFAULT_ROUNDS) + 1);
                setRoundInput(String(v));
              }}
              className="flex h-9 w-9 items-center justify-center rounded-r-md border border-border/60 text-text-secondary transition-colors hover:bg-surface-hover"
              aria-label="횟수 늘리기"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          {parseInt(roundInput, 10) || DEFAULT_ROUNDS}번 측정한 평균으로 등급을 매겨드려요.
        </p>
        <Button onClick={resetGame} size="lg" className="mt-6">
          시작하기
        </Button>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const times = rounds.map((r) => r.time);
    const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const best = Math.min(...times);
    const worst = Math.max(...times);
    const { grade, title } = getGrade(average);

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASING }}
          className="text-7xl font-bold font-heading sm:text-9xl"
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
          <p className="text-3xl font-bold font-heading tracking-[-0.02em]">
            {average}
            <span className="ml-1 text-lg text-text-muted">ms</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            최고 {best}ms &middot; 최저 {worst}ms
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 flex w-full max-w-xs flex-wrap justify-center gap-2"
        >
          {rounds.map((r, i) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05, ease: EASING }}
              className="flex w-14 flex-col items-center border border-border/60 py-2"
            >
              <span className="text-[11px] text-text-muted">R{r.round}</span>
              <span className="text-sm font-bold">{r.time}</span>
            </motion.div>
          ))}
        </motion.div>

        <Button onClick={resetGame} size="lg" className="mt-8">
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
                  <span>{item.average}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── game phases (fullscreen overlay) ──
  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer select-none flex-col items-center justify-center"
      onPointerDown={handleClick}
      animate={{ backgroundColor: BG_COLORS[phase] ?? "#1e293b" }}
      transition={{ duration: 0.15 }}
    >
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          handleExit();
        }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80 sm:right-6 sm:top-6"
        aria-label="게임 종료"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <AnimatePresence mode="wait">
        {phase === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center text-white"
          >
            <p className="text-lg text-white/60">
              Round {round + 1} / {totalRounds}
            </p>
            <p className="mt-6 text-2xl font-bold sm:text-3xl">
              초록색이 되면 클릭!
            </p>
            <p className="mt-3 text-white/50">기다리세요...</p>
          </motion.div>
        )}

        {phase === "go" && (
          <motion.div
            key="go"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex flex-col items-center text-white"
          >
            <p className="text-6xl font-bold font-heading sm:text-8xl">
              클릭!
            </p>
          </motion.div>
        )}

        {phase === "tooEarly" && (
          <motion.div
            key="tooEarly"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-white"
          >
            <p className="text-3xl font-bold sm:text-4xl">너무 빨라요!</p>
            <p className="mt-3 text-white/70">
              초록색이 될 때까지 기다리세요
            </p>
          </motion.div>
        )}

        {phase === "roundResult" && (
          <motion.div
            key="roundResult"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center text-white"
          >
            <p className="text-lg text-white/60">
              Round {round} / {totalRounds}
            </p>
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.1, 1] }}
              transition={{ duration: 0.4, ease: EASING }}
              className="mt-4 text-6xl font-bold font-heading sm:text-8xl"
            >
              {currentTime}
              <span className="ml-2 text-2xl text-white/60 sm:text-3xl">ms</span>
            </motion.p>
            <p className="mt-6 text-white/50">클릭하여 다음 라운드</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
