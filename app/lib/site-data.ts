import rawSiteData from "../data/site-data.json";

export type CategoryId = string;
export type Billing = "once" | "monthly";

export type ServiceCategory = {
  id: string;
  label: string;
};

export type BudgetService = {
  id: string;
  category: string;
  title: string;
  price: number;
  billing: Billing;
  summary: string;
  details?: string[];
  allowQuantity?: boolean;
  unitLabel?: string;
  startingAt?: boolean;
};

export type ProjectImage = {
  src: string;
  alt: string;
  label?: string;
};

export type ProjectVideo = {
  src: string;
  poster: string;
  label: string;
};

export type DeviceView = {
  device: "tablet" | "mobile";
  label?: string;
  images: ProjectImage[];
  videos?: ProjectVideo[];
};

export type Project = {
  id: string;
  title: string;
  category: string;
  status: string;
  stack: string[];
  summary: string;
  workDone: string[];
  mainImage: ProjectImage;
  gallery: ProjectImage[];
  video?: ProjectVideo;
  videos?: ProjectVideo[];
  deviceViews?: DeviceView[];
  link?: string;
  tags?: string[];
};

export type AvailabilityStatus = "available" | "busy" | "unavailable";

export type ProjectStat = {
  value: number;
  suffix: string;
};

export type FreeTool = {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: string; // emoji opcional
  tag?: string; // categoria opcional, ex: "Finanças"
};

export type Lead = {
  id: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string; // ISO 8601
};

export type Package = {
  id: string;
  tag: string;
  tagColor: "green" | "gold" | "blue" | "purple";
  title: string;
  description: string;
  services: string[];
  discount: number;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
  photo?: string; // compressed base64 JPEG or image URL
  country?: string; // código ISO do país (ex: "BR"), detectado no envio
  projectId?: string; // projeto vinculado a este depoimento
};

export type PendingTestimonial = Testimonial & {
  submittedAt: string; // ISO 8601 date string
};

export type SiteData = {
  serviceCategories: ServiceCategory[];
  technologies: string[];
  services: BudgetService[];
  projects: Project[];
  packages?: Package[];
  testimonials?: Testimonial[];
  pendingTestimonials?: PendingTestimonial[];
  availability?: AvailabilityStatus;
  projectStats?: ProjectStat[];
  freeTools?: FreeTool[];
  leads?: Lead[];
};

export const siteData = rawSiteData as SiteData;
