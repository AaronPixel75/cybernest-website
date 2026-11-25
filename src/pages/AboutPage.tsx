import React from 'react';
import { ArrowUpRight, Compass, Cpu, Users } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { IntroSection } from '../components/sections/IntroSection';
import { TeamCarouselSection } from '../components/sections/TeamCarouselSection';
import { VisionSection } from '../components/sections/VisionSection';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface AboutPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

const VALUES = [
  {
    icon: Cpu,
    title: 'Practical Engineering',
    description:
      'Every application is built to solve real institutional bottlenecks—working reliably even when internet connections drop.',
  },
  {
    icon: Users,
    title: 'Knowledge That Multiplies',
    description:
      'Teaching Python, Web Development, and Artificial Intelligence turns passive technology users into active African builders.',
  },
  {
    icon: Compass,
    title: 'Craft & Accountability',
    description:
      'From auditable school elections in VOXLAN to custom enterprise portals, clarity and reliability guide every release.',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ breadcrumbs, onNavigatePath }) => {
  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              About CyberNest · Kampala, Uganda
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              A Ugandan technology studio building enduring software and training builders.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80">
              Registered in the Republic of Uganda, CyberNest brings together custom software
              engineering, local-network campus products like VOXLAN, and hands-on programming
              education.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="/work"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePath('/work');
              }}
              className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-white transition-colors"
            >
              <span>Explore Our Projects</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="/testimonials"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePath('/testimonials');
              }}
              className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors"
            >
              <span>Voices & Testimonials</span>
            </a>
          </div>
        </div>
      </section>

      <IntroSection teaserMode={false} onNavigatePath={onNavigatePath} />

      {/* Studio Values */}
      <section className="relative z-[15] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#1A1A1A] text-[#F2EBDD] pt-24 pb-28 border-t border-white/12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-10">
          <div className="border-b border-white/12 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Guiding Principles
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
              How CyberNest builds and teaches
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="bg-[#231E29] border border-white/12 p-7 space-y-4"
                >
                  <Icon className="w-6 h-6 text-[#F5B800]" aria-hidden="true" />
                  <h3 className="font-display text-xl font-bold text-white">{val.title}</h3>
                  <p className="text-sm leading-relaxed text-[#F2EBDD]/75">{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <TeamCarouselSection />

      <VisionSection />

      <ClosingCtaSection onNavigatePath={onNavigatePath} />
    </>
  );
};
