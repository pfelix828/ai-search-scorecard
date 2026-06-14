/**
 * Typed access to the simulated dataset (see scripts/generate-data.mjs).
 * All numbers in src/data/*.json are demo data, generated deterministically.
 */
import metaJson from "@/data/meta.json";
import weeklyJson from "@/data/weekly.json";
import promptsJson from "@/data/prompts.json";
import funnelJson from "@/data/funnel.json";
import experimentsJson from "@/data/experiments.json";
import insightsJson from "@/data/insights.json";
import answersJson from "@/data/answers.json";
import trustJson from "@/data/trust.json";

export interface Engine {
  id: string;
  name: string;
  /** assumed share of AI-assistant usage, for exposure weighting (demo) */
  usageShare: number;
  /** share of visits that keep an AI referrer (demo; 0 for AI Overviews) */
  referrerCapture: number;
}

export interface BrandRef {
  id: string;
  name: string;
  adobe: boolean;
}

export interface Category {
  id: string;
  name: string;
  adobeBrand: string;
  brands: BrandRef[];
}

export interface Target {
  category: string;
  metric: string;
  current: number;
  q3Target: number;
  quarter: string;
}

export interface Meta {
  generatedNote: string;
  weeks: string[];
  runsPerPromptEngineWeek: number;
  engines: Engine[];
  categories: Category[];
  targets: Target[];
  visibilityScoreWeights: {
    mentionRate: number;
    position: number;
    citationShare: number;
    sentiment: number;
  };
}

/** One weekly rollup for (week, category, engine, brand). */
export interface WeeklyRow {
  /** week index 0..25 */
  w: number;
  /** week-ending date (Sunday), ISO */
  week: string;
  /** category id */
  c: string;
  /** engine id */
  e: string;
  /** brand id */
  b: string;
  /** mention rate 0..1 (volume-weighted across the category's prompts) */
  mr: number;
  ciLo: number;
  ciHi: number;
  /** avg position of first mention (1 = led the answer); null if never mentioned */
  pos: number | null;
  /** share of cited sources belonging to the brand, 0..1 */
  cit: number;
  /** avg sentiment when mentioned, -1..1; null if never mentioned */
  sent: number | null;
  /** illustrative Visibility Score composite, 0..100 */
  vs: number;
  /** weighted run count behind mr */
  n: number;
}

export interface PromptEngineSnapshot {
  e: string;
  mr: number;
  prevMr: number;
  ciLo: number;
  ciHi: number;
  k: number;
  n: number;
  /** mention rate pooled over the last 6 weeks (the window prompt-level statements should quote) */
  mr6w: number;
  ci6wLo: number;
  ci6wHi: number;
  k6w: number;
  n6w: number;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  intent: "discovery" | "evaluation" | "how-to" | "suitability";
  volume: "high" | "medium" | "low";
  estWeeklyAsks: number;
  treated: boolean;
  adobeBrand: string;
  adobeBrandName: string;
  /** latest-week snapshot per engine, for the Adobe brand */
  perEngine: PromptEngineSnapshot[];
  /** 26-week usage-share-blended mention rate series for the Adobe brand */
  spark: number[];
}

export interface FunnelRow {
  w: number;
  week: string;
  e: string;
  /** modeled "true" AI-influenced sessions (before referrer loss) */
  estSessions: number;
  /** sessions an analytics tool would actually attribute to the engine */
  observedSessions: number;
  /** AI agent/crawler hits (separate signal from human referrals) */
  agenticHits: number;
}

/** One arm of the funnel where AI search can move revenue. */
export interface WorthArm {
  key: string;
  label: string;
  status: "modeled" | "scaffolded";
  note: string;
}

export interface OutcomeAssumptions {
  referrerCaptureNote: string;
  signupRate: number;
  trialToPaid: number;
  arpuMonthly: number;
  grossMarginMonths: number;
  worthArms: WorthArm[];
}

/** Treated-minus-control difference in differences, with a CI on the contrast. */
export interface DidStats {
  treatedDelta: number;
  controlDelta: number;
  did: number;
  se: number;
  ciLo: number;
  ciHi: number;
}

export interface ExperimentSeriesPoint {
  w: number;
  week: string;
  mr: number;
  ciLo: number;
  ciHi: number;
  k: number;
  n: number;
}

export interface CitationSeriesPoint {
  w: number;
  week: string;
  cit: number;
}

export interface LiftStats {
  pre: number;
  post: number;
  liftPts: number;
  ciLo: number;
  ciHi: number;
}

export interface Experiment {
  id: string;
  name: string;
  status: "positive" | "mixed" | "null";
  interventionWeek: number;
  interventionDate: string;
  design: string;
  metric: string;
  readout: string;
  caveats: string;
  treated?: ExperimentSeriesPoint[];
  control?: ExperimentSeriesPoint[];
  treatedLift?: LiftStats | null;
  controlLift?: LiftStats | null;
  did?: DidStats | null;
  perplexitySeries?: CitationSeriesPoint[];
  chatgptSeries?: CitationSeriesPoint[];
}

export interface Insight {
  week: string;
  severity: "win" | "opportunity" | "risk" | "watch";
  category: string;
  title: string;
  body: string;
  link: string;
}

