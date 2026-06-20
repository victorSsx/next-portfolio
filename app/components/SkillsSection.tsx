"use client";

import { siteData } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const technologies = siteData.technologies ?? [];

const STR = {
  pt: {
    eyebrow: "Habilidades",
    title: "Tecnologias que eu domino",
    lead: "As ferramentas e linguagens que uso pra tirar o seu projeto do papel.",
  },
  en: {
    eyebrow: "Skills",
    title: "Technologies I work with",
    lead: "The tools and languages I use to bring your project to life.",
  },
  es: {
    eyebrow: "Habilidades",
    title: "Tecnologías que domino",
    lead: "Las herramientas y lenguajes que uso para hacer realidad tu proyecto.",
  },
} as const;

export function SkillsSection() {
  const { lang } = useLanguage();
  const t = STR[lang] ?? STR.pt;

  if (technologies.length === 0) return null;

  return (
    <section className="section skills" id="habilidades">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p>{t.lead}</p>
      </div>
      <ul className="skills__grid" data-animate>
        {technologies.map((tech) => (
          <li key={tech} className="skills__chip">
            {tech}
          </li>
        ))}
      </ul>
    </section>
  );
}
