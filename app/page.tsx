"use client";

import { useMemo, useState } from "react";
import { siteData, type BudgetService, type CategoryId, type Project } from "./lib/site-data";

type BudgetChannel = "workana" | "upwork" | "direto";
type SendStatus = "idle" | "sending" | "sent" | "error";

const WHATSAPP_NUMBER = "5521975990988";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const INSTAGRAM_URL = "https://www.instagram.com/__devictor";

const categories: { id: CategoryId; label: string }[] = [{ id: "todos", label: "Todos" }, ...siteData.serviceCategories];

const serviceCategoryLabels = siteData.serviceCategories.reduce<Record<string, string>>((labels, category) => {
  labels[category.id] = category.label;
  return labels;
}, {});

const budgetChannels: { id: BudgetChannel; label: string; description: string; copyable: boolean }[] = [
  {
    id: "workana",
    label: "Cliente Workana",
    description: "Gera uma mensagem pronta para o cliente copiar e colar no chat da Workana.",
    copyable: true,
  },
  {
    id: "upwork",
    label: "Cliente Upwork",
    description: "Gera uma mensagem em inglês para o cliente copiar e colar no chat da Upwork.",
    copyable: true,
  },
  {
    id: "direto",
    label: "Cliente direto",
    description: "Gera uma mensagem como se o cliente estivesse pedindo orçamento pelo WhatsApp.",
    copyable: true,
  },
];

const services: BudgetService[] = siteData.services;
const projects: Project[] = siteData.projects;
const getProjectVideos = (project: Project) => (project.videos?.length ? project.videos : project.video?.src ? [project.video] : []);

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const formatServicePrice = (service: BudgetService, value = service.price) =>
  `${service.startingAt ? "A partir de " : ""}${formatCurrency(value)}${service.billing === "monthly" ? "/mês" : ""}`;

// Configuração do Logo Personalizado
// Se você deseja usar uma imagem própria (SVG, PNG, JPG, etc.), salve o arquivo em public/images/
// e configure o caminho abaixo (ex: "/images/meu-logo.svg"). Se deixar como null, usa o vetor padrão.
const CUSTOM_LOGO_PATH: string | null = null;

