import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  experiments,
  LAST_WEEK,
  type CitationSeriesPoint,
  type Experiment,
} from "@/lib/data";
import { pct, shortDate } from "@/lib/format";
import { Card, CardTitle, PageHeader, Pill, SimulatedDataNote, Term } from "@/components/ui";
import { ExpressLiftChart, FireflyCitationChart } from "@/components/experiments/charts";

export const metadata: Metadata = {
  title: "Experiments · AI Search Visibility Scorecard",
  description:
    "Two simulated experiments on AI answer-engine visibility: a help-content restructure and a PR push, read with treated vs control prompt panels and pooled pre/post windows.",
};

/* ---------- helpers (display only; lift stats come straight from the data) ---------- */

/** Render-time cleanup for data-file copy: this UI avoids em dashes. */
const cleanCopy = (s: string) => s.replace(/\s*—\s*/g, ": ");

/** "+13.8" style signed percentage points. */
const signedPts = (x: number, digits = 1) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}`;

/** Plain average of the `cit` field over an inclusive week-index window. */
function windowAvg(series: CitationSeriesPoint[] | undefined, from: number, to: number) {
  const vals = (series ?? []).filter((p) => p.w >= from && p.w <= to).map((p) => p.cit);
  return vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
}

const STATUS_STYLES: Record<Experiment["status"], { cls: string; label: string }> = {
  positive: { cls: "bg-emerald-50 text-emerald-700", label: "Positive" },
  mixed: { cls: "bg-amber-50 text-amber-800", label: "Mixed" },
  null: { cls: "bg-zinc-100 text-zinc-600", label: "Null" },
};

function StatusBadge({ status }: { status: Experiment["status"] }) {
  const s = STATUS_STYLES[status];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

/** Stat block with a visible sub-line (the shared Stat hides hints in a tooltip). */
function LiftStat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white p-3">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-foreground">{children}. </span>;
}

/* ---------- page ---------- */

export default function ExperimentsPage() {
  const express = experiments.find((e) => e.id === "express-content");
  const firefly = experiments.find((e) => e.id === "firefly-pr");
  if (!express || !firefly) return null;

  const tl = express.treatedLift;
  const cl = express.controlLift;

  // Descriptive pre/post averages for the Firefly chart (no lift stats exist in
  // the data for this experiment, so these are plain averages of the plotted series).
  const iw = firefly.interventionWeek;
  const prePerp = windowAvg(firefly.perplexitySeries, iw - 6, iw - 1);
  const postPerp = windowAvg(firefly.perplexitySeries, LAST_WEEK - 5, LAST_WEEK);
  const preChat = windowAvg(firefly.chatgptSeries, iw - 6, iw - 1);
  const postChat = windowAvg(firefly.chatgptSeries, LAST_WEEK - 5, LAST_WEEK);

  const playbookSteps = [
    {
      title: "Pick a measurable gap",
      body: "Start from the weekly scorecard: a category where mention rate, citation share, or sentiment trails a competitor by enough points to matter.",
    },
    {
      title: "Build matched prompt panels",
      body: "Design treated and control prompt sets matched on intent and ask volume, so the only planned difference is the change shipped behind the treated set.",
    },
    {
      title: "Ship one change",
      body: "One content or PR change at a time. Bundled changes cannot be separated afterward, so a clean read needs a single intervention.",
    },
    {
      title: "Read pooled pre and post windows",
      body: "After a 4-week ramp, compare pooled pre and post mention or citation rates with confidence intervals. Engines refresh their source material on different schedules, so lifts ramp rather than step.",
    },
    {
      title: "Write the decision, roll the pattern",
      body: "Record what shipped, what moved, and what stayed flat, then apply the winning pattern to the next category. Nulls get written up too: knowing where a tactic does not work is part of the playbook.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        subtitle="How content and PR changes get tested when answer engines offer no clean ground truth. Two simulated case studies: a help-content restructure for Adobe Express and a commercial-safety PR push for Firefly."
      />
      <SimulatedDataNote />

      {/* Why no clean ground truth */}
      <Card>
        <CardTitle>Why there is no clean ground truth here</CardTitle>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>
            A classic A/B test randomizes which users see which experience and reads the difference. Answer
            engines do not allow that. We cannot control what ChatGPT or Perplexity says, we cannot randomize
            who asks it what, and we cannot observe when each engine refreshes the content its answers draw
            on.
          </p>
          <p>
            So these designs lean on two substitutes. First,{" "}
            <Term def="Ship a change behind one set of prompts and leave a matched set of prompts alone. The untouched set absorbs whatever the engines do on their own.">
              treated versus control prompt panels
            </Term>
            : the control panel catches engine-wide drift, like a model update, that would otherwise look
            like a result. Second,{" "}
            <Term def="Average several weeks of sampled answers on each side of the change instead of comparing single weeks.">
              pooled pre and post windows
            </Term>
            : any single week of sampled answers is noisy, so reads pool roughly six weeks on each side.
          </p>
          <p>
            A lift only counts when its{" "}
            <Term def="The range the true value would land in about 95 times out of 100 if the same sampling were repeated. Wider interval means less certainty.">
              95% confidence interval
            </Term>{" "}
            sits clearly above zero while the control stays flat.
          </p>
        </div>
      </Card>

      {/* Experiment 1 */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Experiment 1: {express.name}</h3>
          <StatusBadge status={express.status} />
          <Pill>Pre/post split: week ending {shortDate(express.interventionDate)}, 2026</Pill>
        </div>
        <p className="text-sm text-foreground/80">{cleanCopy(express.design)}</p>
        <p className="mt-2 text-xs text-muted">
          Outcome metric:{" "}
          <Term def="The share of sampled answers in which the brand is named at all.">mention rate</Term>{" "}
          for Adobe Express, the share of sampled answers that name the product, on ChatGPT and Perplexity
          combined.
        </p>

        <div className="mt-4">
          <ExpressLiftChart exp={express} />
        </div>

        {tl && cl ? (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LiftStat
              label="Treated, pre"
              value={pct(tl.pre, 1)}
              sub="Pooled 6-week window before the change"
            />
            <LiftStat
              label="Treated, post"
              value={pct(tl.post, 1)}
              sub="Pooled 6-week window after the change"
            />
            <LiftStat
              label="Treated lift"
              value={<span className="text-emerald-700">{signedPts(tl.liftPts)} pts</span>}
              sub={`95% CI ${signedPts(tl.ciLo)} to ${signedPts(tl.ciHi)} pts`}
            />
            <LiftStat
              label="Control lift"
              value={`${signedPts(cl.liftPts)} pts`}
              sub={`95% CI ${signedPts(cl.ciLo)} to ${signedPts(cl.ciHi)} pts, flat`}
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-foreground/80">
            <SectionLabel>Readout</SectionLabel>
            {cleanCopy(express.readout)}
          </p>
          <p className="text-muted">
            <SectionLabel>Limitations</SectionLabel>
            {cleanCopy(express.caveats)}
          </p>
        </div>
      </Card>

      {/* Experiment 2 */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Experiment 2: {firefly.name}</h3>
          <StatusBadge status={firefly.status} />
          <Pill>Pre/post split: week ending {shortDate(firefly.interventionDate)}, 2026</Pill>
        </div>
        <p className="text-sm text-foreground/80">{cleanCopy(firefly.design)}</p>
        <p className="mt-2 text-xs text-muted">
          Outcome metric:{" "}
          <Term def="The brand's share of all sources an engine cites across sampled answers.">
            citation share
          </Term>{" "}
          for Firefly, the share of an engine&apos;s cited sources that point to Firefly content, tracked
          separately on Perplexity and ChatGPT.
        </p>

        <div className="mt-4">
          <FireflyCitationChart exp={firefly} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LiftStat label="Perplexity, pre" value={pct(prePerp, 1)} sub="Average of the 6 weeks before the split" />
          <LiftStat label="Perplexity, post" value={pct(postPerp, 1)} sub="Average of the final 6 weeks" />
          <LiftStat label="ChatGPT, pre" value={pct(preChat, 1)} sub="Average of the 6 weeks before the split" />
          <LiftStat label="ChatGPT, post" value={pct(postChat, 1)} sub="Average of the final 6 weeks, no detectable change" />
        </div>
        <p className="mt-2 text-xs text-muted">
          These pre and post values are plain averages of the plotted simulated series, shown for scale. This
          experiment&apos;s log does not include per-week sample counts for citation share, so no confidence
          interval is attached to them.
        </p>

        <div className="mt-4 rounded-lg border-l-4 border-zinc-300 bg-zinc-50 p-3 text-sm text-foreground/80">
          <span className="font-semibold">Reading the null:</span> the flat ChatGPT line is a result, not a
          failure. It tells the PR and content teams where earned citations move visibility and where they do
          not, which is exactly what the next dollar of effort needs to know. A process that only reports
          wins cannot do that.
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-foreground/80">
            <SectionLabel>Readout</SectionLabel>
            {cleanCopy(firefly.readout)}
          </p>
          <p className="text-muted">
            <SectionLabel>Limitations</SectionLabel>
            {cleanCopy(firefly.caveats)}
          </p>
        </div>
      </Card>

      {/* Playbook loop */}
      <Card>
        <CardTitle sub="Each experiment feeds the playbook, and the playbook feeds the roadmap.">
          The playbook loop
        </CardTitle>
        <ol className="space-y-3">
          {playbookSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold">{step.title}</div>
                <p className="text-sm text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-foreground/80">
          The Express result above is step 5 in action: the direct-answer content pattern that lifted treated
          prompts is queued for the PDF panel next, where citations currently leak to competitor how-to
          pages. The Firefly null narrows the PR playbook to citation-forward engines first.
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          One property of this loop worth naming: citation wins compound. Engines cite a mostly evergreen corpus of
          tutorials, reviews, and help content, so a piece that earns citations this quarter keeps appearing in
          answers next quarter. That makes the experiment cadence a long-horizon investment program, not a series of
          campaign spikes, and it is why nulls are cheap to report: the portfolio, not any single test, carries the
          return.
        </p>
      </Card>
    </div>
  );
}
