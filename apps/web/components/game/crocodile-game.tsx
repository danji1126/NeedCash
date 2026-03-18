"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// ── Types ──

type Phase = "setup" | "playing" | "bitten" | "result";
type AnimalTheme = "crocodile" | "lion";

interface Player {
  id: number;
  name: string;
  color: string;
}

interface Tooth {
  index: number;
  isMine: boolean;
  isClicked: boolean;
}

interface ThemeColors {
  accentColor: string;
  bittenLabel: string;
  setupLabel: string;
}

// ── Constants ──

const TOTAL_TEETH = 12;
const MIN_MINES = 1;
const MAX_MINES = 4;
const DEFAULT_MINES = 1;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const BITTEN_DELAY = 2500;
const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

const PLAYER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899",
] as const;

const THEMES: Record<AnimalTheme, ThemeColors> = {
  crocodile: {
    accentColor: "#2d9477",
    bittenLabel: "물렸습니다",
    setupLabel: "이빨을 돌아가며 하나씩 눌러보세요!",
  },
  lion: {
    accentColor: "#d97706",
    bittenLabel: "물렸습니다",
    setupLabel: "사자의 이빨을 돌아가며 하나씩 눌러보세요!",
  },
};

const ANIMAL_LABELS: Record<AnimalTheme, { name: string; emoji: string }> = {
  crocodile: { name: "악어", emoji: "🐊" },
  lion: { name: "사자", emoji: "🦁" },
};

// ── Helper Functions ──

function createTeeth(mineCount: number): Tooth[] {
  const mineIndices = new Set<number>();
  while (mineIndices.size < mineCount) {
    mineIndices.add(Math.floor(Math.random() * TOTAL_TEETH));
  }
  return Array.from({ length: TOTAL_TEETH }, (_, i) => ({
    index: i,
    isMine: mineIndices.has(i),
    isClicked: false,
  }));
}

function getNextTurnId(players: Player[], currentId: number): number {
  const currentIdx = players.findIndex((p) => p.id === currentId);
  const nextIdx = (currentIdx + 1) % players.length;
  return players[nextIdx].id;
}

// ── Component ──

