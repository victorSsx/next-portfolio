"use client";

import { BudgetSection } from "../components/BudgetSection";
import { ProjectsSection } from "../components/ProjectsSection";
import { useLanguage } from "../lib/LanguageContext";

const LOGO = "/images/logo-victor-ai-transparent.png";

// Página "vitrine" para divulgar em plataformas (Workana, Upwork...) — sem nenhum contato.
export default function VitrinePage() {
  const { lang, setLang } = useLanguage();

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

      <ProjectsSection carousel />
      <BudgetSection showcase />
    </main>
  );
}