export default function Home() {
  const [logoStage, setLogoStage] = useState<"custom" | "svg" | "png" | "vector">(
    CUSTOM_LOGO_PATH ? "custom" : "vector"
  );
  const [activeCategory, setActiveCategory] = useState<CategoryId>("todos");
  const [budgetChannel, setBudgetChannel] = useState<BudgetChannel>("workana");
  const [copyStatus, setCopyStatus] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const filteredServices = useMemo(() => {
    if (activeCategory === "todos") {
      return services;
    }

    return services.filter((service) => service.category === activeCategory);
  }, [activeCategory]);

  const selectedItems = useMemo(
    () =>
      services
        .filter((service) => selectedServices[service.id])
        .map((service) => ({
          service,
          quantity: selectedServices[service.id],
        })),
    [selectedServices]
  );

  const onceTotal = selectedItems.reduce((total, item) => {
    if (item.service.billing === "monthly") {
      return total;
    }

    return total + item.service.price * item.quantity;
  }, 0);

  const monthlyTotal = selectedItems.reduce((total, item) => {
    if (item.service.billing === "once") {
      return total;
    }

    return total + item.service.price * item.quantity;
  }, 0);

  const selectedChannel = budgetChannels.find((channel) => channel.id === budgetChannel) || budgetChannels[0];

  const budgetMessage = useMemo(() => {
    const serviceLines = selectedItems.length
      ? selectedItems
          .map(({ service, quantity }) => {
            const suffix = service.billing === "monthly" ? "/mês" : "";
            const quantityText = service.allowQuantity
              ? `${quantity} ${service.unitLabel || "unidades"}`
              : "1 serviço";

            const priceText = service.startingAt
              ? `a partir de ${formatCurrency(service.price * quantity)}${suffix}`
              : `${formatCurrency(service.price * quantity)}${suffix}`;

            return `- ${service.title} (${quantityText}): ${priceText}`;
          })
          .join("\n")
      : "- Ainda não selecionei serviços.";

    if (budgetChannel === "upwork") {
      return [
        "Hi Victor! I'd like to request a quote for my project.",
        "",
        "I'm interested in the following services:",
        serviceLines,
        "",
        `Estimated one-time investment shown on your portfolio: ${formatCurrency(onceTotal)}`,
        monthlyTotal ? `Estimated monthly investment: ${formatCurrency(monthlyTotal)}` : "",
        "",
        "Could you please review the scope and confirm the next steps?",
        "Thank you!",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (budgetChannel === "workana") {
      return [
        "Olá, Victor! Gostaria de solicitar um orçamento para meu projeto.",
        "",
        "Tenho interesse nos seguintes serviços:",
        serviceLines,
        "",
        `Investimento único estimado no seu portfólio: ${formatCurrency(onceTotal)}`,
        monthlyTotal ? `Investimento mensal estimado: ${formatCurrency(monthlyTotal)}` : "",
        "",
        "Pode revisar o escopo e me orientar sobre os próximos passos?",
        "Obrigado!",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "Olá, Victor! Gostaria de solicitar um orçamento para meu projeto.",
      "",
      "Tenho interesse nos seguintes serviços:",
      serviceLines,
      "",
      `Investimento único estimado no seu portfólio: ${formatCurrency(onceTotal)}`,
      monthlyTotal ? `Investimento mensal estimado: ${formatCurrency(monthlyTotal)}` : "",
      "",
      "Pode revisar o escopo e me orientar sobre os próximos passos?",
      "Obrigado!",
    ]
      .filter(Boolean)
      .join("\n");
  }, [budgetChannel, monthlyTotal, onceTotal, selectedItems]);
  const activeProjectVideos = useMemo(() => (activeProject ? getProjectVideos(activeProject) : []), [activeProject]);

  function addService(id: string) {
    setSelectedServices((current) => {
      const service = services.find((item) => item.id === id);

      return {
        ...current,
        [id]: service?.allowQuantity ? (current[id] || 0) + 1 : 1,
      };
    });
  }

  function decreaseService(id: string) {
    setSelectedServices((current) => {
      const nextQuantity = (current[id] || 0) - 1;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[id];
        return next;
      }

      next[id] = nextQuantity;
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

  async function copyBudgetMessage() {
    if (!selectedChannel.copyable) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(budgetMessage);
      setCopyStatus("Mensagem copiada para colar no chat.");
      return true;
    } catch {
      setCopyStatus("Não consegui copiar automaticamente. Selecione o texto e copie manualmente.");
      return false;
    }
  }

  async function prepareBudgetMessage() {
    setSendStatus("sending");
    setCopyStatus("");

    const copied = await copyBudgetMessage();

    if (!copied && budgetChannel !== "direto") {
      setSendStatus("error");
      return;
    }

    if (budgetChannel === "direto") {
      window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(budgetMessage)}`, "_blank", "noopener,noreferrer");
    }

    setSendStatus("sent");
  }

  return (
    <main className="next-portfolio">
      <section className="hero" id="inicio">
        <img className="hero__image" src="/images/victor-hero.png" alt="Retrato estilizado de Victor" />
        <div className="hero__shade" />

        <nav className="topbar" aria-label="Navegação principal">
          <a className="brand-mark" href="#inicio" aria-label="Voltar ao início">
            {logoStage === "custom" && (
              <img
                src={CUSTOM_LOGO_PATH || ""}
                alt="Logo Victor"
                onError={() => setLogoStage("vector")}
                className="brand-mark__img"
              />
            )}
            {logoStage === "svg" && (
              <img
                src="/images/logo.svg"
                alt="Logo Victor"
                onError={() => setLogoStage("png")}
                className="brand-mark__img"
              />
            )}
            {logoStage === "png" && (
              <img
                src="/images/logo.png"
                alt="Logo Victor"
                onError={() => setLogoStage("vector")}
                className="brand-mark__img"
              />
            )}
            {logoStage === "vector" && (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="gold-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffd56b" />
                    <stop offset="50%" stopColor="#c7a447" />
                    <stop offset="100%" stopColor="#9f741f" />
                  </linearGradient>
                  <linearGradient id="gold-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff0ca" />
                    <stop offset="100%" stopColor="#765310" />
                  </linearGradient>
                  <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="45" stroke="url(#gold-primary)" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />
                <circle cx="50" cy="50" r="40" stroke="url(#gold-primary)" strokeWidth="1.5" opacity="0.15" />
                <path d="M25 25 L46 72 H52 L31 25 Z" fill="url(#gold-primary)" />
                <path d="M75 25 L54 72 H48 L69 25 Z" fill="url(#gold-secondary)" />
                <circle cx="50" cy="72" r="3" fill="#ffd56b" filter="url(#logo-glow)" />
              </svg>
            )}
          </a>
          <div className="availability">
            <span aria-hidden="true" />
            Disponível para novos projetos
          </div>
          <div className="topbar__links">
            <a href="#projetos">Projetos</a>
            <a href="#orcamento">Orçamento</a>
            <a href="#contato">Contato</a>
          </div>
        </nav>

        <div className="hero__content">
          <p className="eyebrow">Olá, eu sou</p>
          <h1>
            Vic<span>tor.</span>
          </h1>
          <p className="hero__role">
            <span>Desenvolvedor</span>
            <strong>Freelancer</strong>
          </p>
          <p className="hero__lead">
            Transformo ideias em soluções digitais <strong>modernas, intuitivas e de alta performance.</strong>
            Sites, aplicações e experiências que geram resultados reais para o seu negócio.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="#projetos">
              Ver projetos <span aria-hidden="true">-&gt;</span>
            </a>
            <a className="button button--ghost" href="#orcamento">
              Montar orçamento
            </a>
          </div>
        </div>
      </section>

      <section className="section projects" id="projetos">
        <div className="section__intro">
          <p className="eyebrow">Portfólio em vídeo</p>
          <h2>Projetos prontos para apresentar, vender e validar ideias.</h2>
          <p>Demos visuais para clientes entenderem a experiência antes mesmo de abrir o código.</p>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div className="project-card__media">
                <img src={project.mainImage.src} alt={project.mainImage.alt} />
              </div>
              <p>{project.category}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <strong>{project.status}</strong>
              <ul>
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button className="project-card__button" onClick={() => setActiveProject(project)} type="button">
                Ver detalhes <span aria-hidden="true">-&gt;</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      {activeProject ? (
        <div aria-modal="true" className="project-modal" role="dialog" aria-labelledby="project-modal-title">
          <button
            aria-label="Fechar detalhes do projeto"
            className="project-modal__backdrop"
            onClick={() => setActiveProject(null)}
            type="button"
          />
          <article className="project-modal__panel">
            <button className="project-modal__close" onClick={() => setActiveProject(null)} type="button" aria-label="Fechar">
              ×
            </button>

            {activeProjectVideos.length ? (
              <div className="project-modal__videos" aria-label="Videos demonstrativos do projeto">
                {activeProjectVideos.map((video, index) => (
                  <figure className="project-modal__video" key={`${video.src}-${index}`}>
                    <video controls preload="metadata" poster={video.poster} aria-label={video.label}>
                      <source src={video.src} />
                      Seu navegador não suporta vídeo HTML5.
                    </video>
                    <figcaption>{video.label || `Video demo ${index + 1}`}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="project-modal__video">
                <img src={activeProject.mainImage.src} alt={activeProject.mainImage.alt} />
              </div>
            )}

            <div className="project-modal__content">
              <div>
                <p className="eyebrow">{activeProject.category}</p>
                <h2 id="project-modal-title">{activeProject.title}</h2>
                <p>{activeProject.summary}</p>
              </div>
              <div className="project-modal__status">{activeProject.status}</div>
            </div>

            <div className="project-modal__details">
              <section>
                <h3>O que foi feito</h3>
                <ul className="project-modal__work">
                  {activeProject.workDone.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3>Tecnologias usadas</h3>
                <ul className="project-modal__tags">
                  {activeProject.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="project-modal__gallery" aria-label="Galeria do projeto">
              {activeProject.gallery.map((image) => (
                <figure key={image.src}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{image.label}</figcaption>
                </figure>
              ))}
            </section>
          </article>
        </div>
      ) : null}

      <section className="section budget" id="orcamento">
        <div className="section__intro section__intro--budget">
          <h2>Monte um orçamento WordPress em tempo real.</h2>
          <p>Serviços de sites, SEO, performance e suporte com explicação direta para clientes.</p>
        </div>

        <div className="budget-layout">
          <div className="service-browser">
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
              {filteredServices.map((service) => (
                <article className="service-card" key={service.id}>
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
                    <strong>
                      {formatServicePrice(service)}
                    </strong>
                    <button
                      className={selectedServices[service.id] && !service.allowQuantity ? "is-selected" : ""}
                      disabled={Boolean(selectedServices[service.id] && !service.allowQuantity)}
                      type="button"
                      onClick={() => addService(service.id)}
                    >
                      {selectedServices[service.id] && !service.allowQuantity
                        ? "Selecionado"
                        : service.allowQuantity && selectedServices[service.id]
                          ? `Adicionar mais (${selectedServices[service.id]})`
                          : "+ Adicionar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="budget-panel" aria-label="Resumo do orçamento">
            <div className="budget-panel__header">
              <p className="eyebrow">Resumo</p>
              <h3>Orçamento atual</h3>
            </div>

            <div className="selected-list">
              {selectedItems.length ? (
                selectedItems.map(({ service, quantity }) => (
                  <div className="selected-item" key={service.id}>
                    <div>
                      <strong>{service.title}</strong>
                      <span>
                        {service.allowQuantity
                          ? `${quantity} ${service.unitLabel || "unidades"} x ${formatCurrency(service.price)}`
                          : formatServicePrice(service)}
                        {service.allowQuantity && service.billing === "monthly" ? "/mês" : ""}
                      </span>
                    </div>
                    <div className="selected-item__actions">
                      {service.allowQuantity ? (
                        <>
                          <button type="button" onClick={() => decreaseService(service.id)} aria-label={`Diminuir ${service.title}`}>
                            -
                          </button>
                          <button type="button" onClick={() => addService(service.id)} aria-label={`Adicionar ${service.title}`}>
                            +
                          </button>
                        </>
                      ) : null}
                      <button className="selected-item__remove" type="button" onClick={() => removeService(service.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="selected-list__empty">Nenhum serviço selecionado.</p>
              )}
            </div>

            <div className="totals">
              <div>
                <span>Total único estimado</span>
                <strong>{formatCurrency(onceTotal)}</strong>
              </div>
              <div>
                <span>Mensal</span>
                <strong>{formatCurrency(monthlyTotal)}</strong>
              </div>
            </div>

            <div className="budget-channel">
              <p className="eyebrow">Destino</p>
              <div className="budget-channel__options">
                {budgetChannels.map((channel) => (
                  <button
                    aria-pressed={budgetChannel === channel.id}
                    className={budgetChannel === channel.id ? "is-active" : ""}
                    key={channel.id}
                    onClick={() => {
                      setBudgetChannel(channel.id);
                      setCopyStatus("");
                      setSendStatus("idle");
                    }}
                    type="button"
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
              <p>{selectedChannel.description}</p>
            </div>

            {selectedChannel.copyable ? (
              <div className="budget-message">
                <label htmlFor="budget-message">Mensagem gerada</label>
                <textarea id="budget-message" readOnly value={budgetMessage} />
              </div>
            ) : null}

            {copyStatus ? <p className="budget-status">{copyStatus}</p> : null}

            <button className="button button--primary budget-panel__cta" disabled={sendStatus === "sending"} onClick={prepareBudgetMessage} type="button">
              {sendStatus === "sending"
                ? "Preparando..."
                : budgetChannel === "direto"
                  ? "Copiar e abrir WhatsApp"
                  : "Copiar mensagem"}
              <span aria-hidden="true">-&gt;</span>
            </button>

            {sendStatus === "sent" ? (
              <p className="budget-status">
                {budgetChannel === "direto" ? "Mensagem copiada e WhatsApp aberto." : "Mensagem copiada para o chat."}
              </p>
            ) : null}
            {sendStatus === "error" ? (
              <p className="budget-status budget-status--warning">
                Não consegui copiar automaticamente. Selecione o texto e copie manualmente.
              </p>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="section process">
        <div className="process__header">
          <p className="eyebrow">Como eu construo</p>
          <h2>Estratégia, interface e entrega em uma experiência só.</h2>
        </div>
        <div className="process__steps">
          <article>
            <span>01</span>
            <h3>Diagnóstico</h3>
            <p>Entendo o objetivo e separo o que é essencial do que pode ser opcional.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Construção</h3>
            <p>Transformo a solução em interface responsiva, clara e com boa performance.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Apresentação</h3>
            <p>Organizo o resultado para o cliente entender o valor e aprovar com segurança.</p>
          </article>
        </div>
      </section>

      <section className="section contact" id="contato">
        <div>
          <p className="eyebrow">Contato</p>
          <h2>Seu projeto pode ser a próxima história de sucesso.</h2>
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
    </main>
  );
}
