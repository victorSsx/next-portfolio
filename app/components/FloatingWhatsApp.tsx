"use client";

import { useEffect, useState } from "react";

const WHATSAPP_URL = "https://wa.me/5521975990988";

export function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      className={`fab-whatsapp${visible ? " is-visible" : ""}`}
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M17.47 14.38c-.3-.15-1.74-.86-2-.96-.27-.1-.46-.15-.66.15-.2.3-.76.95-.93 1.15-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.91-2.19-.24-.57-.48-.5-.66-.5-.17 0-.37-.03-.56-.03-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.74-.71 1.99-1.4.24-.69.24-1.28.17-1.4-.07-.12-.27-.2-.56-.34zM12.04 21.5h-.01a9.46 9.46 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.45 9.45 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c-.01 5.22-4.26 9.47-9.48 9.47zm8.06-17.53A11.36 11.36 0 0 0 12.04.6C5.76.6.66 5.7.66 11.97c0 2 .52 3.96 1.52 5.69L.56 23.4l5.88-1.54a11.34 11.34 0 0 0 5.6 1.43h.01c6.27 0 11.38-5.1 11.38-11.37 0-3.04-1.18-5.9-3.33-8.05z" />
      </svg>
    </a>
  );
}
