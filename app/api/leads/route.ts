import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Lead, SiteData } from "../../lib/site-data";
import defaultSiteData from "../../data/site-data.json";

export const runtime = "nodejs";

const dataFilePath = path.join(process.cwd(), "app", "data", "site-data.json");
const githubDataPath = "app/data/site-data.json";

// Rate limit simples por IP (em memória, por instância)
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;
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

const readData = async (): Promise<SiteData> => {
  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(raw) as SiteData;
  } catch {
    return defaultSiteData as SiteData;
  }
};

const saveToGithub = async (data: SiteData): Promise<boolean> => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;
  const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
  if (!token || !owner || !repo) return false;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubDataPath}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const current = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  if (!current.ok) return false;
  const { sha } = (await current.json()) as { sha: string };
  const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");

  const update = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ branch, content, message: "New lead from chat", sha }),
  });
  return update.ok;
};

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Muitos envios. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const contact = String(body.contact ?? "").trim().slice(0, 160);
  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (name.length < 2) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (contact.length < 5) {
    return NextResponse.json({ error: "Informe um contato (e-mail ou WhatsApp)." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Descreva o que você precisa." }, { status: 400 });
  }

  const lead: Lead = {
    id: `lead-${Date.now().toString(36)}`,
    name,
    contact,
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    const current = await readData();
    const updated: SiteData = { ...current, leads: [...(current.leads ?? []), lead] };

    const githubOk = await saveToGithub(updated);
    if (!githubOk) {
      if (process.env.VERCEL) {
        return NextResponse.json(
          { error: "Não foi possível registrar agora. Tente novamente mais tarde." },
          { status: 503 }
        );
      }
      await fs.writeFile(dataFilePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno." }, { status: 500 });
  }
}
