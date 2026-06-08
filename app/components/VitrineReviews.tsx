"use client";

import { siteData, type Testimonial } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const testimonials = (siteData.testimonials ?? []) as Testimonial[];
const WORKANA_REVIEWS = 2;

const flagUrl = (code?: string) =>
  code && /^[a-zA-Z]{2}$/.test(code) ? `https://flagcdn.com/${code.toLowerCase()}.svg` : null;

// Avaliações + depoimentos para a vitrine (sem formulário — prova social pura).
export function VitrineReviews() {
  const { t } = useLanguage();

  return (
    <section className="vreviews">
      <div className="vreviews__intro" data-animate>
        <p className="eyebrow">{t.testimonials.eyebrow}</p>
        <h2>{t.testimonials.title}</h2>
        <p>{t.testimonials.lead}</p>
      </div>

      <div className="vreviews__badge" data-animate>
        <div className="workana-badge workana-badge--static">
          <span className="workana-badge__score">5,0</span>
          <span className="workana-badge__main">
            <span className="workana-badge__stars" aria-hidden="true">★★★★★</span>
            <span className="workana-badge__label">{t.testimonials.workana.label}</span>
            <span className="workana-badge__reviews">
              {WORKANA_REVIEWS} {t.testimonials.workana.reviewsSuffix}
            </span>
          </span>
        </div>
      </div>

      {testimonials.length > 0 ? (
        <div className="vreviews__grid" data-animate>
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.id}>
              <div className="testimonial-stars" aria-label={`${item.rating} estrelas`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < item.rating ? "star--filled" : "star--empty"} aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="testimonial-card__text">
                <p>&quot;{item.text}&quot;</p>
              </blockquote>
              <footer className="testimonial-card__author">
                <div className="testimonial-card__avatar" aria-hidden="true">
                  {item.photo ? <img src={item.photo} alt="" /> : item.name.charAt(0)}
                </div>
                <div>
                  <strong className="testimonial-card__name">
                    {item.name}
                    {flagUrl(item.country) ? (
                      <img
                        className="testimonial-flag"
                        src={flagUrl(item.country) as string}
                        alt={item.country}
                        title={item.country}
                      />
                    ) : null}
                  </strong>
                  <span>
                    {item.role}
                    {item.role && item.company ? " · " : ""}
                    {item.company}
                  </span>
                </div>
              </footer>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