export interface AnswerSnippet {
  engine: string;
  note: string;
  text: string;
  mentions: { brand: string; position: number }[];
  citations: string[];
}

/** A pooled pass-rate for one correctness check, with a Wilson 95% interval. */
export interface TrustRate {
  /** 0..1 pooled pass rate; null if no judged sample in the window */
  rate: number | null;
  lo: number | null;
  hi: number | null;
  /** pass count and judged-sample size behind the rate */
  k: number;
  n: number;
}

export interface TrustProductRow {
  b: string;
  name: string;
  c: string;
  window: number;
  claimAccuracy: TrustRate;
  citationSupport: TrustRate;
  attributionCorrectness: TrustRate;
}

export interface TrustHeadline {
  brand: string;
  brandName: string;
  engine: string;
  promptText: string;
  dipWeek: string;
  pre: TrustRate;
  dip: TrustRate;
  change: { diffPts: number; ciLo: number; ciHi: number };
}

export interface TrustDefect {
  promptText: string;
  category: string;
  intent: string;
  estWeeklyAsks: number;
  brand: string;
  brandName: string;
  engine: string;
  check: string;
  checkLabel: string;
  rate: number;
  lo: number;
  hi: number;
  missPts: number;
}

export interface TrustExampleCheck {
  label: string;
  verdict: "pass" | "partial" | "fail";
  note: string;
}

export interface TrustExample {
  engine: string;
  promptText: string;
  note: string;
  answerText: string;
  checks: TrustExampleCheck[];
}

export interface Trust {
  note: string;
  judgedPerPromptEngineWeek: number;
  window: number;
  windowLabel: string;
  adjudicatedPromptCount: number;
  totalPromptCount: number;
  checks: { key: string; name: string; def: string }[];
  byProduct: TrustProductRow[];
  headline: TrustHeadline;
  headlineTrend: { w: number; week: string; rate: number }[];
  defects: TrustDefect[];
  examples: TrustExample[];
  event: { week: string; label: string };
}

export const meta = metaJson as Meta;
export const weekly = weeklyJson as WeeklyRow[];
export const prompts = promptsJson as Prompt[];
export const funnel = funnelJson as { rows: FunnelRow[]; assumptions: OutcomeAssumptions };
export const experiments = experimentsJson as Experiment[];
export const insights = insightsJson as Insight[];
export const answers = answersJson as Record<string, AnswerSnippet>;
export const trust = trustJson as Trust;

export const N_WEEKS = meta.weeks.length;
export const LAST_WEEK = N_WEEKS - 1;
export const latestWeekEnding = meta.weeks[LAST_WEEK];

const engineById = new Map(meta.engines.map((e) => [e.id, e]));
const categoryById = new Map(meta.categories.map((c) => [c.id, c]));
const brandNameById = new Map(
  meta.categories.flatMap((c) => c.brands.map((b) => [b.id, b.name] as const)),
);

export const engineName = (id: string) => engineById.get(id)?.name ?? id;
export const categoryName = (id: string) => categoryById.get(id)?.name ?? id;
export const brandName = (id: string) => brandNameById.get(id) ?? id;
export const getCategory = (id: string) => categoryById.get(id);
export const getEngine = (id: string) => engineById.get(id);
export const adobeBrandOf = (categoryId: string) =>
  categoryById.get(categoryId)?.brands.find((b) => b.adobe);

/** Rows for a given filter; pass undefined to skip a dimension. */
export function weeklyRows(filter: { w?: number; c?: string; e?: string; b?: string }) {
  return weekly.filter(
    (r) =>
      (filter.w === undefined || r.w === filter.w) &&
      (filter.c === undefined || r.c === filter.c) &&
      (filter.e === undefined || r.e === filter.e) &&
      (filter.b === undefined || r.b === filter.b),
  );
}

/** Usage-share-weighted average of a weekly metric across engines for one brand. */
export function blendedSeries(
  categoryId: string,
  brandId: string,
  metric: (r: WeeklyRow) => number | null,
): { w: number; week: string; value: number }[] {
  const out: { w: number; week: string; value: number }[] = [];
  for (let w = 0; w < N_WEEKS; w++) {
    let num = 0;
    let den = 0;
    for (const eng of meta.engines) {
      const row = weekly.find((r) => r.w === w && r.c === categoryId && r.e === eng.id && r.b === brandId);
      if (!row) continue;
      const v = metric(row);
      if (v === null) continue;
      num += v * eng.usageShare;
      den += eng.usageShare;
    }
    if (den > 0) out.push({ w, week: meta.weeks[w], value: num / den });
  }
  return out;
}

/** Share of voice within a category for one engine+week: brand mentions / all tracked-brand mentions. */
export function shareOfVoice(categoryId: string, engineId: string, w: number) {
  const rows = weeklyRows({ w, c: categoryId, e: engineId });
  const total = rows.reduce((s, r) => s + r.mr, 0);
  return rows
    .map((r) => ({ b: r.b, sov: total > 0 ? r.mr / total : 0 }))
    .sort((a, b) => b.sov - a.sov);
}
