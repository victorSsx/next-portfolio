"use client";

import { useMemo, useState } from "react";
import { siteData, type BudgetService, type CategoryId } from "../lib/site-data";

type BudgetChannel = "workana" | "upwork" | "direto";
type SendStatus = "idle" | "sending" | "sent" | "error";
type Currency = "BRL" | "USD";
type ChannelStep = "selecting" | "browsing";

const WHATSAPP_URL = "https://wa.me/5521975990988";

// Update this value when the exchange rate changes significantly
const USD_TO_BRL = 5.5;

const categories: { id: CategoryId; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...siteData.serviceCategories,
];

const serviceCategoryLabels = siteData.serviceCategories.reduce<Record<string, string>>(
  (labels, category) => {
    labels[category.id] = category.label;
    return labels;
  },
  {}
);

const channelOptions: {
  id: BudgetChannel;
  label: string;
  description: string;
  badge: string;
  currencyLabel: string;
}[] = [
  {
    id: "workana",
    label: "Workana",
    description: "Plataforma brasileira de freelancers. Mensagem gerada em português.",
    badge: "R$",
    currencyLabel: "Reais (BRL)",
  },
  {
    id: "upwork",
    label: "Upwork",
    description: "Plataforma global de trabalho freelancer. Mensagem gerada em inglês.",
    badge: "$",
    currencyLabel: "Dólar (USD)",
  },
  {
    id: "direto",
    label: "Indicação direta",
    description: "Veio por indicação, redes sociais ou contato direto. Moeda detectada pelo seu IP.",
    badge: "◎",
    currencyLabel: "Detectado pelo IP",
  },
];

const services: BudgetService[] = siteData.services;

async function detectCountry(): Promise<"BR" | "other"> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "BR";
    const data: { country_code?: string } = await res.json();
    return data.country_code === "BR" ? "BR" : "other";
  } catch {
    return "BR";
  }
}

