"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Lang = "pt" | "en" | "es";

const LANG_MAP: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

// Palavras-chave das vozes mais naturais por idioma (ordem = prioridade).
// "natural" = vozes neurais do Edge/Azure; "google" = vozes online do Chrome.
const PREFERRED: Record<Lang, string[]> = {
  pt: ["natural", "google", "luciana", "thalita", "francisca", "antonio", "brenda", "premium", "enhanced"],
  en: ["natural", "google", "samantha", "aria", "jenny", "premium", "enhanced"],
  es: ["natural", "google", "monica", "mónica", "paulina", "premium", "enhanced"],
};

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

const normalizeLang = (l: string) => l.toLowerCase().replace("_", "-");

// Escolhe a voz mais natural do idioma: região exata primeiro, depois ranqueia
// por palavra-chave de qualidade e por voz online (geralmente mais natural).
function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | undefined {
  const code = LANG_MAP[lang].toLowerCase();
  const base = code.slice(0, 2);
  const inLang = voices.filter((v) => normalizeLang(v.lang || "").startsWith(base));
  if (!inLang.length) return undefined;
  const exact = inLang.filter((v) => normalizeLang(v.lang) === code);
  const pool = exact.length ? exact : inLang;
  const prefs = PREFERRED[lang];
  const ranked = pool
    .map((v) => {
      const name = v.name.toLowerCase();
      let idx = prefs.findIndex((k) => name.includes(k));
      if (idx === -1) idx = prefs.length;
      return { v, idx, online: v.localService === false };
    })
    .sort((a, b) => a.idx - b.idx || Number(b.online) - Number(a.online));
  return ranked[0].v;
}

// Encapsula a voz da IA: tenta a voz neural humana (rota /api/tts via ElevenLabs)
// e cai de volta na voz do navegador se não estiver configurada. Ouve o microfone (STT).
export function useVoice(lang: Lang) {
  const [mounted, setMounted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsServerRef = useRef<boolean | null>(null); // null=desconhecido, true=disponível, false=usar navegador
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const supportsTTS = mounted && typeof window !== "undefined" && "speechSynthesis" in window;
  const supportsSTT = mounted && getRecognitionCtor() !== null;

  // Voz do navegador (fallback).
  const speakBrowser = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_MAP[lang];
      const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
      const voice = pickVoice(voices, lang);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.97;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Voz da IA: tenta a neural (humana) e cai no navegador se indisponível.
  const speak = useCallback(
    (text: string) => {
      if (!enabledRef.current || !text) return;
      if (ttsServerRef.current === false) {
        speakBrowser(text);
        return;
      }
      fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang }),
      })
        .then((r) => {
          if (r.status === 503) {
            ttsServerRef.current = false;
            throw new Error("tts-not-configured");
          }
          if (!r.ok) throw new Error("tts-" + r.status);
          ttsServerRef.current = true;
          return r.blob();
        })
        .then((blob) => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
          if (audioRef.current) audioRef.current.pause();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onplay = () => setSpeaking(true);
          audio.onended = () => {
            setSpeaking(false);
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => {
            setSpeaking(false);
            URL.revokeObjectURL(url);
          };
          audio.play().catch(() => {
            setSpeaking(false);
            URL.revokeObjectURL(url);
            speakBrowser(text);
          });
        })
        .catch(() => speakBrowser(text));
    },
    [lang, speakBrowser]
  );

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
