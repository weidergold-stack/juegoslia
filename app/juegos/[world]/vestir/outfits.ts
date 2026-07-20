export type Doll = {
  id: string;
  name: string;
  color: string;
};

export type Outfit = {
  id: string;
  name: string;
  emoji: string;
};

export const DOLLS: Doll[] = [
  { id: "a", name: "Estrella Rosa", color: "#ec4899" },
  { id: "b", name: "Estrella Morada", color: "#a855f7" },
  { id: "c", name: "Estrella Amarilla", color: "#eab308" },
];

export const OUTFITS: Outfit[] = [
  { id: "superhero", name: "Superhéroe", emoji: "🦸" },
  { id: "princesa", name: "Princesa", emoji: "👑" },
  { id: "sirena", name: "Sirena", emoji: "🧜" },
  { id: "invierno", name: "Invierno", emoji: "❄️" },
  { id: "verano", name: "Verano", emoji: "☀️" },
];

export function outfitImage(dollId: string, outfitId: string) {
  return `/characters/vestir-${dollId}-${outfitId}.jpg`;
}

export const TOTAL_COMBOS = DOLLS.length * OUTFITS.length;
