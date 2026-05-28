"use client";

import { useLanguage } from "../lib/LanguageContext";

const WHATSAPP_URL = "https://wa.me/5521975990988";
const INSTAGRAM_URL = "https://www.instagram.com/__devictor";

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <section className="section contact" id="contato">
      <div data-animate>
        <p className="eyebrow">{t.contact.eyebrow}</p>
        <h2>{t.contact.title}</h2>
        <div className="hero__actions contact__actions">
          <a className="button button--primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button--ghost" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Instagram <span aria-hidden="true">-&gt;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
