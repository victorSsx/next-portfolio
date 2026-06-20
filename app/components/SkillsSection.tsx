"use client";

import { useLanguage } from "../lib/LanguageContext";

// Cor dourada dos logos (Simple Icons aceita hex na URL) — combina com o tema.
const ICON_COLOR = "e1b842";

type Skill = { name: string; slug?: string; svg?: "java" | "api" | "ia" };
type Group = { label: Record<string, string>; skills: Skill[] };

const GROUPS: Group[] = [
  {
    label: { pt: "Linguagens", en: "Languages", es: "Lenguajes" },
    skills: [
      { name: "JavaScript", slug: "javascript" },
      { name: "Python", slug: "python" },
      { name: "Java", svg: "java" },
      { name: "PHP", slug: "php" },
    ],
  },
  {
    label: { pt: "Frameworks & APIs", en: "Frameworks & APIs", es: "Frameworks & APIs" },
    skills: [
      { name: "React", slug: "react" },
      { name: "API", svg: "api" },
      { name: "IA", svg: "ia" },
    ],
  },
  {
    label: { pt: "Banco & Automação", en: "Database & Automation", es: "Base de datos & Automatización" },
    skills: [
      { name: "PostgreSQL", slug: "postgresql" },
      { name: "n8n", slug: "n8n" },
    ],
  },
];

const STR = {
  pt: {
    eyebrow: "Habilidades",
    title: "Tecnologias que eu domino",
    lead: "As linguagens e ferramentas que uso pra tirar o seu projeto do papel.",
  },
  en: {
    eyebrow: "Skills",
    title: "Technologies I work with",
    lead: "The languages and tools I use to bring your project to life.",
  },
  es: {
    eyebrow: "Habilidades",
    title: "Tecnologías que domino",
    lead: "Los lenguajes y herramientas que uso para hacer realidad tu proyecto.",
  },
} as const;

function SkillIcon({ skill }: { skill: Skill }) {
  if (skill.slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="skills__icon"
        src={`https://cdn.simpleicons.org/${skill.slug}/${ICON_COLOR}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={20}
        height={20}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  if (skill.svg === "java") {
    return (
      <svg className="skills__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10h13v3.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10z" />
        <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
        <path d="M8 6c.5-.8.5-1.4 0-2.2M12 6c.5-.8.5-1.4 0-2.2" />
      </svg>
    );
  }
  if (skill.svg === "api") {
    return (
      <svg className="skills__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="8 8 4 12 8 16" />
        <polyline points="16 8 20 12 16 16" />
        <line x1="13.5" y1="6" x2="10.5" y2="18" />
      </svg>
    );
  }
  // IA
  return (
    <svg className="skills__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l1.7 4.8 4.8 1.7-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z" />
      <path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </svg>
  );
}

export function SkillsSection() {
  const { lang } = useLanguage();
  const t = STR[lang] ?? STR.pt;

  return (
    <section className="section skills" id="habilidades">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p>{t.lead}</p>
      </div>
      <div className="skills__groups" data-animate>
        {GROUPS.map((g) => (
          <div key={g.label.pt} className="skills__group">
            <h3 className="skills__group-title">{g.label[lang] ?? g.label.pt}</h3>
            <ul className="skills__grid">
              {g.skills.map((s) => (
                <li key={s.name} className="skills__chip">
                  <SkillIcon skill={s} />
                  <span>{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
