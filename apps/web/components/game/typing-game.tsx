"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GameResultPanel } from "@/components/game/game-result-panel";
import { addGameHistory } from "@/lib/game-history";
import { startGameSession } from "@/lib/game-session";

// ── Types ──

type Phase = "idle" | "countdown" | "playing" | "result";
type Grade = "S" | "A" | "B" | "C" | "D" | "F";
type Lang = "ko" | "en";

// ── Constants ──

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
const TIME_LIMIT = 60;

const GRADES: { grade: Grade; title: string; min: number }[] = [
  { grade: "S", title: "타자의 신", min: 100 },
  { grade: "A", title: "번개 손가락", min: 80 },
  { grade: "B", title: "빠른 타이핑", min: 60 },
  { grade: "C", title: "평범한 속도", min: 40 },
  { grade: "D", title: "연습이 필요해요", min: 20 },
  { grade: "F", title: "초보 타이피스트", min: 0 },
];

function getGrade(wpm: number): { grade: Grade; title: string } {
  const info = GRADES.find((g) => wpm >= g.min);
  return info ?? { grade: "F", title: "초보 타이피스트" };
}

const KO_TEXTS: string[] = [
  "인공지능 기술은 우리의 일상을 빠르게 변화시키고 있으며 앞으로 더 많은 분야에서 활용될 것입니다.",
  "봄이 오면 벚꽃이 만개하고 따뜻한 바람이 불어와 사람들의 마음을 설레게 만듭니다.",
  "프로그래밍을 배우는 가장 좋은 방법은 직접 코드를 작성하고 실행해 보는 것입니다.",
  "깊은 바다 속에는 아직 발견되지 않은 수많은 생물들이 살고 있을 것으로 추정됩니다.",
  "좋은 습관을 만들기 위해서는 매일 조금씩 꾸준히 실천하는 것이 가장 중요합니다.",
  "커피 한 잔의 여유가 바쁜 하루를 보내는 현대인에게 작은 행복을 선사하기도 합니다.",
];

const EN_TEXTS: string[] = [
  "The quick brown fox jumps over the lazy dog while the sun sets behind the distant mountains.",
  "Technology continues to reshape how we work and communicate with each other every single day.",
  "Reading books is one of the best ways to expand your knowledge and improve critical thinking skills.",
  "The ocean covers more than seventy percent of the Earth surface and holds countless mysteries within.",
  "A journey of a thousand miles begins with a single step and the courage to keep moving forward.",
  "Good software is built through careful planning, clean code, and thorough testing at every stage.",
];

// ── Component ──

