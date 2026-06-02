// Gera um QR Code personalizado (estilo bolinhas + moldura dourada + logo no centro)
// apontando para o portfólio. Uso:  node scripts/generate-qr.mjs [url]
import QRCode from "qrcode";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const URL = process.argv[2] || "https://next-portfolio-navy-five-46.vercel.app";
const OUT = join(root, "public", "qr-portfolio.svg");
const LOGO = join(root, "public", "images", "logo-victor-ai-transparent.png");

// ── Paleta da marca ──
const DARK = "#111314"; // módulos (alto contraste = leitura confiável)
const GOLD = "#c7a447"; // moldura + detalhes
const PANEL = "#0e0f10"; // fundo do selo central da logo
const BG = "#ffffff"; // fundo (branco = melhor leitura)

const MODULE = 12; // px por módulo
const MARGIN = 5; // zona de silêncio (em módulos)

const qr = QRCode.create(URL, { errorCorrectionLevel: "H" });
const size = qr.modules.size;
const bits = qr.modules.data;
const dim = (size + MARGIN * 2) * MODULE;
const off = MARGIN * MODULE;
const get = (r, c) => (r >= 0 && c >= 0 && r < size && c < size ? bits[r * size + c] : 0);

// Regiões dos três "olhos" (finder patterns) 7x7
const finders = [
  { r: 0, c: 0 },
  { r: 0, c: size - 7 },
  { r: size - 7, c: 0 },
];
const inFinder = (r, c) => finders.some((f) => r >= f.r && r < f.r + 7 && c >= f.c && c < f.c + 7);

// Zona central reservada para a logo (~24% — seguro com correção de erro nível H)
const logoMods = Math.round(size * 0.24);
const ls = Math.floor((size - logoMods) / 2);
const le = ls + logoMods;
const inLogo = (r, c) => r >= ls && r < le && c >= ls && c < le;

// ── Módulos de dados (quadrados levemente arredondados = leitura confiável) ──
let dots = "";
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!get(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
    const x = off + c * MODULE;
    const y = off + r * MODULE;
    dots += `<rect x="${x}" y="${y}" width="${MODULE}" height="${MODULE}" rx="${(MODULE * 0.28).toFixed(2)}"/>`;
  }
}

// ── Olhos arredondados (3 camadas) ──
const eye = (fr, fc) => {
  const x = off + fc * MODULE;
  const y = off + fr * MODULE;
  const m = MODULE;
  return (
    `<rect x="${x}" y="${y}" width="${7 * m}" height="${7 * m}" rx="${m * 2.2}" fill="${DARK}"/>` +
    `<rect x="${x + m}" y="${y + m}" width="${5 * m}" height="${5 * m}" rx="${m * 1.5}" fill="${BG}"/>` +
    `<rect x="${x + 2 * m}" y="${y + 2 * m}" width="${3 * m}" height="${3 * m}" rx="${m}" fill="${DARK}"/>`
  );
};

// ── Selo central com a logo ──
const logoPx = logoMods * MODULE;
const lx = off + ls * MODULE;
const pad = MODULE * 0.6;
const panelX = lx - pad;
const panelW = logoPx + pad * 2;
const logoB64 = readFileSync(LOGO).toString("base64");
const imgSize = panelW * 0.7;
const imgPos = panelX + (panelW - imgSize) / 2;
const centerPanel =
  `<rect x="${panelX}" y="${panelX}" width="${panelW}" height="${panelW}" rx="${MODULE * 1.8}" fill="${PANEL}" stroke="${GOLD}" stroke-width="2.5"/>` +
  `<image x="${imgPos}" y="${imgPos}" width="${imgSize}" height="${imgSize}" href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>`;

// ── Moldura dourada externa ──
const frameInset = MODULE * 1.2;
const frame = `<rect x="${frameInset}" y="${frameInset}" width="${dim - frameInset * 2}" height="${dim - frameInset * 2}" rx="${MODULE * 2.4}" fill="none" stroke="${GOLD}" stroke-width="3"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">
  <rect width="${dim}" height="${dim}" rx="${MODULE * 2.8}" fill="${BG}"/>
  ${frame}
  <g fill="${DARK}">${dots}</g>
  ${eye(finders[0].r, finders[0].c)}${eye(finders[1].r, finders[1].c)}${eye(finders[2].r, finders[2].c)}
  ${centerPanel}
</svg>
`;

writeFileSync(OUT, svg);

// Versão PNG em alta resolução (1080px) para redes sociais / impressão rápida
const PNG_OUT = join(root, "public", "qr-portfolio.png");
await sharp(Buffer.from(svg), { density: 300 })
  .resize(1080, 1080)
  .png()
  .toFile(PNG_OUT);

console.log(`✓ QR gerado:`);
console.log(`  public/qr-portfolio.svg  (vetorial — impressão)`);
console.log(`  public/qr-portfolio.png  (1080px — redes sociais)`);
console.log(`  URL: ${URL}`);
console.log(`  ${size}x${size} módulos · correção de erro: H`);
