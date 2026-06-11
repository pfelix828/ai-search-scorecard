"use client";

/**
 * Interactive section of a category detail page.
 * An engine selector drives the mention-rate chart, share-of-voice bars,
 * and the position/sentiment charts for the category's Adobe product.
 */
import { useState } from "react";
import clsx from "clsx";
import {
  meta,
  experiments,
  weeklyRows,
  shareOfVoice,
  getCategory,
  adobeBrandOf,
  brandName,
  engineName,
  LAST_WEEK,
  latestWeekEnding,
} from "@/lib/data";
import { brandColor, engineColor, ADOBE_RED } from "@/lib/colors";
import { shortDate } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui";
import { WeeklyChart, Legend, type WeeklyPoint, type SeriesDef, type EventMarker } from "@/components/charts";

/** Round shares to whole percentages that sum to exactly 100 (largest remainder). */
function roundShares(values: number[]): number[] {
  const floors = values.map((v) => Math.floor(v * 100));
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = values
    .map((v, i) => ({ i, frac: v * 100 - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) out[order[k].i] += 1;
  return out;
}

export function CategoryDetail({ categoryId }: { categoryId: string }) {
  const [engine, setEngine] = useState("chatgpt");

  const category = getCategory(categoryId)!;
  const adobe = adobeBrandOf(categoryId)!;

  // Mention rate by brand on the selected engine
  const series: SeriesDef[] = category.brands.map((b) => ({
    key: b.id,
    name: b.name,
    color: brandColor(b.id),
  }));
  const engineRows = weeklyRows({ c: categoryId, e: engine });
  const mentionData: WeeklyPoint[] = meta.weeks.map((week, w) => {
    const point: WeeklyPoint = { week };
    for (const r of engineRows) if (r.w === w) point[r.b] = r.mr;
    return point;
  });

  const events: EventMarker[] = [];
  const expressExperiment = experiments.find((x) => x.id === "express-content");
  if (categoryId === "quick-design" && expressExperiment) {
    events.push({ week: expressExperiment.interventionDate, label: "Help-content update" });
  }
  if (engine === "gemini") {
    events.push({ week: "2026-04-26", label: "Gemini model update" });
  }

  // Share of voice, latest week
  const sov = shareOfVoice(categoryId, engine, LAST_WEEK);
  const rounded = roundShares(sov.map((s) => s.sov));

  // Position and sentiment for the Adobe brand on the selected engine
  const adobeRows = weeklyRows({ c: categoryId, e: engine, b: adobe.id });
  const posData: WeeklyPoint[] = adobeRows.map((r) => ({ week: r.week, pos: r.pos }));
  const sentData: WeeklyPoint[] = adobeRows.map((r) => ({ week: r.week, sent: r.sent }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">Engine:</span>
        {meta.engines.map((e) => {
          const active = e.id === engine;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setEngine(e.id)}
              aria-pressed={active}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border-subtle bg-white text-foreground/70 hover:bg-zinc-50 hover:text-foreground",
              )}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: engineColor(e.id) }} />
              {e.name}
            </button>
          );
        })}
      </div>

      <Card>
        <CardTitle
          sub={`Share of sampled ${engineName(engine)} answers in this prompt panel that mention each brand at least once, volume-weighted across prompts. 26 weeks of simulated data.`}
        >
          Mention rate by brand
        </CardTitle>
        <WeeklyChart data={mentionData} series={series} yPercent events={events} />
        <Legend series={series} />
      </Card>

      <Card>
        <CardTitle
          sub={`Share of all tracked-brand mentions held by each brand on ${engineName(engine)}, week ending ${shortDate(latestWeekEnding)}. Rounded percentages sum to 100.`}
        >
          Share of voice this week
        </CardTitle>
        <div className="space-y-2">
          {sov.map((s, i) => {
            const isAdobe = s.b === adobe.id;
            return (
              <div key={s.b} className="flex items-center gap-3">
                <span
                  className={clsx(
                    "w-36 shrink-0 truncate text-xs",
                    isAdobe ? "font-semibold text-accent" : "text-foreground/80",
                  )}
                >
                  {brandName(s.b)}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-100">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(s.sov * 100, 0.5)}%`,
                      background: isAdobe ? ADOBE_RED : brandColor(s.b),
                    }}
                  />
                </div>
                <span className={clsx("w-10 text-right text-xs tabular-nums", isAdobe && "font-semibold")}>
                  {rounded[i]}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle
            sub={`Where ${adobe.name} first appears in ${engineName(engine)} answers that mention it. 1 means it led the answer; lower is better.`}
          >
            Average position when mentioned
          </CardTitle>
          <WeeklyChart
            data={posData}
            series={[{ key: "pos", name: "Avg position", color: ADOBE_RED }]}
            yDomain={[1, 5]}
            height={180}
          />
        </Card>
        <Card>
          <CardTitle
            sub={`Average tone of ${adobe.name} mentions on ${engineName(engine)}, scored from -1 (negative) to +1 (positive). Measured only in answers that mention the brand.`}
          >
            Sentiment when mentioned
          </CardTitle>
          <WeeklyChart
            data={sentData}
            series={[{ key: "sent", name: "Avg sentiment", color: ADOBE_RED }]}
            yDomain={[-1, 1]}
            height={180}
          />
        </Card>
      </div>
    </div>
  );
}