export function TypingGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lang, setLang] = useState<Lang>("ko");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [targetText, setTargetText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [completedTexts, setCompletedTexts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const totalCorrectRef = useRef(0);
  const totalTypedRef = useRef(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const getRandomText = useCallback(
    (currentLang: Lang) => {
      const texts = currentLang === "ko" ? KO_TEXTS : EN_TEXTS;
      return texts[Math.floor(Math.random() * texts.length)];
    },
    [],
  );

  const finishGame = useCallback(() => {
    clearAllTimers();
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const minutes = elapsed / 60;
    const correct = totalCorrectRef.current;
    const typed = totalTypedRef.current;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const accuracy = typed > 0 ? Math.round((correct / typed) * 100) : 0;
    const { grade, title } = getGrade(wpm);

    addGameHistory({
      game: "typing",
      score: wpm,
      grade,
      title,
      metadata: { accuracy, lang },
    });
    setPhase("result");
  }, [clearAllTimers, lang]);

  const startPlaying = useCallback(
    (currentLang: Lang) => {
      const text = getRandomText(currentLang);
      setTargetText(text);
      setTypedText("");
      setTotalCorrect(0);
      setTotalTyped(0);
      setCompletedTexts(0);
      totalCorrectRef.current = 0;
      totalTypedRef.current = 0;
      setTimeLeft(TIME_LIMIT);
      setPhase("playing");
      startTimeRef.current = performance.now();

      timerRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          finishGame();
        }
      }, 100);

      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [getRandomText, finishGame],
  );

  const startCountdown = useCallback(
    (currentLang: Lang) => {
      clearAllTimers();
      setCountdown(3);
      setPhase("countdown");

      let count = 3;
      const tick = () => {
        count -= 1;
        if (count <= 0) {
          startPlaying(currentLang);
        } else {
          setCountdown(count);
          countdownRef.current = setTimeout(tick, 1000);
        }
      };
      countdownRef.current = setTimeout(tick, 1000);
    },
    [clearAllTimers, startPlaying],
  );

  const handleStart = useCallback(async () => {
    const sid = await startGameSession("typing");
    setSessionId(sid);
    startCountdown(lang);
  }, [startCountdown, lang]);

  const handleInput = useCallback(
    (value: string) => {
      if (phase !== "playing") return;

      setTypedText(value);

      // Count correct characters for current text
      let correct = 0;
      for (let i = 0; i < value.length && i < targetText.length; i++) {
        if (value[i] === targetText[i]) {
          correct++;
        }
      }

      // Check if text is completed (typed length >= target length)
      if (value.length >= targetText.length) {
        const newTotalCorrect = totalCorrectRef.current + correct;
        const newTotalTyped = totalTypedRef.current + value.length;
        totalCorrectRef.current = newTotalCorrect;
        totalTypedRef.current = newTotalTyped;
        setTotalCorrect(newTotalCorrect);
        setTotalTyped(newTotalTyped);
        setCompletedTexts((prev) => prev + 1);

        // Pick new text
        const newText = getRandomText(lang);
        setTargetText(newText);
        setTypedText("");
      }
    },
    [phase, targetText, lang, getRandomText],
  );

  const handleRestart = useCallback(() => {
    clearAllTimers();
    startCountdown(lang);
  }, [clearAllTimers, startCountdown, lang]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Calculate current stats
  const getCurrentCorrect = () => {
    let correct = 0;
    for (let i = 0; i < typedText.length && i < targetText.length; i++) {
      if (typedText[i] === targetText[i]) {
        correct++;
      }
    }
    return totalCorrectRef.current + correct;
  };

  const getCurrentTyped = () => {
    return totalTypedRef.current + typedText.length;
  };

  const getWpm = () => {
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const minutes = elapsed / 60;
    const correct = getCurrentCorrect();
    return minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
  };

  // ── idle ──
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center leading-relaxed text-text-secondary">
          제시되는 문장을 최대한 빠르고
          <br />
          정확하게 타이핑하세요!
        </p>

        <div className="mt-6 flex items-center gap-1 rounded-lg border border-border/60 p-1">
          <button
            onClick={() => setLang("ko")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
              lang === "ko"
                ? "bg-text-primary text-bg-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            한글
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
              lang === "en"
                ? "bg-text-primary text-bg-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            English
          </button>
        </div>

        <p className="mt-3 text-sm text-text-muted">
          {TIME_LIMIT}초 동안 타이핑 속도를 측정합니다.
        </p>

        <Button onClick={handleStart} size="lg" className="mt-6">
          시작하기
        </Button>

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
            transition={{ duration: 0.5, ease: EASING }}
            className="font-heading text-8xl font-bold sm:text-9xl"
          >
            {countdown}
          </motion.p>
        </AnimatePresence>
        <p className="mt-4 text-text-muted">준비하세요...</p>
      </div>
    );
  }

  // ── result ──
  if (phase === "result") {
    const elapsed = TIME_LIMIT;
    const minutes = elapsed / 60;
    const correct = totalCorrectRef.current;
    const typed = totalTypedRef.current;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const accuracy = typed > 0 ? Math.round((correct / typed) * 100) : 0;
    const { grade, title } = getGrade(wpm);

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
            {wpm}
            <span className="ml-1 text-lg text-text-muted">WPM</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            정확도: {accuracy}%
          </p>
        </motion.div>

        <GameResultPanel
          game="typing"
          score={wpm}
          grade={grade}
          title={title}
          sessionId={sessionId}
          shareLines={[
            `등급: ${grade} · ${title}`,
            `WPM: ${wpm}`,
            `정확도: ${accuracy}%`,
          ]}
        />

        <Button onClick={handleRestart} size="lg" className="mt-8">
          다시 도전
        </Button>
      </div>
    );
  }

  // ── playing ──
  const elapsedSec = TIME_LIMIT - timeLeft;
  const currentWpm = elapsedSec > 0 ? getWpm() : 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-lg items-center justify-between text-sm">
        <span className="text-text-muted" aria-live="polite" aria-atomic="true">
          {Math.ceil(timeLeft)}초
        </span>
        <span className="font-bold" aria-live="polite" aria-atomic="true">
          {currentWpm}
          <span className="ml-1 text-text-muted">WPM</span>
        </span>
      </div>

      <div className="mt-3 h-2 w-full max-w-lg overflow-hidden rounded-full bg-border/30">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${(timeLeft / TIME_LIMIT) * 100}%`,
            backgroundColor:
              timeLeft > 30
                ? "#22c55e"
                : timeLeft > 10
                  ? "#eab308"
                  : "#ef4444",
          }}
        />
      </div>

      <div className="mt-6 w-full max-w-lg rounded-lg border border-border/60 p-4">
        <p className="select-none leading-relaxed">
          {targetText.split("").map((char, i) => {
            let color = "text-text-muted";
            if (i < typedText.length) {
              color =
                typedText[i] === char ? "text-emerald-400" : "text-red-400";
            }
            return (
              <span key={i} className={color}>
                {char}
              </span>
            );
          })}
        </p>
      </div>

      <textarea
        ref={inputRef}
        value={typedText}
        onChange={(e) => handleInput(e.target.value)}
        className="mt-4 h-24 w-full max-w-lg resize-none rounded-lg border border-border/60 bg-transparent p-4 text-sm leading-relaxed outline-none focus:border-text-secondary"
        placeholder="여기에 타이핑하세요..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <p className="mt-3 text-xs text-text-muted">
        완료한 문장: {completedTexts}
      </p>
    </div>
  );
}
