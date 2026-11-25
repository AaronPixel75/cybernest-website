import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Globe, Pause, Play, UserRound } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import type { TeamMember } from '../../types/cms';
import { trackAnalyticsEvent } from '../../utils/analyticsClient';
import { wrapCarouselIndex } from '../../utils/navigationLogic';

const CRUISE_SPEED_PX_PER_SEC = 44;

export const TeamCarouselSection: React.FC = () => {
  const { content } = useSiteContent();
  const members = content.teamMembers;
  const total = members.length;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(!prefersReducedMotion);
  const [isHoveredOrFocused, setIsHoveredOrFocused] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstSetRef = useRef<HTMLDivElement | null>(null);

  const offsetRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const cardStepRef = useRef(394);
  const cardWidthRef = useRef(370);
  const speedScaleRef = useRef({ value: prefersReducedMotion ? 0 : 1 });
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const activeIdxRef = useRef(0);
  const manualTweenRef = useRef<gsap.core.Tween | null>(null);

  const updateActiveFromOffset = useCallback(
    (currentOffset: number) => {
      const vp = viewportRef.current;
      const step = cardStepRef.current;
      const cw = cardWidthRef.current;
      if (!vp || step <= 0) return;

      const vpCenter = vp.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let k = 0; k < total * 2; k++) {
        const cardCenter = currentOffset + k * step + cw / 2;
        const dist = Math.abs(cardCenter - vpCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = k % total;
        }
      }

      if (bestIdx !== activeIdxRef.current) {
        activeIdxRef.current = bestIdx;
        setActiveIdx(bestIdx);
      }
    },
    [total],
  );

  // Measure card & single-set dimensions cleanly on mount and resize
  useEffect(() => {
    const measure = () => {
      const setEl = firstSetRef.current;
      const vpEl = viewportRef.current;
      if (!setEl || !vpEl) return;

      const firstCard = setEl.querySelector('article') as HTMLElement | null;
      if (firstCard) {
        const styles = window.getComputedStyle(firstCard);
        const marginRight = parseFloat(styles.marginRight || '24') || 24;
        cardWidthRef.current = firstCard.offsetWidth;
        cardStepRef.current = firstCard.offsetWidth + marginRight;
      }

      const fullSetWidth = setEl.offsetWidth;
      if (fullSetWidth > 0) {
        singleSetWidthRef.current = fullSetWidth;
        // Center Slot 01 on initial mount if offset hasn't moved yet
        if (offsetRef.current === 0) {
          const centered = vpEl.clientWidth / 2 - cardWidthRef.current / 2;
          offsetRef.current = gsap.utils.wrap(-fullSetWidth, 0, centered);
          if (trackRef.current) {
            gsap.set(trackRef.current, { x: offsetRef.current });
          }
          updateActiveFromOffset(offsetRef.current);
        }
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (firstSetRef.current) ro.observe(firstSetRef.current);

    return () => ro.disconnect();
  }, [updateActiveFromOffset]);

  // Smoothly ramp GSAP velocity scale on hover, focus, drag, or manual toggle
  useEffect(() => {
    const shouldRun =
      autoPlayEnabled && !isHoveredOrFocused && !prefersReducedMotion;
    gsap.to(speedScaleRef.current, {
      value: shouldRun ? 1 : 0,
      duration: 0.65,
      ease: 'power2.out',
      overwrite: true,
    });
  }, [autoPlayEnabled, isHoveredOrFocused, prefersReducedMotion]);

  // GSAP Ticker: continuous, constant-velocity horizontal marquee loop
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const setX = gsap.quickSetter(track, 'x', 'px');

    const tick = (_time: number, deltaMs: number) => {
      const setW = singleSetWidthRef.current;
      if (setW <= 0 || isDraggingRef.current) return;

      const dt = Math.min(deltaMs, 50) / 1000;
      const scale = speedScaleRef.current.value;
      if (scale > 0.001) {
        offsetRef.current = gsap.utils.wrap(
          -setW,
          0,
          offsetRef.current - CRUISE_SPEED_PX_PER_SEC * scale * dt,
        );
        setX(offsetRef.current);
        updateActiveFromOffset(offsetRef.current);
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      manualTweenRef.current?.kill();
    };
  }, [updateActiveFromOffset]);

  const animateToOffset = (targetRawOffset: number) => {
    const track = trackRef.current;
    const setW = singleSetWidthRef.current;
    if (!track || setW <= 0) return;

    manualTweenRef.current?.kill();
    const proxy = { x: offsetRef.current };
    const setX = gsap.quickSetter(track, 'x', 'px');

    manualTweenRef.current = gsap.to(proxy, {
      x: targetRawOffset,
      duration: 0.72,
      ease: 'power3.out',
      onUpdate: () => {
        offsetRef.current = gsap.utils.wrap(-setW, 0, proxy.x);
        setX(offsetRef.current);
        updateActiveFromOffset(offsetRef.current);
      },
    });
  };

  const goDelta = (delta: number) => {
    if (total <= 0) return;
    const step = cardStepRef.current;
    const nextIdx = wrapCarouselIndex(activeIdxRef.current, delta, total);
    activeIdxRef.current = nextIdx;
    setActiveIdx(nextIdx);
    animateToOffset(offsetRef.current - delta * step);
    trackAnalyticsEvent(
      'team_interact',
      delta > 0 ? 'Next Team Member' : 'Previous Team Member',
    );
  };

  const goToIndex = (targetIdx: number) => {
    const vp = viewportRef.current;
    const setW = singleSetWidthRef.current;
    const step = cardStepRef.current;
    const cw = cardWidthRef.current;
    if (!vp || setW <= 0 || total <= 0) return;

    const desiredWrapped = gsap.utils.wrap(
      -setW,
      0,
      vp.clientWidth / 2 - (targetIdx * step + cw / 2),
    );

    let diff = desiredWrapped - offsetRef.current;
    if (diff > setW / 2) diff -= setW;
    if (diff < -setW / 2) diff += setW;

    activeIdxRef.current = targetIdx;
    setActiveIdx(targetIdx);
    animateToOffset(offsetRef.current + diff);
    const chosen = members[targetIdx];
    if (chosen) {
      trackAnalyticsEvent('team_interact', `Select Profile: ${chosen.name}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goDelta(1);
    if (e.key === 'ArrowLeft') goDelta(-1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    manualTweenRef.current?.kill();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    setIsHoveredOrFocused(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const setW = singleSetWidthRef.current;
    if (setW <= 0) return;
    const dx = e.clientX - dragStartXRef.current;
    offsetRef.current = gsap.utils.wrap(-setW, 0, dragStartOffsetRef.current + dx);
    gsap.set(trackRef.current, { x: offsetRef.current });
    updateActiveFromOffset(offsetRef.current);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsHoveredOrFocused(false);
  };

  if (total === 0) return null;
  const safeActiveIdx = Math.min(activeIdx, Math.max(0, total - 1));
  const activeMember = members[safeActiveIdx] ?? members[0];

  const renderCard = (
    member: TeamMember,
    idx: number,
    keyPrefix: string,
    isDuplicate: boolean,
  ) => {
    const isCentered = idx === safeActiveIdx;
    const socialEntries = Object.entries(member.socialLinks || {}).filter(
      ([, url]) => typeof url === 'string' && url.trim().length > 0,
    );

    return (
      <article
        key={`${keyPrefix}-${member.id}`}
        onClick={() => goToIndex(idx)}
        aria-hidden={isDuplicate}
        className={`group relative w-[310px] sm:w-[370px] mr-6 shrink-0 rounded-xl overflow-hidden bg-[#16131A] text-[#F2EBDD] border transition-[border-color,box-shadow,transform] duration-500 cursor-pointer hover:-translate-y-1.5 hover:border-[#F5B800] ${
          isCentered
            ? 'border-[#F5B800]/65 shadow-[0_28px_70px_rgba(20,17,24,0.28)]'
            : 'border-white/15 shadow-[0_18px_45px_rgba(20,17,24,0.18)]'
        }`}
      >
        {/* Luxury Obsidian & Studio Portrait Plate */}
        <div
          className="relative h-[265px] sm:h-[285px] p-6 flex flex-col justify-between border-b border-[#F5B800]/20 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(76, 19, 142, 0.44), rgba(22, 19, 26, 0.98) 76%)',
          }}
        >
          {member.photoUrl ? (
            <>
              <img
                src={member.photoUrl}
                alt={member.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#16131A] via-[#16131A]/25 to-[#16131A]/55"
              />
            </>
          ) : null}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t border-l border-[#F5B800]/45 z-10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t border-r border-[#F5B800]/45 z-10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#F5B800]/45 z-10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#F5B800]/45 z-10"
          />

          <div className="relative z-10 flex items-center justify-between text-[11px] tracking-widest uppercase">
            <span className="font-mono-tabular text-[#F5B800] font-semibold">
              CN · {member.slotIndex}
            </span>
            <span className="text-[#F2EBDD]/70">
              {member.photoUrl ? member.discipline : 'Portrait Pending'}
            </span>
          </div>

          {!member.photoUrl ? (
            <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full border border-[#F5B800]/40 p-2 transition-transform duration-500 group-hover:scale-105">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center border border-white/20 shadow-[inset_0_0_24px_rgba(0,0,0,0.45)]"
                  style={{
                    background: `linear-gradient(145deg, ${member.accentHex}, #141118)`,
                  }}
                >
                  <UserRound
                    className="w-11 h-11 text-[#F2EBDD]/95"
                    strokeWidth={1.35}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <span className="mt-4 font-mono-tabular text-[11px] uppercase tracking-[0.22em] text-[#F5B800]/90">
                {member.discipline}
              </span>
            </div>
          ) : (
            <div className="relative z-10 mt-auto">
              <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#F5B800]">
                {member.discipline}
              </span>
            </div>
          )}

          <div className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-[#F5B800]/35 to-transparent" />
        </div>

        {/* Luxury Matte Obsidian Editorial Nameplate */}
        <div className="p-6 sm:p-7 space-y-3 bg-[#1A161F]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5B800]">
              {member.roleTitle}
            </p>
            <h3 className="mt-1.5 font-display text-lg sm:text-xl font-bold tracking-tight text-white">
              {member.name}
            </h3>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-[#F2EBDD]/75 line-clamp-3">
            {member.bio}
          </p>

          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            {socialEntries.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={isDuplicate ? -1 : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[#F2EBDD]/85 font-medium hover:text-[#F5B800] transition-colors capitalize"
                  >
                    <Globe className="w-3 h-3 text-[#F5B800]" aria-hidden="true" />
                    <span>{platform === 'website' ? 'Profile' : platform}</span>
                  </a>
                ))}
              </div>
            ) : (
              <span className="text-[#F2EBDD]/45">Studio Roster</span>
            )}
            <span className="font-mono-tabular text-[11px] text-[#F5B800]/75">
              Kampala · UG
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      id="team"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHoveredOrFocused(true)}
      onMouseLeave={() => setIsHoveredOrFocused(false)}
      onFocus={() => setIsHoveredOrFocused(true)}
      onBlur={() => setIsHoveredOrFocused(false)}
      aria-roledescription="carousel"
      aria-label="CyberNest team profiles continuous horizontal carousel"
      className="scroll-mt-14 relative z-50 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#FFFFFF] text-[#1A1A1A] pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.12)] overflow-x-clip focus:outline-none"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header & Luxury Stream Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1A1A1A]/15 pb-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
              <span className="font-mono-tabular">06</span>
              <span aria-hidden="true">·</span>
              <span>The Studio Collective</span>
            </div>
            <h2
              className="font-display font-extrabold tracking-[-0.035em] text-[#1A1A1A] leading-[1.01] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 3.9vw, 3.35rem)' }}
            >
              THE MINDS BEHIND THE MACHINE.
            </h2>
            <p className="text-sm text-[#1A1A1A]/70 max-w-xl">
              Editable placeholder profile directory ready for verified team portraits,
              approved biographies, and official role titles. Continuous smooth motion; hover
              to pause or drag anytime.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setAutoPlayEnabled((prev) => !prev)}
              aria-label={
                autoPlayEnabled
                  ? 'Pause automatic horizontal scroll'
                  : 'Resume automatic horizontal scroll'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#1A1A1A]/20 text-[#1A1A1A]/75 hover:border-[#4C138E] hover:text-[#4C138E] transition-colors cursor-pointer"
            >
              {autoPlayEnabled ? (
                <>
                  <Pause className="w-3 h-3" aria-hidden="true" />
                  <span>Auto</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" aria-hidden="true" />
                  <span>Paused</span>
                </>
              )}
            </button>

            <span className="font-mono-tabular text-xs text-[#1A1A1A]/65 mx-1">
              0{safeActiveIdx + 1} / 0{total}
            </span>

            <button
              type="button"
              onClick={() => goDelta(-1)}
              aria-label="Previous team profile"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1A1A1A]/25 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:scale-105 transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goDelta(1)}
              aria-label="Next team profile"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#4C138E] hover:border-[#4C138E] hover:scale-105 transition-all duration-150 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-Bleed GSAP Seamless Horizontal Stream Viewport */}
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full overflow-hidden py-6 select-none touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {/* Subtle Edge Gallery Fades */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 lg:w-32 bg-gradient-to-r from-[#FFFFFF] to-transparent z-20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 lg:w-32 bg-gradient-to-l from-[#FFFFFF] to-transparent z-20"
        />

        {/* Dual Seamless Track for Infinite GSAP Loop */}
        <div ref={trackRef} className="flex w-max items-stretch will-change-transform">
          <div ref={firstSetRef} className="flex items-stretch shrink-0">
            {members.map((member, idx) =>
              renderCard(member, idx, 'primary', false),
            )}
          </div>
          <div className="flex items-stretch shrink-0" aria-hidden="true">
            {members.map((member, idx) =>
              renderCard(member, idx, 'clone', true),
            )}
          </div>
        </div>
      </div>

      {/* Active Slot Bar & Dot Controls */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#1A1A1A]/12 pt-6">
          <div className="flex items-center gap-2">
            {members.map((slot, idx) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => goToIndex(idx)}
                aria-label={`Select profile ${idx + 1}`}
                className={`h-2 transition-all cursor-pointer ${
                  idx === safeActiveIdx
                    ? 'w-10 bg-[#4C138E]'
                    : 'w-4 bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-[#1A1A1A]/65">
            Active Slot: <strong className="text-[#1A1A1A]">{activeMember.roleTitle}</strong>
          </p>
        </div>
      </div>
    </section>
  );
};
