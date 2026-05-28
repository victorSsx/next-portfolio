"use client";

import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";

export function FAQSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section faq" id="faq">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.faq.eyebrow}</p>
        <h2>{t.faq.title}</h2>
      </div>

      <div className="faq-list" data-animate>
        {t.faq.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                className="faq-item__question"
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-item__icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              <div className="faq-item__answer">
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
