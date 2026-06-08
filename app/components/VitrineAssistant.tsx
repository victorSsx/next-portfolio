"use client";

import { useEffect, useRef, useState } from "react";
import { siteData, localizeContent, type BudgetService, type Package } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const services: BudgetService[] = siteData.services;
const packages: Package[] = siteData.packages ?? [];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Msg = { role: "user" | "assistant"; content: string };
type Rec = { serviceIds: string[]; packageIds: string[] };
type Card = { key: string; id: string; type: "service" | "package"; leaving: boolean };

const STR = {
  pt: {
    eyebrow: "Assistente de orçamento",
    title: "Vamos montar sua solução?",
    lead: "Me conta o que você precisa. Eu entendo, recomendo os serviços ideais e mostro aqui do lado.",
    greeting: "Oi! Pra te ajudar a montar o orçamento certo, me conta: qual é o seu projeto? (ex: um site, uma loja virtual, uma landing page...)",
    placeholder: "Escreva aqui...",
    send: "Enviar",
    thinking: "Pensando...",
    error: "Não consegui responder agora. Tente de novo.",
    stageHint: "Suas necessidades e as recomendações aparecem aqui conforme a gente conversa.",
    noted: "O que eu anotei",
    recommended: "Recomendado pra você",
    estimate: "Estimativa",
    from: "A partir de",
    perMonth: "/mês",
    includes: "Inclui",
    save: "Economia de",
    pkgTag: "Pacote",
    copy: "Copiar estimativa",
    copied: "Copiado! Cole no chat da plataforma.",
    note: "Estimativa aproximada — o valor final a gente alinha por aqui.",
  },
  en: {
    eyebrow: "Quote assistant",
    title: "Let's build your solution?",
    lead: "Tell me what you need. I'll understand it, recommend the right services and show them here.",
    greeting: "Hi! To help you put together the right quote, tell me: what's your project? (e.g. a website, an online store, a landing page...)",
    placeholder: "Type here...",
    send: "Send",
    thinking: "Thinking...",
    error: "I couldn't reply now. Please try again.",
    stageHint: "Your needs and recommendations show up here as we talk.",
    noted: "What I noted",
    recommended: "Recommended for you",
    estimate: "Estimate",
    from: "From",
    perMonth: "/mo",
    includes: "Includes",
    save: "Save",
    pkgTag: "Package",
    copy: "Copy estimate",
    copied: "Copied! Paste it in the platform chat.",
    note: "Approximate estimate — we align the final price right here.",
  },
  es: {
    eyebrow: "Asistente de presupuesto",
    title: "¿Armamos tu solución?",
    lead: "Cuéntame qué necesitas. Lo entiendo, recomiendo los servicios ideales y los muestro aquí.",
    greeting: "¡Hola! Para ayudarte a armar el presupuesto correcto, cuéntame: ¿cuál es tu proyecto? (ej: un sitio, una tienda online, una landing page...)",
    placeholder: "Escribe aquí...",
    send: "Enviar",
    thinking: "Pensando...",
    error: "No pude responder ahora. Inténtalo de nuevo.",
    stageHint: "Tus necesidades y recomendaciones aparecen aquí mientras hablamos.",
    noted: "Lo que anoté",
    recommended: "Recomendado para ti",
    estimate: "Estimación",
    from: "Desde",
    perMonth: "/mes",
    includes: "Incluye",
    save: "Ahorro de",
    pkgTag: "Paquete",
    copy: "Copiar estimación",
    copied: "¡Copiado! Pégalo en el chat de la plataforma.",
    note: "Estimación aproximada — el valor final lo alineamos aquí.",
  },
} as const;

function pkgPrices(p: Package) {
  const svcs = p.services.map((id) => services.find((s) => s.id === id)).filter(Boolean) as BudgetService[];
  const once = svcs.filter((s) => s.billing !== "monthly").reduce((a, s) => a + s.price, 0) - p.discount;
  const monthly = svcs.filter((s) => s.billing === "monthly").reduce((a, s) => a + s.price, 0);
  return { once: Math.max(0, once), monthly };
}

function estimate(rec: Rec) {
  const pkgs = rec.packageIds.map((id) => packages.find((p) => p.id === id)).filter(Boolean) as Package[];
  const memberIds = new Set(pkgs.flatMap((p) => p.services));
  const standalone = rec.serviceIds
    .filter((id) => !memberIds.has(id))
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean) as BudgetService[];
  let once = 0;
  let monthly = 0;
  for (const p of pkgs) {
    const pp = pkgPrices(p);
    once += pp.once;
    monthly += pp.monthly;
  }
  for (const s of standalone) {
    if (s.billing === "monthly") monthly += s.price;
    else once += s.price;
  }
  return { once, monthly, count: pkgs.length + standalone.length };
}

