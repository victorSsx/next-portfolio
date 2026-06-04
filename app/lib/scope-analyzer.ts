// Analisador de escopo (100% local, sem IA): compara um texto de escopo com os
// serviços oferecidos por palavras-chave/sinônimos e monta uma proposta.
import type { BudgetService, Package } from "./site-data";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Palavras-chave por id de serviço (escritas sem acento — o texto é normalizado).
// Serviços sem entrada aqui caem no fallback: o próprio título.
const KEYWORDS: Record<string, string[]> = {
  "landing-page": [
    "landing", "landing page", "pagina de vendas", "pagina de conversao", "conversao",
    "captura de lead", "captura de leads", "geracao de leads", "one page", "hotsite", "cta",
  ],
  "site-institucional": [
    "site institucional", "institucional", "site da empresa", "site para empresa", "website",
    "site profissional", "quem somos", "pagina sobre", "apresentar o negocio", "presenca digital",
  ],
  "site-com-blog": ["blog", "artigos", "posts", "noticias", "conteudo", "publicacoes"],
  "blog-site-existente": [
    "adicionar blog", "incluir blog", "ja tenho site", "site existente", "reformular blog",
    "colocar um blog", "blog no meu site", "blog no site atual", "adicionar um blog",
  ],
  "pagina-adicional": ["pagina extra", "paginas extras", "pagina adicional", "paginas adicionais", "mais paginas"],
  "loja-woocommerce": [
    "loja", "e-commerce", "ecommerce", "woocommerce", "vender online", "venda online",
    "loja virtual", "catalogo de produtos", "vender produtos",
  ],
  "produto-adicional": ["cadastro de produtos", "cadastrar produtos", "mais produtos", "produtos adicionais"],
  "seo-essencial": [
    "seo", "google", "search console", "indexacao", "aparecer no google", "buscas", "sitemap",
    "meta description", "rank math", "google analytics", "analytics",
  ],
  "performance": [
    "velocidade", "rapido", "lento", "lentidao", "performance", "pagespeed", "core web vitals",
    "otimizar velocidade", "cache", "carregamento", "site rapido",
  ],
  "seo-tecnico": ["seo tecnico", "auditoria seo", "rastreamento", "crawl", "erros de indexacao", "estrutura de links"],
  "manutencao": [
    "manutencao", "plano mensal", "mensal", "backup", "atualizacao de plugins", "seguranca",
    "monitoramento", "suporte continuo", "manter o site", "cuidar do site",
  ],
  "suporte-30": ["suporte pos-entrega", "pos entrega", "ajustes apos entrega", "garantia", "30 dias"],
  "atualizacao-site": [
    "atualizar site", "site antigo", "site desatualizado", "modernizar", "redesign", "repaginar",
    "reformular site", "site velho", "deixar moderno",
  ],
  "diagnostico-site": ["diagnostico", "analise do site", "relatorio", "auditoria", "avaliar o site", "verificar problemas"],
  "correcao-bug": [
    "bug", "erro", "corrigir", "conserto", "consertar", "quebrado", "nao funciona", "problema no site",
    "falha", "ajuste pontual", "resolver",
  ],
  "correcao-pack": ["varios bugs", "varios erros", "multiplos problemas", "varias correcoes", "lista de erros", "diversos bugs"],
};

// Detecção de quantidade para serviços com unidade ("5 páginas", "10 produtos", "3 bugs")
const QTY_PATTERNS: Record<string, RegExp> = {
  "pagina-adicional": /(\d+)\s*paginas?/,
  "produto-adicional": /(\d+)\s*produtos?/,
  "correcao-bug": /(\d+)\s*(?:bugs?|erros?|correc\w*)/,
};

export type ScopeItem = { service: BudgetService; quantity: number };
export type ScopeResult = {
  items: ScopeItem[];
  onceTotal: number;
  monthlyTotal: number;
  discount: number;
};

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Retorna um mapa { serviceId: quantidade } com os serviços que casaram no texto.
export function analyzeScope(scope: string, services: BudgetService[]): Record<string, number> {
  const text = normalize(scope);
  const selection: Record<string, number> = {};
  if (!text.trim()) return selection;

  for (const service of services) {
    const keys = KEYWORDS[service.id] || [service.title];
    const score = keys.reduce((n, k) => (text.includes(normalize(k)) ? n + 1 : n), 0);
    if (score === 0) continue;

    let qty = 1;
    const pat = QTY_PATTERNS[service.id];
    if (pat) {
      const m = text.match(pat);
      if (m) qty = Math.max(1, parseInt(m[1], 10) || 1);
    }
    selection[service.id] = qty;
  }
  return selection;
}

export function computeTotals(
  selection: Record<string, number>,
  services: BudgetService[],
  packages: Package[]
): ScopeResult {
  const items: ScopeItem[] = services
    .filter((s) => selection[s.id])
    .map((s) => ({ service: s, quantity: selection[s.id] }));

  const onceSubtotal = items.reduce(
    (t, { service, quantity }) => (service.billing === "monthly" ? t : t + service.price * quantity),
    0
  );
  const monthlyTotal = items.reduce(
    (t, { service, quantity }) => (service.billing === "once" ? t : t + service.price * quantity),
    0
  );
  const discount = packages.reduce(
    (sum, pkg) => (pkg.discount > 0 && pkg.services.every((id) => selection[id]) ? sum + pkg.discount : sum),
    0
  );
  const onceTotal = Math.max(0, onceSubtotal - discount);

  return { items, onceTotal, monthlyTotal, discount };
}

export function buildProposal(result: ScopeResult): string {
  const { items, onceTotal, monthlyTotal, discount } = result;
  if (items.length === 0) return "";

  const scopeLines = items.map(({ service }) => `• ${service.title}`).join("\n");
  const priceLines = items
    .map(({ service, quantity }) => {
      const qtyLabel = service.allowQuantity && quantity > 1 ? ` (${quantity} ${service.unitLabel || "un"})` : "";
      const monthly = service.billing === "monthly" ? "/mês" : "";
      return `• ${service.title}${qtyLabel}: ${formatBRL(service.price * quantity)}${monthly}`;
    })
    .join("\n");

  const lines = [
    "Olá! Analisei o escopo do seu projeto e já preparei uma proposta.",
    "",
    "📋 O QUE ENTENDI DO ESCOPO:",
    scopeLines,
    "",
    "💰 INVESTIMENTO:",
    priceLines,
  ];
  if (discount > 0) lines.push(`• Desconto de pacote: -${formatBRL(discount)}`);
  lines.push("");
  lines.push(
    `Total: ${formatBRL(onceTotal)}${monthlyTotal > 0 ? ` + ${formatBRL(monthlyTotal)}/mês` : ""}`
  );
  lines.push("");
  lines.push("⏱️ Prazo: a combinar conforme o escopo final (normalmente de 5 a 14 dias úteis).");
  lines.push("✅ Inclui 7 dias de ajustes grátis após a entrega.");
  lines.push("✅ Comunicação direta comigo durante todo o projeto.");
  lines.push("");
  lines.push("Posso começar assim que aprovado. Qualquer ajuste no escopo, é só falar!");

  return lines.join("\n");
}
