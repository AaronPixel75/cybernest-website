import React from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { BreadcrumbItem, slugifyText } from '../utils/navigationLogic';

interface CourseDetailPageProps {
  slug: string;
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  slug,
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const course = content.courses.find(
    (c) => c.id === slug || slugifyText(c.id || c.title) === slug || slugifyText(c.title) === slug,
  );

  if (!course) {
    return (
      <section className="min-h-[70vh] bg-[#1A1A1A] text-[#F2EBDD] pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <h1 className="font-display text-3xl font-bold text-white">Training Track Not Found</h1>
          <p className="text-sm text-[#F2EBDD]/75">
            The requested CyberNest Academy course could not be found.
          </p>
          <a
            href="/academy"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePath('/academy');
            }}
            className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Academy</span>
          </a>
        </div>
      </section>
    );
  }

  const otherCourses = content.courses.filter((c) => c.id !== course.id);
  const learningPillars = [
    'Hands-on guided coding exercises from session one',
    'Structured mentor code reviews and debugging coaching',
    'Practical project builds rooted in real local workflows',
    'Small cohort attention for school clubs and individual learners',
  ];

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-8">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>{course.audience}</span>
              </div>
              <h1
                className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98]"
                style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
              >
                {course.title}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/85">
                {course.focus}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    trackAnalyticsEvent('contact_click', `Enroll Track: ${course.title}`);
                    onNavigatePath('/contact');
                  }}
                  className="inline-flex items-center gap-2 bg-[#F5B800] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-white transition-colors"
                >
                  <span>Enquire About {course.title}</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/academy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigatePath('/academy');
                  }}
                  className="inline-flex items-center gap-2 border border-white/25 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors"
                >
                  <span>All Tracks</span>
                </a>
              </div>
            </div>

            {course.imagePath && (
              <div className="lg:col-span-5 border border-white/15 bg-[#141118] overflow-hidden aspect-[4/3]">
                <img
                  src={course.imagePath}
                  alt={course.title}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Project Deliverables & Outcome
              </p>
              <p className="text-base font-medium leading-relaxed text-[#1A1A1A]">
                {course.projectOutcome}
              </p>
            </div>

            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                How You Learn at CyberNest
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {learningPillars.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 p-4 bg-[#F2EBDD]/55 border border-[#1A1A1A]/10 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {otherCourses.length > 0 && (
            <div className="pt-6 border-t border-[#1A1A1A]/15 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Explore Other CyberNest Academy Tracks
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {otherCourses.map((c) => (
                  <a
                    key={c.id}
                    href={`/academy/${slugifyText(c.id || c.title)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath(`/academy/${slugifyText(c.id || c.title)}`);
                    }}
                    className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 flex items-center justify-between gap-4 hover:border-[#4C138E] transition-colors"
                  >
                    <div>
                      <p className="text-xs text-[#8D5B38] font-semibold">{c.audience}</p>
                      <h2 className="font-display text-xl font-bold text-[#1A1A1A]">{c.title}</h2>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[#4C138E]" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <ClosingCtaSection
        headline={`JOIN THE NEXT ${course.title.toUpperCase()} COHORT.`}
        primaryLabel="Enquire Now"
        primaryPath="/contact"
        secondaryLabel="Back to Academy"
        secondaryPath="/academy"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
