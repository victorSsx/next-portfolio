import { NextResponse } from "next/server";
import { VITRINE_URL } from "../../../lib/site-url";

export const runtime = "nodejs";

const defaultAdminPassword = "371515victor";
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function authorized(request: Request) {
  const submitted = request.headers.get("x-admin-password") || "";
  const configured = process.env.ADMIN_PASSWORD?.trim();
  return submitted === defaultAdminPassword || Boolean(configured && submitted === configured);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });
  }

  const key = (process.env.GEMINI_API_KEY || process.env.V_API_Key)?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "IA não configurada. Adicione a variável GEMINI_API_KEY (ou V_API_Key) nas configurações da Vercel." },
      { status: 501 }
    );
  }

  let body: { scope?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const scope = (body.scope || "").trim();
  if (scope.length < 10) {
    return NextResponse.json({ error: "Escopo muito curto para gerar perguntas." }, { status: 400 });
  }

  const prompt = [
    "Você é o assistente comercial do Victor, desenvolvedor freelancer (sites, WordPress, lojas WooCommerce, SEO, performance e correções).",
    "Analise o ESCOPO de um projeto (Workana/e-mail) e gere PERGUNTAS MATADORAS pra Victor enviar ao cliente: perguntas curtas e inteligentes SOBRE O PROJETO, que esclarecem requisitos, mostram expertise e ajudam a fechar.",
    "",
    "REGRAS:",
    "- Gere de 3 a 5 perguntas, cada uma em UMA linha curta. Nada óbvio ou genérico: foque no que falta no escopo pra orçar com precisão (ex.: plataforma/tecnologia atual, nº de páginas/produtos, integrações e pagamentos, conteúdo/identidade prontos, prazo, referências).",
    "- Português do Brasil, tom consultivo e direto, SEM emojis. Seja conciso — poucas linhas no total.",
    "- Monte uma MENSAGEM PRONTA pra enviar ao cliente: 1 linha curta de abertura, depois as perguntas numeradas (1., 2., ...), e UMA linha final convidando a conhecer o portfólio e o orçamentador do Victor:",
    `  ${VITRINE_URL}`,
    "  Deixe claro que é apenas uma página de portfólio/orçamento e que combinação, contrato e pagamento continuam pela própria plataforma. NÃO peça contato externo.",
    "",
    "ESCOPO DO PROJETO:",
    `"""${scope}"""`,
    "",
    'Responda APENAS com JSON, sem markdown: {"message":"string"}',
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
        generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
      }),
    });

    const data = (await res.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!res.ok) {
      return NextResponse.json({ error: `Gemini: ${data?.error?.message || "falha na chamada."}` }, { status: 502 });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: { message?: string };
    try {
      const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "A IA retornou um formato inesperado. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json({ message: typeof parsed.message === "string" ? parsed.message : "" });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "A IA demorou demais e foi cancelada. Tente novamente." : "Não foi possível gerar as perguntas agora." },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
