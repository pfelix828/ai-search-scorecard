import Link from "next/link";
import {
  meta,
  insights,
  blendedSeries,
  adobeBrandOf,
  categoryName,
  latestWeekEnding,
} from "@/lib/data";
import { score, pct, shortDate } from "@/lib/format";
import {
  Card,
  CardTitle,
  PageHeader,
  Delta,
  SeverityBadge,
  Pill,
  SimulatedDataNote,
  Term,
} from "@/components/ui";
import { WeeklyChart, Legend, type SeriesDef, type WeeklyPoint } from "@/components/charts";
import { VisibilityHeatmap } from "@/components/overview/heatmap";

/**
 * Overview: the executive weekly scorecard. One screen answers
 * "where do we stand this week, versus target, and what needs action?"
 */

// Adobe brands all share one accent red in brandColor(), so this page uses
// its own palette to keep five Adobe lines distinguishable on one chart.
const CATEGORY_PALETTE: Record<string, string> = {
  "quick-design": "#eb1000",
  "genai-image": "#d97706",
  "pdf-tools": "#2563eb",
  "photo-editing": "#0d9488",
  "video-editing": "#7c3aed",
};

const EVENTS = [
  { week: "2026-03-22", label: "Express content change" },
  { week: "2026-04-26", label: "Gemini model update" },
];

/** "2026-06-07" -> "Jun 7, 2026" */
function fullDate(iso: string) {
  const [y] = iso.split("-");
  return `${shortDate(iso)}, ${y}`;
}

