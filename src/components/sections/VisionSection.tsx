import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../context/SiteContentContext';

export const VisionSection: React.FC = () => {
  const { content } = useSiteContent();
  const { about } = content;
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const sec = sectionRef.current;
      const img = bgRef.current;
      if (!sec || !img) return;
      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const delta = rect.top + rect.height / 2 - vh / 2;
      const y = Math.max(-44, Math.min(44, -delta * 0.08));
      img.style.transform = `scale(1.1) translate3d(0, ${y.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="vision"
      className="scroll-mt-14 relative z-[55] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] min-h-[82vh] bg-[#1A1A1A] text-[#FFFFFF] overflow-hidden flex items-center py-28 lg:py-36 border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]"
    >
      <img
        ref={bgRef}
        src={about.visionImage || '/src/assets/images/african_tech_horizon_1795614347746.jpg'}
        alt="Architectural visualization of a modern African software and creative technology studio in Kampala"
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ transform: 'scale(1.1)' }}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/95 via-[#1A1A1A]/82 to-[#1A1A1A]/45"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 w-full">
        <div className="max-w-3xl space-y-8">
          <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#F5B800]">
            <span className="font-mono-tabular">07</span>
            <span aria-hidden="true">·</span>
            <span>Our Vision</span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold tracking-[-0.035em] text-white leading-[1.01] [text-wrap:balance]"
            style={{ fontSize: 'clamp(2.25rem, 4.5vw, 4rem)' }}
          >
            {about.visionHeadline}
          </motion.h2>

          <p className="text-lg sm:text-xl leading-relaxed text-[#F2EBDD]/90 max-w-2xl">
            {about.visionDescription}
          </p>

          <div className="pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            {about.visionPillars.map((pillar) => (
              <div key={pillar.title}>
                <p className="font-semibold text-[#F5B800]">{pillar.title}</p>
                <p className="mt-1 text-[#F2EBDD]/75">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
