import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Box,
  Briefcase,
  Database,
  ExternalLink,
  Globe,
  Home,
  Inbox,
  LogOut,
  Menu,
  Phone,
  Quote,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminAuthStatus,
  ContactSubmissionRecord,
  SiteContentPayload,
} from '../types/cms';
import { adminApi } from './api';
import { AnalyticsView } from './views/AnalyticsView';
import { BackupSecurityView } from './views/BackupSecurityView';
import { ContactSocialView } from './views/ContactSocialView';
import { CoursesManagerView } from './views/CoursesManagerView';
import { HomepageAboutView } from './views/HomepageAboutView';
import { InboxView } from './views/InboxView';
import { ProductsManagerView } from './views/ProductsManagerView';
import { ProjectsManagerView } from './views/ProjectsManagerView';
import { SeoSettingsView } from './views/SeoSettingsView';
import { TeamManagerView } from './views/TeamManagerView';
import { TestimonialsManagerView } from './views/TestimonialsManagerView';

type AdminTab =
  | 'analytics'
  | 'inbox'
  | 'team'
  | 'products'
  | 'projects'
  | 'courses'
  | 'testimonials'
  | 'homepage'
  | 'contact'
  | 'seo'
  | 'backup';

const NAV_SECTIONS: {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'inbox', label: 'Enquiries Inbox', icon: Inbox },
  { id: 'team', label: 'Team Carousel', icon: Users },
  { id: 'products', label: 'Products & Software', icon: Box },
  { id: 'projects', label: 'Projects Showcase', icon: Briefcase },
  { id: 'courses', label: 'Programming Courses', icon: BookOpen },
  { id: 'testimonials', label: 'Testimonials', icon: Quote },
  { id: 'homepage', label: 'Homepage & About', icon: Home },
  { id: 'contact', label: 'Contact & Socials', icon: Phone },
  { id: 'seo', label: 'SEO & Footer', icon: Globe },
  { id: 'backup', label: 'Backups & Security', icon: Database },
];

