import React from 'react';
import { ArrowUp, Globe, Mail, MapPin, MessageCircle, Phone, Shield } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { FOOTER_NAV_ITEMS } from '../utils/navigationLogic';
import { BrandMark } from './BrandMark';

interface SiteFooterProps {
  onNavigatePath: (path: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigatePath }) => {
  const { content } = useSiteContent();
  const { contact, socialLinks, seo } = content;
  const whatsappDigits = contact.whatsappNumber.replace(/[^\d]/g, '');

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigatePath(path);
  };

  return (
    <footer className="relative z-[60] bg-[#141118] text-[#F2EBDD] border-t border-white/12 pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/12">
          <div className="md:col-span-5 space-y-4">
            <BrandMark variant="light" />
            <p className="text-sm text-[#F2EBDD]/75 leading-relaxed max-w-sm">
              Creative technology studio in Uganda building practical software, VOXLAN
              offline school elections, and hands-on programming education.
            </p>
            {socialLinks.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider text-[#F2EBDD]/65">
                {socialLinks.map((soc, idx) => (
                  <React.Fragment key={soc.id}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <a
                      href={soc.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackAnalyticsEvent('button_click', `Social: ${soc.platform}`)}
                      className="hover:text-[#F5B800] transition-colors"
                    >
                      {soc.label || soc.platform}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Explore CyberNest
            </p>
            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {FOOTER_NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className="text-[#F2EBDD]/80 hover:text-[#F5B800] transition-colors py-0.5"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/products/voxlan"
                onClick={(e) => handleNavClick(e, '/products/voxlan')}
                className="text-[#F2EBDD]/80 hover:text-[#F5B800] transition-colors py-0.5"
              >
                VOXLAN Booth
              </a>
              <a
                href="/admin"
                onClick={(e) => handleNavClick(e, '/admin')}
                className="inline-flex items-center gap-1.5 text-[#F2EBDD]/65 hover:text-[#F5B800] transition-colors py-0.5"
              >
                <Shield className="w-3 h-3" aria-hidden="true" />
                <span>Admin</span>
              </a>
            </nav>
          </div>

          <div className="md:col-span-3 space-y-3 text-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Studio Desk
            </p>
            {contact.primaryEmail && (
              <a
                href={`mailto:${contact.primaryEmail}`}
                onClick={() => trackAnalyticsEvent('contact_click', `Footer Email: ${contact.primaryEmail}`)}
                className="flex items-center gap-2.5 text-[#F2EBDD]/85 hover:text-[#F5B800] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#F5B800] shrink-0" aria-hidden="true" />
                <span className="truncate">{contact.primaryEmail}</span>
              </a>
            )}
            {contact.phonePrimary && (
              <a
                href={`tel:${contact.phonePrimary.replace(/\s+/g, '')}`}
                onClick={() => trackAnalyticsEvent('contact_click', `Footer Phone: ${contact.phonePrimary}`)}
                className="flex items-center gap-2.5 text-[#F2EBDD]/85 hover:text-[#F5B800] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#F5B800] shrink-0" aria-hidden="true" />
                <span className="font-mono-tabular">{contact.phonePrimary}</span>
              </a>
            )}
            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackAnalyticsEvent('contact_click', 'Footer WhatsApp')}
                className="flex items-center gap-2.5 text-[#F2EBDD]/85 hover:text-[#F5B800] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#F5B800] shrink-0" aria-hidden="true" />
                <span>WhatsApp Studio</span>
              </a>
            )}
            {contact.physicalAddress && (
              <p className="flex items-center gap-2.5 text-[#F2EBDD]/70">
                <MapPin className="w-3.5 h-3.5 text-[#F5B800] shrink-0" aria-hidden="true" />
                <span>{contact.physicalAddress}</span>
              </p>
            )}
            <a
              href="https://cybernestug.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-[#F2EBDD]/70 hover:text-[#F5B800] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#F5B800] shrink-0" aria-hidden="true" />
              <span>cybernestug.com</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#F2EBDD]/60">
          <div className="flex flex-wrap items-center gap-3">
            <span>{seo.footerTagline}</span>
            <span aria-hidden="true">·</span>
            <span>{seo.copyrightText}</span>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 text-[#F5B800] hover:text-white transition-colors font-semibold uppercase tracking-wider cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
