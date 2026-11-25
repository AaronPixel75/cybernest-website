import React, { useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { ProductItem } from '../data/content';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onRequestDemo: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onRequestDemo,
}) => {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 sm:p-6"
    >
      <div className="relative w-full max-w-3xl bg-[#F2EBDD] text-[#1A1A1A] border border-[#1A1A1A] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A1A] text-white border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
            {product.category}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${product.name} details`}
            className="inline-flex items-center justify-center w-9 h-9 border border-white/20 text-white hover:bg-white hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {product.imagePath && (
          <div className="w-full h-56 sm:h-72 bg-[#1A1A1A] overflow-hidden border-b border-[#1A1A1A]/15">
            <img
              src={product.imagePath}
              alt={`${product.name} software interface and platform preview`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          <div>
            <h3
              id="product-modal-title"
              className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
            >
              {product.name}
            </h3>
            <p className="mt-2 text-lg font-medium text-[#4C138E]">{product.tagline}</p>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-[#1A1A1A]/85">
            {product.summary}
          </p>

          <div className="border-l-2 border-[#8D5B38] pl-4 py-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
              Problem Solved
            </p>
            <p className="mt-1 text-sm text-[#1A1A1A]/85">{product.problemSolved}</p>
          </div>

          <div className="bg-white border border-[#1A1A1A]/15 p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
              Core Capabilities
            </p>
            <ul className="space-y-2 text-sm">
              {product.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-[#1A1A1A]/70 border-t border-[#1A1A1A]/15 pt-4">
            <strong className="text-[#1A1A1A]">Architecture Note:</strong>{' '}
            {product.architectureNote}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestDemo();
                }}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#4C138E] transition-colors cursor-pointer"
              >
                <span>Request Institutional Deployment</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              {product.externalUrl && (
                <a
                  href={product.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[#1A1A1A] px-5 py-3.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                >
                  <span>Visit Product Link</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-semibold text-[#1A1A1A]/75 hover:text-[#1A1A1A] cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
