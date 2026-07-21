"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import { POSITIVE_PHRASES, speakRandom } from "../../../lib/speech";
import { CARD_BACK_IMAGE, MEMORY_ICON_SETS } from "./icons";

type Card = {
  key: string;
  icon: string;
  matched: boolean;
};

function buildDeck(icons: string[]): Card[] {
  const pairs = icons.flatMap((icon, i) => [
    { key: `${i}-a`, icon, matched: false },
    { key: `${i}-b`, icon, matched: false },
  ]);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

function MemoryBoard({
  world,
  onReplay,
}: {
  world: World;
  onReplay: () => void;
}) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Client-only shuffle: must run post-mount so server and first client
    // render both show the loading placeholder (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCards(buildDeck(MEMORY_ICON_SETS[world.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMatched = cards !== null && cards.every((c) => c.matched);

  function handleFlip(index: number) {
    if (!cards || busy || flipped.includes(index) || cards[index].matched) return;
    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setBusy(true);
      const [a, b] = nextFlipped;
      if (cards[a].icon === cards[b].icon) {
        speakRandom(POSITIVE_PHRASES);
        setTimeout(() => {
          setCards((prev) =>
            prev
              ? prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
              : prev
          );
          setFlipped([]);
          setBusy(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 800);
      }
    }
  }

  if (!cards) {
    return (
      <div className="flex aspect-square w-full max-w-md items-center justify-center text-5xl sm:max-w-lg">
        🧠
      </div>
    );
  }

  return (
    <>
      <div className="grid w-full max-w-md grid-cols-3 gap-3 sm:max-w-lg sm:gap-4">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || card.matched;
          return (
            <button
              key={card.key}
              onClick={() => handleFlip(index)}
              className={`relative aspect-square overflow-hidden rounded-2xl shadow-lg transition-transform duration-200 active:scale-90 ${
                card.matched ? "opacity-60" : ""
              }`}
            >
              {isFlipped ? (
                <div key={card.key + "-front"} className="animate-pop-in relative h-full w-full bg-white p-2">
                  <Image src={card.icon} alt="" fill className="object-contain p-2" />
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <Image src={CARD_BACK_IMAGE} alt="" fill className="object-cover" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {allMatched && (
        <Celebration
          message="¡Encontraste todas las parejas!"
          onReplay={onReplay}
          onBack={() => history.back()}
        />
      )}
    </>
  );
}

export default function MemoryGame({ world }: { world: World }) {
  const [round, setRound] = useState(0);

  return (
    <main
      className={`flex flex-1 flex-col items-center gap-6 bg-gradient-to-b ${world.gradient} px-4 py-6`}
    >
      <GameTopBar world={world} title="🧠 Memoria" />

      <p className="text-center text-xl font-semibold text-white drop-shadow">
        Toca dos cartas para encontrar las parejas
      </p>

      <MemoryBoard key={round} world={world} onReplay={() => setRound((r) => r + 1)} />
    </main>
  );
}
