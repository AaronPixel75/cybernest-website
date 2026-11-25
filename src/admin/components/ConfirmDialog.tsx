import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md bg-white border border-[#1A1A1A]/20 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]/10">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className={`w-4 h-4 ${danger ? 'text-rose-600' : 'text-[#4C138E]'}`}
              aria-hidden="true"
            />
            <h3 id="confirm-dialog-title" className="font-display text-base font-bold text-[#1A1A1A]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-[#1A1A1A]/80 leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 bg-[#F7F6F3] border-t border-[#1A1A1A]/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold border border-[#1A1A1A]/20 bg-white text-[#1A1A1A] hover:bg-[#1A1A1A]/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white cursor-pointer ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#4C138E] hover:bg-[#1A1A1A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
