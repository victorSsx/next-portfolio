"use client";

import { useState } from "react";
import { BudgetSection } from "./BudgetSection";
import { useLanguage } from "../lib/LanguageContext";

// Plano B discreto da vitrine: se a IA travar (cota) ou o cliente preferir,
// ele clica e monta o próprio orçamento. Fica escondido até o clique.
const STR = {
  pt: {
    toggle: "Prefere montar o orçamento você mesmo?",
    sub: "Escolha os serviços e veja uma estimativa na hora.",
    hint: "Selecione os serviços e veja o valor na hora. É só uma estimativa pra você ter uma ideia — depois é só copiar e enviar pela plataforma.",
    close: "Fechar orçamento",
  },
  en: {
    toggle: "Prefer to build the quote yourself?",
    sub: "Pick the services and get an instant estimate.",
    hint: "Pick the services and see the price instantly. It's just an estimate to give you an idea — then copy it and send through the platform.",
    close: "Close quote",
  },
  es: {
    toggle: "¿Prefieres armar el presupuesto tú mismo?",
    sub: "Elige los servicios y mira una estimación al instante.",
    hint: "Elige los servicios y mira el precio al instante. Es solo una estimación para darte una idea — luego cópialo y envíalo por la plataforma.",
    close: "Cerrar presupuesto",
  },
} as const;

export function VitrineBudget() {
  const { lang } = useLanguage();
  const t = STR[lang as keyof typeof STR] ?? STR.pt;
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="vbudget">
        <button
          className="vbudget__toggle"
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
        >
          <span className="vbudget__toggle-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
              <rect x="7.5" y="5.5" width="9" height="3.5" rx="1" />
              <path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
            </svg>
          </span>
          <span className="vbudget__toggle-text">
            <strong>{t.toggle}</strong>
            <small>{t.sub}</small>
          </span>
          <span className="vbudget__toggle-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="vbudget vbudget--open">
      <div className="vbudget__panel">
        <p className="vbudget__hint">{t.hint}</p>
        <BudgetSection showcase />
        <div className="vbudget__foot">
          <button className="vbudget__close" type="button" onClick={() => setOpen(false)} aria-expanded>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
