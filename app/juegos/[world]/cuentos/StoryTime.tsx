"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { World } from "../../../lib/worlds";
import GameTopBar from "../../../components/GameTopBar";
import { isSpeechEnabled } from "../../../lib/speech";
import { STORIES, Story } from "./stories";

export default function StoryTime({ world }: { world: World }) {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeStoryRef = useRef<Story | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener("play", () => {
      setIsNarrating(true);
      setPlaybackError(false);
    });
    audio.addEventListener("pause", () => setIsNarrating(false));
    audio.addEventListener("ended", () => setIsNarrating(false));
    audio.addEventListener("error", () => {
      setIsNarrating(false);
      setPlaybackError(true);
    });
    audio.addEventListener("timeupdate", () => {
      const story = activeStoryRef.current;
      if (!story || !audio.duration || !isFinite(audio.duration)) return;
      const progress = audio.currentTime / audio.duration;
      const idx = Math.min(
        story.scenes.length - 1,
        Math.floor(progress * story.scenes.length)
      );
      setSceneIndex((prev) => (prev === idx ? prev : idx));
    });
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  function playStory(story: Story) {
    setActiveStory(story);
    activeStoryRef.current = story;
    setSceneIndex(0);
    setPlaybackError(false);
    const audio = audioRef.current;
    if (!audio) return;

    const targetSrc = new URL(story.audio, window.location.href).href;
    if (audio.src !== targetSrc) {
      audio.src = story.audio;
    } else {
      audio.currentTime = 0;
    }

    if (isSpeechEnabled()) {
      audio.play().catch(() => setPlaybackError(true));
    }
  }

  function closeStory() {
    audioRef.current?.pause();
    setIsNarrating(false);
    setActiveStory(null);
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-5 bg-gradient-to-b from-violet-200 to-purple-300 px-4 py-6">
      <GameTopBar world={world} title="📖 Cuentos" />

      <p className="text-center text-xl font-semibold text-white drop-shadow">
        Toca la imagen para escuchar el cuento
      </p>

      <div className="grid w-full max-w-md grid-cols-2 gap-5">
        {STORIES.map((story) => (
          <button
            key={story.id}
            onClick={() => playStory(story)}
            className="flex flex-col items-center gap-2 rounded-[2rem] bg-white/80 p-3 shadow-xl transition-transform active:scale-95"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-inner">
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover"
              />
              <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow">
                ▶️
              </span>
            </div>
            <span className="text-sm font-bold text-violet-700">
              {story.title}
            </span>
          </button>
        ))}
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="animate-pop-in flex max-h-[85vh] w-full max-w-sm flex-col items-center gap-3 rounded-[2.5rem] bg-white px-6 py-6 text-center shadow-2xl">
            <div className="relative h-36 w-36 shrink-0">
              <div
                key={sceneIndex}
                className="animate-pop-in absolute inset-0 overflow-hidden rounded-[1.5rem] shadow-lg"
              >
                <Image
                  src={activeStory.scenes[sceneIndex] ?? activeStory.image}
                  alt={activeStory.title}
                  fill
                  className={`object-cover ${
                    isNarrating ? "animate-ken-burns" : ""
                  }`}
                />
              </div>
              {isNarrating && (
                <>
                  <span
                    className="pointer-events-none absolute -top-2 -left-2 animate-sparkle text-xl"
                    style={{ animationDelay: "0s" }}
                  >
                    ✨
                  </span>
                  <span
                    className="pointer-events-none absolute top-3 -right-3 animate-sparkle text-lg"
                    style={{ animationDelay: "0.7s" }}
                  >
                    ✨
                  </span>
                  <span
                    className="pointer-events-none absolute -bottom-2 left-1/3 animate-sparkle text-lg"
                    style={{ animationDelay: "1.4s" }}
                  >
                    ✨
                  </span>
                </>
              )}
            </div>
            <h2 className="shrink-0 text-xl font-bold text-violet-700">
              {activeStory.title}
            </h2>
            {isNarrating && (
              <p className="shrink-0 text-base font-bold text-orange-500">
                🔊 Leyendo el cuento...
              </p>
            )}
            {playbackError && (
              <p className="shrink-0 text-base font-bold text-red-500">
                😿 No se pudo reproducir el audio. Toca &quot;Escuchar de
                nuevo&quot; para intentarlo otra vez.
              </p>
            )}
            <p className="flex-1 overflow-y-auto whitespace-pre-line text-left text-base leading-relaxed text-violet-600">
              {activeStory.text}
            </p>
            <div className="flex shrink-0 flex-wrap justify-center gap-3">
              <button
                onClick={() => playStory(activeStory)}
                className="rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-6 py-3 text-lg font-bold text-white shadow-md active:scale-95"
              >
                🔁 Escuchar de nuevo
              </button>
              <button
                onClick={closeStory}
                className="rounded-full bg-violet-100 px-6 py-3 text-lg font-bold text-violet-700 active:scale-95"
              >
                ✖️ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
