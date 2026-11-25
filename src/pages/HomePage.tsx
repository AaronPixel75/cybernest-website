import React, { useMemo } from 'react';
import { ArrowUpRight, Code2, GraduationCap, Quote, Vote, WifiOff } from 'lucide-react';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { HeroSection } from '../components/sections/HeroSection';
import { IntroSection } from '../components/sections/IntroSection';
import { ScrollytellingSection } from '../components/sections/ScrollytellingSection';
import { TeamCarouselSection } from '../components/sections/TeamCarouselSection';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { slugifyText } from '../utils/navigationLogic';

interface HomePageProps {
  onNavigatePath: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigatePath }) => {
  const { content } = useSiteContent();
  const { homepage, products, projects, testimonials } = content;
  const vis = homepage.sectionVisibility;

  const voxlan = products.find((p) => p.id === 'voxlan') ?? products[0];
  const scholar = products.find((p) => p.id === 'cybernest-scholar') ?? products[1];

  const featuredProjects = useMemo(() => {
    const ids = homepage.featuredProjectIds || [];
    const byPriority = [...projects].sort((a, b) => {
      const ia = ids.indexOf(a.id);
      const ib = ids.indexOf(b.id);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
    return byPriority.slice(0, 3);
  }, [projects, homepage.featuredProjectIds]);

  const featuredTestimonials = useMemo(() => {
    const selectedIds = homepage.featuredTestimonialIds || [];
    const prioritized = [...testimonials].sort((a, b) => {
      const ia = selectedIds.indexOf(a.id);
      const ib = selectedIds.indexOf(b.id);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
    return prioritized.slice(0, 3);
  }, [testimonials, homepage.featuredTestimonialIds]);

  const primaryQuote = featuredTestimonials[0];
  const secondaryQuotes = featuredTestimonials.slice(1, 3);

  const handleLink = (e: React.MouseEvent, path: string, trackLabel?: string) => {
    e.preventDefault();
    if (trackLabel) {
      trackAnalyticsEvent('button_click', trackLabel);
    }
    onNavigatePath(path);
  };

  return (
    <>
      <HeroSection
        onExploreProducts={() => onNavigatePath('/products/voxlan')}
        onStartProject={() => onNavigatePath('/contact')}
        onNavigatePath={onNavigatePath}
      />

      {vis.intro && <IntroSection teaserMode onNavigatePath={onNavigatePath} />}

      {/* 03. Concise Overview of CyberNest's Three Core Offerings */}
      {vis.offerings && (
        <section
          id="what-we-do"
          className="scroll-mt-14 relative z-20 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#FFFFFF] text-[#1A1A1A] pt-24 pb-28 lg:pt-32 lg:pb-32 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.12)]"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[#1A1A1A]/15 pb-8">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
                  <span className="font-mono-tabular">03</span>
                  <span aria-hidden="true">·</span>
                  <span>What We Do</span>
                </div>
                <h2
                  className="font-display font-bold tracking-tight text-[#1A1A1A] leading-[1.04] [text-wrap:balance]"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.2rem)' }}
                >
                  Three pillars. Built to solve and built to teach.
                </h2>
              </div>
              <div className="lg:col-span-5 lg:text-right">
                <p className="text-base text-[#1A1A1A]/75 max-w-md lg:ml-auto">
                  Explore how our software applications, offline campus voting platform, and
                  practical training tracks fit together.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="/solutions"
                onClick={(e) => handleLink(e, '/solutions', 'Home Offering: Software Development')}
                className="group bg-[#F2EBDD]/65 border border-[#1A1A1A]/12 p-7 flex flex-col justify-between space-y-6 hover:border-[#4C138E] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#4C138E]">
                    <span className="font-mono-tabular">01 · SOLUTIONS</span>
                    <Code2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#1A1A1A]">
                    Software Development
                  </h3>
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                    Bespoke institutional software, academic reporting with CyberNest Scholar,
                    and offline-resilient web and desktop systems.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4C138E] group-hover:text-[#1A1A1A]">
                  <span>Explore Solutions</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </a>

              <a
                href="/products/voxlan"
                onClick={(e) => handleLink(e, '/products/voxlan', 'Home Offering: VOXLAN')}
                className="group bg-[#1A1A1A] text-[#F2EBDD] border border-[#1A1A1A] p-7 flex flex-col justify-between space-y-6 hover:border-[#F5B800] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#F5B800]">
                    <span className="font-mono-tabular">02 · FLAGSHIP PRODUCT</span>
                    <Vote className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                    VOXLAN Voting
                  </h3>
                  <p className="text-sm leading-relaxed text-[#F2EBDD]/80">
                    Offline electronic voting built for schools. Unique voter IDs,
                    duplicate-vote lockouts, candidate manifestos, and instant results over LAN.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F5B800] group-hover:text-white">
                  <span>Explore VOXLAN</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </a>

              <a
                href="/academy"
                onClick={(e) => handleLink(e, '/academy', 'Home Offering: Academy')}
                className="group bg-[#F2EBDD]/65 border border-[#1A1A1A]/12 p-7 flex flex-col justify-between space-y-6 hover:border-[#8D5B38] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8D5B38]">
                    <span className="font-mono-tabular">03 · ACADEMY</span>
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#1A1A1A]">
                    Programming Lessons
                  </h3>
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                    Practical, project-based training in Python Programming, modern Web
                    Development, and applied Artificial Intelligence.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8D5B38] group-hover:text-[#1A1A1A]">
                  <span>View Training Tracks</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 04. Featured Products Teaser */}
      {vis.products && voxlan && (
        <section
          id="products"
          className="scroll-mt-14 relative z-30 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#1A1A1A] text-[#F2EBDD] pt-24 pb-28 lg:pt-32 lg:pb-32 border-t border-white/12 shadow-[0_-20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/12 pb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#F5B800]">
                  <span className="font-mono-tabular">04</span>
                  <span aria-hidden="true">·</span>
                  <span>Featured Products</span>
                </div>
                <h2
                  className="font-display font-bold tracking-tight text-white leading-[1.04] [text-wrap:balance]"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.2rem)' }}
                >
                  Software engineered in Uganda.
                </h2>
              </div>

              <a
                href="/products"
                onClick={(e) => handleLink(e, '/products', 'Home: View All Products')}
                className="inline-flex items-center gap-2 border border-white/25 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors whitespace-nowrap self-start lg:self-auto"
              >
                <span>All CyberNest Products</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 bg-[#231E29] border border-white/15 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#F5B800]">
                      <span>Flagship Product</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Zero-Internet LAN</span>
                      </span>
                    </div>
                    <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                      {voxlan.name}
                    </h3>
                    <p className="text-sm text-[#F2EBDD]/85 leading-relaxed">
                      {voxlan.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={`/products/${slugifyText(voxlan.id || voxlan.name)}`}
                      onClick={(e) =>
                        handleLink(
                          e,
                          `/products/${slugifyText(voxlan.id || voxlan.name)}`,
                          'Home: Explore VOXLAN Page',
                        )
                      }
                      className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-white transition-colors"
                    >
                      <span>Explore VOXLAN & Try Demo</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {voxlan.imagePath && (
                  <div className="md:col-span-5 min-h-[220px] bg-[#141118]">
                    <img
                      src={voxlan.imagePath}
                      alt={voxlan.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {scholar && (
                <div className="lg:col-span-5 bg-[#F2EBDD] text-[#1A1A1A] border border-[#1A1A1A]/15 p-7 sm:p-9 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                      {scholar.category}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">
                      {scholar.name}
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/80 leading-relaxed">
                      {scholar.tagline}
                    </p>
                  </div>

                  <a
                    href={`/products/${slugifyText(scholar.id || scholar.name)}`}
                    onClick={(e) =>
                      handleLink(
                        e,
                        `/products/${slugifyText(scholar.id || scholar.name)}`,
                        `Home: Explore ${scholar.name}`,
                      )
                    }
                    className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#4C138E] transition-colors self-start"
                  >
                    <span>Explore {scholar.name}</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 05. Selected Projects Preview -> /work */}
      {vis.projects !== false && featuredProjects.length > 0 && (
        <section
          id="selected-work"
          className="scroll-mt-14 relative z-[35] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#FFFFFF] text-[#1A1A1A] pt-24 pb-28 lg:pt-32 lg:pb-32 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.12)]"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1A1A1A]/15 pb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
                  <span className="font-mono-tabular">05</span>
                  <span aria-hidden="true">·</span>
                  <span>Selected Work</span>
                </div>
                <h2
                  className="font-display font-bold tracking-tight text-[#1A1A1A] leading-[1.04] [text-wrap:balance]"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.2rem)' }}
                >
                  Systems shipped. Real workflows transformed.
                </h2>
              </div>

              <a
                href="/work"
                onClick={(e) => handleLink(e, '/work', 'Home: View All Projects')}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#4C138E] transition-colors whitespace-nowrap self-start lg:self-auto"
              >
                <span>View All Projects</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((proj) => (
                <a
                  key={proj.id}
                  href={`/work/${proj.slug}`}
                  onClick={(e) =>
                    handleLink(e, `/work/${proj.slug}`, `Home Featured Project: ${proj.title}`)
                  }
                  className="group bg-[#F2EBDD]/55 border border-[#1A1A1A]/15 flex flex-col justify-between overflow-hidden hover:border-[#4C138E] transition-colors"
                >
                  <div>
                    <div className="h-52 bg-[#141118] overflow-hidden border-b border-[#1A1A1A]/12">
                      {proj.thumbnailUrl && (
                        <img
                          src={proj.thumbnailUrl}
                          alt={proj.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-6 space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4C138E]">
                        {proj.category}
                      </p>
                      <h3 className="font-display text-xl font-bold tracking-tight text-[#1A1A1A] group-hover:text-[#4C138E] transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#1A1A1A]/75 line-clamp-3">
                        {proj.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-semibold text-[#8D5B38]">
                    <span className="truncate">{proj.technologies.slice(0, 3).join(' · ')}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0 text-[#4C138E]" aria-hidden="true" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 06. Interactive Chronicle (Selective Scrollytelling) */}
      {vis.scrollytelling && <ScrollytellingSection />}

      {/* 07. Studio Collective Team Preview */}
      {vis.team && <TeamCarouselSection />}

      {/* 08. Featured Testimonials Teaser */}
      {vis.testimonials && primaryQuote && (
        <section className="relative z-[57] -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-24 pb-28 lg:pt-32 lg:pb-32 border-t border-[#1A1A1A]/10 shadow-[0_-20px_60px_rgba(0,0,0,0.2)]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1A1A1A]/15 pb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#4C138E]">
                  <span className="font-mono-tabular">08</span>
                  <span aria-hidden="true">·</span>
                  <span>Voices & Feedback</span>
                </div>
                <h2
                  className="font-display font-extrabold tracking-[-0.035em] text-[#1A1A1A] leading-[1.02] [text-wrap:balance]"
                  style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)' }}
                >
                  TRUST BUILT THROUGH WHAT WE CREATE.
                </h2>
              </div>

              <a
                href="/testimonials"
                onClick={(e) => handleLink(e, '/testimonials', 'Home: Read All Testimonials')}
                className="inline-flex items-center gap-2 border border-[#1A1A1A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors whitespace-nowrap self-start lg:self-auto"
              >
                <span>Read All Testimonials</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <article className="lg:col-span-7 bg-[#1A1A1A] text-[#F2EBDD] border border-[#1A1A1A] p-8 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-[#F5B800] font-semibold">
                    <span>{primaryQuote.categoryLabel}</span>
                    <Quote className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <blockquote className="font-display text-xl sm:text-2xl font-medium leading-snug text-white">
                    “{primaryQuote.quote}”
                  </blockquote>
                </div>
                <div className="pt-5 border-t border-white/12 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-white text-sm">{primaryQuote.authorName}</p>
                    <p className="text-[#F2EBDD]/70">
                      {primaryQuote.authorRole} · {primaryQuote.institutionOrTrack}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-[#F5B800]">
                    {primaryQuote.outcomeNote}
                  </span>
                </div>
              </article>

              <div className="lg:col-span-5 grid grid-cols-1 gap-4">
                {secondaryQuotes.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4C138E]">
                        {item.categoryLabel}
                      </p>
                      <blockquote className="text-sm leading-relaxed text-[#1A1A1A]/85">
                        “{item.quote}”
                      </blockquote>
                    </div>
                    <div className="pt-3 border-t border-[#1A1A1A]/10 text-xs">
                      <p className="font-bold text-[#1A1A1A]">{item.authorName}</p>
                      <p className="text-[#1A1A1A]/65">
                        {item.authorRole} · {item.institutionOrTrack}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 09. Strong Closing Call to Action -> /contact */}
      <ClosingCtaSection onNavigatePath={onNavigatePath} />
    </>
  );
};
