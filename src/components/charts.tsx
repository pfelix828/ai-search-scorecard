"use client";

/**
 * Shared Recharts wrappers. All charts plot the 26 weekly rollups.
 * Pages may also use Recharts directly for bespoke visuals.
 */
import {
  CartesianGrid,
  Line,
  ComposedChart,
  Area,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "@/lib/format";

export interface WeeklyPoint {
  week: string; // ISO week-ending date
  [seriesKey: string]: number | string | null;
}

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

export interface EventMarker {
  week: string;
  label: string;
}

/**
 * Multi-series weekly line chart.
 * - yPercent: format axis/tooltip as percentages (values are 0..1)
 * - band: optional CI band drawn behind the first series, keys `${key}Lo`/`${key}Hi`
 */
export function WeeklyChart({
  data,
  series,
  yPercent = false,
  yDomain,
  events = [],
  height = 260,
  bandKey,
}: {
  data: WeeklyPoint[];
  series: SeriesDef[];
  yPercent?: boolean;
  yDomain?: [number, number];
  events?: EventMarker[];
  height?: number;
  bandKey?: string;
}) {
  const fmt = (v: number) => (yPercent ? `${Math.round(v * 100)}%` : `${v}`);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="#eee" vertical={false} />
        <XAxis dataKey="week" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} minTickGap={28} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} domain={yDomain ?? (yPercent ? [0, 1] : ["auto", "auto"])} width={52} />
        <Tooltip
          formatter={(value, name) => [yPercent && typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value, name]}
          labelFormatter={(l) => `Week ending ${shortDate(String(l))}`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
        />
        {bandKey ? (
          <Area
            type="monotone"
            dataKey={(d: WeeklyPoint) => [d[`${bandKey}Lo`] as number, d[`${bandKey}Hi`] as number]}
            stroke="none"
            fill="#e5e7eb"
            fillOpacity={0.6}
            activeDot={false}
            name="95% CI"
            tooltipType="none"
          />
        ) : null}
        {events.map((ev) => (
          <ReferenceLine key={ev.week} x={ev.week} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: ev.label, position: "top", fontSize: 10, fill: "#6b7280" }} />
        ))}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} strokeDasharray={s.dashed ? "5 4" : undefined} connectNulls={false} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Tiny inline sparkline for tables. Values 0..1. */
export function Sparkline({ values, color = "#eb1000", width = 96, height = 26 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values, 0.01);
  const min = Math.min(...values);
  const range = Math.max(max - min, 0.02);
  const ptsAttr = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`)
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <polyline points={ptsAttr} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

/** Simple legend row matching SeriesDef colors. */
export function Legend({ series }: { series: SeriesDef[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color, borderBottom: s.dashed ? `1px dashed ${s.color}` : undefined }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
