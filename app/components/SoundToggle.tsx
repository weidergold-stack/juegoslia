"use client";

import { useEffect, useState } from "react";
import { isSpeechEnabled, setSpeechEnabled } from "../lib/speech";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Client-only localStorage read: must run post-mount so server and
    // first client render both default to enabled (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isSpeechEnabled());
  }, []);

  return (
    <button
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        setSpeechEnabled(next);
      }}
      aria-label={enabled ? "Silenciar sonido" : "Activar sonido"}
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md active:scale-90 ${className}`}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
