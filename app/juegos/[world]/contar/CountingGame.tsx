"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import { POSITIVE_PHRASES, TRY_AGAIN_PHRASES, speakRandom } from "../../../lib/speech";
import { MEMORY_ICON_SETS } from "../memoria/icons";

const TOTAL_ROUNDS = 5;

type Round = {
  count: number;
  options: number[];
  icon: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeRound(worldId: string): Round {
  const count = 1 + Math.floor(Math.random() * 8);
  const options = new Set<number>([count]);
  while (options.size < 3) {
    const candidate = count + Math.floor(Math.random() * 5) - 2;
    if (candidate >= 1 && candidate <= 10) options.add(candidate);
  }
  const icons = MEMORY_ICON_SETS[worldId];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  return { count, options: shuffle([...options]), icon };
}

function CountingBoard({
  world,
  onFinish,
}: {
  world: World;
  onFinish: () => void;
}) {
  const [round, setRound] = useState<Round | null>(null);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    // Client-only random round: must run post-mount so server and first
    // client render both show the loading placeholder (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(makeRound(world.id));
  }, [world.id]);

  function handleChoose(n: number) {
    if (!round || feedback === "correct") return;
    if (n === round.count) {
      setFeedback("correct");
      speakRandom(POSITIVE_PHRASES);
      setTimeout(() => {
        if (progress + 1 >= TOTAL_ROUNDS) {
          onFinish();
        } else {
          setProgress((p) => p + 1);
          setRound(makeRound(world.id));
          setFeedback(null);
        }
      }, 700);
    } else {
      setFeedback("wrong");
      speakRandom(TRY_AGAIN_PHRASES);
      setTimeout(() => setFeedback(null), 500);
    }
  }

  if (!round) {
    return (
      <div className="flex aspect-square w-full max-w-md items-center justify-center text-5xl">
        🔢
      </div>
    );
  }

  return (
    <>
      <p className="text-center text-lg font-semibold text-white/90">
        Ronda {progress + 1} de {TOTAL_ROUNDS}
      </p>

      <div className="flex min-h-40 w-full max-w-md flex-wrap items-center justify-center gap-3 rounded-[2rem] bg-white/90 p-6 shadow-xl">
        {Array.from({ length: round.count }).map((_, i) => (
          <div key={i} className="animate-pop-in relative h-12 w-12">
            <Image src={round.icon} alt="" fill className="object-contain" />
          </div>
        ))}
      </div>

      <p className="text-center text-xl font-semibold text-white drop-shadow">
        ¿Cuántos hay? Toca el número correcto
      </p>

      <div
        className={`flex gap-4 ${feedback === "wrong" ? "animate-wiggle" : ""}`}
      >
        {round.options.map((option) => (
          <button
            key={option}
            onClick={() => handleChoose(option)}
            className={`flex h-20 w-20 items-center justify-center rounded-3xl text-4xl font-bold shadow-lg transition-transform active:scale-90 ${
              feedback === "correct" && option === round.count
                ? "bg-green-400 text-white"
                : "bg-white text-violet-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback === "correct" && (
        <p className="text-2xl font-bold text-white drop-shadow">
          ¡Muy bien! 🎉
        </p>
      )}
    </>
  );
}

export default function CountingGame({ world }: { world: World }) {
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <main
      className={`flex flex-1 flex-col items-center gap-5 bg-gradient-to-b ${world.gradient} px-4 py-6`}
    >
      <GameTopBar world={world} title="🔢 Contar" />

      <CountingBoard key={round} world={world} onFinish={() => setDone(true)} />

      {done && (
        <Celebration
          message="¡Sabes contar muy bien!"
          onReplay={() => {
            setRound((r) => r + 1);
            setDone(false);
          }}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
