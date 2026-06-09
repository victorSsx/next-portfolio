"use client";

import { ProjectsSection } from "../components/ProjectsSection";
import { VitrineAssistant } from "../components/VitrineAssistant";
import { VitrineBudget } from "../components/VitrineBudget";
import { VitrineReviews } from "../components/VitrineReviews";
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

      <VitrineAssistant />
      <VitrineBudget />
      <ProjectsSection carousel showFilter />
      <VitrineReviews />
    </main>
  );
}
