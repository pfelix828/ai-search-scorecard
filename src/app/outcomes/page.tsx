import type { Metadata } from "next";
import { funnel, meta, LAST_WEEK, latestWeekEnding } from "@/lib/data";
import { num, pct, shortDate } from "@/lib/format";
import { Card, CardTitle, PageHeader, Pill, SimulatedDataNote, Stat, Term } from "@/components/ui";
import { Legend, WeeklyChart } from "@/components/charts";
import { ADOBE_RED } from "@/lib/colors";
import { ProxyModel } from "@/components/outcomes/proxy-model";

export const metadata: Metadata = {
  title: "Outcomes · AI Search Visibility Scorecard",
  description:
    "An assumption-driven proxy model connecting AI search visibility to signups, paying users, and revenue. Simulated demo data.",
};

const latestRows = funnel.rows.filter((r) => r.w === LAST_WEEK);
const baseSessions = latestRows.reduce((s, r) => s + r.estSessions, 0);
const observedLatest = latestRows.reduce((s, r) => s + r.observedSessions, 0);
const agenticLatest = latestRows.reduce((s, r) => s + r.agenticHits, 0);
const captureLatest = observedLatest / baseSessions;
const agenticMultiple = Math.round(agenticLatest / baseSessions);

/** Weekly totals across engines, in thousands so the axis stays readable. */
const trafficSeries = meta.weeks.map((week, w) => {
  const rows = funnel.rows.filter((r) => r.w === w);
  return {
    week,
    estimated: Math.round(rows.reduce((s, r) => s + r.estSessions, 0) / 100) / 10,
    observed: Math.round(rows.reduce((s, r) => s + r.observedSessions, 0) / 100) / 10,
  };
});

const trafficSeriesDefs = [
  { key: "estimated", name: "Modeled AI-influenced sessions", color: ADOBE_RED },
  { key: "observed", name: "Sessions an analytics report credits to AI", color: "#64748b", dashed: true },
];

const references = [
  {
    text: "Traffic to US retail websites from generative AI sources grew 1,200 percent from July 2024 to February 2025.",
    source: "Adobe Analytics, blog.adobe.com, March 2025",
    href: "https://blog.adobe.com/en/publish/2025/03/17/adobe-analytics-traffic-to-us-retail-websites-from-generative-ai-sources-jumps-1200-percent",
  },
  {
    text: "Visitors arriving from generative AI sources initially converted well below other channels, 38 percent worse in March 2025, but flipped to 42 percent better by March 2026. Adobe's published series is noisy, so read the direction, not individual points.",
    source: "Adobe Analytics, business.adobe.com, April 2026",
    href: "https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable",
  },
  {
    text: "ChatGPT referral traffic to retail sites converts at 7.1 percent, second only to paid search.",
    source: "Similarweb",
    href: "https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/",
  },
  {
    text: "Only 30 to 40 percent of AI-influenced visits keep an AI referrer in analytics. Single-source industry estimate from a GA4 tracking guide.",
    source: "Swydo",
    href: "https://www.swydo.com/blog/track-ai-traffic-in-ga4/",
  },
];

