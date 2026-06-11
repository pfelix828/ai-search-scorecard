import Link from "next/link";
import type { Metadata } from "next";
import {
  meta,
  weeklyRows,
  blendedSeries,
  shareOfVoice,
  adobeBrandOf,
  brandName,
  LAST_WEEK,
  latestWeekEnding,
} from "@/lib/data";
import { pct, score, shortDate } from "@/lib/format";
import { Card, PageHeader, Delta, Pill, SimulatedDataNote, Term } from "@/components/ui";
import { Sparkline } from "@/components/charts";

export const metadata: Metadata = {
  title: "Categories · AI Search Visibility Scorecard",
  description:
    "Per-category visibility of five Adobe products in AI answer engines, with simulated demo data.",
};

const VS_DEF =
  "Composite score from 0 to 100: 45% mention rate, 20% answer position, 20% citation share, 15% sentiment, averaged across engines weighted by assumed usage share. Weighting is illustrative.";
const SOV_DEF = "Share of all tracked-brand mentions in this category held by each brand.";
const MR_DEF = "Share of sampled answers that mention the brand at least once.";

export default function CategoriesPage() {
  const cards = meta.categories.map((c) => {
    const adobe = adobeBrandOf(c.id)!;

    const vsSeries = blendedSeries(c.id, adobe.id, (r) => r.vs);
    const vsNow = vsSeries[vsSeries.length - 1].value;
    const vsPrev = vsSeries[vsSeries.length - 2].value;

    const sov = shareOfVoice(c.id, "chatgpt", LAST_WEEK);
    const rank = sov.findIndex((s) => s.b === adobe.id) + 1;

    const latestChatgpt = weeklyRows({ w: LAST_WEEK, c: c.id, e: "chatgpt" });
    const topCompetitor = latestChatgpt
      .filter((r) => r.b !== adobe.id)
      .sort((a, b) => b.mr - a.mr)[0];

    const spark = blendedSeries(c.id, adobe.id, (r) => r.mr).map((p) => p.value);

    return { c, adobe, vsNow, vsPrev, rank, total: sov.length, topCompetitor, spark };
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={
          <>
            Five product categories, each tracking one Adobe product against four competitors across five AI answer
            engines. Latest data is the week ending {shortDate(latestWeekEnding)}. Click a category for engine-level
            trends, share of voice, and its prompt panel.
          </>
        }
      />
      <SimulatedDataNote className="mb-5" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ c, adobe, vsNow, vsPrev, rank, total, topCompetitor, spark }) => (
          <Link key={c.id} href={`/categories/${c.id}`} className="group block">
            <Card className="flex h-full flex-col gap-3 transition hover:border-zinc-300 hover:shadow-md">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight group-hover:text-accent">{c.name}</h3>
                  <Pill>{c.adobeBrand}</Pill>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted">
                  <Term def={VS_DEF}>Visibility Score</Term> (blended)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">{score(vsNow)}</span>
                  <Delta value={(vsNow - vsPrev) / 100} digits={1} />
                  <span className="text-xs text-muted">vs prior week</span>
                </div>
              </div>

              <ul className="space-y-1 text-xs text-foreground/80">
                <li>
                  #{rank} of {total} in <Term def={SOV_DEF}>share of voice</Term> on ChatGPT
                </li>
                <li>
                  Top competitor on ChatGPT: {brandName(topCompetitor.b)},{" "}
                  <Term def={MR_DEF}>mention rate</Term> {pct(topCompetitor.mr)}
                </li>
              </ul>

              <div className="mt-auto border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {adobe.name}: blended <Term def={MR_DEF}>mention rate</Term>, 26 weeks
                  </span>
                  <Sparkline values={spark} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
