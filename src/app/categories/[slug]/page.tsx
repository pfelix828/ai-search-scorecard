import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  meta,
  prompts,
  blendedSeries,
  getCategory,
  adobeBrandOf,
  categoryName,
} from "@/lib/data";
import { pct, num, score, shortDate } from "@/lib/format";
import {
  Card,
  CardTitle,
  PageHeader,
  Delta,
  Pill,
  SeverityBadge,
  SimulatedDataNote,
  Term,
} from "@/components/ui";
import { Sparkline } from "@/components/charts";
import { CategoryDetail } from "@/components/category/CategoryDetail";

export function generateStaticParams() {
  return meta.categories.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = categoryName(slug);
  return {
    title: `${name} · AI Search Visibility Scorecard`,
    description: `Simulated AI-search visibility for ${name}: mention rate by brand, share of voice, position, sentiment, and the prompt panel behind the numbers.`,
  };
}

const VS_DEF =
  "Composite score from 0 to 100: 45% mention rate, 20% answer position, 20% citation share, 15% sentiment, averaged across engines weighted by assumed usage share. Weighting is illustrative.";
const MR_DEF = "Share of sampled answers that mention the brand at least once.";
const CI_DEF =
  "95% confidence interval for the mention rate, given how many simulated answer runs were sampled that week.";
const BLENDED_DEF =
  "Average across the five engines, weighted by each engine's assumed share of AI-assistant usage.";

interface Narrative {
  severity: "win" | "opportunity" | "risk" | "watch";
  title: string;
  body: string;
  action: string;
  link?: { href: string; label: string };
}

