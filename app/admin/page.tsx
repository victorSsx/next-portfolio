"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  siteData as defaultSiteData,
  type AvailabilityStatus,
  type BudgetService,
  type ContentI18n,
  type Coupon,
  type DeviceView,
  type FreeTool,
  type Lead,
  type PaymentLink,
  type PendingTestimonial,
  type Project,
  type ProjectImage,
  type ProjectVideo,
  type SiteData,
  type Testimonial,
} from "../lib/site-data";
import { analyzeScope, buildProposal, computeTotals, formatBRL } from "../lib/scope-analyzer";

type AdminTab =
  | "projects"
  | "services"
  | "categories"
  | "technologies"
  | "testimonials"
  | "freetools"
  | "pagamentos"
  | "analise"
  | "leads"
  | "consultor";
type SaveStatus = "idle" | "loading" | "saving" | "uploading" | "saved" | "error";
type UploadKind = "main-image" | "gallery" | "video" | "video-poster";
type DeviceViewDevice = "tablet" | "mobile";
type UploadPayload = {
  asset?: { src: string };
  error?: string;
};

const cloneSiteData = () => structuredClone(defaultSiteData) as SiteData;

const linesToArray = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToLines = (items?: string[]) => (items || []).join("\n");

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
const maxImageUploadBytes = 8 * 1024 * 1024;
const maxVideoUploadBytes = 4 * 1024 * 1024;
const uploadTimeoutMs = 60000;

const formatFileSize = (bytes: number) => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toLocaleString("pt-BR", { maximumFractionDigits: mb >= 10 ? 0 : 1 })} MB`;
};

const getProjectVideos = (project?: Project | null): ProjectVideo[] => {
  if (!project) return [];
  if (project.videos?.length) return project.videos;
  return project.video?.src ? [project.video] : [];
};

const createProject = (): Project => ({
  id: makeId("projeto"),
  title: "Novo projeto",
  category: "Landing Page",
  status: "Projeto em fase final / ainda não hospedado",
  stack: [],
  summary: "",
  workDone: [],
  mainImage: { src: "", alt: "" },
  gallery: [],
});

const createService = (category: string): BudgetService => ({
  id: makeId("servico"),
  category,
  title: "Novo serviço",
  price: 0,
  billing: "once",
  summary: "",
  details: [],
});

const DEFAULT_PROJECT_STATS = [
  { value: 10, suffix: "+" },
  { value: 5, suffix: "+" },
  { value: 100, suffix: "%" },
];
const PROJECT_STAT_LABELS = ["Projetos entregues", "Segmentos atendidos", "Entregas no prazo"];

const createFreeTool = (): FreeTool => ({
  id: makeId("sistema"),
  name: "Novo sistema",
  description: "",
  url: "",
  icon: "✦",
  tag: "",
});

const createPaymentLink = (): PaymentLink => ({
  id: makeId("pay"),
  label: "Pagar sinal (PIX / cartão)",
  url: "",
  region: "br",
  note: "",
});

// Bandeira do país por código ISO (imagens flagcdn).
const flagUrl = (code?: string): string | null =>
  code && /^[a-zA-Z]{2}$/.test(code) ? `https://flagcdn.com/${code.toLowerCase()}.svg` : null;

// Desconto (%) do cupom gerado quando um depoimento é aprovado.
const REVIEW_COUPON_PERCENT = 10;

// Gera um código de cupom legível, ex: OBRIGADO-7K2P (sem caracteres ambíguos).
const generateCouponCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `OBRIGADO-${suffix}`;
};

// Monta um link clicável a partir do contato do lead (e-mail ou WhatsApp/telefone).
const leadContactHref = (contact: string): string | null => {
  const c = contact.trim();
  if (c.includes("@")) return `mailto:${c}`;
  const digits = c.replace(/\D/g, "");
  if (digits.length >= 10) return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
  return null;
};

// Renderização leve de markdown (negrito, listas, quebras) — conteúdo vem da IA, atrás da senha do admin.
const renderAdvisor = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,6}\s*(.+)$/gm, "<strong>$1</strong>")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n/g, "<br/>");

