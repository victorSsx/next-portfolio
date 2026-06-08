"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { siteData, localizeContent, type Project, type ProjectImage } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const projects = siteData.projects;

// ── Animated counter stat ────────────────────────────────────────────────────

function CounterStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let startTs: number | null = null;
        const duration = 1500;
        const tick = (ts: number) => {
          if (!startTs) startTs = ts;
          const progress = Math.min((ts - startTs) / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="projects-stat">
      <span className="projects-stat__num">
        {count}
        <span className="projects-stat__suffix">{suffix}</span>
      </span>
      <span className="projects-stat__label">{label}</span>
    </div>
  );
}

// ── Word-by-word reveal heading ───────────────────────────────────────────────

function WordRevealTitle({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <h2
      ref={ref}
      className={`projects-heading${revealed ? " is-revealed" : ""}`}
      aria-label={text}
    >
      {text.split(" ").map((word, i) => (
        <span key={i} className="word-clip" aria-hidden="true">
          <span className="word" style={{ "--word-i": i } as React.CSSProperties}>
            {word}
          </span>
        </span>
      ))}
    </h2>
  );
}

type DeviceTab = "desktop" | "tablet" | "mobile";

function getProjectVideos(project: Project) {
  return project.videos?.length ? project.videos : project.video?.src ? [project.video] : [];
}

function getAvailableTabs(project: Project): DeviceTab[] {
  const tabs: DeviceTab[] = ["desktop"];
  if (project.deviceViews?.some((dv) => dv.device === "tablet" && dv.images.length > 0)) tabs.push("tablet");
  if (project.deviceViews?.some((dv) => dv.device === "mobile" && dv.images.length > 0)) tabs.push("mobile");
  return tabs;
}

function getGalleryImages(project: Project, tab: DeviceTab): ProjectImage[] {
  if (tab === "desktop") return project.gallery;
  return project.deviceViews?.find((dv) => dv.device === tab)?.images ?? [];
}

function getDeviceVideos(project: Project, tab: DeviceTab) {
  if (tab === "desktop") return [];
  return project.deviceViews?.find((dv) => dv.device === tab)?.videos ?? [];
}

type ProjectsSectionProps = {
  limit?: number;
  showAllLink?: boolean;
  showFilter?: boolean;
  carousel?: boolean;
};

