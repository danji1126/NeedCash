"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { RankableGame } from "@/lib/score-validation";
import { validateNickname, SCORE_UNIT } from "@/lib/score-validation";

interface ScoreSubmitProps {
  game: RankableGame;
  score: number;
  metadata?: Record<string, unknown>;
  onSubmitted?: () => void;
  onSkipped?: () => void;
}

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

export function ScoreSubmit({
  game,
  score,
  metadata,
  onSubmitted,
  onSkipped,
}: ScoreSubmitProps) {
  const [nickname, setNickname] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("needcash-nickname") || ""
      : ""
  );
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASING }}
        className="mt-6 rounded-lg border border-border/60 bg-surface-hover/50 px-4 py-3 text-center text-sm text-text-secondary"
      >
        리더보드에 등록되었습니다!
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = nickname.trim();
    if (trimmed) {
      const check = validateNickname(trimmed);
      if (!check.valid) {
        setErrorMsg(check.error!);
        return;
      }
    }

    setStatus("submitting");

    try {
      if (trimmed) {
        localStorage.setItem("needcash-nickname", trimmed);
      }

      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game,
          score,
          nickname: trimmed || null,
          metadata,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = (await res.json()) as { retryAfter?: number };
          const sec = data.retryAfter ?? 60;
          setErrorMsg(`잠시 후 다시 시도해주세요 (${sec}초 제한)`);
          setStatus("error");
          return;
        }
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error || "등록에 실패했습니다");
        setStatus("error");
        return;
      }

      setStatus("done");
      onSubmitted?.();
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다");
      setStatus("error");
    }
  };

  const unit = SCORE_UNIT[game];

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4, ease: EASING }}
      className="mt-6 w-full max-w-xs"
    >
      <p className="text-center text-sm text-text-muted">
        {score}
        {unit} 기록을 리더보드에 등록하세요
      </p>
      <input
        type="text"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          setErrorMsg("");
        }}
        placeholder="닉네임 (3-12자, 선택)"
        maxLength={12}
        aria-invalid={!!errorMsg}
        aria-describedby={errorMsg ? "nickname-error" : undefined}
        className="mt-3 w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-text/40"
      />
      {errorMsg && (
        <p id="nickname-error" className="mt-1 text-xs text-red-400">
          {errorMsg}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "등록 중..." : "등록"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onSkipped}
        >
          건너뛰기
        </Button>
      </div>
    </motion.form>
  );
}
