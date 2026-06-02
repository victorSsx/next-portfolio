// Gera QR Codes personalizados (módulos arredondados + moldura dourada + logo
// no centro) apontando para o portfólio, nas versões CLARA e ESCURA.
// Uso:  node scripts/generate-qr.mjs [url]
import QRCode from "qrcode";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const URL = process.argv[2] || "https://next-portfolio-navy-five-46.vercel.app";
const LOGO = join(root, "public", "images", "logo-victor-ai-transparent.png");
const logoB64 = readFileSync(LOGO).toString("base64");

const MODULE = 12; // px por módulo
const MARGIN = 5; // zona de silêncio (em módulos)

const qr = QRCode.create(URL, { errorCorrectionLevel: "H" });
const size = qr.modules.size;
const bits = qr.modules.data;
const dim = (size + MARGIN * 2) * MODULE;
const off = MARGIN * MODULE;
const get = (r, c) => (r >= 0 && c >= 0 && r < size && c < size ? bits[r * size + c] : 0);

const finders = [
  { r: 0, c: 0 },
  { r: 0, c: size - 7 },
  { r: size - 7, c: 0 },
];
const inFinder = (r, c) => finders.some((f) => r >= f.r && r < f.r + 7 && c >= f.c && c < f.c + 7);

const logoMods = Math.round(size * 0.24);
const ls = Math.floor((size - logoMods) / 2);
const le = ls + logoMods;
const inLogo = (r, c) => r >= ls && r < le && c >= ls && c < le;

function buildSvg(t) {
  // Módulos de dados (quadrados levemente arredondados = leitura confiável)
  let mods = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!get(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
      const x = off + c * MODULE;
      const y = off + r * MODULE;
      mods += `<rect x="${x}" y="${y}" width="${MODULE}" height="${MODULE}" rx="${(MODULE * 0.28).toFixed(2)}"/>`;
    }
  }

  // Olhos arredondados (3 camadas)
  const eye = (fr, fc) => {
    const x = off + fc * MODULE;
    const y = off + fr * MODULE;
    const m = MODULE;
    return (
      `<rect x="${x}" y="${y}" width="${7 * m}" height="${7 * m}" rx="${m * 2.2}" fill="${t.module}"/>` +
      `<rect x="${x + m}" y="${y + m}" width="${5 * m}" height="${5 * m}" rx="${m * 1.5}" fill="${t.bg}"/>` +
      `<rect x="${x + 2 * m}" y="${y + 2 * m}" width="${3 * m}" height="${3 * m}" rx="${m}" fill="${t.module}"/>`
    );
  };

  // Selo central com a logo
  const logoPx = logoMods * MODULE;
  const lx = off + ls * MODULE;
  const pad = MODULE * 0.6;
  const panelX = lx - pad; // grade quadrada → mesmo valor em x e y
  const panelW = logoPx + pad * 2;
  const imgSize = panelW * 0.7;
  const imgPos = panelX + (panelW - imgSize) / 2;
  const center =
    `<rect x="${panelX}" y="${panelX}" width="${panelW}" height="${panelW}" rx="${MODULE * 1.8}" fill="${t.panel}" stroke="${t.frame}" stroke-width="2.5"/>` +
    `<image x="${imgPos}" y="${imgPos}" width="${imgSize}" height="${imgSize}" href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>`;

  // Moldura dourada externa
  const fi = MODULE * 1.2;
  const frame = `<rect x="${fi}" y="${fi}" width="${dim - fi * 2}" height="${dim - fi * 2}" rx="${MODULE * 2.4}" fill="none" stroke="${t.frame}" stroke-width="3"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">
  <rect width="${dim}" height="${dim}" rx="${MODULE * 2.8}" fill="${t.bg}"/>
  ${frame}
  <g fill="${t.module}">${mods}</g>
  ${eye(finders[0].r, finders[0].c)}${eye(finders[1].r, finders[1].c)}${eye(finders[2].r, finders[2].c)}
  ${center}
</svg>
`;
}

const THEMES = [
  { name: "clara", file: "qr-portfolio", bg: "#ffffff", module: "#111314", panel: "#0e0f10", frame: "#c7a447" },
  { name: "escura", file: "qr-portfolio-dark", bg: "#0e0f10", module: "#f5f2ec", panel: "#16181a", frame: "#c7a447" },
];

for (const t of THEMES) {
  const svg = buildSvg(t);
  writeFileSync(join(root, "public", `${t.file}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 300 }).resize(1080, 1080).png().toFile(join(root, "public", `${t.file}.png`));
  console.log(`✓ versão ${t.name}: public/${t.file}.svg + .png`);
}
console.log(`  URL: ${URL} · ${size}x${size} módulos · correção de erro: H`);
