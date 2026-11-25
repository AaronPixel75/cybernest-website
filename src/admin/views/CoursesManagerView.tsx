import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import type { CourseItem } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';

interface CoursesManagerViewProps {
  courses: CourseItem[];
  onUpdated: (courses: CourseItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_COURSE: Omit<CourseItem, 'id'> = {
  title: '',
  audience: 'Students, school clubs & beginners',
  focus: '',
  projectOutcome: '',
  imagePath: '',
  enrollUrl: '#contact',
  accentHex: '#4C138E',
  isPublished: true,
  sortOrder: 0,
};

export const CoursesManagerView: React.FC<CoursesManagerViewProps> = ({
  courses,
  onUpdated,
  onToast,
}) => {
  const [selectedId, setSelectedId] = useState<string | 'new'>(courses[0]?.id || 'new');
  const [draft, setDraft] = useState<Omit<CourseItem, 'id'>>(
    courses[0] ? { ...courses[0] } : { ...EMPTY_COURSE },
  );
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseItem | null>(null);

  const selectCourse = (c: CourseItem) => {
    setSelectedId(c.id);
    setDraft({ ...c });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.focus.trim()) {
      onToast('Course title and curriculum focus are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await adminApi.createCourse(draft);
        onUpdated(res.courses);
        const created = res.courses[res.courses.length - 1];
        if (created) selectCourse(created);
        onToast('Programming course added.');
      } else {
        const res = await adminApi.updateCourse(selectedId, draft);
        onUpdated(res.courses);
        onToast('Programming course updated.');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save course.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const moveCourse = async (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= courses.length) return;
    const copy = [...courses];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    try {
      const res = await adminApi.reorderCourses(copy.map((c) => c.id));
      onUpdated(res.courses);
      onToast('Course order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to reorder courses.', 'error');
    }
  };

  const togglePublish = async (c: CourseItem) => {
    try {
      const res = await adminApi.updateCourse(c.id, { ...c, isPublished: !c.isPublished });
      onUpdated(res.courses);
      if (selectedId === c.id) {
        setDraft((d) => ({ ...d, isPublished: !c.isPublished }));
      }
      onToast(c.isPublished ? `${c.title} hidden.` : `${c.title} published.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to toggle visibility.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 bg-white border border-[#1A1A1A]/12">
        <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-[#1A1A1A]">
              Training Tracks ({courses.length})
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/60">Python, Web Development, AI & more</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId('new');
              setDraft({ ...EMPTY_COURSE, sortOrder: courses.length });
            }}
            className="inline-flex items-center gap-1 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="divide-y divide-[#1A1A1A]/10">
          {courses.map((c, idx) => (
            <div
              key={c.id}
              className={`p-3.5 flex items-center justify-between gap-2 ${
                selectedId === c.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
              }`}
            >
              <button
                type="button"
                onClick={() => selectCourse(c)}
                className="text-left min-w-0 flex-1 cursor-pointer"
              >
                <p className="text-xs font-bold text-[#1A1A1A] truncate">{c.title}</p>
                <p className="text-[11px] text-[#1A1A1A]/60 truncate">{c.audience}</p>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveCourse(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                  aria-label={`Move ${c.title} up`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCourse(idx, 1)}
                  disabled={idx === courses.length - 1}
                  className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                  aria-label={`Move ${c.title} down`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(c)}
                  className={`p-1 cursor-pointer ${
                    c.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                  }`}
                  aria-label={`Toggle publish for ${c.title}`}
                >
                  {c.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                  aria-label={`Delete ${c.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="lg:col-span-8 bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
          <h3 className="font-display text-base font-bold text-[#1A1A1A]">
            {selectedId === 'new' ? 'New Programming Course' : `Edit ${draft.title}`}
          </h3>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))}
              className="accent-[#4C138E]"
            />
            Published
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Python Programming"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={draft.audience}
              onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Practical Curriculum Description
          </label>
          <textarea
            rows={3}
            value={draft.focus}
            onChange={(e) => setDraft((d) => ({ ...d, focus: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Hands-on Project Outcome
            </label>
            <input
              type="text"
              value={draft.projectOutcome}
              onChange={(e) => setDraft((d) => ({ ...d, projectOutcome: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Registration / Enrolment Link
            </label>
            <input
              type="text"
              value={draft.enrollUrl}
              onChange={(e) => setDraft((d) => ({ ...d, enrollUrl: e.target.value }))}
              placeholder="#contact or external form URL"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <ImageUploadField
          label="Course Cover Image"
          value={draft.imagePath}
          onChange={(url) => setDraft((d) => ({ ...d, imagePath: url }))}
          onError={(msg) => onToast(msg, 'error')}
        />

        <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Course'}</span>
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Programming Course"
        description={`Remove "${deleteTarget?.title || ''}" permanently?`}
        confirmLabel="Delete Course"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const res = await adminApi.deleteCourse(deleteTarget.id);
            onUpdated(res.courses);
            if (selectedId === deleteTarget.id && res.courses[0]) {
              selectCourse(res.courses[0]);
            }
            onToast(`Deleted ${deleteTarget.title}`);
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to delete course.', 'error');
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
