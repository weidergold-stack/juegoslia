"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import {
  isSpeechEnabled,
  POSITIVE_PHRASES,
  speakRandom,
  TRY_AGAIN_PHRASES,
} from "../../../lib/speech";
import { IDLE_IMAGE, MOVES, MUSIC_TRACK, randomMoveId, TARGET_CORRECT } from "./moves";

function DanceBoard({ onFinish }: { onFinish: () => void }) {
  const [targetMoveId, setTargetMoveId] = useState<string | null>(null);
  const [showingMoveId, setShowingMoveId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_TRACK);
    audio.loop = true;
    audio.muted = !isSpeechEnabled();
    audio.play().catch(() => {});
    const muteCheckId = setInterval(() => {
      audio.muted = !isSpeechEnabled();
    }, 500);

    // Client-only random pick: must run post-mount so server and first
    // client render both show the loading placeholder.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetMoveId(randomMoveId());

    return () => {
      clearInterval(muteCheckId);
      audio.pause();
      audio.src = "";
    };
  }, []);

  if (!targetMoveId) {
    return (
      <div className="flex flex-1 items-center justify-center text-5xl">
        💃
      </div>
    );
  }

  const target = MOVES.find((m) => m.id === targetMoveId)!;
  const displayImage = showingMoveId
    ? MOVES.find((m) => m.id === showingMoveId)!.image
    : IDLE_IMAGE;

  function handleTap(moveId: string) {
    if (feedback) return;
    if (moveId === targetMoveId) {
      setShowingMoveId(moveId);
      setFeedback("correct");
      speakRandom(POSITIVE_PHRASES);
      setCorrectCount((c) => {
        const next = c + 1;
        if (next >= TARGET_CORRECT) {
          setTimeout(onFinish, 900);
        }
        return next;
      });
      setTimeout(() => {
        setShowingMoveId(null);
        setFeedback(null);
        setTargetMoveId((prev) => randomMoveId(prev ?? undefined));
      }, 1100);
    } else {
      setFeedback("wrong");
      speakRandom(TRY_AGAIN_PHRASES);
      setTimeout(() => setFeedback(null), 500);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-1 flex-col items-center gap-4">
      <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md">
        <span className="text-xl">⭐</span>
        <span className="text-base font-bold text-purple-700">
          {correctCount}/{TARGET_CORRECT}
        </span>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white/40 shadow-xl">
        <Image
          key={showingMoveId ?? "idle"}
          src={displayImage}
          alt="Las Estrellas bailando"
          fill
          className="animate-pop-in object-cover"
        />
      </div>

      <div className="animate-pop-in flex flex-col items-center gap-2 rounded-3xl bg-white/90 px-6 py-4 text-center shadow-md">
        <p className="text-sm font-bold text-purple-500">
          ¿Puedes hacer este paso?
        </p>
        <p className="text-2xl font-bold text-purple-700">
          {target.emoji} {target.label}
        </p>
      </div>

      <div
        className={`grid w-full grid-cols-3 gap-3 ${
          feedback === "wrong" ? "animate-wiggle" : ""
        }`}
      >
        {MOVES.map((move) => (
          <button
            key={move.id}
            onClick={() => handleTap(move.id)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-4 text-3xl shadow-md transition-transform active:scale-90"
          >
            {move.emoji}
            <span className="text-[11px] font-bold text-purple-700">
              {move.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DanceGame({ world }: { world: World }) {
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 bg-gradient-to-b from-purple-300 to-pink-400 px-4 py-6">
      <GameTopBar world={world} title="💃 Baile y Música" />

      <DanceBoard key={round} onFinish={() => setFinished(true)} />

      {finished && (
        <Celebration
          message="¡Bailaste increíble con Las Estrellas!"
          onReplay={() => {
            setRound((r) => r + 1);
            setFinished(false);
          }}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
