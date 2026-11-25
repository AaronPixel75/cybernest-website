import React from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Layers } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { BreadcrumbItem, slugifyText } from '../utils/navigationLogic';

interface ProjectDetailPageProps {
  slug: string;
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  slug,
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const project = content.projects.find((p) => p.slug === slug || p.id === slug);

  if (!project) {
    return (
      <section className="min-h-[70vh] bg-[#1A1A1A] text-[#F2EBDD] pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <h1 className="font-display text-3xl font-bold text-white">Project Not Found</h1>
          <p className="text-sm text-[#F2EBDD]/75">
            The requested case study could not be located.
          </p>
          <a
            href="/work"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePath('/work');
            }}
            className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Our Work</span>
          </a>
        </div>
      </section>
    );
  }

  const relatedProduct = project.relatedProductId
    ? content.products.find((p) => p.id === project.relatedProductId)
    : undefined;
  const relatedProjects = content.projects
    .filter((p) => p.id !== project.id)
    .slice(0, 2);

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-8">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#F5B800]">
                <span>{project.category}</span>
                {project.isFeatured && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Featured Case Study</span>
                  </>
                )}
              </div>

              <h1
                className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98]"
                style={{ fontSize: 'clamp(2.1rem, 4.2vw, 3.8rem)' }}
              >
                {project.title}
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/85">
                {project.summary}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {relatedProduct && (
                  <a
                    href={`/products/${slugifyText(relatedProduct.id || relatedProduct.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath(
                        `/products/${slugifyText(relatedProduct.id || relatedProduct.name)}`,
                      );
                    }}
                    className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-white transition-colors"
                  >
                    <span>Explore {relatedProduct.name} Product</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}

                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    trackAnalyticsEvent('contact_click', `Case Study Inquiry: ${project.title}`);
                    onNavigatePath('/contact');
                  }}
                  className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors"
                >
                  <span>Build Something Similar</span>
                </a>
              </div>
            </div>

            {project.thumbnailUrl && (
              <div className="lg:col-span-5 border border-white/15 bg-[#141118] overflow-hidden aspect-[4/3]">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-20 pb-24 border-t border-[#1A1A1A]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
          {/* Overview, Problem Solved & Our Solution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 sm:p-9 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Project Overview
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-[#1A1A1A]/85">
                {project.overview}
              </p>
            </div>

            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                Problem Solved
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-[#1A1A1A]/85">
                {project.problemSolved}
              </p>
            </div>

            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Our Solution
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-[#1A1A1A]/85">
                {project.ourSolution}
              </p>
            </div>
          </div>

          {/* Features, Technologies & Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Key Features Delivered
              </p>
              <ul className="space-y-3">
                {project.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-[#1A1A1A]/85">
                    <CheckCircle2 className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {project.technologies.length > 0 && (
                <div className="bg-[#1A1A1A] text-[#F2EBDD] border border-[#1A1A1A] p-7 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
                    <Layers className="w-4 h-4" aria-hidden="true" />
                    <span>Technologies Used</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-mono-tabular text-white"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.outcomes.length > 0 && (
                <div className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                    Outcomes & Impact
                  </p>
                  <ul className="space-y-2 text-sm text-[#1A1A1A]/85">
                    {project.outcomes.map((out) => (
                      <li key={out} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-[#F5B800] mt-2 shrink-0" aria-hidden="true" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Screenshots Gallery */}
          {project.screenshots.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Visual Showcase
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.screenshots.map((shot, idx) => (
                  <div
                    key={`${shot}-${idx}`}
                    className="border border-[#1A1A1A]/15 bg-[#141118] overflow-hidden aspect-[16/10]"
                  >
                    <img
                      src={shot}
                      alt={`${project.title} visual ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <div className="pt-8 border-t border-[#1A1A1A]/15 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                  More Projects from CyberNest
                </p>
                <a
                  href="/work"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigatePath('/work');
                  }}
                  className="text-xs font-bold text-[#1A1A1A] hover:text-[#4C138E]"
                >
                  View All Projects
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedProjects.map((rel) => (
                  <a
                    key={rel.id}
                    href={`/work/${rel.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath(`/work/${rel.slug}`);
                    }}
                    className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 flex items-center justify-between gap-4 hover:border-[#4C138E] transition-colors"
                  >
                    <div>
                      <p className="text-xs text-[#8D5B38] font-semibold">{rel.category}</p>
                      <h2 className="font-display text-lg font-bold text-[#1A1A1A]">{rel.title}</h2>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[#4C138E] shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <ClosingCtaSection
        headline="BUILD WITH THE TEAM BEHIND THIS PROJECT."
        primaryLabel="Start a Conversation"
        primaryPath="/contact"
        secondaryLabel="All Projects"
        secondaryPath="/work"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
