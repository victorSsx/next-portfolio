"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/LanguageContext";

const LOGO = "/images/logo-victor-ai-transparent.png";
const WHATSAPP = "https://wa.me/5521975990988";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatAssistant() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Balão-convite aparece uma vez, após alguns segundos, se o chat estiver fechado
  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => setShowBubble(true), 6000);
    return () => window.clearTimeout(id);
  }, [open]);

  // Rolar para a última mensagem
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
        body: JSON.stringify({ messages: next }),
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

  return (
    <>
      {!open && (
        <div className="chat-fab-wrap">
          {showBubble && (
            <button className="chat-bubble" type="button" onClick={openChat}>
              {t.chat.bubble}
              <span
                className="chat-bubble__close"
                role="button"
                aria-label="Fechar"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
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

          <a className="chat-panel__wa" href={WHATSAPP} target="_blank" rel="noreferrer">
            WhatsApp ↗
          </a>
        </div>
      )}
    </>
  );
}
