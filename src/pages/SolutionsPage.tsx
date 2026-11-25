import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { WhatWeDoSection } from '../components/sections/WhatWeDoSection';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface SolutionsPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Software Development & Institutional Engineering
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              Custom software architecture, offline governance, and applied tech training.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80">
              Explore CyberNest’s full software engineering stack, purpose-built programs,
              VOXLAN offline school election capabilities, and practical coding tracks.
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
              <span>See Case Studies</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePath('/contact');
              }}
              className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors"
            >
              <span>Discuss a Custom Build</span>
            </a>
          </div>
        </div>
      </section>

      <WhatWeDoSection
        onOpenVoxlanDemo={() => onNavigatePath('/products/voxlan')}
        onEnquireLessons={() => onNavigatePath('/academy')}
      />

      <ClosingCtaSection
        headline="NEED CUSTOM SOFTWARE FOR YOUR ORGANIZATION?"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
