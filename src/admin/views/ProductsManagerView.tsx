import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import type { ProductItem, SoftwareProgramItem } from '../../types/cms';
import { adminApi } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';

interface ProductsManagerViewProps {
  products: ProductItem[];
  programs: SoftwareProgramItem[];
  onUpdatedProducts: (items: ProductItem[]) => void;
  onUpdatedPrograms: (items: SoftwareProgramItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_PRODUCT: Omit<ProductItem, 'id'> = {
  name: '',
  category: 'Software Application',
  tagline: '',
  summary: '',
  problemSolved: '',
  features: ['Built for institutional reliability'],
  accentHex: '#4C138E',
  imagePath: '',
  externalUrl: '',
  isFlagship: false,
  isPublished: true,
  architectureNote: '',
  sortOrder: 0,
};

const EMPTY_PROGRAM: Omit<SoftwareProgramItem, 'id'> = {
  name: '',
  category: 'Custom Application',
  purpose: '',
  problemSolved: '',
  features: ['Offline-resilient workflow'],
  accentHex: '#4C138E',
  isPublished: true,
  sortOrder: 0,
};

export const ProductsManagerView: React.FC<ProductsManagerViewProps> = ({
  products,
  programs,
  onUpdatedProducts,
  onUpdatedPrograms,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'products' | 'programs'>('products');

  // Products state
  const [selectedProdId, setSelectedProdId] = useState<string | 'new'>(products[0]?.id || 'new');
  const [prodDraft, setProdDraft] = useState<Omit<ProductItem, 'id'>>(
    products[0] ? { ...products[0] } : { ...EMPTY_PRODUCT },
  );
  const [deleteProd, setDeleteProd] = useState<ProductItem | null>(null);

  // Programs state
  const [selectedProgId, setSelectedProgId] = useState<string | 'new'>(programs[0]?.id || 'new');
  const [progDraft, setProgDraft] = useState<Omit<SoftwareProgramItem, 'id'>>(
    programs[0] ? { ...programs[0] } : { ...EMPTY_PROGRAM },
  );
  const [deleteProg, setDeleteProg] = useState<SoftwareProgramItem | null>(null);

  const [saving, setSaving] = useState(false);

  const selectProduct = (p: ProductItem) => {
    setSelectedProdId(p.id);
    setProdDraft({ ...p, features: [...p.features] });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodDraft.name.trim() || !prodDraft.tagline.trim()) {
      onToast('Product name and tagline are required.', 'error');
      return;
    }
    const cleanFeatures = prodDraft.features.map((f) => f.trim()).filter(Boolean);
    if (cleanFeatures.length === 0) {
      onToast('Add at least one key feature.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...prodDraft, features: cleanFeatures };
      if (selectedProdId === 'new') {
        const res = await adminApi.createProduct(payload);
        onUpdatedProducts(res.products);
        const created = res.products[res.products.length - 1];
        if (created) selectProduct(created);
        onToast('Product created and saved.');
      } else {
        const res = await adminApi.updateProduct(selectedProdId, payload);
        onUpdatedProducts(res.products);
        onToast('Product updated.');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const moveProduct = async (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= products.length) return;
    const copy = [...products];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    try {
      const res = await adminApi.reorderProducts(copy.map((p) => p.id));
      onUpdatedProducts(res.products);
      onToast('Product order updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to reorder products.', 'error');
    }
  };

  const toggleProductPublish = async (p: ProductItem) => {
    try {
      const res = await adminApi.updateProduct(p.id, { ...p, isPublished: !p.isPublished });
      onUpdatedProducts(res.products);
      if (selectedProdId === p.id) {
        setProdDraft((d) => ({ ...d, isPublished: !p.isPublished }));
      }
      onToast(p.isPublished ? `${p.name} unpublished.` : `${p.name} published.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to toggle publish state.', 'error');
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFeatures = progDraft.features.map((f) => f.trim()).filter(Boolean);
    if (!progDraft.name.trim() || cleanFeatures.length === 0) {
      onToast('Program name and at least one feature are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...progDraft, features: cleanFeatures };
      if (selectedProgId === 'new') {
        const res = await adminApi.createProgram(payload);
        onUpdatedPrograms(res.softwarePrograms);
        const created = res.softwarePrograms[res.softwarePrograms.length - 1];
        if (created) {
          setSelectedProgId(created.id);
          setProgDraft({ ...created });
        }
        onToast('Software program added.');
      } else {
        const res = await adminApi.updateProgram(selectedProgId, payload);
        onUpdatedPrograms(res.softwarePrograms);
        onToast('Software program updated.');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Unable to save program.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-[#1A1A1A]/12 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('products')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer ${
            subTab === 'products'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]'
          }`}
        >
          Products & Flagship Showcase ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('programs')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer ${
            subTab === 'programs'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A]'
          }`}
        >
          Software Development Programs ({programs.length})
        </button>
      </div>

      {subTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-[#1A1A1A]/12">
            <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#1A1A1A]">Products List</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProdId('new');
                  setProdDraft({ ...EMPTY_PRODUCT, sortOrder: products.length });
                }}
                className="inline-flex items-center gap-1 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
            <div className="divide-y divide-[#1A1A1A]/10">
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3.5 flex items-center justify-between gap-2 ${
                    selectedProdId === p.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectProduct(p)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#1A1A1A] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#1A1A1A]/60 truncate">{p.category}</p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveProduct(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                      aria-label={`Move ${p.name} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(idx, 1)}
                      disabled={idx === products.length - 1}
                      className="p-1 text-[#1A1A1A]/60 disabled:opacity-25 cursor-pointer"
                      aria-label={`Move ${p.name} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductPublish(p)}
                      className={`p-1 cursor-pointer ${
                        p.isPublished ? 'text-emerald-700' : 'text-[#1A1A1A]/40'
                      }`}
                      aria-label={`Toggle publish for ${p.name}`}
                    >
                      {p.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteProd(p)}
                      className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSaveProduct}
            className="lg:col-span-8 bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/10 pb-3">
              <h3 className="font-display text-base font-bold text-[#1A1A1A]">
                {selectedProdId === 'new' ? 'Create New Product' : `Edit ${prodDraft.name}`}
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodDraft.isFlagship}
                    onChange={(e) => setProdDraft((d) => ({ ...d, isFlagship: e.target.checked }))}
                    className="accent-[#4C138E]"
                  />
                  Flagship
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodDraft.isPublished}
                    onChange={(e) => setProdDraft((d) => ({ ...d, isPublished: e.target.checked }))}
                    className="accent-[#4C138E]"
                  />
                  Published
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={prodDraft.name}
                  onChange={(e) => setProdDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={prodDraft.category}
                  onChange={(e) => setProdDraft((d) => ({ ...d, category: e.target.value }))}
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={prodDraft.tagline}
                onChange={(e) => setProdDraft((d) => ({ ...d, tagline: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Summary Description
              </label>
              <textarea
                rows={3}
                value={prodDraft.summary}
                onChange={(e) => setProdDraft((d) => ({ ...d, summary: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Problem Solved
              </label>
              <textarea
                rows={2}
                value={prodDraft.problemSolved}
                onChange={(e) => setProdDraft((d) => ({ ...d, problemSolved: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <ImageUploadField
              label="Product Screenshot / Image"
              value={prodDraft.imagePath}
              onChange={(url) => setProdDraft((d) => ({ ...d, imagePath: url }))}
              onError={(msg) => onToast(msg, 'error')}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
                  Key Capabilities / Features
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setProdDraft((d) => ({ ...d, features: [...d.features, ''] }))
                  }
                  className="text-xs font-semibold text-[#4C138E] hover:underline cursor-pointer"
                >
                  + Add Feature
                </button>
              </div>
              {prodDraft.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => {
                      const next = [...prodDraft.features];
                      next[idx] = e.target.value;
                      setProdDraft((d) => ({ ...d, features: next }));
                    }}
                    className="flex-1 border border-[#1A1A1A]/20 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProdDraft((d) => ({
                        ...d,
                        features: d.features.filter((_, i) => i !== idx),
                      }))
                    }
                    className="p-1.5 text-rose-600 cursor-pointer"
                    aria-label="Remove feature"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  External Product URL (Optional)
                </label>
                <input
                  type="text"
                  value={prodDraft.externalUrl}
                  onChange={(e) => setProdDraft((d) => ({ ...d, externalUrl: e.target.value }))}
                  placeholder="https://cybernestug.com/voxlan"
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  Architecture Note
                </label>
                <input
                  type="text"
                  value={prodDraft.architectureNote}
                  onChange={(e) =>
                    setProdDraft((d) => ({ ...d, architectureNote: e.target.value }))
                  }
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-[#1A1A1A]/12">
            <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#1A1A1A]">Software Programs</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProgId('new');
                  setProgDraft({ ...EMPTY_PROGRAM, sortOrder: programs.length });
                }}
                className="inline-flex items-center gap-1 bg-[#4C138E] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Program</span>
              </button>
            </div>
            <div className="divide-y divide-[#1A1A1A]/10">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className={`p-3.5 flex items-center justify-between gap-2 ${
                    selectedProgId === prog.id ? 'bg-[#F2EBDD]/60' : 'hover:bg-[#F7F6F3]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProgId(prog.id);
                      setProgDraft({ ...prog, features: [...prog.features] });
                    }}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#1A1A1A] truncate">{prog.name}</p>
                    <p className="text-[11px] text-[#1A1A1A]/60 truncate">{prog.category}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteProg(prog)}
                    className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                    aria-label={`Delete ${prog.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSaveProgram}
            className="lg:col-span-8 bg-white border border-[#1A1A1A]/12 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <h3 className="font-display text-base font-bold text-[#1A1A1A]">
                {selectedProgId === 'new' ? 'New Software Program' : `Edit ${progDraft.name}`}
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={progDraft.isPublished}
                  onChange={(e) => setProgDraft((d) => ({ ...d, isPublished: e.target.checked }))}
                  className="accent-[#4C138E]"
                />
                Published
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  Program Name
                </label>
                <input
                  type="text"
                  value={progDraft.name}
                  onChange={(e) => setProgDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={progDraft.category}
                  onChange={(e) => setProgDraft((d) => ({ ...d, category: e.target.value }))}
                  className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Purpose
              </label>
              <textarea
                rows={2}
                value={progDraft.purpose}
                onChange={(e) => setProgDraft((d) => ({ ...d, purpose: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75 mb-1">
                Problem Solved
              </label>
              <textarea
                rows={2}
                value={progDraft.problemSolved}
                onChange={(e) => setProgDraft((d) => ({ ...d, problemSolved: e.target.value }))}
                className="w-full border border-[#1A1A1A]/20 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/75">
                  Features
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setProgDraft((d) => ({ ...d, features: [...d.features, ''] }))
                  }
                  className="text-xs font-semibold text-[#4C138E] hover:underline cursor-pointer"
                >
                  + Add Feature
                </button>
              </div>
              {progDraft.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => {
                      const next = [...progDraft.features];
                      next[idx] = e.target.value;
                      setProgDraft((d) => ({ ...d, features: next }));
                    }}
                    className="flex-1 border border-[#1A1A1A]/20 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProgDraft((d) => ({
                        ...d,
                        features: d.features.filter((_, i) => i !== idx),
                      }))
                    }
                    className="p-1.5 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#1A1A1A]/10 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C138E] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Software Program'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteProd)}
        title="Delete Product"
        description={`Remove "${deleteProd?.name || ''}" permanently?`}
        confirmLabel="Delete Product"
        danger
        onConfirm={async () => {
          if (!deleteProd) return;
          try {
            const res = await adminApi.deleteProduct(deleteProd.id);
            onUpdatedProducts(res.products);
            if (selectedProdId === deleteProd.id && res.products[0]) {
              selectProduct(res.products[0]);
            }
            onToast(`Deleted ${deleteProd.name}`);
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to delete product.', 'error');
          } finally {
            setDeleteProd(null);
          }
        }}
        onCancel={() => setDeleteProd(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteProg)}
        title="Delete Software Program"
        description={`Remove "${deleteProg?.name || ''}" permanently?`}
        confirmLabel="Delete Program"
        danger
        onConfirm={async () => {
          if (!deleteProg) return;
          try {
            const res = await adminApi.deleteProgram(deleteProg.id);
            onUpdatedPrograms(res.softwarePrograms);
            onToast(`Deleted ${deleteProg.name}`);
          } catch (err) {
            onToast(err instanceof Error ? err.message : 'Unable to delete program.', 'error');
          } finally {
            setDeleteProg(null);
          }
        }}
        onCancel={() => setDeleteProg(null)}
      />
    </div>
  );
};
