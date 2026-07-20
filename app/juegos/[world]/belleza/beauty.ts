export type Hairstyle = {
  id: string;
  name: string;
  image: string;
};

export const MESSY_IMAGE = "/characters/belleza-messy.jpg";
export const HAND_IMAGE = "/characters/belleza-mano.jpg";

export const HAIRSTYLES: Hairstyle[] = [
  { id: "cola", name: "Cola de Caballo", image: "/characters/belleza-cola.jpg" },
  { id: "trenzas", name: "Trenzas", image: "/characters/belleza-trenzas.jpg" },
  { id: "monos", name: "Moños", image: "/characters/belleza-monos.jpg" },
];

export type TangleSpot = { id: number; x: number; y: number };

export const TANGLE_SPOTS: TangleSpot[] = [
  { id: 0, x: 30, y: 20 },
  { id: 1, x: 62, y: 18 },
  { id: 2, x: 22, y: 42 },
  { id: 3, x: 70, y: 45 },
  { id: 4, x: 40, y: 65 },
  { id: 5, x: 58, y: 68 },
];

export type NailSpot = { id: number; x: number; y: number };

export const NAIL_SPOTS: NailSpot[] = [
  { id: 0, x: 8, y: 47 },
  { id: 1, x: 20, y: 17 },
  { id: 2, x: 36, y: 8 },
  { id: 3, x: 51, y: 14 },
  { id: 4, x: 62, y: 31 },
];

export const NAIL_COLORS = [
  "#f9a8d4",
  "#c4b5fd",
  "#93c5fd",
  "#86efac",
  "#fde68a",
];
