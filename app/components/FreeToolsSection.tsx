"use client";

import { useEffect, useRef, useState } from "react";
import { siteData, type FreeTool } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const freeTools = siteData.freeTools ?? [];
const CAROUSEL_THRESHOLD = 3;

function ToolCard({ tool, useBtn }: { tool: FreeTool; useBtn: string }) {
  return (
    <article className="free-tool-card">
      <div className="free-tool-card__head">
        <span className="free-tool-card__icon" aria-hidden="true">
          {tool.icon || "✦"}
        </span>
        {tool.tag && <span className="free-tool-card__tag">{tool.tag}</span>}
        <span className="free-tool-card__free">Grátis</span>
      </div>

      <h3 className="free-tool-card__name">{tool.name}</h3>
      <p className="free-tool-card__desc">{tool.description}</p>

      <a className="free-tool-card__btn" href={tool.url} target="_blank" rel="noopener noreferrer">
        {useBtn} <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

export function FreeToolsSection() {
  const { t } = useLanguage();
  const isCarousel = freeTools.length > CAROUSEL_THRESHOLD;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCards = (dir: 1 | -1) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const card = vp.querySelector<HTMLElement>(".free-tool-card");
    const step = card ? card.offsetWidth + 18 : vp.clientWidth * 0.8;
    const atEnd = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
    const atStart = vp.scrollLeft <= 4;
    if (dir === 1 && atEnd) vp.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) vp.scrollTo({ left: vp.scrollWidth, behavior: "smooth" });
    else vp.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  // Auto-advance only when carousel is active and not hovered
  useEffect(() => {
    if (!isCarousel || paused) return;
    const id = window.setInterval(() => scrollByCards(1), 4000);
    return () => window.clearInterval(id);
  }, [isCarousel, paused]);

  if (freeTools.length === 0) return null;

  return (
    <section className="section free-tools" id="ferramentas">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.freeTools.eyebrow}</p>
        <h2>{t.freeTools.title}</h2>
        <p>{t.freeTools.lead}</p>
      </div>

      {isCarousel ? (
        <div
          className="free-tools__carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          data-animate
        >
          <button
            className="free-tools__arrow"
            type="button"
            aria-label="Anterior"
            onClick={() => scrollByCards(-1)}
          >
            ←
          </button>

          <div className="free-tools__viewport" ref={viewportRef}>
            {freeTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} useBtn={t.freeTools.useBtn} />
            ))}
          </div>

          <button
            className="free-tools__arrow"
            type="button"
            aria-label="Próximo"
            onClick={() => scrollByCards(1)}
          >
            →
          </button>
        </div>
      ) : (
        <div className="free-tools__grid">
          {freeTools.map((tool, i) => (
            <div
              key={tool.id}
              data-animate
              style={{ "--animate-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <ToolCard tool={tool} useBtn={t.freeTools.useBtn} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
