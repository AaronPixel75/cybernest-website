import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const pastHero = window.scrollY > 520;
      const nearFooter =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 150;
      setVisible(pastHero && !nearFooter);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={handleBackToTop}
      aria-label="Back to top"
      className={`group fixed bottom-5 right-5 z-[65] inline-flex items-center gap-2 bg-[#1A1A1A]/95 text-[#F2EBDD] border border-[#F5B800]/50 px-3.5 py-2 text-[11px] font-semibold tracking-wider uppercase shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-[#F5B800] hover:text-[#1A1A1A] hover:border-[#F5B800] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F5B800] ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp
        className="w-3.5 h-3.5 text-[#F5B800] group-hover:text-[#1A1A1A] transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
      <span>Back to top</span>
    </button>
  );
};
