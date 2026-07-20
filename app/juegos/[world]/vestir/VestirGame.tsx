"use client";

import Image from "next/image";
import { useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import { speakRandom } from "../../../lib/speech";
import { DOLLS, OUTFITS, TOTAL_COMBOS, outfitImage } from "./outfits";

const TRY_ON_PHRASES = [
  "¡Qué linda te ves!",
  "¡Me encanta ese estilo!",
  "¡Estás preciosa!",
  "¡Qué outfit tan bonito!",
];

export default function VestirGame({ world }: { world: World }) {
  const [dollId, setDollId] = useState(DOLLS[0].id);
  const [outfitId, setOutfitId] = useState(OUTFITS[0].id);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [celebrated, setCelebrated] = useState(false);

  const doll = DOLLS.find((d) => d.id === dollId)!;

  function chooseOutfit(nextOutfitId: string) {
    setOutfitId(nextOutfitId);
    speakRandom(TRY_ON_PHRASES);
    setTried((prev) => {
      const next = new Set(prev);
      next.add(`${dollId}:${nextOutfitId}`);
      if (next.size >= TOTAL_COMBOS && !celebrated) {
        setTimeout(() => setCelebrated(true), 900);
      }
      return next;
    });
  }

  function replay() {
    setTried(new Set());
    setCelebrated(false);
    setDollId(DOLLS[0].id);
    setOutfitId(OUTFITS[0].id);
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-4 bg-gradient-to-b from-pink-200 to-fuchsia-300 px-4 py-6">
      <GameTopBar world={world} title="👗 Vestir a las Estrellas" />

      <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md">
        <span className="text-xl">✨</span>
        <span className="text-base font-bold text-fuchsia-700">
          {tried.size}/{TOTAL_COMBOS} outfits probados
        </span>
      </div>

      <div className="flex gap-3">
        {DOLLS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDollId(d.id)}
            className={`relative h-16 w-16 overflow-hidden rounded-full border-4 shadow-md transition-transform active:scale-90 ${
              d.id === dollId ? "border-white" : "border-transparent opacity-70"
            }`}
            style={{ boxShadow: d.id === dollId ? `0 0 0 3px ${d.color}` : undefined }}
            aria-label={d.name}
          >
            <Image
              src={outfitImage(d.id, "superhero")}
              alt={d.name}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative flex w-full max-w-xs flex-1 items-center justify-center">
        <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white/60 shadow-xl">
          <Image
            key={`${dollId}-${outfitId}`}
            src={outfitImage(dollId, outfitId)}
            alt={`${doll.name} - ${outfitId}`}
            fill
            className="animate-pop-in object-cover"
          />
          <span
            className="pointer-events-none absolute -top-2 -left-2 animate-sparkle text-2xl"
            style={{ animationDelay: "0s" }}
          >
            ✨
          </span>
          <span
            className="pointer-events-none absolute top-4 -right-3 animate-sparkle text-xl"
            style={{ animationDelay: "0.7s" }}
          >
            ✨
          </span>
          <span
            className="pointer-events-none absolute -bottom-2 left-1/3 animate-sparkle text-xl"
            style={{ animationDelay: "1.4s" }}
          >
            ✨
          </span>
        </div>
      </div>

      <div className="grid w-full max-w-md grid-cols-5 gap-2">
        {OUTFITS.map((o) => (
          <button
            key={o.id}
            onClick={() => chooseOutfit(o.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-2 shadow-md transition-transform active:scale-90 ${
              o.id === outfitId ? "ring-4 ring-fuchsia-400" : ""
            }`}
          >
            <span className="text-2xl">{o.emoji}</span>
            <span className="text-[10px] font-bold text-fuchsia-700">
              {o.name}
            </span>
          </button>
        ))}
      </div>

      {celebrated && (
        <Celebration
          message="¡Vestiste a todas las Estrellas con todos los outfits!"
          onReplay={replay}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
