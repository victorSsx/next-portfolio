import { NextResponse } from "next/server";
import { siteData } from "../../lib/site-data";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

// Rate limit por IP (em memória) — endpoint público.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 25;
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

const LANG_NAME: Record<string, string> = { pt: "Brazilian Portuguese", en: "English", es: "Spanish" };
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Msg = { role: "user" | "assistant"; content: string };

function systemPrompt(lang: string): string {
  const services = (siteData.services || [])
    .map((s) => `- ${s.id} | ${s.title} | ${fmtBRL(s.price)} ${s.billing === "monthly" ? "/mês" : "único"} | cat: ${s.category} | ${s.summary || ""}`)
    .join("\n");
  const packages = (siteData.packages || [])
    .map((p) => {
      const inc = p.services.map((id) => siteData.services?.find((s) => s.id === id)?.title || id).join(", ");
      return `- ${p.id} | ${p.title} | inclui: ${inc} | desconto ${fmtBRL(p.discount)} | ${p.description || ""}`;
    })
    .join("\n");

  return [
    "Você é o assistente de orçamento do Victor, desenvolvedor web freelancer (sites WordPress, lojas WooCommerce, landing pages, SEO, performance, manutenção). Você atende numa página vitrine: NÃO peça nem ofereça contato — o cliente fecha pela própria plataforma.",
    "",
    "OBJETIVO: conversar de forma natural e gentil pra entender a necessidade do cliente e, conforme entender, RECOMENDAR serviços e pacotes do catálogo — exibindo os cards correspondentes. Destaque os PACOTES e suas vantagens (desconto + tudo que incluem) quando fizerem sentido.",
    "",
    "CATÁLOGO DE SERVIÇOS (id | título | preço | categoria | resumo):",
    services,
    "",
    "PACOTES (id | título | inclui | desconto | descrição):",
    packages || "(nenhum)",
    "",
    "REGRAS:",
    `- Responda SEMPRE em ${LANG_NAME[lang] || "Brazilian Portuguese"}.`,
    "- Tom consultivo, acolhedor e confiante — nunca agressivo. Sem emojis. Sem exageros ('incrível', 'maravilhoso').",
    "- Mensagens curtas: 2 a 4 frases. Faça no máximo 1 pergunta por vez pra afunilar a necessidade.",
    "- Recomende SOMENTE ids existentes. Nunca invente serviços, pacotes ou preços.",
    "- Se um pacote cobrir o que o cliente quer, prefira recomendá-lo e explique a vantagem (o que inclui + a economia).",
    "- No começo, se ainda não souber a necessidade, faça uma pergunta e deixe as listas vazias.",
    "- Quando já entender, recomende a melhor combinação (serviços e/ou 1 pacote).",
    "",
    "CLIENTE LEIGO — MUITO IMPORTANTE:",
    "- Boa parte dos clientes NÃO sabe o que quer, nem por onde começar, nem o que precisa. TOME A FRENTE: explique em linguagem simples (sem termos técnicos), dê dicas e recomendações e conduza passo a passo.",
    "- Sempre que ajudar, ofereça OPÇÕES CLICÁVEIS no campo \"options\" (2 a 5 opções curtas) pra facilitar pra quem não sabe explicar. Inclua uma opção tipo 'Não sei, me ajuda' quando fizer sentido.",
    "- Use \"multi\": true quando o cliente pode marcar VÁRIAS (ex: 'quais funcionalidades você precisa?'); use false pra escolha ÚNICA (ex: 'que tipo de projeto?').",
    "- Dê dicas proativas (ex: 'pra captar clientes, uma página única costuma converter mais que um site grande').",
    "",
    "FORMATO DE SAÍDA (responda APENAS este JSON):",
    '{"reply": "sua fala curta", "options": ["opção curta clicável"], "multi": false, "notes": ["pontos que o cliente mencionou"], "serviceIds": ["ids recomendados AGORA"], "packageIds": ["ids recomendados AGORA"]}',
    '- "options": de 0 a 5 opções curtas pra o cliente CLICAR (o texto que ele "responderia"). Use pra guiar leigos. Deixe [] quando fizer mais sentido ele digitar livre.',
    '- "multi": true se ele pode escolher várias das options ao mesmo tempo; false se é escolha única.',
    '- "notes": lista CUMULATIVA e curta do que o cliente disse que importa. Mantenha os anteriores e some os novos. Frases de 2 a 6 palavras, no idioma da conversa. Vazia se ainda não deu detalhes.',
    "- serviceIds/packageIds refletem o que deve aparecer na tela neste momento (podem ficar vazios no início e mudar a cada turno).",
  ].join("\n");
}

export async function POST(request: Request) {
  const key = (process.env.GEMINI_API_KEY || process.env.V_API_Key)?.trim();
  if (!key) return NextResponse.json({ error: "IA não configurada." }, { status: 501 });

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Conversa intensa! Aguarde um pouco e continue em instantes." }, { status: 429 });
  }

  let body: { messages?: Msg[]; lang?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const lang = LANG_NAME[body.lang || "pt"] ? (body.lang as string) : "pt";
  const recent = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  if (!recent.length || recent[recent.length - 1].role !== "user") {
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
    let data: { error?: { message?: string }; candidates?: { content?: { parts?: { text?: string }[] } }[] } = {};
    let ok = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 900,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
          },
        }),
      });
      data = await res.json();
      if (res.ok) {
        ok = true;
        break;
      }
      const msg = data?.error?.message || "";
      const retryable = res.status === 503 || res.status === 429 || /overload|high demand|unavailable|try again|resource exhausted/i.test(msg);
      if (!retryable || attempt === 2) {
        return NextResponse.json({ error: msg || "Falha na IA." }, { status: 502 });
      }
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }
    if (!ok) return NextResponse.json({ error: "IA indisponível no momento." }, { status: 502 });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const slice = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(slice) as {
      reply?: string;
      options?: string[];
      multi?: boolean;
      notes?: string[];
      serviceIds?: string[];
      packageIds?: string[];
    };

    const reply = String(parsed.reply || "").slice(0, 700);
    if (!reply) return NextResponse.json({ error: "Sem resposta da IA." }, { status: 502 });

    const options = (Array.isArray(parsed.options) ? parsed.options : [])
      .map((o) => String(o).trim())
      .filter(Boolean)
      .slice(0, 5);
    const multi = Boolean(parsed.multi);

    const notes = (Array.isArray(parsed.notes) ? parsed.notes : [])
      .map((n) => String(n).trim())
      .filter(Boolean)
      .slice(0, 10);

    const serviceIds = (Array.isArray(parsed.serviceIds) ? parsed.serviceIds : []).filter((id) =>
      (siteData.services || []).some((s) => s.id === id)
    );
    const packageIds = (Array.isArray(parsed.packageIds) ? parsed.packageIds : []).filter((id) =>
      (siteData.packages || []).some((p) => p.id === id)
    );

    return NextResponse.json({ reply, options, multi, notes, serviceIds, packageIds });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "A IA demorou demais. Tente de novo." : "Não foi possível responder agora." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
