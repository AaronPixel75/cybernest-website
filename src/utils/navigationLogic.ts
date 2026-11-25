import type { ProjectCategory, ProjectItem, SiteContentPayload } from '../types/cms.ts';

export type NavPage =
  | 'home'
  | 'about'
  | 'solutions'
  | 'products'
  | 'academy'
  | 'work'
  | 'testimonials'
  | 'contact';

export type RoutePage =
  | NavPage
  | 'product-detail'
  | 'academy-detail'
  | 'work-detail'
  | 'admin'
  | 'not-found';

export interface ParsedRoute {
  page: RoutePage;
  activeNav: NavPage | null;
  slug?: string;
  pathname: string;
}

export interface NavItem {
  id: NavPage;
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About Us', path: '/about' },
  { id: 'solutions', label: 'Solutions', path: '/solutions' },
  { id: 'products', label: 'Our Products', path: '/products' },
  { id: 'academy', label: 'Academy', path: '/academy' },
  { id: 'work', label: 'Our Work', path: '/work' },
  { id: 'contact', label: 'Contact', path: '/contact' },
];

export const FOOTER_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About Us', path: '/about' },
  { id: 'solutions', label: 'Solutions', path: '/solutions' },
  { id: 'products', label: 'Our Products', path: '/products' },
  { id: 'academy', label: 'Academy', path: '/academy' },
  { id: 'work', label: 'Our Work', path: '/work' },
  { id: 'testimonials', label: 'Testimonials', path: '/testimonials' },
  { id: 'contact', label: 'Contact', path: '/contact' },
];

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  'Software and Applications',
  'Artificial Intelligence',
  'Education Technology',
  'Robotics and Innovation',
  'Other Technology Projects',
];

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function normalizePathname(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0].trim();
  if (!clean || clean === '/') return '/';
  return clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseRoute(rawPathname: string): ParsedRoute {
  const pathname = normalizePathname(rawPathname);
  if (pathname === '/') return { page: 'home', activeNav: 'home', pathname };
  if (pathname === '/about') return { page: 'about', activeNav: 'about', pathname };
  if (pathname === '/solutions') return { page: 'solutions', activeNav: 'solutions', pathname };
  if (pathname === '/products') return { page: 'products', activeNav: 'products', pathname };
  if (pathname.startsWith('/products/')) {
    const slug = decodeURIComponent(pathname.slice('/products/'.length));
    if (slug && !slug.includes('/')) {
      return { page: 'product-detail', activeNav: 'products', slug, pathname };
    }
  }
  if (pathname === '/academy') return { page: 'academy', activeNav: 'academy', pathname };
  if (pathname.startsWith('/academy/')) {
    const slug = decodeURIComponent(pathname.slice('/academy/'.length));
    if (slug && !slug.includes('/')) {
      return { page: 'academy-detail', activeNav: 'academy', slug, pathname };
    }
  }
  if (pathname === '/work') return { page: 'work', activeNav: 'work', pathname };
  if (pathname.startsWith('/work/')) {
    const slug = decodeURIComponent(pathname.slice('/work/'.length));
    if (slug && !slug.includes('/')) {
      return { page: 'work-detail', activeNav: 'work', slug, pathname };
    }
  }
  if (pathname === '/testimonials') {
    return { page: 'testimonials', activeNav: 'about', pathname };
  }
  if (pathname === '/contact') return { page: 'contact', activeNav: 'contact', pathname };
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return { page: 'admin', activeNav: null, pathname };
  }
  return { page: 'not-found', activeNav: null, pathname };
}

export function buildBreadcrumbs(
  route: ParsedRoute,
  site?: Pick<SiteContentPayload, 'products' | 'courses' | 'projects'>,
): BreadcrumbItem[] {
  const base: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];
  switch (route.page) {
    case 'home':
      return base;
    case 'about':
      return [...base, { label: 'About Us' }];
    case 'solutions':
      return [...base, { label: 'Solutions' }];
    case 'products':
      return [...base, { label: 'Our Products' }];
    case 'product-detail': {
      const prod = site?.products.find(
        (p) => p.id === route.slug || slugifyText(p.name) === route.slug,
      );
      return [
        ...base,
        { label: 'Our Products', path: '/products' },
        { label: prod?.name || route.slug || 'Product' },
      ];
    }
    case 'academy':
      return [...base, { label: 'Academy' }];
    case 'academy-detail': {
      const course = site?.courses.find(
        (c) => c.id === route.slug || slugifyText(c.title) === route.slug,
      );
      return [
        ...base,
        { label: 'Academy', path: '/academy' },
        { label: course?.title || route.slug || 'Course' },
      ];
    }
    case 'work':
      return [...base, { label: 'Our Work' }];
    case 'work-detail': {
      const proj = site?.projects.find(
        (p) => p.slug === route.slug || p.id === route.slug,
      );
      return [
        ...base,
        { label: 'Our Work', path: '/work' },
        { label: proj?.title || route.slug || 'Project' },
      ];
    }
    case 'testimonials':
      return [...base, { label: 'Testimonials' }];
    case 'contact':
      return [...base, { label: 'Contact' }];
    default:
      return [...base, { label: 'Page Not Found' }];
  }
}

export function filterProjects(
  projects: ProjectItem[],
  category: 'All' | ProjectCategory,
): ProjectItem[] {
  if (category === 'All') return projects;
  return projects.filter((p) => p.category === category);
}

export function wrapCarouselIndex(current: number, delta: number, total: number): number {
  if (total <= 0) return 0;
  return (((current + delta) % total) + total) % total;
}

export function clampChapterIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}
