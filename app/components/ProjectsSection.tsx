"use client";

import { useMemo, useState } from "react";
import { siteData, type Project } from "../lib/site-data";

const projects = siteData.projects;

function getProjectVideos(project: Project) {
  return project.videos?.length ? project.videos : project.video?.src ? [project.video] : [];
}

export function ProjectsSection() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const activeProjectVideos = useMemo(
    () => (activeProject ? getProjectVideos(activeProject) : []),
    [activeProject]
  );

  return (
    <>
      <section className="section projects" id="projetos">
        <div className="section__intro" data-animate>
          <p className="eyebrow">Portfólio em vídeo</p>
          <h2>Projetos prontos para apresentar, vender e validar ideias.</h2>
          <p>Demos visuais para clientes entenderem a experiência antes mesmo de abrir o código.</p>
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
            <button
              className="project-modal__close"
              onClick={() => setActiveProject(null)}
              type="button"
              aria-label="Fechar"
            >
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
    </>
  );
}
