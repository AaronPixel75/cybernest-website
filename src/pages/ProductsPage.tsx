import React, { useMemo } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { ProductsSection } from '../components/sections/ProductsSection';
import { useSiteContent } from '../context/SiteContentContext';
import { BreadcrumbItem, slugifyText } from '../utils/navigationLogic';

interface ProductsPageProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const { homepage, products } = content;

  const orderedProducts = useMemo(() => {
    const featuredIds = homepage.featuredProductIds || [];
    if (featuredIds.length === 0) return products;
    const rankMap = new Map(featuredIds.map((id, idx) => [id, idx]));
    return [...products].sort((a, b) => {
      const ra = rankMap.has(a.id) ? rankMap.get(a.id)! : 999;
      const rb = rankMap.has(b.id) ? rankMap.get(b.id)! : 999;
      if (ra !== rb) return ra - rb;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [products, homepage.featuredProductIds]);

  return (
    <>
      <section className="bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="light" />
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
              Our Products · CyberNest Studio
            </p>
            <h1
              className="font-display font-extrabold tracking-[-0.035em] text-[#1A1A1A] leading-[0.98] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.1rem)' }}
            >
              Original technology products engineered for reliability.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#1A1A1A]/80">
              Try VOXLAN’s interactive offline booth simulator, explore CyberNest Scholar’s
              academic reporting insights, or open any product page for full specifications.
            </p>
          </div>
        </div>
      </section>

      <ProductsSection
        products={orderedProducts}
        onExploreProduct={(product) =>
          onNavigatePath(`/products/${slugifyText(product.id || product.name)}`)
        }
      />

      <ClosingCtaSection
        headline="DEPLOY A CYBERNEST PRODUCT AT YOUR SCHOOL."
        primaryLabel="Book a Live Demo"
        primaryPath="/contact"
        secondaryLabel="View Related Case Studies"
        secondaryPath="/work"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
