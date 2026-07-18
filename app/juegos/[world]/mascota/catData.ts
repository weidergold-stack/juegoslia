export type CatStats = {
  hunger: number;
  clean: number;
  teeth: number;
  happy: number;
  meals: number;
  lastSaved: number;
};

export const STORAGE_KEY = "juegos-ninas-mascota-michi-v2";

export const DEFAULT_STATS: CatStats = {
  hunger: 65,
  clean: 50,
  teeth: 40,
  happy: 70,
  meals: 0,
  lastSaved: 0,
};

export function clampStat(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function loadStats(): CatStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS, lastSaved: Date.now() };
    const parsed = JSON.parse(raw) as Partial<CatStats>;
    const base: CatStats = { ...DEFAULT_STATS, ...parsed, lastSaved: parsed.lastSaved ?? 0 };
    const minutesAway = Math.min(
      180,
      Math.max(0, (Date.now() - base.lastSaved) / 60000)
    );
    return {
      hunger: clampStat(base.hunger - minutesAway * 0.7),
      clean: clampStat(base.clean - minutesAway * 0.55),
      teeth: clampStat(base.teeth - minutesAway * 0.35),
      happy: clampStat(base.happy - minutesAway * 0.6),
      meals: base.meals ?? 0,
      lastSaved: Date.now(),
    };
  } catch {
    return { ...DEFAULT_STATS, lastSaved: Date.now() };
  }
}

export function saveStats(stats: CatStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...stats, lastSaved: Date.now() })
    );
  } catch {
    // ignore write errors (private mode, storage full, etc.)
  }
}

export const FOODS = [
  { id: "fish", label: "Pescado", emoji: "🐟", hunger: 18, happy: 5 },
  { id: "milk", label: "Leche", emoji: "🥛", hunger: 14, happy: 4 },
  { id: "chicken", label: "Pollo", emoji: "🍗", hunger: 20, happy: 6 },
] as const;

export const SPECIAL_MEAL = {
  id: "special",
  label: "Comida especial",
  emoji: "🍲",
  hunger: 38,
  happy: 16,
};

export const INGREDIENTS = [
  { id: "fish", emoji: "🐟" },
  { id: "milk", emoji: "🥛" },
  { id: "carrot", emoji: "🥕" },
  { id: "egg", emoji: "🥚" },
  { id: "chicken", emoji: "🍗" },
] as const;

export const DIRT_SPOTS = 8;
export const TEETH_SPOTS = 4;
export const PLAY_TAPS = 5;
export const PET_COOLDOWN_MS = 1200;
export const PET_HAPPY_GAIN = 3;

export function moodEmoji(stats: CatStats) {
  const avg = (stats.hunger + stats.clean + stats.teeth + stats.happy) / 4;
  if (avg >= 75) return "💖";
  if (avg >= 45) return "🙂";
  return "😿";
}
