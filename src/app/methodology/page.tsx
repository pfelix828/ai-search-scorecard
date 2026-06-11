import type { Metadata } from "next";
import type { ReactNode } from "react";
import { meta, prompts } from "@/lib/data";
import { Card, CardTitle, PageHeader, Pill, SimulatedDataNote, Term } from "@/components/ui";

export const metadata: Metadata = {
  title: "Methodology · AI Search Visibility Scorecard",
  description:
    "How this scorecard measures brand visibility in AI answer engines: panel design, sampling with uncertainty, metric definitions, outcome proxies, and honest limitations.",
};

/** External link, opens in a new tab. */
function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-dotted underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-foreground/85">{children}</p>;
}

const th = "py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted";
const td = "py-2.5 pr-4 align-top text-sm leading-5 text-foreground/85";

export default function MethodologyPage() {
  const w = meta.visibilityScoreWeights;
  const engines = meta.engines.map((e) => e.name).join(", ");
  const nCategories = meta.categories.length;
  const promptsPerCategory = prompts.length / nCategories;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Methodology"
        subtitle="How this scorecard measures brand visibility in AI answer engines, why each number is built the way it is, and where the framework's honest limits are."
        right={<Pill>Demo framework, simulated data</Pill>}
      />
      <SimulatedDataNote className="-mt-3" />

      {/* 1 */}
      <Card>
        <CardTitle>1. Why AI search needs its own measurement</CardTitle>
        <div className="space-y-3">
          <P>
            Classic search measurement leans on plumbing the search engine provides: impression counts, a rank for
            every query, click logs. AI answer engines provide none of that. ChatGPT, Google AI Overviews, Gemini,
            Perplexity, and Copilot synthesize a written answer instead of returning a ranked list of links, so there
            is no rank to track, no impression count to read, and no query log to mine.
          </P>
          <P>
            The answers also change from run to run. Asking the same engine the same question twice routinely returns
            a different set of recommended brands, so any single answer is an anecdote, not a measurement.
          </P>
          <P>
            That forces a different shape of measurement: sample the same prompts repeatedly, estimate visibility
            with explicit uncertainty, and connect visibility to business outcomes through stated, arguable
            assumptions rather than through tracking pixels. That is what this scorecard does, and this page
            documents each piece.
          </P>
        </div>
      </Card>

      {/* 2 */}
      <Card>
        <CardTitle>2. Panel design</CardTitle>
        <div className="space-y-3">
          <P>
            The tracked unit is a <Term def="A fixed list of questions run against each engine on a schedule.">prompt
            panel</Term>: {prompts.length} prompts, {nCategories} product categories with {promptsPerCategory} prompts
            each, run against {meta.engines.length} engines ({engines}). Each prompt is tagged with an intent stage
            (discovery, evaluation, how-to, suitability) and a volume bucket (high, medium, low) that weights it 3, 2,
            or 1 in category rollups, so high-demand questions count more than niche ones.
          </P>
          <P>
            This mirrors how production tools work. Adobe LLM Optimizer licenses tracked prompts that are analyzed
            daily and rolled up into weekly trends (
            <Ext href="https://business.adobe.com/products/llm-optimizer/pricing.html">pricing docs</Ext>). Peec and
            Profound run curated prompt panels on a schedule. Ahrefs takes the other route and models a
            demand-weighted prompt corpus instead of curating one (
            <Ext href="https://ahrefs.com/blog/brand-radar-methodology/">Brand Radar methodology</Ext>).
          </P>
          <P>
            The honest caveat: a fixed panel under-samples how real people phrase things. SparkToro had volunteers
            express the same intent in their own words and found very low semantic similarity between phrasings (
            <Ext href="https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/">
              Jan 2026 study
            </Ext>
            ). A panel measures the panel; treat it as a consistent yardstick, not a census of real queries.
          </P>
        </div>
      </Card>

      {/* 3 */}
      <Card>
        <CardTitle>3. Sampling and uncertainty</CardTitle>
        <div className="space-y-3">
          <P>
            Each prompt-engine pair is sampled {meta.runsPerPromptEngineWeek}{" "}times per week in this demo design (10
            runs daily across 7 days). A brand&rsquo;s{" "}
            <Term def="The share of sampled runs where the brand appears anywhere in the answer.">mention rate</Term>{" "}
            is then a binomial estimate: out of n runs, the brand appeared in k. Every mention rate in this app
            carries a Wilson 95% confidence interval, a standard way to put honest error bars on a proportion
            estimated from limited samples.
          </P>
          <P>
            Why the error bars matter, using Graphite&rsquo;s worked example: 16 mentions in 20 runs reads as 80%, but the
            honest 95% interval is roughly 58% to 92% (
            <Ext href="https://graphite.io/five-percent/demystifying-randomness-in-ai">
              Graphite on randomness in AI answers
            </Ext>
            ). A single-day, single-prompt number can swing wildly without anything real changing.
          </P>
          <P>
            Three rules follow from that. Aggregate at the category and week level rather than reading individual
            prompt-days. Only read{" "}
            <Term def="Where in the answer the brand first appears; 1 means it led the answer.">average position</Term>{" "}
            when visibility is meaningful, because a position average over two mentions is noise. And only score{" "}
            <Term def="The tone of the language around the mention, from negative to positive.">sentiment</Term> when
            the brand is actually mentioned: no mention means no sentiment reading, not a neutral one.
          </P>
        </div>
      </Card>

      {/* 4 */}
      <Card>
        <CardTitle sub="Every metric in the app, in plain language.">4. Metric definitions</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className={th}>Metric</th>
                <th className={th}>What it means</th>
                <th className={th}>How it is read here</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Mention rate</td>
                <td className={td}>Share of sampled runs where the brand appears anywhere in the answer.</td>
                <td className={td}>
                  Estimated per prompt, engine, and week; volume-weighted into category rollups; shown with a Wilson
                  95% interval wherever rates are tabulated; category rollup intervals use the volume-weighted
                  effective sample size.
                </td>
              </tr>
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Share of voice</td>
                <td className={td}>
                  The brand&rsquo;s mentions as a share of all tracked brands&rsquo; mentions in the same category and engine.
                </td>
                <td className={td}>
                  Sums to 100% across tracked brands, so it moves when competitors move even if your own mention rate
                  is flat.
                </td>
              </tr>
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Average position</td>
                <td className={td}>
                  Where in the answer the brand first appears; 1 means it led the answer. Lower is better.
                </td>
                <td className={td}>
                  Only read when mention rate is high enough for a stable average; empty when the brand was never
                  mentioned.
                </td>
              </tr>
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Citation share</td>
                <td className={td}>
                  Share of cited sources in sampled answers that point to the brand&rsquo;s own domains. A mention and a
                  citation are different events: a brand can be named without being linked, and a page can be linked
                  without naming the brand.
                </td>
                <td className={td}>
                  Tracked separately from mentions. Adobe splits owned citations vs all citations; the gap between
                  them is the content opportunity.
                </td>
              </tr>
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Sentiment</td>
                <td className={td}>
                  Average tone of the language around the mention, scored from -1 (negative) to +1 (positive).
                </td>
                <td className={td}>Only scored when the brand is mentioned; no mention is not the same as neutral.</td>
              </tr>
              <tr>
                <td className={`${td} font-medium whitespace-nowrap`}>Visibility Score</td>
                <td className={td}>
                  A 0 to 100 composite that blends the four ingredients above into one trackable number per brand,
                  category, and engine-week.
                </td>
                <td className={td}>Exact formula below; the weights are stated so they can be argued with.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 font-mono text-xs leading-6 text-foreground/85">
          <div>
            Visibility Score = 100 × ({w.mentionRate.toFixed(2)} × mention rate + {w.position.toFixed(2)} × position
            factor + {w.citationShare.toFixed(2)} × citation share + {w.sentiment.toFixed(2)} × sentiment factor)
          </div>
          <div>position factor = (4 - min(average position, 4)) / 3</div>
          <div>sentiment factor = (sentiment + 1) / 2</div>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/85">
          The position factor rewards leading the answer and treats an average position of 4 or worse as zero credit.
          The sentiment factor rescales -1..+1 to 0..1. In a week with zero mentions there is no sentiment reading;
          the sentiment term is dropped and the remaining weights are renormalized. To be plain: these weights are this demo&rsquo;s choice, stated so a
          stakeholder can push back on them. Adobe LLM Optimizer publishes the same ingredient list (mentions,
          citations, sentiment, rank) for its Visibility Score, but its production weighting is its own (
          <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
            Brand Presence docs
          </Ext>
          ).
        </p>
      </Card>

      {/* 5 */}
      <Card>
        <CardTitle sub="This app deliberately uses the vocabulary of Adobe's production tool.">
          5. Vocabulary aligned to Adobe LLM Optimizer
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className={th}>This app</th>
                <th className={th}>Adobe LLM Optimizer</th>
                <th className={th}>Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              <tr>
                <td className={td}>Visibility Score (composite above)</td>
                <td className={td}>Visibility Score: weighted blend of mentions, citations, sentiment, and rank</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Mention rate</td>
                <td className={td}>Brand Mentions across sampled prompts and answers</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Citation share</td>
                <td className={td}>Citations, split into Owned Citations vs All Citations</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Share of voice</td>
                <td className={td}>Share of Voice, with a ranking across all identified brands</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Average position</td>
                <td className={td}>Position, reported in buckets (1-3 vs 6-10) and averaged weekly</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Sentiment</td>
                <td className={td}>Sentiment: positive, neutral, negative weekly trend, populated only when mentioned</td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
                    Brand Presence
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Agentic hits vs observed sessions (Outcomes page)</td>
                <td className={td}>
                  Agentic Traffic (AI crawler and assistant requests detected in CDN logs) vs AI Referral Traffic
                  (human click-throughs), kept as separate dashboards
                </td>
                <td className={td}>
                  <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/agentic-traffic">
                    Agentic Traffic
                  </Ext>
                </td>
              </tr>
              <tr>
                <td className={td}>Prompt panel ({prompts.length} prompts here)</td>
                <td className={td}>
                  Prompts are the licensed tracked unit: minimum 1,000, analyzed daily, weekly trend rollups
                </td>
                <td className={td}>
                  <Ext href="https://business.adobe.com/products/llm-optimizer/pricing.html">Pricing</Ext>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6 */}
      <Card>
        <CardTitle sub="The proxy chain on the Outcomes page, and why each link is modeled rather than measured.">
          6. From visibility to outcomes
        </CardTitle>
        <div className="space-y-3">
          <P>
            No answer engine reports impressions, and no analytics tool can join an AI answer to a specific signup.
            So the Outcomes page connects visibility to value through a chain of stated assumptions: mention rate,
            weighted by assumed engine usage shares, gives estimated AI-influenced sessions; a referrer-capture
            assumption gives the smaller number an analytics tool would actually observe; signup, trial-to-paid, and
            value-per-subscriber assumptions carry it to modeled dollars. Every number past the
            mention rate is modeled and labeled illustrative.
          </P>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className={th}>Step</th>
                  <th className={th}>Why it is modeled</th>
                  <th className={th}>What replaces the assumption in a real org</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr>
                  <td className={td}>Exposure (how many people saw answers like these)</td>
                  <td className={td}>
                    Engines publish no impression counts, so prompt demand and engine usage shares are assumptions.
                  </td>
                  <td className={td}>
                    Licensed prompt-volume data and first-party traffic baselines to calibrate the demand weights.
                  </td>
                </tr>
                <tr>
                  <td className={td}>Observed sessions (what analytics can see)</td>
                  <td className={td}>
                    Many AI-influenced visits lose their referrer: copied links land in Direct, app handoffs drop
                    headers, AI Overviews clicks look like organic Google.
                  </td>
                  <td className={td}>
                    Adobe Analytics / Customer Journey Analytics referral classification via derived fields on
                    referrer domain, user agent, and UTM (
                    <Ext href="https://experienceleague.adobe.com/en/docs/analytics-platform/using/cja-usecases/data-views/derived-fields/ai-traffic">
                      CJA docs
                    </Ext>
                    ).
                  </td>
                </tr>
                <tr>
                  <td className={td}>Agentic traffic (machines reading the site)</td>
                  <td className={td}>
                    AI crawlers and assistants fetch pages with no human present, and often bypass web analytics
                    entirely.
                  </td>
                  <td className={td}>
                    CDN log agent detection, kept separate from human sessions, as in the Agentic Traffic dashboard.
                  </td>
                </tr>
                <tr>
                  <td className={td}>Conversion and value</td>
                  <td className={td}>
                    There is no user-level join between an AI answer and a signup, so conversion rates here are
                    benchmark-style assumptions.
                  </td>
                  <td className={td}>
                    Self-reported attribution at signup (&ldquo;how did you hear about us&rdquo;), content experiments with
                    holdouts, and finance-agreed value per subscriber.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <P>
            The point of stating the chain explicitly is to build
            proxies and heuristics where direct attribution is not possible, and make every assumption visible enough
            for a stakeholder to challenge.
          </P>
        </div>
      </Card>

      {/* 7 */}
      <Card>
        <CardTitle sub="What this framework cannot tell you, stated before anyone has to ask.">
          7. Known limitations
        </CardTitle>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground/85 marker:text-muted">
          <li>
            Prompt panels are not user behavior. Real users phrase the same intent in wildly different words
            (SparkToro measured very low semantic similarity between volunteer phrasings), so a fixed panel
            under-samples real query diversity.
          </li>
          <li>
            API, logged-out, and logged-in answers differ, and consumer interfaces expose no sampling controls. Every
            tracker, including this design, measures a proxy for what users actually see.
          </li>
          <li>
            Single-week, engine-level moves during model updates are mostly noise. The simulated Gemini update in
            this dataset (week ending April 26) is the worked example: judge a multi-week window, not one point.
          </li>
          <li>
            Dark AI traffic: the working estimate that only 30 to 40 percent of AI-influenced visits keep an AI
            referrer is a single-source industry figure, not a measured constant. The rest land in Direct or Organic.
          </li>
          <li>
            Google AI Overviews clicks arrive with google.com referrers, indistinguishable from organic Google
            clicks, so that engine&rsquo;s traffic contribution cannot be observed in standard analytics.
          </li>
          <li>
            Last-touch attribution credits the second touch. Most AI-starting journeys cross-reference on Google
            before converting, so AI influence is systematically undercounted in standard reports.
          </li>
          <li>
            Citation base rates are tiny at the answer level (a single-source Similarweb estimate put ChatGPT answers
            containing citations at 0.6 to 2.8 percent across 2025), so citation-share estimates need large samples
            and wide error bars.
          </li>
          <li>
            Crawl traffic is not human demand. AI crawler hits vastly outnumber the human referrals they eventually
            send, which is why agentic traffic is tracked separately and never added to sessions.
          </li>
          <li>
            Vendor-published benchmarks (prompt-volume datasets, panel conversion rates, customer case results) are
            self-reported and usually single-source. Treat them as directional.
          </li>
          <li>
            This demo&rsquo;s data is simulated end to end. The pipeline, statistics, and vocabulary are real; the numbers
            are not.
          </li>
        </ol>
      </Card>

      {/* 8 */}
      <Card>
        <CardTitle>8. Data provenance</CardTitle>
        <div className="space-y-3">
          <P>
            Every number in this app comes from a seeded, deterministic generator (
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">scripts/generate-data.mjs</code> in
            the repo), so each build renders identical data. For every prompt, engine, and week it draws mention
            counts from a binomial distribution around a planned underlying rate, then computes Wilson intervals,
            positions, citation shares, sentiment, and the composite score from those draws exactly as it would from
            real samples.
          </P>
          <P>
            The generator also plants narrative events so the pages have something honest to read: a help-content
            experiment that lifts treated Adobe Express prompts after mid-March, a Gemini model update that
            destabilizes mention rates for about three weeks in April, a Photoshop sentiment dip during a simulated
            pricing news cycle, a Firefly gap on generic discovery prompts, and Acrobat citation leakage to
            competitor how-to content.
          </P>
          <P>
            No real answer-engine sampling was run, no Adobe data was used, and nothing here is a claim about how any
            real brand actually performs in AI search.
          </P>
        </div>
      </Card>

      {/* 9 */}
      <Card>
        <CardTitle sub="Public sources this framework is grounded in. Links checked June 2026.">9. References</CardTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-foreground/85 marker:text-muted">
          <li>
            <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/brand-presence">
              Adobe LLM Optimizer: Brand Presence dashboards
            </Ext>{" "}
            (Experience League docs)
          </li>
          <li>
            <Ext href="https://experienceleague.adobe.com/en/docs/llm-optimizer/using/dashboards/agentic-traffic">
              Adobe LLM Optimizer: Agentic Traffic dashboard
            </Ext>{" "}
            (Experience League docs)
          </li>
          <li>
            <Ext href="https://business.adobe.com/products/llm-optimizer/pricing.html">
              Adobe LLM Optimizer: pricing and prompt licensing
            </Ext>
          </li>
          <li>
            <Ext href="https://business.adobe.com/blog/building-geo-practice-for-ai-driven-web">
              Adobe: Building a GEO practice for the AI-driven web
            </Ext>{" "}
            (April 2026)
          </li>
          <li>
            <Ext href="https://experienceleague.adobe.com/en/docs/analytics-platform/using/cja-usecases/data-views/derived-fields/ai-traffic">
              Adobe Customer Journey Analytics: derived fields for AI traffic
            </Ext>
          </li>
          <li>
            <Ext href="https://blog.adobe.com/en/publish/2025/03/17/adobe-analytics-traffic-to-us-retail-websites-from-generative-ai-sources-jumps-1200-percent">
              Adobe Analytics: AI-sourced traffic to US retail sites
            </Ext>{" "}
            (March 2025)
          </li>
          <li>
            <Ext href="https://business.adobe.com/blog/generative-ai-powered-shopping-rises-with-traffic-to-retail-sites">
              Adobe: generative AI-powered shopping series update
            </Ext>
          </li>
          <li>
            <Ext href="https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable">
              Adobe: AI-sourced traffic conversion flips positive (April 2026)
            </Ext>
          </li>
          <li>
            <Ext href="https://graphite.io/five-percent/demystifying-randomness-in-ai">
              Graphite: Demystifying randomness in AI
            </Ext>{" "}
            (repeated runs, Wilson intervals)
          </li>
          <li>
            <Ext href="https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/">
              SparkToro: AIs are highly inconsistent when recommending brands
            </Ext>{" "}
            (January 2026)
          </li>
          <li>
            <Ext href="https://ahrefs.com/blog/brand-radar-methodology/">Ahrefs: Brand Radar methodology</Ext>
          </li>
          <li>
            <Ext href="https://docs.peec.ai/understanding-your-performance">Peec: understanding your performance</Ext>{" "}
            (product docs)
          </li>
          <li>
            <Ext href="https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/">
              Similarweb: generative AI statistics
            </Ext>
          </li>
          <li>
            <Ext href="https://arxiv.org/abs/2311.09735">
              Aggarwal et al.: GEO, Generative Engine Optimization
            </Ext>{" "}
            (KDD 2024)
          </li>
          <li>
            <Ext href="https://www.tryprofound.com/blog/ai-platform-citation-patterns">
              Profound: AI platform citation patterns
            </Ext>
          </li>
          <li>
            <Ext href="https://www.semrush.com/blog/how-to-measure-ai-share-of-voice/">
              Semrush: how to measure AI share of voice
            </Ext>
          </li>
          <li>
            <Ext href="https://www.swydo.com/blog/track-ai-traffic-in-ga4/">Swydo: tracking AI traffic in GA4</Ext>
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>What this adds to a first-generation stack</CardTitle>
        <P>
          A team measuring AI search seriously in 2026 already has a first version: a prompt set, a visibility read,
          some referral tracking. This framework is designed to extend that kind of foundation, not replace it. The
          three additions it argues for are uncertainty quantification (every rate carries an interval, so a weekly
          read can be defended in a budget conversation), controlled experiments (treated-vs-control prompt panels, so
          content and PR work gets a real verdict instead of a correlation), and drift monitoring (model updates and
          corpus refreshes show up as flagged volatility, not as phantom wins and losses). One more reason the
          citation metrics matter for the long game: the sources engines cite are dominated by evergreen content, so
          the tutorial or review published this quarter is next quarter&apos;s answer corpus. Citation-building
          compounds; campaign spikes do not.
        </P>
      </Card>

      <Card>
        <CardTitle>If this were week one on the job</CardTitle>
        <P>
          The framework transfers; the data source swaps. Week one looks like: inherit the panel and metric
          definitions the team already runs and pressure-test them before changing anything; replace the simulated
          sampler with production sampling, whether LLM Optimizer prompts or an in-house runner with the same
          statistics; validate the prompt panel against real query and prompt-volume data instead of assumed demand
          weights; recalibrate the composite score weights with the stakeholders who will be held to the number; and
          connect Adobe Analytics referral classification so the outcomes chain starts replacing assumptions with
          measurements.
        </P>
      </Card>
    </div>
  );
}
