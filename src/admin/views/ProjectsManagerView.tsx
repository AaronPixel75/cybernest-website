import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import type { ProductItem, ProjectCategory, ProjectItem } from '../../types/cms';
import { PROJECT_CATEGORIES, slugifyText } from '../../utils/navigationLogic';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';

interface ProjectsManagerViewProps {
  projects: ProjectItem[];
  products: ProductItem[];
  onUpdated: (projects: ProjectItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_PROJECT: Omit<ProjectItem, 'id'> = {
  slug: '',
  title: '',
  category: 'Software and Applications',
  summary: '',
  overview: '',
  problemSolved: '',
  ourSolution: '',
  features: [''],
  technologies: ['TypeScript'],
  outcomes: [''],
  thumbnailUrl: '',
  screenshots: [],
  relatedProductId: '',
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

export const ProjectsManagerView: React.FC<ProjectsManagerViewProps> = ({
  projects,
  products,
  onUpdated,
  onToast,
}) => {
  const [selectedId, setSelectedId] = useState<string | 'new'>(projects[0]?.id || 'new');
  const [draft, setDraft] = useState<Omit<ProjectItem, 'id'>>(
    projects[0]
      ? {
          ...projects[0],
          features: projects[0].features.length ? projects[0].features : [''],
          technologies: projects[0].technologies.length ? projects[0].technologies : [''],
          outcomes: projects[0].outcomes.length ? projects[0].outcomes : [''],
        }
      : { ...EMPTY_PROJECT },
  );
  const [newScreenshotInput, setNewScreenshotInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);

  const selectProject = (proj: ProjectItem) => {
    setSelectedId(proj.id);
    setDraft({
      ...proj,
      features: proj.features.length ? proj.features : [''],
      technologies: proj.technologies.length ? proj.technologies : [''],
      outcomes: proj.outcomes.length ? proj.outcomes : [''],
    });
  };

  const handleNew = () => {
    setSelectedId('new');
    setDraft({ ...EMPTY_PROJECT, sortOrder: projects.length });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      onToast('Project title is required.', 'error');
      return;
    }

    const cleanSlug = slugifyText(draft.slug || draft.title);
    if (!cleanSlug) {
      onToast('A valid URL slug is required.', 'error');
      return;
    }

    const payload: Omit<ProjectItem, 'id'> = {
      ...draft,
      slug: cleanSlug,
      features: draft.features.map((s) => s.trim()).filter(Boolean),
      technologies: draft.technologies.map((s) => s.trim()).filter(Boolean),
      outcomes: draft.outcomes.map((s) => s.trim()).filter(Boolean),
      screenshots: draft.screenshots.map((s) => s.trim()).filter(Boolean),
      relatedProductId: draft.relatedProductId?.trim() || '',
    };

    setSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await adminApi.createProject(payload);
        onUpdated(res.projects);
        const created = res.projects.find((p) => p.id === res.id) ?? res.projects[res.projects.length - 1];
        if (created) selectProject(created);
        onToast('Project added to CyberNest Work Showcase.');
      } else {
        const res = await adminApi.updateProject(selectedId, payload);
        onUpdated(res.projects);
        onToast(`Saved changes to "${payload.title}".`);
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save project.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) return;
    const reordered = [...projects];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onUpdated(reordered);
    try {
      const res = await adminApi.reorderProjects(reordered.map((p) => p.id));
      onUpdated(res.projects);
      onToast('Project display order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to reorder projects.', 'error');
    }
  };

  const togglePublish = async (proj: ProjectItem) => {
    try {
      const res = await adminApi.updateProject(proj.id, {
        ...proj,
        isPublished: !proj.isPublished,
      });
      onUpdated(res.projects);
      if (selectedId === proj.id) {
        setDraft((d) => ({ ...d, isPublished: !proj.isPublished }));
      }
      onToast(proj.isPublished ? `"${proj.title}" hidden.` : `"${proj.title}" published.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not update project.', 'error');
    }
  };

  const updateListItem = (
    field: 'features' | 'technologies' | 'outcomes',
    index: number,
    value: string,
  ) => {
    setDraft((d) => {
      const next = [...d[field]];
      next[index] = value;
      return { ...d, [field]: next };
    });
  };

  const addListItem = (field: 'features' | 'technologies' | 'outcomes') => {
    setDraft((d) => ({ ...d, [field]: [...d[field], ''] }));
  };

  const removeListItem = (field: 'features' | 'technologies' | 'outcomes', index: number) => {
    setDraft((d) => ({
      ...d,
      [field]: d[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Project Directory & Reorder */}
      <div className="lg:col-span-4 bg-white border border-[#1A1A1A]/12">
        <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-[#1A1A1A]">
              Projects ({projects.length})
            </h2>
            <p className="text-[11px] text-[#1A1A1A]/55">Showcase case studies on /work</p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-1 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1A1A1A] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Project</span>
          </button>
        </div>

        <div className="divide-y divide-[#1A1A1A]/10">
          {projects.map((proj, idx) => (
            <div
              key={proj.id}
              className={`p-3.5 flex items-center justify-between gap-2 ${
                selectedId === proj.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
              }`}
            >
              <button
                type="button"
                onClick={() => selectProject(proj)}
                className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
              >
                <div className="w-11 h-11 shrink-0 bg-[#141118] border border-[#1A1A1A]/15 overflow-hidden">
                  {proj.thumbnailUrl && (
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1A1A] truncate flex items-center gap-1.5">
                    <span className="truncate">{proj.title}</span>
                    {proj.isFeatured && (
                      <Star className="w-3 h-3 text-[#F5B800] fill-[#F5B800] shrink-0" aria-label="Featured" />
                    )}
                  </p>
                  <p className="text-[11px] text-[#1A1A1A]/60 truncate">{proj.category}</p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReorder(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${proj.title} up`}
                  className="p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(idx, 1)}
                  disabled={idx === projects.length - 1}
                  aria-label={`Move ${proj.title} down`}
                  className="p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(proj)}
                  aria-label={proj.isPublished ? `Hide ${proj.title}` : `Publish ${proj.title}`}
                  className={`p-1 cursor-pointer ${
                    proj.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                  }`}
                >
                  {proj.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(proj)}
                  aria-label={`Delete ${proj.title}`}
                  className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Project Case Study Form */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-8 bg-white border border-[#1A1A1A]/12 p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/10 pb-3">
          <h3 className="font-display text-base font-bold text-[#1A1A1A]">
            {selectedId === 'new' ? 'Create New Project Case Study' : `Edit Project · ${draft.title}`}
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                className="accent-[#4C138E]"
              />
              <span>Featured on Home</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setDraft((d) => ({
                  ...d,
                  title: nextTitle,
                  slug: selectedId === 'new' && !d.slug ? slugifyText(nextTitle) : d.slug,
                }));
              }}
              placeholder="e.g. VOXLAN Offline Voting"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
                URL Slug *
              </label>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, slug: slugifyText(d.title) }))}
                className="text-[11px] font-semibold text-[#4C138E] hover:underline cursor-pointer"
              >
                Generate from title
              </button>
            </div>
            <input
              type="text"
              required
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: slugifyText(e.target.value) }))}
              placeholder="voxlan-platform"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Category
            </label>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value as ProjectCategory }))
              }
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm bg-white"
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Linked CyberNest Product (Optional)
            </label>
            <select
              value={draft.relatedProductId || ''}
              onChange={(e) => setDraft((d) => ({ ...d, relatedProductId: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm bg-white"
            >
              <option value="">None</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Short Summary *
          </label>
          <textarea
            rows={2}
            required
            value={draft.summary}
            onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Detailed Overview
          </label>
          <textarea
            rows={2}
            value={draft.overview}
            onChange={(e) => setDraft((d) => ({ ...d, overview: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Problem Solved
            </label>
            <textarea
              rows={3}
              value={draft.problemSolved}
              onChange={(e) => setDraft((d) => ({ ...d, problemSolved: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Engineering Solution
            </label>
            <textarea
              rows={3}
              value={draft.ourSolution}
              onChange={(e) => setDraft((d) => ({ ...d, ourSolution: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <ImageUploadField
          label="Primary Thumbnail Image"
          value={draft.thumbnailUrl}
          onChange={(url) => setDraft((d) => ({ ...d, thumbnailUrl: url }))}
          onError={(msg) => onToast(msg, 'error')}
        />

        {/* Key Features, Technologies, Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#1A1A1A]/10">
          {(['features', 'technologies', 'outcomes'] as const).map((field) => {
            const labelMap = {
              features: 'Key Features',
              technologies: 'Technologies Stack',
              outcomes: 'Outcomes & Impact',
            };
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
                    {labelMap[field]}
                  </span>
                  <button
                    type="button"
                    onClick={() => addListItem(field)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4C138E] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {draft[field].map((val, idx) => (
                    <div key={`${field}-${idx}`} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateListItem(field, idx, e.target.value)}
                        className="flex-1 border border-[#1A1A1A]/20 px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem(field, idx)}
                        aria-label={`Remove item ${idx + 1} from ${field}`}
                        className="p-1.5 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gallery Screenshots */}
        <div className="space-y-3 pt-2 border-t border-[#1A1A1A]/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
              Gallery Screenshots ({draft.screenshots.length})
            </span>
          </div>
          {draft.screenshots.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {draft.screenshots.map((shot, idx) => (
                <div
                  key={`shot-${idx}`}
                  className="border border-[#1A1A1A]/15 bg-[#F7F6F3] p-2.5 flex items-center gap-2.5"
                >
                  <img
                    src={shot}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-12 h-12 object-cover bg-white border border-[#1A1A1A]/10 shrink-0"
                  />
                  <span className="text-[11px] font-mono-tabular truncate flex-1">{shot}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        screenshots: d.screenshots.filter((_, i) => i !== idx),
                      }))
                    }
                    className="p-1 text-rose-600 cursor-pointer"
                    aria-label={`Remove screenshot ${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <ImageUploadField
            label="Add Screenshot from File or Media Library"
            value={newScreenshotInput}
            onChange={(url) => {
              if (url.trim()) {
                setDraft((d) => ({
                  ...d,
                  screenshots: d.screenshots.includes(url.trim())
                    ? d.screenshots
                    : [...d.screenshots, url.trim()],
                }));
                setNewScreenshotInput('');
              }
            }}
            onError={(msg) => onToast(msg, 'error')}
            hint="Upload or pick an image to append it immediately to the project gallery."
          />
        </div>

        <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Project'}</span>
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Project Case Study"
        description={`Remove "${deleteTarget?.title || ''}" from CyberNest's work showcase?`}
        confirmLabel="Delete Project"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const res = await adminApi.deleteProject(deleteTarget.id);
            onUpdated(res.projects);
            if (selectedId === deleteTarget.id) {
              if (res.projects[0]) {
                selectProject(res.projects[0]);
              } else {
                handleNew();
              }
            }
            onToast('Project removed.');
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to delete project.', 'error');
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
