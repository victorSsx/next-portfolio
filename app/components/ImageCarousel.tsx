"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselItem = {
  src: string;
  alt: string;
  label?: string;
};

type Props = {
  items: CarouselItem[];
  autoPlayInterval?: number;
  prevLabel?: string;
  nextLabel?: string;
};

export function ImageCarousel({ items, autoPlayInterval = 3600, prevLabel = "Anterior", nextLabel = "Próximo" }: Props) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => setCurrent(((index % items.length) + items.length) % items.length),
    [items.length]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (items.length <= 1 || isHovered) return;
    timerRef.current = setTimeout(goNext, autoPlayInterval);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [current, isHovered, items.length, goNext, autoPlayInterval]);

  // reset to first slide when items change (e.g. switching device tabs)
  useEffect(() => {
    setCurrent(0);
  }, [items]);

  if (!items.length) return null;

  if (items.length === 1) {
    return (
      <figure className="carousel carousel--single">
        <img src={items[0].src} alt={items[0].alt} loading="lazy" />
        {items[0].label && <figcaption>{items[0].label}</figcaption>}
      </figure>
    );
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="carousel__track"
        style={{ "--carousel-current": current } as React.CSSProperties}
      >
        {items.map((item, index) => (
          <figure
            className={`carousel__slide${index === current ? " is-active" : ""}`}
            key={`${item.src}-${index}`}
            aria-hidden={index !== current}
          >
            <img src={item.src} alt={item.alt} loading="lazy" />
            {item.label && <figcaption>{item.label}</figcaption>}
          </figure>
        ))}
      </div>

      <button
        className="carousel__arrow carousel__arrow--prev"
        onClick={goPrev}
        type="button"
        aria-label={prevLabel}
      >
        ←
      </button>
      <button
        className="carousel__arrow carousel__arrow--next"
        onClick={goNext}
        type="button"
        aria-label={nextLabel}
      >
        →
      </button>

      <div className="carousel__dots" role="tablist" aria-label="Slides">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel__dot${index === current ? " is-active" : ""}`}
            onClick={() => goTo(index)}
            type="button"
            role="tab"
            aria-selected={index === current}
            aria-label={`Slide ${index + 1} de ${items.length}`}
          />
        ))}
      </div>
    </div>
  );
}
