import { NextResponse } from "next/server";
import defaultSiteData from "../../../data/site-data.json";

export const runtime = "nodejs";

const defaultAdminPassword = "371515victor";
// Modelo configurável por variável de ambiente (GEMINI_MODEL); padrão 2.5-flash.
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function authorized(request: Request) {
  const submitted = request.headers.get("x-admin-password") || "";
  const configured = process.env.ADMIN_PASSWORD?.trim();
  return submitted === defaultAdminPassword || Boolean(configured && submitted === configured);
}

type SvcLite = {
  id: string;
  title: string;
  price: number;
  billing: string;
  summary?: string;
  allowQuantity?: boolean;
  unitLabel?: string;
};
type PkgLite = { id: string; title: string; services: string[]; discount: number };

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });
  }

  // Aceita o nome canônico ou o que o usuário configurou na Vercel.
  const key = (process.env.GEMINI_API_KEY || process.env.V_API_Key)?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "IA não configurada. Adicione a variável GEMINI_API_KEY (ou V_API_Key) nas configurações da Vercel." },
      { status: 501 }
    );
  }

  let body: {
    scope?: string;
    services?: SvcLite[];
    packages?: PkgLite[];
    categories?: { id: string; label: string }[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const scope = (body.scope || "").trim();
  if (scope.length < 10) {
    return NextResponse.json({ error: "Escopo muito curto para analisar." }, { status: 400 });
  }

  const services: SvcLite[] =
    Array.isArray(body.services) && body.services.length
      ? body.services
      : (defaultSiteData.services as SvcLite[]);
  const packages: PkgLite[] = Array.isArray(body.packages)
    ? body.packages
    : ((defaultSiteData.packages as PkgLite[]) ?? []);

  const servicesForPrompt = services.map((s) => ({
    id: s.id,
    title: s.title,
    price: s.price,
    billing: s.billing,
    summary: s.summary,
    allowQuantity: Boolean(s.allowQuantity),
    unitLabel: s.unitLabel,
  }));
  const packagesForPrompt = packages.map((p) => ({
    id: p.id,
    title: p.title,
    services: p.services,
    discount: p.discount,
  }));

  const categories =
    Array.isArray(body.categories) && body.categories.length
      ? body.categories
      : ((defaultSiteData.serviceCategories as { id: string; label: string }[]) ?? []);
  const categoriesForPrompt = categories.map((c) => ({ id: c.id, label: c.label }));

  const prompt = [
    "Você é o assistente comercial do Victor, desenvolvedor freelancer (sites, WordPress, lojas WooCommerce, SEO, performance e correções).",
    "Analise o ESCOPO de um projeto e selecione, entre os SERVIÇOS oferecidos, os que atendem ao pedido. Depois escreva uma proposta curta e profissional em português do Brasil.",
    "",
    "REGRAS:",
    "- Em 'services', use SOMENTE ids que existem na lista de SERVIÇOS. Não invente ids.",
    "- quantity = 1, exceto serviços com allowQuantity=true (use a quantidade que o escopo indicar; caso não diga, use 1).",
    "- Se todos os serviços de um PACOTE forem selecionados, mencione o desconto do pacote na proposta.",
    "- Preços em reais (BRL). billing 'monthly' = valor mensal; 'once' = valor único. Use exatamente os preços fornecidos para os serviços existentes.",
    "- SERVIÇOS NOVOS: se o escopo pedir algo que NENHUM serviço da lista cobre, proponha em 'newServices'. NÃO proponha se já existir um serviço equivalente. Cada novo serviço deve ter: title (curto e claro), price (número em BRL, estimativa realista de mercado para freelancer BR), billing ('once' ou 'monthly'), summary (1 frase do que inclui) e category (use um id de CATEGORIAS; se nenhum servir bem, use o mais próximo). Se tudo já estiver coberto, devolva newServices como lista vazia.",
    "- A proposta deve: saudar, listar o que será feito, mostrar o investimento, citar prazo (5 a 14 dias úteis) e a garantia de 7 dias de ajustes grátis. Tom confiante e direto, sem exagero. Pode considerar os serviços novos na proposta.",
    "",
    "SERVIÇOS (JSON):",
    JSON.stringify(servicesForPrompt),
    "",
    "PACOTES (JSON):",
    JSON.stringify(packagesForPrompt),
    "",
    "CATEGORIAS (JSON):",
    JSON.stringify(categoriesForPrompt),
    "",
    "ESCOPO DO PROJETO:",
    `"""${scope}"""`,
    "",
    'Responda APENAS com um JSON neste formato exato, sem markdown: {"services":[{"id":"string","quantity":number}],"newServices":[{"title":"string","price":number,"billing":"once|monthly","summary":"string","category":"string"}],"proposal":"string"}',
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    });

    const data = (await res.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: `Gemini: ${data?.error?.message || "falha na chamada."}` },
        { status: 502 }
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: {
      services?: { id: string; quantity: number }[];
      newServices?: { title?: string; price?: number; billing?: string; summary?: string; category?: string }[];
      proposal?: string;
    };
    try {
      const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: "A IA retornou um formato inesperado. Tente novamente." },
        { status: 500 }
      );
    }

    const validIds = new Set(services.map((s) => s.id));
    const cleanedServices = Array.isArray(parsed.services)
      ? parsed.services
          .filter((x) => x && validIds.has(x.id))
          .map((x) => ({ id: x.id, quantity: Math.max(1, Math.round(Number(x.quantity) || 1)) }))
      : [];

    const categoryIds = new Set(categories.map((c) => c.id));
    const existingTitles = new Set(services.map((s) => s.title.trim().toLowerCase()));
    const cleanedNewServices = Array.isArray(parsed.newServices)
      ? parsed.newServices
          .filter((x) => x && typeof x.title === "string" && x.title.trim().length > 1)
          .filter((x) => !existingTitles.has((x.title as string).trim().toLowerCase()))
          .slice(0, 4)
          .map((x) => ({
            title: (x.title as string).trim().slice(0, 80),
            price: Math.max(0, Math.round(Number(x.price) || 0)),
            billing: x.billing === "monthly" ? "monthly" : "once",
            summary: typeof x.summary === "string" ? x.summary.trim().slice(0, 300) : "",
            category: x.category && categoryIds.has(x.category) ? x.category : categories[0]?.id || "",
          }))
      : [];

    return NextResponse.json({
      services: cleanedServices,
      newServices: cleanedNewServices,
      proposal: typeof parsed.proposal === "string" ? parsed.proposal : "",
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "A IA demorou demais e foi cancelada. Tente novamente."
          : "Não foi possível analisar com IA agora.",
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
