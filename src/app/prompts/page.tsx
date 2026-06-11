import type { Metadata } from "next";
import { meta, prompts, latestWeekEnding } from "@/lib/data";
import { num, shortDate } from "@/lib/format";
import { Card, PageHeader, SimulatedDataNote, Stat, Term } from "@/components/ui";
import { PromptTable } from "@/components/prompts/prompt-table";

export const metadata: Metadata = {
  title: "Prompt Panel · AI Search Visibility Scorecard",
  description: "The 40-prompt tracking panel behind the scorecard: categories, intent stages, and per-engine mention rates.",
};

export default function PromptsPage() {
  const runsPerWeek = prompts.length * meta.engines.length * meta.runsPerPromptEngineWeek;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Panel"
        subtitle={
          <>
            A prompt panel is a fixed set of questions we re-ask each AI engine many times every week. It is the unit
            of measurement for AI search visibility, the same way a keyword set is the unit of measurement in classic
            SEO rank tracking, and it mirrors how Adobe&apos;s LLM Optimizer product licenses tracked prompts.
          </>
        }
      />

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Prompts tracked" value={prompts.length} hint="5 categories with 8 prompts each" />
          <Stat label="Engines sampled" value={meta.engines.length} hint="ChatGPT, Google AI Overviews, Gemini, Perplexity, Copilot" />
          <Stat
            label={<Term def="Each prompt is asked 70 times per engine per week so mention rates come from repeated sampling, not a single answer.">Runs per week</Term>}
            value={num(runsPerWeek)}
            hint="40 prompts x 5 engines x 70 runs"
          />
          <Stat label="Latest week ending" value={shortDate(latestWeekEnding)} />
        </div>
        <p className="mt-4 text-xs text-muted">
          Panel design: 5 categories x 8 prompts, mixed across four intent stages (discovery, evaluation, how-to,
          suitability). Each prompt carries an estimated weekly ask volume in high, medium, and low buckets. The volume
          buckets are demo assumptions, not measured query counts: answer engines do not publish prompt volumes, so a
          production version would size them from search-keyword analogs and first-party signals.{" "}
          <Term def="Share of sampled runs where the engine's answer names the category's Adobe product.">
            Mention rate
          </Term>{" "}
          is the core metric: the share of sampled runs where the engine&apos;s answer names the category&apos;s Adobe
          product.
        </p>
      </Card>

      <Card>
        <PromptTable />
      </Card>

      <SimulatedDataNote />
    </div>
  );
}