export default function OutcomesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes"
        subtitle="Proxies and heuristics that connect AI search visibility to signups, paying users, and revenue, because direct click-by-click attribution is not possible. Every assumption is stated and adjustable."
        right={<Pill>Latest week: {shortDate(latestWeekEnding)}</Pill>}
      />
      <SimulatedDataNote />

      {/* 1. The attribution problem */}
      <Card>
        <CardTitle>Why this is a proxy model, not an attribution report</CardTitle>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>
            Answer engines do not report impressions. There is no console that says how many times ChatGPT mentioned
            Acrobat this week, so the top of this funnel has to be estimated from sampled prompts.
          </p>
          <p>
            Most AI-influenced visits also lose their{" "}
            <Term def="The header a browser sends that tells a website where the visitor came from.">referrer</Term>.
            Clicks from Google AI Overviews arrive looking like ordinary Google search traffic. App-to-browser handoffs,
            like tapping a link inside the ChatGPT app, often arrive labeled Direct.
          </p>
          <p>
            So instead of pretending we can track this click by click, this page connects visibility to outcomes
            through a short chain of stated assumptions. Each assumption is a slider you can move, and the sensitivity
            table at the bottom shows which one moves the answer most. This is the standard approach when direct
            attribution is not possible: proxies for outcomes like{" "}
            <Term def="Monthly active users: the count of distinct users active in a month.">MAU</Term>,{" "}
            <Term def="Lifetime value: the revenue one customer generates over the time they stay subscribed.">LTV</Term>{" "}
            and new annualized recurring revenue.
          </p>
        </div>
      </Card>

      {/* 2. Proxy chain (client, sliders) ... 5. Sensitivity table.
          Sections 3 and 4 render between them as children so the sliders
          and the sensitivity table can share state. */}
      <ProxyModel
        baseSessions={baseSessions}
        defaults={funnel.assumptions}
        weekLabel={shortDate(latestWeekEnding)}
      >
        {/* 3. Observed vs estimated */}
        <Card>
          <CardTitle sub="Weekly sessions in thousands, summed across the five engines. 26 weeks of simulated data.">
            Observed vs estimated: what analytics sees vs what we model
          </CardTitle>
          <WeeklyChart data={trafficSeries} series={trafficSeriesDefs} height={240} />
          <Legend series={trafficSeriesDefs} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="text-sm text-foreground/80">
              <p>
                The dashed line is what a standard referrer report would credit to AI sources. The solid line is the
                modeled true total once referrer loss is added back. In the latest week that gap is{" "}
                {num(observedLatest)} observed vs {num(baseSessions)} modeled, so an analytics report sees about{" "}
                {pct(captureLatest)} of the modeled total.
              </p>
              <p className="mt-2">
                A single-source industry estimate, cited in the reference card below, puts overall capture around 30 to
                40 percent of AI-influenced visits. The per-engine demo rates in this table blend to about{" "}
                {pct(captureLatest)} in the latest simulated week, just above that range.
              </p>
            </div>
            <div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-muted">
                    <th className="py-1.5 pr-2 font-medium">Engine</th>
                    <th className="py-1.5 pr-2 font-medium">
                      <Term def="Demo assumption for each engine's share of overall AI assistant usage, used to weight exposure.">
                        Usage share
                      </Term>
                    </th>
                    <th className="py-1.5 font-medium">
                      <Term def="Share of visits from this engine that keep an AI referrer in analytics. The rest get credited to Direct or organic search.">
                        Referrer capture
                      </Term>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meta.engines.map((e) => (
                    <tr key={e.id} className="border-b border-border-subtle/60">
                      <td className="py-1.5 pr-2 font-medium">{e.name}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{pct(e.usageShare)}</td>
                      <td className="py-1.5 tabular-nums">{pct(e.referrerCapture)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-muted">
                Google AI Overviews sits at 0 percent because its clicks carry a google.com referrer and get credited
                to ordinary organic search.
              </p>
            </div>
          </div>
        </Card>

        {/* 4. Two different signals */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle sub="People who clicked from an AI answer to a product page.">AI referral traffic</CardTitle>
            <Stat
              label="Sessions with an AI referrer, latest week, simulated"
              value={num(observedLatest)}
              hint="Sum of observed sessions across the five engines in the latest simulated week."
            />
            <p className="mt-3 text-sm text-foreground/80">
              This is the human signal: low volume, high intent, and undercounted. The modeled true figure is{" "}
              {num(baseSessions)} once referrer loss is added back. This is the number the proxy chain above starts
              from.
            </p>
          </Card>
          <Card>
            <CardTitle sub="AI crawlers and agents fetching pages to read them.">Agentic traffic</CardTitle>
            <Stat
              label="Agentic hits, latest week, simulated"
              value={num(agenticLatest)}
              hint="Sum of AI agent and crawler hits across the five engines in the latest simulated week."
            />
            <p className="mt-3 text-sm text-foreground/80">
              About {agenticMultiple}{" "}times the modeled human sessions, and it means something different: models
              reading content so they can answer questions later, not customers visiting. Adobe&apos;s LLM Optimizer
              product treats AI referral traffic and agentic traffic as separate dashboards, and this scorecard keeps
              them separate too. Mixing the two would inflate every conversion rate on this page.
            </p>
          </Card>
        </div>
      </ProxyModel>

      {/* 6. Real-world reference points */}
      <Card className="border-emerald-200 bg-emerald-50/40">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <CardTitle sub="Everything above this card is simulated or modeled. The four figures below are real, published numbers, each linked to its public source.">
            Real-world reference points
          </CardTitle>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            Real published figures
          </span>
        </div>
        <ul className="space-y-3 text-sm text-foreground/80">
          {references.map((r) => (
            <li key={r.href} className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>
                {r.text}{" "}
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-emerald-800 underline decoration-dotted underline-offset-2 hover:text-emerald-900"
                >
                  {r.source}
                </a>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          These anchors are why the demo defaults look the way they do: real AI referral traffic is growing fast from a
          small base, converts well when it does arrive, and is systematically undercounted.
        </p>
      </Card>
    </div>
  );
}
