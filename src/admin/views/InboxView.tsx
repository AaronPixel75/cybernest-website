import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Mail, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { ContactSubmissionRecord } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface InboxViewProps {
  enquiries: ContactSubmissionRecord[];
  onRefresh: () => Promise<void>;
  onUpdatedEnquiries: (items: ContactSubmissionRecord[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  enquiries,
  onRefresh,
  onUpdatedEnquiries,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(enquiries[0]?.id || null);
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmissionRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [enquiries, search, statusFilter]);

  const activeItem =
    filtered.find((e) => e.id === selectedId) || filtered[0] || null;

  const toggleStatus = async (item: ContactSubmissionRecord) => {
    const nextStatus = item.status === 'pending' ? 'resolved' : 'pending';
    try {
      await adminApi.updateEnquiryStatus(item.id, nextStatus);
      onUpdatedEnquiries(
        enquiries.map((e) => (e.id === item.id ? { ...e, status: nextStatus } : e)),
      );
      onToast(`Marked enquiry from ${item.fullName} as ${nextStatus}.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to update status.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteEnquiry(deleteTarget.id);
      const next = enquiries.filter((e) => e.id !== deleteTarget.id);
      onUpdatedEnquiries(next);
      if (selectedId === deleteTarget.id) {
        setSelectedId(next[0]?.id || null);
      }
      onToast('Enquiry deleted.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to delete enquiry.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-[#1A1A1A]/12 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="w-3.5 h-3.5 text-[#1A1A1A]/45 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, institution..."
              className="w-full border border-[#1A1A1A]/20 pl-8 pr-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center border border-[#1A1A1A]/15 bg-[#F7F6F3] p-0.5">
            {(['all', 'pending', 'resolved'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-semibold capitalize cursor-pointer ${
                  statusFilter === s ? 'bg-white text-[#4C138E]' : 'text-[#1A1A1A]/70'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              await onRefresh();
              setRefreshing(false);
            }}
            className="inline-flex items-center gap-1.5 border border-[#1A1A1A]/20 bg-white px-3 py-2 text-xs font-semibold hover:border-[#4C138E] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/admin/enquiries/export"
            className="inline-flex items-center gap-1.5 bg-[#1A1A1A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 bg-white border border-[#1A1A1A]/12 divide-y divide-[#1A1A1A]/10">
          {filtered.length === 0 ? (
            <p className="p-6 text-xs text-[#1A1A1A]/55 text-center">
              No enquiries match the selected filter.
            </p>
          ) : (
            filtered.map((item) => {
              const isSelected = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#F2EBDD]/65' : 'hover:bg-[#F7F6F3]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#1A1A1A] truncate">
                      {item.fullName}
                    </span>
                    <span
                      className={`text-[10px] font-mono-tabular uppercase px-2 py-0.5 font-semibold ${
                        item.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#1A1A1A]/65 truncate">
                    {item.organization || item.email} · {item.enquiryType}
                  </p>
                  <p className="mt-1.5 text-xs text-[#1A1A1A]/80 line-clamp-2">
                    {item.message}
                  </p>
                  <p className="mt-2 font-mono-tabular text-[10px] text-[#1A1A1A]/45">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-[#1A1A1A]/12 p-6">
          {!activeItem ? (
            <p className="text-sm text-[#1A1A1A]/55 py-12 text-center">
              Select a contact submission to read full details.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1A1A1A]/10 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4C138E]">
                    {activeItem.enquiryType} enquiry
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#1A1A1A]">
                    {activeItem.fullName}
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                    {activeItem.email}
                    {activeItem.organization ? ` · ${activeItem.organization}` : ''}
                  </p>
                  <p className="font-mono-tabular text-[11px] text-[#1A1A1A]/50 mt-1">
                    Submitted: {new Date(activeItem.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(activeItem)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold cursor-pointer ${
                      activeItem.status === 'resolved'
                        ? 'border border-[#1A1A1A]/20 bg-white text-[#1A1A1A]'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    {activeItem.status === 'resolved' ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Reopen Pending</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(activeItem)}
                    className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#F7F6F3] border border-[#1A1A1A]/10 p-4 text-sm leading-relaxed text-[#1A1A1A] whitespace-pre-wrap">
                {activeItem.message}
              </div>

              <div className="pt-2">
                <a
                  href={`mailto:${activeItem.email}?subject=${encodeURIComponent(
                    `Re: CyberNest ${activeItem.enquiryType} enquiry`,
                  )}`}
                  className="inline-flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reply via Email Client</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Enquiry"
        description={`Permanently delete the enquiry from "${deleteTarget?.fullName || ''}"?`}
        confirmLabel="Delete Enquiry"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