type NewServiceSuggestion = {
  tempId: string;
  title: string;
  price: number;
  billing: "once" | "monthly";
  summary: string;
  category: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [data, setData] = useState<SiteData>(() => cloneSiteData());
  const [activeProjectId, setActiveProjectId] = useState(defaultSiteData.projects[0]?.id || "");
  const [activeServiceId, setActiveServiceId] = useState(defaultSiteData.services[0]?.id || "");
  const [uploadingKey, setUploadingKey] = useState("");
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});
  const [confirmDeleteTestimonialId, setConfirmDeleteTestimonialId] = useState<string | null>(null);
  const [scopeText, setScopeText] = useState("");
  const [scopeSelection, setScopeSelection] = useState<Record<string, number>>({});
  const [scopeAnalyzed, setScopeAnalyzed] = useState(false);
  const [scopeCopied, setScopeCopied] = useState(false);
  const [aiProposal, setAiProposal] = useState<string | null>(null);
  const [questionsText, setQuestionsText] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNewServices, setAiNewServices] = useState<NewServiceSuggestion[]>([]);
  const [advisorText, setAdvisorText] = useState("");
  const [advisorSources, setAdvisorSources] = useState<{ title: string; uri: string }[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState("");
  const [advisorError, setAdvisorError] = useState("");
  const [advisorQuestion, setAdvisorQuestion] = useState("");
  const [advisorPrices, setAdvisorPrices] = useState("");
  const [translating, setTranslating] = useState(false);

  const activeProject = useMemo(
    () => data.projects.find((p) => p.id === activeProjectId) || data.projects[0],
    [activeProjectId, data.projects]
  );

  const activeService = useMemo(
    () => data.services.find((s) => s.id === activeServiceId) || data.services[0],
    [activeServiceId, data.services]
  );

  const activeProjectVideos = useMemo(() => getProjectVideos(activeProject), [activeProject]);

  const previewFor = (src?: string) => (src ? assetPreviews[src] || src : "");

  const rememberPreview = (src: string, file: File) => {
    const url = URL.createObjectURL(file);
    setAssetPreviews((cur) => ({ ...cur, [src]: url }));
  };

  // ── Project helpers ──────────────────────────────────────────────────────────

  const updateProject = (id: string, update: Partial<Project>) => {
    setData((cur) => ({
      ...cur,
      projects: cur.projects.map((p) => (p.id === id ? { ...p, ...update } : p)),
    }));
  };

  const updateProjectId = (id: string, nextId: string) => {
    updateProject(id, { id: nextId });
    setActiveProjectId(nextId);
  };

  const updateProjectVideos = (id: string, videos: ProjectVideo[]) => {
    updateProject(id, { video: videos[0], videos });
  };

  const updateVideoItem = (index: number, update: Partial<ProjectVideo>) => {
    if (!activeProject) return;
    updateProjectVideos(
      activeProject.id,
      activeProjectVideos.map((v, i) => (i === index ? { ...v, ...update } : v))
    );
  };

  const removeVideoItem = (index: number) => {
    if (!activeProject) return;
    updateProjectVideos(
      activeProject.id,
      activeProjectVideos.filter((_, i) => i !== index)
    );
  };

  const updateGalleryItem = (index: number, update: Partial<ProjectImage>) => {
    if (!activeProject) return;
    updateProject(activeProject.id, {
      gallery: activeProject.gallery.map((img, i) => (i === index ? { ...img, ...update } : img)),
    });
  };

  const removeGalleryItem = (index: number) => {
    if (!activeProject) return;
    updateProject(activeProject.id, {
      gallery: activeProject.gallery.filter((_, i) => i !== index),
    });
  };

  // ── Device view helpers ──────────────────────────────────────────────────────

  const getDeviceView = (device: DeviceViewDevice): DeviceView | undefined =>
    activeProject?.deviceViews?.find((dv) => dv.device === device);

  const updateDeviceViews = (id: string, deviceViews: DeviceView[]) => {
    updateProject(id, { deviceViews: deviceViews.length ? deviceViews : undefined });
  };

  const addDeviceView = (device: DeviceViewDevice) => {
    if (!activeProject) return;
    const existing = activeProject.deviceViews || [];
    if (existing.some((dv) => dv.device === device)) return;
    updateDeviceViews(activeProject.id, [...existing, { device, images: [], videos: [] }]);
  };

  const removeDeviceView = (device: DeviceViewDevice) => {
    if (!activeProject) return;
    updateDeviceViews(
      activeProject.id,
      (activeProject.deviceViews || []).filter((dv) => dv.device !== device)
    );
  };

  const updateDeviceViewImage = (device: DeviceViewDevice, index: number, update: Partial<ProjectImage>) => {
    if (!activeProject) return;
    const views = activeProject.deviceViews || [];
    updateDeviceViews(
      activeProject.id,
      views.map((dv) =>
        dv.device !== device
          ? dv
          : { ...dv, images: dv.images.map((img, i) => (i === index ? { ...img, ...update } : img)) }
      )
    );
  };

  const removeDeviceViewImage = (device: DeviceViewDevice, index: number) => {
    if (!activeProject) return;
    const views = activeProject.deviceViews || [];
    updateDeviceViews(
      activeProject.id,
      views.map((dv) =>
        dv.device !== device ? dv : { ...dv, images: dv.images.filter((_, i) => i !== index) }
      )
    );
  };

  const updateDeviceViewVideo = (device: DeviceViewDevice, index: number, update: Partial<ProjectVideo>) => {
    if (!activeProject) return;
    const views = activeProject.deviceViews || [];
    updateDeviceViews(
      activeProject.id,
      views.map((dv) =>
        dv.device !== device
          ? dv
          : { ...dv, videos: (dv.videos || []).map((v, i) => (i === index ? { ...v, ...update } : v)) }
      )
    );
  };

  const removeDeviceViewVideo = (device: DeviceViewDevice, index: number) => {
    if (!activeProject) return;
    const views = activeProject.deviceViews || [];
    updateDeviceViews(
      activeProject.id,
      views.map((dv) =>
        dv.device !== device ? dv : { ...dv, videos: (dv.videos || []).filter((_, i) => i !== index) }
      )
    );
  };

  // ── Upload helpers ───────────────────────────────────────────────────────────

  const uploadFile = async (project: Project, file: File, kind: UploadKind, key: string) => {
    const isVideo = kind === "video";
    const maxSize = isVideo ? maxVideoUploadBytes : maxImageUploadBytes;

    if (file.size > maxSize) {
      setStatus("error");
      setMessage(
        isVideo
          ? `Esse video tem ${formatFileSize(file.size)}. Para upload direto na Vercel, envie um MP4 comprimido de ate ${formatFileSize(maxSize)}.`
          : `Essa imagem tem ${formatFileSize(file.size)}. Envie uma imagem de ate ${formatFileSize(maxSize)}.`
      );
      setUploadingKey("");
      return null;
    }

    setStatus("uploading");
    setMessage("Enviando arquivo. Aguarde alguns segundos.");
    setUploadingKey(key);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    formData.append("projectId", project.id);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), uploadTimeoutMs);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
        signal: controller.signal,
      });
      const text = await response.text();
      let payload: UploadPayload = {};
      try {
        payload = text ? (JSON.parse(text) as UploadPayload) : {};
      } catch {
        payload = {};
      }
      if (!response.ok || !payload.asset?.src) {
        throw new Error(payload.error || text || "Nao foi possivel enviar o arquivo.");
      }
      setStatus("saved");
      setMessage("Arquivo enviado. Clique em Salvar alteracoes para publicar no site.");
      return payload.asset.src;
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "O upload demorou demais e foi cancelado. Tente um arquivo menor."
          : error instanceof Error
            ? error.message
            : "Nao foi possivel enviar o arquivo."
      );
      return null;
    } finally {
      window.clearTimeout(timeout);
      setUploadingKey("");
    }
  };

  const uploadMainImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const src = await uploadFile(activeProject, file, "main-image", "main-image");
    if (src) {
      rememberPreview(src, file);
      updateProject(activeProject.id, {
        mainImage: { src, alt: activeProject.mainImage.alt || `${activeProject.title} - imagem principal` },
      });
    }
    event.target.value = "";
  };

  const uploadVideo = async (event: ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const isReplacing = typeof index === "number";
    const src = await uploadFile(activeProject, file, "video", isReplacing ? `video-${index}` : "video-new");
    if (src) {
      rememberPreview(src, file);
      const next: ProjectVideo = {
        src,
        poster: activeProject.mainImage.src,
        label: `Video demo ${isReplacing ? index + 1 : activeProjectVideos.length + 1} de ${activeProject.title}`,
      };
      updateProjectVideos(
        activeProject.id,
        isReplacing
          ? activeProjectVideos.map((v, i) =>
              i === index ? { ...v, src, label: v.label || next.label, poster: v.poster || next.poster } : v
            )
          : [...activeProjectVideos, next]
      );
    }
    event.target.value = "";
  };

  const uploadVideoPoster = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const src = await uploadFile(activeProject, file, "video-poster", `video-poster-${index}`);
    if (src) {
      rememberPreview(src, file);
      updateVideoItem(index, { poster: src });
    }
    event.target.value = "";
  };

  const uploadGalleryImage = async (event: ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const isReplacing = typeof index === "number";
    const src = await uploadFile(activeProject, file, "gallery", isReplacing ? `gallery-${index}` : "gallery-new");
    if (src) {
      rememberPreview(src, file);
      if (isReplacing) {
        updateProject(activeProject.id, {
          gallery: activeProject.gallery.map((img, i) => (i === index ? { ...img, src } : img)),
        });
      } else {
        updateProject(activeProject.id, {
          gallery: [
            ...activeProject.gallery,
            { src, alt: `${activeProject.title} - print do projeto`, label: `Print ${activeProject.gallery.length + 1}` },
          ],
        });
      }
    }
    event.target.value = "";
  };

  const uploadDeviceImage = async (
    event: ChangeEvent<HTMLInputElement>,
    device: DeviceViewDevice,
    index?: number
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const isReplacing = typeof index === "number";
    const key = isReplacing ? `dv-${device}-img-${index}` : `dv-${device}-img-new`;
    const src = await uploadFile(activeProject, file, "gallery", key);
    if (src) {
      rememberPreview(src, file);
      const proj = activeProject;
      const views = proj.deviceViews || [];
      if (isReplacing) {
        updateDeviceViews(
          proj.id,
          views.map((dv) =>
            dv.device !== device ? dv : { ...dv, images: dv.images.map((img, i) => (i === index ? { ...img, src } : img)) }
          )
        );
      } else {
        updateDeviceViews(
          proj.id,
          views.map((dv) =>
            dv.device !== device
              ? dv
              : {
                  ...dv,
                  images: [
                    ...dv.images,
                    { src, alt: `${proj.title} - vista ${device}`, label: `${device} ${dv.images.length + 1}` },
                  ],
                }
          )
        );
      }
    }
    event.target.value = "";
  };

  const uploadDeviceVideo = async (
    event: ChangeEvent<HTMLInputElement>,
    device: DeviceViewDevice,
    index?: number
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const isReplacing = typeof index === "number";
    const key = isReplacing ? `dv-${device}-vid-${index}` : `dv-${device}-vid-new`;
    const src = await uploadFile(activeProject, file, "video", key);
    if (src) {
      rememberPreview(src, file);
      const proj = activeProject;
      const views = proj.deviceViews || [];
      if (isReplacing) {
        updateDeviceViews(
          proj.id,
          views.map((dv) =>
            dv.device !== device
              ? dv
              : { ...dv, videos: (dv.videos || []).map((v, i) => (i === index ? { ...v, src } : v)) }
          )
        );
      } else {
        updateDeviceViews(
          proj.id,
          views.map((dv) =>
            dv.device !== device
              ? dv
              : {
                  ...dv,
                  videos: [
                    ...(dv.videos || []),
                    { src, poster: proj.mainImage.src, label: `Video ${device} de ${proj.title}` },
                  ],
                }
          )
        );
      }
    }
    event.target.value = "";
  };

  // ── Service helpers ──────────────────────────────────────────────────────────

  const updateService = (id: string, update: Partial<BudgetService>) => {
    setData((cur) => ({
      ...cur,
      services: cur.services.map((s) => (s.id === id ? { ...s, ...update } : s)),
    }));
  };

  const updateServiceId = (id: string, nextId: string) => {
    updateService(id, { id: nextId });
    setActiveServiceId(nextId);
  };

  // ── Project stats helpers ──────────────────────────────────────────────────────

  const projectStats = data.projectStats ?? DEFAULT_PROJECT_STATS;

  const updateProjectStat = (index: number, patch: Partial<{ value: number; suffix: string }>) => {
    setData((cur) => {
      const base = cur.projectStats ?? DEFAULT_PROJECT_STATS;
      return {
        ...cur,
        projectStats: base.map((s, i) => (i === index ? { ...s, ...patch } : s)),
      };
    });
  };

  // ── Free tools helpers ─────────────────────────────────────────────────────────

  const updateFreeTool = (id: string, patch: Partial<FreeTool>) => {
    setData((cur) => ({
      ...cur,
      freeTools: (cur.freeTools ?? []).map((tool) => (tool.id === id ? { ...tool, ...patch } : tool)),
    }));
  };

  const removeFreeTool = (id: string) => {
    setData((cur) => ({
      ...cur,
      freeTools: (cur.freeTools ?? []).filter((tool) => tool.id !== id),
    }));
  };

  const addFreeTool = () => {
    setData((cur) => ({ ...cur, freeTools: [...(cur.freeTools ?? []), createFreeTool()] }));
  };

  // ── Payment links helpers ──────────────────────────────────────────────────────

  const updatePaymentLink = (id: string, patch: Partial<PaymentLink>) => {
    setData((cur) => ({
      ...cur,
      paymentLinks: (cur.paymentLinks ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const removePaymentLink = (id: string) => {
    setData((cur) => ({
      ...cur,
      paymentLinks: (cur.paymentLinks ?? []).filter((p) => p.id !== id),
    }));
  };

  const addPaymentLink = () => {
    setData((cur) => ({ ...cur, paymentLinks: [...(cur.paymentLinks ?? []), createPaymentLink()] }));
  };

  // ── Scope analyzer helpers ─────────────────────────────────────────────────────

  const scopeResult = useMemo(
    () => computeTotals(scopeSelection, data.services, data.packages ?? []),
    [scopeSelection, data.services, data.packages]
  );
  const scopeProposal = useMemo(() => buildProposal(scopeResult), [scopeResult]);

  const runScopeAnalysis = () => {
    setScopeSelection(analyzeScope(scopeText, data.services));
    setScopeAnalyzed(true);
    setScopeCopied(false);
    setAiProposal(null);
    setAiError("");
    setAiNewServices([]);
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setScopeCopied(false);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({
          scope: scopeText,
          services: data.services,
          packages: data.packages ?? [],
          categories: data.serviceCategories,
        }),
      });
      const json = (await res.json()) as {
        services?: { id: string; quantity: number }[];
        newServices?: { title: string; price: number; billing: string; summary: string; category: string }[];
        proposal?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erro ao analisar com IA.");
      const selection: Record<string, number> = {};
      (json.services ?? []).forEach((s) => {
        if (data.services.some((x) => x.id === s.id)) selection[s.id] = Math.max(1, s.quantity || 1);
      });
      setScopeSelection(selection);
      setAiProposal(json.proposal && json.proposal.trim() ? json.proposal : null);
      setAiNewServices(
        (json.newServices ?? []).map((s, i) => ({
          tempId: `ns-${Date.now()}-${i}`,
          title: s.title,
          price: Number(s.price) || 0,
          billing: s.billing === "monthly" ? "monthly" : "once",
          summary: s.summary || "",
          category: s.category || "",
        }))
      );
      setScopeAnalyzed(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erro ao analisar com IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleScopeService = (id: string) => {
    setAiProposal(null);
    setScopeSelection((cur) => {
      const next = { ...cur };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setScopeQty = (id: string, qty: number) => {
    setAiProposal(null);
    setScopeSelection((cur) => ({ ...cur, [id]: Math.max(1, qty || 1) }));
  };

  const copyProposal = async () => {
    try {
      await navigator.clipboard.writeText(aiProposal ?? scopeProposal);
      setScopeCopied(true);
      setTimeout(() => setScopeCopied(false), 2000);
    } catch {
      // clipboard indisponível — ignore
    }
  };

  const runQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError("");
    setQuestionsCopied(false);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ scope: scopeText }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar perguntas.");
      setQuestionsText(json.message && json.message.trim() ? json.message : null);
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Erro ao gerar perguntas.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const copyQuestions = async () => {
    if (!questionsText) return;
    try {
      await navigator.clipboard.writeText(questionsText);
      setQuestionsCopied(true);
      setTimeout(() => setQuestionsCopied(false), 2000);
    } catch {
      // clipboard indisponível — ignore
    }
  };

  const acceptNewService = (s: NewServiceSuggestion) => {
    const category =
      s.category && data.serviceCategories.some((c) => c.id === s.category)
        ? s.category
        : data.serviceCategories[0]?.id || "sites";
    const newSvc: BudgetService = {
      id: makeId("servico"),
      category,
      title: s.title,
      price: s.price,
      billing: s.billing,
      summary: s.summary,
      details: [],
    };
    setData((cur) => ({ ...cur, services: [...cur.services, newSvc] }));
    setScopeSelection((cur) => ({ ...cur, [newSvc.id]: 1 }));
    setAiProposal(null);
    setAiNewServices((cur) => cur.filter((x) => x.tempId !== s.tempId));
    setStatus("saved");
    setMessage("Serviço criado e adicionado ao orçamento. Clique em Salvar alterações para publicar na sua grade.");
  };

  const rejectNewService = (tempId: string) => {
    setAiNewServices((cur) => cur.filter((x) => x.tempId !== tempId));
  };

  const runAdvisor = async (mode: "pricing" | "innovation" | "ask") => {
    if (mode === "ask" && !advisorQuestion.trim()) return;
    setAdvisorLoading(mode);
    setAdvisorError("");
    try {
      const res = await fetch("/api/admin/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({
          mode,
          question: advisorQuestion,
          pastedPrices: advisorPrices,
          services: data.services,
          packages: data.packages ?? [],
        }),
      });
      const json = (await res.json()) as {
        text?: string;
        sources?: { title: string; uri: string }[];
        error?: string;
      };
      if (!res.ok || !json.text) throw new Error(json.error || "Erro ao consultar a IA.");
      setAdvisorText(json.text);
      setAdvisorSources(json.sources ?? []);
    } catch (err) {
      setAdvisorError(err instanceof Error ? err.message : "Erro ao consultar a IA.");
      setAdvisorText("");
      setAdvisorSources([]);
    } finally {
      setAdvisorLoading("");
    }
  };

  const removeLead = (id: string) => {
    setData((cur) => ({ ...cur, leads: (cur.leads ?? []).filter((l) => l.id !== id) }));
    setStatus("saved");
    setMessage("Pedido removido. Clique em Salvar alterações para publicar.");
  };

  // Vincula/altera o projeto de um depoimento (pendente ou publicado).
  const setTestimonialProject = (id: string, projectId: string) => {
    const apply = <T extends { id: string; projectId?: string }>(list: T[]) =>
      list.map((x) => (x.id === id ? { ...x, projectId: projectId || undefined } : x));
    setData((cur) => ({
      ...cur,
      testimonials: apply(cur.testimonials ?? []),
      pendingTestimonials: apply(cur.pendingTestimonials ?? []),
    }));
  };

  // ── API calls ────────────────────────────────────────────────────────────────

  const loadData = async () => {
    setStatus("loading");
    setMessage("");
    const response = await fetch("/api/admin/data", { headers: { "x-admin-password": password } });
    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Não foi possível entrar.");
      return;
    }
    setData(payload.data);
    setActiveProjectId(payload.data.projects[0]?.id || "");
    setActiveServiceId(payload.data.services[0]?.id || "");
    setIsUnlocked(true);
    setStatus("idle");
  };

  const saveData = async () => {
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ data }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Não foi possível salvar.");
      return;
    }
    setStatus("saved");
    setMessage(
      payload.mode === "github" ? "Salvo no GitHub. A Vercel vai publicar o deploy." : "Salvo no arquivo local."
    );
  };

  // Traduz o conteúdo (PT → EN/ES) por IA e preenche os campos i18n. Depois é só Salvar.
  const runContentTranslation = async () => {
    const items: { id: string; fields: Record<string, string | string[]> }[] = [];
    const push = (id: string, fields: Record<string, string | string[] | undefined>) => {
      const clean: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (typeof v === "string" && v.trim()) clean[k] = v;
        else if (Array.isArray(v) && v.length) clean[k] = v;
      }
      if (Object.keys(clean).length) items.push({ id, fields: clean });
    };

    (data.projects ?? []).forEach((p) =>
      push(`project:${p.id}`, { title: p.title, category: p.category, summary: p.summary, status: p.status, workDone: p.workDone })
    );
    (data.services ?? []).forEach((s) =>
      push(`service:${s.id}`, { title: s.title, summary: s.summary, details: s.details, unitLabel: s.unitLabel })
    );
    (data.packages ?? []).forEach((p) =>
      push(`package:${p.id}`, { title: p.title, description: p.description, tag: p.tag })
    );
    (data.freeTools ?? []).forEach((tl) =>
      push(`tool:${tl.id}`, { name: tl.name, description: tl.description, tag: tl.tag })
    );
    (data.serviceCategories ?? []).forEach((c) => push(`cat:${c.id}`, { label: c.label }));

    if (!items.length) {
      setStatus("error");
      setMessage("Nada para traduzir.");
      return;
    }

    setTranslating(true);
    setStatus("loading");
    setMessage("Traduzindo conteúdo com IA (PT → EN/ES). Pode levar alguns segundos…");
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ items, langs: ["en", "es"] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha na tradução.");
      const translations: Record<string, ContentI18n> = json.translations || {};

      const apply = <T extends { id: string; i18n?: ContentI18n }>(arr: T[], prefix: string): T[] =>
        arr.map((it) => {
          const tr = translations[`${prefix}:${it.id}`];
          return tr ? { ...it, i18n: { ...(it.i18n ?? {}), ...tr } } : it;
        });

      setData((cur) => ({
        ...cur,
        projects: apply(cur.projects, "project"),
        services: apply(cur.services, "service"),
        serviceCategories: apply(cur.serviceCategories, "cat"),
        ...(cur.packages ? { packages: apply(cur.packages, "package") } : {}),
        ...(cur.freeTools ? { freeTools: apply(cur.freeTools, "tool") } : {}),
      }));

      setStatus("saved");
      setMessage(
        `Tradução concluída (${Object.keys(translations).length} itens em EN/ES). Revise se quiser e clique em Salvar alterações para publicar.`
      );
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Não foi possível traduzir.");
    } finally {
      setTranslating(false);
    }
  };

  // ── Login screen ─────────────────────────────────────────────────────────────

  if (!isUnlocked) {
    return (
      <main className="admin-page admin-page--login">
        <section className="admin-login" aria-labelledby="admin-login-title">
          <div className="admin-login__mark" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <defs>
                <linearGradient id="admin-gold-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd56b" />
                  <stop offset="50%" stopColor="#c7a447" />
                  <stop offset="100%" stopColor="#9f741f" />
                </linearGradient>
                <linearGradient id="admin-gold-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff0ca" />
                  <stop offset="100%" stopColor="#765310" />
                </linearGradient>
                <filter id="admin-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="url(#admin-gold-primary)" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />
              <circle cx="50" cy="50" r="40" stroke="url(#admin-gold-primary)" strokeWidth="1.5" opacity="0.15" />
              <path d="M25 25 L46 72 H52 L31 25 Z" fill="url(#admin-gold-primary)" />
              <path d="M75 25 L54 72 H48 L69 25 Z" fill="url(#admin-gold-secondary)" />
              <circle cx="50" cy="72" r="3" fill="#ffd56b" filter="url(#admin-logo-glow)" />
            </svg>
          </div>
          <p className="eyebrow">Acesso privado</p>
          <h1 id="admin-login-title">Painel do portfólio</h1>
          <p className="admin-login__lead">Gerencie seus projetos, preços, categorias e tecnologias em um só lugar.</p>

          <form
            className="admin-login__form"
            onSubmit={(e) => {
              e.preventDefault();
              if (password && status !== "loading") loadData();
            }}
          >
            <label htmlFor="admin-password">Senha do admin</label>
            <div className="admin-password">
              <input
                autoComplete="current-password"
                id="admin-password"
                onChange={(e) => { setPassword(e.target.value); setMessage(""); }}
                placeholder="Digite a senha"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <button className="button button--primary" disabled={!password || status === "loading"} type="submit">
              {status === "loading" ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>

          {message ? <p className="admin-status admin-status--error">{message}</p> : null}

          <div className="admin-login__links">
            <a
              className="button button--ghost admin-login__vitrine"
              href="/vitrine"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver vitrine (para plataformas) <span aria-hidden="true">↗</span>
            </a>
            <a className="admin-login__back" href="/">Voltar para o site</a>
          </div>
        </section>
      </main>
    );
  }

  // ── Main panel ───────────────────────────────────────────────────────────────

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Painel do portfólio</h1>
        </div>
        <div className="admin-header__actions">
          <a className="admin-link" href="/">Ver site</a>
          <a className="admin-link" href="/social" target="_blank" rel="noopener noreferrer">Kit de mídias</a>
          <button
            className="button button--ghost"
            disabled={translating || status === "saving" || status === "uploading"}
            onClick={runContentTranslation}
            type="button"
            title="Traduz títulos, resumos e descrições para EN e ES com IA"
          >
            {translating ? "Traduzindo…" : "Traduzir (IA)"}
          </button>
          <button
            className="button button--primary"
            disabled={status === "saving" || status === "uploading"}
            onClick={saveData}
            type="button"
          >
            {status === "saving" ? "Salvando..." : status === "uploading" ? "Enviando arquivo..." : "Salvar alterações"}
          </button>
        </div>
      </header>

      {message ? (
        <p className={`admin-status admin-status--${status === "error" ? "error" : "success"}`}>{message}</p>
      ) : null}

      <div className="admin-site-settings">
        <p className="admin-site-settings__label">Disponibilidade</p>
        <div className="admin-avail-options">
          {(["available", "busy", "unavailable"] as AvailabilityStatus[]).map((val) => (
            <label
              key={val}
              className={`admin-avail-option admin-avail-option--${val}${(data.availability ?? "available") === val ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="availability"
                value={val}
                checked={(data.availability ?? "available") === val}
                onChange={() => setData((cur) => ({ ...cur, availability: val }))}
              />
              <span className="admin-avail-dot" />
              {val === "available" ? "Disponível" : val === "busy" ? "Em projeto" : "Indisponível"}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-metrics">
        <span className="admin-metrics__label">Métricas e SEO</span>
        <a
          className="admin-metrics__link"
          href="https://analytics.google.com/"
          target="_blank"
          rel="noreferrer"
        >
          Google Analytics <span aria-hidden="true">↗</span>
        </a>
        <a
          className="admin-metrics__link"
          href="https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fnext-portfolio-navy-five-46.vercel.app"
          target="_blank"
          rel="noreferrer"
        >
          Search Console <span aria-hidden="true">↗</span>
        </a>
      </div>

      <nav className="admin-tabs" aria-label="Seções administrativas">
        {(["projects", "services", "categories", "technologies", "testimonials", "freetools", "pagamentos", "analise", "leads", "consultor"] as const).map((id) => {
          const pendingCount =
            id === "testimonials"
              ? (data.pendingTestimonials?.length ?? 0)
              : id === "leads"
                ? (data.leads?.length ?? 0)
                : 0;
          return (
            <button
              className={activeTab === id ? "is-active" : ""}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              {id === "projects"
                ? "Projetos"
                : id === "services"
                  ? "Serviços e preços"
                  : id === "categories"
                    ? "Categorias"
                    : id === "technologies"
                      ? "Tecnologias"
                      : id === "testimonials"
                        ? "Depoimentos"
                        : id === "freetools"
                          ? "Sistemas grátis"
                          : id === "pagamentos"
                            ? "Pagamentos"
                            : id === "analise"
                              ? "Análise de escopo"
                              : id === "leads"
                                ? "Pedidos"
                                : "Consultor IA"}
              {pendingCount > 0 && <span className="admin-tab-badge">{pendingCount}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Projects tab ─────────────────────────────────────────────────────── */}
      {activeTab === "projects" ? (
        <>
          <div className="admin-card admin-stats-card">
            <div className="admin-card__head">
              <p className="eyebrow">Seção de Projetos</p>
              <h2>Números do portfólio</h2>
            </div>
            <p className="admin-card__desc">
              As estatísticas animadas no topo da seção de projetos. Atualize conforme for concluindo trabalhos — o texto de cada número fica traduzido automaticamente.
            </p>
            <div className="admin-stats-grid">
              {PROJECT_STAT_LABELS.map((label, i) => (
                <div className="admin-stat-card" key={label}>
                  <span className="admin-stat-card__label">{label}</span>
                  <div className="admin-stat-card__fields">
                    <label>
                      Número
                      <input
                        type="number"
                        min="0"
                        value={projectStats[i]?.value ?? 0}
                        onChange={(e) => updateProjectStat(i, { value: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Símbolo
                      <input
                        value={projectStats[i]?.suffix ?? ""}
                        onChange={(e) => updateProjectStat(i, { suffix: e.target.value })}
                        placeholder="+ ou %"
                        maxLength={4}
                      />
                    </label>
                  </div>
                  <span className="admin-stat-card__preview" aria-hidden="true">
                    {projectStats[i]?.value ?? 0}
                    <strong>{projectStats[i]?.suffix ?? ""}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <section className="admin-layout">
          <aside className="admin-list">
            <button
              className="admin-list__add"
              type="button"
              onClick={() => {
                const p = createProject();
                setData((cur) => ({ ...cur, projects: [...cur.projects, p] }));
                setActiveProjectId(p.id);
              }}
            >
              + Novo projeto
            </button>
            {data.projects.map((project) => (
              <button
                className={`admin-list__item${activeProject?.id === project.id ? " is-active" : ""}`}
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                type="button"
              >
                {project.mainImage.src ? (
                  <img
                    className="admin-list__thumb"
                    src={previewFor(project.mainImage.src)}
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  <span className="admin-list__thumb admin-list__thumb--empty" aria-hidden="true" />
                )}
                <span>{project.title}</span>
              </button>
            ))}
          </aside>

          {activeProject ? (
            <section className="admin-form">

              {/* Basic info card */}
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Identificação</p>
                  <h2>Informações básicas</h2>
                </div>
                <div className="admin-form__grid">
                  <label>
                    Nome
                    <input
                      value={activeProject.title}
                      onChange={(e) => updateProject(activeProject.id, { title: e.target.value })}
                    />
                  </label>
                  <label>
                    ID
                    <input
                      value={activeProject.id}
                      onChange={(e) => updateProjectId(activeProject.id, e.target.value)}
                    />
                  </label>
                  <label>
                    Categoria
                    <input
                      value={activeProject.category}
                      onChange={(e) => updateProject(activeProject.id, { category: e.target.value })}
                    />
                  </label>
                  <label>
                    Status
                    <input
                      value={activeProject.status}
                      onChange={(e) => updateProject(activeProject.id, { status: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Link em produção <span className="admin-hint">(opcional — só preencha se o projeto estiver no ar)</span>
                  <div className="admin-link-input">
                    <input
                      type="url"
                      value={activeProject.link ?? ""}
                      onChange={(e) =>
                        updateProject(activeProject.id, {
                          link: e.target.value.trim() || undefined,
                        })
                      }
                      placeholder="https://cliente.com.br"
                    />
                    {activeProject.link && (
                      <a
                        href={activeProject.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-link-preview"
                        title="Abrir link"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </label>
                <label>
                  Descrição curta
                  <textarea
                    value={activeProject.summary}
                    onChange={(e) => updateProject(activeProject.id, { summary: e.target.value })}
                  />
                </label>
                <label>
                  Tags de filtro <span className="admin-hint">(separadas por vírgula — usadas no filtro de projetos. Ex: Lojas / E-commerce, Saúde)</span>
                  <input
                    value={(activeProject.tags ?? []).join(", ")}
                    onChange={(e) =>
                      updateProject(activeProject.id, {
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Ex: Lojas / E-commerce"
                  />
                </label>
              </div>

              {/* Media card */}
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Mídia</p>
                  <h2>Imagem principal e vídeos</h2>
                </div>
                <p className="admin-card__desc">
                  Escolha os arquivos do computador. O painel preenche o caminho automaticamente.
                </p>

                <div className="admin-media-grid">
                  <article className="admin-media-card">
                    <div className="admin-media-preview">
                      {activeProject.mainImage.src ? (
                        <img
                          src={previewFor(activeProject.mainImage.src)}
                          alt={activeProject.mainImage.alt || activeProject.title}
                        />
                      ) : (
                        <span>Sem imagem principal</span>
                      )}
                    </div>
                    <label className="admin-upload-button">
                      {uploadingKey === "main-image" ? "Enviando..." : "Enviar imagem principal"}
                      <input accept="image/*" disabled={status === "uploading"} onChange={uploadMainImage} type="file" />
                    </label>
                    <label>
                      Texto alternativo
                      <input
                        value={activeProject.mainImage.alt}
                        onChange={(e) =>
                          updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, alt: e.target.value } })
                        }
                        placeholder="Descreva a imagem para acessibilidade"
                      />
                    </label>
                    <details className="admin-path">
                      <summary>Editar caminho manualmente</summary>
                      <input
                        value={activeProject.mainImage.src}
                        onChange={(e) =>
                          updateProject(activeProject.id, { mainImage: { ...activeProject.mainImage, src: e.target.value } })
                        }
                        placeholder="/projects/meu-projeto/imagem.png"
                      />
                    </details>
                  </article>

                  <article className="admin-media-card admin-video-manager">
                    <div className="admin-video-heading">
                      <div>
                        <strong>Vídeos demo</strong>
                        <span>Use vídeos curtos e comprimidos, até {formatFileSize(maxVideoUploadBytes)} cada.</span>
                      </div>
                      <label className="admin-upload-button">
                        {uploadingKey === "video-new" ? "Enviando..." : "+ Adicionar vídeo"}
                        <input
                          accept="video/mp4,video/webm,video/quicktime"
                          disabled={status === "uploading"}
                          onChange={(e) => uploadVideo(e)}
                          type="file"
                        />
                      </label>
                    </div>

                    {activeProjectVideos.length ? (
                      <div className="admin-video-list">
                        {activeProjectVideos.map((video, index) => (
                          <section className="admin-video-item" key={`${video.src}-${index}`}>
                            <div className="admin-media-preview admin-media-preview--video">
                              <video controls preload="metadata" poster={previewFor(video.poster || activeProject.mainImage.src)}>
                                <source src={previewFor(video.src)} />
                              </video>
                            </div>
                            <div className="admin-media-actions">
                              <label className="admin-upload-button admin-upload-button--ghost">
                                {uploadingKey === `video-${index}` ? "Enviando..." : "Trocar vídeo"}
                                <input
                                  accept="video/mp4,video/webm,video/quicktime"
                                  disabled={status === "uploading"}
                                  onChange={(e) => uploadVideo(e, index)}
                                  type="file"
                                />
                              </label>
                              <label className="admin-upload-button admin-upload-button--ghost">
                                {uploadingKey === `video-poster-${index}` ? "Enviando..." : "Capa do vídeo"}
                                <input
                                  accept="image/*"
                                  disabled={status === "uploading"}
                                  onChange={(e) => uploadVideoPoster(e, index)}
                                  type="file"
                                />
                              </label>
                            </div>
                            <label>
                              Título do vídeo
                              <input
                                value={video.label || ""}
                                onChange={(e) => updateVideoItem(index, { label: e.target.value })}
                                placeholder={`Video demo ${index + 1} de ${activeProject.title}`}
                              />
                            </label>
                            <details className="admin-path">
                              <summary>Editar caminhos manualmente</summary>
                              <input
                                value={video.src}
                                onChange={(e) => updateVideoItem(index, { src: e.target.value })}
                                placeholder="/projects/meu-projeto/demo.mp4"
                              />
                              <input
                                value={video.poster || ""}
                                onChange={(e) => updateVideoItem(index, { poster: e.target.value })}
                                placeholder="/projects/meu-projeto/capa.png"
                              />
                            </details>
                            <button className="admin-danger" onClick={() => removeVideoItem(index)} type="button">
                              Remover vídeo
                            </button>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-empty">
                        <p>Nenhum vídeo cadastrado ainda.</p>
                        <label className="admin-upload-button">
                          Enviar primeiro vídeo
                          <input
                            accept="video/mp4,video/webm,video/quicktime"
                            disabled={status === "uploading"}
                            onChange={(e) => uploadVideo(e)}
                            type="file"
                          />
                        </label>
                      </div>
                    )}
                  </article>
                </div>
              </div>

              {/* Content card */}
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Conteúdo</p>
                  <h2>Tecnologias e entregas</h2>
                </div>
                <label>
                  Tecnologias <span className="admin-hint">(uma por linha)</span>
                  <textarea
                    value={arrayToLines(activeProject.stack)}
                    onChange={(e) => updateProject(activeProject.id, { stack: linesToArray(e.target.value) })}
                    rows={6}
                  />
                </label>
                <label>
                  O que foi feito <span className="admin-hint">(uma por linha)</span>
                  <textarea
                    value={arrayToLines(activeProject.workDone)}
                    onChange={(e) => updateProject(activeProject.id, { workDone: linesToArray(e.target.value) })}
                    rows={6}
                  />
                </label>
              </div>

              {/* Gallery card */}
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Galeria</p>
                  <h2>Prints do projeto</h2>
                  <label className="admin-upload-button admin-card__action">
                    {uploadingKey === "gallery-new" ? "Enviando..." : "+ Adicionar print"}
                    <input accept="image/*" disabled={status === "uploading"} onChange={(e) => uploadGalleryImage(e)} type="file" />
                  </label>
                </div>

                {activeProject.gallery.length ? (
                  <div className="admin-gallery-editor">
                    {activeProject.gallery.map((image, index) => (
                      <article className="admin-gallery-item" key={`${image.src}-${index}`}>
                        <div className="admin-gallery-thumb">
                          {image.src ? (
                            <img src={previewFor(image.src)} alt={image.alt || image.label || activeProject.title} />
                          ) : (
                            <span>Sem imagem</span>
                          )}
                        </div>
                        <label className="admin-upload-button admin-upload-button--ghost">
                          {uploadingKey === `gallery-${index}` ? "Enviando..." : "Trocar imagem"}
                          <input accept="image/*" disabled={status === "uploading"} onChange={(e) => uploadGalleryImage(e, index)} type="file" />
                        </label>
                        <label>
                          Legenda
                          <input
                            value={image.label || ""}
                            onChange={(e) => updateGalleryItem(index, { label: e.target.value })}
                          />
                        </label>
                        <label>
                          Texto alternativo
                          <input
                            value={image.alt || ""}
                            onChange={(e) => updateGalleryItem(index, { alt: e.target.value })}
                          />
                        </label>
                        <details className="admin-path">
                          <summary>Editar caminho manualmente</summary>
                          <input
                            value={image.src}
                            onChange={(e) => updateGalleryItem(index, { src: e.target.value })}
                          />
                        </details>
                        <button className="admin-danger" onClick={() => removeGalleryItem(index)} type="button">
                          Remover print
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">
                    <p>Nenhum print cadastrado ainda.</p>
                    <label className="admin-upload-button">
                      Enviar primeiro print
                      <input accept="image/*" disabled={status === "uploading"} onChange={(e) => uploadGalleryImage(e)} type="file" />
                    </label>
                  </div>
                )}
              </div>

              {/* Device views card */}
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Dispositivos</p>
                  <h2>Tablet e Mobile</h2>
                </div>
                <p className="admin-card__desc">
                  Prints e vídeos opcionais por tipo de tela. Aparecem com abas na galeria do modal do projeto.
                </p>

                <div className="admin-device-views">
                  {(["tablet", "mobile"] as const).map((device) => {
                    const dv = getDeviceView(device);
                    const deviceLabel = device === "tablet" ? "Tablet" : "Mobile";

                    return (
                      <div className={`admin-device-view${dv ? " is-active" : ""}`} key={device}>
                        <div className="admin-device-view__header">
                          <div>
                            <strong>{deviceLabel}</strong>
                            <span>
                              {dv
                                ? `${dv.images.length} print(s)${dv.videos?.length ? ` · ${dv.videos.length} vídeo(s)` : ""}`
                                : "Não configurado"}
                            </span>
                          </div>
                          {dv ? (
                            <button
                              className="admin-danger admin-danger--small"
                              onClick={() => removeDeviceView(device)}
                              type="button"
                            >
                              Remover {deviceLabel}
                            </button>
                          ) : (
                            <button
                              className="admin-inline"
                              onClick={() => addDeviceView(device)}
                              type="button"
                            >
                              + Adicionar {deviceLabel}
                            </button>
                          )}
                        </div>

                        {dv && (
                          <div className="admin-device-view__body">
                            <div className="admin-device-view__actions">
                              <label className="admin-upload-button">
                                {uploadingKey === `dv-${device}-img-new` ? "Enviando..." : `+ Print de ${deviceLabel}`}
                                <input
                                  accept="image/*"
                                  disabled={status === "uploading"}
                                  onChange={(e) => uploadDeviceImage(e, device)}
                                  type="file"
                                />
                              </label>
                              <label className="admin-upload-button admin-upload-button--ghost">
                                {uploadingKey === `dv-${device}-vid-new` ? "Enviando..." : `+ Vídeo de ${deviceLabel}`}
                                <input
                                  accept="video/mp4,video/webm,video/quicktime"
                                  disabled={status === "uploading"}
                                  onChange={(e) => uploadDeviceVideo(e, device)}
                                  type="file"
                                />
                              </label>
                            </div>

                            {dv.images.length > 0 && (
                              <div className="admin-gallery-editor">
                                {dv.images.map((image, index) => (
                                  <article className="admin-gallery-item" key={`${image.src}-${index}`}>
                                    <div className="admin-gallery-thumb">
                                      {image.src ? (
                                        <img src={previewFor(image.src)} alt={image.alt || ""} />
                                      ) : (
                                        <span>Sem imagem</span>
                                      )}
                                    </div>
                                    <label className="admin-upload-button admin-upload-button--ghost">
                                      {uploadingKey === `dv-${device}-img-${index}` ? "Enviando..." : "Trocar"}
                                      <input
                                        accept="image/*"
                                        disabled={status === "uploading"}
                                        onChange={(e) => uploadDeviceImage(e, device, index)}
                                        type="file"
                                      />
                                    </label>
                                    <label>
                                      Legenda
                                      <input
                                        value={image.label || ""}
                                        onChange={(e) => updateDeviceViewImage(device, index, { label: e.target.value })}
                                      />
                                    </label>
                                    <button
                                      className="admin-danger"
                                      onClick={() => removeDeviceViewImage(device, index)}
                                      type="button"
                                    >
                                      Remover
                                    </button>
                                  </article>
                                ))}
                              </div>
                            )}

                            {dv.videos && dv.videos.length > 0 && (
                              <div className="admin-video-list" style={{ marginTop: "16px" }}>
                                {dv.videos.map((video, index) => (
                                  <section className="admin-video-item" key={`${video.src}-${index}`}>
                                    <div className="admin-media-preview admin-media-preview--video">
                                      <video controls preload="metadata" poster={previewFor(video.poster)}>
                                        <source src={previewFor(video.src)} />
                                      </video>
                                    </div>
                                    <label>
                                      Título do vídeo
                                      <input
                                        value={video.label || ""}
                                        onChange={(e) => updateDeviceViewVideo(device, index, { label: e.target.value })}
                                      />
                                    </label>
                                    <div className="admin-media-actions">
                                      <label className="admin-upload-button admin-upload-button--ghost">
                                        {uploadingKey === `dv-${device}-vid-${index}` ? "Enviando..." : "Trocar vídeo"}
                                        <input
                                          accept="video/mp4,video/webm,video/quicktime"
                                          disabled={status === "uploading"}
                                          onChange={(e) => uploadDeviceVideo(e, device, index)}
                                          type="file"
                                        />
                                      </label>
                                    </div>
                                    <button
                                      className="admin-danger"
                                      onClick={() => removeDeviceViewVideo(device, index)}
                                      type="button"
                                    >
                                      Remover vídeo
                                    </button>
                                  </section>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                className="admin-danger"
                disabled={data.projects.length <= 1}
                onClick={() => {
                  setData((cur) => ({ ...cur, projects: cur.projects.filter((p) => p.id !== activeProject.id) }));
                  setActiveProjectId(data.projects.find((p) => p.id !== activeProject.id)?.id || "");
                }}
                type="button"
              >
                Remover projeto
              </button>
            </section>
          ) : null}
          </section>
        </>
      ) : null}

      {/* ── Services tab ─────────────────────────────────────────────────────── */}
      {activeTab === "services" ? (
        <section className="admin-layout">
          <aside className="admin-list">
            <button
              className="admin-list__add"
              type="button"
              onClick={() => {
                const s = createService(data.serviceCategories[0]?.id || "sites");
                setData((cur) => ({ ...cur, services: [...cur.services, s] }));
                setActiveServiceId(s.id);
              }}
            >
              + Novo serviço
            </button>
            {data.services.map((service) => (
              <button
                className={`admin-list__item${activeService?.id === service.id ? " is-active" : ""}`}
                key={service.id}
                onClick={() => setActiveServiceId(service.id)}
                type="button"
              >
                <span>{service.title}</span>
              </button>
            ))}
          </aside>

          {activeService ? (
            <section className="admin-form">
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Serviço</p>
                  <h2>Informações e preço</h2>
                </div>
                <div className="admin-form__grid">
                  <label>
                    Serviço
                    <input value={activeService.title} onChange={(e) => updateService(activeService.id, { title: e.target.value })} />
                  </label>
                  <label>
                    ID
                    <input value={activeService.id} onChange={(e) => updateServiceId(activeService.id, e.target.value)} />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={activeService.category}
                      onChange={(e) => updateService(activeService.id, { category: e.target.value })}
                    >
                      {data.serviceCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Valor (R$)
                    <input
                      min="0"
                      type="number"
                      value={activeService.price}
                      onChange={(e) => updateService(activeService.id, { price: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Cobrança
                    <select
                      value={activeService.billing}
                      onChange={(e) => updateService(activeService.id, { billing: e.target.value as BudgetService["billing"] })}
                    >
                      <option value="once">Única</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </label>
                  <label>
                    Unidade
                    <input
                      value={activeService.unitLabel || ""}
                      onChange={(e) => updateService(activeService.id, { unitLabel: e.target.value })}
                    />
                  </label>
                </div>

                <div className="admin-switches">
                  <label>
                    <input
                      checked={Boolean(activeService.startingAt)}
                      onChange={(e) => updateService(activeService.id, { startingAt: e.target.checked })}
                      type="checkbox"
                    />
                    A partir de
                  </label>
                  <label>
                    <input
                      checked={Boolean(activeService.allowQuantity)}
                      onChange={(e) => updateService(activeService.id, { allowQuantity: e.target.checked })}
                      type="checkbox"
                    />
                    Permitir quantidade
                  </label>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Descrição</p>
                  <h2>Resumo e detalhes</h2>
                </div>
                <label>
                  Resumo
                  <textarea value={activeService.summary} onChange={(e) => updateService(activeService.id, { summary: e.target.value })} />
                </label>
                <label>
                  O que inclui <span className="admin-hint">(uma por linha)</span>
                  <textarea
                    value={arrayToLines(activeService.details)}
                    onChange={(e) => updateService(activeService.id, { details: linesToArray(e.target.value) })}
                  />
                </label>
              </div>

              <button
                className="admin-danger"
                disabled={data.services.length <= 1}
                onClick={() => {
                  setData((cur) => ({ ...cur, services: cur.services.filter((s) => s.id !== activeService.id) }));
                  setActiveServiceId(data.services.find((s) => s.id !== activeService.id)?.id || "");
                }}
                type="button"
              >
                Remover serviço
              </button>
            </section>
          ) : null}
        </section>
      ) : null}

      {/* ── Categories tab ───────────────────────────────────────────────────── */}
      {activeTab === "categories" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Categorias</p>
              <h2>Categorias de serviços</h2>
              <button
                className="admin-inline admin-card__action"
                onClick={() =>
                  setData((cur) => ({
                    ...cur,
                    serviceCategories: [...cur.serviceCategories, { id: makeId("categoria"), label: "Nova categoria" }],
                  }))
                }
                type="button"
              >
                + Nova categoria
              </button>
            </div>
            <div className="admin-rows">
              {data.serviceCategories.map((category, index) => (
                <div className="admin-row" key={`${category.id}-${index}`}>
                  <input
                    value={category.id}
                    onChange={(e) =>
                      setData((cur) => ({
                        ...cur,
                        serviceCategories: cur.serviceCategories.map((item, i) =>
                          i === index ? { ...item, id: e.target.value } : item
                        ),
                      }))
                    }
                    placeholder="ID"
                  />
                  <input
                    value={category.label}
                    onChange={(e) =>
                      setData((cur) => ({
                        ...cur,
                        serviceCategories: cur.serviceCategories.map((item, i) =>
                          i === index ? { ...item, label: e.target.value } : item
                        ),
                      }))
                    }
                    placeholder="Nome"
                  />
                  <button
                    className="admin-danger"
                    disabled={data.serviceCategories.length <= 1}
                    onClick={() =>
                      setData((cur) => ({
                        ...cur,
                        serviceCategories: cur.serviceCategories.filter((_, i) => i !== index),
                      }))
                    }
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Technologies tab ─────────────────────────────────────────────────── */}
      {activeTab === "technologies" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Tecnologias</p>
              <h2>Lista de tecnologias</h2>
            </div>
            <label>
              Tecnologias cadastradas <span className="admin-hint">(uma por linha)</span>
              <textarea
                value={arrayToLines(data.technologies)}
                onChange={(e) => setData((cur) => ({ ...cur, technologies: linesToArray(e.target.value) }))}
                rows={16}
              />
            </label>
          </div>
        </section>
      ) : null}

      {/* ── Testimonials tab ─────────────────────────────────────────────────── */}
      {activeTab === "testimonials" ? (
        <section className="admin-form">

          {/* Pending queue */}
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Aguardando aprovação</p>
              <h2>
                Depoimentos pendentes
                {(data.pendingTestimonials?.length ?? 0) > 0 && (
                  <span className="admin-tab-badge admin-tab-badge--inline">
                    {data.pendingTestimonials!.length}
                  </span>
                )}
              </h2>
            </div>

            {!data.pendingTestimonials?.length ? (
              <p className="admin-empty">Nenhum depoimento pendente.</p>
            ) : (
              <div className="admin-pending-list">
                {data.pendingTestimonials.map((pending: PendingTestimonial) => (
                  <div className="admin-pending-card" key={pending.id}>
                    <div className="admin-pending-card__avatar">
                      {pending.photo ? (
                        <img src={pending.photo} alt="" />
                      ) : (
                        pending.name.charAt(0)
                      )}
                    </div>
                    <div className="admin-pending-card__body">
                      <div className="admin-pending-card__meta">
                        <strong>
                          {pending.name}
                          {flagUrl(pending.country) && (
                            <img
                              className="testimonial-flag"
                              src={flagUrl(pending.country) as string}
                              alt={pending.country}
                              title={pending.country}
                            />
                          )}
                        </strong>
                        {pending.role && <span>{pending.role}{pending.company ? ` · ${pending.company}` : ""}</span>}
                        <span className="admin-pending-card__date">
                          {new Date(pending.submittedAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="admin-pending-card__stars">
                          {"★".repeat(pending.rating)}{"☆".repeat(5 - pending.rating)}
                        </span>
                      </div>
                      <p className="admin-pending-card__text">"{pending.text}"</p>
                      <select
                        className="admin-testimonial-project"
                        value={pending.projectId ?? ""}
                        onChange={(e) => setTestimonialProject(pending.id, e.target.value)}
                      >
                        <option value="">— Sem projeto vinculado —</option>
                        {data.projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-pending-card__actions">
                      <button
                        className="button admin-approve-btn"
                        type="button"
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { submittedAt: _date, ...approved } = pending;
                          const existing = new Set((data.coupons ?? []).map((c) => c.code));
                          let code = generateCouponCode();
                          while (existing.has(code)) code = generateCouponCode();
                          const coupon: Coupon = {
                            code,
                            percent: REVIEW_COUPON_PERCENT,
                            createdAt: new Date().toISOString(),
                            label: pending.name,
                          };
                          setData((cur) => ({
                            ...cur,
                            testimonials: [...(cur.testimonials ?? []), approved as Testimonial],
                            pendingTestimonials: (cur.pendingTestimonials ?? []).filter((p) => p.id !== pending.id),
                            coupons: [coupon, ...(cur.coupons ?? [])],
                          }));
                          setStatus("saved");
                          setMessage(
                            `Depoimento aprovado! Cupom ${coupon.code} (${coupon.percent}% OFF) criado para ${pending.name}. Copie na aba abaixo, envie ao cliente e clique em Salvar alterações.`
                          );
                        }}
                      >
                        ✓ Aprovar
                      </button>
                      <button
                        className="admin-danger"
                        type="button"
                        onClick={() =>
                          setData((cur) => ({
                            ...cur,
                            pendingTestimonials: (cur.pendingTestimonials ?? []).filter((p) => p.id !== pending.id),
                          }))
                        }
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved testimonials */}
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Publicados</p>
              <h2>Depoimentos aprovados</h2>
            </div>

            {!data.testimonials?.length ? (
              <p className="admin-empty">Nenhum depoimento publicado ainda.</p>
            ) : (
              <div className="admin-pending-list">
                {data.testimonials.map((item: Testimonial) => (
                  <div className="admin-pending-card" key={item.id}>
                    <div className="admin-pending-card__avatar">
                      {item.photo ? (
                        <img src={item.photo} alt="" />
                      ) : (
                        item.name.charAt(0)
                      )}
                    </div>
                    <div className="admin-pending-card__body">
                      <div className="admin-pending-card__meta">
                        <strong>
                          {item.name}
                          {flagUrl(item.country) && (
                            <img
                              className="testimonial-flag"
                              src={flagUrl(item.country) as string}
                              alt={item.country}
                              title={item.country}
                            />
                          )}
                        </strong>
                        {item.role && <span>{item.role}{item.company ? ` · ${item.company}` : ""}</span>}
                        <span className="admin-pending-card__stars">
                          {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                        </span>
                      </div>
                      <p className="admin-pending-card__text">"{item.text}"</p>
                      <select
                        className="admin-testimonial-project"
                        value={item.projectId ?? ""}
                        onChange={(e) => setTestimonialProject(item.id, e.target.value)}
                      >
                        <option value="">— Sem projeto vinculado —</option>
                        {data.projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-pending-card__actions">
                      {confirmDeleteTestimonialId === item.id ? (
                        <>
                          <button
                            className="admin-danger admin-danger--confirm"
                            type="button"
                            onClick={() => {
                              setData((cur) => ({
                                ...cur,
                                testimonials: (cur.testimonials ?? []).filter((t) => t.id !== item.id),
                              }));
                              setConfirmDeleteTestimonialId(null);
                              setStatus("saved");
                              setMessage("Depoimento removido. Clique em Salvar alterações para publicar.");
                            }}
                          >
                            Confirmar
                          </button>
                          <button
                            className="admin-inline"
                            type="button"
                            onClick={() => setConfirmDeleteTestimonialId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          className="admin-danger"
                          type="button"
                          onClick={() => setConfirmDeleteTestimonialId(item.id)}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coupons (review reward) */}
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Recompensa por depoimento</p>
              <h2>
                Cupons de desconto
                {(data.coupons?.length ?? 0) > 0 && (
                  <span className="admin-tab-badge admin-tab-badge--inline">{data.coupons!.length}</span>
                )}
              </h2>
              <button
                className="admin-inline admin-card__action"
                type="button"
                onClick={() => {
                  const existing = new Set((data.coupons ?? []).map((c) => c.code));
                  let code = generateCouponCode();
                  while (existing.has(code)) code = generateCouponCode();
                  setData((cur) => ({
                    ...cur,
                    coupons: [
                      { code, percent: REVIEW_COUPON_PERCENT, createdAt: new Date().toISOString() },
                      ...(cur.coupons ?? []),
                    ],
                  }));
                  setStatus("saved");
                  setMessage(`Cupom ${code} (${REVIEW_COUPON_PERCENT}% OFF) criado. Clique em Salvar alterações.`);
                }}
              >
                + Novo cupom
              </button>
            </div>
            <p className="admin-hint">
              Ao aprovar um depoimento, um cupom de {REVIEW_COUPON_PERCENT}% é gerado automaticamente. Copie o
              código, envie ao cliente, e ele aplica na calculadora de orçamento no próximo projeto.
            </p>
            {!data.coupons?.length ? (
              <p className="admin-empty">Nenhum cupom ainda.</p>
            ) : (
              <div className="admin-coupon-list">
                {data.coupons.map((coupon: Coupon) => (
                  <div className="admin-coupon-card" key={coupon.code}>
                    <div className="admin-coupon-card__info">
                      <code className="admin-coupon-code">{coupon.code}</code>
                      <span className="admin-coupon-meta">
                        {coupon.percent}% OFF
                        {coupon.label ? ` · ${coupon.label}` : ""}
                        {` · ${new Date(coupon.createdAt).toLocaleDateString("pt-BR")}`}
                      </span>
                    </div>
                    <div className="admin-coupon-card__actions">
                      <button
                        className="admin-inline"
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(coupon.code);
                          setStatus("saved");
                          setMessage(`Cupom ${coupon.code} copiado.`);
                        }}
                      >
                        Copiar
                      </button>
                      <button
                        className="admin-danger"
                        type="button"
                        onClick={() =>
                          setData((cur) => ({
                            ...cur,
                            coupons: (cur.coupons ?? []).filter((c) => c.code !== coupon.code),
                          }))
                        }
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Free tools tab ───────────────────────────────────────────────────── */}
      {activeTab === "freetools" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Sistemas grátis</p>
              <h2>Ferramentas para os visitantes usarem</h2>
              <button className="admin-inline admin-card__action" type="button" onClick={addFreeTool}>
                + Adicionar sistema
              </button>
            </div>
            <p className="admin-card__desc">
              Sistemas seus que aparecem na seção &quot;Ferramentas gratuitas&quot; do site. Cada um vira um card com botão &quot;Usar grátis&quot;.
            </p>

            {!data.freeTools?.length ? (
              <p className="admin-empty">Nenhum sistema cadastrado ainda.</p>
            ) : (
              <div className="admin-freetools">
                {data.freeTools.map((tool: FreeTool) => (
                  <div className="admin-freetool" key={tool.id}>
                    <div className="admin-freetool__grid">
                      <label className="admin-freetool__icon-field">
                        Ícone
                        <input
                          value={tool.icon ?? ""}
                          onChange={(e) => updateFreeTool(tool.id, { icon: e.target.value })}
                          placeholder="💰"
                          maxLength={4}
                        />
                      </label>
                      <label>
                        Nome
                        <input value={tool.name} onChange={(e) => updateFreeTool(tool.id, { name: e.target.value })} />
                      </label>
                      <label>
                        Tag <span className="admin-hint">(opcional)</span>
                        <input
                          value={tool.tag ?? ""}
                          onChange={(e) => updateFreeTool(tool.id, { tag: e.target.value })}
                          placeholder="Ex: Finanças"
                        />
                      </label>
                    </div>
                    <label>
                      Link do sistema
                      <input
                        type="url"
                        value={tool.url}
                        onChange={(e) => updateFreeTool(tool.id, { url: e.target.value })}
                        placeholder="https://meu-sistema.vercel.app"
                      />
                    </label>
                    <label>
                      Descrição
                      <textarea
                        value={tool.description}
                        onChange={(e) => updateFreeTool(tool.id, { description: e.target.value })}
                        rows={3}
                      />
                    </label>
                    <button className="admin-danger" type="button" onClick={() => removeFreeTool(tool.id)}>
                      Remover sistema
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Payments tab ─────────────────────────────────────────────────────── */}
      {activeTab === "pagamentos" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Indicação direta</p>
              <h2>Links de pagamento</h2>
              <button className="admin-inline admin-card__action" type="button" onClick={addPaymentLink}>
                + Adicionar link
              </button>
            </div>
            <p className="admin-card__desc">
              Cole aqui os links de cobrança que você cria no seu provedor (Mercado Pago, Stripe, PayPal...).
              Eles viram um botão de &quot;sinal/entrada&quot; só para quem veio por indicação direta — em
              Workana e Upwork o pagamento é pela própria plataforma.
            </p>
            <p className="admin-hint">
              O cliente paga numa página do provedor; nenhum dado de cartão passa pelo seu site. Dica:
              configure o link como sinal de 50% para travar a vaga.
            </p>

            {!data.paymentLinks?.length ? (
              <p className="admin-empty">Nenhum link cadastrado ainda.</p>
            ) : (
              <div className="admin-freetools">
                {data.paymentLinks.map((p: PaymentLink) => (
                  <div className="admin-freetool" key={p.id}>
                    <div className="admin-freetool__grid">
                      <label>
                        Texto do botão
                        <input
                          value={p.label}
                          onChange={(e) => updatePaymentLink(p.id, { label: e.target.value })}
                          placeholder="Pagar sinal (PIX / cartão)"
                        />
                      </label>
                      <label>
                        Mostrar para
                        <select
                          value={p.region}
                          onChange={(e) =>
                            updatePaymentLink(p.id, { region: e.target.value as PaymentLink["region"] })
                          }
                        >
                          <option value="br">Brasil (R$)</option>
                          <option value="intl">Internacional ($)</option>
                          <option value="all">Todos</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Link de pagamento
                      <input
                        type="url"
                        value={p.url}
                        onChange={(e) => updatePaymentLink(p.id, { url: e.target.value })}
                        placeholder="https://mpago.la/..."
                      />
                    </label>
                    <label>
                      Observação <span className="admin-hint">(opcional)</span>
                      <input
                        value={p.note ?? ""}
                        onChange={(e) => updatePaymentLink(p.id, { note: e.target.value })}
                        placeholder="Mercado Pago — PIX ou cartão em até 12x"
                      />
                    </label>
                    <button className="admin-danger" type="button" onClick={() => removePaymentLink(p.id)}>
                      Remover link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Scope analyzer tab ───────────────────────────────────────────────── */}
      {activeTab === "analise" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Só pra você</p>
              <h2>Análise de escopo</h2>
            </div>
            <p className="admin-card__desc">
              Cole o escopo de um projeto (Workana, e-mail, etc.). Eu comparo com seus serviços e monto a
              proposta com preço. Tudo roda no seu navegador — nada é enviado.
            </p>
            <label>
              Escopo do projeto
              <textarea
                value={scopeText}
                onChange={(e) => setScopeText(e.target.value)}
                rows={9}
                placeholder="Cole aqui o escopo do projeto..."
              />
            </label>
            <div className="scope-actions">
              <button
                className="button button--ghost"
                type="button"
                disabled={!scopeText.trim() || aiLoading}
                onClick={runScopeAnalysis}
              >
                Analisar (local)
              </button>
              <button
                className="button button--primary"
                type="button"
                disabled={!scopeText.trim() || aiLoading}
                onClick={runAiAnalysis}
              >
                {aiLoading ? "Analisando com IA…" : "Analisar com IA"}
              </button>
              <button
                className="button button--ghost"
                type="button"
                disabled={!scopeText.trim() || questionsLoading}
                onClick={runQuestions}
              >
                {questionsLoading ? "Gerando perguntas…" : "Gerar perguntas"}
              </button>
            </div>
            {aiError ? <p className="admin-status admin-status--error">{aiError}</p> : null}
            {questionsError ? <p className="admin-status admin-status--error">{questionsError}</p> : null}
          </div>

          {questionsText ? (
            <div className="admin-card">
              <div className="admin-card__head">
                <p className="eyebrow">Pra enviar ao cliente</p>
                <h2>Perguntas matadoras</h2>
              </div>
              <p className="scope-ai-hint">Geradas por IA a partir do escopo — revise antes de enviar.</p>
              <textarea className="scope-proposal" readOnly rows={10} value={questionsText} />
              <button className="button button--primary" type="button" onClick={copyQuestions}>
                {questionsCopied ? "✓ Copiado!" : "Copiar perguntas"}
              </button>
            </div>
          ) : null}

          {scopeAnalyzed ? (
            <>
              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Resultado</p>
                  <h2>Serviços identificados</h2>
                </div>
                {Object.keys(scopeSelection).length === 0 ? (
                  <p className="admin-empty">Nenhum serviço casou automaticamente. Marque manualmente abaixo.</p>
                ) : null}
                <div className="scope-services">
                  {data.services.map((s) => {
                    const selected = Boolean(scopeSelection[s.id]);
                    return (
                      <div className={`scope-service${selected ? " is-on" : ""}`} key={s.id}>
                        <label className="scope-service__check">
                          <input type="checkbox" checked={selected} onChange={() => toggleScopeService(s.id)} />
                          <span>{s.title}</span>
                        </label>
                        {selected && s.allowQuantity ? (
                          <input
                            className="scope-service__qty"
                            type="number"
                            min="1"
                            value={scopeSelection[s.id]}
                            onChange={(e) => setScopeQty(s.id, Number(e.target.value))}
                          />
                        ) : null}
                        <span className="scope-service__price">
                          {formatBRL(s.price)}
                          {s.billing === "monthly" ? "/mês" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="totals">
                  {scopeResult.discount > 0 ? (
                    <div className="totals__discount">
                      <span>Desconto de pacote</span>
                      <strong>− {formatBRL(scopeResult.discount)}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span>Total único</span>
                    <strong>{formatBRL(scopeResult.onceTotal)}</strong>
                  </div>
                  <div>
                    <span>Mensal</span>
                    <strong>
                      {formatBRL(scopeResult.monthlyTotal)}
                      {scopeResult.monthlyTotal > 0 ? "/mês" : ""}
                    </strong>
                  </div>
                </div>
              </div>

              {aiNewServices.length > 0 ? (
                <div className="admin-card">
                  <div className="admin-card__head">
                    <p className="eyebrow">Fora da sua grade</p>
                    <h2>Serviços sugeridos pela IA</h2>
                  </div>
                  <p className="admin-card__desc">
                    A IA detectou pedidos que seus serviços atuais não cobrem. Aceite para criar na sua grade (e somar
                    ao orçamento) ou recuse.
                  </p>
                  <div className="admin-newsvc-list">
                    {aiNewServices.map((s) => (
                      <div className="admin-newsvc" key={s.tempId}>
                        <div className="admin-newsvc__body">
                          <div className="admin-newsvc__top">
                            <strong>{s.title}</strong>
                            <span className="admin-newsvc__price">
                              {formatBRL(s.price)}
                              {s.billing === "monthly" ? "/mês" : ""}
                            </span>
                          </div>
                          {s.summary ? <p className="admin-newsvc__summary">{s.summary}</p> : null}
                          <span className="admin-newsvc__cat">
                            Categoria: {data.serviceCategories.find((c) => c.id === s.category)?.label || "—"}
                          </span>
                        </div>
                        <div className="admin-newsvc__actions">
                          <button className="button admin-approve-btn" type="button" onClick={() => acceptNewService(s)}>
                            ✓ Aceitar
                          </button>
                          <button className="admin-danger" type="button" onClick={() => rejectNewService(s.tempId)}>
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="admin-card">
                <div className="admin-card__head">
                  <p className="eyebrow">Pronta pra enviar</p>
                  <h2>Proposta gerada</h2>
                </div>
                {!(aiProposal ?? scopeProposal) ? (
                  <p className="admin-empty">Selecione ao menos um serviço para gerar a proposta.</p>
                ) : (
                  <>
                    {aiProposal ? (
                      <p className="scope-ai-hint">Proposta gerada por IA — revise antes de enviar.</p>
                    ) : null}
                    <textarea className="scope-proposal" readOnly rows={16} value={aiProposal ?? scopeProposal} />
                    <button className="button button--primary" type="button" onClick={copyProposal}>
                      {scopeCopied ? "✓ Copiado!" : "Copiar proposta"}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {/* ── Leads tab ────────────────────────────────────────────────────────── */}
      {activeTab === "leads" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Capturados pelo chat</p>
              <h2>
                Pedidos de clientes
                {(data.leads?.length ?? 0) > 0 && (
                  <span className="admin-tab-badge admin-tab-badge--inline">{data.leads!.length}</span>
                )}
              </h2>
            </div>
            <p className="admin-card__desc">
              Pedidos deixados pelos visitantes no assistente de IA (inclui serviços que você ainda não oferece).
              Após remover, clique em Salvar alterações.
            </p>

            {!data.leads?.length ? (
              <p className="admin-empty">Nenhum pedido ainda.</p>
            ) : (
              <div className="admin-pending-list">
                {[...data.leads].reverse().map((lead: Lead) => {
                  const href = leadContactHref(lead.contact);
                  return (
                    <div className="admin-pending-card" key={lead.id}>
                      <div className="admin-pending-card__avatar">{lead.name.charAt(0).toUpperCase()}</div>
                      <div className="admin-pending-card__body">
                        <div className="admin-pending-card__meta">
                          <strong>{lead.name}</strong>
                          <span>{lead.contact}</span>
                          <span className="admin-pending-card__date">
                            {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="admin-pending-card__text">{lead.message}</p>
                      </div>
                      <div className="admin-pending-card__actions">
                        {href ? (
                          <a className="admin-inline" href={href} target="_blank" rel="noreferrer">
                            Responder
                          </a>
                        ) : null}
                        <button className="admin-danger" type="button" onClick={() => removeLead(lead.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Consultor IA tab ─────────────────────────────────────────────────── */}
      {activeTab === "consultor" ? (
        <section className="admin-form">
          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Só pra você</p>
              <h2>Consultor IA</h2>
            </div>
            <p className="admin-card__desc">
              Conselhos para tocar o negócio: análise de preços (com busca atual de mercado), ideias de inovação e
              perguntas livres — tudo com base nos seus serviços.
            </p>
            <div className="advisor-actions">
              <button
                className="button button--primary"
                type="button"
                disabled={Boolean(advisorLoading)}
                onClick={() => runAdvisor("pricing")}
              >
                {advisorLoading === "pricing" ? "Analisando…" : "Analisar meus preços"}
              </button>
              <button
                className="button button--ghost"
                type="button"
                disabled={Boolean(advisorLoading)}
                onClick={() => runAdvisor("innovation")}
              >
                {advisorLoading === "innovation" ? "Pensando…" : "Ideias de inovação"}
              </button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__head">
              <p className="eyebrow">Pergunta livre</p>
              <h2>Pergunte ao consultor</h2>
            </div>
            <label>
              Sua pergunta
              <textarea
                value={advisorQuestion}
                onChange={(e) => setAdvisorQuestion(e.target.value)}
                rows={3}
                placeholder="Ex: vale a pena criar um plano mensal de conteúdo? Como me diferenciar de agências?"
              />
            </label>
            <label>
              Preços que você viu <span className="admin-hint">(opcional — cole pra comparar com os seus)</span>
              <textarea
                value={advisorPrices}
                onChange={(e) => setAdvisorPrices(e.target.value)}
                rows={3}
                placeholder="Ex: landing page R$ 1200, loja R$ 3000, manutenção R$ 250/mês..."
              />
            </label>
            <button
              className="button button--primary"
              type="button"
              disabled={Boolean(advisorLoading) || !advisorQuestion.trim()}
              onClick={() => runAdvisor("ask")}
            >
              {advisorLoading === "ask" ? "Consultando…" : "Perguntar"}
            </button>
          </div>

          {advisorError ? <p className="admin-status admin-status--error">{advisorError}</p> : null}

          {advisorText ? (
            <div className="admin-card">
              <div className="admin-card__head">
                <p className="eyebrow">Resposta</p>
                <h2>O que o consultor diz</h2>
              </div>
              <div
                className="advisor-answer"
                dangerouslySetInnerHTML={{ __html: renderAdvisor(advisorText) }}
              />
              {advisorSources.length > 0 ? (
                <div className="advisor-sources">
                  <span>Fontes:</span>
                  {advisorSources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer">
                      {s.title || `Fonte ${i + 1}`}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
