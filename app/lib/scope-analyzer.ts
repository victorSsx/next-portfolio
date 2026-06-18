// Analisador de escopo (100% local, sem IA): compara um texto de escopo com os
// serviços oferecidos por palavras-chave/sinônimos e monta uma proposta.
import type { BudgetService, Package } from "./site-data";
import { VITRINE_URL } from "./site-url";

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

// Gancho por serviço principal — vira a 1a linha (faz o cliente parar e ler).
// Serviço sem entrada cai num gancho genérico com o próprio título.
const HOOK_BY_ID: Record<string, string> = {
  "loja-woocommerce": "Sua loja virtual pronta pra vender e aparecer no Google.",
  "site-institucional": "Seu site profissional pronto pra passar credibilidade e gerar contatos.",
  "site-com-blog": "Seu site com blog pra crescer no Google e atrair clientes todo mês.",
  "landing-page": "Uma página feita pra transformar visitantes em clientes.",
  "atualizacao-site": "Seu site antigo modernizado, rápido e funcionando como novo.",
  "diagnostico-site": "Vou achar exatamente o que está travando o seu site.",
  "correcao-bug": "Seu site funcionando direito, sem aquele erro atrapalhando.",
  "correcao-pack": "Todos aqueles problemas do site resolvidos de uma vez.",
  "seo-tecnico": "Seu site destravado pra subir nas buscas do Google.",
  "seo-essencial": "Seu site configurado pro Google encontrar e mostrar nas buscas.",
  performance: "Seu site voando no celular, sem perder visita por lentidão.",
  manutencao: "Seu site sempre no ar, atualizado e seguro, sem dor de cabeça.",
};

// Pergunta de fechamento conforme a categoria do serviço principal.
const QUESTION_DEFAULT =
  "Pra eu fechar os detalhes: você já tem os textos e as imagens, ou quer que eu cuide disso também?";
const QUESTION_BY_CATEGORY: Record<string, string> = {
  ecommerce: "Pra fechar os detalhes: você já tem as fotos e descrições dos produtos prontas?",
  sites: "Pra fechar os detalhes: você já tem os textos e as imagens, ou quer que eu ajude com isso?",
  seo: "Me passa o endereço do site atual pra eu já dar uma olhada no que dá pra melhorar?",
  diagnostico: "Qual o endereço do site e o principal problema que você está vendo hoje?",
  suporte: "Seu site é em WordPress? Me conta a plataforma que eu já adianto o setup.",
};

// Monta uma proposta CURTA pronta pra enviar ao cliente (fallback sem IA).
// Mesma estrutura da proposta por IA: gancho, apresentação + prova social,
// o que recebe, valor fechado, pergunta e link. vitrineUrl vazio some o link.
export function buildProposal(result: ScopeResult, vitrineUrl: string = VITRINE_URL): string {
  const { items, onceTotal, monthlyTotal, discount } = result;
  if (items.length === 0) return "";

  // Serviço principal = maior valor único (ou o primeiro item, se só houver mensais).
  const primary =
    [...items]
      .filter((i) => i.service.billing !== "monthly")
      .sort((a, b) => b.service.price * b.quantity - a.service.price * a.quantity)[0] || items[0];

  const hook =
    HOOK_BY_ID[primary.service.id] || `${primary.service.title}: montei uma proposta enxuta pra você.`;

  // "O que você recebe" numa linha só, sem fragmentar o preço.
  const includes = items
    .map(({ service, quantity }) =>
      service.allowQuantity && quantity > 1 ? `${quantity} ${service.unitLabel || "un"}` : service.title
    )
    .join(", ");

  const monthlyLine = monthlyTotal > 0 ? ` + ${formatBRL(monthlyTotal)}/mês` : "";
  const discountNote = discount > 0 ? " (já com desconto de pacote)" : "";
  const question = QUESTION_BY_CATEGORY[primary.service.category] || QUESTION_DEFAULT;

  const valueLine =
    onceTotal > 0
      ? `Valor fechado: ${formatBRL(onceTotal)}${monthlyLine}${discountNote}, em 5 a 14 dias úteis, com 7 dias de ajustes grátis.`
      : `Valor fechado: ${formatBRL(monthlyTotal)}/mês (plano recorrente), com ajustes e suporte inclusos.`;

  const lines = [
    hook,
    "Sou o Victor, dev freelancer de sites, WordPress, lojas e SEO — nota 5★ na Workana, com clientes que voltam a contratar e dedicação total em cada projeto.",
    `O que você recebe: ${includes}.`,
    valueLine,
    question,
  ];
  if (vitrineUrl) {
    lines.push(
      `Meu portfólio e orçamentador: ${vitrineUrl} (é só portfólio/orçamento — combinação, contrato e pagamento seguem por aqui pela plataforma).`
    );
  }

  return lines.join("\n");
}
