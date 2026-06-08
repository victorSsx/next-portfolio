// Gera o KIT DE DIVULGAÇÃO do portfólio (marca dourada/preta), via SVG -> PNG:
//  - og.png (1200x630)            : preview de link (Open Graph) para compartilhar
//  - ig-disponivel.png (1080x1350): anúncio "Disponível para projetos" (fixar no feed)
//  - ig-showcase.png (1080x1350)  : destaque de um projeto entregue
//  - ig-calculadora.png (1080x1350): promo da calculadora de orçamento
//  - ig-story-qr.png (1080x1920)  : story com QR para escanear
// Uso: node scripts/generate-social.mjs   (rode o QR antes: npm run qr)
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (p) => join(root, "public", p);
mkdirSync(pub("social"), { recursive: true });

const C = {
  black: "#080909",
  panel: "#15181a",
  gold: "#c7a447",
  goldS: "#e1b842",
  goldD: "#9f741f",
  white: "#f5f2ec",
  muted: "#b9b7b0",
};
const FONT = "'Segoe UI', Arial, sans-serif";
const SITE = "next-portfolio-navy-five-46.vercel.app";

const b64 = (p) => readFileSync(pub(p)).toString("base64");
const logoHref = `data:image/png;base64,${b64("images/logo-victor-ai-transparent.png")}`;
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function defs() {
  return `<defs>
    <radialGradient id="glow" cx="50%" cy="28%" r="65%">
      <stop offset="0%" stop-color="${C.gold}" stop-opacity="0.20"/>
      <stop offset="55%" stop-color="${C.gold}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.goldS}"/>
      <stop offset="100%" stop-color="${C.goldD}"/>
    </linearGradient>
  </defs>`;
}

function frame(w, h) {
  return `${defs()}
  <rect width="${w}" height="${h}" fill="${C.black}"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" rx="30" fill="none" stroke="${C.gold}" stroke-opacity="0.32" stroke-width="2.5"/>`;
}

function T(x, y, s, o = {}) {
  const { size = 40, weight = 400, fill = C.white, anchor = "start", spacing = 0 } = o;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(s)}</text>`;
}

function logo(cx, y, size) {
  return `<image x="${cx - size / 2}" y="${y}" width="${size}" height="${size}" href="${logoHref}" preserveAspectRatio="xMidYMid meet"/>`;
}

// pílulas de tecnologia
function chips(items, cx, y, { max = 6, gap = 14, padX = 22, h = 52, size = 24 } = {}) {
  const list = items.slice(0, max);
  const widths = list.map((s) => Math.round(s.length * size * 0.62) + padX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
  let x = cx - total / 2;
  let out = "";
  list.forEach((s, i) => {
    const w = widths[i];
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${C.gold}" stroke-opacity="0.5"/>`;
    out += `<text x="${x + w / 2}" y="${y + h / 2 + size * 0.35}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${C.muted}" text-anchor="middle">${esc(s)}</text>`;
    x += w + gap;
  });
  return out;
}

async function emit(name, svg, w, h) {
  await sharp(Buffer.from(svg), { density: 144 }).resize(w, h).png().toFile(pub(`social/${name}.png`));
  console.log(`✓ social/${name}.png  (${w}x${h})`);
}

