export type Move = {
  id: string;
  label: string;
  emoji: string;
  image: string;
};

export const IDLE_IMAGE = "/characters/baile-idle.jpg";
export const MUSIC_TRACK = "/sounds/baile-musica.wav";
export const TARGET_CORRECT = 8;

export const MOVES: Move[] = [
  { id: "brazos", label: "Brazos arriba", emoji: "🙌", image: "/characters/baile-brazos.jpg" },
  { id: "giro", label: "Girar", emoji: "🌀", image: "/characters/baile-giro.jpg" },
  { id: "aplauso", label: "Aplaudir", emoji: "👏", image: "/characters/baile-aplauso.jpg" },
];

export function randomMoveId(excludeId?: string) {
  const options = excludeId ? MOVES.filter((m) => m.id !== excludeId) : MOVES;
  return options[Math.floor(Math.random() * options.length)].id;
}
