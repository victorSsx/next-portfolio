"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Lang = "pt" | "en" | "es";

const LANG_MAP: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

type RecognitionResultEvent = { results: { 0: { 0: { transcript: string } } } };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Encapsula a Web Speech API: fala as respostas (TTS) e ouve o microfone (STT).
// Degrada com elegância — botões só aparecem quando o navegador suporta.
export function useVoice(lang: Lang) {
  const [mounted, setMounted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const supportsTTS = mounted && typeof window !== "undefined" && "speechSynthesis" in window;
  const supportsSTT = mounted && getRecognitionCtor() !== null;

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!enabledRef.current || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_MAP[lang];
      const prefix = LANG_MAP[lang].slice(0, 2);
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(prefix));
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const listen = useCallback(
    (onResult: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = LANG_MAP[lang];
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (text) onResult(text);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      try {
        rec.start();
      } catch {
        setListening(false);
      }
    },
    [lang]
  );

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  return { speaking, listening, enabled, setEnabled, speak, stopSpeaking, listen, stopListening, supportsTTS, supportsSTT };
}
