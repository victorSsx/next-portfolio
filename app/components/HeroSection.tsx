"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { siteData } from "../lib/site-data";
import type { Language } from "../lib/translations";

const CUSTOM_LOGO_PATH: string | null = "/images/logo-victor-ai-transparent.png";

const LANG_OPTIONS: { lang: Language; code: string; label: string }[] = [
  { lang: "pt", code: "PT", label: "Português" },
  { lang: "en", code: "EN", label: "English" },
  { lang: "es", code: "ES", label: "Español" },
];

export function HeroSection() {
  const { t, lang, setLang } = useLanguage();
  const [logoStage, setLogoStage] = useState<"custom" | "svg" | "png" | "vector">(
    CUSTOM_LOGO_PATH ? "custom" : "vector"
  );
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const availability = siteData.availability ?? "available";
  const currentCode = LANG_OPTIONS.find((o) => o.lang === lang)?.code ?? "PT";

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

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

        <div className={`availability availability--${availability}`}>
          <span aria-hidden="true" />
          {t.hero.availabilityLabels[availability]}
        </div>

        <div className="topbar__links">
          <a href="#projetos">{t.nav.projects}</a>
          <a href="#orcamento">{t.nav.budget}</a>
          <a href="#contato">{t.nav.contact}</a>

          <div className="lang-dropdown" ref={langRef}>
            <button
              className="lang-dropdown__btn"
              type="button"
              aria-label="Selecionar idioma"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              onClick={() => setLangOpen((o) => !o)}
            >
              <span className="lang-dropdown__code">{currentCode}</span>
              <span className="lang-dropdown__chevron" aria-hidden="true">▾</span>
            </button>
            {langOpen && (
              <div className="lang-dropdown__menu" role="listbox" aria-label="Idioma">
                {LANG_OPTIONS.map(({ lang: l, code, label }) => (
                  <button
                    key={l}
                    className={`lang-dropdown__option${lang === l ? " is-active" : ""}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    type="button"
                    role="option"
                    aria-selected={lang === l}
                  >
                    <span className="lang-dropdown__code">{code}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="hero__content">
        <p className="eyebrow">{t.hero.greeting}</p>
        <h1>
          Vic<span>tor.</span>
        </h1>
        <p className="hero__role">
          <span>Desenvolvedor</span>
          <strong>Freelancer</strong>
        </p>
        <p className="hero__lead">
          {t.hero.lead}
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="#projetos">
            {t.hero.ctaProjects} <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button--ghost" href="#orcamento">
            {t.hero.ctaBudget}
          </a>
        </div>
        <p className="hero__guarantee">{t.hero.guarantee}</p>
      </div>
    </section>
  );
}
