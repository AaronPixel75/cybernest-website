import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { trackAnalyticsEvent } from '../utils/analyticsClient';

interface ClosingCtaSectionProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  primaryLabel?: string;
  primaryPath?: string;
  secondaryLabel?: string;
  secondaryPath?: string;
  onNavigatePath: (path: string) => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({
  eyebrow = 'Start a Conversation',
  headline = 'LET’S BUILD SOMETHING EXTRAORDINARY.',
  description = 'Partner with CyberNest for custom software applications, deploy VOXLAN for offline school elections, or join our practical programming cohorts.',
  primaryLabel = 'Contact CyberNest',
  primaryPath = '/contact',
  secondaryLabel = 'View Our Work',
  secondaryPath = '/work',
  onNavigatePath,
}) => {
  return (
    <section className="relative z-[59] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#1A1A1A] text-[#F2EBDD] pt-20 pb-20 lg:pt-28 lg:pb-24 border-t border-white/12 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 space-y-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F5B800]">
              {eyebrow}
            </p>
            <h2
              className="font-display font-extrabold tracking-tight text-white leading-[1.02] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.1rem, 4vw, 3.6rem)' }}
            >
              {headline}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#F2EBDD]/80 max-w-2xl">
              {description}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3.5">
            <a
              href={primaryPath}
              onClick={(e) => {
                e.preventDefault();
                trackAnalyticsEvent('contact_click', `CTA: ${primaryLabel}`);
                onNavigatePath(primaryPath);
              }}
              className="group inline-flex items-center gap-2.5 bg-[#F5B800] px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors whitespace-nowrap"
            >
              <span className="btn-roll-wrap">
                <span>{primaryLabel}</span>
                <span aria-hidden="true">{primaryLabel}</span>
              </span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>

            <a
              href={secondaryPath}
              onClick={(e) => {
                e.preventDefault();
                onNavigatePath(secondaryPath);
              }}
              className="inline-flex items-center gap-2 border border-white/30 px-5 py-3.5 text-sm font-semibold text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors whitespace-nowrap"
            >
              <span>{secondaryLabel}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
