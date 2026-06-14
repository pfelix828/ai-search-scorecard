import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { meta, prompts } from "@/lib/data";
import { pct } from "@/lib/format";
import { Card, CardTitle, PageHeader, Pill, SimulatedDataNote, Term } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works · AI Search Visibility Scorecard",
  description:
    "The measurement design behind the scorecard: prompt-panel sampling with confidence intervals, treated-vs-control reads, the correctness and worth axes, and the honest limits.",
};

/** External link, opens in a new tab. */
function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
      {children}
    </a>
  );
}

export default function HowItWorksPage() {
  const w = meta.visibilityScoreWeights;
  const engines = meta.engines.map((e) => e.name).join(", ");
  const perCategory = prompts.length / meta.categories.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="How it works"
        subtitle="The measurement design behind the scorecard — sampling, uncertainty, causal reads, and the honest limits. A three-minute skim."
        right={<Pill>Demo framework · simulated data</Pill>}
      />
      <SimulatedDataNote className="-mt-4" />

      {/* Panel & sampling */}
      <Card>
        <CardTitle>Panel and sampling</CardTitle>
        <div className="space-y-2.5 text-sm leading-6 text-foreground/85">
          <p>
            The tracked unit is a fixed{" "}
            <Term def="A fixed list of questions run against each engine on a schedule.">prompt panel</Term>:{" "}
            {prompts.length} prompts ({perCategory} per product category) run against {meta.engines.length} engines
            ({engines}). Each prompt is tagged by intent and demand volume, so high-demand questions count more in the
            rollups. Each prompt-engine pair is sampled {meta.runsPerPromptEngineWeek} times a week, because a single
            answer from a stochastic system is an anecdote, not a measurement.
          </p>
          <p>
            Every mention rate is therefore a binomial estimate and carries a{" "}
            <Term def="A standard error bar on a proportion estimated from limited samples — the range the rate would plausibly fall in on a re-run.">
              Wilson 95% confidence interval
            </Term>
            . Two rules follow: read pooled category-and-week numbers, never single prompt-weeks; and only read position
            when a brand is actually mentioned often enough for the average to mean something. The honest caveat: a
            fixed panel measures the panel, not the full diversity of how real people phrase a question (
            <Ext href="https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/">
              SparkToro, 2026
            </Ext>
            ). Treat it as a consistent yardstick.
          </p>
          <p>
            The headline <strong className="font-semibold text-foreground">Visibility Score</strong> is a 0–100 composite
            of mention rate ({pct(w.mentionRate)}), answer position ({pct(w.position)}), citation share (
            {pct(w.citationShare)}), and sentiment ({pct(w.sentiment)}) — weights chosen for this demo, not measured —
            blended across engines in proportion to each engine&apos;s assumed usage share.
          </p>
        </div>
      </Card>

      {/* Causal reads */}
      <Card>
        <CardTitle>Reading change: treated vs control</CardTitle>
        <div className="space-y-2.5 text-sm leading-6 text-foreground/85">
          <p>
            Content and PR work is read against a matched control panel, not a before/after. The{" "}
            <Link href="/" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
              Express experiment on the Summary
            </Link>{" "}
            is the pattern: treated prompts moved, the control panel stayed flat, and the{" "}
            <Term def="Treated change minus control change — it nets out anything that moved both panels, like an engine model update.">
              difference-in-differences
            </Term>{" "}
            clears zero. That contrast is what separates a content effect from an engine-wide shift; a before/after read
            cannot.
          </p>
          <p>
            Nulls are kept honest too. A simulated Firefly PR push moved citation share on Perplexity and did nothing
            detectable on ChatGPT — reported as the finding (earned citations move citation-driven engines first), not
            buried. And when an engine model update depresses every brand at once, that week is annotated as a
            measurement event, not read as wins and losses.
          </p>
        </div>
      </Card>

      {/* The frontier */}
      <Card>
        <CardTitle sub="Visibility tools optimize who gets mentioned and cited. The two questions past that are where this project does its real work.">
          The frontier: is it true, and what is it worth
        </CardTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-zinc-50 p-4 text-sm leading-6 text-foreground/85">
            <p className="font-semibold tracking-tight">Is it true?</p>
            <p className="mt-1 text-[13px] leading-6">
              A product can be highly visible and confidently wrong, so correctness is a sampled, human-judged audit
              with its own confidence intervals — not an automated fact-checker, and not assumed. The{" "}
              <Link href="/" className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid">
                Acrobat accuracy dip on the Summary
              </Link>{" "}
              is a visibility-only read scoring a stale-claim week as a win.
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-zinc-50 p-4 text-sm leading-6 text-foreground/85">
            <p className="font-semibold tracking-tight">What is it worth?</p>
            <p className="mt-1 text-[13px] leading-6">
              A proxy chain from visibility to sessions to signups to a new-ARR-style figure, with every assumption on a
              slider. It is a proxy model, not an attribution report — no engine reports impressions and most
              AI-influenced visits lose their referrer — so the upgrade and existing-customer arms are named as gaps
              rather than guessed.
            </p>
          </div>
        </div>
      </Card>

      {/* Honest limits */}
      <Card>
        <CardTitle sub="Stated before anyone has to ask.">What this framework cannot tell you</CardTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground/85 marker:text-muted">
          <li>
            Every number is <strong className="font-semibold text-foreground">simulated</strong>, from a seeded,
            deterministic generator — no real answer-engine sampling and no Adobe data. The framework is real; the data
            is a demo.
          </li>
          <li>The fixed panel is a yardstick, not a census of real query volume; the engine usage-share weights that drive blending are assumed, not measured.</li>
          <li>The composite-score weights are an illustrative choice; a different team would calibrate their own and should.</li>
          <li>The worth model is a proxy, not attribution, and it sizes only the acquisition arm.</li>
          <li>The simulator treats each brand&apos;s appearance as independent; real answers are compositional, which makes the statistics here easier than reality.</li>
        </ul>
      </Card>

      {/* Week one */}
      <Card>
        <CardTitle>If this were week one on the job</CardTitle>
        <p className="text-sm leading-6 text-foreground/85">
          The framework transfers; the data source swaps. Inherit the panel and metric definitions the team already runs
          and pressure-test them before changing anything; replace the simulated sampler with production sampling
          (LLM Optimizer prompts or an in-house runner with the same statistics); validate the panel against real query
          and prompt-volume data instead of assumed demand weights; recalibrate the composite weights with the
          stakeholders held to the number; and wire up referral classification so the worth chain starts replacing
          assumptions with measurements.
        </p>
      </Card>

      {/* Grounding */}
      <Card>
        <CardTitle sub="Public sources this framework is grounded in. Links checked June 2026.">Grounding</CardTitle>
        <ul className="grid gap-1.5 pl-5 text-sm leading-6 text-foreground/85 marker:text-muted sm:grid-cols-2" style={{ listStyleType: "disc" }}>
          <li>
            <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
              Adobe LLM Optimizer: Brand Presence dashboards
            </Ext>
          </li>
          <li>
            <Ext href="https://business.adobe.com/blog/building-geo-practice-for-ai-driven-web">
              Adobe: building a GEO practice for the AI-driven web
            </Ext>
          </li>
          <li>
            <Ext href="https://ahrefs.com/blog/brand-radar-methodology/">Ahrefs: Brand Radar methodology</Ext>
          </li>
          <li>
            <Ext href="https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/">
              SparkToro: AIs are inconsistent at recommending brands
            </Ext>
          </li>
          <li>
            <Ext href="https://graphite.io/five-percent/demystifying-randomness-in-ai">
              Graphite: randomness in AI answers (Wilson intervals)
            </Ext>
          </li>
          <li>
            <Ext href="https://arxiv.org/abs/2311.09735">Aggarwal et al.: GEO (KDD 2024)</Ext>
          </li>
        </ul>
      </Card>
    </div>
  );
}
