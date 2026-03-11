"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GameResultPanel } from "@/components/game/game-result-panel";
import { addGameHistory } from "@/lib/game-history";
import { startGameSession } from "@/lib/game-session";

// ── Types ──

type Phase = "idle" | "showing" | "input" | "correct" | "wrong" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";

// ── Constants ──

const PADS = [
  { name: "red", hsl: "hsl(0, 70%, 45%)", activeHsl: "hsl(0, 80%, 60%)" },
  { name: "green", hsl: "hsl(120, 70%, 35%)", activeHsl: "hsl(120, 80%, 50%)" },
  { name: "blue", hsl: "hsl(220, 70%, 45%)", activeHsl: "hsl(220, 80%, 60%)" },
  { name: "yellow", hsl: "hsl(50, 70%, 45%)", activeHsl: "hsl(50, 85%, 60%)" },
] as const;

const FLASH_DURATION = 500;
const FLASH_GAP = 300;
const ROUND_DELAY = 600;
const CORRECT_DELAY = 800;
const WRONG_DELAY = 1500;

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "천재적 기억력", min: 15 },
  { grade: "A", title: "비상한 두뇌", min: 12 },
  { grade: "B", title: "날카로운 집중력", min: 9 },
  { grade: "C", title: "평범한 기억력", min: 6 },
  { grade: "D", title: "조금 더 집중!", min: 3 },
  { grade: "F", title: "금붕어...", min: 0 },
];

function getGrade(round: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => round >= g.min);
  return info ?? { grade: "F", title: "금붕어..." };
}

function createInitialSequence(): number[] {
  return [
    Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 4),
  ];
}

function extendSequence(prev: number[]): number[] {
  const next = Math.floor(Math.random() * 4);
  return [...prev, next];
}

// ── Component ──

