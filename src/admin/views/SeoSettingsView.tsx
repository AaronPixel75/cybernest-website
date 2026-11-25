import React, { useState } from 'react';
import { Save } from 'lucide-react';
import type { SeoSettings } from '../../types/cms';
import { adminApi } from '../api';
import { ImageUploadField } from '../components/ImageUploadField';

interface SeoSettingsViewProps {
  seo: SeoSettings;
  onUpdatedSeo: (seo: SeoSettings) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SeoSettingsView: React.FC<SeoSettingsViewProps> = ({
  seo,
  onUpdatedSeo,
  onToast,
}) => {
  const [seoDraft, setSeoDraft] = useState<SeoSettings>(seo);
  const [savingSeo, setSavingSeo] = useState(false);

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeo(true);
    try {
      const res = await adminApi.saveSeo(seoDraft);
      onUpdatedSeo(res.site.seo);
      onToast('SEO and footer settings saved.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save SEO settings.', 'error');
    } finally {
      setSavingSeo(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveSeo}
      className="bg-white border border-[#1A1A1A]/12 p-5 space-y-5"
    >
      <div className="border-b border-[#1A1A1A]/10 pb-3">
        <h2 className="font-display text-base font-bold text-[#1A1A1A]">
          SEO, OpenGraph Metadata & Footer Settings
        </h2>
        <p className="text-xs text-[#1A1A1A]/60 mt-1">
          Applied dynamically across all CyberNest public routes and browser metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Website Page Title
          </label>
          <input
            type="text"
            value={seoDraft.siteTitle}
            onChange={(e) => setSeoDraft((d) => ({ ...d, siteTitle: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Meta Description
          </label>
          <textarea
            rows={2}
            value={seoDraft.metaDescription}
            onChange={(e) => setSeoDraft((d) => ({ ...d, metaDescription: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            OpenGraph Share Title
          </label>
          <input
            type="text"
            value={seoDraft.ogTitle}
            onChange={(e) => setSeoDraft((d) => ({ ...d, ogTitle: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            OpenGraph Description
          </label>
          <input
            type="text"
            value={seoDraft.ogDescription}
            onChange={(e) => setSeoDraft((d) => ({ ...d, ogDescription: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Footer Tagline
          </label>
          <input
            type="text"
            value={seoDraft.footerTagline}
            onChange={(e) => setSeoDraft((d) => ({ ...d, footerTagline: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Copyright Notice
          </label>
          <input
            type="text"
            value={seoDraft.copyrightText}
            onChange={(e) => setSeoDraft((d) => ({ ...d, copyrightText: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <ImageUploadField
          label="Favicon (ICO / PNG / SVG)"
          value={seoDraft.faviconUrl}
          onChange={(url) => setSeoDraft((d) => ({ ...d, faviconUrl: url }))}
          onError={(msg) => onToast(msg, 'error')}
        />
        <ImageUploadField
          label="Social Share Image (OG Image)"
          value={seoDraft.siteShareImage}
          onChange={(url) => setSeoDraft((d) => ({ ...d, siteShareImage: url }))}
          onError={(msg) => onToast(msg, 'error')}
        />
      </div>

      <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
        <button
          type="submit"
          disabled={savingSeo}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{savingSeo ? 'Saving...' : 'Save SEO & Footer Settings'}</span>
        </button>
      </div>
    </form>
  );
};
