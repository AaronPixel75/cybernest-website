import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { useSiteContent } from '../context/SiteContentContext';
import type { ProjectCategory } from '../types/cms';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import {
  BreadcrumbItem,
  PROJECT_CATEGORIES,
  filterProjects,
} from '../utils/navigationLogic';

interface WorkPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const WorkPage: React.FC<WorkPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProjectCategory>('All');

  const categories: ('All' | ProjectCategory)[] = ['All', ...PROJECT_CATEGORIES];

  const filteredProjects = useMemo(
    () => filterProjects(content.projects, selectedCategory),
    [content.projects, selectedCategory],
  );

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Our Work · Selected Systems & Case Studies
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              Real software built, deployed, and taught in Uganda.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80">
              Explore CyberNest’s featured engineering work—from VOXLAN offline school
              elections and academic platforms to applied Artificial Intelligence labs.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-20 pb-28 border-t border-[#1A1A1A]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
          {/* Category Filter Bar */}
          <div className="border-b border-[#1A1A1A]/15 pb-6 flex flex-wrap items-center justify-between gap-4">
            <div
              role="group"
              aria-label="Filter projects by category"
              className="flex flex-wrap gap-2"
            >
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#4C138E] text-white border-[#4C138E]'
                        : 'bg-[#FFFFFF] text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#4C138E]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <span className="font-mono-tabular text-xs text-[#1A1A1A]/65">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-10 text-center space-y-3">
              <p className="font-display text-xl font-bold text-[#1A1A1A]">
                No projects listed under “{selectedCategory}” yet.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                Show All Projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProjects.map((proj) => (
                <a
                  key={proj.id}
                  href={`/work/${proj.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    trackAnalyticsEvent('button_click', `Work Case Study: ${proj.title}`);
                    onNavigatePath(`/work/${proj.slug}`);
                  }}
                  className="group bg-[#FFFFFF] border border-[#1A1A1A]/15 flex flex-col justify-between overflow-hidden hover:border-[#4C138E] transition-colors"
                >
                  <div>
                    <div className="h-56 bg-[#141118] overflow-hidden border-b border-[#1A1A1A]/12">
                      {proj.thumbnailUrl && (
                        <img
                          src={proj.thumbnailUrl}
                          alt={proj.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider">
                        <span className="text-[#4C138E]">{proj.category}</span>
                        {proj.isFeatured && (
                          <span className="font-mono-tabular text-[#8D5B38]">Featured</span>
                        )}
                      </div>
                      <h2 className="font-display text-xl font-bold tracking-tight text-[#1A1A1A] group-hover:text-[#4C138E] transition-colors">
                        {proj.title}
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed text-[#1A1A1A]/75 line-clamp-3">
                        {proj.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#8D5B38] font-medium truncate">
                      {proj.technologies.slice(0, 3).join(' · ')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#1A1A1A] group-hover:text-[#4C138E] shrink-0">
                      <span>Case Study</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <ClosingCtaSection
        headline="HAVE A PROJECT OR SYSTEM IN MIND?"
        primaryLabel="Start a Conversation"
        primaryPath="/contact"
        secondaryLabel="Read Client Feedback"
        secondaryPath="/testimonials"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
