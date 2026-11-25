/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BackToTopButton } from './components/BackToTopButton';
import { Navbar } from './components/Navbar';
import { PrivacyNoticeBanner } from './components/PrivacyNoticeBanner';
import { SiteFooter } from './components/SiteFooter';
import { SiteContentProvider, useSiteContent } from './context/SiteContentContext';
import { AboutPage } from './pages/AboutPage';
import { AcademyPage } from './pages/AcademyPage';
import { ContactPage } from './pages/ContactPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { WorkPage } from './pages/WorkPage';
import { trackAnalyticsEvent } from './utils/analyticsClient';
import {
  buildBreadcrumbs,
  normalizePathname,
  parseRoute,
} from './utils/navigationLogic';

const AdminApp = lazy(() =>
  import('./admin/AdminApp').then((mod) => ({ default: mod.AdminApp })),
);

const PublicMultiPageShell: React.FC<{
  pathname: string;
  onNavigatePath: (path: string) => void;
}> = ({ pathname, onNavigatePath }) => {
  const { content } = useSiteContent();
  const route = parseRoute(pathname);
  const breadcrumbs = buildBreadcrumbs(route, content);

  // Sync meaningful document title per route
  useEffect(() => {
    const baseTitle = content.seo.siteTitle || 'CyberNest Uganda';
    const tail = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1]?.label : '';
    document.title = tail && route.page !== 'home' ? `${tail} · ${baseTitle}` : baseTitle;
  }, [breadcrumbs, content.seo.siteTitle, route.page]);

  // Privacy-respecting pageview tracking on public route changes
  useEffect(() => {
    if (route.page === 'admin') return;
    trackAnalyticsEvent('pageview', document.title || `CyberNest ${route.page}`, route.pathname);
  }, [route.page, route.pathname]);

  // Active session heartbeat tied to the current route
  useEffect(() => {
    if (route.page === 'admin') return;
    const sendHeartbeat = () => {
      trackAnalyticsEvent('heartbeat', 'Session Activity', route.pathname, true);
    };

    const intervalId = window.setInterval(sendHeartbeat, 20000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', sendHeartbeat);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', sendHeartbeat);
    };
  }, [route.page, route.pathname]);

  const renderPage = () => {
    switch (route.page) {
      case 'home':
        return <HomePage onNavigatePath={onNavigatePath} />;
      case 'about':
        return <AboutPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'solutions':
        return <SolutionsPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'products':
        return <ProductsPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'product-detail':
        return (
          <ProductDetailPage
            slug={route.slug || ''}
            breadcrumbs={breadcrumbs}
            onNavigatePath={onNavigatePath}
          />
        );
      case 'academy':
        return <AcademyPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'academy-detail':
        return (
          <CourseDetailPage
            slug={route.slug || ''}
            breadcrumbs={breadcrumbs}
            onNavigatePath={onNavigatePath}
          />
        );
      case 'work':
        return <WorkPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'work-detail':
        return (
          <ProjectDetailPage
            slug={route.slug || ''}
            breadcrumbs={breadcrumbs}
            onNavigatePath={onNavigatePath}
          />
        );
      case 'testimonials':
        return <TestimonialsPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      case 'contact':
        return <ContactPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
      default:
        return <NotFoundPage breadcrumbs={breadcrumbs} onNavigatePath={onNavigatePath} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F2EBDD] flex flex-col">
      <Navbar
        activeNav={route.activeNav}
        currentPath={route.pathname}
        onNavigatePath={onNavigatePath}
      />

      <main className="flex-1">{renderPage()}</main>

      <SiteFooter onNavigatePath={onNavigatePath} />
      <BackToTopButton />
      <PrivacyNoticeBanner />
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { refreshContent } = useSiteContent();
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePathname(window.location.pathname || '/') : '/',
  );

  useEffect(() => {
    const onPopState = () => {
      setPathname(normalizePathname(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateToPath = useCallback((nextPath: string) => {
    const [rawPathPart, hashPart] = nextPath.split('#');
    const cleanPath = normalizePathname(rawPathPart || '/');

    if (typeof window !== 'undefined') {
      const targetUrl = hashPart ? `${cleanPath}#${hashPart}` : cleanPath;
      if (window.location.pathname + window.location.hash !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }

      if (hashPart) {
        window.setTimeout(() => {
          const el = document.getElementById(hashPart);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 60);
      } else {
        window.scrollTo({
          top: 0,
          behavior: cleanPath.startsWith('/admin') ? 'auto' : 'smooth',
        });
      }
    }

    setPathname(cleanPath);
  }, []);

  if (pathname.startsWith('/admin')) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] flex items-center justify-center p-6">
            <div className="border border-[#1A1A1A]/15 bg-white px-6 py-4 text-sm font-medium">
              Loading CyberNest Admin Workspace...
            </div>
          </div>
        }
      >
        <AdminApp
          onExitToSite={() => {
            refreshContent();
            navigateToPath('/');
          }}
        />
      </Suspense>
    );
  }

  return <PublicMultiPageShell pathname={pathname} onNavigatePath={navigateToPath} />;
};

export default function App() {
  return (
    <SiteContentProvider>
      <AppRouter />
    </SiteContentProvider>
  );
}
