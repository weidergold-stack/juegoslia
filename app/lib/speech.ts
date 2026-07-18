const SPEECH_KEY = "juegos-ninas-speech-enabled";

export const POSITIVE_PHRASES = [
  "¡Muy bien!",
  "¡Excelente!",
  "¡Genial!",
  "¡Lo lograste!",
  "¡Fantástico!",
  "¡Súper bien!",
  "¡Increíble!",
];

export const TRY_AGAIN_PHRASES = [
  "Casi, inténtalo de nuevo",
  "Un poquito más, tú puedes",
  "Casi lo logras, otra vez",
];

let voice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function loadVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesReady = true;
  voice =
    voices.find((v) => /es-(MX|US|CO|419|AR|CL)/i.test(v.lang)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("es")) ||
    null;
}

function ensureVoicesLoaded() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (voicesReady) return;
  loadVoice();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoice, {
    once: false,
  });
}

// The Web Speech API doesn't expose a reliable cross-browser "gender" flag,
// so picking a woman's voice for story narration is a best-effort name match
// against common female Spanish TTS voice names.
const FEMALE_NAME_HINTS = [
  "mujer",
  "female",
  "sabina",
  "helena",
  "laura",
  "paulina",
  "mónica",
  "monica",
  "elena",
  "lucia",
  "lucía",
  "camila",
  "conchita",
  "esperanza",
  "isabela",
  "isabella",
  "penélope",
  "penelope",
  "soledad",
  "valeria",
  "victoria",
  "carmen",
  "marisol",
  "paloma",
];

let femaleVoice: SpeechSynthesisVoice | null = null;
let femaleVoiceReady = false;

function loadFemaleVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  femaleVoiceReady = true;
  const spanish = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  femaleVoice =
    spanish.find((v) =>
      FEMALE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
    ) ||
    spanish.find((v) => /es-(MX|US|419|CO)/i.test(v.lang)) ||
    spanish[0] ||
    null;
}

function ensureFemaleVoiceLoaded() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (femaleVoiceReady) return;
  loadFemaleVoice();
  window.speechSynthesis.addEventListener("voiceschanged", loadFemaleVoice, {
    once: false,
  });
}

export function isSpeechEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(SPEECH_KEY);
  return v === null ? true : v === "1";
}

export function setSpeechEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SPEECH_KEY, enabled ? "1" : "0");
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!isSpeechEnabled()) return;
  ensureVoicesLoaded();

  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? "es-MX";
  utter.rate = 0.95;
  utter.pitch = 1.15;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function speakRandom(phrases: string[]) {
  speak(phrases[Math.floor(Math.random() * phrases.length)]);
}

export function narrate(
  text: string,
  handlers?: { onStart?: () => void; onEnd?: () => void }
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    handlers?.onEnd?.();
    return;
  }
  ensureFemaleVoiceLoaded();
  window.speechSynthesis.cancel();

  if (!isSpeechEnabled()) {
    handlers?.onEnd?.();
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  if (femaleVoice) utter.voice = femaleVoice;
  utter.lang = femaleVoice?.lang ?? "es-MX";
  utter.rate = 0.92;
  utter.pitch = 1.2;
  utter.onstart = () => handlers?.onStart?.();
  utter.onend = () => handlers?.onEnd?.();
  utter.onerror = () => handlers?.onEnd?.();

  window.speechSynthesis.speak(utter);
}

export function stopNarration() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
