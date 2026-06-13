"use client";

export type HoloState = "idle" | "listening" | "thinking" | "speaking";

const LOGO = "/images/logo-victor-ai-transparent.png";

// Avatar holográfico reativo da IA — a logo dourada flutua dentro de anéis,
// scanlines e brilho que mudam conforme o estado da conversa (gold "JARVIS").
export function HoloAvatar({ state = "idle" }: { state?: HoloState }) {
  return (
    <div className="holo" data-state={state} aria-hidden="true">
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
