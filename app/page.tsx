"use client";

import { useMemo, useState } from "react";

type CategoryId = "todos" | "sites" | "seo" | "suporte";
type Billing = "once" | "monthly";
type BudgetChannel = "workana" | "upwork" | "direto";
type SendStatus = "idle" | "sending" | "sent" | "not-configured" | "error";

type BudgetService = {
  id: string;
  category: Exclude<CategoryId, "todos">;
  title: string;
  price: number;
  billing: Billing;
  summary: string;
  details?: string[];
  allowQuantity?: boolean;
  unitLabel?: string;
  startingAt?: boolean;
};

type Project = {
  title: string;
  category: string;
  status: string;
  stack: string[];
  summary: string;
  workDone: string[];
  mainImage: {
    src: string;
    alt: string;
  };
  gallery: {
    src: string;
    alt: string;
    label: string;
  }[];
  video: {
    src: string;
    poster: string;
    label: string;
  };
};

const categories: { id: CategoryId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "sites", label: "Sites" },
  { id: "seo", label: "SEO e performance" },
  { id: "suporte", label: "Suporte" },
];

const serviceCategoryLabels: Record<Exclude<CategoryId, "todos">, string> = {
  sites: "Sites WordPress",
  seo: "SEO e performance",
  suporte: "Suporte",
};

const budgetChannels: { id: BudgetChannel; label: string; description: string; copyable: boolean }[] = [
  {
    id: "workana",
    label: "Cliente Workana",
    description: "Gera uma mensagem pronta para copiar no chat da Workana e envia o resumo para seu email.",
    copyable: true,
  },
  {
    id: "upwork",
    label: "Cliente Upwork",
    description: "Gera uma proposta em inglês para copiar no chat da Upwork e envia o resumo para seu email.",
    copyable: true,
  },
  {
    id: "direto",
    label: "Cliente direto",
    description: "Envia o pedido de orçamento somente para seu email.",
    copyable: false,
  },
];

const services: BudgetService[] = [
  {
    id: "landing-page",
    category: "sites",
    title: "Landing page",
    price: 350,
    billing: "once",
    summary: "Página única para apresentar uma oferta, serviço ou campanha com visual profissional.",
    startingAt: true,
    details: [
      "Seção principal com chamada forte",
      "Layout responsivo",
      "Botão para WhatsApp ou contato",
      "Formulário simples",
      "SEO básico da página",
    ],
  },
  {
    id: "site-institucional",
    category: "sites",
    title: "Site institucional",
    price: 550,
    billing: "once",
    summary: "Até 5 páginas para apresentar marca, serviços e contato.",
    startingAt: true,
    details: [
      "Layout profissional e responsivo",
      "WordPress + Elementor",
      "Home, Sobre, Serviços e Contato",
      "WhatsApp e formulário",
      "SEO básico e mobile",
    ],
  },
  {
    id: "pagina-adicional",
    category: "sites",
    title: "Página adicional",
    price: 100,
    billing: "once",
    summary: "Para sites institucionais acima das 5 páginas inclusas no pacote base.",
    allowQuantity: true,
    unitLabel: "páginas",
    details: [
      "Layout seguindo o visual do site",
      "Conteúdo organizado na página",
      "Ajuste para celular",
      "Botões e links necessários",
    ],
  },
  {
    id: "blog-wordpress",
    category: "sites",
    title: "Blog WordPress",
    price: 250,
    billing: "once",
    summary: "Estrutura de blog organizada para publicar artigos com boa apresentação.",
    details: [
      "Estrutura de blog",
      "Página de categorias",
      "Template de post",
      "Sidebar personalizada",
      "Organização visual dos artigos",
    ],
  },
  {
    id: "seo-essencial",
    category: "seo",
    title: "SEO essencial",
    price: 200,
    billing: "once",
    summary: "Configuração inicial para o site ficar mais organizado para mecanismos de busca.",
    details: [
      "Titles e meta descriptions",
      "URLs amigáveis",
      "Headings H1, H2 e H3",
      "Sitemap XML",
      "Plugin SEO configurado",
    ],
  },
  {
    id: "seo-tecnico",
    category: "seo",
    title: "SEO técnico",
    price: 400,
    billing: "once",
    summary: "Ajustes técnicos para melhorar indexação, estrutura e leitura do site.",
    details: [
      "Ajustes técnicos de indexação",
      "Otimização estrutural",
      "Correção básica de SEO técnico",
      "Search Console configurado",
      "Melhorias de performance para SEO",
    ],
  },
  {
    id: "performance",
    category: "seo",
    title: "Otimização de performance",
    price: 250,
    billing: "once",
    summary: "Melhorias para reduzir lentidão e deixar o site mais leve no mobile.",
    details: [
      "Otimização de imagens",
      "Configuração de cache",
      "Redução de lentidão",
      "Melhorias básicas no PageSpeed",
      "Ajustes de carregamento mobile",
    ],
  },
  {
    id: "analytics",
    category: "seo",
    title: "Google Analytics + Search Console",
    price: 150,
    billing: "once",
    summary: "Integração das ferramentas do Google para acompanhar acessos e presença na busca.",
    details: [
      "Google Analytics integrado",
      "Search Console configurado",
      "Verificação de domínio",
      "Monitoramento básico de acessos",
    ],
  },
  {
    id: "suporte-30",
    category: "suporte",
    title: "Suporte por 30 dias",
    price: 150,
    billing: "once",
    summary: "Acompanhamento pós-entrega para correções leves e dúvidas básicas.",
    details: [
      "Correções leves",
      "Ajustes simples",
      "Suporte técnico pós-entrega",
      "Auxílio em dúvidas básicas",
    ],
  },
  {
    id: "manutencao",
    category: "suporte",
    title: "Manutenção mensal",
    price: 200,
    billing: "monthly",
    summary: "Cuidado mensal para manter WordPress, plugins e backups em dia.",
    details: [
      "Atualização de plugins",
      "Atualização do WordPress",
      "Backup preventivo",
      "Monitoramento básico",
      "Pequenos ajustes mensais",
    ],
  },
];

