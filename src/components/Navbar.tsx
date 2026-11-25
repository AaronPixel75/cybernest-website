import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import {
  FOOTER_NAV_ITEMS,
  NAV_ITEMS,
  NavPage,
  slugifyText,
} from '../utils/navigationLogic';
import { BrandMark } from './BrandMark';

interface NavbarProps {
  activeNav: NavPage | null;
  currentPath: string;
  onNavigatePath: (path: string) => void;
}

interface DropdownItem {
  label: string;
  path: string;
  note?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeNav,
  currentPath,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<NavPage | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 72);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isLightHeader = scrolled || currentPath !== '/';
  const primaryLinks = NAV_ITEMS.filter((item) => item.id !== 'contact');

  const getDropdownItems = (id: NavPage): DropdownItem[] | null => {
    if (id === 'about') {
      return [
        { label: 'Our Story & Vision', path: '/about', note: 'Mission, values & milestones' },
        { label: 'Testimonials', path: '/testimonials', note: 'Voices & project outcomes' },
      ];
    }
    if (id === 'products') {
      return [
        { label: 'All Products', path: '/products', note: 'Software systems overview' },
        ...content.products.map((p) => ({
          label: p.name,
          path: `/products/${slugifyText(p.id || p.name)}`,
          note: p.category,
        })),
      ];
    }
    if (id === 'academy') {
      return [
        { label: 'Academy Overview', path: '/academy', note: 'All hands-on coding tracks' },
        ...content.courses.map((c) => ({
          label: c.title,
          path: `/academy/${slugifyText(c.id || c.title)}`,
          note: c.audience,
        })),
      ];
    }
    if (id === 'work') {
      return [
        { label: 'All Projects', path: '/work', note: 'Explore our case studies' },
        { label: 'Testimonials', path: '/testimonials', note: 'Client & student feedback' },
      ];
    }
    return null;
  };

  const cancelCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
    }, 160);
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setOpenDropdown(null);
    setMobileOpen(false);
    onNavigatePath(path);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[70] transition-all duration-300 ${
          isLightHeader
            ? 'bg-[#F2EBDD]/95 backdrop-blur-md text-[#1A1A1A] border-b border-[#1A1A1A]/12 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
            : 'bg-transparent text-[#FFFFFF] border-b border-white/10'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 lg:gap-6 px-6 py-4 lg:px-10">
          {/* Zone 1: Brand wordmark */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#F5B800] rounded-sm"
            aria-label="CyberNest Home"
          >
            <BrandMark variant={isLightHeader ? 'dark' : 'light'} />
          </a>

          {/* Zone 2: Single-line navigation with accessible dropdowns */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium"
          >
            {primaryLinks.map((item) => {
              const isActive = activeNav === item.id;
              const dropdownItems = getDropdownItems(item.id);
              const isOpen = openDropdown === item.id;

              return (
                <div
                  key={item.id}
                  className="relative flex items-center"
                  onMouseEnter={() => {
                    if (dropdownItems) {
                      cancelCloseTimer();
                      setOpenDropdown(item.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (dropdownItems) scheduleClose();
                  }}
                >
                  <a
                    href={item.path}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={(e) => handleLinkClick(e, item.path)}
                    className={`nav-link-line relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#F5B800] ${
                      isLightHeader
                        ? isActive
                          ? 'text-[#4C138E] font-semibold'
                          : 'text-[#1A1A1A]/80 hover:text-[#1A1A1A]'
                        : isActive
                          ? 'text-[#F5B800] font-semibold'
                          : 'text-white/85 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>

                  {dropdownItems && (
                    <button
                      type="button"
                      aria-label={`Toggle ${item.label} submenu`}
                      aria-expanded={isOpen}
                      onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                      className={`ml-0.5 p-1 transition-transform duration-150 cursor-pointer ${
                        isOpen ? 'rotate-180' : ''
                      } ${
                        isLightHeader
                          ? 'text-[#1A1A1A]/65 hover:text-[#4C138E]'
                          : 'text-white/70 hover:text-[#F5B800]'
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  {dropdownItems && isOpen && (
                    <div
                      onMouseEnter={cancelCloseTimer}
                      onMouseLeave={scheduleClose}
                      className={`absolute left-0 top-full mt-3 w-64 border shadow-[0_20px_50px_rgba(0,0,0,0.22)] py-2 z-[75] ${
                        isLightHeader
                          ? 'bg-[#FFFFFF] text-[#1A1A1A] border-[#1A1A1A]/15'
                          : 'bg-[#1A1A1A] text-[#F2EBDD] border-white/15'
                      }`}
                    >
                      {dropdownItems.map((sub) => (
                        <a
                          key={sub.path}
                          href={sub.path}
                          onClick={(e) => handleLinkClick(e, sub.path)}
                          className={`block px-4 py-2.5 transition-colors ${
                            currentPath === sub.path
                              ? isLightHeader
                                ? 'bg-[#F2EBDD] text-[#4C138E]'
                                : 'bg-[#4C138E]/40 text-[#F5B800]'
                              : isLightHeader
                                ? 'hover:bg-[#F2EBDD]/60'
                                : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="block text-xs font-bold">{sub.label}</span>
                          {sub.note && (
                            <span
                              className={`block text-[11px] mt-0.5 truncate ${
                                isLightHeader ? 'text-[#1A1A1A]/60' : 'text-[#F2EBDD]/60'
                              }`}
                            >
                              {sub.note}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Zone 3: Contact Primary CTA + Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/contact"
              onClick={(e) => handleLinkClick(e, '/contact')}
              className={`group hidden lg:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#F5B800] ${
                isLightHeader
                  ? 'bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#4C138E]'
                  : 'bg-[#F5B800] text-[#1A1A1A] hover:bg-[#FFFFFF]'
              }`}
            >
              <span className="btn-roll-wrap">
                <span>Contact</span>
                <span aria-hidden="true">Contact</span>
              </span>
              <ArrowUpRight
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`lg:hidden inline-flex items-center justify-center w-11 h-11 border transition-colors cursor-pointer ${
                isLightHeader
                  ? 'border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
                  : 'border-white/25 text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 z-[80] bg-[#1A1A1A] text-[#F2EBDD] flex flex-col justify-between p-6 overflow-y-auto lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <BrandMark variant="light" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex items-center justify-center w-11 h-11 border border-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 my-6" aria-label="Mobile links">
            {FOOTER_NAV_ITEMS.map((item, idx) => {
              const isActive =
                activeNav === item.id ||
                (item.id === 'testimonials' && currentPath === '/testimonials');
              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleLinkClick(e, item.path)}
                  className={`flex items-baseline justify-between py-3 px-2 text-left border-b border-white/10 transition-colors ${
                    isActive ? 'text-[#F5B800]' : 'text-[#F2EBDD] hover:text-[#F5B800]'
                  }`}
                >
                  <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {item.label}
                  </span>
                  <span className="font-mono-tabular text-xs text-white/50">
                    0{idx + 1}
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <span>Kampala, Uganda</span>
            <a
              href="/products/voxlan"
              onClick={(e) => handleLinkClick(e, '/products/voxlan')}
              className="text-[#F5B800] font-semibold hover:underline"
            >
              Explore VOXLAN
            </a>
          </div>
        </div>
      )}
    </>
  );
};
