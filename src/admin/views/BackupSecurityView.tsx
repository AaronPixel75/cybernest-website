import React, { useRef, useState } from 'react';
import { Database, Download, KeyRound, ShieldCheck, Upload } from 'lucide-react';
import type { SiteContentPayload } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface BackupSecurityViewProps {
  envOverrideActive: boolean;
  adminEmail: string | null;
  onSiteRestored: (site: SiteContentPayload) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BackupSecurityView: React.FC<BackupSecurityViewProps> = ({
  envOverrideActive,
  adminEmail,
  onSiteRestored,
  onToast,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<unknown | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setPendingSnapshot(parsed);
    } catch {
      onToast('Selected file is not valid JSON backup data.', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmRestore = async () => {
    if (!pendingSnapshot) return;
    setRestoring(true);
    try {
      const res = await adminApi.restoreBackup(pendingSnapshot);
      onSiteRestored(res.site);
      onToast('Website content restored cleanly. A pre-restore SQLite checkpoint was saved.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Restore failed.', 'error');
    } finally {
      setRestoring(false);
      setPendingSnapshot(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      onToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onToast('New password and confirmation do not match.', 'error');
      return;
    }
    setChangingPass(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast('Administrator password updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to change password.', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Backup & Restore */}
      <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-5">
        <div className="flex items-start gap-3 border-b border-[#1A1A1A]/10 pb-3">
          <Database className="w-5 h-5 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-bold text-[#1A1A1A]">
              Database Backups & Recovery
            </h3>
            <p className="text-xs text-[#1A1A1A]/65">
              Export portable JSON snapshots, download the raw SQLite database file, or restore a previous CMS snapshot.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/backup/export"
            className="inline-flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download JSON Snapshot</span>
          </a>

          <a
            href="/api/admin/backup/sqlite"
            className="inline-flex items-center gap-2 border border-[#1A1A1A]/20 bg-white px-4 py-2.5 text-xs font-semibold text-[#1A1A1A] hover:border-[#4C138E] transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download SQLite (.db)</span>
          </a>
        </div>

        <div className="border-t border-[#1A1A1A]/10 pt-4 space-y-3">
          <p className="text-xs font-bold text-[#1A1A1A]">Restore from JSON Snapshot</p>
          <p className="text-xs text-[#1A1A1A]/65 leading-relaxed">
            Before overwriting live CMS records, CyberNest automatically creates a pre-restore SQLite checkpoint on the server.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFilePick}
            className="hidden"
          />
          <button
            type="button"
            disabled={restoring}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 border border-[#4C138E] bg-[#4C138E]/5 px-4 py-2 text-xs font-bold text-[#4C138E] hover:bg-[#4C138E] hover:text-white transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{restoring ? 'Restoring...' : 'Select Backup JSON File'}</span>
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-5">
        <div className="flex items-start gap-3 border-b border-[#1A1A1A]/10 pb-3">
          <KeyRound className="w-5 h-5 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-bold text-[#1A1A1A]">
              Administrator Security
            </h3>
            <p className="text-xs text-[#1A1A1A]/65">
              Signed in as <strong className="text-[#1A1A1A]">{adminEmail || 'Administrator'}</strong>
            </p>
          </div>
        </div>

        {envOverrideActive ? (
          <div className="bg-[#F7F6F3] border border-[#1A1A1A]/12 p-4 text-xs text-[#1A1A1A]/80 leading-relaxed space-y-2">
            <p className="font-semibold text-[#1A1A1A]">
              Environment Secret Mode Active
            </p>
            <p>
              Administrator credentials are configured through server environment variables (<code>ADMIN_PASSWORD</code>). Update that variable in your hosting Secrets panel to rotate the password.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={changingPass}
              className="bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
            >
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="border-t border-[#1A1A1A]/10 pt-3 flex items-start gap-2 text-xs text-[#1A1A1A]/65">
          <ShieldCheck className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Sessions use server-stored SHA-256 token hashes inside HttpOnly cookies, scrypt password hashing, origin/header CSRF protection, and login rate limiting.
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingSnapshot)}
        title="Restore Website Content Backup"
        description="Restoring this JSON backup will replace current homepage, about, contact, SEO, team, products, courses, and social links. A pre-restore database checkpoint will be saved first."
        confirmLabel="Restore Snapshot"
        danger
        onConfirm={confirmRestore}
        onCancel={() => setPendingSnapshot(null)}
      />
    </div>
  );
};
