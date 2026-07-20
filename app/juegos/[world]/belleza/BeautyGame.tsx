"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import { speak } from "../../../lib/speech";
import {
  HAIRSTYLES,
  HAND_IMAGE,
  MESSY_IMAGE,
  NAIL_COLORS,
  NAIL_SPOTS,
  TANGLE_SPOTS,
  TangleSpot,
} from "./beauty";

type Tab = "cabello" | "unas";

export default function BeautyGame({ world }: { world: World }) {
  const [tab, setTab] = useState<Tab>("cabello");
  const scrubbingRef = useRef(false);

  const [tangles, setTangles] = useState<TangleSpot[]>(TANGLE_SPOTS);
  const [hairstyleId, setHairstyleId] = useState<string | null>(null);

  const [activeColor, setActiveColor] = useState(NAIL_COLORS[0]);
  const [paintedNails, setPaintedNails] = useState<Record<number, string>>({});

  const [celebrated, setCelebrated] = useState(false);

  const untangled = tangles.length === 0;
  const nailsDone = Object.keys(paintedNails).length >= NAIL_SPOTS.length;

  function maybeCelebrate(hairReady: boolean, nailsReady: boolean) {
    if (hairReady && nailsReady && !celebrated) {
      setTimeout(() => setCelebrated(true), 700);
    }
  }

  function brush(clientX: number, clientY: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setTangles((prev) => {
      const next = prev.filter((s) => Math.hypot(s.x - x, s.y - y) > 10);
      if (next.length !== prev.length && next.length === 0) {
        speak("¡Ya está desenredado! Elige un peinado");
      }
      return next;
    });
  }

  function chooseHairstyle(id: string) {
    setHairstyleId(id);
    const style = HAIRSTYLES.find((h) => h.id === id)!;
    speak(`¡Qué lindo peinado, ${style.name}!`);
    maybeCelebrate(true, nailsDone);
  }

  function paintNail(id: number) {
    setPaintedNails((prev) => {
      const next = { ...prev, [id]: activeColor };
      if (Object.keys(next).length >= NAIL_SPOTS.length) {
        speak("¡Qué lindas uñitas!");
        maybeCelebrate(untangled && hairstyleId !== null, true);
      }
      return next;
    });
  }

  function replay() {
    setTangles(TANGLE_SPOTS);
    setHairstyleId(null);
    setPaintedNails({});
    setCelebrated(false);
    setTab("cabello");
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-4 bg-gradient-to-b from-fuchsia-200 to-pink-300 px-4 py-6">
      <GameTopBar world={world} title="💇 Salón de Belleza" />

      <div className="flex gap-2 rounded-full bg-white/70 p-1 shadow-md">
        <button
          onClick={() => setTab("cabello")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
            tab === "cabello"
              ? "bg-fuchsia-500 text-white"
              : "text-fuchsia-700"
          }`}
        >
          💇 Cabello
        </button>
        <button
          onClick={() => setTab("unas")}
          className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
            tab === "unas" ? "bg-fuchsia-500 text-white" : "text-fuchsia-700"
          }`}
        >
          💅 Uñas
        </button>
      </div>

      {tab === "cabello" && (
        <div className="flex w-full max-w-xs flex-1 flex-col items-center gap-4">
          {!untangled ? (
            <>
              <p className="text-center text-base font-bold text-white drop-shadow">
                Desliza el dedo sobre los enredos para peinar
              </p>
              <div
                className="relative aspect-square w-full touch-none rounded-[2.5rem] bg-white shadow-2xl"
                onPointerDown={(e) => {
                  scrubbingRef.current = true;
                  brush(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
                }}
                onPointerMove={(e) => {
                  if (!scrubbingRef.current) return;
                  brush(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
                }}
                onPointerUp={() => (scrubbingRef.current = false)}
                onPointerLeave={() => (scrubbingRef.current = false)}
              >
                <Image
                  src={MESSY_IMAGE}
                  alt="Cabello enredado"
                  fill
                  className="pointer-events-none rounded-[2.5rem] object-cover"
                />
                {tangles.map((spot) => (
                  <span
                    key={spot.id}
                    className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-800 bg-amber-700/80 shadow"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-base font-bold text-white drop-shadow">
                Elige un peinado
              </p>
              <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white/60 shadow-xl">
                <Image
                  key={hairstyleId ?? "cola"}
                  src={
                    HAIRSTYLES.find((h) => h.id === hairstyleId)?.image ??
                    HAIRSTYLES[0].image
                  }
                  alt="Peinado"
                  fill
                  className="animate-pop-in object-cover"
                />
              </div>
              <div className="grid w-full grid-cols-3 gap-2">
                {HAIRSTYLES.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => chooseHairstyle(h.id)}
                    className={`overflow-hidden rounded-2xl border-4 shadow-md transition-transform active:scale-90 ${
                      h.id === hairstyleId
                        ? "border-fuchsia-500"
                        : "border-white"
                    }`}
                  >
                    <div className="relative aspect-square w-full">
                      <Image src={h.image} alt={h.name} fill className="object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "unas" && (
        <div className="flex w-full max-w-xs flex-1 flex-col items-center gap-4">
          <p className="text-center text-base font-bold text-white drop-shadow">
            Elige un color y toca cada uñita
          </p>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white/60 shadow-xl">
            <Image
              src={HAND_IMAGE}
              alt="Mano para pintar uñitas"
              fill
              className="object-cover"
            />
            {NAIL_SPOTS.map((spot) => (
              <button
                key={spot.id}
                onClick={() => paintNail(spot.id)}
                className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow active:scale-90"
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  backgroundColor: paintedNails[spot.id] ?? "transparent",
                }}
                aria-label="Uñita"
              />
            ))}
          </div>
          <div className="flex gap-3">
            {NAIL_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`h-10 w-10 rounded-full border-4 shadow-md transition-transform active:scale-90 ${
                  activeColor === color ? "border-fuchsia-700" : "border-white"
                }`}
                style={{ backgroundColor: color }}
                aria-label="Color de esmalte"
              />
            ))}
          </div>
        </div>
      )}

      {celebrated && (
        <Celebration
          message="¡Dejaste a la Estrella lista y hermosa!"
          onReplay={replay}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
