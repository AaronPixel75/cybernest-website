import React, { useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  TestimonialCategory,
  filterTestimonials,
} from '../../data/testimonials';
import { useSiteContent } from '../../context/SiteContentContext';

type FilterOption = 'all' | TestimonialCategory;

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All Feedback' },
  { id: 'voxlan', label: 'VOXLAN Schools' },
  { id: 'student', label: 'Training Graduates' },
];

interface TestimonialSectionProps {
  onNavigatePath?: (path: string) => void;
  heading?: string;
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({
  onNavigatePath,
  heading = 'TRUST BUILT THROUGH WHAT WE CREATE.',
}) => {
  const { content } = useSiteContent();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visibleTestimonials = filterTestimonials(content.testimonials, activeFilter);

  const handleFilterChange = (next: FilterOption) => {
    setActiveFilter(next);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollTrack = (direction: -1 | 1) => {
    const container = scrollRef.current;
    if (!container) return;
    const step = Math.min(420, Math.max(300, container.clientWidth * 0.65));
    container.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section
      id="testimonials"
      aria-label="Feedback from VOXLAN school administrators and CyberNest training students"
      className="scroll-mt-14 relative z-[58] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header & Filter / Scroll Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#1A1A1A]/15 pb-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
              <span className="font-mono-tabular">08</span>
              <span aria-hidden="true">·</span>
              <span>Voices & Outcomes</span>
            </div>
            <h2
              className="font-display font-extrabold tracking-[-0.035em] text-[#1A1A1A] leading-[1.02] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)' }}
            >
              {heading}
            </h2>
            <p className="text-base text-[#1A1A1A]/75 max-w-2xl">
              Direct feedback slots from school administrators using VOXLAN and learners who
              completed CyberNest programming lessons. Manage or replace placeholders anytime in Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 w-full lg:w-auto lg:shrink-0">
            {/* Interactive Segmented Filter */}
            <div
              role="group"
              aria-label="Filter testimonials by group"
              className="flex flex-wrap items-center gap-1 bg-[#FFFFFF] p-1 border border-[#1A1A1A]/15 max-w-full"
            >
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange(tab.id)}
                    aria-pressed={isActive}
                    className={`px-2.5 sm:px-3.5 py-2 min-h-[40px] text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#4C138E] text-white'
                        : 'text-[#1A1A1A]/75 hover:text-[#1A1A1A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Horizontal Scroll Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollTrack(-1)}
                aria-label="Scroll testimonials left"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#1A1A1A]/25 bg-[#FFFFFF] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack(1)}
                aria-label="Scroll testimonials right"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#4C138E] hover:border-[#4C138E] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Simple Horizontal Scrolling Track */}
        <div
          ref={scrollRef}
          data-testid="testimonials-scroll-track"
          tabIndex={0}
          aria-label="Horizontal scrolling testimonials"
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C138E]"
        >
          {visibleTestimonials.map((item, idx) => {
            const isVoxlan = item.category === 'voxlan';
            const linkedProject = item.relatedProjectId
              ? content.projects.find((p) => p.id === item.relatedProjectId)
              : undefined;
            return (
              <article
                key={item.id}
                className="w-[290px] sm:w-[370px] lg:w-[400px] shrink-0 snap-start bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className={`font-semibold tracking-wide ${
                        isVoxlan ? 'text-[#4C138E]' : 'text-[#8D5B38]'
                      }`}
                    >
                      {item.categoryLabel}
                    </span>
                    <span className="font-mono-tabular text-[#1A1A1A]/45">
                      0{idx + 1}
                    </span>
                  </div>

                  <blockquote className="text-base leading-relaxed text-[#1A1A1A]/90 font-normal">
                    “{item.quote}”
                  </blockquote>
                </div>

                <div className="pt-5 border-t border-[#1A1A1A]/12 space-y-3">
                  <div className="flex items-center gap-3">
                    {item.photoUrl && (
                      <img
                        src={item.photoUrl}
                        alt={item.authorName}
                        className="w-11 h-11 rounded-full object-cover border border-[#1A1A1A]/15 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold tracking-tight text-[#1A1A1A] truncate">
                        {item.authorName}
                      </p>
                      <p className="text-xs text-[#1A1A1A]/70 truncate">
                        {item.authorRole} · {item.institutionOrTrack}
                      </p>
                    </div>
                    {item.logoUrl && (
                      <img
                        src={item.logoUrl}
                        alt={item.institutionOrTrack}
                        className="h-8 w-auto max-w-[64px] object-contain shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="font-mono-tabular font-medium text-[#4C138E]">
                      {item.outcomeNote}
                    </p>
                    {linkedProject && onNavigatePath && (
                      <a
                        href={`/work/${linkedProject.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigatePath(`/work/${linkedProject.slug}`);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-[#8D5B38] hover:text-[#4C138E]"
                      >
                        <span>Project</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
