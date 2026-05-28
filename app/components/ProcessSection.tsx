"use client";

import { useLanguage } from "../lib/LanguageContext";

export function ProcessSection() {
  const { t } = useLanguage();

  return (
    <section className="section process">
      <div className="process__header" data-animate>
        <p className="eyebrow">{t.process.eyebrow}</p>
        <h2>{t.process.title}</h2>
      </div>
      <div className="process__steps">
        {t.process.steps.map((step, i) => (
          <article
            key={step.number}
            data-animate
            style={{ "--animate-delay": `${i * 120}ms` } as React.CSSProperties}
          >
            <span>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
