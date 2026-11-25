import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Eye,
  EyeOff,
  Plus,
  Quote,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import type { ProjectItem, TestimonialCmsItem } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';

interface TestimonialsManagerViewProps {
  testimonials: TestimonialCmsItem[];
  projects: ProjectItem[];
  onUpdated: (items: TestimonialCmsItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_TESTIMONIAL: Omit<TestimonialCmsItem, 'id'> = {
  category: 'voxlan',
  categoryLabel: 'VOXLAN School Deployment',
  quote: '',
  authorName: '',
  authorRole: '',
  institutionOrTrack: '',
  outcomeNote: '',
  photoUrl: '',
  logoUrl: '',
  relatedProjectId: '',
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

export const TestimonialsManagerView: React.FC<TestimonialsManagerViewProps> = ({
  testimonials,
  projects,
  onUpdated,
  onToast,
}) => {
  const [selectedId, setSelectedId] = useState<string | 'new'>(testimonials[0]?.id || 'new');
  const [draft, setDraft] = useState<Omit<TestimonialCmsItem, 'id'>>(
    testimonials[0] ? { ...testimonials[0] } : { ...EMPTY_TESTIMONIAL },
  );
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialCmsItem | null>(null);

  const selectItem = (item: TestimonialCmsItem) => {
    setSelectedId(item.id);
    setDraft({ ...item });
  };

  const handleNew = () => {
    setSelectedId('new');
    setDraft({ ...EMPTY_TESTIMONIAL, sortOrder: testimonials.length });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.quote.trim() || !draft.authorName.trim()) {
      onToast('Quote text and author or slot title are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await adminApi.createTestimonial(draft);
        onUpdated(res.testimonials);
        const created =
          res.testimonials.find((t) => t.id === res.id) ??
          res.testimonials[res.testimonials.length - 1];
        if (created) selectItem(created);
        onToast('Testimonial added.');
      } else {
        const res = await adminApi.updateTestimonial(selectedId, draft);
        onUpdated(res.testimonials);
        onToast('Testimonial saved and updated.');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save testimonial.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;
    const next = [...testimonials];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onUpdated(next);
    try {
      const res = await adminApi.reorderTestimonials(next.map((t) => t.id));
      onUpdated(res.testimonials);
      onToast('Testimonial order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not reorder testimonials.', 'error');
    }
  };

  const togglePublish = async (item: TestimonialCmsItem) => {
    try {
      const res = await adminApi.updateTestimonial(item.id, {
        ...item,
        isPublished: !item.isPublished,
      });
      onUpdated(res.testimonials);
      if (selectedId === item.id) {
        setDraft((d) => ({ ...d, isPublished: !item.isPublished }));
      }
      onToast(item.isPublished ? 'Testimonial hidden.' : 'Testimonial published.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not update status.', 'error');
    }
  };

  const linkedProject = draft.relatedProjectId
    ? projects.find((p) => p.id === draft.relatedProjectId)
    : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left List */}
      <div className="lg:col-span-4 bg-white border border-[#1A1A1A]/12">
        <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-[#1A1A1A]">
              Testimonials ({testimonials.length})
            </h2>
            <p className="text-[11px] text-[#1A1A1A]/55">
              Client & student voices synced to /testimonials
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-1 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1A1A1A] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>

        <div className="divide-y divide-[#1A1A1A]/10">
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              className={`p-3.5 flex items-center justify-between gap-2 ${
                selectedId === t.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
              }`}
            >
              <button
                type="button"
                onClick={() => selectItem(t)}
                className="text-left min-w-0 flex-1 cursor-pointer"
              >
                <p className="text-xs font-bold text-[#1A1A1A] truncate flex items-center gap-1.5">
                  <span className="truncate">{t.authorName}</span>
                  {t.isFeatured && (
                    <Star className="w-3 h-3 text-[#F5B800] fill-[#F5B800] shrink-0" aria-label="Featured" />
                  )}
                </p>
                <p className="text-[11px] text-[#1A1A1A]/60 truncate">{t.institutionOrTrack}</p>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReorder(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${t.authorName} up`}
                  className="p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(idx, 1)}
                  disabled={idx === testimonials.length - 1}
                  aria-label={`Move ${t.authorName} down`}
                  className="p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(t)}
                  className={`p-1 cursor-pointer ${
                    t.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                  }`}
                  aria-label={`Toggle publish for ${t.authorName}`}
                >
                  {t.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(t)}
                  className="p-1 text-rose-600 cursor-pointer"
                  aria-label={`Delete ${t.authorName}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Form Editor + Live Card Preview */}
      <div className="lg:col-span-8 space-y-6">
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/10 pb-3">
            <h3 className="font-display text-base font-bold text-[#1A1A1A]">
              {selectedId === 'new' ? 'New Testimonial' : `Edit Quote · ${draft.authorName}`}
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.isFeatured)}
                  onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                  className="accent-[#4C138E]"
                />
                <span>Featured</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isPublished}
                  onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))}
                  className="accent-[#4C138E]"
                />
                <span>Published</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Category
              </label>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    category: e.target.value as 'voxlan' | 'student',
                    categoryLabel:
                      e.target.value === 'voxlan'
                        ? 'VOXLAN School Deployment'
                        : 'Programming Lessons Graduate',
                  }))
                }
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm bg-white"
              >
                <option value="voxlan">VOXLAN School Administrator</option>
                <option value="student">Programming Lessons Student</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Related Project (Optional)
              </label>
              <select
                value={draft.relatedProjectId || ''}
                onChange={(e) => setDraft((d) => ({ ...d, relatedProjectId: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm bg-white"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={draft.authorName}
                onChange={(e) => setDraft((d) => ({ ...d, authorName: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={draft.authorRole}
                onChange={(e) => setDraft((d) => ({ ...d, authorRole: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Institution or Training Track
              </label>
              <input
                type="text"
                value={draft.institutionOrTrack}
                onChange={(e) => setDraft((d) => ({ ...d, institutionOrTrack: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Outcome Summary
              </label>
              <input
                type="text"
                value={draft.outcomeNote}
                onChange={(e) => setDraft((d) => ({ ...d, outcomeNote: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Quote *
            </label>
            <textarea
              rows={3}
              required
              value={draft.quote}
              onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1A1A1A]/10">
            <ImageUploadField
              label="Portrait Photo (Optional)"
              value={draft.photoUrl || ''}
              onChange={(url) => setDraft((d) => ({ ...d, photoUrl: url }))}
              onError={(msg) => onToast(msg, 'error')}
            />
            <ImageUploadField
              label="Organization Logo (Optional)"
              value={draft.logoUrl || ''}
              onChange={(url) => setDraft((d) => ({ ...d, logoUrl: url }))}
              onError={(msg) => onToast(msg, 'error')}
            />
          </div>

          <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Testimonial'}</span>
            </button>
          </div>
        </form>

        {/* Live Public Card Preview */}
        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#4C138E]">
              Live Card Preview
            </h4>
            <span className="text-[11px] text-[#1A1A1A]/55">
              {draft.isPublished ? 'Visible on public site' : 'Hidden draft'}
            </span>
          </div>

          <article className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 flex flex-col justify-between space-y-5 shadow-[0_14px_30px_rgba(26,26,26,0.06)]">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1A1A1A]/10">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#4C138E]">
                {draft.categoryLabel || 'Testimonial'}
              </span>
              <Quote className="w-4 h-4 text-[#8D5B38]" aria-hidden="true" />
            </div>

            <blockquote className="text-sm sm:text-base leading-relaxed text-[#1A1A1A] font-medium">
              “{draft.quote || 'Quote text will appear here...'}”
            </blockquote>

            <div className="pt-4 border-t border-[#1A1A1A]/12 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {draft.photoUrl && (
                    <img
                      src={draft.photoUrl}
                      alt={draft.authorName || 'Author'}
                      className="w-10 h-10 rounded-full object-cover border border-[#1A1A1A]/15 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[#1A1A1A] truncate">
                      {draft.authorName || 'Author Name'}
                    </p>
                    <p className="text-xs text-[#1A1A1A]/65 truncate">
                      {draft.authorRole || 'Role'}
                    </p>
                  </div>
                </div>
                {draft.logoUrl && (
                  <img
                    src={draft.logoUrl}
                    alt={draft.institutionOrTrack || 'Logo'}
                    className="h-7 w-auto object-contain shrink-0"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="font-medium text-[#8D5B38] truncate">
                  {draft.institutionOrTrack || 'Institution or Track'}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  {draft.outcomeNote && (
                    <span className="font-mono-tabular text-[11px] text-[#4C138E]">
                      {draft.outcomeNote}
                    </span>
                  )}
                  {linkedProject && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4C138E]">
                      <span>Project</span>
                      <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Testimonial"
        description={`Remove testimonial from "${deleteTarget?.authorName || ''}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const res = await adminApi.deleteTestimonial(deleteTarget.id);
            onUpdated(res.testimonials);
            if (selectedId === deleteTarget.id) {
              if (res.testimonials[0]) {
                selectItem(res.testimonials[0]);
              } else {
                handleNew();
              }
            }
            onToast('Testimonial removed.');
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to delete testimonial.', 'error');
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