export function CrocodileGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurnId, setCurrentTurnId] = useState(0);
  const [teeth, setTeeth] = useState<Tooth[]>([]);
  const [bittenPlayerId, setBittenPlayerId] = useState<number | null>(null);
  const [clickedMine, setClickedMine] = useState<number | null>(null);

  // Setup state
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`),
  );
  const [mineCount, setMineCount] = useState(DEFAULT_MINES);
  const [animal, setAnimal] = useState<AnimalTheme>("crocodile");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = THEMES[animal];
  const animalLabel = ANIMAL_LABELS[animal];

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // ── Game Logic ──

  const startGame = useCallback(
    (count: number, names: string[]) => {
      clearTimer();
      const newPlayers = Array.from({ length: count }, (_, i) => ({
        id: i,
        name: names[i]?.trim() || `Player ${i + 1}`,
        color: PLAYER_COLORS[i],
      }));
      setPlayers(newPlayers);
      setCurrentTurnId(0);
      setTeeth(createTeeth(mineCount));
      setClickedMine(null);
      setBittenPlayerId(null);
      setPhase("playing");
    },
    [clearTimer, mineCount],
  );

  const handleToothClick = useCallback(
    (toothIndex: number) => {
      if (phase !== "playing") return;
      const tooth = teeth[toothIndex];
      if (!tooth || tooth.isClicked) return;

      if (tooth.isMine) {
        setClickedMine(toothIndex);
        setBittenPlayerId(currentTurnId);
        setPhase("bitten");
        timeoutRef.current = setTimeout(() => {
          setPhase("result");
        }, BITTEN_DELAY);
        return;
      }

      const newTeeth = teeth.map((t) =>
        t.index === toothIndex ? { ...t, isClicked: true } : t,
      );
      setTeeth(newTeeth);

      const allSafeClicked = newTeeth
        .filter((t) => !t.isMine)
        .every((t) => t.isClicked);

      if (allSafeClicked) {
        timeoutRef.current = setTimeout(() => {
          setTeeth(createTeeth(mineCount));
          setCurrentTurnId(getNextTurnId(players, currentTurnId));
        }, 500);
      } else {
        setCurrentTurnId(getNextTurnId(players, currentTurnId));
      }
    },
    [phase, teeth, players, currentTurnId, mineCount],
  );

  const handleRematch = useCallback(() => {
    clearTimer();
    setTeeth(createTeeth(mineCount));
    setClickedMine(null);
    setBittenPlayerId(null);
    setCurrentTurnId(0);
    setPhase("playing");
  }, [clearTimer, mineCount]);

  const handleNewGame = useCallback(() => {
    clearTimer();
    setPhase("setup");
  }, [clearTimer]);

  // ── Derived state ──

  const currentPlayer = players.find((p) => p.id === currentTurnId);
  const bittenPlayer = players.find((p) => p.id === bittenPlayerId);
  const survivors = players.filter((p) => p.id !== bittenPlayerId);

  // ── Render ──

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {/* ── SETUP ── */}
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASING }}
            className="flex w-full flex-col items-center gap-5"
          >
            {/* Animal selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
                동물 선택
              </span>
              <div className="flex gap-3">
                {(["crocodile", "lion"] as AnimalTheme[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnimal(a)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      animal === a
                        ? "scale-105 shadow-lg ring-2"
                        : "bg-surface-secondary text-text-secondary opacity-60 hover:opacity-100"
                    }`}
                    style={
                      animal === a
                        ? {
                            background: `${THEMES[a].accentColor}20`,
                            outlineColor: THEMES[a].accentColor,
                            color: THEMES[a].accentColor,
                            // ring-2 uses --tw-ring-color
                            "--tw-ring-color": THEMES[a].accentColor,
                          } as React.CSSProperties
                        : undefined
                    }
                  >
                    <span className="text-2xl">{ANIMAL_LABELS[a].emoji}</span>
                    <span>{ANIMAL_LABELS[a].name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-center text-sm leading-relaxed text-text-secondary">
              {theme.setupLabel}
              <br />
              <span className="font-semibold text-red-400">
                지뢰 이빨을 누르면 즉시 패배!
              </span>
            </p>

            {/* Mine count selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
                지뢰 수
              </span>
              <div className="flex gap-2">
                {Array.from(
                  { length: MAX_MINES - MIN_MINES + 1 },
                  (_, i) => i + MIN_MINES,
                ).map((n) => (
                  <button
                    key={n}
                    onClick={() => setMineCount(n)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      mineCount === n
                        ? "scale-110 bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-xs text-text-muted">
                {TOTAL_TEETH}개 중 {mineCount}개 ({Math.round((mineCount / TOTAL_TEETH) * 100)}%)
              </span>
            </div>

            {/* Player count */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
                플레이어 수
              </span>
              <div className="flex gap-2">
                {Array.from(
                  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                  (_, i) => i + MIN_PLAYERS,
                ).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${
                      playerCount === n
                        ? "scale-110 text-white shadow-lg"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                    }`}
                    style={
                      playerCount === n
                        ? {
                            backgroundColor: theme.accentColor,
                            boxShadow: `0 4px 14px ${theme.accentColor}50`,
                          }
                        : undefined
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Player names */}
            <div className="flex w-full max-w-xs flex-col gap-2">
              {Array.from({ length: playerCount }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full shadow-sm"
                    style={{
                      backgroundColor: PLAYER_COLORS[i],
                      boxShadow: `0 0 8px ${PLAYER_COLORS[i]}40`,
                    }}
                  />
                  <input
                    type="text"
                    value={playerNames[i]}
                    onChange={(e) => {
                      const next = [...playerNames];
                      next[i] = e.target.value;
                      setPlayerNames(next);
                    }}
                    placeholder={`Player ${i + 1}`}
                    maxLength={12}
                    className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none transition-colors"
                    style={{ borderColor: undefined }}
                  />
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => startGame(playerCount, playerNames)}
              className="text-white"
              style={{
                backgroundColor: theme.accentColor,
              }}
            >
              게임 시작!
            </Button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && currentPlayer && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col items-center gap-4"
          >
            <motion.div
              key={currentTurnId}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: EASING }}
              className="flex items-center gap-2 rounded-full px-5 py-2"
              style={{
                backgroundColor: `${currentPlayer.color}15`,
                border: `2px solid ${currentPlayer.color}`,
              }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span
                className="text-lg font-bold"
                style={{ color: currentPlayer.color }}
              >
                {currentPlayer.name}
              </span>
              <span className="text-lg font-bold">의 차례!</span>
            </motion.div>

            <p className="text-xs text-text-muted">
              💣 숨겨진 지뢰 {mineCount}개 / 이빨 {TOTAL_TEETH}개
            </p>

            <AnimalMouth
              teeth={teeth}
              clickedMine={clickedMine}
              onToothClick={handleToothClick}
              isInteractive
              isBitten={false}
              animal={animal}
            />

            <PlayerStatusBar
              players={players}
              currentTurnId={currentTurnId}
            />

            {/* Reset button */}
            <button
              onClick={handleNewGame}
              className="mt-1 text-xs text-text-muted underline-offset-2 transition-colors hover:text-text-secondary hover:underline"
            >
              ⚙️ 설정으로 돌아가기
            </button>
          </motion.div>
        )}

        {/* ── BITTEN ── */}
        {phase === "bitten" && bittenPlayer && (
          <motion.div
            key="bitten"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col items-center gap-4"
          >
            <motion.div
              animate={{ x: [0, -8, 8, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.5 }}
              className="flex w-full flex-col items-center gap-4"
            >
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-3xl font-bold sm:text-4xl"
                style={{ color: bittenPlayer.color }}
              >
                💀 {bittenPlayer.name} 꽝!
              </motion.p>

              <AnimalMouth
                teeth={teeth}
                clickedMine={clickedMine}
                onToothClick={() => {}}
                isInteractive={false}
                isBitten
                animal={animal}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-text-muted"
              >
                {animalLabel.emoji} {animalLabel.name}에게 {theme.bittenLabel}!
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && bittenPlayer && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASING }}
            className="flex w-full flex-col items-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${bittenPlayer.color}30, ${bittenPlayer.color}10)`,
                  border: `3px solid ${bittenPlayer.color}`,
                }}
              >
                <span className="text-5xl">😵</span>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-bold"
                  style={{ color: bittenPlayer.color }}
                >
                  {bittenPlayer.name}
                </p>
                <p className="text-sm text-text-muted">
                  {animalLabel.emoji} {animalLabel.name}에게 {theme.bittenLabel}!
                </p>
              </div>
            </motion.div>

            <div className="w-full max-w-xs">
              <p className="mb-3 text-center text-[13px] uppercase tracking-[0.2em] text-text-muted">
                생존자
              </p>
              <div className="flex flex-col gap-2">
                {survivors.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex items-center gap-3 rounded-lg bg-surface-secondary px-4 py-2.5"
                  >
                    <span className="text-lg">🎉</span>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="flex-1 text-sm font-medium">
                      {player.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={handleRematch}>
                다시 하기
              </Button>
              <Button
                size="lg"
                onClick={handleNewGame}
                className="text-white"
                style={{ backgroundColor: theme.accentColor }}
              >
                새 게임
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub Components ──

/* Shared gum + teeth row */
function TeethRow({
  teeth, row, clickedMine, onClick, isInteractive,
}: {
  teeth: Tooth[]; row: "upper" | "lower"; clickedMine: number | null;
  onClick: (i: number) => void; isInteractive: boolean;
}) {
  const isUpper = row === "upper";
  return (
    <div
      className="px-1 sm:px-2"
      style={{
        paddingTop: isUpper ? "5px" : undefined,
        paddingBottom: !isUpper ? "5px" : undefined,
        background: isUpper
          ? "linear-gradient(180deg, #4a1818 0%, #8b2828 100%)"
          : "linear-gradient(0deg, #4a1818 0%, #8b2828 100%)",
        borderRadius: isUpper ? "10px 10px 0 0" : "0 0 10px 10px",
        boxShadow: isUpper
          ? "inset 0 5px 10px rgba(0,0,0,0.5)"
          : "inset 0 -5px 10px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex justify-center gap-[4px] sm:gap-[5px]">
        {teeth.map((tooth) => (
          <ToothButton key={tooth.index} tooth={tooth} row={row}
            clickedMine={clickedMine} onClick={onClick} isInteractive={isInteractive} />
        ))}
      </div>
    </div>
  );
}

function AnimalMouth({
  teeth, clickedMine, onToothClick, isInteractive, isBitten, animal,
}: {
  teeth: Tooth[]; clickedMine: number | null;
  onToothClick: (i: number) => void; isInteractive: boolean;
  isBitten: boolean; animal: AnimalTheme;
}) {
  const upper = teeth.slice(0, 6);
  const lower = teeth.slice(6, 12);
  const isLion = animal === "lion";

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none sm:max-w-[400px]">
      {/* ── LION: mane petals + ears (behind head) ── */}
      {isLion && <LionMane />}
      {isLion && <LionEars />}

      {/* ── UPPER HEAD ── */}
      <motion.div
        className="relative z-20"
        animate={isBitten ? { rotateX: 12, y: 22 } : { rotateX: 0, y: 0 }}
        transition={{ duration: 0.4, ease: EASING }}
        style={{ transformOrigin: "center bottom" }}
      >
        {isLion ? (
          <LionUpperHead upper={upper} clickedMine={clickedMine}
            onToothClick={onToothClick} isInteractive={isInteractive} isBitten={isBitten} />
        ) : (
          <CrocUpperHead upper={upper} clickedMine={clickedMine}
            onToothClick={onToothClick} isInteractive={isInteractive} isBitten={isBitten} />
        )}
      </motion.div>

      {/* ── MOUTH INTERIOR ── */}
      <div className="relative z-0" style={{
        background: "linear-gradient(180deg, #2a0808 0%, #3d1010 30%, #2a0808 100%)",
        height: isBitten ? "6px" : "28px",
        transition: "height 0.4s cubic-bezier(0.215,0.61,0.355,1)",
        boxShadow: "inset 0 4px 10px rgba(0,0,0,0.7), inset 0 -4px 10px rgba(0,0,0,0.7)",
      }}>
        {!isBitten && (
          <div className="flex h-full items-center justify-center">
            <div className="h-3 w-14 rounded-full sm:h-3.5 sm:w-18"
              style={{ background: "radial-gradient(ellipse, #f87171, #991b1b)", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }} />
          </div>
        )}
      </div>

      {/* ── LOWER JAW ── */}
      <motion.div
        className="relative z-20"
        animate={isBitten ? { rotateX: -12, y: -22 } : { rotateX: 0, y: 0 }}
        transition={{ duration: 0.4, ease: EASING }}
        style={{ transformOrigin: "center top" }}
      >
        {isLion ? (
          <LionLowerJaw lower={lower} clickedMine={clickedMine}
            onToothClick={onToothClick} isInteractive={isInteractive} />
        ) : (
          <CrocLowerJaw lower={lower} clickedMine={clickedMine}
            onToothClick={onToothClick} isInteractive={isInteractive} />
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────── CROCODILE PARTS ─────────────────── */

function CrocUpperHead({ upper, clickedMine, onToothClick, isInteractive, isBitten }: {
  upper: Tooth[]; clickedMine: number | null; onToothClick: (i: number) => void;
  isInteractive: boolean; isBitten: boolean;
}) {
  return (
    <>
      {/* Big eye bumps on top */}
      <div className="relative z-30 mb-[-24px] flex justify-center gap-10 sm:mb-[-28px] sm:gap-14">
        {(["left", "right"] as const).map((side) => (
          <div key={side} className="relative">
            {/* Eye socket bump */}
            <div className="flex h-[52px] w-[68px] items-center justify-center sm:h-[60px] sm:w-[78px]"
              style={{
                borderRadius: "50% 50% 45% 45%",
                background: "linear-gradient(180deg, #5eceae 0%, #3aaf8e 30%, #2d9477 60%, #1f7a63 100%)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.35), inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -2px 6px rgba(0,0,0,0.12)",
              }}>
              {/* Angry brow */}
              <div className="absolute top-[6px] z-10 sm:top-[8px]" style={{
                width: "40px", height: "10px", background: "#1a5c4a", borderRadius: "3px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                transform: side === "left" ? "rotate(14deg)" : "rotate(-14deg)",
                transformOrigin: side === "left" ? "right center" : "left center",
              }} />
              {/* Eyeball */}
              <div className="flex h-[26px] w-[30px] items-center justify-center sm:h-[30px] sm:w-[34px]"
                style={{
                  borderRadius: "45%",
                  background: "radial-gradient(circle at 40% 35%, #e8e8c0, #a0a060)",
                  border: "2.5px solid #1a5c4a",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                  marginTop: "6px",
                }}>
                <motion.div style={{
                  width: "9px", height: "16px", background: "#111", borderRadius: "35%",
                  boxShadow: "0 0 3px rgba(0,0,0,0.6)",
                }} animate={
                  isBitten ? { scaleY: 0.15, scaleX: 1.5 } : { scaleX: 1, scaleY: 1, x: side === "left" ? -1 : 1 }
                } transition={{ duration: 0.3 }} />
              </div>
            </div>
            {/* Glossy highlight */}
            <div className="absolute left-[15%] top-[6px] h-[14px] w-[50%] rounded-[50%] opacity-20"
              style={{ background: "#fff" }} />
          </div>
        ))}
      </div>

      {/* Teal head */}
      <div className="relative rounded-t-[32px] px-2 pb-0 pt-8 sm:rounded-t-[40px] sm:px-3 sm:pt-10"
        style={{
          background: "linear-gradient(180deg, #3aaf8e 0%, #2d9477 30%, #258068 60%, #1d6b57 100%)",
          boxShadow: "0 4px 20px rgba(0,80,50,0.3), inset 0 3px 0 rgba(255,255,255,0.12)",
        }}>
        {/* Highlight */}
        <div className="absolute left-[22%] top-3 h-5 w-[56%] rounded-[50%] opacity-[0.07]"
          style={{ background: "#fff" }} />
        {/* Crease line */}
        <div className="mx-6 mb-2 h-[2px] rounded bg-black/10 sm:mx-8" />
        {/* Nostrils */}
        <div className="mb-3 flex justify-center gap-8 sm:gap-12">
          <div className="h-[8px] w-[13px] rounded-[50%] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]"
            style={{ background: "#0d3d30" }} />
          <div className="h-[8px] w-[13px] rounded-[50%] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]"
            style={{ background: "#0d3d30" }} />
        </div>
        {/* Upper teeth */}
        <TeethRow teeth={upper} row="upper" clickedMine={clickedMine}
          onClick={onToothClick} isInteractive={isInteractive} />
      </div>
    </>
  );
}

function CrocLowerJaw({ lower, clickedMine, onToothClick, isInteractive }: {
  lower: Tooth[]; clickedMine: number | null; onToothClick: (i: number) => void;
  isInteractive: boolean;
}) {
  return (
    <div className="relative rounded-b-[32px] px-2 pb-5 pt-0 sm:rounded-b-[40px] sm:px-3 sm:pb-6"
      style={{
        background: "linear-gradient(0deg, #5eceae 0%, #3aaf8e 30%, #2d9477 60%, #1d6b57 100%)",
        boxShadow: "0 8px 20px rgba(0,80,50,0.25), inset 0 -3px 0 rgba(255,255,255,0.08)",
      }}>
      <TeethRow teeth={lower} row="lower" clickedMine={clickedMine}
        onClick={onToothClick} isInteractive={isInteractive} />
      {/* Chin bumps */}
      <div className="mt-2 flex justify-center gap-3 sm:mt-3 sm:gap-4">
        {[0,1,2,3,4].map(i => <div key={i} className="h-1.5 w-3 rounded-full sm:h-2 sm:w-3.5"
          style={{ background: "rgba(30,107,87,0.25)" }} />)}
      </div>
      {/* Chin highlight */}
      <div className="absolute bottom-3 left-[28%] h-4 w-[44%] rounded-[50%] opacity-[0.05]"
        style={{ background: "#fff" }} />
    </div>
  );
}

/* ─────────────────── LION PARTS ─────────────────── */

function LionMane() {
  // 12 outer (dark) + 12 inner (lighter) petals for scalloped mane
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 360 - 90;
    const r = (a * Math.PI) / 180;
    const ox = 50 + Math.cos(r) * 44; // outer %
    const oy = 46 + Math.sin(r) * 42;
    const ix = 50 + Math.cos(r) * 34; // inner %
    const iy = 46 + Math.sin(r) * 32;
    return { a, ox, oy, ix, iy };
  });

  return (
    <div className="absolute inset-0 z-0">
      {/* Outer dark petals */}
      {petals.map((p, i) => (
        <div key={`o${i}`} className="absolute h-[72px] w-[72px] rounded-full sm:h-[82px] sm:w-[82px]"
          style={{
            background: `radial-gradient(circle at 40% 30%, #a0571a, #7c3f0e)`,
            left: `calc(${p.ox}% - 36px)`, top: `calc(${p.oy}% - 36px)`,
          }} />
      ))}
      {/* Inner lighter petals */}
      {petals.map((p, i) => (
        <div key={`i${i}`} className="absolute h-[62px] w-[62px] rounded-full sm:h-[70px] sm:w-[70px]"
          style={{
            background: `radial-gradient(circle at 40% 30%, #c06a20, #a0571a)`,
            left: `calc(${p.ix}% - 31px)`, top: `calc(${p.iy}% - 31px)`,
          }} />
      ))}
      {/* Center fill */}
      <div className="absolute inset-[15%] rounded-full"
        style={{ background: "radial-gradient(circle at 50% 42%, #d97706, #b45309)" }} />
    </div>
  );
}

function LionEars() {
  return (
    <div className="absolute -top-3 z-10 flex w-full justify-center gap-[120px] sm:-top-4 sm:gap-[155px]">
      {[0, 1].map(i => (
        <div key={i} className="flex flex-col items-center">
          <div className="h-7 w-8 rounded-t-full sm:h-8 sm:w-9"
            style={{ background: "linear-gradient(180deg, #d97706, #b45309)", border: "2px solid #92400e" }} />
          <div className="mt-[-2px] h-4 w-5 rounded-t-full sm:h-5 sm:w-6"
            style={{ background: "#fbbf24" }} />
        </div>
      ))}
    </div>
  );
}

function LionUpperHead({ upper, clickedMine, onToothClick, isInteractive, isBitten }: {
  upper: Tooth[]; clickedMine: number | null; onToothClick: (i: number) => void;
  isInteractive: boolean; isBitten: boolean;
}) {
  return (
    <div className="relative px-2 pb-0 pt-4 sm:px-3 sm:pt-5"
      style={{
        borderRadius: "50% 50% 8px 8px",
        background: "linear-gradient(180deg, #fcd34d 0%, #f59e0b 35%, #d97706 75%, #b45309 100%)",
        boxShadow: "0 4px 20px rgba(180,83,9,0.3), inset 0 3px 0 rgba(255,255,255,0.18)",
      }}>
      {/* Highlight */}
      <div className="absolute left-[22%] top-3 h-5 w-[56%] rounded-[50%] opacity-[0.1]"
        style={{ background: "#fff" }} />

      {/* Squinting eyes (^ ^) */}
      <div className="mb-2 flex justify-center gap-10 sm:gap-14">
        {[0, 1].map(i => (
          <motion.div key={i} className="h-4 w-8 sm:w-9"
            style={{ borderTop: "4px solid #78350f", borderRadius: "50% 50% 0 0" }}
            animate={isBitten ? { scaleY: 0.5, opacity: 0.7 } : { scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      {/* Blush */}
      <div className="mb-1 flex justify-center gap-16 sm:gap-20">
        <div className="h-3 w-6 rounded-full" style={{ background: "rgba(251,146,60,0.35)" }} />
        <div className="h-3 w-6 rounded-full" style={{ background: "rgba(251,146,60,0.35)" }} />
      </div>

      {/* Brown nose */}
      <div className="mb-2 flex justify-center">
        <div className="h-4 w-5 rounded-[50%_50%_45%_45%] sm:h-5 sm:w-6"
          style={{
            background: "linear-gradient(180deg, #6d3a10, #4a2508)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }} />
      </div>

      {/* Whisker dots */}
      <div className="mb-1 flex justify-center gap-8 sm:gap-10">
        <div className="flex gap-[5px]">
          {[0,1,2].map(i => <div key={i} className="h-[5px] w-[5px] rounded-full" style={{ background: "rgba(120,53,15,0.45)" }} />)}
        </div>
        <div className="flex gap-[5px]">
          {[0,1,2].map(i => <div key={i} className="h-[5px] w-[5px] rounded-full" style={{ background: "rgba(120,53,15,0.45)" }} />)}
        </div>
      </div>
      {/* Whisker lines */}
      <div className="mb-2 flex justify-between px-1 sm:px-2">
        <div className="flex flex-col gap-[3px]">
          {[-6,0,6].map(d => <div key={d} className="h-[1.5px] w-8 rounded sm:w-10"
            style={{ background: "rgba(120,53,15,0.3)", transform: `rotate(${d}deg)` }} />)}
        </div>
        <div className="flex flex-col gap-[3px]">
          {[6,0,-6].map(d => <div key={d} className="h-[1.5px] w-8 rounded sm:w-10"
            style={{ background: "rgba(120,53,15,0.3)", transform: `rotate(${d}deg)` }} />)}
        </div>
      </div>

      {/* Upper gum + big fangs + small teeth */}
      <div className="relative">
        <TeethRow teeth={upper} row="upper" clickedMine={clickedMine}
          onClick={onToothClick} isInteractive={isInteractive} />
      </div>
    </div>
  );
}

function LionLowerJaw({ lower, clickedMine, onToothClick, isInteractive }: {
  lower: Tooth[]; clickedMine: number | null; onToothClick: (i: number) => void;
  isInteractive: boolean;
}) {
  return (
    <>
      <div className="relative rounded-b-[45%] px-2 pb-5 pt-0 sm:px-3 sm:pb-6"
        style={{
          background: "linear-gradient(0deg, #fcd34d 0%, #f59e0b 40%, #d97706 80%, #b45309 100%)",
          boxShadow: "0 6px 20px rgba(180,83,9,0.25), inset 0 -3px 0 rgba(255,255,255,0.1)",
        }}>
        <TeethRow teeth={lower} row="lower" clickedMine={clickedMine}
          onClick={onToothClick} isInteractive={isInteractive} />
        <div className="mt-2 flex justify-center gap-2 sm:mt-3 sm:gap-3">
          {[0,1,2,3,4].map(i => <div key={i} className="h-1.5 w-2.5 rounded-full sm:h-2 sm:w-3"
            style={{ background: "rgba(120,53,15,0.2)" }} />)}
        </div>
      </div>
      {/* Body below chin */}
      <div className="mx-auto -mt-1 h-8 w-[55%] rounded-b-2xl sm:h-10"
        style={{ background: "linear-gradient(180deg, #b45309, #d97706, #f59e0b)" }} />
    </>
  );
}

function ToothButton({
  tooth,
  row,
  clickedMine,
  onClick,
  isInteractive,
}: {
  tooth: Tooth;
  row: "upper" | "lower";
  clickedMine: number | null;
  onClick: (index: number) => void;
  isInteractive: boolean;
}) {
  const isMineRevealed = clickedMine === tooth.index;
  const isDisabled = !isInteractive || tooth.isClicked;
  const isPressed = tooth.isClicked && !isMineRevealed;

  const clipPath =
    row === "upper"
      ? "polygon(10% 0%, 90% 0%, 50% 100%)"
      : "polygon(50% 0%, 90% 100%, 10% 100%)";

  return (
    <motion.button
      onClick={() => onClick(tooth.index)}
      disabled={isDisabled}
      initial={{ opacity: 0, y: row === "upper" ? -6 : 6 }}
      animate={{
        opacity: isPressed ? 0.2 : 1,
        scaleY: isPressed ? 0.25 : 1,
        y: 0,
      }}
      transition={{ duration: 0.2, ease: EASING }}
      whileHover={
        isInteractive && !tooth.isClicked
          ? { scale: 1.15, y: row === "upper" ? 4 : -4 }
          : undefined
      }
      whileTap={
        isInteractive && !tooth.isClicked ? { scale: 0.85 } : undefined
      }
      className="relative cursor-pointer disabled:cursor-default"
      style={{
        width: "clamp(32px, 7.5vw, 44px)",
        height: "clamp(28px, 6vw, 40px)",
        clipPath,
        background: isMineRevealed
          ? "linear-gradient(180deg, #fca5a5 0%, #ef4444 100%)"
          : isPressed
            ? "#6b7280"
            : "linear-gradient(180deg, #ffffff 0%, #f9fafb 30%, #e5e7eb 100%)",
        filter: isMineRevealed
          ? "drop-shadow(0 0 8px rgba(239,68,68,0.8))"
          : isPressed
            ? "none"
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
      }}
      aria-label={`이빨 ${tooth.index + 1}`}
    >
      {isMineRevealed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center text-[10px]"
        >
          💥
        </motion.span>
      )}
    </motion.button>
  );
}

function PlayerStatusBar({
  players,
  currentTurnId,
}: {
  players: Player[];
  currentTurnId: number;
}) {
  return (
    <div className="flex w-full max-w-sm flex-wrap items-center justify-center gap-2">
      {players.map((player) => (
        <motion.div
          key={player.id}
          animate={
            player.id === currentTurnId
              ? { scale: 1.05 }
              : { scale: 1, opacity: 0.6 }
          }
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
          style={{
            backgroundColor: `${player.color}15`,
            border:
              player.id === currentTurnId
                ? `2px solid ${player.color}`
                : "2px solid transparent",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          <span>{player.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
