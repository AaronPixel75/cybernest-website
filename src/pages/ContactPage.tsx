import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ContactFormPanel } from '../components/ContactFormPanel';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface ContactPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  return (
    <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-24 lg:pt-36 lg:pb-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
        <div className="space-y-4 border-b border-white/12 pb-8">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
            Contact CyberNest · Kampala, Uganda
          </p>
          <h1
            className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98]"
            style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
          >
            Start a software project, VOXLAN demo, or coding cohort enquiry.
          </h1>
        </div>

        <ContactFormPanel />
      </div>
    </section>
  );
};
