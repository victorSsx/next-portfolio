"use client";

import { useState } from "react";

const SHARE_URL = "https://next-portfolio-navy-five-46.vercel.app";

const POSTS = [
  { file: "ig-disponivel.png", label: "Disponível para projetos", note: "Feed 1080×1350 · ideal pra fixar no topo" },
  { file: "ig-showcase.png", label: "Showcase de projeto", note: "Feed 1080×1350" },
  { file: "ig-calculadora.png", label: "Promo da calculadora", note: "Feed 1080×1350" },
  { file: "ig-story-qr.png", label: "Story com QR", note: "Story 1080×1920" },
];

const QRS = [
  { file: "qr-portfolio.png", label: "QR claro (recomendado)" },
  { file: "qr-portfolio-dark.png", label: "QR escuro" },
  { file: "qr-portfolio-watch.png", label: "QR relógio" },
];

export default function SocialKitPage() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="social-kit">
      <header className="social-kit__head">
        <p className="eyebrow">Marketing</p>
        <h1>Kit de divulgação</h1>
        <p className="social-kit__lead">
          Mídias prontas pra divulgar seu portfólio. Baixe, poste no Instagram e use o QR onde quiser.
        </p>
        <a className="social-kit__back" href="/admin">← Voltar ao admin</a>
      </header>

      {/* Link de compartilhamento */}
      <section className="social-kit__share">
        <div>
          <strong>Link de compartilhamento</strong>
          <p>Cole na bio do Instagram, WhatsApp ou LinkedIn — aparece um card bonito (preview abaixo).</p>
          <code>{SHARE_URL}</code>
        </div>
        <button type="button" className="button button--primary" onClick={copyLink}>
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </section>

      {/* Posts do Instagram */}
      <h2 className="social-kit__title">Posts pro Instagram</h2>
      <div className="social-kit__grid">
        {POSTS.map((p) => (
          <article className="social-card" key={p.file}>
            <div className="social-card__shot">
              <img src={`/social/${p.file}`} alt={p.label} loading="lazy" />
            </div>
            <div className="social-card__body">
              <strong>{p.label}</strong>
              <span>{p.note}</span>
              <a className="button button--ghost" href={`/social/${p.file}`} download>
                Baixar PNG
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Preview do link (OG) */}
      <h2 className="social-kit__title">Preview do link (quando você compartilha)</h2>
      <div className="social-kit__og">
        <img src="/social/og.png" alt="Preview do link compartilhado" loading="lazy" />
        <a className="button button--ghost" href="/social/og.png" download>
          Baixar imagem
        </a>
      </div>

      {/* QR codes */}
      <h2 className="social-kit__title">QR code personalizado</h2>
      <div className="social-kit__qrs">
        {QRS.map((q) => (
          <article className="social-qr" key={q.file}>
            <img src={`/${q.file}`} alt={q.label} loading="lazy" />
            <strong>{q.label}</strong>
            <a className="button button--ghost" href={`/${q.file}`} download>
              Baixar
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
