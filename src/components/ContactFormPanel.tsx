import React, { useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { getAnalyticsSessionId, trackAnalyticsEvent } from '../utils/analyticsClient';
import { ContactFormPayload, validateContactForm } from '../utils/contactValidation';

interface ContactFormPanelProps {
  defaultEnquiryType?: ContactFormPayload['enquiryType'];
}

export const ContactFormPanel: React.FC<ContactFormPanelProps> = ({
  defaultEnquiryType = 'project',
}) => {
  const { content } = useSiteContent();
  const { contact, socialLinks } = content;

  const [form, setForm] = useState<ContactFormPayload>({
    enquiryType: defaultEnquiryType,
    fullName: '',
    email: '',
    organization: '',
    message: '',
  });
  const [websiteHp, setWebsiteHp] = useState('');
  const formOpenedAtRef = useRef<number>(Date.now());
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormPayload, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<ContactFormPayload | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const result = validateContactForm(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          websiteHp,
          formOpenedAtMs: formOpenedAtRef.current,
          sessionId: getAnalyticsSessionId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to submit enquiry right now.');
        setSubmitting(false);
        return;
      }
      setSubmittedRecord({ ...form });
    } catch {
      setSubmitError('Network error while sending your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRecord(null);
    setSubmitError(null);
    formOpenedAtRef.current = Date.now();
    setForm({
      enquiryType: defaultEnquiryType,
      fullName: '',
      email: '',
      organization: '',
      message: '',
    });
  };

  const whatsappDigits = contact.whatsappNumber.replace(/[^\d]/g, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      {/* Left Column: Direct Channels */}
      <div className="lg:col-span-5 space-y-8">
        <div className="space-y-4">
          <h2
            className="font-display font-extrabold tracking-tight text-white leading-[1.03] [text-wrap:balance]"
            style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)' }}
          >
            {contact.formHeading}
          </h2>
          <p className="text-base leading-relaxed text-[#F2EBDD]/80">
            {contact.formDescription}
          </p>
        </div>

        <div className="space-y-3.5 border-t border-white/15 pt-7 text-sm">
          {contact.primaryEmail && (
            <a
              href={`mailto:${contact.primaryEmail}`}
              onClick={() => trackAnalyticsEvent('contact_click', `Email: ${contact.primaryEmail}`)}
              className="flex items-center gap-3 text-white hover:text-[#F5B800] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#F5B800] shrink-0" aria-hidden="true" />
              <span>{contact.primaryEmail}</span>
            </a>
          )}

          {contact.secondaryEmail && (
            <a
              href={`mailto:${contact.secondaryEmail}`}
              onClick={() => trackAnalyticsEvent('contact_click', `Email: ${contact.secondaryEmail}`)}
              className="flex items-center gap-3 text-[#F2EBDD]/80 hover:text-[#F5B800] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#F5B800]/75 shrink-0" aria-hidden="true" />
              <span>{contact.secondaryEmail}</span>
            </a>
          )}

          {contact.phonePrimary && (
            <a
              href={`tel:${contact.phonePrimary.replace(/\s+/g, '')}`}
              onClick={() => trackAnalyticsEvent('contact_click', `Phone: ${contact.phonePrimary}`)}
              className="flex items-center gap-3 text-white hover:text-[#F5B800] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#F5B800] shrink-0" aria-hidden="true" />
              <span className="font-mono-tabular">{contact.phonePrimary}</span>
            </a>
          )}

          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAnalyticsEvent('contact_click', 'WhatsApp Chat')}
              className="flex items-center gap-3 text-white hover:text-[#F5B800] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#F5B800] shrink-0" aria-hidden="true" />
              <span>WhatsApp · {contact.whatsappNumber}</span>
            </a>
          )}

          {contact.physicalAddress && (
            <div className="flex items-start gap-3 text-[#F2EBDD]/75">
              <MapPin className="w-4 h-4 text-[#F5B800] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span>{contact.physicalAddress}</span>
                {contact.googleMapsUrl && (
                  <a
                    href={contact.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackAnalyticsEvent('contact_click', 'Google Maps Location')}
                    className="ml-2 text-xs text-[#F5B800] underline hover:text-white"
                  >
                    View Map
                  </a>
                )}
              </div>
            </div>
          )}

          {contact.businessHours && (
            <div className="flex items-center gap-3 text-xs text-[#F2EBDD]/65">
              <Clock className="w-4 h-4 text-[#F5B800]/80 shrink-0" aria-hidden="true" />
              <span>{contact.businessHours}</span>
            </div>
          )}

          <a
            href="https://cybernestug.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-white hover:text-[#F5B800] transition-colors"
          >
            <Globe className="w-4 h-4 text-[#F5B800] shrink-0" aria-hidden="true" />
            <span>https://cybernestug.com</span>
          </a>

          {socialLinks.length > 0 && (
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider text-[#F2EBDD]/65">
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
      </div>

      {/* Right Column: Interactive Enquiry Form */}
      <div className="lg:col-span-7 bg-[#231E29] border border-white/12 p-7 sm:p-10">
        {!contact.formEnabled ? (
          <div className="space-y-4 py-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              Direct Contact Channels
            </p>
            <h3 className="font-display text-2xl font-bold text-white">
              Online enquiry submissions are temporarily paused.
            </h3>
            <p className="text-sm text-[#F2EBDD]/80">
              Please email us directly at{' '}
              <a href={`mailto:${contact.primaryEmail}`} className="text-[#F5B800] underline">
                {contact.primaryEmail}
              </a>
              .
            </p>
          </div>
        ) : submittedRecord ? (
          <div role="status" className="space-y-5 py-6">
            <div className="inline-flex items-center gap-2.5 text-[#F5B800] text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>Enquiry Saved</span>
            </div>
            <h3 className="font-display text-3xl font-bold text-white">
              Thank you, {submittedRecord.fullName}.
            </h3>
            <p className="text-sm text-[#F2EBDD]/80 leading-relaxed max-w-lg">
              {contact.formSuccessMessage}
            </p>
            <p className="text-xs text-[#F2EBDD]/65">
              Recorded for <strong className="text-white">{submittedRecord.email}</strong>
              {submittedRecord.organization ? ` (${submittedRecord.organization})` : ''}.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="bg-[#F5B800] px-6 py-3 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
              >
                Send Another Enquiry
              </button>
              <a
                href={`mailto:${contact.primaryEmail}?subject=${encodeURIComponent(
                  `CyberNest ${submittedRecord.enquiryType} enquiry from ${submittedRecord.fullName}`,
                )}&body=${encodeURIComponent(submittedRecord.message)}`}
                className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-[#F5B800]"
              >
                <span>Open in Mail Client</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website-hp">Leave blank</label>
              <input
                id="contact-website-hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteHp}
                onChange={(e) => setWebsiteHp(e.target.value)}
              />
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-3">
                Enquiry Focus
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {contact.enquiryOptions.map((opt) => {
                  const active = form.enquiryType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, enquiryType: opt.id }))}
                      className={`px-4 py-3 text-left text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#4C138E] text-white border-[#F5B800]'
                          : 'bg-[#1A1A1A] text-[#F2EBDD]/75 border-white/15 hover:border-white/35'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#F2EBDD]/60">
                {contact.enquiryOptions.find((o) => o.id === form.enquiryType)?.hint}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B800]"
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-xs text-rose-300">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@institution.ug"
                  className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B800]"
                />
                {errors.email && <p className="mt-1.5 text-xs text-rose-300">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-org"
                className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
              >
                School or Organization (Optional)
              </label>
              <input
                id="contact-org"
                type="text"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                placeholder="Institution or company name"
                className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B800]"
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
              >
                Project or Partnership Details
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Tell us about what you want to build or explore..."
                className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B800]"
              />
              {errors.message && <p className="mt-1.5 text-xs text-rose-300">{errors.message}</p>}
            </div>

            {submitError && (
              <p role="alert" className="text-xs text-rose-300 font-medium">
                {submitError}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex items-center gap-2.5 bg-[#F5B800] px-7 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="btn-roll-wrap">
                  <span>{submitting ? 'Sending...' : 'Submit Enquiry'}</span>
                  <span aria-hidden="true">{submitting ? 'Sending...' : 'Submit Enquiry'}</span>
                </span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
