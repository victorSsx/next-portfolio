"use client";

import { useState } from "react";

const CUSTOM_LOGO_PATH: string | null = "/images/logo-victor-ai-transparent.png";

export function HeroSection() {
  const [logoStage, setLogoStage] = useState<"custom" | "svg" | "png" | "vector">(
    CUSTOM_LOGO_PATH ? "custom" : "vector"
  );

  return (
    <section className="hero" id="inicio">
      <img className="hero__image" src="/images/victor-hero.png" alt="Retrato estilizado de Victor" />
      <div className="hero__shade" />

      <nav className="topbar" aria-label="Navegação principal">
        <a className="brand-mark" href="#inicio" aria-label="Voltar ao início">
          {logoStage === "custom" && (
            <img
              src={CUSTOM_LOGO_PATH || ""}
              alt="Logo Victor"
              onError={() => setLogoStage("vector")}
              className="brand-mark__img"
            />
          )}
          {logoStage === "svg" && (
            <img
              src="/images/logo.svg"
              alt="Logo Victor"
              onError={() => setLogoStage("png")}
              className="brand-mark__img"
            />
          )}
          {logoStage === "png" && (
            <img
              src="/images/logo.png"
              alt="Logo Victor"
              onError={() => setLogoStage("vector")}
              className="brand-mark__img"
            />
          )}
          {logoStage === "vector" && (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="gold-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd56b" />
                  <stop offset="50%" stopColor="#c7a447" />
                  <stop offset="100%" stopColor="#9f741f" />
                </linearGradient>
                <linearGradient id="gold-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff0ca" />
                  <stop offset="100%" stopColor="#765310" />
                </linearGradient>
                <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="url(#gold-primary)" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />
              <circle cx="50" cy="50" r="40" stroke="url(#gold-primary)" strokeWidth="1.5" opacity="0.15" />
              <path d="M25 25 L46 72 H52 L31 25 Z" fill="url(#gold-primary)" />
              <path d="M75 25 L54 72 H48 L69 25 Z" fill="url(#gold-secondary)" />
              <circle cx="50" cy="72" r="3" fill="#ffd56b" filter="url(#logo-glow)" />
            </svg>
          )}
        </a>
        <div className="availability">
          <span aria-hidden="true" />
          Disponível para novos projetos
        </div>
        <div className="topbar__links">
          <a href="#projetos">Projetos</a>
          <a href="#orcamento">Orçamento</a>
          <a href="#contato">Contato</a>
        </div>
      </nav>

      <div className="hero__content">
        <p className="eyebrow">Olá, eu sou</p>
        <h1>
          Vic<span>tor.</span>
        </h1>
        <p className="hero__role">
          <span>Desenvolvedor</span>
          <strong>Freelancer</strong>
        </p>
        <p className="hero__lead">
          Transformo ideias em soluções digitais <strong>modernas, intuitivas e de alta performance.</strong>
          Sites, aplicações e experiências que geram resultados reais para o seu negócio.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="#projetos">
            Ver projetos <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button--ghost" href="#orcamento">
            Montar orçamento
          </a>
        </div>
      </div>
    </section>
  );
}