interface AdminAppProps {
  onExitToSite: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onExitToSite }) => {
  const [auth, setAuth] = useState<AdminAuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('admin@cybernestug.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [site, setSite] = useState<SiteContentPayload | null>(null);
  const [enquiries, setEnquiries] = useState<ContactSubmissionRecord[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 4500);
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    const [siteRes, inboxRes] = await Promise.all([
      adminApi.getSiteContent(),
      adminApi.getEnquiries(),
    ]);
    setSite(siteRes);
    setEnquiries(inboxRes.enquiries);
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const status = await adminApi.getAuthStatus();
      setAuth(status);
      if (status.authenticated) {
        await loadWorkspaceData();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to reach admin server.');
    } finally {
      setAuthLoading(false);
    }
  }, [loadWorkspaceData]);

  useEffect(() => {
    document.title = 'CyberNest Admin · Dashboard & CMS';
    refreshAuth();
  }, [refreshAuth]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (passwordInput !== confirmPassInput) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await adminApi.claimAdmin(emailInput.trim(), passwordInput);
      setAuth({
        initialized: true,
        envOverrideActive: false,
        authenticated: res.authenticated,
        adminEmail: res.adminEmail,
      });
      setPasswordInput('');
      setConfirmPassInput('');
      await loadWorkspaceData();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Setup failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await adminApi.login(emailInput.trim(), passwordInput);
      setAuth((prev) => ({
        initialized: true,
        envOverrideActive: prev?.envOverrideActive ?? false,
        authenticated: res.authenticated,
        adminEmail: res.adminEmail,
      }));
      setPasswordInput('');
      await loadWorkspaceData();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } finally {
      setSite(null);
      setEnquiries([]);
      setAuth((prev) =>
        prev ? { ...prev, authenticated: false, adminEmail: null } : null,
      );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] flex items-center justify-center p-6">
        <div className="border border-[#1A1A1A]/15 bg-white px-6 py-4 text-sm font-medium">
          Verifying CyberNest administrator session...
        </div>
      </div>
    );
  }

  // Unauthenticated Gate: First-Run Claim or Login
  if (!auth?.authenticated) {
    const isClaimMode = !auth?.initialized && !auth?.envOverrideActive;
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-[#F2EBDD] flex flex-col justify-between p-6">
        <div className="mx-auto w-full max-w-md my-auto bg-[#231E29] border border-white/15 p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>CyberNest Private Admin</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">
              {isClaimMode ? 'Create Administrator Account' : 'Administrator Sign In'}
            </h1>
            <p className="text-xs text-[#F2EBDD]/75 leading-relaxed">
              {isClaimMode
                ? 'First-run setup: claim the administrator account to manage website content, analytics, and enquiries.'
                : 'Sign in to access CyberNest analytics, CMS editors, and contact submissions.'}
            </p>
          </div>

          <form onSubmit={isClaimMode ? handleClaim : handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-1.5"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/20 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5B800]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={isClaimMode ? 'Minimum 8 characters' : 'Enter password'}
                className="w-full bg-[#1A1A1A] border border-white/20 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5B800]"
              />
            </div>

            {isClaimMode && (
              <div>
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/20 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5B800]"
                />
              </div>
            )}

            {authError && (
              <p role="alert" className="text-xs text-rose-300 font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-[#F5B800] py-3 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
            >
              {authSubmitting
                ? 'Please wait...'
                : isClaimMode
                  ? 'Initialize Admin Account'
                  : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/12 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onExitToSite}
              className="inline-flex items-center gap-1.5 text-[#F2EBDD]/75 hover:text-[#F5B800] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Public Website</span>
            </button>
            <span className="text-[#F2EBDD]/45">cybernestug.com</span>
          </div>
        </div>
      </div>
    );
  }

  const pendingEnquiriesCount = enquiries.filter((e) => e.status === 'pending').length;
  const activeSectionMeta = NAV_SECTIONS.find((s) => s.id === activeTab) || NAV_SECTIONS[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight text-white">
              CYBERNEST
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[#F5B800]">
              CMS & Analytics
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1 text-white/70 hover:text-white cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="p-3 space-y-1">
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#4C138E] text-white'
                    : 'text-[#F2EBDD]/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#F5B800]" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'inbox' && pendingEnquiriesCount > 0 && (
                  <span className="font-mono-tabular text-[11px] bg-[#F5B800] text-[#1A1A1A] px-1.5 py-0.5 font-bold">
                    {pendingEnquiriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 space-y-2 text-xs">
        <p className="text-[11px] text-[#F2EBDD]/55 truncate" title={auth.adminEmail || ''}>
          {auth.adminEmail}
        </p>
        <button
          type="button"
          onClick={onExitToSite}
          className="w-full inline-flex items-center justify-center gap-1.5 border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:border-[#F5B800] hover:text-[#F5B800] cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Live Website</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] flex">
      {/* Desktop 256px Sidebar Rail */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#1A1A1A] text-[#F2EBDD] border-r border-black/20">
        <div className="sticky top-0 h-screen overflow-y-auto">{renderSidebarContent()}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden flex">
          <div className="w-64 bg-[#1A1A1A] text-[#F2EBDD] h-full overflow-y-auto">
            {renderSidebarContent()}
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      {/* Main Operational Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-[#1A1A1A]/12 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 border border-[#1A1A1A]/15 text-[#1A1A1A] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-[#1A1A1A]/55 flex items-center gap-2 truncate">
              <span>Admin</span>
              <span aria-hidden="true">/</span>
              <h1 className="font-display text-sm sm:text-base font-bold text-[#1A1A1A] truncate">
                {activeSectionMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onExitToSite}
              className="hidden sm:inline-flex items-center gap-1.5 border border-[#1A1A1A]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:border-[#4C138E] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Site</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {toast && (
          <div
            role="status"
            className={`mx-4 sm:mx-6 mt-4 px-4 py-2.5 text-xs font-semibold border flex items-center justify-between gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            <span>{toast.msg}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="p-4 sm:p-6 flex-1">
          {!site ? (
            <div className="bg-white border border-[#1A1A1A]/12 p-6 text-sm text-[#1A1A1A]/65">
              Loading CMS content...
            </div>
          ) : (
            <>
              {activeTab === 'analytics' && <AnalyticsView onToast={showToast} />}

              {activeTab === 'inbox' && (
                <InboxView
                  enquiries={enquiries}
                  onRefresh={async () => {
                    const res = await adminApi.getEnquiries();
                    setEnquiries(res.enquiries);
                  }}
                  onUpdatedEnquiries={setEnquiries}
                  onToast={showToast}
                />
              )}

              {activeTab === 'team' && (
                <TeamManagerView
                  members={site.teamMembers}
                  onUpdated={(teamMembers) => setSite({ ...site, teamMembers })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'products' && (
                <ProductsManagerView
                  products={site.products}
                  programs={site.softwarePrograms}
                  onUpdatedProducts={(products) => setSite({ ...site, products })}
                  onUpdatedPrograms={(softwarePrograms) => setSite({ ...site, softwarePrograms })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsManagerView
                  projects={site.projects}
                  products={site.products}
                  onUpdated={(projects) => setSite({ ...site, projects })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesManagerView
                  courses={site.courses}
                  onUpdated={(courses) => setSite({ ...site, courses })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'testimonials' && (
                <TestimonialsManagerView
                  testimonials={site.testimonials}
                  projects={site.projects}
                  onUpdated={(testimonials) => setSite({ ...site, testimonials })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'homepage' && (
                <HomepageAboutView
                  homepage={site.homepage}
                  about={site.about}
                  products={site.products}
                  projects={site.projects}
                  testimonials={site.testimonials}
                  onUpdatedHomepage={(homepage) => setSite({ ...site, homepage })}
                  onUpdatedAbout={(about) => setSite({ ...site, about })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'contact' && (
                <ContactSocialView
                  contact={site.contact}
                  socialLinks={site.socialLinks}
                  onUpdatedContact={(contact) => setSite({ ...site, contact })}
                  onUpdatedSocials={(socialLinks) => setSite({ ...site, socialLinks })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'seo' && (
                <SeoSettingsView
                  seo={site.seo}
                  onUpdatedSeo={(seo) => setSite({ ...site, seo })}
                  onToast={showToast}
                />
              )}

              {activeTab === 'backup' && (
                <BackupSecurityView
                  envOverrideActive={auth.envOverrideActive}
                  adminEmail={auth.adminEmail}
                  onSiteRestored={(restored) => setSite(restored)}
                  onToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
