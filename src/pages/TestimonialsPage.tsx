import React from 'react';
import { ArrowUpRight, Quote } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { TestimonialSection } from '../components/sections/TestimonialSection';
import { useSiteContent } from '../context/SiteContentContext';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface TestimonialsPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const TestimonialsPage: React.FC<TestimonialsPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const featured =
    content.testimonials.find((t) => t.isFeatured) ?? content.testimonials[0];
  const featuredProject = featured?.relatedProjectId
    ? content.projects.find((p) => p.id === featured.relatedProjectId)
    : undefined;

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-24 lg:pt-36 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-10">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />

          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Client & Learner Testimonials
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              TRUST BUILT THROUGH WHAT WE CREATE.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80">
              Verified school administrator feedback and student stories are managed directly
              through CyberNest’s Admin CMS—keeping every displayed endorsement authentic and
              approved.
            </p>
          </div>

          {featured && (
            <article className="bg-[#231E29] border border-[#F5B800]/45 p-8 sm:p-12 space-y-6">
              <div className="flex items-center justify-between text-xs font-semibold text-[#F5B800]">
                <span>Featured · {featured.categoryLabel}</span>
                <Quote className="w-6 h-6" aria-hidden="true" />
              </div>

              <blockquote className="font-display text-xl sm:text-3xl font-medium leading-snug text-white">
                “{featured.quote}”
              </blockquote>

              <div className="pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {featured.photoUrl && (
                    <img
                      src={featured.photoUrl}
                      alt={featured.authorName}
                      className="w-12 h-12 rounded-full object-cover border border-[#F5B800]/50"
                    />
                  )}
                  <div>
                    <p className="font-bold text-white text-base">{featured.authorName}</p>
                    <p className="text-xs text-[#F2EBDD]/75">
                      {featured.authorRole} · {featured.institutionOrTrack}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {featured.logoUrl && (
                    <img
                      src={featured.logoUrl}
                      alt={featured.institutionOrTrack}
                      className="h-8 w-auto object-contain"
                    />
                  )}
                  <span className="font-mono-tabular text-[#F5B800]">
                    {featured.outcomeNote}
                  </span>
                  {featuredProject && (
                    <a
                      href={`/work/${featuredProject.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigatePath(`/work/${featuredProject.slug}`);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-white hover:text-[#F5B800]"
                    >
                      <span>View Related Project</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </section>

      <TestimonialSection
        onNavigatePath={onNavigatePath}
        heading="All published client & student voices"
      />

      <ClosingCtaSection
        headline="WORK WITH CYBERNEST ON YOUR NEXT SYSTEM."
        primaryLabel="Start a Conversation"
        primaryPath="/contact"
        secondaryLabel="Explore Our Work"
        secondaryPath="/work"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
