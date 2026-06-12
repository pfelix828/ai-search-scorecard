import type { Metadata } from "next";
import Link from "next/link";
import {
  meta,
  prompts,
  experiments,
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
  title: "Executive Summary · AI Search Visibility Scorecard",
  description:
    "The whole project in two minutes: what this measurement system is, what it found in the simulated quarter, and why its numbers hold up in a budget conversation.",
};

/** Signed percentage-point figure for CI text: 0.139 -> "+13.9" */
const spts = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}`;

export default function SummaryPage() {
  // Same portfolio math as the Overview lead card.
  const products = meta.categories.map((cat) => {
    const brand = adobeBrandOf(cat.id)!;
    const points = blendedSeries(cat.id, brand.id, (r) => r.vs);
    const current = points[points.length - 1].value;
    const target = meta.targets.find((t) => t.category === cat.id);
    return { cat, brand, current, target };
  });
  const portfolioNow = products.reduce((s, p) => s + p.current, 0) / products.length;
  const onPace = products.filter((p) => p.target && p.current >= p.target.q3Target * 0.9).length;

  // Finding figures, computed from the same rows the detail pages render.
  const mr = (c: string, b: string) => weeklyRows({ w: LAST_WEEK, c, e: "chatgpt", b })[0]?.mr ?? 0;
  const acrobatMr = mr("pdf-tools", "acrobat");
  const smallpdfMr = mr("pdf-tools", "smallpdf");
  const fireflyMr = mr("genai-image", "firefly");
  const midjourneyMr = mr("genai-image", "midjourney");
  const genericPrompt = prompts.find((p) => p.id === "p09");
  const fireflyGenericMr = genericPrompt?.perEngine.find((e) => e.e === "chatgpt")?.mr ?? 0;

  const express = experiments.find((e) => e.id === "express-content")!;
  const tl = express.treatedLift!;
  const cl = express.controlLift!;

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
      title: "Content changes move AI answers, and a control panel proves it",
      body: `Restructured Adobe Express help content lifted treated prompts ${spts(tl.liftPts)} points against a flat control panel. That separates a content effect from an engine-wide drift, which a before/after read cannot do.`,
      link: "/experiments",
      linkLabel: "See the experiment",
    },
    {
      severity: "risk",
      title: "Acrobat is named but not linked",
      body: `Acrobat appears in ${pct(acrobatMr)} of sampled ChatGPT answers in its category, far ahead of Smallpdf at ${pct(smallpdfMr)}. But on free how-to prompts the cited sources skew to competitor tutorials, and the citation is what carries the click.`,
      link: "/categories/pdf-tools",
      linkLabel: "See the citation gap",
    },
    {
      severity: "opportunity",
      title: "Firefly wins the differentiated claim, not the generic one",
      body: `Firefly leads on "commercially safe" prompts but reaches only ${pct(fireflyGenericMr)} on the generic best-image-generator prompt, in a category where Midjourney's mention rate is ${pct(midjourneyMr)} to Firefly's ${pct(fireflyMr)}. The data argues for concentrating on the licensing wedge.`,
      link: "/categories/genai-image",
      linkLabel: "See the category",
    },
  ];

  const discipline = [
    {
      title: "Noise is labeled noise",
      body: `Every mention rate is an estimate from limited samples and carries a Wilson 95% interval. When a simulated Gemini model update dropped rates 15 to 25 percent relative across all brands in one week, the system flagged volatility instead of declaring losses.`,
      link: "/methodology",
      linkLabel: "Sampling and uncertainty",
    },
    {
      title: "Null results are reported as nulls",
      body: `A PR push lifted Firefly's citation share on Perplexity and did nothing detectable on ChatGPT. The split is presented as the finding: earned citations move citation-driven engines first.`,
      link: "/experiments",
      linkLabel: "The honest null",
    },
    {
      title: "Dollars come with assumptions attached",
      body: `No engine reports impressions and most AI-influenced visits lose their referrer, so the revenue view is a proxy model with every assumption stated and adjustable, not false precision.`,
      link: "/outcomes",
      linkLabel: "The proxy model",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Executive Summary"
        subtitle="The whole project in two minutes: what this system is, what it found in the simulated quarter, and why its numbers hold up in a budget conversation."
        right={<Pill>Week ending {shortDate(latestWeekEnding)}, {latestWeekEnding.slice(0, 4)}</Pill>}
      />
      <SimulatedDataNote className="-mt-4" />

      {/* 1. What this is */}
      <Card className="border-l-4 border-l-accent">
        <CardTitle>What this is</CardTitle>
        <div className="space-y-2.5 text-sm leading-6 text-foreground/85">
          <p>
            A working model of how to measure, and then grow, brand visibility in AI search, a channel where classic
            SEO instrumentation does not exist. It tracks five Adobe products against competitors across five answer
            engines for 26 weeks, on simulated data.
          </p>
          <p>
            Answer engines publish no impression counts, no rankings, and no query logs, and the same question can get
            a different answer on every run. So this system samples a fixed{" "}
            <Term def="A fixed list of questions run against each engine on a schedule.">prompt panel</Term> many times
            each week, treats every number as an estimate with a confidence interval, reads content work through
            treated-versus-control experiments, and connects visibility to revenue through assumptions stated on the
            page rather than buried in a model.
          </p>
          <p>
            It is built to extend a first-generation visibility stack, not replace it: the uncertainty quantification,
            experiment discipline, and outcome modeling that turn a tracker into evidence.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="text-xl font-bold tabular-nums tracking-tight">{s.v}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. The one chart to remember */}
      <Card>
        <CardTitle
          sub="Adobe Express help content was restructured for four prompts in mid-March; four matched prompts were left alone. Weekly mention rate on ChatGPT and Perplexity, with the 95% confidence band on the treated series."
        >
          The one chart to remember
        </CardTitle>
        <ExpressLiftChart exp={express} />
        <div className="mt-3 grid gap-3 rounded-lg bg-zinc-50 p-4 sm:grid-cols-3">
          <div>
            <div className="text-[11px] font-medium text-muted">Treated prompts, pre vs post</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-emerald-700">
              {spts(tl.liftPts)} pts
            </div>
            <div className="text-[11px] text-muted">
              95% CI {spts(tl.ciLo)} to {spts(tl.ciHi)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Control prompts, same window</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums tracking-tight">{spts(cl.liftPts)} pts</div>
            <div className="text-[11px] text-muted">
              95% CI {spts(cl.ciLo)} to {spts(cl.ciHi)}, consistent with no change
            </div>
          </div>
          <div className="text-xs leading-relaxed text-muted sm:self-center">
            The flat control line is the point: it supports a content-driven mechanism rather than an engine-wide
            shift, which a simple before/after read could not show.
          </div>
        </div>
      </Card>

      {/* 3. Three findings */}
      <div className="grid gap-3 lg:grid-cols-3">
        {findings.map((f) => (
          <Card key={f.title}>
            <SeverityBadge severity={f.severity} />
            <p className="mt-2.5 text-sm font-semibold leading-snug tracking-tight">{f.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.body}</p>
            <Link
              href={f.link}
              className="mt-2 inline-block text-xs font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              {f.linkLabel}
            </Link>
          </Card>
        ))}
      </div>

      {/* 4. Decision discipline */}
      <Card>
        <CardTitle sub="The three habits that make the difference between a dashboard and a decision tool.">
          Why the numbers hold up
        </CardTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {discipline.map((d) => (
            <div key={d.title}>
              <p className="text-sm font-semibold tracking-tight">{d.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.body}</p>
              <Link
                href={d.link}
                className="mt-1.5 inline-block text-xs font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                {d.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Where the portfolio stands + tour */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/85">
            This week's read: portfolio{" "}
            <Term def="Simple average of the five products' usage-weighted Visibility Scores. A summary read for trend and target tracking.">
              Visibility Score
            </Term>{" "}
            <span className="font-bold tabular-nums">{score(portfolioNow)}</span>, with {onPace} of{" "}
            {products.length} products at 90% or more of their Q3 FY26 target.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link href="/" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              Overview: the weekly scorecard
            </Link>
            <Link href="/experiments" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              Experiments: the proof pattern
            </Link>
            <Link href="/methodology" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              Methodology: the framework and its limits
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
