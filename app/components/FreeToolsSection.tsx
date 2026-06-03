"use client";

import { siteData } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const freeTools = siteData.freeTools ?? [];

export function FreeToolsSection() {
  const { t } = useLanguage();

  if (freeTools.length === 0) return null;

  return (
    <section className="section free-tools" id="ferramentas">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.freeTools.eyebrow}</p>
        <h2>{t.freeTools.title}</h2>
        <p>{t.freeTools.lead}</p>
      </div>

      <div className="free-tools__grid">
        {freeTools.map((tool, i) => (
          <article
            className="free-tool-card"
            key={tool.id}
            data-animate
            style={{ "--animate-delay": `${i * 90}ms` } as React.CSSProperties}
          >
            <div className="free-tool-card__head">
              <span className="free-tool-card__icon" aria-hidden="true">
                {tool.icon || "✦"}
              </span>
              {tool.tag && <span className="free-tool-card__tag">{tool.tag}</span>}
              <span className="free-tool-card__free">Grátis</span>
            </div>

            <h3 className="free-tool-card__name">{tool.name}</h3>
            <p className="free-tool-card__desc">{tool.description}</p>

            <a
              className="free-tool-card__btn"
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.freeTools.useBtn} <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
