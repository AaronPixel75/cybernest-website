import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import type { MediaAssetRecord } from '../../types/cms';
import { adminApi } from '../api';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  onError?: (msg: string) => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  hint,
  onError,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { asset } = await adminApi.uploadImage(file);
      onChange(asset.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLoadingLibrary(true);
    try {
      const res = await adminApi.listUploads();
      setAssets(res.assets);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not load uploaded images.');
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await adminApi.deleteUpload(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not delete media asset.');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-20 h-20 shrink-0 border border-[#1A1A1A]/15 bg-[#F7F6F3] flex items-center justify-center overflow-hidden">
          {value ? (
            <img
              src={value}
              alt={`${label} preview`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-[#1A1A1A]/30" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/... or /src/assets/images/..."
            className="w-full border border-[#1A1A1A]/20 bg-white px-3 py-2 text-xs font-mono-tabular text-[#1A1A1A] focus:outline-none focus:border-[#4C138E]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4C138E] transition-colors cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={openLibrary}
              className="inline-flex items-center gap-1.5 border border-[#1A1A1A]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:border-[#4C138E] hover:text-[#4C138E] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Media Library</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {hint && <p className="text-[11px] text-[#1A1A1A]/55">{hint}</p>}
        </div>
      </div>

      {libraryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Uploaded media library"
          className="fixed inset-0 z-[105] flex items-center justify-center bg-black/65 p-4"
        >
          <div className="w-full max-w-2xl bg-white border border-[#1A1A1A]/20 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]/10">
              <h4 className="font-display text-base font-bold text-[#1A1A1A]">
                Media Library
              </h4>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                aria-label="Close media library"
                className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingLibrary ? (
                <p className="text-sm text-[#1A1A1A]/60">Loading uploaded images...</p>
              ) : assets.length === 0 ? (
                <p className="text-sm text-[#1A1A1A]/60 py-8 text-center">
                  No custom images uploaded yet. Use “Upload Image” to add your first asset.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="border border-[#1A1A1A]/15 bg-[#F7F6F3] flex flex-col overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(asset.url);
                          setLibraryOpen(false);
                        }}
                        className="h-32 w-full bg-white overflow-hidden cursor-pointer hover:opacity-90"
                      >
                        <img
                          src={asset.url}
                          alt={asset.originalName}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="p-2.5 flex items-center justify-between gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            onChange(asset.url);
                            setLibraryOpen(false);
                          }}
                          className="truncate font-medium text-[#1A1A1A] hover:text-[#4C138E] text-left cursor-pointer"
                          title={asset.originalName}
                        >
                          {asset.originalName}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          aria-label={`Delete ${asset.originalName}`}
                          className="text-rose-600 hover:text-rose-800 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
