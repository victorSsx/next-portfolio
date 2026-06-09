"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/LanguageContext";

const LOGO = "/images/logo-victor-ai-transparent.png";

type Msg = { role: "user" | "assistant"; content: string };
type LeadStatus = "idle" | "sending" | "sent" | "error";

export function ChatAssistant() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Phase 2 — proactive bubbles
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  // Phase 3 — lead form
  const [showLead, setShowLead] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("idle");
  const [leadError, setLeadError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cicla os balões-convite enquanto o chat está fechado e não foi dispensado
  useEffect(() => {
    if (open || bubbleDismissed) {
      setShowBubble(false);
      return;
    }
    let mounted = true;
    let hideTimer = 0;
    let showTimer = 0;
    let i = 0;
    const show = () => {
      if (!mounted) return;
      setBubbleIdx(i % t.chat.bubbles.length);
      setShowBubble(true);
      i += 1;
      hideTimer = window.setTimeout(hide, 30000);
    };
    const hide = () => {
      if (!mounted) return;
      setShowBubble(false);
      showTimer = window.setTimeout(show, 22000);
    };
    showTimer = window.setTimeout(show, 6000);
    return () => {
      mounted = false;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [open, bubbleDismissed, t.chat.bubbles.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const openChat = () => {
    setOpen(true);
    setShowBubble(false);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const json = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !json.reply) throw new Error(json.error || "erro");
      setMessages((m) => [...m, { role: "assistant", content: json.reply as string }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t.chat.fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const submitLead = async () => {
    if (leadStatus === "sending") return;
    setLeadStatus("sending");
    setLeadError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName, contact: leadContact, message: leadMessage }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error || "Erro ao enviar.");
      setLeadStatus("sent");
      setLeadName("");
      setLeadContact("");
      setLeadMessage("");
      window.setTimeout(() => {
        setShowLead(false);
        setLeadStatus("idle");
      }, 2600);
    } catch (err) {
      setLeadStatus("error");
      setLeadError(err instanceof Error ? err.message : "Erro ao enviar.");
    }
  };

  const closeLead = () => {
    setShowLead(false);
    setLeadStatus("idle");
    setLeadError("");
  };

  return (
    <>
      {!open && (
        <div className="chat-fab-wrap">
          {showBubble && (
            <button className="chat-bubble" type="button" onClick={openChat}>
              {t.chat.bubbles[bubbleIdx]}
              <span
                className="chat-bubble__close"
                role="button"
                aria-label="Fechar"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                  setBubbleDismissed(true);
                }}
              >
                ✕
              </span>
            </button>
          )}
          <button className="chat-fab" type="button" aria-label={t.chat.openLabel} onClick={openChat}>
            <span className="chat-fab__ring" aria-hidden="true" />
            <img src={LOGO} alt="" />
          </button>
        </div>
      )}

      {open && (
        <div className="chat-panel" role="dialog" aria-label={t.chat.title}>
          <header className="chat-panel__header">
            <div className="chat-panel__id">
              <span className="chat-panel__avatar">
                <img src={LOGO} alt="" />
              </span>
              <div>
                <strong>{t.chat.title}</strong>
                <span>{t.chat.subtitle}</span>
              </div>
            </div>
            <button className="chat-panel__close" type="button" aria-label="Fechar" onClick={() => setOpen(false)}>
              ✕
            </button>
          </header>

          <div className="chat-panel__messages" ref={scrollRef}>
            <div className="chat-msg chat-msg--bot">
              <span className="chat-msg__avatar">
                <img src={LOGO} alt="" />
              </span>
              <div className="chat-msg__bubble">{t.chat.greeting}</div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role === "user" ? "user" : "bot"}`}>
                {m.role !== "user" && (
                  <span className="chat-msg__avatar">
                    <img src={LOGO} alt="" />
                  </span>
                )}
                <div className="chat-msg__bubble">{m.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg--bot">
                <span className="chat-msg__avatar">
                  <img src={LOGO} alt="" />
                </span>
                <div className="chat-msg__bubble chat-typing" aria-label="Digitando">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <div className="chat-panel__input">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t.chat.placeholder}
              rows={1}
            />
            <button type="button" onClick={send} disabled={!input.trim() || loading} aria-label={t.chat.send}>
              ➤
            </button>
          </div>

          <div className="chat-panel__foot">
            <button type="button" className="chat-foot-btn" onClick={() => setShowLead(true)}>
              {t.chat.leadBtn}
            </button>
          </div>

          {showLead && (
            <div className="chat-lead">
              <div className="chat-lead__head">
                <strong>{t.chat.leadTitle}</strong>
                <button type="button" aria-label="Fechar" onClick={closeLead}>
                  ✕
                </button>
              </div>

              {leadStatus === "sent" ? (
                <p className="chat-lead__success">{t.chat.leadSuccess}</p>
              ) : (
                <>
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder={t.chat.leadName}
                    autoComplete="name"
                  />
                  <input
                    value={leadContact}
                    onChange={(e) => setLeadContact(e.target.value)}
                    placeholder={t.chat.leadContact}
                  />
                  <textarea
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                    placeholder={t.chat.leadMessage}
                    rows={3}
                  />
                  {leadStatus === "error" && <p className="chat-lead__error">{leadError}</p>}
                  <div className="chat-lead__actions">
                    <button type="button" className="chat-lead__cancel" onClick={closeLead}>
                      {t.chat.leadCancel}
                    </button>
                    <button
                      type="button"
                      className="chat-lead__send"
                      onClick={submitLead}
                      disabled={
                        leadStatus === "sending" ||
                        !leadName.trim() ||
                        leadContact.trim().length < 5 ||
                        leadMessage.trim().length < 5
                      }
                    >
                      {leadStatus === "sending" ? t.chat.leadSending : t.chat.leadSend}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