function formatAmount(brlValue: number, currency: Currency): string {
  if (currency === "USD") {
    return Math.ceil(brlValue / USD_TO_BRL).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  return brlValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatServicePrice(service: BudgetService, currency: Currency, qty = 1): string {
  const value = service.price * qty;
  const formatted = formatAmount(value, currency);
  const suffix = service.billing === "monthly" ? (currency === "USD" ? "/mo" : "/mês") : "";
  const prefix = service.startingAt ? (currency === "USD" ? "From " : "A partir de ") : "";
  return `${prefix}${formatted}${suffix}`;
}

export function BudgetSection() {
  const [channelStep, setChannelStep] = useState<ChannelStep>("selecting");
  const [budgetChannel, setBudgetChannel] = useState<BudgetChannel>("workana");
  const [detectedCurrency, setDetectedCurrency] = useState<Currency | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("todos");
  const [copyStatus, setCopyStatus] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  const currency: Currency = useMemo(() => {
    if (budgetChannel === "upwork") return "USD";
    if (budgetChannel === "direto") return detectedCurrency ?? "BRL";
    return "BRL";
  }, [budgetChannel, detectedCurrency]);

  async function selectChannel(channel: BudgetChannel) {
    if (channel === "direto") {
      setIsDetecting(true);
      const country = await detectCountry();
      setDetectedCurrency(country === "BR" ? "BRL" : "USD");
      setIsDetecting(false);
    }
    setBudgetChannel(channel);
    setChannelStep("browsing");
    setSelectedServices({});
    setCopyStatus("");
    setSendStatus("idle");
  }

  function goBack() {
    setChannelStep("selecting");
    setSelectedServices({});
    setCopyStatus("");
    setSendStatus("idle");
    setDetectedCurrency(null);
  }

  const filteredServices = useMemo(() => {
    if (activeCategory === "todos") return services;
    return services.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const selectedItems = useMemo(
    () =>
      services
        .filter((s) => selectedServices[s.id])
        .map((s) => ({ service: s, quantity: selectedServices[s.id] })),
    [selectedServices]
  );

  const onceTotal = selectedItems.reduce((total, { service, quantity }) => {
    return service.billing === "monthly" ? total : total + service.price * quantity;
  }, 0);

  const monthlyTotal = selectedItems.reduce((total, { service, quantity }) => {
    return service.billing === "once" ? total : total + service.price * quantity;
  }, 0);

  const budgetMessage = useMemo(() => {
    const isEnglish = currency === "USD";
    const hasSelected = selectedItems.length > 0;

    const serviceLines = selectedItems
      .map(({ service, quantity }) => {
        const qty = service.allowQuantity
          ? `${quantity} ${service.unitLabel || (isEnglish ? "units" : "unidades")}`
          : isEnglish ? "1 service" : "1 serviço";
        const price = service.startingAt
          ? `${isEnglish ? "from " : "a partir de "}${formatAmount(service.price * quantity, currency)}${service.billing === "monthly" ? (isEnglish ? "/mo" : "/mês") : ""}`
          : `${formatAmount(service.price * quantity, currency)}${service.billing === "monthly" ? (isEnglish ? "/mo" : "/mês") : ""}`;
        return `- ${service.title} (${qty}): ${price}`;
      })
      .join("\n");

    if (isEnglish) {
      if (!hasSelected) {
        return [
          "Hi Victor! I'd like to request a quote for my project.",
          "",
          "I haven't selected a specific service yet, but I'd like to explain what I need and get your recommendation.",
          "",
          "Could you please help me define the best scope and next steps?",
          "Thank you!",
        ].join("\n");
      }
      return [
        "Hi Victor! I'd like to request a quote for my project.",
        "",
        "I'm interested in the following services:",
        serviceLines,
        "",
        `Estimated one-time investment: ${formatAmount(onceTotal, "USD")}`,
        monthlyTotal ? `Estimated monthly investment: ${formatAmount(monthlyTotal, "USD")}/mo` : "",
        "",
        "Could you please review the scope and confirm the next steps?",
        "Thank you!",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (!hasSelected) {
      return [
        "Olá, Victor! Gostaria de solicitar um orçamento para meu projeto.",
        "",
        "Ainda não defini exatamente quais serviços vou precisar, mas gostaria de explicar minha ideia e receber sua recomendação.",
        "",
        "Pode me ajudar a definir o melhor escopo e os próximos passos?",
        "Obrigado!",
      ].join("\n");
    }

    return [
      "Olá, Victor! Gostaria de solicitar um orçamento para meu projeto.",
      "",
      "Tenho interesse nos seguintes serviços:",
      serviceLines,
      "",
      `Investimento único estimado: ${formatAmount(onceTotal, "BRL")}`,
      monthlyTotal ? `Investimento mensal estimado: ${formatAmount(monthlyTotal, "BRL")}/mês` : "",
      "",
      "Pode revisar o escopo e me orientar sobre os próximos passos?",
      "Obrigado!",
    ]
      .filter(Boolean)
      .join("\n");
  }, [currency, onceTotal, monthlyTotal, selectedItems]);

  function addService(id: string) {
    setSelectedServices((current) => {
      const service = services.find((s) => s.id === id);
      return { ...current, [id]: service?.allowQuantity ? (current[id] || 0) + 1 : 1 };
    });
  }

  function decreaseService(id: string) {
    setSelectedServices((current) => {
      const next = { ...current };
      const qty = (current[id] || 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function removeService(id: string) {
    setSelectedServices((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function prepareBudgetMessage() {
    setSendStatus("sending");
    setCopyStatus("");
    let copied = false;
    try {
      await navigator.clipboard.writeText(budgetMessage);
      setCopyStatus(currency === "USD" ? "Message copied to clipboard." : "Mensagem copiada para colar no chat.");
      copied = true;
    } catch {
      setCopyStatus(
        currency === "USD"
          ? "Could not copy automatically. Select the text and copy manually."
          : "Não consegui copiar automaticamente. Selecione o texto e copie manualmente."
      );
    }
    if (!copied && budgetChannel !== "direto") {
      setSendStatus("error");
      return;
    }
    if (budgetChannel === "direto") {
      window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(budgetMessage)}`, "_blank", "noopener,noreferrer");
    }
    setSendStatus("sent");
  }

  const activeChannel = channelOptions.find((c) => c.id === budgetChannel)!;

  // ── Channel selector ────────────────────────────────────────────────────────
  if (channelStep === "selecting") {
    return (
      <section className="section budget" id="orcamento">
        <div className="channel-selector">
          <div className="channel-selector__intro" data-animate>
            <p className="eyebrow">Antes de começar</p>
            <h2>De onde você veio?</h2>
            <p>Isso define a moeda dos preços e a mensagem gerada automaticamente.</p>
          </div>

          <div className="channel-cards">
            {channelOptions.map((channel, i) => (
              <button
                key={channel.id}
                className="channel-card"
                type="button"
                disabled={isDetecting}
                onClick={() => selectChannel(channel.id)}
                data-animate="scale"
                style={{ "--animate-delay": `${i * 110}ms` } as React.CSSProperties}
              >
                <div
                  className={`channel-card__badge${
                    isDetecting && channel.id === "direto" ? " channel-card__badge--detecting" : ""
                  }`}
                >
                  {isDetecting && channel.id === "direto" ? "" : channel.badge}
                </div>
                <h3>{channel.label}</h3>
                <p>{channel.description}</p>
                <span className="channel-card__currency">
                  {isDetecting && channel.id === "direto" ? "Detectando localização..." : channel.currencyLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Service browser ─────────────────────────────────────────────────────────
  return (
    <section className="section budget" id="orcamento">
      <div className="section__intro section__intro--budget" data-animate>
        <h2>
          {currency === "USD"
            ? "Build your WordPress quote in real time."
            : "Monte um orçamento WordPress em tempo real."}
        </h2>
        <p>
          {currency === "USD"
            ? "Website, SEO, performance and support services — with clear explanations."
            : "Serviços de sites, SEO, performance e suporte com explicação direta para clientes."}
        </p>
      </div>

      <div className="budget-layout">
        <div className="service-browser">
          <button className="channel-back" type="button" onClick={goBack}>
            ← {activeChannel.label}
            {budgetChannel === "direto" && detectedCurrency
              ? ` · ${detectedCurrency === "USD" ? "USD $" : "BRL R$"}`
              : ""}
            {" "}— {currency === "USD" ? "Change" : "Mudar"}
          </button>

          <div className="category-tabs" aria-label="Categorias de serviços">
            {categories.map((category) => (
              <button
                aria-pressed={activeCategory === category.id}
                className={activeCategory === category.id ? "is-active" : ""}
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="service-grid">
            {filteredServices.map((service, i) => (
              <article
                className="service-card"
                key={service.id}
                data-animate
                style={{ "--animate-delay": `${i * 55}ms` } as React.CSSProperties}
              >
                <div>
                  <p>{serviceCategoryLabels[service.category] || service.category}</p>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                  {service.details ? (
                    <ul className="service-card__details">
                      {service.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="service-card__footer">
                  <strong>{formatServicePrice(service, currency)}</strong>
                  <button
                    className={selectedServices[service.id] && !service.allowQuantity ? "is-selected" : ""}
                    disabled={Boolean(selectedServices[service.id] && !service.allowQuantity)}
                    type="button"
                    onClick={() => addService(service.id)}
                  >
                    {selectedServices[service.id] && !service.allowQuantity
                      ? currency === "USD" ? "Selected" : "Selecionado"
                      : service.allowQuantity && selectedServices[service.id]
                        ? `${currency === "USD" ? "Add more" : "Adicionar mais"} (${selectedServices[service.id]})`
                        : `+ ${currency === "USD" ? "Add" : "Adicionar"}`}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside
          className="budget-panel"
          aria-label={currency === "USD" ? "Budget summary" : "Resumo do orçamento"}
          data-animate
          style={{ "--animate-delay": "150ms" } as React.CSSProperties}
        >
          <div className="budget-panel__header">
            <p className="eyebrow">{currency === "USD" ? "Summary" : "Resumo"}</p>
            <h3>{currency === "USD" ? "Current quote" : "Orçamento atual"}</h3>
          </div>

          <div className="selected-list">
            {selectedItems.length ? (
              selectedItems.map(({ service, quantity }) => (
                <div className="selected-item" key={service.id}>
                  <div>
                    <strong>{service.title}</strong>
                    <span>
                      {service.allowQuantity
                        ? `${quantity} ${service.unitLabel || (currency === "USD" ? "units" : "unidades")} × ${formatAmount(service.price, currency)}`
                        : formatServicePrice(service, currency)}
                      {service.allowQuantity && service.billing === "monthly"
                        ? currency === "USD" ? "/mo" : "/mês"
                        : ""}
                    </span>
                  </div>
                  <div className="selected-item__actions">
                    {service.allowQuantity ? (
                      <>
                        <button
                          type="button"
                          onClick={() => decreaseService(service.id)}
                          aria-label={`${currency === "USD" ? "Decrease" : "Diminuir"} ${service.title}`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => addService(service.id)}
                          aria-label={`${currency === "USD" ? "Add" : "Adicionar"} ${service.title}`}
                        >
                          +
                        </button>
                      </>
                    ) : null}
                    <button
                      className="selected-item__remove"
                      type="button"
                      onClick={() => removeService(service.id)}
                    >
                      {currency === "USD" ? "Remove" : "Remover"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="selected-list__empty">
                {currency === "USD" ? "No service selected." : "Nenhum serviço selecionado."}
              </p>
            )}
          </div>

          <div className="totals">
            <div>
              <span>{currency === "USD" ? "One-time total" : "Total único estimado"}</span>
              <strong>{formatAmount(onceTotal, currency)}</strong>
            </div>
            <div>
              <span>{currency === "USD" ? "Monthly" : "Mensal"}</span>
              <strong>
                {formatAmount(monthlyTotal, currency)}
                {monthlyTotal > 0 ? (currency === "USD" ? "/mo" : "/mês") : ""}
              </strong>
            </div>
          </div>

          <div className="budget-message">
            <label htmlFor="budget-message">
              {currency === "USD" ? "Generated message" : "Mensagem gerada"}
            </label>
            <textarea id="budget-message" readOnly value={budgetMessage} />
          </div>

          {copyStatus ? <p className="budget-status">{copyStatus}</p> : null}

          <button
            className="button button--primary budget-panel__cta"
            disabled={sendStatus === "sending"}
            onClick={prepareBudgetMessage}
            type="button"
          >
            {sendStatus === "sending"
              ? (currency === "USD" ? "Preparing..." : "Preparando...")
              : budgetChannel === "direto"
                ? (currency === "USD" ? "Copy & open WhatsApp" : "Copiar e abrir WhatsApp")
                : (currency === "USD" ? "Copy message" : "Copiar mensagem")}
            <span aria-hidden="true">-&gt;</span>
          </button>

          {sendStatus === "sent" ? (
            <p className="budget-status">
              {budgetChannel === "direto"
                ? (currency === "USD" ? "Message copied and WhatsApp opened." : "Mensagem copiada e WhatsApp aberto.")
                : (currency === "USD" ? "Message copied to clipboard." : "Mensagem copiada para o chat.")}
            </p>
          ) : null}
          {sendStatus === "error" ? (
            <p className="budget-status budget-status--warning">
              {currency === "USD"
                ? "Could not copy automatically. Select the text and copy manually."
                : "Não consegui copiar automaticamente. Selecione o texto e copie manualmente."}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
