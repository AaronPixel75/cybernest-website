import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Code2 } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

interface IntroSectionProps {
  teaserMode?: boolean;
  onNavigatePath?: (path: string) => void;
}

export const IntroSection: React.FC<IntroSectionProps> = ({
  teaserMode = false,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const { about } = content;
  const manifestoWords = about.introManifesto.split(' ');
  const sectionRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [fillProgress, setFillProgress] = useState(1);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduced) {
      setFillProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const sec = sectionRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight || 900;

      const raw = (vh * 0.85 - rect.top) / Math.max(1, vh * 0.68);
      const clamped = Math.max(0.15, Math.min(1, raw));
      setFillProgress(clamped);

      if (imgRef.current) {
        const centerDelta = rect.top + rect.height / 2 - vh / 2;
        const shift = Math.max(-28, Math.min(28, -centerDelta * 0.06));
        imgRef.current.style.transform = `scale(1.07) translate3d(0, ${shift.toFixed(1)}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="introduction"
      className="scroll-mt-14 relative z-10 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Editorial Kicker */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/15 pb-5 mb-12">
          <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
            <span className="font-mono-tabular">02</span>
            <span aria-hidden="true">·</span>
            <span>Who We Are</span>
          </div>
          <span className="text-xs text-[#1A1A1A]/65">
            Registered Technology Company · Kampala, Uganda
          </span>
        </div>

        {/* Asymmetric 12-Column Magazine Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h2
                className="font-display font-bold tracking-[-0.03em] text-[#1A1A1A] leading-[1.01] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.25rem, 4.3vw, 3.75rem)' }}
              >
                {about.introHeadline}
              </h2>

              {/* MotionSites Word-by-Word Scroll-Fill Editorial Manifesto */}
              <p className="text-lg sm:text-xl leading-relaxed max-w-xl font-medium">
                {manifestoWords.map((word, idx) => {
                  const threshold = idx / Math.max(1, manifestoWords.length);
                  const softEdge = Math.max(
                    0,
                    Math.min(1, (fillProgress - threshold) * 8 + 0.35),
                  );
                  return (
                    <span
                      key={idx}
                      style={{
                        color: `rgba(26, 26, 26, ${0.32 + softEdge * 0.68})`,
                        transition: 'color 120ms linear',
                      }}
                    >
                      {word}
                      {idx < manifestoWords.length - 1 ? ' ' : ''}
                    </span>
                  );
                })}
              </p>

              <p className="text-base leading-relaxed text-[#1A1A1A]/75 max-w-xl">
                {about.introSecondaryText}
              </p>

              {teaserMode && onNavigatePath && (
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath('/about');
                    }}
                    className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#4C138E] transition-colors"
                  >
                    <span>Explore Our Story & Team</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a
                    href="/work"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath('/work');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4C138E] hover:text-[#1A1A1A] transition-colors"
                  >
                    <span>See Our Work</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>

            {/* Editorial Studio Commitments */}
            <div className="pt-8 border-t border-[#1A1A1A]/15 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                  Build
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#1A1A1A]">
                  Original software programs engineered for clarity
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                  Solve
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#1A1A1A]">
                  VOXLAN offline voting & practical institutional tools
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                  Teach
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#1A1A1A]">
                  Hands-on Python, Web Development & AI lessons
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Media Plate with Single-Element Scroll Parallax */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="relative flex-1 overflow-hidden border border-[#1A1A1A]/15 bg-[#1A1A1A] min-h-[320px] lg:h-full flex flex-col">
              <div className="relative flex-1 overflow-hidden">
                <img
                  ref={imgRef}
                  src={about.introImage || '/src/assets/images/software_studio_workspace_1795623443907.jpg'}
                  alt="Ugandan software engineers developing applications and designing interfaces at the CyberNest studio in Kampala"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  style={{ transform: 'scale(1.07)' }}
                  className="w-full h-full object-cover will-change-transform"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-center bg-[#1A1A1A] text-[#F2EBDD]/40"
                >
                  <Code2 className="w-10 h-10 mb-2" />
                  <span className="text-xs uppercase tracking-widest">CyberNest Software Studio</span>
                </div>
              </div>
              <div className="bg-[#1A1A1A] text-[#F2EBDD] px-5 py-3.5 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
                <span className="font-medium">
                  {about.introCaption || 'Software Engineering & Product Design Studio'}
                </span>
                <span className="font-mono-tabular text-[#F5B800]">Kampala · Studio 01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Milestones & Achievements */}
        {!teaserMode && about.milestones.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#1A1A1A]/15">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E] mb-6">
              Milestones & Achievements
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {about.milestones.map((ms) => (
                <div
                  key={ms.id}
                  className="bg-[#FFFFFF]/70 border border-[#1A1A1A]/12 p-5 space-y-2"
                >
                  <span className="font-mono-tabular text-xs font-bold text-[#8D5B38]">
                    {ms.year}
                  </span>
                  <h3 className="font-display text-base font-bold text-[#1A1A1A]">{ms.title}</h3>
                  <p className="text-xs leading-relaxed text-[#1A1A1A]/75">{ms.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
