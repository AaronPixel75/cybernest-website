import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ShieldCheck, BarChart3, Users, WifiOff } from 'lucide-react';
import { INITIAL_PRODUCTS, ProductItem } from '../../data/content';
import { trackAnalyticsEvent } from '../../utils/analyticsClient';
import {
  castVoxlanBallot,
  computeVoxlanAnalytics,
  createInitialVoxlanState,
  verifyVoterId,
} from '../../utils/voxlanLogic';

interface ProductsSectionProps {
  products?: ProductItem[];
  onExploreProduct: (product: ProductItem) => void;
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
    topInsight: 'Early diagnostic alerts helped teachers support 18 learners prior to mid-term exams.',
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
    topInsight: 'Unified automated report cards reduced faculty grading turnaround from 9 days to 1 day.',
    subjects: [
      { name: 'Mathematics', score: 81, delta: '+3.0%' },
      { name: 'Physics', score: 77, delta: '+4.0%' },
      { name: 'Computer Studies', score: 92, delta: '+3.0%' },
    ],
  },
];

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products = INITIAL_PRODUCTS,
  onExploreProduct,
}) => {
  const voxlan = products.find((p) => p.id === 'voxlan') ?? products[0];
  const scholar = products.find((p) => p.id === 'cybernest-scholar') ?? products[1];
  const additionalProducts = products.filter(
    (p) => p.id !== 'voxlan' && p.id !== 'cybernest-scholar',
  );

  // Interactive VOXLAN Booth Simulator State
  const [election, setElection] = useState(createInitialVoxlanState);
  const [voxlanTab, setVoxlanTab] = useState<'vote' | 'analytics' | 'candidates'>('vote');
  const [voterIdInput, setVoterIdInput] = useState('UG-SCH-042');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-a');
  const [voteFeedback, setVoteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Interactive CyberNest Scholar Term State
  const [scholarTermIdx, setScholarTermIdx] = useState(1);

  const analytics = useMemo(() => computeVoxlanAnalytics(election), [election]);
  const voterCheck = useMemo(
    () => verifyVoterId(election, voterIdInput),
    [election, voterIdInput],
  );
  const activeTerm = SCHOLAR_TERMS[scholarTermIdx];

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
    <section
      id="products"
      className="scroll-mt-14 relative z-30 -mt-10 rounded-t-[36px] lg:rounded-t-[52px] bg-[#1A1A1A] text-[#F2EBDD] pt-24 pb-28 lg:pt-32 lg:pb-36 border-t border-white/12 shadow-[0_-20px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 space-y-20">
        {/* Section Heading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-white/12 pb-10">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-[#F5B800]">
              <span className="font-mono-tabular">04</span>
              <span aria-hidden="true">·</span>
              <span>Our Products</span>
            </div>
            <h2
              className="font-display font-bold tracking-tight text-white leading-[1.04] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)' }}
            >
              Built in Uganda. Engineered for real institutions.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base text-[#F2EBDD]/75">
              Practical CyberNest software programs—from VOXLAN offline school elections
              to CyberNest Scholar academic reporting.
            </p>
          </div>
        </div>

        {/* FLAGSHIP SPOTLIGHT: VOXLAN */}
        {voxlan && (
          <div className="bg-[#231E29] border border-white/15 overflow-hidden">
            {/* Top Banner Photo & Intro */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch border-b border-white/12">
              <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#F5B800] font-semibold">
                    <span>Flagship Product</span>
                    <span aria-hidden="true">·</span>
                    <span>{voxlan.category}</span>
                  </div>

                  <h3 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                    {voxlan.name}
                  </h3>

                  <p className="text-lg text-[#F2EBDD]/90 leading-relaxed">
                    {voxlan.tagline}
                  </p>

                  <p className="text-sm text-[#F2EBDD]/75 leading-relaxed">
                    {voxlan.summary}
                  </p>

                  <p className="border-l-2 border-[#F5B800] pl-3.5 text-xs text-[#F2EBDD]/85 leading-relaxed">
                    <strong className="text-[#F5B800]">Problem Solved:</strong>{' '}
                    {voxlan.problemSolved}
                  </p>
                </div>

                <ul className="space-y-2.5 text-sm text-[#F2EBDD]/85">
                  {voxlan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-4 h-4 text-[#F5B800] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      trackAnalyticsEvent('product_view', voxlan.name);
                      onExploreProduct(voxlan);
                    }}
                    className="group inline-flex items-center gap-2 bg-[#F5B800] px-6 py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="btn-roll-wrap">
                      <span>Explore VOXLAN</span>
                      <span>Explore VOXLAN</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="inline-flex items-center gap-2 text-xs text-[#F2EBDD]/70">
                    <WifiOff className="w-3.5 h-3.5 text-[#F5B800]" aria-hidden="true" />
                    <span>Zero-internet LAN operation</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-full bg-[#141118]">
                {voxlan.imagePath && (
                  <img
                    src={voxlan.imagePath}
                    alt="VOXLAN offline electronic voting terminals deployed for school elections"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Interactive VOXLAN Live Polling Booth Mockup */}
            <div className="p-6 sm:p-8 lg:p-10 bg-[#16131A]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 pb-5 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
                    Interactive Product Preview · VOXLAN Booth Simulator
                  </p>
                  <h4 className="mt-1 font-display text-xl font-bold text-white">
                    {election.electionTitle}
                  </h4>
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
                    <div>
                      <label
                        htmlFor="voxlan-voter-id"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#F2EBDD]/80 mb-2"
                      >
                        1. Unique Voter Identification
                      </label>
                      <input
                        id="voxlan-voter-id"
                        type="text"
                        value={voterIdInput}
                        onChange={(e) => {
                          setVoterIdInput(e.target.value);
                          setVoteFeedback(null);
                        }}
                        placeholder="e.g. UG-SCH-042"
                        className="w-full bg-[#1A1A1A] border border-white/20 px-4 py-3 text-sm font-mono-tabular text-white focus:outline-none focus:border-[#F5B800]"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#F2EBDD]/65">
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
                        className={`mt-2 text-xs ${
                          voterCheck.valid ? 'text-[#F5B800]' : 'text-amber-300'
                        }`}
                      >
                        {voterCheck.valid
                          ? `Verified eligible on local LAN roll (${voterCheck.normalizedId}).`
                          : voterCheck.reason}
                      </p>
                    </div>
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
                            <p className="font-mono-tabular text-xs text-[#F5B800]">
                              {cand.house}
                            </p>
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
                            voteFeedback.type === 'success'
                              ? 'text-[#F5B800]'
                              : 'text-rose-300'
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
                      <h5 className="font-display text-lg font-bold text-white">{cand.name}</h5>
                      <p className="text-sm text-[#F2EBDD]/75 leading-relaxed">{cand.manifesto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECONDARY PRODUCT: CYBERNEST SCHOLAR */}
        {scholar && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#F2EBDD] text-[#1A1A1A] border border-[#1A1A1A]/15">
            <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#4C138E]">
                  <span>Educational Intelligence</span>
                  <span aria-hidden="true">·</span>
                  <span>{scholar.category}</span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {scholar.name}
                </h3>

                <p className="text-base text-[#1A1A1A]/85 leading-relaxed">
                  {scholar.tagline}
                </p>

                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                  {scholar.summary}
                </p>

                <p className="border-l-2 border-[#4C138E] pl-3.5 text-xs text-[#1A1A1A]/80 leading-relaxed">
                  <strong className="text-[#4C138E]">Problem Solved:</strong>{' '}
                  {scholar.problemSolved}
                </p>

                <ul className="space-y-2 text-sm pt-2">
                  {scholar.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-[#4C138E] mt-2 shrink-0" aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    trackAnalyticsEvent('product_view', scholar.name);
                    onExploreProduct(scholar);
                  }}
                  className="group inline-flex items-center gap-2 bg-[#1A1A1A] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#4C138E] transition-colors cursor-pointer"
                >
                  <span className="btn-roll-wrap">
                    <span>Explore {scholar.name}</span>
                    <span>Explore {scholar.name}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Interactive Scholar Reporting Mockup */}
            <div className="lg:col-span-6 bg-[#FFFFFF] border-t lg:border-t-0 lg:border-l border-[#1A1A1A]/15 p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/12 pb-4 mb-6">
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

                <div className="grid grid-cols-2 gap-4 mb-6">
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
              </div>

              <p className="mt-6 pt-4 border-t border-[#1A1A1A]/12 text-xs text-[#1A1A1A]/75 leading-relaxed">
                <strong className="text-[#1A1A1A]">Concept Insight:</strong>{' '}
                {activeTerm.topInsight}
              </p>
            </div>
          </div>
        )}

        {/* Extensible Future Product Registry Slot */}
        {additionalProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalProducts.map((item) => (
              <div
                key={item.id}
                className="bg-[#231E29] border border-white/12 p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {item.imagePath && (
                    <div className="h-44 overflow-hidden bg-[#141118] border border-white/10">
                      <img
                        src={item.imagePath}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-[#F5B800] font-semibold">{item.category}</p>
                  <h4 className="font-display text-2xl font-bold text-white">{item.name}</h4>
                  <p className="text-sm text-[#F2EBDD]/80">{item.tagline}</p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      trackAnalyticsEvent('product_view', item.name);
                      onExploreProduct(item);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#F5B800] hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Explore {item.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