export default function OverviewPage() {
  // One blended (usage-weighted) Visibility Score series per Adobe product.
  const productSeries = meta.categories.map((cat) => {
    const brand = adobeBrandOf(cat.id)!;
    const points = blendedSeries(cat.id, brand.id, (r) => r.vs);
    const current = points[points.length - 1].value;
    const previous = points[points.length - 2].value;
    const target = meta.targets.find((t) => t.category === cat.id);
    return { cat, brand, points, current, previous, target };
  });

  const chartData: WeeklyPoint[] = meta.weeks.map((week, w) => {
    const pt: WeeklyPoint = { week };
    for (const s of productSeries) {
      const p = s.points.find((x) => x.w === w);
      pt[s.cat.id] = p ? Number(p.value.toFixed(1)) : null;
    }
    return pt;
  });

  const chartSeries: SeriesDef[] = productSeries.map((s) => ({
    key: s.cat.id,
    name: s.brand.name,
    color: CATEGORY_PALETTE[s.cat.id] ?? "#9ca3af",
  }));

  const sortedInsights = [...insights].sort((a, b) => b.week.localeCompare(a.week));
  const w = meta.visibilityScoreWeights;

  // Decision-grade summary: one number, its movement, and the action it supports.
  const portfolioNow = productSeries.reduce((s, p) => s + p.current, 0) / productSeries.length;
  const portfolioPrev = productSeries.reduce((s, p) => s + p.previous, 0) / productSeries.length;
  const onPace = productSeries.filter((p) => p.target && p.current >= p.target.q3Target * 0.9).length;
  const biggestMover = [...productSeries].sort(
    (a, b) => Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous),
  )[0];
  const topAction = sortedInsights.find((i) => i.severity === "risk" || i.severity === "opportunity") ?? sortedInsights[0];

  return (
    <div>
      <PageHeader
        title="Weekly AI Search Scorecard"
        subtitle="A weekly summary of how visible five Adobe products are in the answers of five AI engines, tracked against quarterly targets and competitor brands."
        right={<Pill>Week ending {fullDate(latestWeekEnding)}</Pill>}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <SimulatedDataNote />
        <Link
          href="/"
          className="text-xs font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          ← Back to the two-minute summary
        </Link>
      </div>

      {/* 0. Decision-grade summary: the one-screen read a budget owner needs */}
      <Card className="mb-4 border-l-4 border-l-accent">
        <CardTitle sub="One number, its movement, and the single action it supports. The detail behind every figure is one click away.">
          The week in one read
        </CardTitle>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <div className="text-[11px] font-medium text-muted">
              <Term def="Simple average of the five products' blended Visibility Scores. A summary read for trend and target tracking, not a metric any one team owns.">
                Portfolio Visibility Score
              </Term>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">{score(portfolioNow)}</span>
              <Delta value={(portfolioNow - portfolioPrev) / 100} suffix="pts" digits={1} />
            </div>
            <div className="mt-1 text-[11px] text-muted">
              {onPace} of {productSeries.length} products at 90%+ of their Q3 FY26 target
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Biggest mover this week</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight">{biggestMover.brand.name}</span>
              <Delta value={(biggestMover.current - biggestMover.previous) / 100} suffix="pts" digits={1} />
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Moves inside the weekly sampling noise are not called out as news; this one is the largest either way.
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Top action on the table</div>
            <p className="mt-1 text-xs font-semibold leading-snug tracking-tight">{topAction.title}</p>
            <Link
              href={topAction.link}
              className="mt-1 inline-block text-xs font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              Supporting detail
            </Link>
          </div>
        </div>
      </Card>

      {/* 1. Product scorecards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {productSeries.map(({ cat, brand, current, previous, target }) => {
          const towardTarget = target ? Math.min(100, (current / target.q3Target) * 100) : 0;
          return (
            <Link key={cat.id} href={`/categories/${cat.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-zinc-300">
                <div className="text-[11px] text-muted">{cat.name}</div>
                <div className="mt-0.5 text-sm font-semibold tracking-tight">{brand.name}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight">{score(current)}</span>
                  <Delta value={(current - previous) / 100} suffix="pts" digits={1} />
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  <Term def="Composite 0-100 score of mention rate, answer position, citation share, and sentiment, averaged across engines in proportion to each engine's assumed usage share. Simulated.">
                    Visibility Score
                  </Term>
                  , blended
                </div>
                {target ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>Q3 FY26 target: {target.q3Target}</span>
                      <span className="tabular-nums">{Math.round(towardTarget)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${towardTarget}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 2. Heatmap: product x engine */}
      <Card className="mt-4">
        <CardTitle sub={`Latest-week Visibility Score, 0-100 (week ending ${fullDate(latestWeekEnding)}). Rows are Adobe products, columns are engines weighted by assumed usage share.`}>
          Where each product stands, engine by engine
        </CardTitle>
        <VisibilityHeatmap />
      </Card>

      {/* 3. 26-week trend */}
      <Card className="mt-4">
        <CardTitle sub="Blended Visibility Score for all five Adobe products, weighted by each engine's assumed usage share. Dashed lines mark the Adobe Express help-content change and the Gemini model update.">
          26-week trend
        </CardTitle>
        <WeeklyChart data={chartData} series={chartSeries} events={EVENTS} height={300} />
        <Legend series={chartSeries} />
      </Card>

      {/* 4. Insights + how to read */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Newest first. Each item links to the page with the supporting detail.">
            Latest insights
          </CardTitle>
          <ul className="divide-y divide-border-subtle">
            {sortedInsights.map((ins) => (
              <li key={`${ins.week}-${ins.title}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={ins.severity} />
                  <span className="text-[11px] text-muted">
                    Week ending {shortDate(ins.week)} ·{" "}
                    {ins.category === "all" ? "All categories" : categoryName(ins.category)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold tracking-tight">{ins.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{ins.body}</p>
                <Link
                  href={ins.link}
                  className="mt-1.5 inline-block text-xs font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
                >
                  View detail
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>How to read this</CardTitle>
          <div className="space-y-3 text-xs leading-relaxed text-muted">
            <p>
              <strong className="font-semibold text-foreground">Visibility Score</strong> is a 0–100 composite of
              mention rate ({pct(w.mentionRate)}), answer position ({pct(w.position)}), citation share (
              {pct(w.citationShare)}), and sentiment ({pct(w.sentiment)}) — weights illustrative for this demo, not a
              measured truth. Headline scores are <strong className="font-semibold text-foreground">blended</strong>:
              each engine counts in proportion to its assumed usage share.
            </p>
            <p>
              <strong className="font-semibold text-foreground">Weekly reads are noisy.</strong> Each number comes from{" "}
              {meta.runsPerPromptEngineWeek} runs per prompt, engine, and week, so every read carries a{" "}
              <Term def="The range a metric would plausibly fall in if we re-ran the same prompts. Moves inside it are consistent with random variation.">
                confidence interval
              </Term>
              . A single-week move inside that interval isn&apos;t news — look for multi-week shifts or moves tied to a
              known change. Targets work the same way: a miss that sampling noise can explain is reported as exactly that.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
