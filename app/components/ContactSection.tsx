"use client";

import { useLanguage } from "../lib/LanguageContext";

const WHATSAPP_URL = "https://wa.me/5521975990988";
const EMAIL = "victorspires.dev@gmail.com";

// Preencha com as URLs dos seus perfis para os botões aparecerem automaticamente.
const WORKANA_URL = "https://www.workana.com/freelancer/d6e8a59b03761470ce1e4c7707997550";
const UPWORK_URL = "https://www.upwork.com/freelancers/~01de38696555800877";

export function ContactSection() {
  const { t } = useLanguage();

  return (
    <section className="section contact" id="contato">
      <div data-animate>
        <p className="eyebrow">{t.contact.eyebrow}</p>
        <h2>{t.contact.title}</h2>
        <p className="contact__lead">{t.contact.lead}</p>

        <div className="hero__actions contact__actions">
          <a
            className="button button--primary"
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(t.contact.whatsappGreeting)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button--ghost" href={`mailto:${EMAIL}`}>
            E-mail <span aria-hidden="true">-&gt;</span>
          </a>
        </div>

        {(WORKANA_URL || UPWORK_URL) && (
          <div className="contact__profiles">
            <span className="contact__profiles-label">Veja minhas avaliações:</span>
            {WORKANA_URL && (
              <a href={WORKANA_URL} target="_blank" rel="noreferrer" className="contact__profile-link">
                Workana <span aria-hidden="true">↗</span>
              </a>
            )}
            {UPWORK_URL && (
              <a href={UPWORK_URL} target="_blank" rel="noreferrer" className="contact__profile-link">
                Upwork <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
