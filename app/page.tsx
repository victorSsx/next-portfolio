"use client";

import { useMemo, useState } from "react";

type CategoryId = "todos" | "base" | "tecnico" | "pacote";
type Billing = "once" | "monthly";

type BudgetService = {
  id: string;
  category: Exclude<CategoryId, "todos">;
  title: string;
  price: number;
  billing: Billing;
  summary: string;
  details?: string[];
};

type Project = {
  title: string;
  stack: string[];
  summary: string;
  kind: string;
};

const categories: { id: CategoryId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "base", label: "Serviços base" },
  { id: "tecnico", label: "Ajustes técnicos" },
  { id: "pacote", label: "Pacotes" },
];

const services: BudgetService[] = [
  {
    id: "site-institucional",
    category: "base",
    title: "Site institucional",
    price: 600,
    billing: "once",
    summary: "Até 5 páginas para apresentar marca, serviços e contato.",
  },
  {
    id: "seo-avancado",
    category: "base",
    title: "SEO avançado",
    price: 500,
    billing: "once",
    summary: "Otimização mais profunda para páginas, estrutura e conteúdo.",
  },
  {
    id: "performance",
    category: "base",
    title: "Otimização de performance",
    price: 300,
    billing: "once",
    summary: "Ajustes para melhorar carregamento, peso visual e experiência.",
  },
  {
    id: "analytics",
    category: "base",
    title: "Google Analytics + Search Console",
    price: 200,
    billing: "once",
    summary: "Configuração de mensuração e presença nas ferramentas Google.",
  },
  {
    id: "blog",
    category: "base",
    title: "Blog",
    price: 300,
    billing: "once",
    summary: "Estrutura inicial para posts, categorias e organização editorial.",
  },
  {
    id: "suporte-30",
    category: "base",
    title: "Suporte por 30 dias",
    price: 200,
    billing: "once",
    summary: "Acompanhamento após entrega para dúvidas e pequenos ajustes.",
  },
  {
    id: "manutencao",
    category: "base",
    title: "Manutenção mensal",
    price: 250,
    billing: "monthly",
    summary: "Rotina mensal de cuidado, atualizações e pequenas correções.",
  },
  {
    id: "seo-essencial",
    category: "base",
    title: "SEO essencial",
    price: 250,
    billing: "once",
    summary: "Base de SEO compatível com sites WordPress de pequeno e médio porte.",
    details: [
      "Titles e meta descriptions",
      "URLs amigáveis",
      "Headings H1, H2 e H3",
      "Sitemap XML",
      "Plugin de SEO configurado",
    ],
  },
  {
    id: "diagnostico-tecnico",
    category: "tecnico",
    title: "Diagnóstico técnico e correção",
    price: 250,
    billing: "once",
    summary: "Mapeamento de erros e correções iniciais no WordPress.",
  },
  {
    id: "elementor",
    category: "tecnico",
    title: "Correção de erro no Elementor",
    price: 200,
    billing: "once",
    summary: "Correção de conflitos, widgets quebrados e problemas visuais.",
  },
  {
    id: "layout-existente",
    category: "tecnico",
    title: "Ajuste de layout existente",
    price: 150,
    billing: "once",
    summary: "Refino visual em uma página já publicada.",
  },
  {
    id: "hero-section",
    category: "tecnico",
    title: "Edição de Hero Section",
    price: 150,
    billing: "once",
    summary: "Ajuste da primeira dobra com texto, imagem e chamada principal.",
  },
  {
    id: "responsividade",
    category: "tecnico",
    title: "Responsividade por página",
    price: 100,
    billing: "once",
    summary: "Correções para celular, tablet e desktop.",
  },
  {
    id: "botoes-links",
    category: "tecnico",
    title: "Configuração de botões e links",
    price: 50,
    billing: "once",
    summary: "Revisão de CTAs, links, WhatsApp e navegação.",
  },
  {
    id: "conteudo",
    category: "tecnico",
    title: "Inserção e formatação de conteúdo",
    price: 100,
    billing: "once",
    summary: "Publicação de textos, imagens e blocos de conteúdo.",
  },
  {
    id: "pagina-blog",
    category: "tecnico",
    title: "Página de blog",
    price: 150,
    billing: "once",
    summary: "Criação ou edição de página para posts e listagens.",
  },
  {
    id: "template-post",
    category: "tecnico",
    title: "Template de post e categoria",
    price: 200,
    billing: "once",
    summary: "Modelo visual para posts, categorias e navegação do blog.",
  },
  {
    id: "ssl",
    category: "tecnico",
    title: "Correção de HTTPS/SSL",
    price: 150,
    billing: "once",
    summary: "Ajuste de certificado, links mistos e redirecionamentos.",
  },
  {
    id: "php-limits",
    category: "tecnico",
    title: "Aumento de limites PHP",
    price: 100,
    billing: "once",
    summary: "Configuração de memória, upload e execução quando permitido.",
  },
  {
    id: "whatsapp",
    category: "tecnico",
    title: "Integração com WhatsApp",
    price: 80,
    billing: "once",
    summary: "Botões, links e chamadas para conversa direta.",
  },
  {
    id: "formularios",
    category: "tecnico",
    title: "Formulários externos",
    price: 100,
    billing: "once",
    summary: "Integração com ferramentas externas de captura.",
  },
  {
    id: "backup-migracao",
    category: "tecnico",
    title: "Backup e migração",
    price: 200,
    billing: "once",
    summary: "Cópia, transferência e organização inicial do site.",
  },
  {
    id: "pacote-ajuste",
    category: "pacote",
    title: "Ajuste Técnico Essencial",
    price: 450,
    billing: "once",
    summary: "Diagnóstico, Elementor, HTTPS e botões básicos.",
  },
  {
    id: "pacote-refino",
    category: "pacote",
    title: "Refinamento Visual",
    price: 600,
    billing: "once",
    summary: "Layout, responsividade, conteúdo e Hero Section.",
  },
  {
    id: "pacote-premium",
    category: "pacote",
    title: "Finalização Premium",
    price: 900,
    billing: "once",
    summary: "Ajustes técnicos, refino visual e performance.",
  },
];

