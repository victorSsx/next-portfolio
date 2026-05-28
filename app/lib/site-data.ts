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
};

export type AvailabilityStatus = "available" | "busy" | "unavailable";

export type SiteData = {
  serviceCategories: ServiceCategory[];
  technologies: string[];
  services: BudgetService[];
  projects: Project[];
  availability?: AvailabilityStatus;
};

export const siteData = rawSiteData as SiteData;