export function ColorMemoryGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundRef = useRef(1);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  const playSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setActiveIndex(null);

    clearAllTimeouts();

    seq.forEach((padIndex, i) => {
      const onTimeout = setTimeout(() => {
        setActiveIndex(padIndex);
      }, ROUND_DELAY + i * (FLASH_DURATION + FLASH_GAP));

      const offTimeout = setTimeout(() => {
        setActiveIndex(null);
      }, ROUND_DELAY + i * (FLASH_DURATION + FLASH_GAP) + FLASH_DURATION);

      timeoutRefs.current.push(onTimeout, offTimeout);
    });

    const totalTime = ROUND_DELAY + seq.length * (FLASH_DURATION + FLASH_GAP);
    const completeTimeout = setTimeout(() => {
      setPhase("input");
      setPlayerInput([]);
    }, totalTime);

    timeoutRefs.current.push(completeTimeout);
  }, [clearAllTimeouts]);

  const startGame = useCallback(async () => {
    clearAllTimeouts();
    clearFeedbackTimer();
    setRound(1);
    roundRef.current = 1;
    setPlayerInput([]);

    const sid = await startGameSession("color-memory");
    setSessionId(sid);

    const initialSeq = createInitialSequence();
    setSequence(initialSeq);
    playSequence(initialSeq);
  }, [clearAllTimeouts, clearFeedbackTimer, playSequence]);

  const handlePadClick = useCallback(
    (padIndex: number) => {
      if (phase !== "input") return;

      const newInput = [...playerInput, padIndex];
      setPlayerInput(newInput);

      const currentPos = newInput.length - 1;
      if (newInput[currentPos] !== sequence[currentPos]) {
        clearAllTimeouts();
        const currentRound = roundRef.current;
        const clearedRound = currentRound - 1;
        const { grade, title } = getGrade(clearedRound);
        addGameHistory({
          game: "color-memory",
          score: clearedRound,
          grade,
          title,
          metadata: { sequenceLength: sequence.length },
        });
        setPhase("wrong");

        feedbackTimerRef.current = setTimeout(() => {
          setPhase("result");
        }, WRONG_DELAY);
        return;
      }

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
    },
    [phase, playerInput, sequence, playSequence, clearAllTimeouts],
  );

  const handleQuit = useCallback(() => {
    clearAllTimeouts();
    clearFeedbackTimer();

    const currentRound = roundRef.current;
    const clearedRound = phase === "correct" ? currentRound : currentRound - 1;
    const { grade, title } = getGrade(clearedRound);
    addGameHistory({
      game: "color-memory",
      score: clearedRound,
      grade,
      title,
      metadata: { sequenceLength: sequence.length },
    });
    setPhase("result");
  }, [phase, sequence, clearAllTimeouts, clearFeedbackTimer]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearFeedbackTimer();
    };
  }, [clearAllTimeouts, clearFeedbackTimer]);

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center leading-relaxed text-text-secondary">
          색상 패드가 점멸하는 순서를 기억하고
          <br />
          같은 순서로 클릭하세요!
          <br />
          라운드가 올라갈수록 패턴이 길어집니다.
        </p>

        <div className="mx-auto mt-8 grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-4">
          {PADS.map((pad) => (
            <div
              key={pad.name}
              className="aspect-square rounded-2xl opacity-40"
              style={{ backgroundColor: pad.hsl }}
            />
          ))}
        </div>

        <Button onClick={startGame} size="lg" className="mt-8">
          시작하기
        </Button>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const { grade: resultGrade, title: resultTitle } = getGrade(round - 1);
    const resultRound = round - 1;

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASING }}
          className="font-heading text-7xl font-bold sm:text-9xl"
        >
          {resultGrade}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASING }}
          className="mt-3 text-xl text-text-secondary sm:text-2xl"
        >
          {resultTitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-text-muted">
            {resultRound}라운드 도달
          </p>
        </motion.div>

        <Button onClick={startGame} size="lg" className="mt-8">
          다시 도전
        </Button>

        <GameResultPanel
          game="color-memory"
          score={resultRound}
          grade={resultGrade}
          title="Color Memory"
          sessionId={sessionId}
          shareLines={[
            `등급: ${resultGrade} · ${resultTitle}`,
            `${resultRound}라운드 도달`,
          ]}
        />
      </div>
    );
  }

  // ── wrong ──
  if (phase === "wrong") {
    const PAD_EMOJIS = ["🔴", "🟢", "🔵", "🟡"];

    return (
      <div className="flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, x: [-5, 5, -3, 3, 0] }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-red-400 sm:text-4xl"
        >
          틀렸습니다!
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 text-center text-sm text-text-secondary"
        >
          <p className="text-text-muted">정답 패턴:</p>
          <p className="mt-1">{sequence.map((i) => PAD_EMOJIS[i]).join(" → ")}</p>
          <p className="mt-3 text-text-muted">당신의 입력:</p>
          <p className="mt-1">
            {playerInput.map((pi, idx) => (
              <span key={idx}>
                {idx > 0 && " → "}
                {PAD_EMOJIS[pi]}
                {pi !== sequence[idx] && " ✗"}
              </span>
            ))}
          </p>
        </motion.div>

        <p className="mt-4 animate-pulse text-xs text-text-muted">
          잠시 후 결과 화면으로 이동합니다...
        </p>
      </div>
    );
  }

  // ── showing / input / correct ──
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-xs items-center justify-between text-sm">
        <span className="text-text-muted">Round {round}</span>
        <span className="text-text-muted">패턴 길이: {sequence.length}</span>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-4">
        {PADS.map((pad, i) => (
          <motion.button
            key={pad.name}
            onClick={() => handlePadClick(i)}
            disabled={phase !== "input"}
            className="aspect-square rounded-2xl cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: activeIndex === i ? pad.activeHsl : pad.hsl,
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

      <AnimatePresence mode="wait">
        {phase === "correct" ? (
          <motion.div
            key="correct"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASING }}
            className="mt-6 text-center"
          >
            <p className="text-3xl font-bold text-emerald-400 sm:text-4xl">
              정답!
            </p>
          </motion.div>
        ) : phase === "showing" ? (
          <motion.p
            key="showing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 animate-pulse text-sm text-text-muted"
          >
            패턴을 기억하세요...
          </motion.p>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="flex justify-center gap-1.5">
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={`h-2.5 w-2.5 rounded-full ${
                    i < playerInput.length
                      ? "bg-text-primary"
                      : "bg-border/40"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-text-muted">
              {playerInput.length} / {sequence.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "showing" || phase === "input") && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={handleQuit}
          className="mt-6 text-sm text-text-muted underline hover:text-text-secondary"
        >
          그만하기
        </motion.button>
      )}
    </div>
  );
}
