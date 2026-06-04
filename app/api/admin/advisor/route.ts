import { NextResponse } from "next/server";
import defaultSiteData from "../../../data/site-data.json";

export const runtime = "nodejs";
export const maxDuration = 30;

const defaultAdminPassword = "371515victor";
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function authorized(request: Request) {
  const submitted = request.headers.get("x-admin-password") || "";
  const configured = process.env.ADMIN_PASSWORD?.trim();
  return submitted === defaultAdminPassword || Boolean(configured && submitted === configured);
}

type SvcLite = { id: string; title: string; price: number; billing: string; category?: string };
type PkgLite = { id: string; title: string; services: string[]; discount: number };

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });
  }

  const key = (process.env.GEMINI_API_KEY || process.env.V_API_Key)?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "IA não configurada. Adicione GEMINI_API_KEY (ou V_API_Key) na Vercel." },
      { status: 501 }
    );
  }

  let body: {
    mode?: "pricing" | "innovation" | "ask";
    question?: string;
    pastedPrices?: string;
    services?: SvcLite[];
    packages?: PkgLite[];
    web?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const mode = body.mode ?? "ask";
  const services: SvcLite[] =
    Array.isArray(body.services) && body.services.length ? body.services : (defaultSiteData.services as SvcLite[]);
  const packages: PkgLite[] = Array.isArray(body.packages)
    ? body.packages
    : ((defaultSiteData.packages as PkgLite[]) ?? []);

  const grade =
    "SERVIÇOS ATUAIS DO VICTOR (preços em BRL):\n" +
    services.map((s) => `- ${s.title}: ${fmtBRL(s.price)} ${s.billing === "monthly" ? "/mês" : "único"}`).join("\n") +
    "\n\nPACOTES:\n" +
    (packages.length
      ? packages
          .map((p) => `- ${p.title} (desconto ${fmtBRL(p.discount)}): ${p.services.join(", ")}`)
          .join("\n")
      : "(nenhum)");

  const intro =
    "Você é um consultor de negócios do Victor, desenvolvedor web freelancer no Brasil (sites WordPress, lojas WooCommerce, landing pages, SEO, performance e correções). " +
    "Responda em português do Brasil, de forma prática, específica e direta. Use listas e **negrito** quando ajudar. " +
    "Não invente dados; ao citar preços de mercado, baseie-se em informações atuais. Pense como freelancer (não agência).";

  let task = "";
  if (mode === "pricing") {
    task =
      "TAREFA: Avalie os PREÇOS dos serviços do Victor comparando com o que freelancers brasileiros cobram hoje. " +
      "Para os principais serviços, diga se está abaixo / na média / acima e sugira um preço ou faixa, com justificativa curta. " +
      "No fim, dê 2 a 3 recomendações rápidas (ex: upsell, ancoragem de preço, pacote). Seja realista e objetivo.";
  } else if (mode === "innovation") {
    task =
      "TAREFA: Sugira de 4 a 6 ideias de INOVAÇÃO para o negócio do Victor: novos serviços ou pacotes que combinem com o que ele já faz, formas de se diferenciar e melhorias de oferta. " +
      "Para cada ideia: nome, o que é (1 linha) e por que vale a pena. Priorize ideias realistas e de baixo esforço para começar.";
  } else {
    task = `PERGUNTA DO VICTOR: "${(body.question || "").trim().slice(0, 1500)}"`;
    const pasted = (body.pastedPrices || "").trim().slice(0, 2000);
    if (pasted) {
      task += `\n\nPREÇOS QUE O VICTOR VIU (para comparar com os dele):\n${pasted}`;
    }
    task += "\n\nResponda de forma prática. Se houver preços colados, compare com os do Victor e recomende.";
  }

  const prompt = [intro, "", grade, "", task].join("\n");

  const useWeb = body.web !== false; // grounding do Google ligado por padrão
  const reqBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
  };
  if (useWeb) reqBody.tools = [{ google_search: {} }];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);

  try {
    let data: {
      error?: { message?: string };
      candidates?: {
        content?: { parts?: { text?: string }[] };
        groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
      }[];
    } = {};
    let ok = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(reqBody),
      });
      data = await res.json();
      if (res.ok) {
        ok = true;
        break;
      }
      const msg = data?.error?.message || "";
      const retryable = res.status === 503 || res.status === 429 || /overload|high demand|unavailable|try again/i.test(msg);
      if (!retryable || attempt === 2) {
        return NextResponse.json({ error: msg || "Falha na IA." }, { status: 502 });
      }
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }
    if (!ok) return NextResponse.json({ error: "IA indisponível." }, { status: 502 });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return NextResponse.json({ error: "Sem resposta da IA." }, { status: 502 });

    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const sources = chunks
      .map((c) => ({ title: c.web?.title || "", uri: c.web?.uri || "" }))
      .filter((s) => s.uri && !seen.has(s.uri) && seen.add(s.uri))
      .slice(0, 6);

    return NextResponse.json({ text, sources });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "A IA demorou demais. Tente novamente." : "Não foi possível falar com a IA." },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
