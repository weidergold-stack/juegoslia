"use client";

import { useEffect, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";

function shuffledOrder(size: number): number[] {
  const arr = Array.from({ length: size * size }, (_, i) => i);
  let solved = true;
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    solved = arr.every((v, i) => v === i);
  } while (solved);
  return arr;
}

function PuzzleBoard({
  world,
  size,
  onWin,
}: {
  world: World;
  size: number;
  onWin: () => void;
}) {
  const [order, setOrder] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    // Client-only shuffle: must run post-mount so server and first client
    // render both show the loading placeholder (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(shuffledOrder(size));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTap(slot: number) {
    if (!order || won) return;
    if (selected === null) {
      setSelected(slot);
      return;
    }
    if (selected === slot) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[slot]] = [next[slot], next[selected]];
    setOrder(next);
    setSelected(null);
    if (next.every((v, i) => v === i)) {
      setWon(true);
      setTimeout(onWin, 500);
    }
  }

  if (!order) {
    return (
      <div className="flex aspect-square w-full max-w-md items-center justify-center text-5xl">
        🧩
      </div>
    );
  }

  return (
    <div
      className="grid aspect-square w-full max-w-md gap-1 overflow-hidden rounded-[1.5rem] bg-violet-900 p-1 shadow-xl"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {order.map((pieceId, slot) => {
        const col = pieceId % size;
        const row = Math.floor(pieceId / size);
        return (
          <button
            key={slot}
            onClick={() => handleTap(slot)}
            className={`relative overflow-hidden rounded-md transition-transform active:scale-95 ${
              selected === slot ? "ring-4 ring-yellow-300" : ""
            }`}
            style={{
              backgroundImage: `url(${world.colorImage})`,
              backgroundSize: `${size * 100}% ${size * 100}%`,
              backgroundPosition: `${(col / (size - 1)) * 100}% ${
                (row / (size - 1)) * 100
              }%`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function PuzzleGame({ world }: { world: World }) {
  const [size, setSize] = useState(2);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <main
      className={`flex flex-1 flex-col items-center gap-5 bg-gradient-to-b ${world.gradient} px-4 py-6`}
    >
      <GameTopBar world={world} title="🧩 Rompecabezas" />

      <p className="text-center text-xl font-semibold text-white drop-shadow">
        Toca dos piezas para cambiarlas de lugar
      </p>

      <div className="flex gap-3 rounded-full bg-white/80 p-1 shadow-md">
        {[2, 3].map((n) => (
          <button
            key={n}
            onClick={() => {
              setSize(n);
              setRound((r) => r + 1);
              setDone(false);
            }}
            className={`rounded-full px-5 py-2 text-lg font-bold transition-colors ${
              size === n
                ? "bg-violet-600 text-white"
                : "text-violet-600"
            }`}
          >
            {n === 2 ? "Fácil" : "Difícil"}
          </button>
        ))}
      </div>

      <PuzzleBoard
        key={`${size}-${round}`}
        world={world}
        size={size}
        onWin={() => setDone(true)}
      />

      {done && (
        <Celebration
          message="¡Armaste el rompecabezas!"
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
