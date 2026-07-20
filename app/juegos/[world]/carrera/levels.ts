export type LevelTheme = {
  name: string;
  sky: string;
  fogColor: string;
  hemiSky: string;
  hemiGround: string;
  sunColor: string;
  grassTint: string;
  roadTint: string;
  foliageColors: [string, string];
  trackLength: number;
  speed: number;
  curveAmplitude: number;
  curveWavelength: number;
  night?: boolean;
};

export const LEVELS: LevelTheme[] = [
  {
    name: "Campo Soleado",
    sky: "#bfe3f5",
    fogColor: "#bfe3f5",
    hemiSky: "#bfe3f5",
    hemiGround: "#3a7d34",
    sunColor: "#fff6e0",
    grassTint: "#ffffff",
    roadTint: "#ffffff",
    foliageColors: ["#2f8f46", "#3aa657"],
    trackLength: 1050,
    speed: 26,
    curveAmplitude: 2.2,
    curveWavelength: 160,
  },
  {
    name: "Desierto Dorado",
    sky: "#ffd9a0",
    fogColor: "#ffd9a0",
    hemiSky: "#ffe7bd",
    hemiGround: "#c08a3e",
    sunColor: "#fff2d6",
    grassTint: "#e3ac66",
    roadTint: "#ffdba8",
    foliageColors: ["#c98a3a", "#dba24f"],
    trackLength: 1300,
    speed: 29,
    curveAmplitude: 2.8,
    curveWavelength: 135,
  },
  {
    name: "Noche de Estrellas",
    sky: "#0f1a3c",
    fogColor: "#16224f",
    hemiSky: "#2a3a6b",
    hemiGround: "#111a33",
    sunColor: "#aab8ff",
    grassTint: "#25415a",
    roadTint: "#8fa0d8",
    foliageColors: ["#1f5c38", "#245f3d"],
    trackLength: 1550,
    speed: 32,
    curveAmplitude: 3.2,
    curveWavelength: 115,
    night: true,
  },
];
