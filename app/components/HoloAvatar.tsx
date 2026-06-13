"use client";

import { useEffect, useRef } from "react";

export type HoloState = "idle" | "listening" | "thinking" | "speaking";

const LOGO = "/images/logo-victor-ai-transparent.png";

// Avatar holográfico reativo da IA — a logo dourada flutua dentro de anéis,
// scanlines e brilho que mudam conforme o estado da conversa (gold "JARVIS").
// No modo "hero" segue o mouse com leve inclinação 3D (parallax).
export function HoloAvatar({ state = "idle", size = "sm" }: { state?: HoloState; size?: "sm" | "hero" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (size !== "hero") return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / window.innerWidth;
        const dy = (e.clientY - cy) / window.innerHeight;
        const clamp = (v: number) => Math.max(-14, Math.min(14, v));
        el.style.setProperty("--ry", `${clamp(dx * 34).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${clamp(-dy * 34).toFixed(2)}deg`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", reset);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <div ref={ref} className={`holo${size === "hero" ? " holo--hero" : ""}`} data-state={state} aria-hidden="true">
      <span className="holo__halo" />
      <span className="holo__ring holo__ring--1" />
      <span className="holo__ring holo__ring--2" />
      <span className="holo__ring holo__ring--3" />
      <span className="holo__core">
        <img src={LOGO} alt="" />
        <span className="holo__scan" />
      </span>
      <span className="holo__base" />
      <span className="holo__eq">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
