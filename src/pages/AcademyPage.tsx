import React from 'react';
import { ArrowUpRight, Code2, GraduationCap, Terminal } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { BreadcrumbItem, slugifyText } from '../utils/navigationLogic';

interface AcademyPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const AcademyPage: React.FC<AcademyPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const { courses } = content;

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              CyberNest Academy · Hands-On Programming Lessons
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              Learn how technology is built by building real software.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80">
              Practical, mentor-guided programming courses in Python Programming, Web
              Development, and Artificial Intelligence designed for students and aspiring
              builders in Uganda.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-20 pb-28 border-t border-[#1A1A1A]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course, idx) => {
              const courseSlug = slugifyText(course.id || course.title);
              return (
                <article
                  key={course.id}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/15 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="h-48 bg-[#141118] overflow-hidden border-b border-[#1A1A1A]/12">
                      {course.imagePath && (
                        <img
                          src={course.imagePath}
                          alt={course.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono-tabular">
                        <span className="font-semibold text-[#4C138E]">Track 0{idx + 1}</span>
                        <span className="text-[#8D5B38] truncate max-w-[180px]">{course.audience}</span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#1A1A1A]">
                        {course.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                        {course.focus}
                      </p>
                      <p className="pt-2 border-t border-[#1A1A1A]/10 text-xs font-medium text-[#4C138E]">
                        {course.projectOutcome}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={`/academy/${courseSlug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        trackAnalyticsEvent('button_click', `Academy Track: ${course.title}`);
                        onNavigatePath(`/academy/${courseSlug}`);
                      }}
                      className="inline-flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors"
                    >
                      <span>View Curriculum</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                    <a
                      href={course.enrollUrl && course.enrollUrl !== '#contact' ? course.enrollUrl : '/contact'}
                      onClick={(e) => {
                        if (!course.enrollUrl || course.enrollUrl === '#contact' || course.enrollUrl.startsWith('/')) {
                          e.preventDefault();
                          onNavigatePath('/contact');
                        }
                      }}
                      className="text-xs font-bold text-[#8D5B38] hover:text-[#4C138E]"
                    >
                      Enrol
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#1A1A1A]/15">
            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/12 p-6 space-y-2.5">
              <Terminal className="w-5 h-5 text-[#4C138E]" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#1A1A1A]">
                Code from Day One
              </h3>
              <p className="text-xs leading-relaxed text-[#1A1A1A]/75">
                Every session focuses on writing, debugging, and shipping software—not
                memorizing passive theory slides.
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/12 p-6 space-y-2.5">
              <Code2 className="w-5 h-5 text-[#8D5B38]" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#1A1A1A]">
                Mentor Line Reviews
              </h3>
              <p className="text-xs leading-relaxed text-[#1A1A1A]/75">
                Practicing CyberNest engineers guide students through clean structure, testing,
                and interface craft.
              </p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/12 p-6 space-y-2.5">
              <GraduationCap className="w-5 h-5 text-[#4C138E]" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#1A1A1A]">
                Portfolio Projects
              </h3>
              <p className="text-xs leading-relaxed text-[#1A1A1A]/75">
                Learners complete real utilities, websites, and AI workflows ready to demonstrate
                their practical capability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ClosingCtaSection
        headline="READY TO START PRACTICAL PROGRAMMING LESSONS?"
        primaryLabel="Enquire & Enrol"
        primaryPath="/contact"
        secondaryLabel="See Student & AI Projects"
        secondaryPath="/work"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