const projects: Project[] = [
  {
    title: "Landing Page A Mais Radiologia",
    category: "Landing Page / Saúde / Radiologia Odontológica / Geração de Leads",
    status: "Projeto em fase final / ainda não hospedado",
    stack: [
      "WordPress",
      "Elementor",
      "Hello Elementor",
      "Fluent Forms",
      "Rank Math SEO",
      "LiteSpeed Cache",
      "LocalWP",
      "CSS personalizado",
    ],
    summary:
      "Landing page moderna e responsiva para uma clínica de radiologia odontológica, criada com foco em captação de leads e solicitação de orçamento para exames.",
    workDone: [
      "Hero com imagem em banner.",
      "Formulário de orçamento.",
      "Cards de benefícios.",
      "Cards de exames.",
      "CTA final.",
      "Rodapé com informações de contato e mapa.",
      "Boas práticas de SEO.",
      "Responsividade mobile.",
      "Otimizações visuais para conversão.",
    ],
    mainImage: {
      src: "/projects/a-mais-radiologia/hero-desktop.png",
      alt: "Primeira dobra da landing page A Mais Radiologia com headline, benefícios e CTA.",
    },
    gallery: [
      {
        src: "/projects/a-mais-radiologia/form-desktop.png",
        alt: "Seção de solicitação de orçamento com formulário desktop.",
        label: "Formulário desktop",
      },
      {
        src: "/projects/a-mais-radiologia/exames-desktop.png",
        alt: "Cards de exames odontológicos disponíveis.",
        label: "Cards de exames",
      },
      {
        src: "/projects/a-mais-radiologia/beneficios-desktop.png",
        alt: "Seção de benefícios e praticidade da landing page.",
        label: "Benefícios",
      },
      {
        src: "/projects/a-mais-radiologia/contato-desktop.png",
        alt: "CTA final com rodapé, contatos e mapa.",
        label: "CTA, rodapé e mapa",
      },
      {
        src: "/projects/a-mais-radiologia/hero-mobile.jpeg",
        alt: "Versão mobile do hero da landing page A Mais Radiologia.",
        label: "Hero mobile",
      },
      {
        src: "/projects/a-mais-radiologia/form-mobile.jpeg",
        alt: "Versão mobile do formulário de orçamento.",
        label: "Formulário mobile",
      },
    ],
    video: {
      src: "/projects/a-mais-radiologia/demo.mp4",
      poster: "/projects/a-mais-radiologia/hero-desktop.png",
      label: "Vídeo demo da Landing Page A Mais Radiologia",
    },
  },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const formatServicePrice = (service: BudgetService, value = service.price) =>
  `${service.startingAt ? "A partir de " : ""}${formatCurrency(value)}${service.billing === "monthly" ? "/mês" : ""}`;

export default function Home() {
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
            const detailsText = service.details?.length
              ? `\n  Inclui: ${service.details.join("; ")}`
              : "";

            return `- ${service.title} (${quantityText}): ${priceText}${detailsText}`;
          })
          .join("\n")
      : "- Ainda não selecionei serviços.";

    if (budgetChannel === "upwork") {
      return [
        "Hello! Here is my suggested scope and investment for this WordPress project:",
        "",
        "Selected services:",
        serviceLines,
        "",
        `Estimated one-time investment: ${formatCurrency(onceTotal)}`,
        monthlyTotal ? `Monthly investment: ${formatCurrency(monthlyTotal)}` : "",
        "",
        "If we need to adapt the budget, we can remove optional items and keep the essential scope first.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (budgetChannel === "workana") {
      return [
        "Olá! Segue uma sugestão de orçamento para o projeto no Workana:",
        "",
        "Serviços selecionados:",
        serviceLines,
        "",
        `Investimento único estimado: ${formatCurrency(onceTotal)}`,
        monthlyTotal ? `Investimento mensal: ${formatCurrency(monthlyTotal)}` : "",
        "",
        "Caso seja necessário adequar ao orçamento, podemos remover serviços opcionais e manter primeiro o escopo essencial.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "Novo pedido de orçamento pelo portfólio:",
      "",
      "Serviços selecionados:",
      serviceLines,
      "",
      `Total único estimado: ${formatCurrency(onceTotal)}`,
      monthlyTotal ? `Mensal: ${formatCurrency(monthlyTotal)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [budgetChannel, monthlyTotal, onceTotal, selectedItems]);

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

  async function submitBudget() {
    setSendStatus("sending");
    setCopyStatus("");

    if (selectedChannel.copyable) {
      await copyBudgetMessage();
    }

    try {
      const response = await fetch("/api/budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: budgetChannel,
          message: budgetMessage,
          onceTotal,
          monthlyTotal,
          items: selectedItems.map(({ service, quantity }) => ({
            id: service.id,
            title: service.title,
            price: service.price,
            billing: service.billing,
            quantity,
          })),
        }),
      });
      const result = (await response.json().catch(() => null)) as { emailSent?: boolean } | null;

      if (!response.ok) {
        throw new Error("Budget email failed");
      }

      setSendStatus(result?.emailSent === false ? "not-configured" : "sent");
    } catch {
      setSendStatus("error");
    }
  }

  return (
    <main className="next-portfolio">
      <section className="hero" id="inicio">
        <img className="hero__image" src="/images/victor-hero.png" alt="Retrato estilizado de Victor" />
        <div className="hero__shade" />

        <nav className="topbar" aria-label="Navegação principal">
          <a className="brand-mark" href="#inicio" aria-label="Voltar ao início">
            <svg viewBox="0 0 64 72" aria-hidden="true" focusable="false">
              <path d="M9 8 32 63 55 8" />
              <path d="M26 8 38 38" />
            </svg>
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

            <div className="project-modal__video">
              <video controls preload="metadata" poster={activeProject.video.poster} aria-label={activeProject.video.label}>
                <source src={activeProject.video.src} type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>

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
          <p className="eyebrow">Orçamento SaaS</p>
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
                    <p>{serviceCategoryLabels[service.category]}</p>
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
                <label htmlFor="budget-message">Mensagem para copiar</label>
                <textarea id="budget-message" readOnly value={budgetMessage} />
                <button type="button" onClick={copyBudgetMessage}>
                  Copiar mensagem
                </button>
              </div>
            ) : null}

            {copyStatus ? <p className="budget-status">{copyStatus}</p> : null}

            <button className="button button--primary budget-panel__cta" disabled={sendStatus === "sending"} onClick={submitBudget} type="button">
              {sendStatus === "sending"
                ? "Enviando..."
                : selectedChannel.copyable
                  ? "Copiar e enviar para meu email"
                  : "Enviar para meu email"}
              <span aria-hidden="true">-&gt;</span>
            </button>

            {sendStatus === "sent" ? <p className="budget-status">Orçamento enviado para seu email.</p> : null}
            {sendStatus === "not-configured" ? (
              <p className="budget-status budget-status--warning">
                A mensagem foi gerada, mas o envio automático ainda precisa das variáveis de email na Vercel.
              </p>
            ) : null}
            {sendStatus === "error" ? (
              <p className="budget-status budget-status--warning">
                Não consegui enviar automaticamente. Confira a configuração de email na Vercel.
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
          <a className="button button--primary" href="mailto:contato@dunkarley.dev">
            Falar sobre projeto <span aria-hidden="true">-&gt;</span>
          </a>
        </div>
      </section>
    </main>
  );
}
