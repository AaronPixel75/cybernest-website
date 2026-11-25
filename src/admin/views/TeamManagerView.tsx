import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Globe,
  Plus,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { TeamMember } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';

interface TeamManagerViewProps {
  members: TeamMember[];
  onUpdated: (members: TeamMember[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_DRAFT: Omit<TeamMember, 'id'> = {
  slotIndex: '06',
  name: '',
  roleTitle: '',
  discipline: 'Software Engineering',
  bio: '',
  accentHex: '#4C138E',
  photoUrl: '',
  socialLinks: {
    website: '',
    linkedin: '',
    github: '',
    x: '',
    instagram: '',
  },
  sortOrder: 0,
  isPublished: true,
};

export const TeamManagerView: React.FC<TeamManagerViewProps> = ({
  members,
  onUpdated,
  onToast,
}) => {
  const [selectedId, setSelectedId] = useState<string | 'new'>(members[0]?.id || 'new');
  const [draft, setDraft] = useState<Omit<TeamMember, 'id'>>(
    members[0]
      ? {
          slotIndex: members[0].slotIndex,
          name: members[0].name,
          roleTitle: members[0].roleTitle,
          discipline: members[0].discipline,
          bio: members[0].bio,
          accentHex: members[0].accentHex,
          photoUrl: members[0].photoUrl,
          socialLinks: { ...members[0].socialLinks },
          sortOrder: members[0].sortOrder,
          isPublished: members[0].isPublished,
        }
      : { ...EMPTY_DRAFT, slotIndex: String(members.length + 1).padStart(2, '0') },
  );
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const selectMember = (m: TeamMember) => {
    setSelectedId(m.id);
    setDraft({
      slotIndex: m.slotIndex,
      name: m.name,
      roleTitle: m.roleTitle,
      discipline: m.discipline,
      bio: m.bio,
      accentHex: m.accentHex,
      photoUrl: m.photoUrl,
      socialLinks: { ...m.socialLinks },
      sortOrder: m.sortOrder,
      isPublished: m.isPublished,
    });
  };

  const startNew = () => {
    setSelectedId('new');
    setDraft({
      ...EMPTY_DRAFT,
      slotIndex: String(members.length + 1).padStart(2, '0'),
      sortOrder: members.length,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.roleTitle.trim()) {
      onToast('Name and job title are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await adminApi.createTeamMember(draft);
        onUpdated(res.teamMembers);
        const created = res.teamMembers[res.teamMembers.length - 1];
        if (created) selectMember(created);
        onToast('Team profile added and synced.');
      } else {
        const res = await adminApi.updateTeamMember(selectedId, draft);
        onUpdated(res.teamMembers);
        onToast('Team profile updated.');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save team member.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (m: TeamMember) => {
    try {
      const res = await adminApi.updateTeamMember(m.id, {
        ...m,
        isPublished: !m.isPublished,
      });
      onUpdated(res.teamMembers);
      if (selectedId === m.id) {
        setDraft((d) => ({ ...d, isPublished: !m.isPublished }));
      }
      onToast(m.isPublished ? `${m.name} hidden from public carousel.` : `${m.name} published.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to toggle visibility.', 'error');
    }
  };

  const moveMember = async (idx: number, delta: -1 | 1) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= members.length) return;
    const copy = [...members];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    try {
      const res = await adminApi.reorderTeamMembers(copy.map((m) => m.id));
      onUpdated(res.teamMembers);
      onToast('Carousel order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not reorder team.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deleteTeamMember(deleteTarget.id);
      onUpdated(res.teamMembers);
      if (selectedId === deleteTarget.id) {
        if (res.teamMembers[0]) selectMember(res.teamMembers[0]);
        else startNew();
      }
      onToast(`Deleted profile: ${deleteTarget.name}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to delete team member.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const previewSocials = Object.entries(draft.socialLinks || {}).filter(
    ([, url]) => typeof url === 'string' && url.trim().length > 0,
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left Roster Directory */}
      <div className="xl:col-span-4 bg-white border border-[#1A1A1A]/12">
        <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-[#1A1A1A]">
              Team Carousel Roster ({members.length})
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/60">Reorder, publish, hide, or edit profiles</p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-1.5 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="divide-y divide-[#1A1A1A]/10">
          {members.map((m, idx) => (
            <div
              key={m.id}
              className={`p-3.5 flex items-center justify-between gap-3 ${
                selectedId === m.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
              }`}
            >
              <button
                type="button"
                onClick={() => selectMember(m)}
                className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
              >
                <div className="w-10 h-10 shrink-0 bg-[#1A1A1A] text-white flex items-center justify-center overflow-hidden border border-[#1A1A1A]/15">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono-tabular text-xs text-[#F5B800]">{m.slotIndex}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1A1A] truncate">{m.name}</p>
                  <p className="text-[11px] text-[#1A1A1A]/60 truncate">{m.roleTitle}</p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveMember(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${m.name} up`}
                  className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveMember(idx, 1)}
                  disabled={idx === members.length - 1}
                  aria-label={`Move ${m.name} down`}
                  className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] disabled:opacity-25 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(m)}
                  aria-label={m.isPublished ? `Hide ${m.name}` : `Publish ${m.name}`}
                  title={m.isPublished ? 'Published on live site' : 'Hidden'}
                  className={`p-1 cursor-pointer ${
                    m.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                  }`}
                >
                  {m.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(m)}
                  aria-label={`Delete ${m.name}`}
                  className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Editor Form */}
      <form
        onSubmit={handleSave}
        className="xl:col-span-5 bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
          <h3 className="font-display text-base font-bold text-[#1A1A1A]">
            {selectedId === 'new' ? 'New Team Profile' : 'Edit Team Profile'}
          </h3>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))}
              className="accent-[#4C138E]"
            />
            <span>Published on Website</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Slot #
            </label>
            <input
              type="text"
              value={draft.slotIndex}
              onChange={(e) => setDraft((d) => ({ ...d, slotIndex: e.target.value }))}
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm font-mono-tabular"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Sarah Namazzi"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={draft.roleTitle}
              onChange={(e) => setDraft((d) => ({ ...d, roleTitle: e.target.value }))}
              placeholder="e.g. Lead Software Engineer"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
              Discipline Tag
            </label>
            <input
              type="text"
              value={draft.discipline}
              onChange={(e) => setDraft((d) => ({ ...d, discipline: e.target.value }))}
              placeholder="e.g. Software Systems"
              className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
            Bio / Description
          </label>
          <textarea
            rows={3}
            value={draft.bio}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
          />
        </div>

        <ImageUploadField
          label="Profile Picture"
          value={draft.photoUrl}
          onChange={(url) => setDraft((d) => ({ ...d, photoUrl: url }))}
          hint="Upload a portrait (PNG, JPG, WebP) or select from the Media Library."
          onError={(msg) => onToast(msg, 'error')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(['linkedin', 'github', 'x', 'instagram', 'website'] as const).map((plat) => (
            <div key={plat}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/65 mb-1">
                {plat} URL
              </label>
              <input
                type="url"
                value={draft.socialLinks?.[plat] || ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    socialLinks: { ...d.socialLinks, [plat]: e.target.value },
                  }))
                }
                placeholder={`https://${plat === 'website' ? 'cybernestug.com' : `${plat}.com/...`}`}
                className="w-full border border-[#1A1A1A]/20 px-3 py-1.5 text-xs"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/65 mb-1">
              Card Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.accentHex}
                onChange={(e) => setDraft((d) => ({ ...d, accentHex: e.target.value }))}
                className="h-8 w-10 border border-[#1A1A1A]/20 cursor-pointer"
              />
              <span className="font-mono-tabular text-xs">{draft.accentHex}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Team Profile'}</span>
          </button>
        </div>
      </form>

      {/* Right Live Website Card Preview */}
      <div className="xl:col-span-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/65">
          Live Carousel Card Preview
        </p>
        <div className="rounded-xl overflow-hidden bg-[#16131A] text-[#F2EBDD] border border-[#F5B800]/55 shadow-lg">
          <div
            className="relative h-56 p-5 flex flex-col justify-between border-b border-[#F5B800]/20 overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(76, 19, 142, 0.44), rgba(22, 19, 26, 0.98) 76%)',
            }}
          >
            {draft.photoUrl && (
              <>
                <img
                  src={draft.photoUrl}
                  alt={draft.name || 'Preview'}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16131A] via-[#16131A]/25 to-[#16131A]/55" />
              </>
            )}
            <div className="relative z-10 flex items-center justify-between text-[10px] tracking-widest uppercase">
              <span className="font-mono-tabular text-[#F5B800] font-semibold">
                CN · {draft.slotIndex || '00'}
              </span>
              <span className="text-[#F2EBDD]/70">
                {draft.photoUrl ? draft.discipline : 'Portrait Pending'}
              </span>
            </div>

            {!draft.photoUrl ? (
              <div className="relative z-10 my-auto flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center border border-[#F5B800]/45"
                  style={{
                    background: `linear-gradient(145deg, ${draft.accentHex}, #141118)`,
                  }}
                >
                  <UserRound className="w-8 h-8 text-[#F2EBDD]" strokeWidth={1.35} />
                </div>
                <span className="mt-2 font-mono-tabular text-[10px] uppercase tracking-widest text-[#F5B800]">
                  {draft.discipline || 'Discipline'}
                </span>
              </div>
            ) : (
              <div className="relative z-10 mt-auto">
                <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#F5B800]">
                  {draft.discipline}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-2.5 bg-[#1A161F]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5B800]">
                {draft.roleTitle || 'Job Title'}
              </p>
              <h4 className="mt-1 font-display text-lg font-bold text-white">
                {draft.name || 'Team Member Name'}
              </h4>
            </div>
            <p className="text-xs leading-relaxed text-[#F2EBDD]/75 line-clamp-3">
              {draft.bio || 'Biography appears here.'}
            </p>
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              {previewSocials.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {previewSocials.map(([p]) => (
                    <span key={p} className="inline-flex items-center gap-1 text-[#F2EBDD]/85 capitalize">
                      <Globe className="w-3 h-3 text-[#F5B800]" />
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#F2EBDD]/45">Studio Roster</span>
              )}
              <span className="text-[10px] font-mono-tabular text-[#F5B800]">
                {draft.isPublished ? 'Published' : 'Hidden Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Team Profile"
        description={`Remove "${deleteTarget?.name || ''}" permanently from the CyberNest team roster?`}
        confirmLabel="Delete Profile"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
