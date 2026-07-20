export type WorldId = "cami" | "estrellas" | "tito";

export type World = {
  id: WorldId;
  name: string;
  title: string;
  emoji: string;
  colorImage: string;
  lineImage: string;
  gradient: string;
  accent: string;
  accentText: string;
  memoryIcons: string[];
  countingIcon: string;
};

export const WORLDS: Record<WorldId, World> = {
  cami: {
    id: "cami",
    name: "Cami",
    title: "Cami la Perrita Curiosa",
    emoji: "🐶",
    colorImage: "/characters/cami-color.jpg",
    lineImage: "/characters/cami-line.jpg",
    gradient: "from-teal-300 to-cyan-400",
    accent: "#2dd4bf",
    accentText: "text-teal-600",
    memoryIcons: ["🐾", "🦴", "🎒", "💛", "🐕", "🌼"],
    countingIcon: "🐾",
  },
  estrellas: {
    id: "estrellas",
    name: "Las Estrellas",
    title: "Las Estrellas Valientes",
    emoji: "⭐",
    colorImage: "/characters/estrellas-color.jpg",
    lineImage: "/characters/estrellas-line.jpg",
    gradient: "from-fuchsia-300 to-purple-400",
    accent: "#c026d3",
    accentText: "text-fuchsia-600",
    memoryIcons: ["⭐", "🎤", "💜", "🎵", "✨", "👑"],
    countingIcon: "⭐",
  },
  tito: {
    id: "tito",
    name: "Tito",
    title: "Tito el Bebé Curioso",
    emoji: "🍼",
    colorImage: "/characters/tito-color.jpg",
    lineImage: "/characters/tito-line.jpg",
    gradient: "from-emerald-300 to-green-400",
    accent: "#34d399",
    accentText: "text-emerald-600",
    memoryIcons: ["🍼", "🧸", "🧦", "🎈", "🧩", "🦆"],
    countingIcon: "🧸",
  },
};

export const WORLD_LIST = Object.values(WORLDS);

export type GameId =
  | "memoria"
  | "colorear"
  | "rompecabezas"
  | "contar"
  | "carrera"
  | "mascota"
  | "cuentos"
  | "vestir"
  | "belleza"
  | "baile";

export type Game = {
  id: GameId;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
};

export const GAMES: Game[] = [
  {
    id: "memoria",
    name: "Memoria",
    emoji: "🧠",
    description: "Encuentra las parejas iguales",
    gradient: "from-sky-300 to-blue-400",
  },
  {
    id: "colorear",
    name: "Colorear",
    emoji: "🎨",
    description: "Pinta el dibujo con muchos colores",
    gradient: "from-rose-300 to-pink-400",
  },
  {
    id: "rompecabezas",
    name: "Rompecabezas",
    emoji: "🧩",
    description: "Arma el dibujo con las piezas",
    gradient: "from-amber-300 to-orange-400",
  },
  {
    id: "contar",
    name: "Contar",
    emoji: "🔢",
    description: "Cuenta y toca el número correcto",
    gradient: "from-lime-300 to-green-400",
  },
  {
    id: "carrera",
    name: "Carrera",
    emoji: "🏎️",
    description: "Maneja tu carro y junta estrellas",
    gradient: "from-red-400 to-orange-500",
  },
  {
    id: "mascota",
    name: "Mascota",
    emoji: "🐱",
    description: "Cuida, alimenta y baña a Michi",
    gradient: "from-amber-300 to-pink-400",
  },
  {
    id: "cuentos",
    name: "Cuentos",
    emoji: "📖",
    description: "Toca la imagen y escucha el cuento",
    gradient: "from-violet-300 to-purple-400",
  },
  {
    id: "vestir",
    name: "Vestir a las Estrellas",
    emoji: "👗",
    description: "Elige el outfit para cada Estrella",
    gradient: "from-pink-300 to-fuchsia-400",
  },
  {
    id: "belleza",
    name: "Salón de Belleza",
    emoji: "💇",
    description: "Peina el cabello y pinta las uñitas",
    gradient: "from-fuchsia-200 to-pink-300",
  },
  {
    id: "baile",
    name: "Baile y Música",
    emoji: "💃",
    description: "Sigue el paso y baila con Las Estrellas",
    gradient: "from-purple-300 to-pink-400",
  },
];
