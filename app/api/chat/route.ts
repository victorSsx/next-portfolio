import { NextResponse } from "next/server";
import { siteData } from "../../lib/site-data";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const WHATSAPP = "https://wa.me/5521975990988";

// ── Rate limit simples por IP (em memória, por instância) ──
const WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function buildSystemPrompt(): string {
  const services = (siteData.services || [])
    .map((s) => {
      const billing = s.billing === "monthly" ? "/mês" : "único";
      const from = s.startingAt ? "a partir de " : "";
      return `- ${s.title} (id: ${s.id}): ${from}${fmtBRL(s.price)} ${billing}. ${s.summary || ""}`;
    })
    .join("\n");

  const packages = (siteData.packages || [])
    .map((p) => {
      const inc = p.services
        .map((id) => siteData.services?.find((s) => s.id === id)?.title || id)
        .join(", ");
      return `- ${p.title}: inclui ${inc}. Desconto de ${fmtBRL(p.discount)}.`;
    })
    .join("\n");

  return [
    "Você é o assistente virtual do Victor, um desenvolvedor freelancer brasileiro especializado em sites, WordPress, lojas WooCommerce, landing pages, SEO, performance e correções/manutenção.",
    "Seu papel: dar suporte amigável aos visitantes do portfólio, recomendar serviços e pacotes, ajudar a montar orçamentos e tirar dúvidas — sempre com o objetivo de ajudar o cliente a dar o próximo passo com o Victor.",
    "",
    "SERVIÇOS DO VICTOR (use SOMENTE estes, com estes preços):",
    services,
    "",
    "PACOTES (combos com desconto):",
    packages,
    "",
    "DIFERENCIAIS DO VICTOR (destaque o valor, não compare com preços de concorrentes):",
    "- 7 dias de ajustes grátis após a entrega",
    "- Comunicação direta com ele durante todo o projeto",
    "- Entrega no prazo combinado",
    "- Todo site já sai com Google Analytics configurado",
    "- Sites rápidos, responsivos e otimizados para conversão",
    "- Trabalha por Workana, Upwork ou direto",
    "",
    "REGRAS DE COMPORTAMENTO:",
    "- Responda SEMPRE no idioma do visitante (português, inglês ou espanhol).",
    "- Seja breve, simpático e direto (2 a 5 frases). Use no máximo 1 emoji por mensagem.",
    "- Fale SOMENTE sobre o Victor, os serviços dele e desenvolvimento web. Se perguntarem outra coisa, recuse com gentileza e traga de volta pro tema.",
    "- NUNCA invente serviços, preços ou prazos fora da lista. Não cite preços de concorrentes nem do 'mercado'.",
    "- Se o cliente descrever um escopo, recomende os serviços/pacote que melhor atendem e estime o investimento somando os preços reais. Sugira a calculadora de orçamento da própria página para fechar os detalhes.",
    "- Se o cliente precisar de algo que o Victor NÃO oferece na lista, diga que vai anotar o pedido e que o Victor avalia, e sugira falar no WhatsApp.",
    `- Para fechar de verdade, oriente o cliente a usar a calculadora de orçamento na página ou falar no WhatsApp: ${WHATSAPP}`,
    "- Não peça dados sensíveis (senha, cartão, documentos).",
  ].join("\n");
}

export async function POST(request: Request) {
  const key = (process.env.GEMINI_API_KEY || process.env.V_API_Key)?.trim();
  if (!key) {
    return NextResponse.json({ error: "IA não configurada." }, { status: 501 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Você fez muitas perguntas seguidas. Aguarde um pouco ou fale no WhatsApp." },
      { status: 429 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const recent = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  if (recent.length === 0 || recent[recent.length - 1].role !== "user") {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const contents = recent.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
      }),
    });

    const data = (await res.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "Falha na IA." }, { status: 502 });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Sem resposta da IA." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "Tempo esgotado." : "Erro ao falar com a IA." },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