const projects: Project[] = [
  {
    title: "Dashboard Financeiro",
    kind: "SaaS / Analytics",
    stack: ["React", "TypeScript", "Tailwind"],
    summary: "Interface de KPIs com gráficos, filtros e visão rápida de indicadores.",
  },
  {
    title: "Landing Interativa",
    kind: "Produto digital",
    stack: ["JavaScript", "CSS", "Animações"],
    summary: "Página de conversão com primeira dobra forte e microinterações.",
  },
  {
    title: "Site WordPress Premium",
    kind: "WordPress",
    stack: ["WordPress", "SEO", "Performance"],
    summary: "Estrutura institucional com blog, SEO essencial e otimização.",
  },
];

const pricingRules = [
  { label: "Correções simples", value: "R$ 100 a R$ 250" },
  { label: "Ajustes médios", value: "R$ 250 a R$ 600" },
  { label: "Problemas complexos", value: "R$ 600 a R$ 1.500+" },
  { label: "Até 1 hora", value: "R$ 100 a R$ 150" },
  { label: "2 a 4 horas", value: "R$ 250 a R$ 600" },
  { label: "1 a 3 dias", value: "R$ 600 a R$ 1.500" },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("todos");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

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

  const budgetBody = selectedItems.length
    ? selectedItems
        .map(({ service, quantity }) => {
          const suffix = service.billing === "monthly" ? "/mês" : "";
          return `- ${quantity}x ${service.title}: ${formatCurrency(service.price * quantity)}${suffix}`;
        })
        .join("\n")
    : "Quero montar um orçamento para serviços WordPress.";

  const mailHref = `mailto:contato@dunkarley.dev?subject=${encodeURIComponent(
    "Pedido de orçamento"
  )}&body=${encodeURIComponent(
    `${budgetBody}\n\nTotal único: ${formatCurrency(onceTotal)}\nMensal: ${formatCurrency(
      monthlyTotal
    )}`
  )}`;

  function addService(id: string) {
    setSelectedServices((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
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
              <div className="project-card__preview" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>{project.kind}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <ul>
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section budget" id="orcamento">
        <div className="section__intro section__intro--budget">
          <p className="eyebrow">Orçamento SaaS</p>
          <h2>Monte um orçamento WordPress em tempo real.</h2>
          <p>Serviços base, ajustes técnicos e pacotes com totalização automática.</p>
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
                    <p>{service.category === "pacote" ? "Pacote recomendado" : "Serviço"}</p>
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
                      {formatCurrency(service.price)}
                      {service.billing === "monthly" ? "/mês" : ""}
                    </strong>
                    <button type="button" onClick={() => addService(service.id)}>
                      + Adicionar
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
                        {quantity}x {formatCurrency(service.price)}
                        {service.billing === "monthly" ? "/mês" : ""}
                      </span>
                    </div>
                    <div className="selected-item__actions">
                      <button type="button" onClick={() => decreaseService(service.id)} aria-label={`Diminuir ${service.title}`}>
                        -
                      </button>
                      <button type="button" onClick={() => addService(service.id)} aria-label={`Adicionar ${service.title}`}>
                        +
                      </button>
                      <button type="button" onClick={() => removeService(service.id)} aria-label={`Remover ${service.title}`}>
                        x
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
                <span>Total único</span>
                <strong>{formatCurrency(onceTotal)}</strong>
              </div>
              <div>
                <span>Mensal</span>
                <strong>{formatCurrency(monthlyTotal)}</strong>
              </div>
            </div>

            <a className="button button--primary budget-panel__cta" href={mailHref}>
              Enviar orçamento <span aria-hidden="true">-&gt;</span>
            </a>
          </aside>
        </div>

        <div className="pricing-rules">
          {pricingRules.map((rule) => (
            <div key={rule.label}>
              <span>{rule.label}</span>
              <strong>{rule.value}</strong>
            </div>
          ))}
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
