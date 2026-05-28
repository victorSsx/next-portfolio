"use client";

import { useEffect, useRef, useState } from "react";
import { siteData } from "../lib/site-data";
import { useLanguage } from "../lib/LanguageContext";
import type { Testimonial } from "../lib/site-data";

const approvedTestimonials = (siteData.testimonials ?? []) as Testimonial[];

// ── Star rating display ──────────────────────────────────────────────────────

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

// ── Interactive star picker ──────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-picker" role="group" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className={`star-picker__btn${(hovered || value) >= n ? " is-on" : ""}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Photo compression ────────────────────────────────────────────────────────

const compressToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const SIZE = 96;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = objectUrl;
  });

// ── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  role: string;
  company: string;
  photo: string;
  rating: number;
  text: string;
};

const BLANK: FormState = { name: "", role: "", company: "", photo: "", rating: 5, text: "" };
type SubmitState = "idle" | "sending" | "ok" | "err";

// ── Section ──────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  const { t } = useLanguage();
  const f = t.testimonials.form;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(BLANK);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Escape key + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setForm(BLANK);
    setSubmitState("idle");
    setErrMsg("");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const b64 = await compressToBase64(file);
      setForm((prev) => ({ ...prev, photo: b64 }));
    } catch {
      // Photo is optional — skip silently
    }
  };

  const handleSend = async () => {
    if (!form.text.trim()) return;
    setSubmitState("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          company: form.company.trim(),
          text: form.text.trim(),
          rating: form.rating,
          ...(form.photo ? { photo: form.photo } : {}),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar.");
      setSubmitState("ok");
    } catch (err) {
      setSubmitState("err");
      setErrMsg(err instanceof Error ? err.message : "Algo deu errado.");
    }
  };

  return (
    <>
      <section className="section testimonials" id="depoimentos">
        <div className="section__intro" data-animate>
          <p className="eyebrow">{t.testimonials.eyebrow}</p>
          <h2>{t.testimonials.title}</h2>
          <p>{t.testimonials.lead}</p>
        </div>

        {approvedTestimonials.length > 0 && (
          <div className="testimonials-grid">
            {approvedTestimonials.map((item, i) => (
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
                    {item.photo ? <img src={item.photo} alt="" /> : item.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
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
        )}

        <div className="testimonials-cta" data-animate>
          <button className="button button--outline" type="button" onClick={() => setOpen(true)}>
            {f.submitBtn}
          </button>
        </div>
      </section>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="tform-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tform-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="tform">
            <button className="tform__close" type="button" aria-label="Fechar" onClick={handleClose}>
              ✕
            </button>

            {submitState === "ok" ? (
              /* ── Success screen ── */
              <div className="tform__success">
                <span className="tform__success-icon" aria-hidden="true">✓</span>
                <h3>{f.successTitle}</h3>
                <p>{f.successText}</p>
                <button className="button button--primary" type="button" onClick={handleClose}>
                  {f.closeBtn}
                </button>
              </div>
            ) : (
              <>
                {/* Progress indicator */}
                <div className="tform__progress" aria-hidden="true">
                  <span className={`tform__dot${step >= 1 ? " is-on" : ""}`} />
                  <span className={`tform__dot${step >= 2 ? " is-on" : ""}`} />
                </div>

                {step === 1 ? (
                  /* ── Step 1: identification ── */
                  <div className="tform__step">
                    <h3 id="tform-title" className="tform__title">{f.step1Title}</h3>
                    <p className="tform__sub">{f.step1Subtitle}</p>

                    <div className="tform__avatar-wrap">
                      <button
                        className="tform__avatar-btn"
                        type="button"
                        aria-label={f.photoLabel}
                        onClick={() => fileRef.current?.click()}
                      >
                        {form.photo ? (
                          <img src={form.photo} alt="Preview" className="tform__avatar-img" />
                        ) : (
                          <span className="tform__avatar-placeholder" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                              <path
                                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        )}
                        <span className="tform__avatar-overlay" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 16V8m-4 4 4-4 4 4"
                              stroke="white"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                      <span className="tform__avatar-hint">{f.photoHint}</span>
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="tform__file-input"
                      onChange={handlePhotoChange}
                    />

                    <label className="tform__label">
                      {f.nameLabel} <span className="tform__required">*</span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={f.namePlaceholder}
                        autoComplete="name"
                      />
                    </label>

                    <div className="tform__row">
                      <label className="tform__label">
                        {f.roleLabel}
                        <input
                          type="text"
                          value={form.role}
                          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                          placeholder={f.rolePlaceholder}
                          autoComplete="organization-title"
                        />
                      </label>
                      <label className="tform__label">
                        {f.companyLabel}
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                          placeholder={f.companyPlaceholder}
                          autoComplete="organization"
                        />
                      </label>
                    </div>

                    <button
                      className="button button--primary tform__next-btn"
                      type="button"
                      disabled={!form.name.trim()}
                      onClick={() => setStep(2)}
                    >
                      {f.nextBtn}
                    </button>
                  </div>
                ) : (
                  /* ── Step 2: testimonial ── */
                  <div className="tform__step">
                    <h3 id="tform-title" className="tform__title">{f.step2Title}</h3>
                    <p className="tform__sub">{f.step2Subtitle}</p>

                    <div className="tform__rating">
                      <span className="tform__rating-label">{f.ratingLabel}</span>
                      <StarPicker
                        value={form.rating}
                        onChange={(v) => setForm((prev) => ({ ...prev, rating: v }))}
                      />
                    </div>

                    <label className="tform__label">
                      {f.textLabel} <span className="tform__required">*</span>
                      <textarea
                        value={form.text}
                        onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder={f.textPlaceholder}
                        rows={5}
                      />
                    </label>

                    {submitState === "err" && <p className="tform__error">{errMsg}</p>}

                    <div className="tform__actions">
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setSubmitState("idle");
                          setErrMsg("");
                        }}
                      >
                        {f.backBtn}
                      </button>
                      <button
                        className="button button--primary"
                        type="button"
                        disabled={!form.text.trim() || submitState === "sending"}
                        onClick={handleSend}
                      >
                        {submitState === "sending" ? f.sendingBtn : f.sendBtn}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
