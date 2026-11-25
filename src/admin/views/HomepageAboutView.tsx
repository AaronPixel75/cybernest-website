import React, { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type {
  AboutSettings,
  HomepageSettings,
  ProductItem,
  ProjectItem,
  SectionVisibility,
  TestimonialCmsItem,
} from '../../types/cms';
import { adminApi } from '../api';
import { ImageUploadField } from '../components/ImageUploadField';

interface HomepageAboutViewProps {
  homepage: HomepageSettings;
  about: AboutSettings;
  products: ProductItem[];
  projects: ProjectItem[];
  testimonials: TestimonialCmsItem[];
  onUpdatedHomepage: (h: HomepageSettings) => void;
  onUpdatedAbout: (a: AboutSettings) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const SECTION_LABELS: { key: keyof SectionVisibility; label: string }[] = [
  { key: 'intro', label: '01 · Who We Are & Milestones' },
  { key: 'offerings', label: '02–03 · Core Offerings & Pillars' },
  { key: 'products', label: '04 · Featured Products Teaser' },
  { key: 'projects', label: '05 · Selected Projects Showcase' },
  { key: 'scrollytelling', label: '06 · Interactive Story Chapters' },
  { key: 'team', label: '07 · Team Carousel' },
  { key: 'vision', label: '08 · Our Vision (About Page)' },
  { key: 'testimonials', label: '08 · Featured Testimonials Preview' },
  { key: 'contact', label: '09 · Footer & Closing CTA' },
];

export const HomepageAboutView: React.FC<HomepageAboutViewProps> = ({
  homepage,
  about,
  products,
  projects,
  testimonials,
  onUpdatedHomepage,
  onUpdatedAbout,
  onToast,
}) => {
  const [tab, setTab] = useState<'homepage' | 'about'>('homepage');
  const [homeDraft, setHomeDraft] = useState<HomepageSettings>(homepage);
  const [aboutDraft, setAboutDraft] = useState<AboutSettings>(about);
  const [saving, setSaving] = useState(false);

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.saveHomepage(homeDraft);
      onUpdatedHomepage(res.site.homepage);
      onToast('Homepage settings saved and live.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save homepage settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.saveAbout(aboutDraft);
      onUpdatedAbout(res.site.about);
      onToast('About & milestones updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save About content.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedProduct = (id: string) => {
    setHomeDraft((prev) => {
      const exists = prev.featuredProductIds.includes(id);
      return {
        ...prev,
        featuredProductIds: exists
          ? prev.featuredProductIds.filter((pid) => pid !== id)
          : [...prev.featuredProductIds, id],
      };
    });
  };

  const toggleFeaturedProject = (id: string) => {
    setHomeDraft((prev) => {
      const current = prev.featuredProjectIds || [];
      const exists = current.includes(id);
      return {
        ...prev,
        featuredProjectIds: exists
          ? current.filter((pid) => pid !== id)
          : [...current, id],
      };
    });
  };

  const toggleFeaturedTestimonial = (id: string) => {
    setHomeDraft((prev) => {
      const current = prev.featuredTestimonialIds || [];
      const exists = current.includes(id);
      return {
        ...prev,
        featuredTestimonialIds: exists
          ? current.filter((tid) => tid !== id)
          : [...current, id],
      };
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-[#1A1A1A]/12 pb-3">
        <button
          type="button"
          onClick={() => setTab('homepage')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer ${
            tab === 'homepage'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]'
          }`}
        >
          Homepage Hero & Section Visibility
        </button>
        <button
          type="button"
          onClick={() => setTab('about')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer ${
            tab === 'about'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]'
          }`}
        >
          About CyberNest, Vision & Milestones
        </button>
      </div>

      {tab === 'homepage' ? (
        <form
          onSubmit={handleSaveHomepage}
          className="bg-white border border-[#1A1A1A]/12 p-5 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Hero Eyebrow
              </label>
              <input
                type="text"
                value={homeDraft.heroEyebrow}
                onChange={(e) => setHomeDraft((d) => ({ ...d, heroEyebrow: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Hero Headline Line 1
              </label>
              <input
                type="text"
                value={homeDraft.heroHeadlineLine1}
                onChange={(e) =>
                  setHomeDraft((d) => ({ ...d, heroHeadlineLine1: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Hero Headline Line 2
              </label>
              <input
                type="text"
                value={homeDraft.heroHeadlineLine2}
                onChange={(e) =>
                  setHomeDraft((d) => ({ ...d, heroHeadlineLine2: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Hero Supporting Description
              </label>
              <textarea
                rows={2}
                value={homeDraft.heroSupportingText}
                onChange={(e) =>
                  setHomeDraft((d) => ({ ...d, heroSupportingText: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Primary CTA Button Label
              </label>
              <input
                type="text"
                value={homeDraft.heroPrimaryCtaLabel}
                onChange={(e) =>
                  setHomeDraft((d) => ({ ...d, heroPrimaryCtaLabel: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Secondary CTA Button Label
              </label>
              <input
                type="text"
                value={homeDraft.heroSecondaryCtaLabel}
                onChange={(e) =>
                  setHomeDraft((d) => ({ ...d, heroSecondaryCtaLabel: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <ImageUploadField
            label="Hero Background Banner Image"
            value={homeDraft.heroBannerImage}
            onChange={(url) => setHomeDraft((d) => ({ ...d, heroBannerImage: url }))}
            onError={(msg) => onToast(msg, 'error')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#1A1A1A]/10">
            <div className="space-y-2.5">
              <h4 className="font-display text-sm font-bold text-[#1A1A1A]">
                Homepage Section Visibility
              </h4>
              <div className="space-y-2">
                {SECTION_LABELS.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between border border-[#1A1A1A]/12 px-3 py-2 text-xs cursor-pointer hover:bg-[#F7F6F3]"
                  >
                    <span className="font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(homeDraft.sectionVisibility[item.key] ?? true)}
                      onChange={(e) =>
                        setHomeDraft((d) => ({
                          ...d,
                          sectionVisibility: {
                            ...d.sectionVisibility,
                            [item.key]: e.target.checked,
                          },
                        }))
                      }
                      className="accent-[#4C138E]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-bold text-[#1A1A1A]">
                  Featured Products Priority
                </h4>
                <p className="text-[11px] text-[#1A1A1A]/60">
                  Selected products are prioritized on the homepage Products showcase.
                </p>
                <div className="space-y-2">
                  {products.map((prod) => (
                    <label
                      key={prod.id}
                      className="flex items-center justify-between border border-[#1A1A1A]/12 px-3 py-2 text-xs cursor-pointer hover:bg-[#F7F6F3]"
                    >
                      <span className="font-medium">{prod.name}</span>
                      <input
                        type="checkbox"
                        checked={homeDraft.featuredProductIds.includes(prod.id)}
                        onChange={() => toggleFeaturedProduct(prod.id)}
                        className="accent-[#4C138E]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-bold text-[#1A1A1A]">
                  Homepage Featured Projects
                </h4>
                <p className="text-[11px] text-[#1A1A1A]/60">
                  Up to 3 selected case studies appear in the homepage Selected Work section.
                </p>
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <label
                      key={proj.id}
                      className="flex items-center justify-between border border-[#1A1A1A]/12 px-3 py-2 text-xs cursor-pointer hover:bg-[#F7F6F3]"
                    >
                      <span className="font-medium truncate pr-2">{proj.title}</span>
                      <input
                        type="checkbox"
                        checked={(homeDraft.featuredProjectIds || []).includes(proj.id)}
                        onChange={() => toggleFeaturedProject(proj.id)}
                        className="accent-[#4C138E]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-bold text-[#1A1A1A]">
                  Homepage Featured Testimonials
                </h4>
                <p className="text-[11px] text-[#1A1A1A]/60">
                  Select which testimonials appear in the homepage Voices preview.
                </p>
                <div className="space-y-2">
                  {testimonials.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between border border-[#1A1A1A]/12 px-3 py-2 text-xs cursor-pointer hover:bg-[#F7F6F3]"
                    >
                      <span className="font-medium truncate pr-2">
                        {item.authorName} · {item.institutionOrTrack}
                      </span>
                      <input
                        type="checkbox"
                        checked={(homeDraft.featuredTestimonialIds || []).includes(item.id)}
                        onChange={() => toggleFeaturedTestimonial(item.id)}
                        className="accent-[#4C138E]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Homepage Settings'}</span>
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleSaveAbout}
          className="bg-white border border-[#1A1A1A]/12 p-5 space-y-5"
        >
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
              Introduction & Manifesto
            </h3>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Intro Headline
              </label>
              <input
                type="text"
                value={aboutDraft.introHeadline}
                onChange={(e) => setAboutDraft((d) => ({ ...d, introHeadline: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Primary Manifesto
              </label>
              <textarea
                rows={3}
                value={aboutDraft.introManifesto}
                onChange={(e) => setAboutDraft((d) => ({ ...d, introManifesto: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Secondary Description
              </label>
              <textarea
                rows={2}
                value={aboutDraft.introSecondaryText}
                onChange={(e) =>
                  setAboutDraft((d) => ({ ...d, introSecondaryText: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <ImageUploadField
              label="Intro Studio Photography"
              value={aboutDraft.introImage}
              onChange={(url) => setAboutDraft((d) => ({ ...d, introImage: url }))}
              onError={(msg) => onToast(msg, 'error')}
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-[#1A1A1A]/10">
            <h3 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
              Vision Statement & Background
            </h3>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Vision Headline
              </label>
              <input
                type="text"
                value={aboutDraft.visionHeadline}
                onChange={(e) => setAboutDraft((d) => ({ ...d, visionHeadline: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Vision Description
              </label>
              <textarea
                rows={2}
                value={aboutDraft.visionDescription}
                onChange={(e) =>
                  setAboutDraft((d) => ({ ...d, visionDescription: e.target.value }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <ImageUploadField
              label="Vision Section Image"
              value={aboutDraft.visionImage}
              onChange={(url) => setAboutDraft((d) => ({ ...d, visionImage: url }))}
              onError={(msg) => onToast(msg, 'error')}
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-[#1A1A1A]/10">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#1A1A1A]">
                Company Milestones ({aboutDraft.milestones.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setAboutDraft((d) => ({
                    ...d,
                    milestones: [
                      ...d.milestones,
                      {
                        id: `ms-${Date.now()}`,
                        year: String(new Date().getFullYear()),
                        title: '',
                        description: '',
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4C138E] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {aboutDraft.milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className="border border-[#1A1A1A]/12 bg-[#F7F6F3] p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start"
                >
                  <input
                    type="text"
                    value={ms.year}
                    placeholder="Year"
                    onChange={(e) => {
                      const next = [...aboutDraft.milestones];
                      next[idx] = { ...ms, year: e.target.value };
                      setAboutDraft((d) => ({ ...d, milestones: next }));
                    }}
                    className="sm:col-span-2 border border-[#1A1A1A]/20 bg-white px-2.5 py-1.5 text-xs font-mono-tabular"
                  />
                  <input
                    type="text"
                    value={ms.title}
                    placeholder="Milestone title"
                    onChange={(e) => {
                      const next = [...aboutDraft.milestones];
                      next[idx] = { ...ms, title: e.target.value };
                      setAboutDraft((d) => ({ ...d, milestones: next }));
                    }}
                    className="sm:col-span-4 border border-[#1A1A1A]/20 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={ms.description}
                    placeholder="Short description"
                    onChange={(e) => {
                      const next = [...aboutDraft.milestones];
                      next[idx] = { ...ms, description: e.target.value };
                      setAboutDraft((d) => ({ ...d, milestones: next }));
                    }}
                    className="sm:col-span-5 border border-[#1A1A1A]/20 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAboutDraft((d) => ({
                        ...d,
                        milestones: d.milestones.filter((_, i) => i !== idx),
                      }))
                    }
                    className="sm:col-span-1 p-1.5 text-rose-600 cursor-pointer"
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save About & Milestones'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