/** Analyst notes per category. Numbers reference the simulated dataset. */
const NARRATIVES: Record<string, Narrative> = {
  "quick-design": {
    severity: "win",
    title: "Help-content experiment moved Express mentions",
    body: "Four treated prompts got restructured help content in the week ending Mar 22, 2026. Their Adobe Express mention rate on ChatGPT and Perplexity rose about 14 points in the weeks after, while the four control prompts stayed flat. In this simulated dataset, the flat control is what separates a content effect from a market shift.",
    action:
      "Suggested next step: apply the same content format to the control prompts, and confirm the lift holds for several more weeks before treating it as a repeatable playbook.",
    link: { href: "/experiments", label: "See the experiment readout" },
  },
  "genai-image": {
    severity: "opportunity",
    title: "Firefly wins safety prompts but trails generic discovery",
    body: "Firefly leads this panel on prompts about commercially safe AI images, where engines associate it with licensing protection. On generic discovery prompts such as the best AI image generator, it trails: in the latest simulated week, Firefly appears in 45% of ChatGPT answers versus about 71% for Midjourney and OpenAI GPT Image.",
    action:
      "Suggested next step: keep the commercial-safety positioning and add comparison content aimed at the generic discovery prompts, which carry the largest simulated ask volume in this panel.",
  },
  "pdf-tools": {
    severity: "risk",
    title: "Acrobat dominates mentions while citations leak to how-to sites",
    body: "Acrobat is mentioned in about 75% of sampled PDF answers, the strongest position in this category's panel. The cited sources tell a different story: in the latest simulated week, Smallpdf and iLovePDF how-to pages hold roughly 36% and 32% of citations, against about 19% for Adobe. Mentions that rest on competitor citations are fragile if engines re-rank their sources.",
    action:
      "Suggested next step: publish task-level how-to pages for the highest-volume PDF prompts so engines can cite Adobe directly, and track citation share weekly alongside mention rate.",
  },
  "photo-editing": {
    severity: "watch",
    title: "Sentiment dipped on pricing news while mentions held",
    body: "From the week ending Feb 8 through Mar 1, 2026, a simulated pricing news cycle cut Photoshop's sentiment in answers from around 0.5 to about 0.25 on the -1 to 1 scale, while mention rate held near 80%. Engines kept recommending Photoshop but described it less favorably. A mention-only metric would have missed this.",
    action:
      "Suggested next step: watch sentiment as its own weekly line, not only inside the composite score, and flag PR partners when tone moves while mentions hold.",
  },
  "video-editing": {
    severity: "watch",
    title: "A Gemini model update unsettled mention rates",
    body: "After a simulated Gemini model update in the week ending Apr 26, 2026, Premiere Pro's mention rate on Gemini dropped from about 54% to 40% and took roughly three weeks to mostly recover. Other categories show the same dip on Gemini, which points to the engine changing, not the content or the market.",
    action:
      "Suggested next step: log engine model updates as measurement events and wait two to three weeks before reading trend changes on the affected engine, so model churn is not mistaken for a content or competitor effect.",
  },
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const adobe = adobeBrandOf(slug)!;

  const vsSeries = blendedSeries(slug, adobe.id, (r) => r.vs);
  const vsNow = vsSeries[vsSeries.length - 1].value;
  const vsPrev = vsSeries[vsSeries.length - 2].value;

  const narrative = NARRATIVES[slug];
  const panel = prompts.filter((p) => p.category === slug);
  const showTreated = panel.some((p) => p.treated);

  return (
    <div>
      <div className="mb-3 text-xs">
        <Link href="/categories" className="text-muted underline decoration-dotted underline-offset-2 hover:text-foreground">
          All categories
        </Link>
      </div>

      <PageHeader
        title={category.name}
        subtitle={
          <>
            <Pill className="mr-2">{category.adobeBrand}</Pill>
            Tracking {adobe.name} against {category.brands.length - 1} competitors across five AI answer engines, 26
            weeks of simulated data.
          </>
        }
        right={
          <div className="text-right">
            <div className="text-xs font-medium text-muted">
              <Term def={VS_DEF}>Visibility Score</Term>, <Term def={BLENDED_DEF}>blended</Term>
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-2">
              <span className="text-2xl font-bold tracking-tight">{score(vsNow)}</span>
              <Delta value={(vsNow - vsPrev) / 100} digits={1} />
              <span className="text-xs text-muted">vs prior week</span>
            </div>
          </div>
        }
      />

      <SimulatedDataNote className="mb-5" />

      <CategoryDetail categoryId={slug} />

      {narrative ? (
        <Card className="mt-4">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={narrative.severity} />
            <h3 className="text-sm font-semibold tracking-tight">{narrative.title}</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{narrative.body}</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{narrative.action}</p>
          {narrative.link ? (
            <Link
              href={narrative.link.href}
              className="mt-2 inline-block text-xs font-medium underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {narrative.link.label}
            </Link>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardTitle
          sub={
            <>
              The fixed set of questions sampled weekly for this category. <Term def={MR_DEF}>Mention rate</Term> shown
              for {adobe.name} on ChatGPT in the latest week, with its <Term def={CI_DEF}>95% CI</Term>. Trend is the{" "}
              <Term def={BLENDED_DEF}>blended</Term> mention rate over 26 weeks. Ask volumes are simulated estimates.
            </>
          }
        >
          Prompts in this panel
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Prompt</th>
                <th className="py-2 pr-3 font-medium">Intent</th>
                <th className="py-2 pr-3 font-medium">Volume</th>
                {showTreated ? <th className="py-2 pr-3 font-medium">Experiment</th> : null}
                <th className="py-2 pr-3 font-medium">ChatGPT mention rate, latest week</th>
                <th className="py-2 font-medium">Blended trend</th>
              </tr>
            </thead>
            <tbody>
              {panel.map((p) => {
                const cg = p.perEngine.find((s) => s.e === "chatgpt");
                return (
                  <tr key={p.id} className="border-b border-border-subtle last:border-0 align-top">
                    <td className="max-w-xs py-2.5 pr-3">
                      <Link
                        href={`/prompts/${p.id}`}
                        className="underline decoration-dotted underline-offset-2 hover:text-accent"
                      >
                        {p.text}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-foreground/80">{p.intent}</td>
                    <td className="py-2.5 pr-3 text-xs text-foreground/80">
                      {p.volume} <span className="text-muted">({num(p.estWeeklyAsks)}/wk)</span>
                    </td>
                    {showTreated ? (
                      <td className="py-2.5 pr-3">
                        {p.treated ? (
                          <Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">Treated</Pill>
                        ) : (
                          <Pill>Control</Pill>
                        )}
                      </td>
                    ) : null}
                    <td className="py-2.5 pr-3 text-xs tabular-nums">
                      {cg
                        ? `${pct(cg.mr)} (CI ${Math.round(cg.ciLo * 100)}-${Math.round(cg.ciHi * 100)})`
                        : "n/a"}
                    </td>
                    <td className="py-2.5">
                      <Sparkline values={p.spark} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Latest week ends {shortDate(meta.weeks[meta.weeks.length - 1])}.
          {showTreated
            ? " Treated prompts received the Express help-content update described above; control prompts did not."
            : null}
        </p>
      </Card>
    </div>
  );
}
