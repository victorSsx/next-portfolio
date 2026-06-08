"use client";

import { BudgetSection } from "../components/BudgetSection";
import { ProjectsSection } from "../components/ProjectsSection";
import { useLanguage } from "../lib/LanguageContext";

const LOGO = "/images/logo-victor-ai-transparent.png";

// Página "vitrine" para divulgar em plataformas (Workana, Upwork...) — sem nenhum contato.
export default function VitrinePage() {
  const { t, lang, setLang } = useLanguage();

  return (
    <main className="next-portfolio vitrine-page">
      <header className="vitrine-topbar">
        <div className="vitrine-brand">
          <img className="vitrine-brand__logo" src={LOGO} alt="Victor" />
          <div className="vitrine-brand__id">
            <strong>Victor</strong>
            <span>Desenvolvedor Web</span>
          </div>
        </div>
        <div className="vitrine-langs" role="group" aria-label="Idioma">
          {(["pt", "en", "es"] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={`vitrine-langs__btn${lang === l ? " is-active" : ""}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="vitrine-proof">
        <div className="workana-badge workana-badge--static" data-animate>
          <span className="workana-badge__score">5,0</span>
          <span className="workana-badge__main">
            <span className="workana-badge__stars" aria-hidden="true">★★★★★</span>
            <span className="workana-badge__label">{t.testimonials.workana.label}</span>
            <span className="workana-badge__reviews">2 {t.testimonials.workana.reviewsSuffix}</span>
          </span>
        </div>
      </div>

      <ProjectsSection carousel showFilter />
      <BudgetSection showcase />
    </main>
  );
}
