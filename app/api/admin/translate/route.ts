import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const defaultAdminPassword = "371515victor";
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

const LANG_NAMES: Record<string, string> = {
  en: "English (US)",
  es: "Latin American Spanish",
};

function authorized(request: Request) {
  const submitted = request.headers.get("x-admin-password") || "";
  const configured = process.env.ADMIN_PASSWORD?.trim();
  return submitted === defaultAdminPassword || Boolean(configured && submitted === configured);
}

type Item = { id: string; fields: Record<string, string | string[]> };

async function translateLang(
  key: string,
  lang: string,
  items: Item[]
): Promise<Record<string, Record<string, string | string[]>>> {
  const langName = LANG_NAMES[lang] || lang;
  const prompt = [
    `You are a professional translator for a Brazilian web developer's portfolio website.`,
    `Translate the VALUES of the JSON below from Brazilian Portuguese into ${langName}.`,
    `Rules:`,
    `- Return ONLY a JSON object shaped exactly as {"items":[{"id":"...","fields":{...}}]}, with the SAME ids and the SAME keys as the input.`,
    `- Translate only the string values. Arrays must stay arrays (translate each element, keep the same length).`,
    `- Keep brand and technical names unchanged (WordPress, WooCommerce, Elementor, Fluent Forms, Rank Math, SEO, Google, WhatsApp, GA4, etc.).`,
    `- Natural, concise, professional tone. Do not add, remove or reorder fields.`,
    ``,
    `INPUT:`,
    JSON.stringify({ items }),
  ].join("\n");

  const reqBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  let text = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(reqBody),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (res.ok) {
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        break;
      }
      const msg = data?.error?.message || "";
      const retryable =
        res.status === 503 || res.status === 429 || /overload|high demand|unavailable|try again/i.test(msg);
      if (!retryable || attempt === 2) throw new Error(msg || "Falha na IA.");
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!text) throw new Error("Sem resposta da IA.");

  // Em geral o responseMimeType garante JSON puro; ainda assim, extraímos o bloco por segurança.
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const slice = jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
  const parsed = JSON.parse(slice) as { items?: Item[] };

  const out: Record<string, Record<string, string | string[]>> = {};
  for (const it of parsed.items || []) {
    if (it && typeof it.id === "string" && it.fields && typeof it.fields === "object") {
      out[it.id] = it.fields;
    }
  }
  return out;
}

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

  let body: { items?: Item[]; langs?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .filter((it) => it && typeof it.id === "string" && it.fields && typeof it.fields === "object")
    .slice(0, 80);
  const langs = (Array.isArray(body.langs) ? body.langs : ["en", "es"]).filter((l) => LANG_NAMES[l]);

  if (!items.length || !langs.length) {
    return NextResponse.json({ error: "Nada para traduzir." }, { status: 400 });
  }

  try {
    // Idiomas em paralelo para caber no tempo limite.
    const results = await Promise.all(langs.map((lang) => translateLang(key, lang, items)));

    // translations[id][lang] = { campos traduzidos }
    const translations: Record<string, Record<string, Record<string, string | string[]>>> = {};
    langs.forEach((lang, i) => {
      const byId = results[i];
      for (const id of Object.keys(byId)) {
        if (!translations[id]) translations[id] = {};
        translations[id][lang] = byId[id];
      }
    });

    return NextResponse.json({ translations });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "A IA demorou demais. Tente com menos itens."
          : error instanceof Error
            ? error.message
            : "Não foi possível traduzir.",
      },
      { status: 502 }
    );
  }
}
