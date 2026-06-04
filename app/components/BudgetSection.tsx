"use client";

import { useMemo, useRef, useState } from "react";
import { siteData, type BudgetService, type CategoryId, type Package } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";
import { translations, type Language } from "../lib/translations";

type BudgetChannel = "workana" | "upwork" | "direto";
type SendStatus = "idle" | "sending" | "sent" | "error";
type Currency = "BRL" | "USD";
type ChannelStep = "selecting" | "browsing";
type HostingOption = "have" | "help" | "acquire-client" | "acquire-victor";

const WHATSAPP_URL = "https://wa.me/5521975990988";

// Update this value when the exchange rate changes significantly
const USD_TO_BRL = 5.5;

// Domínio e hospedagem (valores em BRL — ajuste conforme seus preços)
const HOSTING_HELP_LABOR = 80; // configurar algo que o cliente já tem
const HOSTING_SETUP_LABOR = 120; // adquirir + configurar do zero
const HOSTING_RESOURCE_ANNUAL = 290; // repasse anual estimado (domínio + hospedagem)

const services: BudgetService[] = siteData.services;
const packages: Package[] = siteData.packages ?? [];

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

function buildBudgetMessage(
  msgLang: Language,
  currency: Currency,
  selectedItems: { service: BudgetService; quantity: number }[],
  onceTotal: number,
  monthlyTotal: number,
  packageDiscount: number,
  hostingNote: string,
  couponDiscount: number,
  couponCode: string
): string {
  const hasSelected = selectedItems.length > 0;

  const perMonth = msgLang === "en" ? "/mo" : msgLang === "es" ? "/mes" : "/mês";
  const fromInline = msgLang === "en" ? "from " : msgLang === "es" ? "desde " : "a partir de ";

  const serviceLines = selectedItems
    .map(({ service, quantity }) => {
      const unitLabel = service.unitLabel || (msgLang === "en" ? "units" : "unidades");
      const qty = service.allowQuantity
        ? `${quantity} ${unitLabel}`
        : msgLang === "en" ? "1 service" : msgLang === "es" ? "1 servicio" : "1 serviço";
      const price = service.startingAt
        ? `${fromInline}${formatAmount(service.price * quantity, currency)}${service.billing === "monthly" ? perMonth : ""}`
        : `${formatAmount(service.price * quantity, currency)}${service.billing === "monthly" ? perMonth : ""}`;
      return `- ${service.title} (${qty}): ${price}`;
    })
    .join("\n");

  if (msgLang === "en") {
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
      hostingNote || "",
      packageDiscount > 0 ? `Package discount: -${formatAmount(packageDiscount, "USD")}` : "",
      couponDiscount > 0 ? `Coupon ${couponCode}: -${formatAmount(couponDiscount, currency)}` : "",
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

  if (msgLang === "es") {
    if (!hasSelected) {
      return [
        "¡Hola, Victor! Me gustaría solicitar un presupuesto para mi proyecto.",
        "",
        "Todavía no definí exactamente qué servicios voy a necesitar, pero me gustaría explicar mi idea y recibir tu recomendación.",
        "",
        "¿Puedes ayudarme a definir el mejor alcance y los próximos pasos?",
        "¡Gracias!",
      ].join("\n");
    }
    return [
      "¡Hola, Victor! Me gustaría solicitar un presupuesto para mi proyecto.",
      "",
      "Estoy interesado en los siguientes servicios:",
      serviceLines,
      hostingNote || "",
      packageDiscount > 0 ? `Descuento de paquete: -${formatAmount(packageDiscount, currency)}` : "",
      couponDiscount > 0 ? `Cupón ${couponCode}: -${formatAmount(couponDiscount, currency)}` : "",
      "",
      `Inversión única estimada: ${formatAmount(onceTotal, currency)}`,
      monthlyTotal ? `Inversión mensual estimada: ${formatAmount(monthlyTotal, currency)}/mes` : "",
      "",
      "¿Puedes revisar el alcance y orientarme sobre los próximos pasos?",
      "¡Gracias!",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Portuguese (pt)
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
    hostingNote || "",
    packageDiscount > 0 ? `Desconto de pacote: -${formatAmount(packageDiscount, "BRL")}` : "",
    couponDiscount > 0 ? `Cupom ${couponCode}: -${formatAmount(couponDiscount, currency)}` : "",
    "",
    `Investimento único estimado: ${formatAmount(onceTotal, "BRL")}`,
    monthlyTotal ? `Investimento mensal estimado: ${formatAmount(monthlyTotal, "BRL")}/mês` : "",
    "",
    "Pode revisar o escopo e me orientar sobre os próximos passos?",
    "Obrigado!",
  ]
    .filter(Boolean)
    .join("\n");
}

export function BudgetSection() {
  const { t, lang } = useLanguage();
  const [channelStep, setChannelStep] = useState<ChannelStep>("selecting");
  const [budgetChannel, setBudgetChannel] = useState<BudgetChannel>("workana");
  const [detectedCurrency, setDetectedCurrency] = useState<Currency | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId | "pacotes">("pacotes");
  const [addedPackageId, setAddedPackageId] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [hostingOption, setHostingOption] = useState<HostingOption>("have");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState(false);

  const categories = useMemo(
    () => [
      { id: "pacotes", label: t.budget.packagesTab },
      { id: "todos", label: t.budget.allCategory },
      ...siteData.serviceCategories,
    ],
    [t]
  );

  const serviceCategoryLabels = useMemo(
    () =>
      siteData.serviceCategories.reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.label;
        return acc;
      }, {}),
    []
  );

  const channelOptions = useMemo(
    () => [
      {
        id: "workana" as BudgetChannel,
        label: t.budget.channel.workana.label,
        description: t.budget.channel.workana.desc,
        badge: "R$",
        currencyLabel: t.budget.channel.workana.currency,
      },
      {
        id: "upwork" as BudgetChannel,
        label: t.budget.channel.upwork.label,
        description: t.budget.channel.upwork.desc,
        badge: "$",
        currencyLabel: t.budget.channel.upwork.currency,
      },
      {
        id: "direto" as BudgetChannel,
        label: t.budget.channel.direct.label,
        description: t.budget.channel.direct.desc,
        badge: "◎",
        currencyLabel: t.budget.channel.direct.currency,
      },
    ],
    [t]
  );

  const currency: Currency = useMemo(() => {
    if (budgetChannel === "upwork") return "USD";
    if (budgetChannel === "direto") return detectedCurrency ?? "BRL";
    return "BRL";
  }, [budgetChannel, detectedCurrency]);

  // Message language: Workana → always PT, Upwork → always EN, direto → follows UI lang
  const messageLang: Language = useMemo(() => {
    if (budgetChannel === "workana") return "pt";
    if (budgetChannel === "upwork") return "en";
    return lang;
  }, [budgetChannel, lang]);

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
    setHostingOption("have");
    setCopyStatus("");
    setSendStatus("idle");
  }

  function goBack() {
    setChannelStep("selecting");
    setSelectedServices({});
    setHostingOption("have");
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

  const onceSubtotal = selectedItems.reduce((total, { service, quantity }) => {
    return service.billing === "monthly" ? total : total + service.price * quantity;
  }, 0);

  const monthlyTotal = selectedItems.reduce((total, { service, quantity }) => {
    return service.billing === "once" ? total : total + service.price * quantity;
  }, 0);

  // Apply a package's discount when all of its services are currently selected.
  // Self-correcting: removing a service from the cart drops the discount automatically.
  const packageDiscount = useMemo(
    () =>
      packages.reduce(
        (sum, pkg) =>
          pkg.discount > 0 && pkg.services.every((id) => selectedServices[id])
            ? sum + pkg.discount
            : sum,
        0
      ),
    [selectedServices]
  );

  // Domínio e hospedagem: mão de obra grátis quando há criação de site/loja ou pacote.
  const hasCreation = selectedItems.some(
    ({ service }) => service.category === "sites" || service.category === "ecommerce"
  );
  const hostingLaborBase =
    hostingOption === "help"
      ? HOSTING_HELP_LABOR
      : hostingOption === "acquire-client" || hostingOption === "acquire-victor"
        ? HOSTING_SETUP_LABOR
        : 0;
  const hostingLabor = hasCreation ? 0 : hostingLaborBase;
  const hostingAnnual = hostingOption === "acquire-victor" ? HOSTING_RESOURCE_ANNUAL : 0;

  // Cupom de depoimento: % sobre o valor único de serviços (após desconto de pacote).
  const onceAfterPackage = Math.max(0, onceSubtotal - packageDiscount);
  const couponDiscount = appliedCoupon ? Math.round(onceAfterPackage * (appliedCoupon.percent / 100)) : 0;

  const onceTotal = Math.max(0, onceAfterPackage - couponDiscount) + hostingLabor;

  // Linha(s) de hospedagem para a mensagem, no idioma da mensagem.
  const hostingNote = useMemo(() => {
    if (hostingOption === "have") return "";
    const h = translations[messageLang].budget.hosting;
    const labor = hostingLabor > 0 ? formatAmount(hostingLabor, currency) : h.included;
    let note = `- ${h.configLabel}: ${labor}`;
    if (hostingAnnual > 0) {
      note += `\n- ${h.annualLabel}: ~${formatAmount(hostingAnnual, currency)}${h.perYear}`;
    }
    return note;
  }, [hostingOption, hostingLabor, hostingAnnual, messageLang, currency]);

  const budgetMessage = useMemo(
    () =>
      buildBudgetMessage(
        messageLang,
        currency,
        selectedItems,
        onceTotal,
        monthlyTotal,
        packageDiscount,
        hostingNote,
        couponDiscount,
        appliedCoupon?.code ?? ""
      ),
    [messageLang, currency, selectedItems, onceTotal, monthlyTotal, packageDiscount, hostingNote, couponDiscount, appliedCoupon]
  );

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = (siteData.coupons ?? []).find((c) => c.code.toUpperCase() === code);
    if (found) {
      setAppliedCoupon({ code: found.code, percent: found.percent });
      setCouponError(false);
    } else {
      setAppliedCoupon(null);
      setCouponError(true);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(false);
  }

  function getPackagePrices(pkg: Package) {
    const pkgServices = pkg.services.map((id) => services.find((s) => s.id === id)).filter(Boolean) as BudgetService[];
    const once = pkgServices.filter((s) => s.billing === "once").reduce((sum, s) => sum + s.price, 0);
    const monthly = pkgServices.filter((s) => s.billing === "monthly").reduce((sum, s) => sum + s.price, 0);
    return { once: once - pkg.discount, monthly, originalOnce: once };
  }

  function addPackageServices(pkg: Package) {
    const next: Record<string, number> = { ...selectedServices };
    pkg.services.forEach((id) => {
      const svc = services.find((s) => s.id === id);
      if (svc) next[id] = svc.allowQuantity ? (next[id] || 0) + 1 : 1;
    });
    setSelectedServices(next);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAddedPackageId(pkg.id);
    addedTimerRef.current = setTimeout(() => setAddedPackageId(null), 2200);
  }

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
      setCopyStatus(t.budget.copyClipboard);
      copied = true;
    } catch {
      setCopyStatus(t.budget.couldNotCopyShort);
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
            <p className="eyebrow">{t.budget.channel.eyebrow}</p>
            <h2>{t.budget.channel.title}</h2>
            <p>{t.budget.channel.lead}</p>
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
                  {isDetecting && channel.id === "direto"
                    ? t.budget.channel.direct.detecting
                    : channel.currencyLabel}
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
        <h2>{t.budget.title}</h2>
        <p>{t.budget.lead}</p>
      </div>

      <div className="budget-layout">
        <div className="service-browser">
          <button className="channel-back" type="button" onClick={goBack}>
            ← {activeChannel.label}
            {budgetChannel === "direto" && detectedCurrency
              ? ` · ${detectedCurrency === "USD" ? "USD $" : "BRL R$"}`
              : ""}
            {" "}— {t.budget.change}
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

          {activeCategory === "pacotes" ? (
            <div className="package-grid">
              {packages.map((pkg, i) => {
                const { once, monthly, originalOnce } = getPackagePrices(pkg);
                const isAdded = addedPackageId === pkg.id;
                return (
                  <article
                    className={`package-card package-card--${pkg.tagColor}`}
                    key={pkg.id}
                    data-animate
                    style={{ "--animate-delay": `${i * 80}ms` } as React.CSSProperties}
                  >
                    <div className="package-card__tag">{pkg.tag}</div>
                    <h3>{pkg.title}</h3>
                    <p className="package-card__desc">{pkg.description}</p>

                    <ul className="package-card__includes">
                      {pkg.services.map((id) => {
                        const svc = services.find((s) => s.id === id);
                        return svc ? (
                          <li key={id}>
                            <span aria-hidden="true">✓</span>
                            {svc.title}
                            {svc.billing === "monthly" && (
                              <em>{currency === "USD" ? " /mo" : " /mês"}</em>
                            )}
                          </li>
                        ) : null;
                      })}
                    </ul>

                    <div className="package-card__footer">
                      <div className="package-card__price">
                        {pkg.discount > 0 && (
                          <span className="package-card__original">
                            {formatAmount(originalOnce, currency)}
                          </span>
                        )}
                        <strong>{formatAmount(once, currency)}</strong>
                        {monthly > 0 && (
                          <span className="package-card__monthly">
                            + {formatAmount(monthly, currency)}{currency === "USD" ? "/mo" : "/mês"}
                          </span>
                        )}
                        {pkg.discount > 0 && (
                          <span className="package-card__savings">
                            {t.budget.packageSavings} {formatAmount(pkg.discount, currency)}
                          </span>
                        )}
                      </div>
                      <button
                        className={`package-card__btn${isAdded ? " is-added" : ""}`}
                        type="button"
                        onClick={() => addPackageServices(pkg)}
                      >
                        {isAdded ? `✓ ${t.budget.packageAdded}` : t.budget.addPackage}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
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
                        ? t.budget.selected
                        : service.allowQuantity && selectedServices[service.id]
                          ? `${t.budget.addMore} (${selectedServices[service.id]})`
                          : `+ ${t.budget.add}`}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside
          className="budget-panel"
          aria-label={t.budget.panelAriaLabel}
          data-animate
          style={{ "--animate-delay": "150ms" } as React.CSSProperties}
        >
          <div className="budget-panel__header">
            <p className="eyebrow">{t.budget.summary}</p>
            <h3>{t.budget.currentQuote}</h3>
          </div>

          <div className="selected-list">
            {selectedItems.length ? (
              selectedItems.map(({ service, quantity }) => (
                <div className="selected-item" key={service.id}>
                  <div>
                    <strong>{service.title}</strong>
                    <span>
                      {service.allowQuantity
                        ? `${quantity} ${service.unitLabel || t.budget.units} × ${formatAmount(service.price, currency)}`
                        : formatServicePrice(service, currency)}
                      {service.allowQuantity && service.billing === "monthly" ? t.budget.perMonth : ""}
                    </span>
                  </div>
                  <div className="selected-item__actions">
                    {service.allowQuantity ? (
                      <>
                        <button
                          type="button"
                          onClick={() => decreaseService(service.id)}
                          aria-label={`${t.budget.decrease} ${service.title}`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => addService(service.id)}
                          aria-label={`${t.budget.add} ${service.title}`}
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
                      {t.budget.remove}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="selected-list__empty">{t.budget.noService}</p>
            )}
          </div>

          <div className="budget-hosting">
            <p className="budget-hosting__title">{t.budget.hosting.title}</p>
            <p className="budget-hosting__hint">{t.budget.hosting.hint}</p>
            {(
              [
                ["have", t.budget.hosting.have],
                ["help", t.budget.hosting.help],
                ["acquire-client", t.budget.hosting.acquireClient],
                ["acquire-victor", t.budget.hosting.acquireVictor],
              ] as [HostingOption, string][]
            ).map(([val, label]) => (
              <label key={val} className={`budget-hosting__opt${hostingOption === val ? " is-active" : ""}`}>
                <input
                  type="radio"
                  name="hosting"
                  checked={hostingOption === val}
                  onChange={() => setHostingOption(val)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="budget-coupon">
            <label htmlFor="budget-coupon">{t.budget.coupon.label}</label>
            {appliedCoupon ? (
              <div className="budget-coupon__applied">
                <span className="budget-coupon__badge">
                  ✓ {appliedCoupon.code} · −{appliedCoupon.percent}%
                </span>
                <button type="button" className="budget-coupon__remove" onClick={removeCoupon}>
                  {t.budget.coupon.applied}
                  <span aria-hidden="true"> ✕</span>
                </button>
              </div>
            ) : (
              <>
                <div className="budget-coupon__row">
                  <input
                    id="budget-coupon"
                    type="text"
                    value={couponInput}
                    placeholder={t.budget.coupon.placeholder}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                  />
                  <button type="button" className="budget-coupon__apply" onClick={applyCoupon}>
                    {t.budget.coupon.apply}
                  </button>
                </div>
                {couponError && <p className="budget-coupon__error">{t.budget.coupon.invalid}</p>}
              </>
            )}
          </div>

          <div className="totals">
            {packageDiscount > 0 && (
              <div className="totals__discount">
                <span>{t.budget.packageDiscount}</span>
                <strong>− {formatAmount(packageDiscount, currency)}</strong>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="totals__discount">
                <span>
                  {t.budget.coupon.lineLabel} ({appliedCoupon?.percent}%)
                </span>
                <strong>− {formatAmount(couponDiscount, currency)}</strong>
              </div>
            )}
            {hostingOption !== "have" && (
              <div className="totals__note">
                <span>{t.budget.hosting.configLabel}</span>
                <strong>
                  {hostingLabor > 0 ? formatAmount(hostingLabor, currency) : t.budget.hosting.included}
                </strong>
              </div>
            )}
            {hostingAnnual > 0 && (
              <div className="totals__note">
                <span>{t.budget.hosting.annualLabel}</span>
                <strong>
                  ~{formatAmount(hostingAnnual, currency)}
                  {t.budget.hosting.perYear}
                </strong>
              </div>
            )}
            <div>
              <span>{t.budget.onceTotal}</span>
              <strong>{formatAmount(onceTotal, currency)}</strong>
            </div>
            <div>
              <span>{t.budget.monthly}</span>
              <strong>
                {formatAmount(monthlyTotal, currency)}
                {monthlyTotal > 0 ? t.budget.perMonth : ""}
              </strong>
            </div>
          </div>

          <div className="budget-message">
            <label htmlFor="budget-message">{t.budget.generatedMessage}</label>
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
              ? t.budget.preparing
              : budgetChannel === "direto"
                ? t.budget.copyAndWhatsApp
                : t.budget.copyMessage}
            <span aria-hidden="true">-&gt;</span>
          </button>

          {sendStatus === "sent" ? (
            <p className="budget-status">
              {budgetChannel === "direto" ? t.budget.copiedWhatsApp : t.budget.copiedMessage}
            </p>
          ) : null}
          {sendStatus === "error" ? (
            <p className="budget-status budget-status--warning">{t.budget.couldNotCopy}</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
