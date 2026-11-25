import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, RefreshCw, ShieldCheck } from 'lucide-react';
import type { AnalyticsGranularity, AnalyticsOverviewPayload } from '../../types/cms';
import { adminApi } from '../api';
import { BreakdownBars, TimeSeriesChart } from '../components/AdminCharts';

interface AnalyticsViewProps {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

type PresetKey = 'today' | '7d' | '30d' | '90d' | 'custom';

function isoDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function formatDuration(sec: number): string {
  if (sec <= 0) return '0s';
  const mins = Math.floor(sec / 60);
  const rem = Math.round(sec % 60);
  return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onToast }) => {
  const today = isoDaysAgo(0);
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [start, setStart] = useState(isoDaysAgo(29));
  const [end, setEnd] = useState(today);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('daily');
  const [showComparison, setShowComparison] = useState(true);
  const [data, setData] = useState<AnalyticsOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(
    async (s: string, e: string, g: AnalyticsGranularity) => {
      setLoading(true);
      try {
        const res = await adminApi.getAnalytics(s, e, g);
        setData(res);
      } catch (err) {
        onToast(err instanceof Error ? err.message : 'Unable to load analytics.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [onToast],
  );

  useEffect(() => {
    loadAnalytics(start, end, granularity);
  }, [start, end, granularity, loadAnalytics]);

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    const nowIso = isoDaysAgo(0);
    if (key === 'today') {
      setStart(nowIso);
      setEnd(nowIso);
    } else if (key === '7d') {
      setStart(isoDaysAgo(6));
      setEnd(nowIso);
    } else if (key === '30d') {
      setStart(isoDaysAgo(29));
      setEnd(nowIso);
    } else if (key === '90d') {
      setStart(isoDaysAgo(89));
      setEnd(nowIso);
    }
  };

  const renderDelta = (deltaPct: number | null, invertGood = false) => {
    if (!showComparison || deltaPct === null) {
      return <span className="text-[11px] text-[#1A1A1A]/45 font-mono-tabular">No prior baseline</span>;
    }
    const isPositive = deltaPct > 0;
    const good = invertGood ? !isPositive : isPositive;
    return (
      <span
        className={`text-[11px] font-mono-tabular font-semibold ${
          deltaPct === 0
            ? 'text-[#1A1A1A]/55'
            : good
              ? 'text-emerald-700'
              : 'text-rose-700'
        }`}
      >
        {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`} vs prev
      </span>
    );
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="bg-white border border-[#1A1A1A]/12 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['today', 'Today'],
              ['7d', '7 Days'],
              ['30d', '30 Days'],
              ['90d', '90 Days'],
              ['custom', 'Custom'],
            ] as [PresetKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                preset === key
                  ? 'bg-[#4C138E] text-white border-[#4C138E]'
                  : 'bg-[#F7F6F3] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#4C138E]'
              }`}
            >
              {label}
            </button>
          ))}

          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/60" aria-hidden="true" />
              <input
                type="date"
                aria-label="Start date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className="border border-[#1A1A1A]/20 px-2.5 py-1 text-xs font-mono-tabular"
              />
              <span className="text-xs text-[#1A1A1A]/50">to</span>
              <input
                type="date"
                aria-label="End date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="border border-[#1A1A1A]/20 px-2.5 py-1 text-xs font-mono-tabular"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-[#1A1A1A]/15 bg-[#F7F6F3] p-0.5">
            {(['daily', 'weekly', 'monthly'] as AnalyticsGranularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 text-xs font-semibold capitalize cursor-pointer ${
                  granularity === g ? 'bg-white text-[#4C138E]' : 'text-[#1A1A1A]/70'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/80 cursor-pointer">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="accent-[#4C138E]"
            />
            Compare period
          </label>

          <button
            type="button"
            onClick={() => loadAnalytics(start, end, granularity)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-[#1A1A1A]/20 bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#4C138E] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Visits',
            val: kpis ? String(kpis.totalVisits.current) : '0',
            delta: kpis?.totalVisits.deltaPct ?? null,
          },
          {
            label: 'Unique Visitors',
            val: kpis ? String(kpis.uniqueVisitors.current) : '0',
            delta: kpis?.uniqueVisitors.deltaPct ?? null,
          },
          {
            label: 'Avg. Session Duration',
            val: kpis ? formatDuration(kpis.avgSessionDurationSec.current) : '0s',
            delta: kpis?.avgSessionDurationSec.deltaPct ?? null,
          },
          {
            label: 'Bounce Rate',
            val: kpis ? `${kpis.bounceRatePct.current}%` : '0%',
            delta: kpis?.bounceRatePct.deltaPct ?? null,
            invertGood: true,
          },
          {
            label: 'Contact Button Clicks',
            val: kpis ? String(kpis.contactClicks.current) : '0',
            delta: kpis?.contactClicks.deltaPct ?? null,
          },
          {
            label: 'Form Submissions',
            val: kpis ? String(kpis.contactSubmissions.current) : '0',
            delta: kpis?.contactSubmissions.deltaPct ?? null,
          },
          {
            label: 'Team Interactions',
            val: kpis ? String(kpis.teamInteractions.current) : '0',
            delta: kpis?.teamInteractions.deltaPct ?? null,
          },
          {
            label: 'Product Views',
            val: kpis ? String(kpis.productViews.current) : '0',
            delta: kpis?.productViews.deltaPct ?? null,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-[#1A1A1A]/12 p-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/60">
              {card.label}
            </p>
            <p className="font-mono-tabular text-2xl font-bold text-[#1A1A1A]">{card.val}</p>
            <div>{renderDelta(card.delta, card.invertGood)}</div>
          </div>
        ))}
      </div>

      {/* Main Traffic Chart */}
      <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A]/10 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-[#1A1A1A]">
              Visitor Activity & Conversions
            </h3>
            <p className="text-xs text-[#1A1A1A]/60">
              Real-time measurements from public pages ({start} to {end})
            </p>
          </div>
          {data && (
            <span className="font-mono-tabular text-[11px] text-[#1A1A1A]/55">
              Previous window: {data.range.prevStart} to {data.range.prevEnd}
            </span>
          )}
        </div>
        <TimeSeriesChart data={data?.timeSeries || []} />
      </div>

      {/* Audience & Technical Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Devices
          </h4>
          <BreakdownBars
            items={(data?.devices || []).map((d) => ({
              label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
              count: d.count,
              pct: d.pct,
            }))}
            accentColor="#4C138E"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Browsers
          </h4>
          <BreakdownBars
            items={(data?.browsers || []).map((b) => ({ label: b.browser, count: b.count }))}
            accentColor="#1A1A1A"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Operating Systems
          </h4>
          <BreakdownBars
            items={(data?.operatingSystems || []).map((o) => ({ label: o.os, count: o.count }))}
            accentColor="#8D5B38"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Approximate Geography
          </h4>
          <BreakdownBars
            items={(data?.geography || []).map((g) => ({ label: g.region, count: g.count }))}
            accentColor="#4C138E"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Traffic Sources & Referrals
          </h4>
          <BreakdownBars
            items={(data?.referrers || []).map((r) => ({ label: r.source, count: r.count }))}
            accentColor="#F5B800"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Most Visited Pages
          </h4>
          <BreakdownBars
            items={(data?.topPages || []).map((p) => ({
              label: `${p.path} (${p.uniqueVisitors} unique)`,
              count: p.views,
            }))}
            accentColor="#1A1A1A"
          />
        </div>
      </div>

      {/* Interaction Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Most Clicked Buttons & Links
          </h4>
          <BreakdownBars
            items={(data?.topClicks || []).map((c) => ({
              label: c.label || c.eventType,
              count: c.count,
            }))}
            accentColor="#4C138E"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Team Carousel Interactions
          </h4>
          <BreakdownBars
            items={(data?.teamInteractionsBreakdown || []).map((t) => ({
              label: t.label,
              count: t.count,
            }))}
            accentColor="#8D5B38"
          />
        </div>

        <div className="bg-white border border-[#1A1A1A]/12 p-5 space-y-3">
          <h4 className="font-display text-sm font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
            Product Page & Modal Engagement
          </h4>
          <BreakdownBars
            items={(data?.productEngagement || []).map((p) => ({
              label: p.label,
              count: p.count,
            }))}
            accentColor="#F5B800"
          />
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-white border border-[#1A1A1A]/12 px-4 py-3 flex items-start gap-2.5 text-xs text-[#1A1A1A]/70">
        <ShieldCheck className="w-4 h-4 text-[#4C138E] shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Privacy-first analytics: Visitor uniqueness uses daily rotating HMAC hashes without storing raw IP addresses, third-party ad cookies, or personal tracking profiles. Visitors who enable Do-Not-Track or click Opt Out are automatically excluded.
        </span>
      </div>
    </div>
  );
};
