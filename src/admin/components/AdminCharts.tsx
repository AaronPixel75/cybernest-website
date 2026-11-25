import React, { useState } from 'react';

export interface TimeSeriesPoint {
  bucket: string;
  visits: number;
  uniqueVisitors: number;
  contactClicks: number;
  submissions: number;
}

export const TimeSeriesChart: React.FC<{ data: TimeSeriesPoint[] }> = ({ data }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showUnique, setShowUnique] = useState(true);
  const [showActions, setShowActions] = useState(true);

  if (data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center border border-dashed border-[#1A1A1A]/15 bg-[#F7F6F3] text-xs text-[#1A1A1A]/60">
        No recorded traffic in this date range yet. Visits from the public site appear here automatically.
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padL = 42;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxVal = Math.max(
    4,
    ...data.map((d) =>
      Math.max(
        d.visits,
        showUnique ? d.uniqueVisitors : 0,
        showActions ? d.contactClicks + d.submissions : 0,
      ),
    ),
  );

  const xAt = (idx: number) =>
    data.length === 1 ? padL + plotW / 2 : padL + (idx / (data.length - 1)) * plotW;
  const yAt = (val: number) => padT + plotH - (val / maxVal) * plotH;

  const toPolyline = (vals: number[]) =>
    vals.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');

  const areaPath =
    data.length > 0
      ? `M ${xAt(0).toFixed(1)},${(padT + plotH).toFixed(1)} ` +
        data.map((d, i) => `L ${xAt(i).toFixed(1)},${yAt(d.visits).toFixed(1)}`).join(' ') +
        ` L ${xAt(data.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
      : '';

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const labelStride = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1A1A1A]">
            <span className="w-2.5 h-2.5 bg-[#4C138E] inline-block" />
            Visits
          </span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#1A1A1A]/80">
            <input
              type="checkbox"
              checked={showUnique}
              onChange={(e) => setShowUnique(e.target.checked)}
              className="accent-[#F5B800]"
            />
            <span className="w-2.5 h-2.5 bg-[#F5B800] inline-block" />
            Unique Visitors
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#1A1A1A]/80">
            <input
              type="checkbox"
              checked={showActions}
              onChange={(e) => setShowActions(e.target.checked)}
              className="accent-[#8D5B38]"
            />
            <span className="w-2.5 h-2.5 bg-[#8D5B38] inline-block" />
            Contact Clicks & Enquiries
          </label>
        </div>

        {hovered && (
          <div className="font-mono-tabular text-[11px] bg-[#1A1A1A] text-[#F2EBDD] px-2.5 py-1">
            {hovered.bucket} · {hovered.visits} visits · {hovered.uniqueVisitors} unique ·{' '}
            {hovered.contactClicks} contact clicks · {hovered.submissions} enquiries
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[480px] h-auto select-none"
          role="img"
          aria-label="Website visits and conversions over time"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const val = Math.round(maxVal * tick);
            const y = yAt(val);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y}
                  y2={y}
                  stroke="#1A1A1A"
                  strokeOpacity={0.09}
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#1A1A1A"
                  fillOpacity={0.55}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="#4C138E" fillOpacity={0.08} />}

          <polyline
            fill="none"
            stroke="#4C138E"
            strokeWidth="2.4"
            points={toPolyline(data.map((d) => d.visits))}
          />

          {showUnique && (
            <polyline
              fill="none"
              stroke="#F5B800"
              strokeWidth="2"
              strokeDasharray="4 3"
              points={toPolyline(data.map((d) => d.uniqueVisitors))}
            />
          )}

          {showActions && (
            <polyline
              fill="none"
              stroke="#8D5B38"
              strokeWidth="2"
              points={toPolyline(data.map((d) => d.contactClicks + d.submissions))}
            />
          )}

          {data.map((d, i) => {
            const x = xAt(i);
            const y = yAt(d.visits);
            return (
              <g key={d.bucket}>
                {(i % labelStride === 0 || i === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1A1A1A"
                    fillOpacity={0.6}
                  >
                    {d.bucket.slice(5)}
                  </text>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={hoverIdx === i ? 5 : 3}
                  fill={hoverIdx === i ? '#F5B800' : '#4C138E'}
                />
                <rect
                  x={x - Math.max(10, plotW / Math.max(data.length * 2, 2))}
                  y={padT}
                  width={Math.max(20, plotW / Math.max(data.length, 1))}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const BreakdownBars: React.FC<{
  items: { label: string; count: number; pct?: number }[];
  accentColor?: string;
  emptyLabel?: string;
}> = ({ items, accentColor = '#4C138E', emptyLabel = 'No recorded events in this period.' }) => {
  if (items.length === 0) {
    return <p className="text-xs text-[#1A1A1A]/55 py-4">{emptyLabel}</p>;
  }
  const maxCount = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const widthPct = Math.round((item.count / maxCount) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-[#1A1A1A]" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono-tabular text-[#1A1A1A]/75 shrink-0">
                {item.count}
                {typeof item.pct === 'number' ? ` (${item.pct}%)` : ''}
              </span>
            </div>
            <div className="h-2 w-full bg-[#1A1A1A]/8 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${Math.max(4, widthPct)}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
