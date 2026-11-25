import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import type { ContactSettings, SocialLinkItem, SocialPlatform } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ContactSocialViewProps {
  contact: ContactSettings;
  socialLinks: SocialLinkItem[];
  onUpdatedContact: (c: ContactSettings) => void;
  onUpdatedSocials: (s: SocialLinkItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'Instagram',
  'LinkedIn',
  'TikTok',
  'X',
  'YouTube',
  'GitHub',
  'Other',
];

export const ContactSocialView: React.FC<ContactSocialViewProps> = ({
  contact,
  socialLinks,
  onUpdatedContact,
  onUpdatedSocials,
  onToast,
}) => {
  const [contactDraft, setContactDraft] = useState<ContactSettings>(contact);
  const [savingContact, setSavingContact] = useState(false);

  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('LinkedIn');
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialLinkItem | null>(null);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await adminApi.saveContact(contactDraft);
      onUpdatedContact(res.site.contact);
      onToast('Contact details and form settings updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to update contact settings.', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      onToast('Enter a valid URL for the social media link.', 'error');
      return;
    }
    setSavingSocial(true);
    try {
      const res = await adminApi.createSocial({
        platform: newPlatform,
        label: newLabel.trim() || newPlatform,
        url: newUrl.trim(),
        sortOrder: socialLinks.length,
        isPublished: true,
      });
      onUpdatedSocials(res.socialLinks);
      setNewLabel('');
      setNewUrl('');
      onToast(`${newPlatform} link added.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to add social link.', 'error');
    } finally {
      setSavingSocial(false);
    }
  };

  const toggleSocialPublish = async (s: SocialLinkItem) => {
    try {
      const res = await adminApi.updateSocial(s.id, { ...s, isPublished: !s.isPublished });
      onUpdatedSocials(res.socialLinks);
      onToast(s.isPublished ? `${s.label} hidden.` : `${s.label} published.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not update social link.', 'error');
    }
  };

  const moveSocial = async (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= socialLinks.length) return;
    const copy = [...socialLinks];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    try {
      const res = await adminApi.reorderSocials(copy.map((s) => s.id));
      onUpdatedSocials(res.socialLinks);
      onToast('Social links order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not reorder social links.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Contact Information & Form Settings */}
      <form
        onSubmit={handleSaveContact}
        className="xl:col-span-7 bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
          <h3 className="font-display text-base font-bold text-[#1A1A1A]">
            Contact Information & Form Settings
          </h3>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={contactDraft.formEnabled}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, formEnabled: e.target.checked }))
              }
              className="accent-[#4C138E]"
            />
            Enquiry Form Active
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Primary Email
            </label>
            <input
              type="email"
              value={contactDraft.primaryEmail}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, primaryEmail: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Secondary Email
            </label>
            <input
              type="email"
              value={contactDraft.secondaryEmail}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, secondaryEmail: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Primary Phone
            </label>
            <input
              type="text"
              value={contactDraft.phonePrimary}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, phonePrimary: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={contactDraft.whatsappNumber}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, whatsappNumber: e.target.value }))
              }
              placeholder="+256 700 000 000"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Physical Address / Location
            </label>
            <input
              type="text"
              value={contactDraft.physicalAddress}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, physicalAddress: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Business Hours
            </label>
            <input
              type="text"
              value={contactDraft.businessHours}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, businessHours: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Google Maps Link (Optional)
            </label>
            <input
              type="url"
              value={contactDraft.googleMapsUrl}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, googleMapsUrl: e.target.value }))
              }
              placeholder="https://maps.google.com/?q=Kampala"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Contact Form Heading
            </label>
            <input
              type="text"
              value={contactDraft.formHeading}
              onChange={(e) =>
                setContactDraft((d) => ({ ...d, formHeading: e.target.value }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Contact Form Description
          </label>
          <textarea
            rows={2}
            value={contactDraft.formDescription}
            onChange={(e) =>
              setContactDraft((d) => ({ ...d, formDescription: e.target.value }))
            }
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Confirmation Message After Submission
          </label>
          <input
            type="text"
            value={contactDraft.formSuccessMessage}
            onChange={(e) =>
              setContactDraft((d) => ({ ...d, formSuccessMessage: e.target.value }))
            }
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
          <button
            type="submit"
            disabled={savingContact}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingContact ? 'Saving...' : 'Save Contact Information'}</span>
          </button>
        </div>
      </form>

      {/* Social Media Management */}
      <div className="xl:col-span-5 bg-white border border-[#1A1A1A]/12 p-5 space-y-5">
        <div className="border-b border-[#1A1A1A]/10 pb-3">
          <h3 className="font-display text-base font-bold text-[#1A1A1A]">
            Social Media Links ({socialLinks.length})
          </h3>
          <p className="text-xs text-[#1A1A1A]/60">
            Displayed in the website footer and contact directory
          </p>
        </div>

        <form onSubmit={handleAddSocial} className="space-y-3 bg-[#F7F6F3] border border-[#1A1A1A]/10 p-3.5">
          <p className="text-xs font-bold text-[#1A1A1A]">Add Social Channel</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
              aria-label="Platform"
              className="border border-[#1A1A1A]/20 bg-white px-3 py-2 text-xs"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Display label (optional)"
              className="border border-[#1A1A1A]/20 bg-white px-3 py-2 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://linkedin.com/company/cybernestug"
              className="flex-1 border border-[#1A1A1A]/20 bg-white px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={savingSocial}
              className="inline-flex items-center gap-1 bg-[#4C138E] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1A1A1A] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        <div className="divide-y divide-[#1A1A1A]/10 border border-[#1A1A1A]/12">
          {socialLinks.length === 0 ? (
            <p className="p-4 text-xs text-[#1A1A1A]/55">No social links configured yet.</p>
          ) : (
            socialLinks.map((soc, idx) => (
              <div key={soc.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1A1A]">
                    {soc.label || soc.platform}{' '}
                    <span className="text-[11px] font-normal text-[#1A1A1A]/55">
                      ({soc.platform})
                    </span>
                  </p>
                  <p className="text-[11px] text-[#1A1A1A]/60 truncate">{soc.url}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSocial(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                    aria-label={`Move ${soc.label} up`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSocial(idx, 1)}
                    disabled={idx === socialLinks.length - 1}
                    className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                    aria-label={`Move ${soc.label} down`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSocialPublish(soc)}
                    className={`p-1 cursor-pointer ${
                      soc.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                    }`}
                    aria-label={`Toggle publish for ${soc.label}`}
                  >
                    {soc.isPublished ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(soc)}
                    className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                    aria-label={`Delete ${soc.label}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove Social Link"
        description={`Delete "${deleteTarget?.label || ''}" (${deleteTarget?.url || ''})?`}
        confirmLabel="Remove Link"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const res = await adminApi.deleteSocial(deleteTarget.id);
            onUpdatedSocials(res.socialLinks);
            onToast(`Removed ${deleteTarget.label}`);
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to remove social link.', 'error');
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
