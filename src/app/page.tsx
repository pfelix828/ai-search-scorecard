import type { Metadata } from "next";
import Link from "next/link";
import {
  meta,
  prompts,
  experiments,
  trust,
  weeklyRows,
  blendedSeries,
  adobeBrandOf,
  latestWeekEnding,
  LAST_WEEK,
} from "@/lib/data";
import { pct, score, shortDate } from "@/lib/format";
import {
  Card,
  CardTitle,
  PageHeader,
  Pill,
  SeverityBadge,
  SimulatedDataNote,
  Term,
} from "@/components/ui";
import { ExpressLiftChart } from "@/components/experiments/charts";

export const metadata: Metadata = {
  title: "AI Search Visibility Scorecard · Growth Marketing Demo",
  description:
    "The whole project in two minutes: how to measure brand visibility in AI answer engines when there are no impressions and no rankings, what it found in a simulated quarter, and why the numbers hold up.",
};

/** Signed percentage-point figure for CI text: 0.139 -> "+13.9" */
const spts = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}`;

export default function HomePage() {
  // Same portfolio math as the scorecard's lead card.
  const products = meta.categories.map((cat) => {
    const brand = adobeBrandOf(cat.id)!;
    const points = blendedSeries(cat.id, brand.id, (r) => r.vs);
    const current = points[points.length - 1].value;
    const target = meta.targets.find((t) => t.category === cat.id);
    return { cat, brand, current, target };
  });
  const portfolioNow = products.reduce((s, p) => s + p.current, 0) / products.length;
  const onPace = products.filter((p) => p.target && p.current >= p.target.q3Target * 0.9).length;

  // Finding figures, computed from the same rows the data is generated from.
  const mr = (c: string, b: string) => weeklyRows({ w: LAST_WEEK, c, e: "chatgpt", b })[0]?.mr ?? 0;
  const acrobatMr = mr("pdf-tools", "acrobat");
  const smallpdfMr = mr("pdf-tools", "smallpdf");
  const fireflyMr = mr("genai-image", "firefly");
  const midjourneyMr = mr("genai-image", "midjourney");
  const genericPrompt = prompts.find((p) => p.id === "p09");
  const fireflyGenericMr = genericPrompt?.perEngine.find((e) => e.e === "chatgpt")?.mr6w ?? 0;

  const express = experiments.find((e) => e.id === "express-content")!;
  const tl = express.treatedLift!;
  const cl = express.controlLift!;
  const did = express.did!;

  const stats = [
    { v: String(meta.categories.length), l: "Adobe products vs competitors" },
    { v: String(meta.engines.length), l: "AI answer engines" },
    { v: String(prompts.length), l: "tracked prompts" },
    { v: String(meta.weeks.length), l: "weeks of weekly samples" },
    { v: String(meta.runsPerPromptEngineWeek), l: "runs per prompt, engine, week" },
    { v: "95%", l: "confidence interval on every rate" },
  ];

  const findings = [
    {
      severity: "win",
      title: "Content changes can move AI answers — with a control panel behind it",
      body: `Restructured Adobe Express help content lifted treated prompts ${spts(tl.liftPts)} pts against a flat control panel — a content effect separated from engine-wide drift, which a before/after read can't do.`,
    },
    {
      severity: "risk",
      title: "Acrobat is named but not linked",
      body: `Acrobat appears in ${pct(acrobatMr)} of sampled ChatGPT answers vs Smallpdf at ${pct(smallpdfMr)} — but on free how-to prompts the cited sources skew to competitor tutorials, and the citation carries the click.`,
    },
    {
      severity: "opportunity",
      title: "Firefly's strength is the differentiated claim",
      body: `Firefly shows far higher on "commercially safe" prompts than on generic discovery (${pct(fireflyGenericMr)} on the generic best-image-generator prompt, where Midjourney runs ${pct(midjourneyMr)} to Firefly's ${pct(fireflyMr)}). The data argues for the licensing wedge.`,
    },
    {
      severity: "risk",
      title: "Visible and wrong at the same time",
      body: `Acrobat's claim accuracy on a high-volume prompt fell from ${pct(trust.headline.pre.rate ?? 0)} to ${pct(trust.headline.dip.rate ?? 0)} during a stale-claim window while mention rate held. A visibility-only read scores that week as a win.`,
    },
  ];

  const discipline = [
    {
      title: "Noise is labeled noise",
      body: `Every rate carries a Wilson 95% interval. When a simulated Gemini update dropped mention rates for every brand one week, it was annotated as a model event — not reported as brand losses.`,
    },
    {
      title: "Nulls are reported as nulls",
      body: `A PR push lifted Firefly's citation share on Perplexity and did nothing detectable on ChatGPT. The split is the finding: earned citations move citation-driven engines first.`,
    },
    {
      title: "Dollars come with assumptions attached",
      body: `No engine reports impressions, so the revenue view models the acquisition arm with every assumption on a slider — and names the upgrade and existing-customer arms as gaps rather than minting numbers.`,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Search Visibility Scorecard"
        subtitle="Measuring — and growing — brand visibility in AI answer engines. Five Adobe products against competitors, five engines, 26 weeks. The whole project in about two minutes."
        right={<Pill>Week ending {shortDate(latestWeekEnding)}, {latestWeekEnding.slice(0, 4)}</Pill>}
      />
      <SimulatedDataNote className="-mt-4" />

      {/* 1. What this is — the reframe + the proof stats */}
      <Card className="border-l-4 border-l-accent">
        <CardTitle>What this is</CardTitle>
        <div className="space-y-2.5 text-sm leading-6 text-foreground/85">
          <p>
            Classic SEO instrumentation doesn&apos;t exist in AI search: answer engines publish no impressions, no
            rankings, no query logs, and the same question gets a different answer on every run. So this system samples a
            fixed <Term def="A fixed list of questions run against each engine on a schedule.">prompt panel</Term> many
            times a week, treats every number as an estimate with a confidence interval, reads content and PR work
            against control panels, and ties visibility to revenue through assumptions stated on the page.
          </p>
          <p>
            It extends a visibility stack a team already has, not replaces it. The real work is the two questions a
            visibility tool can&apos;t answer: is the answer actually <strong className="font-semibold text-foreground">true</strong>,
            and what is it <strong className="font-semibold text-foreground">worth</strong> across the funnel.
            Visibility is table stakes; correctness and worth are the frontier.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-6">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="text-xl font-bold tabular-nums tracking-tight">{s.v}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. The frontier past visibility — the differentiator */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold tracking-tight">Is it true?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            A product can be highly visible and confidently wrong. Acrobat&apos;s claim accuracy on a high-volume prompt
            fell from {pct(trust.headline.pre.rate ?? 0)} to {pct(trust.headline.dip.rate ?? 0)} during a stale-claim
            window — measured as a sampled, human-judged audit with confidence intervals, not assumed.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold tracking-tight">What is it worth?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            AI answers can move revenue in three places: acquisition, existing-customer growth, and plan upgrades. The
            acquisition arm is modeled end to end with every assumption on a slider; the other two are named as honest
            gaps, because sizing them needs data this demo doesn&apos;t have.
          </p>
        </Card>
      </div>

      {/* 3. The one chart to remember — causal rigor in one picture */}
      <Card>
        <CardTitle sub="Adobe Express help content was restructured for four prompts in mid-March; four matched prompts were left alone. Weekly mention rate on ChatGPT and Perplexity, with the 95% band on the treated series.">
          The one chart to remember
        </CardTitle>
        <ExpressLiftChart exp={express} />
        <div className="mt-3 grid gap-3 rounded-lg bg-zinc-50 p-4 sm:grid-cols-3">
          <div>
            <div className="text-[11px] font-medium text-muted">Treated, pre vs post</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-emerald-700">{spts(tl.liftPts)} pts</div>
            <div className="text-[11px] text-muted">95% CI {spts(tl.ciLo)} to {spts(tl.ciHi)}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Control, same window</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums tracking-tight">{spts(cl.liftPts)} pts</div>
            <div className="text-[11px] text-muted">95% CI {spts(cl.ciLo)} to {spts(cl.ciHi)}, ~no change</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Difference-in-differences</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-emerald-700">{spts(did.did)} pts</div>
            <div className="text-[11px] text-muted">95% CI {spts(did.ciLo)} to {spts(did.ciHi)}, clears zero</div>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          The flat control line is the point: it supports a content effect, not an engine-wide shift. The
          difference-in-differences nets the control out, its interval clears zero, and that — not the raw treated lift —
          is the number the experiment actually supports.
        </p>
      </Card>

      {/* 4. Findings — self-contained evidence, no out-links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {findings.map((f) => (
          <Card key={f.title}>
            <SeverityBadge severity={f.severity} />
            <p className="mt-2.5 text-sm font-semibold leading-snug tracking-tight">{f.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.body}</p>
          </Card>
        ))}
      </div>

      {/* 5. Why the numbers hold up */}
      <Card>
        <CardTitle sub="The three habits that separate a dashboard from a decision tool.">
          Why the numbers hold up
        </CardTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {discipline.map((d) => (
            <div key={d.title}>
              <p className="text-sm font-semibold tracking-tight">{d.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.body}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. This week + the two places to go next */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/85">
            This week: portfolio{" "}
            <Term def="Simple average of the five products' usage-weighted Visibility Scores. A summary read for trend and target tracking.">
              Visibility Score
            </Term>{" "}
            <span className="font-bold tabular-nums">{score(portfolioNow)}</span>, {onPace} of {products.length} products
            at 90%+ of their Q3 FY26 target.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/overview" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              See the live scorecard →
            </Link>
            <Link href="/methodology" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              How it works →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
