"use client";

import { useEffect } from "react";
import { speak } from "../lib/speech";

const CONFETTI = ["🎉", "⭐", "🎈", "✨", "💖", "🎊"];

export default function Celebration({
  message,
  onReplay,
  onBack,
}: {
  message: string;
  onReplay: () => void;
  onBack: () => void;
}) {
  useEffect(() => {
    speak(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="animate-float absolute text-4xl"
          style={{
            left: `${(i * 53) % 100}%`,
            top: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 5) * 0.3}s`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}
      <div className="animate-pop-in relative z-10 flex flex-col items-center gap-5 rounded-[2.5rem] bg-white px-10 py-10 text-center shadow-2xl">
        <span className="text-6xl">🏆</span>
        <h2 className="text-3xl font-bold text-violet-700">{message}</h2>
        <div className="flex gap-4">
          <button
            onClick={onReplay}
            className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-6 py-3 text-lg font-bold text-white shadow-md active:scale-95"
          >
            🔁 Jugar otra vez
          </button>
          <button
            onClick={onBack}
            className="rounded-full bg-gradient-to-b from-sky-300 to-blue-400 px-6 py-3 text-lg font-bold text-white shadow-md active:scale-95"
          >
            🏠 Otro juego
          </button>
        </div>
      </div>
    </div>
  );
}
