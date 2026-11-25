import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY_CHAPTERS } from '../../data/content';
import { ScrollyStageCanvas } from '../three/ScrollyStageCanvas';
import { clampChapterIndex } from '../../utils/navigationLogic';

gsap.registerPlugin(ScrollTrigger);

const CHAPTER_IMAGE_MAP: Record<string, { src: string; alt: string } | undefined> = {
  creations: {
    src: '/src/assets/images/voxlan_hardware_booth_1795614347044.jpg',
    alt: 'VOXLAN offline electronic voting terminals crafted by CyberNest for school elections',
  },
  impact: {
    src: '/src/assets/images/anime_editorial_studio_1795614347592.jpg',
    alt: 'Ugandan students and mentors practicing Python, Web Development, and AI at CyberNest',
  },
  future: {
    src: '/src/assets/images/african_tech_horizon_1795614347746.jpg',
    alt: 'Contemporary Ugandan software and creative technology studio pavilion at golden hour',
  },
};

export const ScrollytellingSection: React.FC = () => {
  const containerRef = useRef<HTMLElement | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      stepRefs.current.forEach((el, idx) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveIndex(clampChapterIndex(idx, STORY_CHAPTERS.length)),
          onEnterBack: () => setActiveIndex(clampChapterIndex(idx, STORY_CHAPTERS.length)),
        });
      });

      if (progressBarRef.current && containerRef.current) {
        gsap.fromTo(
          progressBarRef.current,
          { scaleX: 0.2 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top center',
              end: 'bottom bottom',
              scrub: true,
            },
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const activeChapter = STORY_CHAPTERS[activeIndex] ?? STORY_CHAPTERS[0];
  const activeVisualAsset = CHAPTER_IMAGE_MAP[activeChapter.visualFocus];

  const jumpToChapter = (idx: number) => {
    const safeIdx = clampChapterIndex(idx, STORY_CHAPTERS.length);
    setActiveIndex(safeIdx);
    const targetEl = stepRefs.current[safeIdx];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      ref={containerRef}
      id="scrollytelling"
      className="scroll-mt-14 relative z-40 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header Row */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#1A1A1A]/15 pb-8 mb-14">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
              <span className="font-mono-tabular">05</span>
              <span aria-hidden="true">·</span>
              <span>Interactive Chronicle</span>
            </div>
            <h2
              className="font-display font-bold tracking-[-0.03em] text-[#1A1A1A] leading-[1.02] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 3.9vw, 3.35rem)' }}
            >
              From first spark to enduring systems.
            </h2>
          </div>

          {/* Interactive Chapter Jump Selector */}
          <div className="flex flex-wrap gap-1.5 bg-[#FFFFFF] p-1.5 border border-[#1A1A1A]/15">
            {STORY_CHAPTERS.map((chap, idx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => jumpToChapter(idx)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeIndex === idx
                    ? 'bg-[#4C138E] text-white'
                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
                }`}
              >
                <span className="font-mono-tabular mr-1.5">{chap.index}</span>
                <span>{chap.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pinned Split Scrollytelling Stage (ancestor uses overflow-x: clip so sticky always pins!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Pinned Visual Viewport (Left) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="bg-[#1A1A1A] text-[#F2EBDD] border border-[#1A1A1A] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/12">
                <span className="font-mono-tabular text-xs text-[#F5B800]">
                  {activeChapter.kicker}
                </span>
                <span className="font-mono-tabular text-xs text-white/65">
                  0{activeIndex + 1} / 0{STORY_CHAPTERS.length}
                </span>
              </div>

              {/* GSAP Scrubbed Hairline Progress Bar */}
              <div className="h-[2px] w-full bg-white/10">
                <div
                  ref={progressBarRef}
                  className="h-full w-full origin-left bg-[#F5B800]"
                />
              </div>

              {/* 3D Morphing Stage */}
              <div className="relative h-[280px] sm:h-[340px] lg:h-[370px] bg-[#141118]">
                <ScrollyStageCanvas activeMode={activeChapter.visualFocus} />
              </div>

              {/* Chapter Visual Caption Footer with Non-Overlapping Editorial Plate */}
              <div className="px-6 py-5 border-t border-white/12 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="font-display text-lg font-bold text-white">
                    {activeChapter.index}. {activeChapter.title}
                  </p>
                  <p className="text-xs text-[#F2EBDD]/75 leading-relaxed">
                    {activeChapter.headline}
                  </p>
                </div>
                {activeVisualAsset && (
                  <div className="w-full sm:w-36 aspect-[16/10] shrink-0 overflow-hidden border border-[#F5B800]/50 bg-[#141118]">
                    <img
                      src={activeVisualAsset.src}
                      alt={activeVisualAsset.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrolling Story Chapters Column (Right) */}
          <div className="lg:col-span-6 space-y-8 lg:space-y-24 lg:py-8">
            {STORY_CHAPTERS.map((chap, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={chap.id}
                  ref={(el) => {
                    stepRefs.current[idx] = el;
                  }}
                  onClick={() => setActiveIndex(idx)}
                  className={`p-7 sm:p-9 border transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FFFFFF] border-[#4C138E] shadow-sm'
                      : 'bg-[#F2EBDD]/60 border-[#1A1A1A]/15 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="font-mono-tabular text-xs font-semibold text-[#4C138E]">
                      {chap.kicker}
                    </span>
                    <span
                      className="h-2.5 w-2.5"
                      style={{
                        backgroundColor: isCurrent ? chap.accentHex : 'rgba(26,26,26,0.2)',
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A] mb-3">
                    {chap.index}. {chap.title}
                  </h3>

                  <p className="text-base font-semibold text-[#8D5B38] mb-3 leading-snug">
                    {chap.headline}
                  </p>

                  <p className="text-sm sm:text-base leading-relaxed text-[#1A1A1A]/80">
                    {chap.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