const wrap = (svg, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;

/* ── 1) OG share card (1200x630) ─────────────────────────────────────────── */
function og() {
  const w = 1200, h = 630;
  const s = `${frame(w, h)}
  <image x="780" y="95" width="440" height="440" href="${logoHref}" preserveAspectRatio="xMidYMid meet" opacity="0.10"/>
  ${logo(132, 92, 104)}
  ${T(84, 300, "DESENVOLVEDOR WEB FREELANCER", { size: 26, weight: 800, fill: C.gold, spacing: 4 })}
  ${T(80, 410, "Victor", { size: 128, weight: 900 })}
  ${T(84, 478, "Sites, lojas e landing pages que vendem.", { size: 36, weight: 500, fill: C.muted })}
  ${T(84, 552, SITE, { size: 27, weight: 700, fill: C.gold })}`;
  return wrap(s, w, h);
}

/* ── 2) "Disponível para projetos" (1080x1350) ───────────────────────────── */
function disponivel() {
  const w = 1080, h = 1350, cx = w / 2;
  const s = `${frame(w, h)}
  ${logo(cx, 150, 150)}
  ${T(cx, 380, "VICTOR · DESENVOLVEDOR WEB", { size: 30, weight: 800, fill: C.gold, anchor: "middle", spacing: 5 })}
  ${T(cx, 620, "DISPONÍVEL", { size: 150, weight: 900, fill: "url(#gold)", anchor: "middle" })}
  ${T(cx, 740, "PARA PROJETOS", { size: 96, weight: 900, anchor: "middle" })}
  <rect x="${cx - 90}" y="800" width="180" height="4" rx="2" fill="${C.gold}"/>
  ${T(cx, 900, "Sites · Lojas · Landing pages · SEO", { size: 38, weight: 500, fill: C.muted, anchor: "middle" })}
  ${T(cx, 1180, "Monte seu orçamento sem compromisso", { size: 36, weight: 700, anchor: "middle" })}
  ${T(cx, 1240, "Portfólio no link da bio  →", { size: 34, weight: 800, fill: C.gold, anchor: "middle" })}`;
  return wrap(s, w, h);
}

/* ── 3) Showcase de projeto (1080x1350) ──────────────────────────────────── */
function showcase() {
  const w = 1080, h = 1350;
  const data = JSON.parse(readFileSync(join(root, "app", "data", "site-data.json"), "utf8"));
  const proj = (data.projects || []).find(
    (p) => typeof p.mainImage?.src === "string" && p.mainImage.src.startsWith("/projects/") && existsSync(pub(p.mainImage.src.replace(/^\//, "")))
  );
  const imgHref = proj ? `data:image/png;base64,${b64(proj.mainImage.src.replace(/^\//, ""))}` : logoHref;
  const title = proj?.title || "Projeto entregue";
  const stack = Array.isArray(proj?.stack) ? proj.stack : ["WordPress", "Elementor", "SEO"];
  // moldura da imagem
  const ix = 80, iy = 240, iw = 920, ih = 600, r = 18;
  const s = `${frame(w, h)}
  <defs><clipPath id="shot"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${r}"/></clipPath></defs>
  ${logo(80 + 38, 96, 76)}
  ${T(176, 150, "PROJETO ENTREGUE", { size: 30, weight: 800, fill: C.gold, spacing: 4 })}
  <image x="${ix}" y="${iy}" width="${iw}" height="${ih}" href="${imgHref}" preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)"/>
  <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${r}" fill="none" stroke="${C.gold}" stroke-opacity="0.45" stroke-width="2"/>
  ${T(80, 960, title.length > 34 ? title.slice(0, 33) + "…" : title, { size: 52, weight: 900 })}
  ${chips(stack, w / 2, 1030, { max: 5 })}
  ${T(w / 2, 1240, "Veja mais no portfólio · link na bio  →", { size: 32, weight: 800, fill: C.gold, anchor: "middle" })}`;
  return wrap(s, w, h);
}

/* ── 4) Promo da calculadora (1080x1350) ─────────────────────────────────── */
function calculadora() {
  const w = 1080, h = 1350, cx = w / 2;
  // mini "card de orçamento"
  const px = 140, py = 560, pw = 800, ph = 360;
  const row = (y, label, val) =>
    `${T(px + 44, y, label, { size: 32, weight: 600, fill: C.muted })}${T(px + pw - 44, y, val, { size: 32, weight: 800, anchor: "end" })}`;
  const s = `${frame(w, h)}
  ${logo(cx, 130, 130)}
  ${T(cx, 350, "ORÇAMENTO NA HORA", { size: 30, weight: 800, fill: C.gold, anchor: "middle", spacing: 5 })}
  ${T(cx, 450, "MONTE SEU ORÇAMENTO", { size: 66, weight: 900, anchor: "middle" })}
  ${T(cx, 525, "EM SEGUNDOS", { size: 66, weight: 900, fill: "url(#gold)", anchor: "middle" })}
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="20" fill="${C.panel}" stroke="${C.gold}" stroke-opacity="0.35" stroke-width="2"/>
  ${row(py + 90, "Site institucional", "R$ 900")}
  ${row(py + 160, "SEO essencial", "R$ 350")}
  <rect x="${px + 44}" y="${py + 195}" width="${pw - 88}" height="1.5" fill="${C.gold}" fill-opacity="0.3"/>
  ${T(px + 44, py + 270, "Total estimado", { size: 36, weight: 800 })}
  ${T(px + pw - 44, py + 272, "R$ 1.250", { size: 46, weight: 900, fill: C.goldS, anchor: "end" })}
  ${T(cx, 1050, "Escolha os serviços e veja o preço.", { size: 38, weight: 500, fill: C.muted, anchor: "middle" })}
  ${T(cx, 1100, "Sem compromisso.", { size: 38, weight: 500, fill: C.muted, anchor: "middle" })}
  ${T(cx, 1240, "Calcule agora · link na bio  →", { size: 34, weight: 800, fill: C.gold, anchor: "middle" })}`;
  return wrap(s, w, h);
}

/* ── 5) Story com QR (1080x1920) ─────────────────────────────────────────── */
function storyQr() {
  const w = 1080, h = 1920, cx = w / 2;
  // QR claro (escuro no claro) = escaneável em qualquer leitor, inclusive os antigos.
  const qrFile = existsSync(pub("qr-portfolio.png"))
    ? "qr-portfolio.png"
    : existsSync(pub("qr-portfolio-dark.png"))
      ? "qr-portfolio-dark.png"
      : null;
  const qr = qrFile ? `data:image/png;base64,${b64(qrFile)}` : logoHref;
  const qs = 660, qx = cx - qs / 2, qy = 720;
  const s = `${frame(w, h)}
  ${logo(cx, 230, 150)}
  ${T(cx, 470, "VICTOR · DESENVOLVEDOR WEB", { size: 30, weight: 800, fill: C.gold, anchor: "middle", spacing: 5 })}
  ${T(cx, 600, "Escaneie e veja", { size: 64, weight: 900, anchor: "middle" })}
  ${T(cx, 675, "meu portfólio", { size: 64, weight: 900, fill: "url(#gold)", anchor: "middle" })}
  <rect x="${qx - 26}" y="${qy - 26}" width="${qs + 52}" height="${qs + 52}" rx="36" fill="${C.white}"/>
  <image x="${qx}" y="${qy}" width="${qs}" height="${qs}" href="${qr}" preserveAspectRatio="xMidYMid meet"/>
  ${T(cx, 1530, "Sites · Lojas · Landing pages · SEO", { size: 36, weight: 500, fill: C.muted, anchor: "middle" })}
  ${T(cx, 1640, "ou acesse pelo link da bio", { size: 34, weight: 700, fill: C.gold, anchor: "middle" })}`;
  return wrap(s, w, h);
}

await emit("og", og(), 1200, 630);
await emit("ig-disponivel", disponivel(), 1080, 1350);
await emit("ig-showcase", showcase(), 1080, 1350);
await emit("ig-calculadora", calculadora(), 1080, 1350);
await emit("ig-story-qr", storyQr(), 1080, 1920);
console.log("\nKit de divulgação gerado em public/social/");
