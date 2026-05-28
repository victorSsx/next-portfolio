"use client";

import { useMemo, useState } from "react";
import { siteData, type Project } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";
import { ImageCarousel, type CarouselItem } from "./ImageCarousel";

const projects = siteData.projects;

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

function getGalleryItems(project: Project, tab: DeviceTab): CarouselItem[] {
  if (tab === "desktop") return project.gallery;
  return project.deviceViews?.find((dv) => dv.device === tab)?.images ?? [];
}

function getDeviceVideos(project: Project, tab: DeviceTab) {
  if (tab === "desktop") return [];
  return project.deviceViews?.find((dv) => dv.device === tab)?.videos ?? [];
}

export function ProjectsSection() {
  const { t } = useLanguage();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("desktop");

  const activeProjectVideos = useMemo(
    () => (activeProject ? getProjectVideos(activeProject) : []),
    [activeProject]
  );

  const availableTabs = useMemo(
    () => (activeProject ? getAvailableTabs(activeProject) : (["desktop"] as DeviceTab[])),
    [activeProject]
  );

  const galleryItems = useMemo(
    () => (activeProject ? getGalleryItems(activeProject, deviceTab) : []),
    [activeProject, deviceTab]
  );

  const deviceVideos = useMemo(
    () => (activeProject ? getDeviceVideos(activeProject, deviceTab) : []),
    [activeProject, deviceTab]
  );

  const openProject = (project: Project) => {
    setActiveProject(project);
    setDeviceTab("desktop");
  };

  const tabLabel = (tab: DeviceTab) => {
    if (tab === "tablet") return t.projects.modal.tablet;
    if (tab === "mobile") return t.projects.modal.mobile;
    return t.projects.modal.desktop;
  };

  return (
    <>
      <section className="section projects" id="projetos">
        <div className="section__intro" data-animate>
          <p className="eyebrow">{t.projects.eyebrow}</p>
          <h2>{t.projects.title}</h2>
          <p>{t.projects.lead}</p>
        </div>

        <div className="project-grid">
          {projects.map((project, i) => (
            <article
              className="project-card"
              key={project.title}
              data-animate
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
              <button className="project-card__button" onClick={() => openProject(project)} type="button">
                {t.projects.viewDetails} <span aria-hidden="true">-&gt;</span>
              </button>
            </article>
          ))}
        </div>
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
              <div className="project-modal__status">{activeProject.status}</div>
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

              {galleryItems.length > 0 ? (
                <ImageCarousel
                  items={galleryItems}
                  prevLabel={t.projects.modal.close === "Fechar" ? "Anterior" : t.projects.modal.close === "Cerrar" ? "Anterior" : "Previous"}
                  nextLabel={t.projects.modal.close === "Fechar" ? "Próximo" : t.projects.modal.close === "Cerrar" ? "Siguiente" : "Next"}
                />
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
    </>
  );
}
