"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  siteData as defaultSiteData,
  type BudgetService,
  type Project,
  type ProjectVideo,
  type SiteData,
} from "../lib/site-data";

type AdminTab = "projects" | "services" | "categories" | "technologies";
type SaveStatus = "idle" | "loading" | "saving" | "uploading" | "saved" | "error";
type UploadKind = "main-image" | "gallery" | "video" | "video-poster";
type UploadPayload = {
  asset?: {
    src: string;
  };
  error?: string;
};

const cloneSiteData = () => structuredClone(defaultSiteData) as SiteData;

const linesToArray = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToLines = (items?: string[]) => (items || []).join("\n");

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
const maxImageUploadBytes = 8 * 1024 * 1024;
const maxVideoUploadBytes = 4 * 1024 * 1024;
const uploadTimeoutMs = 60000;

const formatFileSize = (bytes: number) => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toLocaleString("pt-BR", { maximumFractionDigits: mb >= 10 ? 0 : 1 })} MB`;
};

const getProjectVideos = (project?: Project | null): ProjectVideo[] => {
  if (!project) {
    return [];
  }

  if (project.videos?.length) {
    return project.videos;
  }

  return project.video?.src ? [project.video] : [];
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [data, setData] = useState<SiteData>(() => cloneSiteData());
  const [activeProjectId, setActiveProjectId] = useState(defaultSiteData.projects[0]?.id || "");
  const [activeServiceId, setActiveServiceId] = useState(defaultSiteData.services[0]?.id || "");
  const [uploadingKey, setUploadingKey] = useState("");
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});

  const activeProject = useMemo(
    () => data.projects.find((project) => project.id === activeProjectId) || data.projects[0],
    [activeProjectId, data.projects]
  );

  const activeService = useMemo(
    () => data.services.find((service) => service.id === activeServiceId) || data.services[0],
    [activeServiceId, data.services]
  );
  const activeProjectVideos = useMemo(() => getProjectVideos(activeProject), [activeProject]);

  const previewFor = (src?: string) => (src ? assetPreviews[src] || src : "");

  const rememberPreview = (src: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setAssetPreviews((current) => ({ ...current, [src]: previewUrl }));
  };

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

  const updateProjectVideos = (id: string, videos: ProjectVideo[]) => {
    updateProject(id, {
      video: videos[0],
      videos,
    });
  };

  const updateVideoItem = (index: number, update: Partial<ProjectVideo>) => {
    if (!activeProject) {
      return;
    }

    updateProjectVideos(
      activeProject.id,
      activeProjectVideos.map((video, videoIndex) => (videoIndex === index ? { ...video, ...update } : video))
    );
  };

  const removeVideoItem = (index: number) => {
    if (!activeProject) {
      return;
    }

    updateProjectVideos(
      activeProject.id,
      activeProjectVideos.filter((_, videoIndex) => videoIndex !== index)
    );
  };

  const updateGalleryItem = (index: number, update: Partial<Project["gallery"][number]>) => {
    if (!activeProject) {
      return;
    }

    updateProject(activeProject.id, {
      gallery: activeProject.gallery.map((image, imageIndex) => (imageIndex === index ? { ...image, ...update } : image)),
    });
  };

  const removeGalleryItem = (index: number) => {
    if (!activeProject) {
      return;
    }

    updateProject(activeProject.id, {
      gallery: activeProject.gallery.filter((_, imageIndex) => imageIndex !== index),
    });
  };

  const uploadFile = async (project: Project, file: File, kind: UploadKind, key: string) => {
    const isVideo = kind === "video";
    const maxSize = isVideo ? maxVideoUploadBytes : maxImageUploadBytes;

    if (file.size > maxSize) {
      setStatus("error");
      setMessage(
        isVideo
          ? `Esse video tem ${formatFileSize(file.size)}. Para upload direto na Vercel, envie um MP4 comprimido de ate ${formatFileSize(maxSize)}.`
          : `Essa imagem tem ${formatFileSize(file.size)}. Envie uma imagem de ate ${formatFileSize(maxSize)}.`
      );
      setUploadingKey("");
      return null;
    }

    setStatus("uploading");
    setMessage("Enviando arquivo. Aguarde alguns segundos.");
    setUploadingKey(key);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    formData.append("projectId", project.id);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), uploadTimeoutMs);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "x-admin-password": password,
        },
        body: formData,
        signal: controller.signal,
      });
      const responseText = await response.text();
      let payload: UploadPayload = {};

      try {
        payload = responseText ? (JSON.parse(responseText) as UploadPayload) : {};
      } catch {
        payload = {};
      }

      if (!response.ok || !payload.asset?.src) {
        throw new Error(payload.error || responseText || "Nao foi possivel enviar o arquivo.");
      }

      setStatus("saved");
      setMessage("Arquivo enviado. A previa aparece aqui; clique em Salvar alteracoes para publicar no site.");
      return payload.asset.src;
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "O upload demorou demais e foi cancelado. Tente um arquivo menor."
          : error instanceof Error
            ? error.message
            : "Nao foi possivel enviar o arquivo."
      );
      return null;
    } finally {
      window.clearTimeout(timeout);
      setUploadingKey("");
    }
  };

  const uploadMainImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const src = await uploadFile(activeProject, file, "main-image", "main-image");

    if (src) {
      rememberPreview(src, file);
      updateProject(activeProject.id, {
        mainImage: {
          src,
          alt: activeProject.mainImage.alt || `${activeProject.title} - imagem principal`,
        },
      });
    }

    event.target.value = "";
  };

  const uploadVideo = async (event: ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const isReplacing = typeof index === "number";
    const src = await uploadFile(activeProject, file, "video", isReplacing ? `video-${index}` : "video-new");

    if (src) {
      rememberPreview(src, file);
      const nextVideo: ProjectVideo = {
        src,
        poster: activeProject.mainImage.src,
        label: `Video demo ${isReplacing ? index + 1 : activeProjectVideos.length + 1} de ${activeProject.title}`,
      };

      updateProjectVideos(
        activeProject.id,
        isReplacing
          ? activeProjectVideos.map((video, videoIndex) =>
              videoIndex === index ? { ...video, src, label: video.label || nextVideo.label, poster: video.poster || nextVideo.poster } : video
            )
          : [...activeProjectVideos, nextVideo]
      );
    }

    event.target.value = "";
  };

  const uploadVideoPoster = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const src = await uploadFile(activeProject, file, "video-poster", `video-poster-${index}`);

    if (src) {
      rememberPreview(src, file);
      updateVideoItem(index, { poster: src });
    }

    event.target.value = "";
  };

  const uploadGalleryImage = async (event: ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const isReplacing = typeof index === "number";
    const src = await uploadFile(activeProject, file, "gallery", isReplacing ? `gallery-${index}` : "gallery-new");

    if (src) {
      rememberPreview(src, file);
      if (isReplacing) {
        updateProject(activeProject.id, {
          gallery: activeProject.gallery.map((image, imageIndex) => (imageIndex === index ? { ...image, src } : image)),
        });
      } else {
        updateProject(activeProject.id, {
          gallery: [
            ...activeProject.gallery,
            {
              src,
              alt: `${activeProject.title} - print do projeto`,
              label: `Print ${activeProject.gallery.length + 1}`,
            },
          ],
        });
      }
    }

    event.target.value = "";
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
        <section className="admin-login" aria-labelledby="admin-login-title">
          <div className="admin-login__mark" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <defs>
                <linearGradient id="admin-gold-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd56b" />
                  <stop offset="50%" stopColor="#c7a447" />
                  <stop offset="100%" stopColor="#9f741f" />
                </linearGradient>
                <linearGradient id="admin-gold-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff0ca" />
                  <stop offset="100%" stopColor="#765310" />
                </linearGradient>
                <filter id="admin-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="url(#admin-gold-primary)" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />
              <circle cx="50" cy="50" r="40" stroke="url(#admin-gold-primary)" strokeWidth="1.5" opacity="0.15" />
              <path d="M25 25 L46 72 H52 L31 25 Z" fill="url(#admin-gold-primary)" />
              <path d="M75 25 L54 72 H48 L69 25 Z" fill="url(#admin-gold-secondary)" />
              <circle cx="50" cy="72" r="3" fill="#ffd56b" filter="url(#admin-logo-glow)" />
            </svg>
          </div>
          <p className="eyebrow">Acesso privado</p>
          <h1 id="admin-login-title">Painel do portfólio</h1>
          <p className="admin-login__lead">Gerencie seus projetos, preços, categorias e tecnologias em um só lugar.</p>

          <form
            className="admin-login__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (password && status !== "loading") {
                loadData();
              }
            }}
          >
            <label htmlFor="admin-password">Senha do admin</label>
            <div className="admin-password">
              <input
                autoComplete="current-password"
                id="admin-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage("");
                }}
                placeholder="Digite a senha"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)} type="button">
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <button className="button button--primary" disabled={!password || status === "loading"} type="submit">
              {status === "loading" ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>

          {message ? <p className="admin-status admin-status--error">{message}</p> : null}
          <a className="admin-login__back" href="/">
            Voltar para o site
          </a>
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
          <button className="button button--primary" disabled={status === "saving" || status === "uploading"} onClick={saveData} type="button">
            {status === "saving" ? "Salvando..." : status === "uploading" ? "Enviando arquivo..." : "Salvar alterações"}
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

              <section className="admin-project-section">
                <div className="admin-section-heading">
                  <div>
                    <p className="eyebrow">Midia</p>
                    <h2>Imagem principal e video</h2>
                  </div>
                  <p>Escolha os arquivos do computador. O painel preenche o caminho automaticamente.</p>
                </div>

                <div className="admin-media-grid">
                  <article className="admin-media-card">
                    <div className="admin-media-preview">
                      {activeProject.mainImage.src ? (
                        <img src={previewFor(activeProject.mainImage.src)} alt={activeProject.mainImage.alt || activeProject.title} />
                      ) : (
                        <span>Sem imagem principal</span>
                      )}
                    </div>
                    <label className="admin-upload-button">
                      {uploadingKey === "main-image" ? "Enviando..." : "Enviar imagem principal"}
                      <input accept="image/*" disabled={status === "uploading"} onChange={uploadMainImage} type="file" />
                    </label>
                    <label>
                      Texto alternativo
                      <input
                        value={activeProject.mainImage.alt}
                        onChange={(event) =>
                          updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, alt: event.target.value } })
                        }
                        placeholder="Descreva a imagem para acessibilidade"
                      />
                    </label>
                    <details className="admin-path">
                      <summary>Editar caminho manualmente</summary>
                      <input
                        value={activeProject.mainImage.src}
                        onChange={(event) =>
                          updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, src: event.target.value } })
                        }
                        placeholder="/projects/meu-projeto/imagem.png"
                      />
                    </details>
                  </article>

                  <article className="admin-media-card admin-video-manager">
                    <div className="admin-video-heading">
                      <div>
                        <strong>Videos demo</strong>
                        <span>Use videos curtos e comprimidos, ate {formatFileSize(maxVideoUploadBytes)} cada.</span>
                      </div>
                      <label className="admin-upload-button">
                        {uploadingKey === "video-new" ? "Enviando..." : "+ Adicionar video"}
                        <input
                          accept="video/mp4,video/webm,video/quicktime"
                          disabled={status === "uploading"}
                          onChange={(event) => uploadVideo(event)}
                          type="file"
                        />
                      </label>
                    </div>

                    {activeProjectVideos.length ? (
                      <div className="admin-video-list">
                        {activeProjectVideos.map((video, index) => (
                          <section className="admin-video-item" key={`${video.src}-${index}`}>
                            <div className="admin-media-preview admin-media-preview--video">
                              <video controls preload="metadata" poster={previewFor(video.poster || activeProject.mainImage.src)}>
                                <source src={previewFor(video.src)} />
                              </video>
                            </div>
                            <div className="admin-media-actions">
                              <label className="admin-upload-button admin-upload-button--ghost">
                                {uploadingKey === `video-${index}` ? "Enviando..." : "Trocar video"}
                                <input
                                  accept="video/mp4,video/webm,video/quicktime"
                                  disabled={status === "uploading"}
                                  onChange={(event) => uploadVideo(event, index)}
                                  type="file"
                                />
                              </label>
                              <label className="admin-upload-button admin-upload-button--ghost">
                                {uploadingKey === `video-poster-${index}` ? "Enviando..." : "Capa do video"}
                                <input
                                  accept="image/*"
                                  disabled={status === "uploading"}
                                  onChange={(event) => uploadVideoPoster(event, index)}
                                  type="file"
                                />
                              </label>
                            </div>
                            <label>
                              Titulo do video
                              <input
                                value={video.label || ""}
                                onChange={(event) => updateVideoItem(index, { label: event.target.value })}
                                placeholder={`Video demo ${index + 1} de ${activeProject.title}`}
                              />
                            </label>
                            <details className="admin-path">
                              <summary>Editar caminhos manualmente</summary>
                              <input
                                value={video.src}
                                onChange={(event) => updateVideoItem(index, { src: event.target.value })}
                                placeholder="/projects/meu-projeto/demo.mp4"
                              />
                              <input
                                value={video.poster || ""}
                                onChange={(event) => updateVideoItem(index, { poster: event.target.value })}
                                placeholder="/projects/meu-projeto/capa.png"
                              />
                            </details>
                            <button className="admin-danger" onClick={() => removeVideoItem(index)} type="button">
                              Remover video
                            </button>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-empty">
                        <p>Nenhum video cadastrado ainda.</p>
                        <label className="admin-upload-button">
                          Enviar primeiro video
                          <input
                            accept="video/mp4,video/webm,video/quicktime"
                            disabled={status === "uploading"}
                            onChange={(event) => uploadVideo(event)}
                            type="file"
                          />
                        </label>
                      </div>
                    )}
                  </article>
                </div>
              </section>

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

              <section className="admin-project-section">
                <div className="admin-section-heading">
                  <div>
                    <p className="eyebrow">Galeria</p>
                    <h2>Prints do projeto</h2>
                  </div>
                  <label className="admin-upload-button">
                    {uploadingKey === "gallery-new" ? "Enviando..." : "+ Adicionar print"}
                    <input accept="image/*" disabled={status === "uploading"} onChange={(event) => uploadGalleryImage(event)} type="file" />
                  </label>
                </div>

                {activeProject.gallery.length ? (
                  <div className="admin-gallery-editor">
                    {activeProject.gallery.map((image, index) => (
                      <article className="admin-gallery-item" key={`${image.src}-${index}`}>
                        <div className="admin-gallery-thumb">
                          {image.src ? <img src={previewFor(image.src)} alt={image.alt || image.label || activeProject.title} /> : <span>Sem imagem</span>}
                        </div>
                        <label className="admin-upload-button admin-upload-button--ghost">
                          {uploadingKey === `gallery-${index}` ? "Enviando..." : "Trocar imagem"}
                          <input accept="image/*" disabled={status === "uploading"} onChange={(event) => uploadGalleryImage(event, index)} type="file" />
                        </label>
                        <label>
                          Legenda
                          <input value={image.label || ""} onChange={(event) => updateGalleryItem(index, { label: event.target.value })} />
                        </label>
                        <label>
                          Texto alternativo
                          <input value={image.alt || ""} onChange={(event) => updateGalleryItem(index, { alt: event.target.value })} />
                        </label>
                        <details className="admin-path">
                          <summary>Editar caminho manualmente</summary>
                          <input value={image.src} onChange={(event) => updateGalleryItem(index, { src: event.target.value })} />
                        </details>
                        <button className="admin-danger" onClick={() => removeGalleryItem(index)} type="button">
                          Remover print
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">
                    <p>Nenhum print cadastrado ainda.</p>
                    <label className="admin-upload-button">
                      Enviar primeiro print
                      <input accept="image/*" disabled={status === "uploading"} onChange={(event) => uploadGalleryImage(event)} type="file" />
                    </label>
                  </div>
                )}
              </section>

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
