"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import {
  CatStats,
  DIRT_SPOTS,
  FOODS,
  INGREDIENTS,
  PET_COOLDOWN_MS,
  PET_HAPPY_GAIN,
  PLAY_TAPS,
  SPECIAL_MEAL,
  TEETH_SPOTS,
  clampStat,
  loadStats,
  moodEmoji,
  saveStats,
} from "./catData";
import { speak } from "../../../lib/speech";

type Pose = "idle" | "eating" | "bathing" | "sleeping" | "playing";
type ModalType = "feed" | "cook" | "bathe" | "brush" | "play" | "sleep" | null;
type Spot = { id: number; x: number; y: number };

const POSE_IMAGES: Record<Pose, string> = {
  idle: "/cat/cat-idle.jpg",
  eating: "/cat/cat-eating.jpg",
  bathing: "/cat/cat-bath.jpg",
  sleeping: "/cat/cat-sleep.jpg",
  playing: "/cat/cat-play.jpg",
};

function randomSpot() {
  return { x: 15 + Math.random() * 65, y: 15 + Math.random() * 60 };
}

function randomTeethSpot() {
  return { x: 38 + Math.random() * 24, y: 56 + Math.random() * 18 };
}

function StatBar({
  emoji,
  value,
  color,
  label,
}: {
  emoji: string;
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center gap-1 text-xs font-bold text-violet-700">
        <span>{emoji}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function CatGame({ world }: { world: World }) {
  const [stats, setStats] = useState<CatStats | null>(null);
  const [pose, setPose] = useState<Pose>("idle");
  const [modal, setModal] = useState<ModalType>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const [cookSlots, setCookSlots] = useState<(string | null)[]>([null, null, null]);
  const [cooking, setCooking] = useState(false);

  const [dirtSpots, setDirtSpots] = useState<Spot[]>([]);
  const [teethSpots, setTeethSpots] = useState<Spot[]>([]);
  const [teethClean, setTeethClean] = useState(false);
  const scrubbingRef = useRef(false);
  const lastPetRef = useRef(0);

  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [tapsLeft, setTapsLeft] = useState(PLAY_TAPS);

  useEffect(() => {
    // Client-only load (localStorage + Date.now()): must run post-mount so
    // server and first client render both show the loading placeholder.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(loadStats());
  }, []);

  useEffect(() => {
    if (!stats) return;
    const id = setInterval(() => {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              hunger: clampStat(prev.hunger - 1.2),
              clean: clampStat(prev.clean - 0.9),
              teeth: clampStat(prev.teeth - 0.6),
              happy: clampStat(prev.happy - 1),
            }
          : prev
      );
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats !== null]);

  useEffect(() => {
    if (stats) saveStats(stats);
  }, [stats]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function announce(text: string) {
    setToast(text);
    speak(text);
  }

  if (!stats) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-amber-100 to-orange-200 text-5xl">
        🐱
      </main>
    );
  }

  function feed(foodId: string) {
    const food =
      foodId === "special" ? SPECIAL_MEAL : FOODS.find((f) => f.id === foodId)!;
    if (foodId === "special" && stats!.meals <= 0) return;
    setPose("eating");
    setStats((s) =>
      s
        ? {
            ...s,
            hunger: clampStat(s.hunger + food.hunger),
            happy: clampStat(s.happy + food.happy),
            meals: foodId === "special" ? s.meals - 1 : s.meals,
          }
        : s
    );
    announce(`¡A Michi le encantó ${food.label}! ${food.emoji}`);
    setModal(null);
    setTimeout(() => setPose("idle"), 1400);
  }

  function toggleIngredient(id: string) {
    setCookSlots((prev) => {
      const filledIndex = prev.indexOf(id);
      if (filledIndex !== -1) {
        const next = [...prev];
        next[filledIndex] = null;
        return next;
      }
      const emptyIndex = prev.indexOf(null);
      if (emptyIndex === -1) return prev;
      const next = [...prev];
      next[emptyIndex] = id;
      return next;
    });
  }

  function startCooking() {
    if (cookSlots.some((s) => !s) || cooking) return;
    setCooking(true);
    setTimeout(() => {
      setStats((s) => (s ? { ...s, meals: s.meals + 1 } : s));
      setCooking(false);
      setCookSlots([null, null, null]);
      announce("¡Comida especial lista! 🍲");
      setModal(null);
    }, 1600);
  }

  function openBathe() {
    const count = Math.min(
      DIRT_SPOTS,
      Math.max(4, Math.round((100 - stats!.clean) / 10))
    );
    setDirtSpots(
      Array.from({ length: count }, (_, i) => ({ id: i, ...randomSpot() }))
    );
    setPose("bathing");
    setModal("bathe");
  }

  function finishBathe() {
    setStats((s) => (s ? { ...s, clean: 100, happy: clampStat(s.happy + 8) } : s));
    announce("¡Michi quedó limpita! ✨");
    setTimeout(() => {
      setModal(null);
      setPose("idle");
    }, 900);
  }

  function scrubDirt(clientX: number, clientY: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setDirtSpots((prev) => {
      const next = prev.filter((s) => Math.hypot(s.x - x, s.y - y) > 9);
      if (next.length !== prev.length && next.length === 0) finishBathe();
      return next;
    });
  }

  function openBrush() {
    const count = Math.min(
      TEETH_SPOTS,
      Math.max(2, Math.round((100 - stats!.teeth) / 20))
    );
    setTeethSpots(
      Array.from({ length: count }, (_, i) => ({ id: i, ...randomTeethSpot() }))
    );
    setTeethClean(false);
    setModal("brush");
  }

  function finishBrush() {
    setTeethClean(true);
    setStats((s) => (s ? { ...s, teeth: 100, happy: clampStat(s.happy + 8) } : s));
    announce("¡Dientes brillantes! 🦷✨");
    setTimeout(() => setModal(null), 1100);
  }

  function scrubTeeth(clientX: number, clientY: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setTeethSpots((prev) => {
      const next = prev.filter((s) => Math.hypot(s.x - x, s.y - y) > 10);
      if (next.length !== prev.length && next.length === 0) finishBrush();
      return next;
    });
  }

  function openPlay() {
    setBallPos(randomSpot());
    setTapsLeft(PLAY_TAPS);
    setPose("playing");
    setModal("play");
  }

  function tapBall() {
    setTapsLeft((t) => {
      const next = t - 1;
      if (next <= 0) {
        setStats((s) =>
          s
            ? {
                ...s,
                happy: clampStat(s.happy + 25),
                hunger: clampStat(s.hunger - 3),
                clean: clampStat(s.clean - 5),
              }
            : s
        );
        announce("¡A Michi le encantó jugar! 🎾");
        setTimeout(() => {
          setModal(null);
          setPose("idle");
        }, 900);
      } else {
        setBallPos(randomSpot());
      }
      return Math.max(0, next);
    });
  }

  function sleep() {
    setPose("sleeping");
    setModal("sleep");
    setTimeout(() => {
      setStats((s) =>
        s
          ? {
              ...s,
              happy: clampStat(s.happy + 20),
              hunger: clampStat(s.hunger - 5),
            }
          : s
      );
      announce("¡Michi durmió una siesta rica! 😴");
      setModal(null);
      setPose("idle");
    }, 2200);
  }

  function petCat(e: React.MouseEvent<HTMLDivElement>) {
    if (modal || pose !== "idle") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Math.random();
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((p) => p.id !== id)), 900);

    const now = Date.now();
    if (now - lastPetRef.current > PET_COOLDOWN_MS) {
      lastPetRef.current = now;
      setStats((s) =>
        s ? { ...s, happy: clampStat(s.happy + PET_HAPPY_GAIN) } : s
      );
    }
  }

  const lowHunger = stats.hunger < 30;
  const lowClean = stats.clean < 30;
  const lowTeeth = stats.teeth < 30;
  const lowHappy = stats.happy < 30;
  const dirtIndicatorCount = Math.round((100 - stats.clean) / 25);

  return (
    <main className="flex flex-1 flex-col items-center gap-3 bg-gradient-to-b from-amber-100 to-orange-200 px-4 py-5">
      <GameTopBar world={world} title="🐱 Mascota" />

      <div className="grid w-full max-w-md grid-cols-2 gap-x-3 gap-y-2 rounded-3xl bg-white/70 p-3 shadow-md sm:grid-cols-4">
        <StatBar emoji="🍗" label="Hambre" value={stats.hunger} color="#fb923c" />
        <StatBar emoji="🛁" label="Limpieza" value={stats.clean} color="#38bdf8" />
        <StatBar emoji="🦷" label="Dientes" value={stats.teeth} color="#a3e635" />
        <StatBar emoji="😊" label="Felicidad" value={stats.happy} color="#facc15" />
      </div>

      {stats.meals > 0 && (
        <div className="rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-violet-700 shadow">
          🍲 Comida especial x{stats.meals}
        </div>
      )}

      <div className="relative flex w-full max-w-sm flex-1 items-center justify-center">
        <div
          onClick={petCat}
          className="relative aspect-square w-full max-w-xs cursor-pointer rounded-[2.5rem] bg-white/60 shadow-xl"
        >
          <Image
            src={POSE_IMAGES[pose]}
            alt="Michi"
            fill
            className="animate-pop-in object-contain p-4"
          />
          <span className="absolute -right-2 -top-2 text-4xl">
            {moodEmoji(stats)}
          </span>
          {pose === "idle" &&
            Array.from({ length: dirtIndicatorCount }).map((_, i) => (
              <span
                key={i}
                className="absolute text-xl"
                style={{
                  left: `${15 + ((i * 23) % 60)}%`,
                  top: `${20 + ((i * 31) % 55)}%`,
                }}
              >
                💧
              </span>
            ))}
          {pose === "idle" && stats.teeth < 40 && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-2xl">
              🦷💨
            </span>
          )}
          {hearts.map((h) => (
            <span
              key={h.id}
              className="animate-rise-fade pointer-events-none absolute text-3xl"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              💕
            </span>
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-2">
        <button
          onClick={() => setModal("feed")}
          className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90 ${
            lowHunger ? "ring-2 ring-red-400" : ""
          }`}
        >
          🍽️
          <span className="text-[10px] font-bold text-violet-700">Comer</span>
        </button>
        <button
          onClick={() => setModal("cook")}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90"
        >
          🍳
          <span className="text-[10px] font-bold text-violet-700">Cocinar</span>
        </button>
        <button
          onClick={openBathe}
          className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90 ${
            lowClean ? "ring-2 ring-red-400" : ""
          }`}
        >
          🛁
          <span className="text-[10px] font-bold text-violet-700">Bañar</span>
        </button>
        <button
          onClick={openBrush}
          className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90 ${
            lowTeeth ? "ring-2 ring-red-400" : ""
          }`}
        >
          🪥
          <span className="text-[10px] font-bold text-violet-700">Dientes</span>
        </button>
        <button
          onClick={openPlay}
          className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90 ${
            lowHappy ? "ring-2 ring-red-400" : ""
          }`}
        >
          🎾
          <span className="text-[10px] font-bold text-violet-700">Jugar</span>
        </button>
        <button
          onClick={sleep}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-2xl shadow-md active:scale-90"
        >
          😴
          <span className="text-[10px] font-bold text-violet-700">Dormir</span>
        </button>
      </div>

      {toast && (
        <div className="animate-pop-in fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-center text-base font-bold text-violet-700 shadow-xl">
          {toast}
        </div>
      )}

      {modal === "feed" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="animate-pop-in flex w-full max-w-sm flex-col items-center gap-4 rounded-[2.5rem] bg-white px-6 py-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-violet-700">
              ¿Qué le damos a Michi?
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {FOODS.map((food) => (
                <button
                  key={food.id}
                  onClick={() => feed(food.id)}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-amber-100 p-3 text-3xl shadow active:scale-90"
                >
                  {food.emoji}
                  <span className="text-xs font-bold text-violet-700">
                    {food.label}
                  </span>
                </button>
              ))}
              <button
                onClick={() => feed("special")}
                disabled={stats.meals <= 0}
                className="flex flex-col items-center gap-1 rounded-2xl bg-amber-200 p-3 text-3xl shadow active:scale-90 disabled:opacity-30"
              >
                🍲
                <span className="text-xs font-bold text-violet-700">
                  Especial x{stats.meals}
                </span>
              </button>
            </div>
            <button
              onClick={() => setModal(null)}
              className="rounded-full bg-violet-100 px-6 py-2 font-bold text-violet-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {modal === "cook" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="animate-pop-in flex w-full max-w-sm flex-col items-center gap-4 rounded-[2.5rem] bg-white px-6 py-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-violet-700">
              Cocina una comida especial
            </h2>
            <p className="text-sm font-semibold text-violet-500">
              Elige 3 ingredientes para la olla
            </p>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-dashed border-amber-300 bg-amber-50 text-3xl"
                >
                  {cookSlots[i]
                    ? INGREDIENTS.find((ing) => ing.id === cookSlots[i])?.emoji
                    : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {INGREDIENTS.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => toggleIngredient(ing.id)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow active:scale-90 ${
                    cookSlots.includes(ing.id)
                      ? "bg-amber-300"
                      : "bg-amber-100"
                  }`}
                >
                  {ing.emoji}
                </button>
              ))}
            </div>
            {cooking ? (
              <p className="text-xl font-bold text-orange-500">
                🍳 Cocinando... ♨️
              </p>
            ) : (
              <button
                onClick={startCooking}
                disabled={cookSlots.some((s) => !s)}
                className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-8 py-3 text-lg font-bold text-white shadow-md active:scale-95 disabled:opacity-30"
              >
                ¡Cocinar!
              </button>
            )}
            {!cooking && (
              <button
                onClick={() => {
                  setModal(null);
                  setCookSlots([null, null, null]);
                }}
                className="rounded-full bg-violet-100 px-6 py-2 font-bold text-violet-700"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {modal === "bathe" && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-sky-900/60 px-6">
          <p className="text-xl font-bold text-white drop-shadow">
            Desliza el dedo sobre las manchitas para limpiar a Michi
          </p>
          <div
            className="relative aspect-square w-full max-w-xs touch-none rounded-[2.5rem] bg-white shadow-2xl"
            onPointerDown={(e) => {
              scrubbingRef.current = true;
              scrubDirt(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerMove={(e) => {
              if (!scrubbingRef.current) return;
              scrubDirt(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerUp={() => (scrubbingRef.current = false)}
            onPointerLeave={() => (scrubbingRef.current = false)}
          >
            <Image
              src={POSE_IMAGES.bathing}
              alt="Michi en la tina"
              fill
              className="pointer-events-none object-contain p-4"
            />
            {dirtSpots.map((spot) => (
              <span
                key={spot.id}
                className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-800 bg-amber-700/80 shadow"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {modal === "brush" && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-teal-900/60 px-6">
          <p className="text-xl font-bold text-white drop-shadow">
            {teethClean
              ? "¡Dientes brillantes! 🪥✨"
              : "Cepilla las manchitas de los dientes"}
          </p>
          <div
            className="relative aspect-square w-full max-w-xs touch-none rounded-[2.5rem] bg-white shadow-2xl"
            onPointerDown={(e) => {
              if (teethClean) return;
              scrubbingRef.current = true;
              scrubTeeth(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerMove={(e) => {
              if (!scrubbingRef.current || teethClean) return;
              scrubTeeth(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerUp={() => (scrubbingRef.current = false)}
            onPointerLeave={() => (scrubbingRef.current = false)}
          >
            <Image
              src={teethClean ? "/cat/cat-teeth-clean.jpg" : "/cat/cat-teeth-dirty.jpg"}
              alt="Dientes de Michi"
              fill
              className="pointer-events-none object-contain p-4"
            />
            {!teethClean &&
              teethSpots.map((spot) => (
                <span
                  key={spot.id}
                  className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-800 bg-yellow-700/80 shadow"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                />
              ))}
          </div>
        </div>
      )}

      {modal === "play" && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-emerald-900/50 px-6">
          <p className="text-xl font-bold text-white drop-shadow">
            Toca el ovillo {tapsLeft} veces más
          </p>
          <div className="relative aspect-square w-full max-w-xs rounded-[2.5rem] bg-white/90 shadow-2xl">
            <Image
              src={POSE_IMAGES.playing}
              alt="Michi jugando"
              fill
              className="object-contain p-6"
            />
            <button
              onClick={tapBall}
              className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-3xl shadow-xl transition-all active:scale-75"
              style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
              aria-label="Ovillo"
            >
              🧶
            </button>
          </div>
        </div>
      )}

      {modal === "sleep" && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-indigo-900/60 px-6">
          <div className="animate-pop-in relative aspect-square w-full max-w-xs rounded-[2.5rem] bg-white/90 shadow-2xl">
            <Image
              src={POSE_IMAGES.sleeping}
              alt="Michi durmiendo"
              fill
              className="object-contain p-4"
            />
            <span className="animate-float absolute -top-4 right-6 text-4xl">
              💤
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
