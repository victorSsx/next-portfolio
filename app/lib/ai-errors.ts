// Mensagens amigáveis para erros da IA (Gemini), por idioma.
// Evita expor o texto técnico do Google (ex.: "quota exceeded for metric...")
// para os visitantes. Use friendlyAIError() ao devolver erro de IA ao cliente.

type FriendlyMsg = { busy: string; down: string };

const FRIENDLY: Record<string, FriendlyMsg> = {
  pt: {
    busy: "A IA está com muita procura agora. Tente de novo em alguns segundos.",
    down: "A IA está indisponível no momento. Tente de novo em instantes.",
  },
  en: {
    busy: "The AI is in high demand right now. Please try again in a few seconds.",
    down: "The AI is unavailable at the moment. Please try again shortly.",
  },
  es: {
    busy: "La IA tiene mucha demanda ahora. Inténtalo de nuevo en unos segundos.",
    down: "La IA no está disponible ahora. Inténtalo de nuevo en breve.",
  },
};

// Erros de limite/cota/sobrecarga → mensagem "muita procura, tente em segundos".
const BUSY_RE = /quota|rate.?limit|resource exhausted|exceeded|too many requests|high demand|overload/i;

/**
 * Converte um erro do Gemini (status HTTP + mensagem crua) numa mensagem
 * curta e amigável no idioma do visitante.
 */
export function friendlyAIError(status: number, rawMsg: string, lang = "pt"): string {
  const L = FRIENDLY[lang] || FRIENDLY.pt;
  if (status === 429 || BUSY_RE.test(rawMsg || "")) return L.busy;
  return L.down;
}
