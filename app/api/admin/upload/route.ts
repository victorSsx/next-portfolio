import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type UploadKind = "main-image" | "gallery" | "video" | "video-poster";
type SaveMode = "local-file" | "github";

const uploadRoot = path.join(process.cwd(), "public", "projects", "admin-uploads");
const maxImageSize = 8 * 1024 * 1024;
const maxVideoSize = 4 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const allowedExtensions = new Set(Object.values(extensionByMime));

const unauthorized = () => NextResponse.json({ error: "Senha administrativa invalida." }, { status: 401 });

const getPasswordFromRequest = (request: Request) => request.headers.get("x-admin-password") || "";

const assertAuthorized = (request: Request) => {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const submittedPassword = getPasswordFromRequest(request);

  return Boolean(configuredPassword && submittedPassword === configuredPassword);
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "arquivo";

const normalizeKind = (value: FormDataEntryValue | null): UploadKind => {
  if (value === "gallery" || value === "video" || value === "video-poster" || value === "main-image") {
    return value;
  }

  return "gallery";
};

const makeSafeFilename = (file: File, kind: UploadKind) => {
  const originalExtension = path.extname(file.name).toLowerCase();
  const safeExtension = allowedExtensions.has(originalExtension) ? originalExtension : extensionByMime[file.type] || "";
  const baseName = slugify(path.basename(file.name, originalExtension) || kind);

  return `${Date.now().toString(36)}-${baseName}${safeExtension}`;
};

const encodeGithubPath = (filePath: string) => filePath.split("/").map(encodeURIComponent).join("/");

const saveToLocalFile = async (projectSlug: string, filename: string, buffer: Buffer): Promise<SaveMode> => {
  const directory = path.join(uploadRoot, projectSlug);
  const targetPath = path.join(directory, filename);
  const resolvedPath = path.resolve(targetPath);

  if (!resolvedPath.startsWith(path.resolve(uploadRoot))) {
    throw new Error("Caminho de upload invalido.");
  }

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(targetPath, buffer);

  return "local-file";
};

const saveToGithub = async (githubPath: string, buffer: Buffer): Promise<SaveMode | null> => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;
  const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";

  if (!token || !owner || !repo) {
    return null;
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubPath(githubPath)}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const currentFile = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  let sha: string | undefined;

  if (currentFile.ok) {
    const payload = (await currentFile.json()) as { sha?: string };
    sha = payload.sha;
  } else if (currentFile.status !== 404) {
    throw new Error(`GitHub read failed: ${await currentFile.text()}`);
  }

  const update = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      branch,
      content: buffer.toString("base64"),
      message: `Upload portfolio asset: ${path.basename(githubPath)}`,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!update.ok) {
    throw new Error(`GitHub upload failed: ${await update.text()}`);
  }

  return "github";
};

export async function POST(request: Request) {
  if (!assertAuthorized(request)) {
    return unauthorized();
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload invalido." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Selecione um arquivo para upload." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Formato nao suportado. Use imagens ou videos comuns." }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? maxVideoSize : maxImageSize;

  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: isVideo
          ? "Video muito grande para upload direto na Vercel. Envie um MP4 comprimido de ate 4 MB."
          : "Imagem muito grande. Envie uma imagem de ate 8 MB.",
      },
      { status: 400 }
    );
  }

  const projectSlug = slugify(String(formData.get("projectId") || "projeto"));
  const kind = normalizeKind(formData.get("kind"));
  const filename = makeSafeFilename(file, kind);
  const buffer = Buffer.from(await file.arrayBuffer());
  const src = `/projects/admin-uploads/${projectSlug}/${filename}`;
  const githubPath = `public${src}`;

  try {
    const githubMode = await saveToGithub(githubPath, buffer);
    const mode = githubMode || (process.env.VERCEL ? null : await saveToLocalFile(projectSlug, filename, buffer));

    if (!mode) {
      return NextResponse.json(
        {
          error: "Configure GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO na Vercel para enviar arquivos pelo painel.",
        },
        { status: 501 }
      );
    }

    return NextResponse.json({
      asset: {
        filename,
        mimeType: file.type,
        path: githubPath,
        size: file.size,
        src,
      },
      mode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel enviar o arquivo.",
      },
      { status: 500 }
    );
  }
}