export function VitrineAssistant() {
  const { lang } = useLanguage();
  const t = STR[lang] ?? STR.pt;

  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: STR.pt.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rec, setRec] = useState<Rec>({ serviceIds: [], packageIds: [] });
  const [notes, setNotes] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém a saudação no idioma atual enquanto a conversa não começou.
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === "assistant" ? [{ role: "assistant", content: t.greeting }] : m));
  }, [t.greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function applyRecommendation(next: Rec) {
    setRec(next);
    const wanted = [
      ...next.packageIds.map((id) => ({ id, type: "package" as const })),
      ...next.serviceIds.map((id) => ({ id, type: "service" as const })),
    ];
    const wantedKeys = new Set(wanted.map((c) => `${c.type}:${c.id}`));
    setCards((prev) => {
      const prevKeys = new Set(prev.map((c) => c.key));
      const kept = prev.map((c) => ({ ...c, leaving: !wantedKeys.has(c.key) }));
      const added = wanted
        .filter((c) => !prevKeys.has(`${c.type}:${c.id}`))
        .map((c) => ({ key: `${c.type}:${c.id}`, id: c.id, type: c.type, leaving: false }));
      return [...kept, ...added];
    });
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      setCards((prev) => prev.filter((c) => !c.leaving));
    }, 480);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vitrine-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const json = (await res.json()) as {
        reply?: string;
        notes?: string[];
        serviceIds?: string[];
        packageIds?: string[];
        error?: string;
      };
      if (!res.ok || !json.reply) throw new Error(json.error || t.error);
      setMessages((m) => [...m, { role: "assistant", content: json.reply as string }]);
      if (Array.isArray(json.notes)) setNotes(json.notes);
      applyRecommendation({ serviceIds: json.serviceIds ?? [], packageIds: json.packageIds ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  const est = estimate(rec);

  async function copyEstimate() {
    const lines: string[] = [];
    rec.packageIds.forEach((id) => {
      const p = packages.find((x) => x.id === id);
      if (p) lines.push(`- ${localizeContent(p, lang).title}: ${fmt(pkgPrices(p).once)}`);
    });
    const memberIds = new Set(rec.packageIds.flatMap((id) => packages.find((p) => p.id === id)?.services ?? []));
    rec.serviceIds
      .filter((id) => !memberIds.has(id))
      .forEach((id) => {
        const s = services.find((x) => x.id === id);
        if (s) lines.push(`- ${localizeContent(s, lang).title}: ${fmt(s.price)}${s.billing === "monthly" ? t.perMonth : ""}`);
      });
    const text = [
      `${t.recommended}:`,
      ...lines,
      "",
      `${t.from} ${fmt(est.once)}${est.monthly ? ` + ${fmt(est.monthly)}${t.perMonth}` : ""}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function renderCard(c: Card) {
    if (c.type === "package") {
      const p = packages.find((x) => x.id === c.id);
      if (!p) return null;
      const lp = localizeContent(p, lang);
      const pr = pkgPrices(p);
      const incl = p.services
        .map((id) => services.find((s) => s.id === id))
        .filter(Boolean)
        .map((s) => localizeContent(s as BudgetService, lang).title);
      return (
        <article key={c.key} className={`vagent-card vagent-card--pkg${c.leaving ? " is-leaving" : ""}`}>
          <span className="vagent-card__tag">{t.pkgTag}</span>
          <h4>{lp.title}</h4>
          <p className="vagent-card__desc">{lp.description}</p>
          <p className="vagent-card__incl">
            <span>{t.includes}:</span> {incl.join(" · ")}
          </p>
          <div className="vagent-card__foot">
            <strong>
              {t.from} {fmt(pr.once)}
              {pr.monthly ? ` + ${fmt(pr.monthly)}${t.perMonth}` : ""}
            </strong>
            {p.discount > 0 ? (
              <span className="vagent-card__save">
                {t.save} {fmt(p.discount)}
              </span>
            ) : null}
          </div>
        </article>
      );
    }
    const s = services.find((x) => x.id === c.id);
    if (!s) return null;
    const ls = localizeContent(s, lang);
    return (
      <article key={c.key} className={`vagent-card${c.leaving ? " is-leaving" : ""}`}>
        <h4>{ls.title}</h4>
        {ls.summary ? <p className="vagent-card__desc">{ls.summary}</p> : null}
        <div className="vagent-card__foot">
          <strong>
            {s.startingAt ? `${t.from} ` : ""}
            {fmt(s.price)}
            {s.billing === "monthly" ? t.perMonth : ""}
          </strong>
        </div>
      </article>
    );
  }

  return (
    <section className="vagent" id="orcamento">
      <div className="vagent__intro" data-animate>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p>{t.lead}</p>
      </div>

      <div className="vagent__cols">
        {/* Chat */}
        <div className="vagent__chat" data-animate>
          <div className="vagent__messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`vagent-msg vagent-msg--${m.role}`}>
                <div className="vagent-msg__bubble">{m.content}</div>
              </div>
            ))}
            {loading ? (
              <div className="vagent-msg vagent-msg--assistant">
                <div className="vagent-msg__bubble vagent-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
          </div>
          {error ? <p className="vagent__error">{error}</p> : null}
          <div className="vagent__input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t.placeholder}
              rows={1}
            />
            <button type="button" onClick={send} disabled={!input.trim() || loading} aria-label={t.send}>
              <span aria-hidden="true">➤</span>
            </button>
          </div>
        </div>

        {/* Palco de recomendações */}
        <div className="vagent__panel" data-animate>
          {notes.length > 0 ? (
            <div className="vagent__notes">
              <strong className="vagent__panel-title">{t.noted}</strong>
              <ul>
                {notes.map((n, i) => (
                  <li key={`${n}-${i}`}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {cards.length > 0 ? (
            <>
              <strong className="vagent__panel-title">{t.recommended}</strong>
              <div className="vagent__cards">{cards.map(renderCard)}</div>
              {est.count > 0 ? (
                <div className="vagent__estimate">
                  <div>
                    <span>{t.estimate}</span>
                    <strong>
                      {t.from} {fmt(est.once)}
                      {est.monthly ? ` + ${fmt(est.monthly)}${t.perMonth}` : ""}
                    </strong>
                  </div>
                  <button type="button" className="button button--primary" onClick={copyEstimate}>
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
              ) : null}
              <p className="vagent__note">{t.note}</p>
            </>
          ) : null}
          {notes.length === 0 && cards.length === 0 ? (
            <div className="vagent__empty">{t.stageHint}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
