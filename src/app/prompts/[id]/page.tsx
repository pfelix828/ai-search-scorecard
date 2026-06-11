import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  prompts,
  answers,
  experiments,
  meta,
  engineName,
  categoryName,
  latestWeekEnding,
  type Prompt,
} from "@/lib/data";
import { num, pct, shortDate } from "@/lib/format";
import { Card, CardTitle, Delta, PageHeader, Pill, SimulatedDataNote, Term } from "@/components/ui";
import { WeeklyChart, type EventMarker } from "@/components/charts";
import { ADOBE_RED, engineColor } from "@/lib/colors";

export function generateStaticParams() {
  return prompts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = prompts.find((x) => x.id === id);
  return { title: p ? `${p.text} · Prompt Panel` : "Prompt detail" };
}

/** What the latest reading should trigger, written per intent stage. */
const ACTION_BY_INTENT: Record<Prompt["intent"], (brand: string) => string> = {
  discovery: (brand) =>
    `This is a discovery prompt, so it measures whether ${brand} makes the engine's first short list at all; if mention rate slips here, the next step is working with PR and content partners on the third-party roundups and comparison pages these engines draw from, because ${brand} is dropping out of the consideration set before anyone compares features.`,
  evaluation: (brand) =>
    `This is an evaluation prompt, so it measures the comparison frame engines build around ${brand}; the next step is auditing the head-to-head articles engines cite and making sure they describe ${brand}'s actual strengths, since the framing in those sources becomes the framing in the answer.`,
  "how-to": (brand) =>
    `This is a how-to prompt, and how-to answers are won by whoever owns the cited tutorial content; the next step is publishing or refreshing step-by-step help pages that answer this exact task, then watching whether engines start citing ${brand}'s own docs instead of third-party guides.`,
  suitability: (brand) =>
    `This is a suitability prompt, so it measures which kind of user engines recommend ${brand} for; the next step is sharpening the recommended-for language on product pages and in reviews engines pull from, so the persona in the answer matches the persona we want.`,
};

/** Horizontal 0-100% track with the 95% CI as a band and the point estimate as a tick. */
function CiBar({ lo, hi, mr }: { lo: number; hi: number; mr: number }) {
  return (
    <div className="relative h-2.5 w-36 rounded-full bg-zinc-100" aria-hidden>
      <div
        className="absolute inset-y-0 rounded-full bg-red-200"
        style={{ left: `${lo * 100}%`, width: `${Math.max((hi - lo) * 100, 1)}%` }}
      />
      <div
        className="absolute inset-y-0 w-[3px] -translate-x-1/2 rounded-sm bg-accent"
        style={{ left: `${mr * 100}%` }}
      />
    </div>
  );
}

const VOLUME_LABEL: Record<Prompt["volume"], string> = {
  high: "High volume",
  medium: "Medium volume",
  low: "Low volume",
};

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = prompts.find((p) => p.id === id);
  if (!prompt) notFound();

  const chartData = prompt.spark.map((v, i) => ({ week: meta.weeks[i], mr: v }));
  const contentExperiment = experiments.find((x) => x.id === "express-content");
  const events: EventMarker[] =
    prompt.treated && contentExperiment
      ? [{ week: contentExperiment.interventionDate, label: "Help content shipped" }]
      : [];
  const answer = answers[prompt.id];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prompts" className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
          Back to prompt panel
        </Link>
      </div>

      <PageHeader
        title={`"${prompt.text}"`}
        subtitle={`Tracked for ${prompt.adobeBrandName} in the ${categoryName(prompt.category)} category. All numbers are simulated demo data.`}
      />

      <div className="flex flex-wrap gap-2">
        <Pill>{categoryName(prompt.category)}</Pill>
        <Pill className="capitalize">{prompt.intent} intent</Pill>
        <Pill>
          {VOLUME_LABEL[prompt.volume]}, est. {num(prompt.estWeeklyAsks)} asks/week (demo assumption)
        </Pill>
        {prompt.treated ? (
          <Pill className="border-amber-300 bg-amber-50 text-amber-800">
            Treatment group: Express help-content experiment
          </Pill>
        ) : null}
      </div>

      <Card>
        <CardTitle sub={`How often each engine's answer named ${prompt.adobeBrandName} in the week ending ${shortDate(latestWeekEnding)}.`}>
          Latest week by engine
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium text-muted">
                <th className="py-2 pr-3 font-medium">Engine</th>
                <th className="py-2 pr-3 font-medium">
                  <Term def="Runs where the answer named the Adobe product, out of all sampled runs.">Mentions</Term>
                </th>
                <th className="py-2 pr-3 font-medium">
                  <Term def="Mention rate with its 95% confidence interval shown on a 0 to 100% track.">
                    Mention rate (95% CI)
                  </Term>
                </th>
                <th className="py-2 text-right font-medium">
                  <Term def="Week-over-week change in mention rate, in percentage points.">WoW</Term>
                </th>
              </tr>
            </thead>
            <tbody>
              {prompt.perEngine.map((s) => (
                <tr key={s.e} className="border-b border-border-subtle/60">
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: engineColor(s.e) }} />
                      {engineName(s.e)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted">
                    {s.k} of {s.n} runs
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      <span className="w-24 tabular-nums">
                        <span className="font-semibold">{pct(s.mr)}</span>{" "}
                        <span className="text-xs text-muted">
                          ({Math.round(s.ciLo * 100)}-{Math.round(s.ciHi * 100)})
                        </span>
                      </span>
                      <CiBar lo={s.ciLo} hi={s.ciHi} mr={s.mr} />
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <Delta value={s.mr - s.prevMr} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          70 runs per engine per week; the interval is a Wilson 95% confidence interval, which is how we keep ourselves
          honest about run-to-run randomness in engine answers.
        </p>
      </Card>

      <Card>
        <CardTitle
          sub={`Mention rate for ${prompt.adobeBrandName}, averaged across the five engines and weighted by each engine's assumed usage share. Simulated data.`}
        >
          Blended mention rate, 26 weeks
        </CardTitle>
        <WeeklyChart
          data={chartData}
          series={[{ key: "mr", name: "Blended mention rate", color: ADOBE_RED }]}
          yPercent
          events={events}
        />
      </Card>

      {answer ? (
        <Card>
          <CardTitle sub="One of the sampled runs behind the numbers above, kept as a qualitative record.">
            Example sampled answer
          </CardTitle>
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {answer.note}
          </div>
          <div className="mb-3">
            <Pill>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: engineColor(answer.engine) }} />
              {engineName(answer.engine)}
            </Pill>
          </div>
          <blockquote className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-foreground/90">
            {answer.text}
          </blockquote>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-muted">
                <Term def="Order in which each brand appears in the answer; position 1 led the answer.">
                  Brand mentions and positions
                </Term>
              </h4>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {answer.mentions.map((m) => (
                    <tr key={m.brand} className="border-b border-border-subtle/60 last:border-0">
                      <td className="py-1.5 pr-3">{m.brand}</td>
                      <td className="py-1.5 text-right tabular-nums text-muted">position {m.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-muted">
                <Term def="Sources the engine cited or linked in this answer. Who gets cited shapes who gets recommended.">
                  Cited sources
                </Term>
              </h4>
              <ul className="space-y-1 text-sm text-foreground/80">
                {answer.citations.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                    <span className="font-mono text-xs">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>What we would do with this</CardTitle>
        <p className="text-sm leading-relaxed text-foreground/80">{ACTION_BY_INTENT[prompt.intent](prompt.adobeBrandName)}</p>
      </Card>

      <SimulatedDataNote />
    </div>
  );
}