export function ProjectsSection({ limit, showAllLink, showFilter, carousel }: ProjectsSectionProps = {}) {
  const { t, lang } = useLanguage();
  // Newest first, so recently added projects surface automatically (localized to the UI language)
  const orderedProjects = useMemo(() => [...projects].reverse().map((p) => localizeContent(p, lang)), [lang]);

  // Unique filter tags across all projects (stable order by first appearance)
  const allTags = useMemo(() => {
    const tags: string[] = [];
    projects.forEach((p) => (p.tags ?? []).forEach((tag) => {
      if (tag && !tags.includes(tag)) tags.push(tag);
    }));
    return tags;
  }, []);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredProjects = useMemo(
    () => (activeTag ? orderedProjects.filter((p) => p.tags?.includes(activeTag)) : orderedProjects),
    [orderedProjects, activeTag]
  );

  // Limit only applies on the unfiltered (recent) view
  const displayedProjects = useMemo(
    () => (typeof limit === "number" && !activeTag ? filteredProjects.slice(0, limit) : filteredProjects),
    [filteredProjects, limit, activeTag]
  );

  // Nunca mostra o link "ver todos" (vai para /projetos, que tem contato) no modo vitrine/carrossel.
  const hasMore = !carousel && Boolean(showAllLink) && !activeTag && projects.length > (limit ?? projects.length);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("desktop");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Carrossel (modo vitrine): rolagem horizontal com auto-avanço.
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const scrollCarousel = (dir: 1 | -1) => {
    const vp = carouselRef.current;
    if (!vp) return;
    const card = vp.querySelector<HTMLElement>(".project-card");
    const step = card ? card.offsetWidth + 18 : vp.clientWidth * 0.8;
    const atEnd = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
    const atStart = vp.scrollLeft <= 4;
    if (dir === 1 && atEnd) vp.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) vp.scrollTo({ left: vp.scrollWidth, behavior: "smooth" });
    else vp.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  useEffect(() => {
    if (!carousel || carouselPaused) return;
    const id = window.setInterval(() => scrollCarousel(1), 4500);
    return () => window.clearInterval(id);
  }, [carousel, carouselPaused]);

  const activeProjectVideos = useMemo(
    () => (activeProject ? getProjectVideos(activeProject) : []),
    [activeProject]
  );

  const availableTabs = useMemo(
    () => (activeProject ? getAvailableTabs(activeProject) : (["desktop"] as DeviceTab[])),
    [activeProject]
  );

  const galleryImages = useMemo(
    () => (activeProject ? getGalleryImages(activeProject, deviceTab) : []),
    [activeProject, deviceTab]
  );

  const deviceVideos = useMemo(
    () => (activeProject ? getDeviceVideos(activeProject, deviceTab) : []),
    [activeProject, deviceTab]
  );

  const openProject = (project: Project) => {
    setActiveProject(project);
    setDeviceTab("desktop");
    setLightboxIdx(null);
  };

  const tabLabel = (tab: DeviceTab) => {
    if (tab === "tablet") return t.projects.modal.tablet;
    if (tab === "mobile") return t.projects.modal.mobile;
    return t.projects.modal.desktop;
  };

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i !== null ? Math.min(i + 1, galleryImages.length - 1) : i));
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : i));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, galleryImages.length]);

  useEffect(() => {
    setLightboxIdx(null);
  }, [deviceTab]);

  const renderCard = (project: Project, i: number) => (
    <article
      className="project-card"
      key={project.title}
      data-animate={carousel ? undefined : true}
      style={{ "--animate-delay": `${i * 100}ms` } as React.CSSProperties}
    >
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
      <div className="project-card__actions">
        <button className="project-card__button" onClick={() => openProject(project)} type="button">
          {t.projects.viewDetails} <span aria-hidden="true">→</span>
        </button>
        {project.link && (
          <a className="project-card__live" href={project.link} target="_blank" rel="noopener noreferrer">
            {t.projects.viewLive} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );

  return (
    <>
      <section className="section projects" id="projetos">
        <div className="section__intro projects__intro">
          <p className="eyebrow" data-animate>{t.projects.eyebrow}</p>
          <WordRevealTitle text={t.projects.title} />
          {!carousel && (
          <div className="projects-stats" data-animate>
            {t.projects.stats.map((stat, i) => {
              const override = siteData.projectStats?.[i];
              return (
                <CounterStat
                  key={i}
                  value={override?.value ?? stat.value}
                  suffix={override?.suffix ?? stat.suffix}
                  label={stat.label}
                />
              );
            })}
          </div>
          )}
        </div>

        {showFilter && allTags.length > 1 && (
          <div className="projects-filter" role="group" aria-label="Filtrar projetos por tipo" data-animate>
            <button
              type="button"
              className={`projects-filter__chip${activeTag === null ? " is-active" : ""}`}
              aria-pressed={activeTag === null}
              onClick={() => setActiveTag(null)}
            >
              {t.projects.filterAll}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`projects-filter__chip${activeTag === tag ? " is-active" : ""}`}
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {carousel ? (
          <div
            className="projects-carousel"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            data-animate
          >
            <button
              className="projects-carousel__arrow"
              type="button"
              aria-label="Anterior"
              onClick={() => scrollCarousel(-1)}
            >
              ←
            </button>
            <div className="projects-carousel__viewport" ref={carouselRef}>
              {displayedProjects.map(renderCard)}
            </div>
            <button
              className="projects-carousel__arrow"
              type="button"
              aria-label="Próximo"
              onClick={() => scrollCarousel(1)}
            >
              →
            </button>
          </div>
        ) : (
          <div className="project-grid">{displayedProjects.map(renderCard)}</div>
        )}

        {hasMore && (
          <div className="projects-viewall" data-animate>
            <a className="button button--ghost" href="/projetos">
              {t.projects.viewAll} <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </section>

      {activeProject ? (
        <div
          aria-modal="true"
          className="project-modal"
          role="dialog"
          aria-labelledby="project-modal-title"
        >
          <button
            aria-label={t.projects.modal.closeDetails}
            className="project-modal__backdrop"
            onClick={() => setActiveProject(null)}
            type="button"
          />
          <article className="project-modal__panel">
            <button
              className="project-modal__close"
              onClick={() => setActiveProject(null)}
              type="button"
              aria-label={t.projects.modal.close}
            >
              ×
            </button>

            {activeProjectVideos.length ? (
              <div
                className="project-modal__videos"
                aria-label={t.projects.modal.videosLabel}
              >
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
              <div className="project-modal__meta">
                <div className="project-modal__status">{activeProject.status}</div>
                {activeProject.link && (
                  <a
                    className="project-modal__live-btn"
                    href={activeProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver projeto ao vivo <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>

            <div className="project-modal__details">
              <section>
                <h3>{t.projects.modal.workDone}</h3>
                <ul className="project-modal__work">
                  {activeProject.workDone.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3>{t.projects.modal.technologies}</h3>
                <ul className="project-modal__tags">
                  {activeProject.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="project-modal__gallery" aria-label={t.projects.modal.galleryLabel}>
              {availableTabs.length > 1 && (
                <div className="modal-device-tabs" role="tablist" aria-label="Dispositivo">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      className={`modal-device-tab${deviceTab === tab ? " is-active" : ""}`}
                      onClick={() => setDeviceTab(tab)}
                      type="button"
                      role="tab"
                      aria-selected={deviceTab === tab}
                    >
                      {tabLabel(tab)}
                    </button>
                  ))}
                </div>
              )}

              {galleryImages.length > 0 ? (
                <div className="gallery-grid">
                  {galleryImages.map((image, idx) => (
                    <figure
                      key={`${image.src}-${idx}`}
                      className="gallery-grid__item"
                      onClick={() => setLightboxIdx(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setLightboxIdx(idx)}
                      aria-label={image.alt || image.label}
                    >
                      <img src={image.src} alt={image.alt} loading="lazy" />
                      {image.label && <figcaption>{image.label}</figcaption>}
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="modal-gallery-empty">{t.projects.modal.emptyGallery}</p>
              )}

              {deviceVideos.length > 0 && (
                <div className="project-modal__device-videos">
                  {deviceVideos.map((video, index) => (
                    <figure key={`${video.src}-${index}`}>
                      <video controls preload="metadata" poster={video.poster}>
                        <source src={video.src} />
                      </video>
                      <figcaption>{video.label}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          </article>
        </div>
      ) : null}

      {lightboxIdx !== null && activeProject && galleryImages[lightboxIdx] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
          <button className="lightbox__backdrop" onClick={() => setLightboxIdx(null)} type="button" aria-label="Fechar" />
          <div className="lightbox__inner">
            <button className="lightbox__close" onClick={() => setLightboxIdx(null)} type="button" aria-label="Fechar">
              ×
            </button>
            <img
              className="lightbox__img"
              src={galleryImages[lightboxIdx].src}
              alt={galleryImages[lightboxIdx].alt}
            />
            {galleryImages[lightboxIdx].label && (
              <p className="lightbox__caption">{galleryImages[lightboxIdx].label}</p>
            )}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="lightbox__nav lightbox__nav--prev"
                  type="button"
                  onClick={() => setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : i))}
                  disabled={lightboxIdx === 0}
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  className="lightbox__nav lightbox__nav--next"
                  type="button"
                  onClick={() => setLightboxIdx((i) => (i !== null ? Math.min(i + 1, galleryImages.length - 1) : i))}
                  disabled={lightboxIdx === galleryImages.length - 1}
                  aria-label="Próximo"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
