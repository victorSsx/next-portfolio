"use client";

import { useMemo, useState } from "react";
import {
  siteData as defaultSiteData,
  type BudgetService,
  type Project,
  type ProjectImage,
  type SiteData,
} from "../lib/site-data";

type AdminTab = "projects" | "services" | "categories" | "technologies";
type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";

const cloneSiteData = () => structuredClone(defaultSiteData) as SiteData;

const linesToArray = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToLines = (items?: string[]) => (items || []).join("\n");

const galleryToLines = (items?: ProjectImage[]) =>
  (items || []).map((image) => [image.label || "", image.src, image.alt].join(" | ")).join("\n");

const linesToGallery = (value: string): ProjectImage[] =>
  linesToArray(value)
    .map((line) => {
      const [label = "", src = "", alt = ""] = line.split("|").map((part) => part.trim());
      return { label, src, alt };
    })
    .filter((image) => image.src);

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

const createProject = (): Project => ({
  id: makeId("projeto"),
  title: "Novo projeto",
  category: "Landing Page",
  status: "Projeto em fase final / ainda não hospedado",
  stack: [],
  summary: "",
  workDone: [],
  mainImage: {
    src: "",
    alt: "",
  },
  gallery: [],
});

const createService = (category: string): BudgetService => ({
  id: makeId("servico"),
  category,
  title: "Novo serviço",
  price: 0,
  billing: "once",
  summary: "",
  details: [],
});

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [data, setData] = useState<SiteData>(() => cloneSiteData());
  const [activeProjectId, setActiveProjectId] = useState(defaultSiteData.projects[0]?.id || "");
  const [activeServiceId, setActiveServiceId] = useState(defaultSiteData.services[0]?.id || "");

  const activeProject = useMemo(
    () => data.projects.find((project) => project.id === activeProjectId) || data.projects[0],
    [activeProjectId, data.projects]
  );

  const activeService = useMemo(
    () => data.services.find((service) => service.id === activeServiceId) || data.services[0],
    [activeServiceId, data.services]
  );

  const updateProject = (id: string, update: Partial<Project>) => {
    setData((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === id ? { ...project, ...update } : project)),
    }));
  };

  const updateService = (id: string, update: Partial<BudgetService>) => {
    setData((current) => ({
      ...current,
      services: current.services.map((service) => (service.id === id ? { ...service, ...update } : service)),
    }));
  };

  const updateProjectId = (id: string, nextId: string) => {
    updateProject(id, { id: nextId });
    setActiveProjectId(nextId);
  };

  const updateServiceId = (id: string, nextId: string) => {
    updateService(id, { id: nextId });
    setActiveServiceId(nextId);
  };

  const loadData = async () => {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/admin/data", {
      headers: {
        "x-admin-password": password,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Não foi possível entrar.");
      return;
    }

    setData(payload.data);
    setActiveProjectId(payload.data.projects[0]?.id || "");
    setActiveServiceId(payload.data.services[0]?.id || "");
    setIsUnlocked(true);
    setStatus("idle");
  };

  const saveData = async () => {
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/admin/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ data }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Não foi possível salvar.");
      return;
    }

    setStatus("saved");
    setMessage(payload.mode === "github" ? "Salvo no GitHub. A Vercel vai publicar o deploy." : "Salvo no arquivo local.");
  };

  if (!isUnlocked) {
    return (
      <main className="admin-page admin-page--login">
        <section className="admin-login">
          <p className="eyebrow">Admin</p>
          <h1>Área administrativa</h1>
          <label>
            Senha
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && password) {
                  loadData();
                }
              }}
              type="password"
              value={password}
            />
          </label>
          <button className="button button--primary" disabled={!password || status === "loading"} onClick={loadData} type="button">
            {status === "loading" ? "Entrando..." : "Entrar"}
          </button>
          {message ? <p className="admin-status admin-status--error">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Painel do portfólio</h1>
        </div>
        <div className="admin-header__actions">
          <a className="admin-link" href="/">
            Ver site
          </a>
          <button className="button button--primary" disabled={status === "saving"} onClick={saveData} type="button">
            {status === "saving" ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </header>

      {message ? <p className={`admin-status admin-status--${status === "error" ? "error" : "success"}`}>{message}</p> : null}

      <nav className="admin-tabs" aria-label="Seções administrativas">
        {[
          ["projects", "Projetos"],
          ["services", "Serviços e preços"],
          ["categories", "Categorias"],
          ["technologies", "Tecnologias"],
        ].map(([id, label]) => (
          <button className={activeTab === id ? "is-active" : ""} key={id} onClick={() => setActiveTab(id as AdminTab)} type="button">
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "projects" ? (
        <section className="admin-layout">
          <aside className="admin-list">
            <button
              type="button"
              onClick={() => {
                const project = createProject();
                setData((current) => ({ ...current, projects: [...current.projects, project] }));
                setActiveProjectId(project.id);
              }}
            >
              + Novo projeto
            </button>
            {data.projects.map((project) => (
              <button
                className={activeProject?.id === project.id ? "is-active" : ""}
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                type="button"
              >
                {project.title}
              </button>
            ))}
          </aside>

          {activeProject ? (
            <section className="admin-form">
              <div className="admin-form__grid">
                <label>
                  Nome
                  <input value={activeProject.title} onChange={(event) => updateProject(activeProject.id, { title: event.target.value })} />
                </label>
                <label>
                  ID
                  <input value={activeProject.id} onChange={(event) => updateProjectId(activeProject.id, event.target.value)} />
                </label>
                <label>
                  Categoria
                  <input value={activeProject.category} onChange={(event) => updateProject(activeProject.id, { category: event.target.value })} />
                </label>
                <label>
                  Status
                  <input value={activeProject.status} onChange={(event) => updateProject(activeProject.id, { status: event.target.value })} />
                </label>
              </div>

              <label>
                Descrição curta
                <textarea value={activeProject.summary} onChange={(event) => updateProject(activeProject.id, { summary: event.target.value })} />
              </label>

              <div className="admin-form__grid">
                <label>
                  Imagem principal
                  <input
                    value={activeProject.mainImage.src}
                    onChange={(event) =>
                      updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, src: event.target.value } })
                    }
                  />
                </label>
                <label>
                  Alt da imagem
                  <input
                    value={activeProject.mainImage.alt}
                    onChange={(event) =>
                      updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, alt: event.target.value } })
                    }
                  />
                </label>
                <label>
                  Vídeo demo
                  <input
                    value={activeProject.video?.src || ""}
                    onChange={(event) =>
                      updateProject(activeProject.id, {
                        video: event.target.value
                          ? {
                              src: event.target.value,
                              poster: activeProject.video?.poster || activeProject.mainImage.src,
                              label: activeProject.video?.label || `Vídeo demo de ${activeProject.title}`,
                            }
                          : undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Poster do vídeo
                  <input
                    value={activeProject.video?.poster || ""}
                    onChange={(event) =>
                      updateProject(activeProject.id, {
                        video: {
                          src: activeProject.video?.src || "",
                          poster: event.target.value,
                          label: activeProject.video?.label || `Vídeo demo de ${activeProject.title}`,
                        },
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Tecnologias
                <textarea
                  value={arrayToLines(activeProject.stack)}
                  onChange={(event) => updateProject(activeProject.id, { stack: linesToArray(event.target.value) })}
                />
              </label>

              <label>
                O que foi feito
                <textarea
                  value={arrayToLines(activeProject.workDone)}
                  onChange={(event) => updateProject(activeProject.id, { workDone: linesToArray(event.target.value) })}
                />
              </label>

              <label>
                Galeria
                <textarea
                  value={galleryToLines(activeProject.gallery)}
                  onChange={(event) => updateProject(activeProject.id, { gallery: linesToGallery(event.target.value) })}
                />
              </label>

              <button
                className="admin-danger"
                disabled={data.projects.length <= 1}
                onClick={() => {
                  setData((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== activeProject.id) }));
                  setActiveProjectId(data.projects.find((project) => project.id !== activeProject.id)?.id || "");
                }}
                type="button"
              >
                Remover projeto
              </button>
            </section>
          ) : null}
        </section>
      ) : null}

      {activeTab === "services" ? (
        <section className="admin-layout">
          <aside className="admin-list">
            <button
              type="button"
              onClick={() => {
                const service = createService(data.serviceCategories[0]?.id || "sites");
                setData((current) => ({ ...current, services: [...current.services, service] }));
                setActiveServiceId(service.id);
              }}
            >
              + Novo serviço
            </button>
            {data.services.map((service) => (
              <button
                className={activeService?.id === service.id ? "is-active" : ""}
                key={service.id}
                onClick={() => setActiveServiceId(service.id)}
                type="button"
              >
                {service.title}
              </button>
            ))}
          </aside>

          {activeService ? (
            <section className="admin-form">
              <div className="admin-form__grid">
                <label>
                  Serviço
                  <input value={activeService.title} onChange={(event) => updateService(activeService.id, { title: event.target.value })} />
                </label>
                <label>
                  ID
                  <input value={activeService.id} onChange={(event) => updateServiceId(activeService.id, event.target.value)} />
                </label>
                <label>
                  Categoria
                  <select value={activeService.category} onChange={(event) => updateService(activeService.id, { category: event.target.value })}>
                    {data.serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Valor
                  <input
                    min="0"
                    type="number"
                    value={activeService.price}
                    onChange={(event) => updateService(activeService.id, { price: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Cobrança
                  <select value={activeService.billing} onChange={(event) => updateService(activeService.id, { billing: event.target.value as BudgetService["billing"] })}>
                    <option value="once">Única</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </label>
                <label>
                  Unidade
                  <input
                    value={activeService.unitLabel || ""}
                    onChange={(event) => updateService(activeService.id, { unitLabel: event.target.value })}
                  />
                </label>
              </div>

              <div className="admin-switches">
                <label>
                  <input
                    checked={Boolean(activeService.startingAt)}
                    onChange={(event) => updateService(activeService.id, { startingAt: event.target.checked })}
                    type="checkbox"
                  />
                  A partir de
                </label>
                <label>
                  <input
                    checked={Boolean(activeService.allowQuantity)}
                    onChange={(event) => updateService(activeService.id, { allowQuantity: event.target.checked })}
                    type="checkbox"
                  />
                  Permitir quantidade
                </label>
              </div>

              <label>
                Resumo
                <textarea value={activeService.summary} onChange={(event) => updateService(activeService.id, { summary: event.target.value })} />
              </label>

              <label>
                O que inclui
                <textarea
                  value={arrayToLines(activeService.details)}
                  onChange={(event) => updateService(activeService.id, { details: linesToArray(event.target.value) })}
                />
              </label>

              <button
                className="admin-danger"
                disabled={data.services.length <= 1}
                onClick={() => {
                  setData((current) => ({ ...current, services: current.services.filter((service) => service.id !== activeService.id) }));
                  setActiveServiceId(data.services.find((service) => service.id !== activeService.id)?.id || "");
                }}
                type="button"
              >
                Remover serviço
              </button>
            </section>
          ) : null}
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="admin-form">
          <button
            className="admin-inline"
            onClick={() =>
              setData((current) => ({
                ...current,
                serviceCategories: [...current.serviceCategories, { id: makeId("categoria"), label: "Nova categoria" }],
              }))
            }
            type="button"
          >
            + Nova categoria
          </button>
          <div className="admin-rows">
            {data.serviceCategories.map((category, index) => (
              <div className="admin-row" key={`${category.id}-${index}`}>
                <input
                  value={category.id}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      serviceCategories: current.serviceCategories.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, id: event.target.value } : item
                      ),
                    }))
                  }
                />
                <input
                  value={category.label}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      serviceCategories: current.serviceCategories.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: event.target.value } : item
                      ),
                    }))
                  }
                />
                <button
                  className="admin-danger"
                  disabled={data.serviceCategories.length <= 1}
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      serviceCategories: current.serviceCategories.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  type="button"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "technologies" ? (
        <section className="admin-form">
          <label>
            Tecnologias cadastradas
            <textarea
              value={arrayToLines(data.technologies)}
              onChange={(event) => setData((current) => ({ ...current, technologies: linesToArray(event.target.value) }))}
            />
          </label>
        </section>
      ) : null}
    </main>
  );
}
