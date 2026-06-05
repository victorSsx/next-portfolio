"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLanguage } from "../lib/LanguageContext";

const STORAGE_KEY = "victor-tour-v1";

// Alvos de cada passo — o índice casa com t.tour.steps. null = passo central (boas-vindas).
const STEP_TARGETS: (string | null)[] = [
  null,
  "#projetos h2",
  "#ferramentas h2",
  "#orcamento h2",
  ".testimonials-cta__offer",
  "#contato h2",
];

const PAD = 8; // respiro do spotlight ao redor do alvo

type Rect = { top: number; left: number; width: number; height: number };

// Posição do card: perto do alvo (abaixo ou acima) ou centralizado no passo de boas-vindas.
function computeCardPosition(rect: Rect | null): CSSProperties {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const cardW = Math.min(360, vw - 32);
  const estH = 230;

  if (!rect) {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: cardW };
  }

  const spaceBelow = vh - (rect.top + rect.height);
  const placeBelow = spaceBelow > estH + 24 || spaceBelow > rect.top;
  let top = placeBelow ? rect.top + rect.height + 16 : rect.top - estH - 16;
  top = Math.max(16, Math.min(top, vh - estH - 16));

  let left = rect.left + rect.width / 2 - cardW / 2;
  left = Math.max(16, Math.min(left, vw - cardW - 16));

  return { left, top, width: cardW };
}

export function GuidedTour() {
  const { t } = useLanguage();
  const steps = t.tour.steps;
  const total = steps.length;

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const stepRef = useRef(0);

  const measureCurrent = useCallback(() => {
    const selector = STEP_TARGETS[stepRef.current];
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      stepRef.current = index;
      setStep(index);
      const selector = STEP_TARGETS[index];
      if (!selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      measureCurrent();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [measureCurrent]
  );

  const start = useCallback(() => {
    stepRef.current = 0;
    setShowReplay(false);
    setStep(0);
    setRect(null);
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    setShowReplay(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Primeira visita: inicia sozinho. Visitas seguintes: só mostra o botão "?".
  useEffect(() => {
    let seen = "1";
    try {
      seen = localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      seen = "1";
    }
    if (seen) {
      setShowReplay(true);
      return;
    }
    const tmr = setTimeout(() => start(), 900);
    return () => clearTimeout(tmr);
  }, [start]);

  // Mantém o spotlight grudado no alvo durante rolagem/redimensionamento.
  useEffect(() => {
    if (!active) return;
    const onChange = () => measureCurrent();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, { passive: true });
    const backup = setTimeout(measureCurrent, 520);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
      clearTimeout(backup);
    };
  }, [active, step, measureCurrent]);

  // Teclado: Esc fecha, ←/→ e Enter navegam.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (step < total - 1) goToStep(step + 1);
        else finish();
      } else if (e.key === "ArrowLeft" && step > 0) {
        goToStep(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step, total, goToStep, finish]);

  if (!active) {
    if (!showReplay) return null;
    return (
      <button
        type="button"
        className="tour-replay"
        onClick={start}
        aria-label={t.tour.replay}
        title={t.tour.replay}
      >
        ?
      </button>
    );
  }

  const isLast = step === total - 1;
  const current = steps[step];

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={current.title}>
      <div className="tour__backdrop" data-centered={rect ? undefined : "true"} />
      {rect && (
        <div
          className="tour__spotlight"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}
      <div className="tour__card" style={computeCardPosition(rect)}>
        <div className="tour__card-inner" key={step}>
          <div className="tour__dots" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`tour__dot${i === step ? " is-active" : ""}`} />
            ))}
          </div>
          <h3 className="tour__title">{current.title}</h3>
          <p className="tour__text">{current.text}</p>
          <div className="tour__actions">
            <button type="button" className="tour__skip" onClick={finish}>
              {t.tour.skip}
            </button>
            <div className="tour__nav">
              {step > 0 && (
                <button
                  type="button"
                  className="tour__btn tour__btn--ghost"
                  onClick={() => goToStep(step - 1)}
                >
                  {t.tour.prev}
                </button>
              )}
              <button
                type="button"
                className="tour__btn tour__btn--primary"
                onClick={() => (isLast ? finish() : goToStep(step + 1))}
              >
                {isLast ? t.tour.finish : t.tour.next}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
