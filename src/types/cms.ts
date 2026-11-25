export type EnquiryType = 'project' | 'partnership' | 'academy';

export type SocialPlatform =
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'TikTok'
  | 'X'
  | 'YouTube'
  | 'GitHub'
  | 'Other';

export type ProjectCategory =
  | 'Software and Applications'
  | 'Artificial Intelligence'
  | 'Education Technology'
  | 'Robotics and Innovation'
  | 'Other Technology Projects';

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  summary: string;
  overview: string;
  problemSolved: string;
  ourSolution: string;
  features: string[];
  technologies: string[];
  thumbnailUrl: string;
  screenshots: string[];
  outcomes: string[];
  relatedProductId: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface TeamMember {
  id: string;
  slotIndex: string;
  name: string;
  roleTitle: string;
  discipline: string;
  bio: string;
  accentHex: string;
  photoUrl: string;
  socialLinks: {
    website?: string;
    linkedin?: string;
    github?: string;
    x?: string;
    instagram?: string;
  };
  sortOrder: number;
  isPublished: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  summary: string;
  problemSolved: string;
  features: string[];
  accentHex: string;
  imagePath: string;
  externalUrl: string;
  isFlagship: boolean;
  isPublished: boolean;
  architectureNote: string;
  sortOrder: number;
}

export interface SoftwareProgramItem {
  id: string;
  name: string;
  category: string;
  purpose: string;
  problemSolved: string;
  features: string[];
  accentHex: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface CourseItem {
  id: string;
  title: string;
  audience: string;
  focus: string;
  projectOutcome: string;
  imagePath: string;
  enrollUrl: string;
  accentHex: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface TestimonialCmsItem {
  id: string;
  category: 'voxlan' | 'student';
  categoryLabel: string;
  quote: string;
  authorName: string;
  authorRole: string;
  institutionOrTrack: string;
  outcomeNote: string;
  photoUrl: string;
  logoUrl: string;
  relatedProjectId: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface SectionVisibility {
  intro: boolean;
  offerings: boolean;
  products: boolean;
  projects: boolean;
  scrollytelling: boolean;
  team: boolean;
  vision: boolean;
  testimonials: boolean;
  contact: boolean;
}

export interface HomepageSettings {
  heroEyebrow: string;
  heroHeadlineLine1: string;
  heroHeadlineLine2: string;
  heroSupportingText: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  heroBannerImage: string;
  featuredProductIds: string[];
  featuredProjectIds: string[];
  featuredTestimonialIds: string[];
  sectionVisibility: SectionVisibility;
}

export interface AboutSettings {
  introHeadline: string;
  introManifesto: string;
  introSecondaryText: string;
  introImage: string;
  introCaption: string;
  visionHeadline: string;
  visionDescription: string;
  visionImage: string;
  visionPillars: { title: string; description: string }[];
  milestones: MilestoneItem[];
}

export interface ContactEnquiryOption {
  id: EnquiryType;
  label: string;
  hint: string;
}

export interface ContactSettings {
  primaryEmail: string;
  secondaryEmail: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsappNumber: string;
  physicalAddress: string;
  businessHours: string;
  googleMapsUrl: string;
  googleMapsNote: string;
  formEnabled: boolean;
  formHeading: string;
  formDescription: string;
  formSuccessMessage: string;
  enquiryOptions: ContactEnquiryOption[];
}

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  faviconUrl: string;
  siteShareImage: string;
  footerTagline: string;
  copyrightText: string;
}

export interface SiteContentPayload {
  homepage: HomepageSettings;
  about: AboutSettings;
  contact: ContactSettings;
  seo: SeoSettings;
  teamMembers: TeamMember[];
  products: ProductItem[];
  softwarePrograms: SoftwareProgramItem[];
  courses: CourseItem[];
  projects: ProjectItem[];
  socialLinks: SocialLinkItem[];
  testimonials: TestimonialCmsItem[];
}

export interface ContactSubmissionRecord {
  id: string;
  enquiryType: EnquiryType;
  fullName: string;
  email: string;
  organization: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  url: string;
  createdAt: string;
}

export type AnalyticsGranularity = 'daily' | 'weekly' | 'monthly';

export type AnalyticsEventType =
  | 'pageview'
  | 'heartbeat'
  | 'button_click'
  | 'team_interact'
  | 'product_view'
  | 'contact_click'
  | 'contact_submit';

export interface AnalyticsKpiMetric {
  current: number;
  previous: number;
  deltaPct: number | null;
}

export interface AnalyticsOverviewPayload {
  range: {
    start: string;
    end: string;
    prevStart: string;
    prevEnd: string;
    granularity: AnalyticsGranularity;
  };
  kpis: {
    totalVisits: AnalyticsKpiMetric;
    uniqueVisitors: AnalyticsKpiMetric;
    avgSessionDurationSec: AnalyticsKpiMetric;
    bounceRatePct: AnalyticsKpiMetric;
    contactClicks: AnalyticsKpiMetric;
    contactSubmissions: AnalyticsKpiMetric;
    teamInteractions: AnalyticsKpiMetric;
    productViews: AnalyticsKpiMetric;
  };
  timeSeries: {
    bucket: string;
    visits: number;
    uniqueVisitors: number;
    contactClicks: number;
    submissions: number;
  }[];
  topPages: { path: string; views: number; uniqueVisitors: number }[];
  devices: { device: string; count: number; pct: number }[];
  browsers: { browser: string; count: number }[];
  operatingSystems: { os: string; count: number }[];
  geography: { region: string; count: number }[];
  referrers: { source: string; count: number }[];
  topClicks: { label: string; eventType: string; count: number }[];
  teamInteractionsBreakdown: { label: string; count: number }[];
  productEngagement: { label: string; count: number }[];
}

export interface AdminAuthStatus {
  initialized: boolean;
  envOverrideActive: boolean;
  authenticated: boolean;
  adminEmail: string | null;
}
