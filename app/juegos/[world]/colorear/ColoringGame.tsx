"use client";

import { useEffect, useRef, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import Celebration from "../../../components/Celebration";
import { ALT_LINE_IMAGE } from "./pictures";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#4ade80",
  "#22d3ee",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#92400e",
  "#f9a8d4",
];

const CANVAS_SIZE = 600;

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function floodFill(imageData: ImageData, startX: number, startY: number, fill: Rgb) {
  const { width, height, data } = imageData;
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];

  const luminance = 0.299 * targetR + 0.587 * targetG + 0.114 * targetB;
  if (luminance < 60) return false;
  if (
    Math.abs(targetR - fill.r) < 10 &&
    Math.abs(targetG - fill.g) < 10 &&
    Math.abs(targetB - fill.b) < 10
  ) {
    return false;
  }

  const tolerance = 60;
  const matches = (idx: number) => {
    const dr = data[idx] - targetR;
    const dg = data[idx + 1] - targetG;
    const db = data[idx + 2] - targetB;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance;
  };

  const visited = new Uint8Array(width * height);
  const stack: number[] = [startX, startY];
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const vIdx = y * width + x;
    if (visited[vIdx]) continue;
    const idx = vIdx * 4;
    if (!matches(idx)) continue;
    visited[vIdx] = 1;
    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return true;
}

export default function ColoringGame({ world }: { world: World }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [selected, setSelected] = useState(PALETTE[0]);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [pictureIndex, setPictureIndex] = useState(0);

  const pictures = [world.lineImage, ALT_LINE_IMAGE[world.id]];
  const currentPicture = pictures[pictureIndex];

  function drawOriginal() {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  useEffect(() => {
    // Resetting UI state when switching pictures, not an SSR concern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(false);
    setDone(false);
    const img = new window.Image();
    img.src = currentPicture;
    img.onload = () => {
      imageRef.current = img;
      drawOriginal();
      setReady(true);
    };
  }, [currentPicture]);

  function handlePaint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * CANVAS_SIZE);
    const y = Math.floor(((clientY - rect.top) / rect.height) * CANVAS_SIZE);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const filled = floodFill(imageData, x, y, hexToRgb(selected));
    if (filled) ctx.putImageData(imageData, 0, 0);
  }

  return (
    <main
      className={`flex flex-1 flex-col items-center gap-5 bg-gradient-to-b ${world.gradient} px-4 py-6`}
    >
      <GameTopBar world={world} title="🎨 Colorear" />

      <p className="text-center text-xl font-semibold text-white drop-shadow">
        Elige un color y toca el dibujo para pintar
      </p>

      <div className="flex gap-3 rounded-full bg-white/80 p-1 shadow-md">
        {pictures.map((_, i) => (
          <button
            key={i}
            onClick={() => setPictureIndex(i)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              pictureIndex === i ? "bg-violet-600 text-white" : "text-violet-600"
            }`}
          >
            Dibujo {i + 1}
          </button>
        ))}
      </div>

      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-xl">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🖍️
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="h-full w-full touch-none"
          onClick={(e) => handlePaint(e.clientX, e.clientY)}
        />
      </div>

      <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3 rounded-3xl bg-white/80 p-4 shadow-md">
        {PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => setSelected(color)}
            aria-label={`Color ${color}`}
            style={{ backgroundColor: color }}
            className={`h-10 w-10 rounded-full border-4 shadow active:scale-90 sm:h-12 sm:w-12 ${
              selected === color ? "border-violet-700" : "border-white"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={drawOriginal}
          className="rounded-full bg-white px-5 py-3 text-lg font-bold text-violet-700 shadow-md active:scale-95"
        >
          🧽 Borrar
        </button>
        <button
          onClick={() => setDone(true)}
          className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-5 py-3 text-lg font-bold text-white shadow-md active:scale-95"
        >
          ✅ ¡Terminé!
        </button>
      </div>

      {done && (
        <Celebration
          message="¡Qué dibujo tan bonito!"
          onReplay={() => {
            drawOriginal();
            setDone(false);
          }}
          onBack={() => history.back()}
        />
      )}
    </main>
  );
}
