import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Users,
  WifiOff,
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ClosingCtaSection } from '../components/ClosingCtaSection';
import { useSiteContent } from '../context/SiteContentContext';
import { trackAnalyticsEvent } from '../utils/analyticsClient';
import { BreadcrumbItem, slugifyText } from '../utils/navigationLogic';
import {
  castVoxlanBallot,
  computeVoxlanAnalytics,
  createInitialVoxlanState,
  verifyVoterId,
} from '../utils/voxlanLogic';

interface ProductDetailPageProps {
  slug: string;
  breadcrumbs: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
}

const SCHOLAR_TERMS = [
  {
    term: 'Term 01',
    cohortAverage: '71.4%',
    attendanceRate: '94.2%',
    topInsight: 'STEM practical labs improved average science retention across Senior 3.',
    subjects: [
      { name: 'Mathematics', score: 74, delta: '+3.2%' },
      { name: 'Physics', score: 69, delta: '+4.8%' },
      { name: 'Computer Studies', score: 86, delta: '+6.1%' },
    ],
  },
  {
    term: 'Term 02',
    cohortAverage: '74.9%',
    attendanceRate: '95.6%',
    topInsight: 'Early diagnostic alerts helped teachers support learners prior to mid-term exams.',
    subjects: [
      { name: 'Mathematics', score: 78, delta: '+4.0%' },
      { name: 'Physics', score: 73, delta: '+4.0%' },
      { name: 'Computer Studies', score: 89, delta: '+3.0%' },
    ],
  },
  {
    term: 'Term 03',
    cohortAverage: '78.2%',
    attendanceRate: '96.1%',
    topInsight: 'Automated report cards cut faculty grading turnaround dramatically.',
    subjects: [
      { name: 'Mathematics', score: 81, delta: '+3.0%' },
      { name: 'Physics', score: 77, delta: '+4.0%' },
      { name: 'Computer Studies', score: 92, delta: '+3.0%' },
    ],
  },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  breadcrumbs,
  onNavigatePath,
}) => {
  const { content } = useSiteContent();
  const product = content.products.find(
    (p) => p.id === slug || slugifyText(p.id || p.name) === slug || slugifyText(p.name) === slug,
  );

  // Interactive VOXLAN Booth State
  const [election, setElection] = useState(createInitialVoxlanState);
  const [voxlanTab, setVoxlanTab] = useState<'vote' | 'analytics' | 'candidates'>('vote');
  const [voterIdInput, setVoterIdInput] = useState('UG-SCH-042');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-a');
  const [voteFeedback, setVoteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Interactive Scholar Term State
  const [scholarTermIdx, setScholarTermIdx] = useState(1);

  const analytics = useMemo(() => computeVoxlanAnalytics(election), [election]);
  const voterCheck = useMemo(
    () => verifyVoterId(election, voterIdInput),
    [election, voterIdInput],
  );
  const activeTerm = SCHOLAR_TERMS[scholarTermIdx];

  if (!product) {
    return (
      <section className="min-h-[70vh] bg-[#1A1A1A] text-[#F2EBDD] pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />
          <h1 className="font-display text-3xl font-bold text-white">Product Not Found</h1>
          <p className="text-sm text-[#F2EBDD]/75">
            The requested CyberNest product could not be located.
          </p>
          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePath('/products');
            }}
            className="inline-flex items-center gap-2 bg-[#F5B800] px-5 py-3 text-xs font-bold text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to All Products</span>
          </a>
        </div>
      </section>
    );
  }

  const isVoxlan = product.id === 'voxlan' || slug === 'voxlan';
  const isScholar = product.id === 'cybernest-scholar' || slug === 'cybernest-scholar';
  const relatedProject = content.projects.find((pr) => pr.relatedProductId === product.id);
  const otherProducts = content.products.filter((p) => p.id !== product.id);

  const handleCastBallot = (e: React.FormEvent) => {
    e.preventDefault();
    const result = castVoxlanBallot(election, voterIdInput, selectedCandidateId);
    if (!result.ok) {
      setVoteFeedback({
        type: 'error',
        message: result.error ?? 'Unable to record ballot.',
      });
      return;
    }
    setElection(result.nextState);
    const chosen = result.nextState.candidates.find((c) => c.id === selectedCandidateId);
    setVoteFeedback({
      type: 'success',
      message: `Encrypted offline ballot recorded for ${chosen?.name ?? 'candidate'}. Live tally updated.`,
    });
  };

  return (
    <>
      <section className="bg-[#1A1A1A] text-[#F2EBDD] pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-10">
          <Breadcrumbs items={breadcrumbs} onNavigatePath={onNavigatePath} variant="dark" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#F5B800]">
                {product.isFlagship && <span>Flagship Product</span>}
                {product.isFlagship && <span aria-hidden="true">·</span>}
                <span>{product.category}</span>
                {isVoxlan && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>100% Offline LAN</span>
                    </span>
                  </>
                )}
              </div>

              <h1
                className="font-display font-extrabold tracking-[-0.035em] text-white leading-[0.98]"
                style={{ fontSize: 'clamp(2.4rem, 4.8vw, 4.25rem)' }}
              >
                {product.name}
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed text-[#F2EBDD]/90">
                {product.tagline}
              </p>

              <p className="text-sm sm:text-base leading-relaxed text-[#F2EBDD]/75">
                {product.summary}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    trackAnalyticsEvent('contact_click', `Product Demo: ${product.name}`);
                    onNavigatePath('/contact');
                  }}
                  className="inline-flex items-center gap-2 bg-[#F5B800] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-white transition-colors"
                >
                  <span>Request School / Organization Demo</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>

                {relatedProject && (
                  <a
                    href={`/work/${relatedProject.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath(`/work/${relatedProject.slug}`);
                    }}
                    className="inline-flex items-center gap-2 border border-white/25 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#F5B800] hover:text-[#F5B800] transition-colors"
                  >
                    <span>Read Case Study</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {product.imagePath && (
              <div className="lg:col-span-5 border border-white/15 bg-[#141118] overflow-hidden aspect-[4/3]">
                <img
                  src={product.imagePath}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem Solved, Capabilities & Architecture */}
      <section className="relative z-10 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#F2EBDD] text-[#1A1A1A] paper-grain pt-20 pb-24 border-t border-[#1A1A1A]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                  Problem Solved
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-[#1A1A1A]/85">
                  {product.problemSolved}
                </p>
              </div>
              {product.architectureNote && (
                <div className="pt-4 border-t border-[#1A1A1A]/12 space-y-2">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                    <Cpu className="w-4 h-4" aria-hidden="true" />
                    <span>Architecture</span>
                  </p>
                  <p className="text-xs leading-relaxed text-[#1A1A1A]/75">
                    {product.architectureNote}
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                Key Capabilities
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-3 p-4 bg-[#F2EBDD]/55 border border-[#1A1A1A]/10"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-[#1A1A1A]/90 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive VOXLAN Booth Simulator */}
          {isVoxlan && (
            <div id="simulator" className="bg-[#16131A] text-[#F2EBDD] border border-[#1A1A1A] p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 pb-5 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
                    Interactive Product Simulator · Offline Campus LAN Preview
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    {election.electionTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1 bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setVoxlanTab('vote')}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      voxlanTab === 'vote'
                        ? 'bg-[#4C138E] text-white'
                        : 'text-[#F2EBDD]/75 hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Voter Booth</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoxlanTab('analytics')}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      voxlanTab === 'analytics'
                        ? 'bg-[#4C138E] text-white'
                        : 'text-[#F2EBDD]/75 hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Live Results ({analytics.totalVotes})</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoxlanTab('candidates')}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      voxlanTab === 'candidates'
                        ? 'bg-[#4C138E] text-white'
                        : 'text-[#F2EBDD]/75 hover:text-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Candidates</span>
                    </span>
                  </button>
                </div>
              </div>

              {voxlanTab === 'vote' && (
                <form
                  onSubmit={handleCastBallot}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <label
                      htmlFor="detail-voxlan-voter-id"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
                    >
                      1. Unique Voter Identification
                    </label>
                    <input
                      id="detail-voxlan-voter-id"
                      type="text"
                      value={voterIdInput}
                      onChange={(e) => {
                        setVoterIdInput(e.target.value);
                        setVoteFeedback(null);
                      }}
                      placeholder="e.g. UG-SCH-042"
                      className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm font-mono-tabular text-white focus:outline-none focus:border-[#F5B800]"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#F2EBDD]/65">
                      <span>Demo eligible IDs:</span>
                      {['UG-SCH-042', 'UG-SCH-104', 'UG-SCH-118'].map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setVoterIdInput(id);
                            setVoteFeedback(null);
                          }}
                          className="font-mono-tabular underline hover:text-[#F5B800] cursor-pointer"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        voterCheck.valid ? 'text-[#F5B800]' : 'text-amber-300'
                      }`}
                    >
                      {voterCheck.valid
                        ? `Verified eligible on local LAN roll (${voterCheck.normalizedId}).`
                        : voterCheck.reason}
                    </p>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80">
                      2. Select Candidate & Cast Offline Ballot
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {election.candidates.map((cand) => {
                        const isSelected = selectedCandidateId === cand.id;
                        return (
                          <button
                            key={cand.id}
                            type="button"
                            onClick={() => setSelectedCandidateId(cand.id)}
                            className={`text-left p-4 border transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#F5B800] bg-[#4C138E]/40'
                                : 'border-white/15 bg-[#1A1A1A] hover:border-white/35'
                            }`}
                          >
                            <p className="font-mono-tabular text-xs text-[#F5B800]">{cand.house}</p>
                            <p className="mt-1 font-display text-base font-bold text-white">
                              {cand.name}
                            </p>
                            <p className="mt-1.5 text-xs text-[#F2EBDD]/70 line-clamp-2">
                              {cand.manifesto}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <button
                        type="submit"
                        className="bg-[#F5B800] px-6 py-3 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
                      >
                        Cast Offline Ballot
                      </button>

                      {voteFeedback && (
                        <p
                          role="status"
                          className={`text-xs font-medium ${
                            voteFeedback.type === 'success' ? 'text-[#F5B800]' : 'text-rose-300'
                          }`}
                        >
                          {voteFeedback.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {voxlanTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#F2EBDD]/75">
                    <span>
                      Total Verified Ballots:{' '}
                      <strong className="font-mono-tabular text-white">
                        {analytics.totalVotes}
                      </strong>
                    </span>
                    <span>
                      Demo Roll Turnout:{' '}
                      <strong className="font-mono-tabular text-[#F5B800]">
                        {analytics.demoVotedCount} / {analytics.demoRollCount}
                      </strong>
                    </span>
                  </div>

                  <div className="space-y-3">
                    {analytics.breakdown.map((cand) => (
                      <div
                        key={cand.id}
                        className="bg-[#1A1A1A] border border-white/10 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white">
                            {cand.name} ·{' '}
                            <span className="text-xs text-[#F2EBDD]/65">{cand.house}</span>
                          </span>
                          <span className="font-mono-tabular text-[#F5B800] font-semibold">
                            {cand.votes} votes ({cand.sharePct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${cand.sharePct}%`,
                              backgroundColor: cand.accent,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {voxlanTab === 'candidates' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {election.candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="bg-[#1A1A1A] border border-white/12 p-5 space-y-2"
                    >
                      <p className="font-mono-tabular text-xs text-[#F5B800]">{cand.house}</p>
                      <h3 className="font-display text-lg font-bold text-white">{cand.name}</h3>
                      <p className="text-sm text-[#F2EBDD]/75 leading-relaxed">{cand.manifesto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive CyberNest Scholar Term Simulator */}
          {isScholar && (
            <div className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-7 sm:p-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/12 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8D5B38]">
                  Academic Reporting Preview
                </span>
                <div className="flex gap-1 bg-[#F2EBDD] p-1">
                  {SCHOLAR_TERMS.map((t, idx) => (
                    <button
                      key={t.term}
                      type="button"
                      onClick={() => setScholarTermIdx(idx)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        scholarTermIdx === idx
                          ? 'bg-[#4C138E] text-white'
                          : 'text-[#1A1A1A]/75 hover:text-[#1A1A1A]'
                      }`}
                    >
                      {t.term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F2EBDD]/60 border border-[#1A1A1A]/10">
                  <p className="text-xs text-[#1A1A1A]/65">Cohort Mean</p>
                  <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#4C138E]">
                    {activeTerm.cohortAverage}
                  </p>
                </div>
                <div className="p-4 bg-[#F2EBDD]/60 border border-[#1A1A1A]/10">
                  <p className="text-xs text-[#1A1A1A]/65">Attendance Consistency</p>
                  <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#1A1A1A]">
                    {activeTerm.attendanceRate}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {activeTerm.subjects.map((sub) => (
                  <div
                    key={sub.name}
                    className="flex items-center justify-between py-2.5 border-b border-[#1A1A1A]/10 text-sm"
                  >
                    <span className="font-medium">{sub.name}</span>
                    <div className="flex items-center gap-4 font-mono-tabular">
                      <span className="text-xs text-[#8D5B38]">{sub.delta}</span>
                      <span className="font-bold">{sub.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#1A1A1A]/75">{activeTerm.topInsight}</p>
            </div>
          )}

          {/* Other CyberNest Products */}
          {otherProducts.length > 0 && (
            <div className="pt-6 border-t border-[#1A1A1A]/15 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4C138E]">
                More CyberNest Products
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherProducts.map((other) => (
                  <a
                    key={other.id}
                    href={`/products/${slugifyText(other.id || other.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath(`/products/${slugifyText(other.id || other.name)}`);
                    }}
                    className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-6 flex items-center justify-between gap-4 hover:border-[#4C138E] transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#8D5B38]">{other.category}</p>
                      <h3 className="font-display text-xl font-bold text-[#1A1A1A]">
                        {other.name}
                      </h3>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-[#4C138E] shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <ClosingCtaSection
        headline={`INTERESTED IN DEPLOYING ${product.name.toUpperCase()}?`}
        primaryLabel="Request Consultation"
        primaryPath="/contact"
        secondaryLabel="Back to All Products"
        secondaryPath="/products"
        onNavigatePath={onNavigatePath}
      />
    </>
  );
};
