import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { trust, type TrustRate, type TrustExampleCheck } from "@/lib/data";
import { pct, shortDate } from "@/lib/format";
import { Card, CardTitle, PageHeader, Pill, SimulatedDataNote, Term } from "@/components/ui";
import { Legend, WeeklyChart, type SeriesDef, type WeeklyPoint } from "@/components/charts";
import { ADOBE_RED } from "@/lib/colors";

export const metadata: Metadata = {
  title: "Answer Trust · AI Search Visibility Scorecard",
  description:
    "The correctness axis: is what an AI engine says about the product true, and does the cited source back the claim. A sampled, human-adjudicated audit with confidence intervals. Simulated demo data.",
};

const signedPts = (x: number, digits = 0) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}`;

/** One pooled pass-rate with its confidence interval and judged-sample size. */
function RateCell({ rate, hint }: { rate: TrustRate; hint?: string }) {
  if (rate.rate === null) {
    return <span className="text-muted">no judged sample</span>;
  }
  return (
    <div title={hint}>
      <span className="text-lg font-bold tabular-nums tracking-tight">{pct(rate.rate)}</span>
      <span className="ml-1.5 text-[11px] text-muted tabular-nums">
        95% CI {pct(rate.lo!)} to {pct(rate.hi!)}
      </span>
      <div className="text-[10px] text-muted">n = {rate.n.toLocaleString()} judged answers</div>
    </div>
  );
}

const VERDICT_STYLES: Record<TrustExampleCheck["verdict"], { cls: string; label: string }> = {
  pass: { cls: "bg-emerald-50 text-emerald-700", label: "Pass" },
  partial: { cls: "bg-amber-50 text-amber-800", label: "Partial" },
  fail: { cls: "bg-red-50 text-red-700", label: "Fail" },
};

function VerdictBadge({ verdict }: { verdict: TrustExampleCheck["verdict"] }) {
  const s = VERDICT_STYLES[verdict];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-foreground/85">{children}</p>;
}

export default function TrustPage() {
  const t = trust;
  const hl = t.headline;

  // Headline trend: Acrobat claim accuracy on ChatGPT for the free-edit prompt.
  const trendData: WeeklyPoint[] = t.headlineTrend.map((p) => ({ week: p.week, rate: p.rate }));
  const trendSeries: SeriesDef[] = [
    { key: "rate", name: "Acrobat claim accuracy on ChatGPT, free-edit prompt", color: ADOBE_RED },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Answer Trust"
        subtitle="Visibility says who gets mentioned and cited. This page measures the next axis: is what the engine says about the product correct, and does the page it cited actually back the claim. Sampled, human-judged, every rate with a confidence interval."
        right={<Pill>Pooled window: {t.windowLabel}</Pill>}
      />
      <SimulatedDataNote />

      {/* 1. Why correctness is its own axis */}
      <Card className="border-l-4 border-l-accent">
        <CardTitle>Why correctness is a separate axis from visibility</CardTitle>
        <div className="space-y-2.5">
          <P>
            The rest of this scorecard measures visibility: mentions, citation share, position, sentiment, the
            composite. That layer answers who the engines name and link, and it speaks the vocabulary of the tools
            built to optimize it. It does not answer a second question that matters just as much: when an engine talks
            about the product, is what it says true, and does the page it cites actually support the claim.
          </P>
          <P>
            A product can be highly visible and confidently wrong at the same time. In this simulation Adobe Acrobat is
            named in most PDF answers, yet for a stretch its{" "}
            <Term def="The share of sampled answers making a checkable claim about the product where the claim is judged correct and current.">
              claim-accuracy rate
            </Term>{" "}
            falls on the high-volume free-editing prompt after a plan change the engines have not caught up to. A
            visibility-only read scores that week as a win. This is the axis the field is only now opening up, and it is
            what this page adds on top of the visibility measurement.
          </P>
        </div>
      </Card>

      {/* 2. How it is measured (adjudication design) */}
      <Card>
        <CardTitle sub="A measurement-and-adjudication design, not an automated fact checker.">
          How this is measured
        </CardTitle>
        <div className="space-y-2.5">
          <P>
            We do not run a model that decides what is true. A person judges a sample of answers against a maintained
            ground-truth sheet of current prices, free-tier contents, and features, and the result is reported as a
            rate with a confidence interval, the same way every other number on this site is reported. In production a
            language model can act as a first-pass scorer that a person spot-checks, validated against the human
            sample; here the judged outcomes are simulated parameters, labeled as such.
          </P>
          <P>
            Adjudication is run on a sample, not on everything: {t.adjudicatedPromptCount} high-value prompts out of{" "}
            {t.totalPromptCount}, {t.judgedPerPromptEngineWeek} judged answers per prompt, engine, and week. Because
            judged samples are small, every rate below pools a {t.window}-week window and carries a Wilson 95% interval.
            Single weeks are noise; the windows are the read.
          </P>
          <div className="grid gap-3 sm:grid-cols-3">
            {t.checks.map((c) => (
              <div key={c.key} className="rounded-lg border border-border-subtle bg-zinc-50 p-3">
                <div className="text-sm font-semibold tracking-tight">{c.name}</div>
                <p className="mt-1 text-xs leading-snug text-muted">{c.def}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. The three rates per product */}
      <Card>
        <CardTitle sub={`Pooled over the ${t.window}-week window across the five engines and the adjudicated prompts in each product's category. Read the three checks, not a single blended score.`}>
          Correctness by product
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-semibold">Product</th>
                <th className="py-2 pr-4 font-semibold">
                  <Term def="Of sampled answers making a checkable factual claim, the share judged correct and current.">
                    Claim accuracy
                  </Term>
                </th>
                <th className="py-2 pr-4 font-semibold">
                  <Term def="Of sampled answers citing a source for a claim, the share where the cited page actually supports it and the link resolves.">
                    Citation support
                  </Term>
                </th>
                <th className="py-2 font-semibold">
                  <Term def="Of sampled answers naming the product, the share with no misattribution between Adobe and a competitor.">
                    Attribution correctness
                  </Term>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {t.byProduct.map((row) => (
                <tr key={row.b}>
                  <td className="py-3 pr-4 align-top font-medium">{row.name}</td>
                  <td className="py-3 pr-4 align-top">
                    <RateCell rate={row.claimAccuracy} />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <RateCell rate={row.citationSupport} />
                  </td>
                  <td className="py-3 align-top">
                    <RateCell rate={row.attributionCorrectness} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Two standing gaps stand out in this simulated quarter. Acrobat&apos;s citation-support rate trails its claim
          accuracy: engines name it and get the facts right, but on free how-to prompts they cite competitor tutorials
          that only partly back the workflow the answer describes, which is the citation-leak story from the PDF
          category seen from the correctness side. Firefly&apos;s attribution rate is the lowest cell: its
          licensed-data, commercial-safety wedge is real, but engines sometimes describe it without naming Firefly or
          credit it to a competitor. Both are different problems from not being mentioned, and a visibility metric
          cannot see either.
        </p>
      </Card>

      {/* 4. The headline accuracy dip */}
      <Card>
        <CardTitle sub={`${hl.brandName} claim accuracy on ChatGPT for "${hl.promptText}". Weekly points are noisy at ${t.judgedPerPromptEngineWeek} judged answers; read the pooled pre and dip windows below.`}>
          A worked accuracy defect: a stale free-tier claim
        </CardTitle>
        <WeeklyChart
          data={trendData}
          series={trendSeries}
          yPercent
          yDomain={[0, 1]}
          height={240}
          events={[{ week: hl.dipWeek, label: "Claim goes stale" }]}
        />
        <Legend series={trendSeries} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-white p-3">
            <div className="text-xs font-medium text-muted">Pre, pooled 6 weeks</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{pct(hl.pre.rate!)}</div>
            <div className="text-[11px] text-muted">
              95% CI {pct(hl.pre.lo!)} to {pct(hl.pre.hi!)}, n = {hl.pre.n}
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-white p-3">
            <div className="text-xs font-medium text-muted">During the dip, pooled</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-red-700">{pct(hl.dip.rate!)}</div>
            <div className="text-[11px] text-muted">
              95% CI {pct(hl.dip.lo!)} to {pct(hl.dip.hi!)}, n = {hl.dip.n}
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-white p-3">
            <div className="text-xs font-medium text-muted">Change, with its own interval</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-red-700">{signedPts(hl.change.diffPts)} pts</div>
            <div className="text-[11px] text-muted">
              95% CI {signedPts(hl.change.ciLo)} to {signedPts(hl.change.ciHi)} pts
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/85">
          The drop is stated as a contrast with its own confidence interval rather than as two intervals to eyeball,
          and the interval clears zero, so the dip is a real change at this sample size, not noise. The mechanism in
          the simulation: a plan change made an older &ldquo;edit free in the browser&rdquo; claim stale, and ChatGPT
          and Copilot kept repeating it for a few weeks before their source material caught up. High mention rate, high
          visibility, falling accuracy on one of the highest-volume buying prompts in the category.
        </p>
      </Card>

      {/* 5. Defect ranking / early-warning feed */}
      <Card>
        <CardTitle sub="One row per audited prompt: its weakest correctness check, on the engine where it is worst, pooled over the window, ranked by how many weekly asks sit behind the gap. A wrong claim on a high-volume buying prompt outranks the same gap on a niche one.">
          Where the wrong claims sit
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-semibold">Prompt</th>
                <th className="py-2 pr-3 font-semibold">Engine</th>
                <th className="py-2 pr-3 font-semibold">Weakest check</th>
                <th className="py-2 pr-3 font-semibold">Pass rate</th>
                <th className="py-2 font-semibold">Est. weekly asks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {t.defects.map((d, i) => (
                <tr key={`${d.promptText}-${d.engine}-${i}`}>
                  <td className="py-2.5 pr-3 align-top">
                    <span className="font-medium">{d.promptText}</span>
                    <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                      {d.intent}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 align-top text-muted">{d.engine}</td>
                  <td className="py-2.5 pr-3 align-top">{d.checkLabel}</td>
                  <td className="py-2.5 pr-3 align-top tabular-nums">
                    {pct(d.rate)}
                    <span className="ml-1 text-[10px] text-muted">
                      [{pct(d.lo)}–{pct(d.hi)}]
                    </span>
                  </td>
                  <td className="py-2.5 align-top tabular-nums text-muted">{d.estWeeklyAsks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Read the other direction, this is a defensive feed. Engines making wrong or unsupported claims about the
          brand on high-traffic prompts is a brand-trust risk a strategist should surveil the way an advertising team
          watches brand safety, and the same sample catches competitors&apos; inaccurate claims as competitive
          intelligence. The strategist&apos;s job here is to surface and rank the signal; acting on it is the content,
          PR, and budget owners&apos; call.
        </p>
      </Card>

      {/* 6. Worked adjudication examples */}
      <Card>
        <CardTitle sub="Two sampled answers, scored against the rubric. Ground-truth notes are demo conventions, not statements about any product's real pricing or features.">
          What an adjudication looks like
        </CardTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          {t.examples.map((ex) => (
            <div key={ex.promptText} className="rounded-lg border border-border-subtle bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{ex.engine}</Pill>
                <span className="text-xs font-medium text-muted">{ex.promptText}</span>
              </div>
              <p className="mt-2 rounded-md border border-border-subtle bg-white p-3 text-sm leading-6 text-foreground/85">
                {ex.answerText}
              </p>
              <p className="mt-1 text-[10px] italic text-muted">{ex.note}</p>
              <ul className="mt-3 space-y-2">
                {ex.checks.map((c) => (
                  <li key={c.label} className="flex gap-2.5">
                    <span className="shrink-0">
                      <VerdictBadge verdict={c.verdict} />
                    </span>
                    <span className="text-xs leading-snug text-foreground/80">
                      <span className="font-semibold">{c.label}.</span> {c.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Limits */}
      <Card>
        <CardTitle>What this audit cannot tell you</CardTitle>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground/85 marker:text-muted">
          <li>
            Adjudication is judgment, so it needs a written rubric and more than one judge. Two people can disagree on
            &ldquo;partially correct,&rdquo; so a real audit dual-judges a subset and reports inter-rater agreement.
            This demo does not model that disagreement; it is the first thing a production version would add.
          </li>
          <li>
            Judged samples are small and expensive, so single-week rates are unreadable and every number here is pooled
            over a multi-week window. The intervals are wide on purpose.
          </li>
          <li>
            Coverage is a sample of high-value prompts, not every answer. A clean correctness read on the prompts that
            matter most beats a noisy one on everything.
          </li>
          <li>
            The ground-truth sheet has to be maintained as prices and features change. A stale rubric would flag
            correct answers as wrong, which is its own failure mode.
          </li>
          <li>
            Everything here is simulated, including the planted accuracy dip and the example answers. The framework and
            the statistics are real; the numbers are not.{" "}
            <Link href="/methodology" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
              See the methodology
            </Link>
            .
          </li>
        </ol>
        <p className="mt-3 text-xs text-muted">Latest pooled window ends {shortDate(t.windowLabel.split(" to ")[1])}.</p>
      </Card>
    </div>
  );
}
