import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface NotFoundPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  return (
    <section className="min-h-[75vh] bg-[#1A1A1A] text-[#F2EBDD] pt-32 pb-24 px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
        <p className="font-mono-tabular text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
          404 · Page Not Found
        </p>
        <h1 className="font-display text-4xl font-extrabold text-white">
          That CyberNest page does not exist.
        </h1>
        <p className="text-base text-[#F2EBDD]/75">
          Return to the studio homepage or browse our software products, projects, and academy tracks.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePath('/');
            }}
            className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Return Home</span>
          </a>
          <a
            href="/work"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePath('/work');
            }}
            className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold text-white hover:border-[#F5B800]"
          >
            <span>Explore Our Work</span>
          </a>
        </div>
      </div>
    </section>
  );
};
