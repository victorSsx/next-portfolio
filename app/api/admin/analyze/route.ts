import { NextResponse } from "next/server";
import defaultSiteData from "../../../data/site-data.json";
import { VITRINE_URL } from "../../../lib/site-url";

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
    "Analise o ESCOPO de um projeto e selecione, entre os SERVIÇOS oferecidos, os que atendem ao pedido. Depois escreva uma proposta MUITO CURTA e de alto impacto em português do Brasil, em 1a PESSOA (como se o próprio Victor estivesse falando: 'eu', 'sou', 'consigo', 'meu') — feita pra fazer o cliente PARAR de rolar e ler.",
    "",
    "REGRAS:",
    "- Em 'services', use SOMENTE ids que existem na lista de SERVIÇOS. Não invente ids.",
    "- quantity = 1, exceto serviços com allowQuantity=true (use a quantidade que o escopo indicar; caso não diga, use 1).",
    "- Se todos os serviços de um PACOTE forem selecionados, mencione o desconto do pacote na proposta.",
    "- Preços em reais (BRL). billing 'monthly' = valor mensal; 'once' = valor único. Use exatamente os preços fornecidos para os serviços existentes.",
    "- SERVIÇOS NOVOS: se o escopo pedir algo que NENHUM serviço da lista cobre, proponha em 'newServices'. NÃO proponha se já existir um serviço equivalente. Cada novo serviço deve ter: title (curto e claro), price (número em BRL, estimativa realista de mercado para freelancer BR), billing ('once' ou 'monthly'), summary (1 frase do que inclui) e category (use um id de CATEGORIAS; se nenhum servir bem, use o mais próximo). Se tudo já estiver coberto, devolva newServices como lista vazia.",
    "- A proposta é uma MENSAGEM PRONTA pra enviar ao cliente na plataforma (Workana/Upwork/e-mail). LIMITE RÍGIDO: no máximo ~110 palavras no total (idealmente 80-100). Cada parte abaixo = 1 linha curta (no máximo 2). Frases curtas, escaneável em segundos, SEM emojis, SEM parágrafos longos e SEM enrolação. Siga ESTA estrutura, nesta ordem:",
    "  1) GANCHO (1a linha, CURTA — no máximo ~12 palavras): comece DIRETO com um detalhe ESPECÍFICO do escopo do cliente (algo concreto que ELE descreveu) ou o resultado que ele quer. É a linha que aparece na prévia da plataforma e precisa fazer ele PARAR de rolar e abrir. Sem saudação ('Olá, tudo bem'), sem 'meu nome é', sem rodeio — a 1a palavra já tem que prender.",
    "  2) APRESENTAÇÃO + PROVA SOCIAL (1 linha curta e calorosa, logo após o gancho, em 1a PESSOA): o Victor se apresenta em poucas palavras (ex.: 'Sou o Victor, dev freelancer de sites/WordPress/lojas WooCommerce/SEO') e emenda a prova social — nota máxima 5 estrelas na Workana e clientes que voltam a contratar/recomendam. Acrescente o ângulo de DEDICAÇÃO em 1a pessoa: 'estou construindo minha reputação na Workana, então cada projeto recebe minha atenção total'. Enquadre isso como FORÇA (fome de entregar bem-feito), NUNCA como falta de experiência e SEM contradizer as 5 estrelas. Tom humano, nada robótico nem seco.",
    "  3) FOCO NO RESULTADO DO CLIENTE: fale do que ELE ganha (ex.: 'sua loja vendendo com checkout rápido e aparecendo no Google'), NUNCA comece por 'eu faço / eu tenho'.",
    "  4) VALOR FECHADO: apresente UM valor único fechado (a soma dos serviços, já com o desconto de pacote quando houver), NUNCA fragmentado em vários itens pequenos. Se houver plano mensal, cite o mensal em uma linha à parte. Inclua prazo (5 a 14 dias úteis) e a garantia de 7 dias de ajustes grátis.",
    "  5) PERGUNTA NO FINAL: termine com UMA pergunta que convide resposta. NUNCA pergunte algo que o cliente JÁ respondeu no escopo (ex.: se ele já informou a quantidade de produtos/páginas, NÃO pergunte isso) — escolha um ponto que falta definir: conteúdo/textos, integração de pagamento, prazo desejado, referências de design, etc. Conversa iniciada fecha muito mais.",
    `  6) Inclua, em UMA linha, o convite pro portfólio/orçamentador do Victor: ${VITRINE_URL} — deixando claro que é só uma página de portfólio/orçamento e que combinação, contrato e pagamento continuam pela própria plataforma. NÃO peça contato externo.`,
    "- No TOTAL a proposta é CURTÍSSIMA (~80-110 palavras): gancho, apresentação + prova social, resultado + valor/prazo, pergunta e o link — cada um em 1 linha curta. Se passar de ~110 palavras, CORTE adjetivos e palavras de enchimento até caber. Tom consultivo e confiante, sem exagero. Pode incluir os serviços novos no valor fechado.",
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
