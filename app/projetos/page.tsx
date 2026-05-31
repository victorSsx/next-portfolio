"use client";

import Link from "next/link";
import { ProjectsSection } from "../components/ProjectsSection";
import { ContactSection } from "../components/ContactSection";
import { useLanguage } from "../lib/LanguageContext";

export default function ProjetosPage() {
  const { t } = useLanguage();

  return (
    <main className="next-portfolio projetos-page">
      <nav className="projetos-topbar" aria-label="Navegação">
        <Link href="/" className="brand-mark" aria-label={t.projects.backHome}>
          <img
            src="/images/logo-victor-ai-transparent.png"
            alt="Logo Victor"
            className="brand-mark__img"
          />
        </Link>
        <Link href="/" className="projetos-back">
          <span aria-hidden="true">←</span> {t.projects.backHome}
        </Link>
      </nav>

      <ProjectsSection showFilter />
      <ContactSection />
    </main>
  );
}
