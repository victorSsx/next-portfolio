import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { DeviceView, SiteData } from "../../../lib/site-data";
import defaultSiteData from "../../../data/site-data.json";

export const runtime = "nodejs";

const dataFilePath = path.join(process.cwd(), "app", "data", "site-data.json");
const githubDataPath = "app/data/site-data.json";

type SaveMode = "local-file" | "github";

const defaultAdminPassword = "371515victor";

const unauthorized = () => NextResponse.json({ error: "Senha administrativa inválida." }, { status: 401 });

const getPasswordFromRequest = (request: Request) => request.headers.get("x-admin-password") || "";

const assertAuthorized = (request: Request) => {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const submittedPassword = getPasswordFromRequest(request);

  return submittedPassword === defaultAdminPassword || Boolean(configuredPassword && submittedPassword === configuredPassword);
};

const normalizeTextArray = (items: unknown) =>
  Array.isArray(items) ? items.map((item) => String(item).trim()).filter(Boolean) : [];

const normalizeVideo = (video: unknown, fallbackPoster: string, fallbackLabel: string) => {
  if (!video || typeof video !== "object") {
    return null;
  }

  const item = video as { src?: unknown; poster?: unknown; label?: unknown };
  const src = String(item.src || "").trim();

  if (!src) {
    return null;
  }

  return {
    src,
    poster: String(item.poster || fallbackPoster || "").trim(),
    label: String(item.label || fallbackLabel || "Video demo").trim(),
  };
};

const normalizeSiteData = (data: Partial<SiteData>): SiteData => ({
  serviceCategories: Array.isArray(data.serviceCategories)
    ? data.serviceCategories
        .map((category) => ({
          id: String(category.id || "").trim(),
          label: String(category.label || "").trim(),
        }))
        .filter((category) => category.id && category.label)
    : [],
  technologies: normalizeTextArray(data.technologies),
  services: Array.isArray(data.services)
    ? data.services
        .map((service) => ({
          id: String(service.id || "").trim(),
          category: String(service.category || "").trim(),
          title: String(service.title || "").trim(),
          price: Number(service.price) || 0,
          billing: service.billing === "monthly" ? ("monthly" as const) : ("once" as const),
          summary: String(service.summary || "").trim(),
          details: normalizeTextArray(service.details),
          allowQuantity: Boolean(service.allowQuantity),
          unitLabel: service.unitLabel ? String(service.unitLabel).trim() : undefined,
          startingAt: Boolean(service.startingAt),
        }))
        .filter((service) => service.id && service.title && service.category)
    : [],
  projects: Array.isArray(data.projects)
    ? data.projects
        .map((project) => {
          const title = String(project.title || "").trim();
          const mainImage = {
            src: String(project.mainImage?.src || "").trim(),
            alt: String(project.mainImage?.alt || "").trim(),
          };
          const videos = (
            Array.isArray(project.videos)
              ? project.videos.map((video) => normalizeVideo(video, mainImage.src, `Video demo de ${title}`))
              : []
          ).filter(Boolean) as NonNullable<ReturnType<typeof normalizeVideo>>[];
          const legacyVideo = normalizeVideo(project.video, mainImage.src, `Video demo de ${title}`);

          if (!videos.length && legacyVideo) {
            videos.push(legacyVideo);
          }

          const normalizedDeviceViews: DeviceView[] = Array.isArray(project.deviceViews)
            ? (project.deviceViews as DeviceView[]).flatMap((dv): DeviceView[] => {
                const device = dv.device === "tablet" || dv.device === "mobile" ? dv.device : null;
                if (!device) return [];
                const normalizedVideos = Array.isArray(dv.videos)
                  ? (dv.videos
                      .map((vid) => normalizeVideo(vid, mainImage.src, `Video ${device} demo de ${title}`))
                      .filter(Boolean) as NonNullable<ReturnType<typeof normalizeVideo>>[])
                  : undefined;
                const entry: DeviceView = {
                  device,
                  images: Array.isArray(dv.images)
                    ? dv.images
                        .map((img) => ({
                          src: String(img.src || "").trim(),
                          alt: String(img.alt || "").trim(),
                          ...(img.label ? { label: String(img.label).trim() } : {}),
                        }))
                        .filter((img) => img.src)
                    : [],
                  ...(dv.label ? { label: String(dv.label).trim() } : {}),
                  ...(normalizedVideos?.length ? { videos: normalizedVideos } : {}),
                };
                return [entry];
              })
            : [];

          return {
            id: String(project.id || "").trim(),
            title,
            category: String(project.category || "").trim(),
            status: String(project.status || "").trim(),
            stack: normalizeTextArray(project.stack),
            summary: String(project.summary || "").trim(),
            workDone: normalizeTextArray(project.workDone),
            mainImage,
            gallery: Array.isArray(project.gallery)
              ? project.gallery
                  .map((image) => ({
                    src: String(image.src || "").trim(),
                    alt: String(image.alt || "").trim(),
                    label: image.label ? String(image.label).trim() : undefined,
                  }))
                  .filter((image) => image.src)
              : [],
            video: videos[0],
            videos,
            ...(normalizedDeviceViews.length > 0 ? { deviceViews: normalizedDeviceViews } : {}),
          };
        })
        .filter((project) => project.id && project.title && project.mainImage.src)
    : [],
});

const readLocalData = async () => {
  try {
    const file = await fs.readFile(dataFilePath, "utf8");
    return normalizeSiteData(JSON.parse(file) as SiteData);
  } catch {
    return normalizeSiteData(defaultSiteData as SiteData);
  }
};

const saveToLocalFile = async (data: SiteData): Promise<SaveMode> => {
  await fs.writeFile(dataFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return "local-file";
};

const saveToGithub = async (data: SiteData): Promise<SaveMode | null> => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;
  const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";

  if (!token || !owner || !repo) {
    return null;
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubDataPath}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const currentFile = await fetch(`${apiUrl}?ref=${branch}`, { headers });

  if (!currentFile.ok) {
    throw new Error(`GitHub read failed: ${await currentFile.text()}`);
  }

  const currentPayload = (await currentFile.json()) as { sha: string };
  const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");
  const update = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      branch,
      content,
      message: "Update portfolio admin data",
      sha: currentPayload.sha,
    }),
  });

  if (!update.ok) {
    throw new Error(`GitHub update failed: ${await update.text()}`);
  }

  return "github";
};

export async function GET(request: Request) {
  if (!assertAuthorized(request)) {
    return unauthorized();
  }

  const data = await readLocalData();
  return NextResponse.json({ data, mode: process.env.VERCEL ? "github" : "local-file" });
}

export async function POST(request: Request) {
  if (!assertAuthorized(request)) {
    return unauthorized();
  }

  let payload: { data?: SiteData };

  try {
    payload = (await request.json()) as { data?: SiteData };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const data = normalizeSiteData(payload.data || {});

  if (!data.projects.length || !data.services.length || !data.serviceCategories.length) {
    return NextResponse.json({ error: "Dados incompletos. Mantenha pelo menos um projeto, serviço e categoria." }, { status: 400 });
  }

  try {
    const githubMode = await saveToGithub(data);
    const mode = githubMode || (process.env.VERCEL ? null : await saveToLocalFile(data));

    if (!mode) {
      return NextResponse.json(
        {
          error:
            "Configure GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO na Vercel para salvar dados pelo painel administrativo.",
        },
        { status: 501 }
      );
    }

    return NextResponse.json({ saved: true, mode });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível salvar os dados.",
      },
      { status: 500 }
    );
  }
}
