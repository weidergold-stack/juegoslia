"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { World } from "../../../lib/worlds";
import Celebration from "../../../components/Celebration";
import SoundToggle from "../../../components/SoundToggle";
import { speak } from "../../../lib/speech";
import RaceScene from "./RaceScene";
import { LEVELS } from "./levels";

export default function RaceGame({ world }: { world: World }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [scoreBanked, setScoreBanked] = useState(0);
  const [position, setPosition] = useState("");

  const level = LEVELS[levelIndex];
  const isLastLevel = levelIndex === LEVELS.length - 1;
  const totalScore = scoreBanked + liveScore;

  function handleFinish() {
    if (isLastLevel) {
      setAllDone(true);
    } else {
      setLevelDone(true);
    }
  }

  useEffect(() => {
    if (levelDone) speak(`¡Nivel ${levelIndex + 1} completado! Llegaste en ${position}`);
  }, [levelDone, levelIndex, position]);

  function handleNextLevel() {
    setScoreBanked((s) => s + liveScore);
    setLiveScore(0);
    setLevelIndex((i) => i + 1);
    setPosition("");
    setLevelDone(false);
  }

  function handleReplayAll() {
    setLevelIndex(0);
    setScoreBanked(0);
    setLiveScore(0);
    setPosition("");
    setAllDone(false);
    setLevelDone(false);
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <Link
          href={`/juegos/${world.id}`}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md active:scale-90"
          aria-label="Volver"
        >
          ⬅️
        </Link>
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 shadow-md">
            <span className="text-sm font-bold text-violet-500">
              Nivel {levelIndex + 1}/{LEVELS.length}
            </span>
          </div>
          {position && (
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/90 px-4 py-2 shadow-md">
              <span className="text-xl">🏁</span>
              <span className="text-lg font-bold text-violet-700">{position}</span>
            </div>
          )}
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md">
            <span className="text-xl">⭐</span>
            <span className="text-xl font-bold text-violet-700">{totalScore}</span>
          </div>
          <div className="pointer-events-auto">
            <SoundToggle />
          </div>
        </div>
      </div>

      <RaceScene
        world={world}
        level={level}
        onScoreChange={setLiveScore}
        onPositionChange={setPosition}
        onFinish={handleFinish}
      />

      {levelDone && !allDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="animate-pop-in flex flex-col items-center gap-4 rounded-[2.5rem] bg-white px-10 py-10 text-center shadow-2xl">
            <span className="text-6xl">🎉</span>
            <h2 className="text-3xl font-bold text-violet-700">
              ¡Nivel {levelIndex + 1} completado!
            </h2>
            <p className="text-lg font-semibold text-violet-500">
              Llegaste en {position} · {liveScore} ⭐
            </p>
            <button
              onClick={handleNextLevel}
              className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-8 py-4 text-xl font-bold text-white shadow-md active:scale-95"
            >
              🚦 {LEVELS[levelIndex + 1].name} ▶️
            </button>
          </div>
        </div>
      )}

      {allDone && (
        <Celebration
          message={
            position
              ? `¡Llegaste en ${position}! Ganaste ${totalScore} estrellas`
              : "¡Completaste todas las carreras!"
          }
          onReplay={handleReplayAll}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
