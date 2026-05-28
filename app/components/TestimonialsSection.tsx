"use client";

import { siteData } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";

const testimonials = siteData.testimonials ?? [];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="testimonial-stars" aria-label={`${rating} estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "star--filled" : "star--empty"} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useLanguage();

  if (!testimonials.length) return null;

  return (
    <section className="section testimonials" id="depoimentos">
      <div className="section__intro" data-animate>
        <p className="eyebrow">{t.testimonials.eyebrow}</p>
        <h2>{t.testimonials.title}</h2>
        <p>{t.testimonials.lead}</p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((item, i) => (
          <article
            className="testimonial-card"
            key={item.id}
            data-animate
            style={{ "--animate-delay": `${i * 100}ms` } as React.CSSProperties}
          >
            <StarRating rating={item.rating} />
            <blockquote className="testimonial-card__text">
              <p>"{item.text}"</p>
            </blockquote>
            <footer className="testimonial-card__author">
              <div className="testimonial-card__avatar" aria-hidden="true">
                {item.name.charAt(0)}
              </div>
              <div>
                <strong>{item.name}</strong>
                <span>{item.role} · {item.company}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
