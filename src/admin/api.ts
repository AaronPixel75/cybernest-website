import type {
  AboutSettings,
  AdminAuthStatus,
  AnalyticsGranularity,
  AnalyticsOverviewPayload,
  ContactSettings,
  ContactSubmissionRecord,
  CourseItem,
  HomepageSettings,
  MediaAssetRecord,
  ProductItem,
  ProjectItem,
  SeoSettings,
  SiteContentPayload,
  SocialLinkItem,
  SoftwareProgramItem,
  TeamMember,
  TestimonialCmsItem,
} from '../types/cms';

async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'CyberNest-Admin');
  if (!(init.body instanceof FormData) && !headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errMsg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}

export const adminApi = {
  // Auth
  getAuthStatus: () => adminFetch<AdminAuthStatus>('/api/admin/auth/status'),
  claimAdmin: (email: string, password: string) =>
    adminFetch<{ authenticated: boolean; adminEmail: string }>('/api/admin/auth/claim', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    adminFetch<{ authenticated: boolean; adminEmail: string }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    adminFetch<{ authenticated: boolean }>('/api/admin/auth/logout', {
      method: 'POST',
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    adminFetch<{ ok: boolean }>('/api/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // CMS Full Hydration & Analytics
  getSiteContent: () => adminFetch<SiteContentPayload>('/api/admin/site'),
  getAnalytics: (start: string, end: string, granularity: AnalyticsGranularity) =>
    adminFetch<AnalyticsOverviewPayload>(
      `/api/admin/analytics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&granularity=${encodeURIComponent(granularity)}`,
    ),

  // Settings
  saveHomepage: (homepage: HomepageSettings) =>
    adminFetch<{ ok: boolean; site: SiteContentPayload }>('/api/admin/settings/homepage', {
      method: 'PUT',
      body: JSON.stringify(homepage),
    }),
  saveAbout: (about: AboutSettings) =>
    adminFetch<{ ok: boolean; site: SiteContentPayload }>('/api/admin/settings/about', {
      method: 'PUT',
      body: JSON.stringify(about),
    }),
  saveContact: (contact: ContactSettings) =>
    adminFetch<{ ok: boolean; site: SiteContentPayload }>('/api/admin/settings/contact', {
      method: 'PUT',
      body: JSON.stringify(contact),
    }),
  saveSeo: (seo: SeoSettings) =>
    adminFetch<{ ok: boolean; site: SiteContentPayload }>('/api/admin/settings/seo', {
      method: 'PUT',
      body: JSON.stringify(seo),
    }),

  // Team
  createTeamMember: (member: Omit<TeamMember, 'id'>) =>
    adminFetch<{ ok: boolean; teamMembers: TeamMember[] }>('/api/admin/team', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
  updateTeamMember: (id: string, member: Partial<TeamMember>) =>
    adminFetch<{ ok: boolean; teamMembers: TeamMember[] }>(`/api/admin/team/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),
  reorderTeamMembers: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; teamMembers: TeamMember[] }>('/api/admin/team/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  deleteTeamMember: (id: string) =>
    adminFetch<{ ok: boolean; teamMembers: TeamMember[] }>(`/api/admin/team/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Products
  createProduct: (product: Omit<ProductItem, 'id'>) =>
    adminFetch<{ ok: boolean; products: ProductItem[] }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: string, product: Partial<ProductItem>) =>
    adminFetch<{ ok: boolean; products: ProductItem[] }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  reorderProducts: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; products: ProductItem[] }>('/api/admin/products/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  deleteProduct: (id: string) =>
    adminFetch<{ ok: boolean; products: ProductItem[] }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Software Programs
  createProgram: (program: Omit<SoftwareProgramItem, 'id'>) =>
    adminFetch<{ ok: boolean; softwarePrograms: SoftwareProgramItem[] }>('/api/admin/programs', {
      method: 'POST',
      body: JSON.stringify(program),
    }),
  updateProgram: (id: string, program: Partial<SoftwareProgramItem>) =>
    adminFetch<{ ok: boolean; softwarePrograms: SoftwareProgramItem[] }>(
      `/api/admin/programs/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(program) },
    ),
  deleteProgram: (id: string) =>
    adminFetch<{ ok: boolean; softwarePrograms: SoftwareProgramItem[] }>(
      `/api/admin/programs/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // Courses
  createCourse: (course: Omit<CourseItem, 'id'>) =>
    adminFetch<{ ok: boolean; courses: CourseItem[] }>('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),
  updateCourse: (id: string, course: Partial<CourseItem>) =>
    adminFetch<{ ok: boolean; courses: CourseItem[] }>(`/api/admin/courses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    }),
  reorderCourses: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; courses: CourseItem[] }>('/api/admin/courses/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  deleteCourse: (id: string) =>
    adminFetch<{ ok: boolean; courses: CourseItem[] }>(`/api/admin/courses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Social Links
  createSocial: (social: Omit<SocialLinkItem, 'id'>) =>
    adminFetch<{ ok: boolean; socialLinks: SocialLinkItem[] }>('/api/admin/socials', {
      method: 'POST',
      body: JSON.stringify(social),
    }),
  updateSocial: (id: string, social: Partial<SocialLinkItem>) =>
    adminFetch<{ ok: boolean; socialLinks: SocialLinkItem[] }>(
      `/api/admin/socials/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(social) },
    ),
  reorderSocials: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; socialLinks: SocialLinkItem[] }>('/api/admin/socials/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  deleteSocial: (id: string) =>
    adminFetch<{ ok: boolean; socialLinks: SocialLinkItem[] }>(
      `/api/admin/socials/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // Projects
  createProject: (project: Omit<ProjectItem, 'id'>) =>
    adminFetch<{ ok: boolean; id: string; projects: ProjectItem[] }>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  updateProject: (id: string, project: Partial<ProjectItem>) =>
    adminFetch<{ ok: boolean; projects: ProjectItem[] }>(
      `/api/admin/projects/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(project) },
    ),
  reorderProjects: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; projects: ProjectItem[] }>('/api/admin/projects/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
  deleteProject: (id: string) =>
    adminFetch<{ ok: boolean; projects: ProjectItem[] }>(
      `/api/admin/projects/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // Testimonials
  createTestimonial: (testimonial: Omit<TestimonialCmsItem, 'id'>) =>
    adminFetch<{ ok: boolean; id: string; testimonials: TestimonialCmsItem[] }>(
      '/api/admin/testimonials',
      {
        method: 'POST',
        body: JSON.stringify(testimonial),
      },
    ),
  updateTestimonial: (id: string, testimonial: Partial<TestimonialCmsItem>) =>
    adminFetch<{ ok: boolean; testimonials: TestimonialCmsItem[] }>(
      `/api/admin/testimonials/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(testimonial) },
    ),
  reorderTestimonials: (orderedIds: string[]) =>
    adminFetch<{ ok: boolean; testimonials: TestimonialCmsItem[] }>(
      '/api/admin/testimonials/reorder',
      {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      },
    ),
  deleteTestimonial: (id: string) =>
    adminFetch<{ ok: boolean; testimonials: TestimonialCmsItem[] }>(
      `/api/admin/testimonials/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // Enquiries Inbox
  getEnquiries: () =>
    adminFetch<{ enquiries: ContactSubmissionRecord[] }>('/api/admin/enquiries'),
  updateEnquiryStatus: (id: string, status: 'pending' | 'resolved') =>
    adminFetch<{ ok: boolean }>(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteEnquiry: (id: string) =>
    adminFetch<{ ok: boolean }>(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Media Uploads
  listUploads: () => adminFetch<{ assets: MediaAssetRecord[] }>('/api/admin/uploads'),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return adminFetch<{ asset: MediaAssetRecord }>('/api/admin/uploads', {
      method: 'POST',
      body: fd,
    });
  },
  deleteUpload: (id: string) =>
    adminFetch<{ ok: boolean }>(`/api/admin/uploads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Backup & Restore
  restoreBackup: (snapshot: unknown) =>
    adminFetch<{ ok: boolean; site: SiteContentPayload }>('/api/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    }),
};
