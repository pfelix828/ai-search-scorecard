"use client";

/**
 * Client-side charts for the /experiments page.
 * Both render simulated demo data passed in from the server page.
 */
import type { Experiment } from "@/lib/data";
import { WeeklyChart, Legend, type SeriesDef, type WeeklyPoint } from "@/components/charts";
import { ADOBE_RED, engineColor } from "@/lib/colors";

/**
 * Experiment 1: treated vs control mention rate with a 95% CI band
 * on the treated series and a marker at the pre/post split week.
 */
export function ExpressLiftChart({ exp }: { exp: Experiment }) {
  const controlByWeek = new Map((exp.control ?? []).map((p) => [p.week, p.mr]));
  const data: WeeklyPoint[] = (exp.treated ?? []).map((p) => ({
    week: p.week,
    treated: p.mr,
    treatedLo: p.ciLo,
    treatedHi: p.ciHi,
    control: controlByWeek.get(p.week) ?? null,
  }));
  const series: SeriesDef[] = [
    { key: "treated", name: "Treated prompts (content changed)", color: ADOBE_RED },
    { key: "control", name: "Control prompts (left alone)", color: "#9ca3af", dashed: true },
  ];
  return (
    <div>
      <WeeklyChart
        data={data}
        series={series}
        yPercent
        yDomain={[0.2, 0.7]}
        bandKey="treated"
        events={[{ week: exp.interventionDate, label: "Pre/post split" }]}
      />
      <Legend series={series} />
      <p className="mt-1 text-xs text-muted">
        Shaded band: 95% confidence interval around the treated series. Dashed vertical line: the week the
        pre and post analysis windows split.
      </p>
    </div>
  );
}

/**
 * Experiment 2: Firefly citation share on Perplexity vs ChatGPT,
 * same axis so the null on ChatGPT is visible next to the Perplexity rise.
 */
export function FireflyCitationChart({ exp }: { exp: Experiment }) {
  const chatgptByWeek = new Map((exp.chatgptSeries ?? []).map((p) => [p.week, p.cit]));
  const data: WeeklyPoint[] = (exp.perplexitySeries ?? []).map((p) => ({
    week: p.week,
    perplexity: p.cit,
    chatgpt: chatgptByWeek.get(p.week) ?? null,
  }));
  const series: SeriesDef[] = [
    { key: "perplexity", name: "Citation share on Perplexity", color: engineColor("perplexity") },
    { key: "chatgpt", name: "Citation share on ChatGPT", color: engineColor("chatgpt") },
  ];
  return (
    <div>
      <WeeklyChart
        data={data}
        series={series}
        yPercent
        yDomain={[0, 0.35]}
        events={[{ week: exp.interventionDate, label: "Pre/post split" }]}
      />
      <Legend series={series} />
      <p className="mt-1 text-xs text-muted">
        Both lines share one axis on purpose: the flat ChatGPT line is part of the result, not a charting
        artifact.
      </p>
    </div>
  );
}
