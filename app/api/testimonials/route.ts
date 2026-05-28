import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { SiteData, PendingTestimonial } from "../../lib/site-data";
import defaultSiteData from "../../data/site-data.json";

export const runtime = "nodejs";

const dataFilePath = path.join(process.cwd(), "app", "data", "site-data.json");
const githubDataPath = "app/data/site-data.json";

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
    body: JSON.stringify({ branch, content, message: "Add pending testimonial", sha }),
  });

  return update.ok;
};

// ~150 KB in base64
const MAX_PHOTO_CHARS = 200_000;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const text = String(body.text ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  const role = String(body.role ?? "").trim();
  const company = String(body.company ?? "").trim();
  const photo = body.photo ? String(body.photo).trim() : undefined;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nome é obrigatório (mínimo 2 caracteres)." }, { status: 400 });
  }
  if (!text || text.length < 10) {
    return NextResponse.json({ error: "Depoimento muito curto (mínimo 10 caracteres)." }, { status: 400 });
  }
  if (photo && photo.length > MAX_PHOTO_CHARS) {
    return NextResponse.json({ error: "Foto muito grande." }, { status: 400 });
  }

  const pending: PendingTestimonial = {
    id: `t-${Date.now().toString(36)}`,
    name,
    role,
    company,
    text,
    rating,
    submittedAt: new Date().toISOString(),
    ...(photo ? { photo } : {}),
  };

  try {
    const current = await readData();
    const updated: SiteData = {
      ...current,
      pendingTestimonials: [...(current.pendingTestimonials ?? []), pending],
    };

    const githubOk = await saveToGithub(updated);
    if (!githubOk) {
      if (process.env.VERCEL) {
        return NextResponse.json(
          { error: "Não foi possível salvar o depoimento. Tente novamente mais tarde." },
          { status: 503 }
        );
      }
      await fs.writeFile(dataFilePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno." },
      { status: 500 }
    );
  }
}
