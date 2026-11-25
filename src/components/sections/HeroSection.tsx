import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { HeroSculptureCanvas } from '../three/HeroSculptureCanvas';
import { MagneticButton } from '../MagneticButton';
import { useSiteContent } from '../../context/SiteContentContext';
import { trackAnalyticsEvent } from '../../utils/analyticsClient';

interface HeroSectionProps {
  onExploreProducts: () => void;
  onStartProject: () => void;
  onNavigatePath?: (path: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreProducts,
  onStartProject,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const { homepage } = content;
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const sec = sectionRef.current;
      const img = bgRef.current;
      if (!sec || !img) return;
      const rect = sec.getBoundingClientRect();
      const y = Math.max(-36, Math.min(36, -rect.top * 0.08));
      img.style.transform = `scale(1.08) translate3d(0, ${y.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const eyebrowParts = homepage.heroEyebrow
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#1A1A1A] text-[#FFFFFF] pt-24 pb-20 lg:pt-28 lg:pb-24 flex flex-col justify-between"
    >
      {/* Vision-Style Full-Bleed Architectural Atmosphere Background */}
      <img
        ref={bgRef}
        src={homepage.heroBannerImage || '/src/assets/images/african_tech_horizon_1795614347746.jpg'}
        alt="Modern East African creative technology pavilion in Kampala at golden hour"
        referrerPolicy="no-referrer"
        style={{ transform: 'scale(1.08)' }}
        className="pointer-events-none absolute inset-0 w-full h-full object-cover object-center will-change-transform"
      />

      {/* Measured Directional Contrast Scrim (matching VisionSection) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/95 via-[#1A1A1A]/82 to-[#1A1A1A]/48"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1A1A1A]/90 to-transparent"
      />

      <div className="relative z-10 mx-auto my-auto w-full max-w-7xl px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Editorial Typographic Column */}
          <div className="lg:col-span-7 space-y-7">
            <div
              className="cn-blur-rise flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-xs font-semibold tracking-wider uppercase text-[#F5B800]"
              style={{ '--d': '80ms' } as React.CSSProperties}
            >
              {eyebrowParts.map((part, idx) => (
                <React.Fragment key={`${part}-${idx}`}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="hidden sm:inline text-[#F5B800]/60">
                      ·
                    </span>
                  )}
                  <span>{part}</span>
                </React.Fragment>
              ))}
            </div>

            <h1
              className="font-display font-extrabold tracking-[-0.04em] text-[#FFFFFF] leading-[0.96] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.6rem, 5.1vw, 4.75rem)' }}
            >
              <span className="cn-mask-line">
                <span style={{ '--d': '160ms' } as React.CSSProperties}>
                  {homepage.heroHeadlineLine1}
                </span>
              </span>
              <span className="cn-mask-line">
                <span style={{ '--d': '290ms' } as React.CSSProperties}>
                  {homepage.heroHeadlineLine2}
                </span>
              </span>
            </h1>

            <p
              className="cn-blur-rise max-w-xl text-lg sm:text-xl leading-relaxed text-[#F2EBDD]/90"
              style={{ '--d': '420ms' } as React.CSSProperties}
            >
              {homepage.heroSupportingText}
            </p>

            <div
              className="cn-blur-rise flex flex-wrap items-center gap-4 pt-2"
              style={{ '--d': '540ms' } as React.CSSProperties}
            >
              <MagneticButton
                type="button"
                onClick={() => {
                  trackAnalyticsEvent('button_click', `Hero: ${homepage.heroPrimaryCtaLabel}`);
                  onExploreProducts();
                }}
                className="inline-flex items-center gap-3 bg-[#F5B800] px-7 py-4 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#FFFFFF]"
              >
                <span className="btn-roll-wrap">
                  <span>{homepage.heroPrimaryCtaLabel}</span>
                  <span aria-hidden="true">{homepage.heroPrimaryCtaLabel}</span>
                </span>
                <ArrowUpRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </MagneticButton>

              <button
                type="button"
                onClick={() => {
                  trackAnalyticsEvent('contact_click', `Hero: ${homepage.heroSecondaryCtaLabel}`);
                  onStartProject();
                }}
                className="group inline-flex items-center gap-2 border border-white/30 bg-[#1A1A1A]/40 px-6 py-4 text-sm font-semibold text-[#F2EBDD] transition-colors hover:border-[#F5B800] hover:text-[#F5B800] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F5B800]"
              >
                <span className="btn-roll-wrap">
                  <span>{homepage.heroSecondaryCtaLabel}</span>
                  <span aria-hidden="true">{homepage.heroSecondaryCtaLabel}</span>
                </span>
              </button>
            </div>

            {/* Three Core Offerings Index */}
            <div
              className="cn-blur-rise pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-sm"
              style={{ '--d': '680ms' } as React.CSSProperties}
            >
              <a
                href="/solutions"
                onClick={(e) => {
                  if (onNavigatePath) {
                    e.preventDefault();
                    onNavigatePath('/solutions');
                  }
                }}
                className="group block text-left"
              >
                <p className="font-semibold text-[#F5B800] group-hover:text-white transition-colors">
                  01 · Software Development
                </p>
                <p className="mt-1 text-[#F2EBDD]/75">
                  Custom applications engineered to solve real operational problems.
                </p>
              </a>
              <a
                href="/products/voxlan"
                onClick={(e) => {
                  if (onNavigatePath) {
                    e.preventDefault();
                    onNavigatePath('/products/voxlan');
                  }
                }}
                className="group block text-left"
              >
                <p className="font-semibold text-[#F5B800] group-hover:text-white transition-colors">
                  02 · VOXLAN Offline Voting
                </p>
                <p className="mt-1 text-[#F2EBDD]/75">
                  Zero-internet school elections with live results and analytics.
                </p>
              </a>
              <a
                href="/academy"
                onClick={(e) => {
                  if (onNavigatePath) {
                    e.preventDefault();
                    onNavigatePath('/academy');
                  }
                }}
                className="group block text-left"
              >
                <p className="font-semibold text-[#F5B800] group-hover:text-white transition-colors">
                  03 · Programming Lessons
                </p>
                <p className="mt-1 text-[#F2EBDD]/75">
                  Practical Python, Web Development, and Artificial Intelligence training.
                </p>
              </a>
            </div>
          </div>

          {/* Right 3D Centerpiece Floating Seamlessly Over the Atmospheric Backdrop */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[540px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-full opacity-55"
                style={{
                  background:
                    'radial-gradient(circle, rgba(76, 19, 142, 0.35) 0%, rgba(245, 184, 0, 0.08) 45%, transparent 72%)',
                }}
              />
              <HeroSculptureCanvas />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 pt-6">
        <div className="flex items-center justify-between border-t border-white/15 pt-5 text-xs text-[#F2EBDD]/75">
          <a
            href="#introduction"
            className="inline-flex items-center gap-2.5 hover:text-[#F5B800] transition-colors focus-visible:outline-2 focus-visible:outline-[#F5B800]"
          >
            <ArrowDown className="w-4 h-4 text-[#F5B800]" aria-hidden="true" />
            <span>Scroll to explore the studio story</span>
          </a>
          <span className="hidden sm:inline font-mono-tabular">
            Interactive 3D · Move cursor to orbit
          </span>
        </div>
      </div>
    </section>
  );
};
