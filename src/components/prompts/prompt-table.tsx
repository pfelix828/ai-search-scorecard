"use client";

/**
 * Filterable, sortable view of the 40-prompt panel.
 * Filters: category, intent stage, and which engine drives the mention-rate column.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { meta, prompts, categoryName, engineName, type Prompt } from "@/lib/data";
import { num, pct } from "@/lib/format";
import { engineColor } from "@/lib/colors";
import { Delta, Term } from "@/components/ui";
import { Sparkline } from "@/components/charts";

const INTENTS: { id: Prompt["intent"]; label: string; def: string }[] = [
  { id: "discovery", label: "Discovery", def: "Open-ended questions where the asker has not named any product yet." },
  { id: "evaluation", label: "Evaluation", def: "Comparison questions weighing named products against each other." },
  { id: "how-to", label: "How-to", def: "Task questions where engines tend to cite tutorial and help content." },
  { id: "suitability", label: "Suitability", def: "Questions about whether a tool fits a specific person or need." },
];

type SortKey = "asks" | "mr";

function FilterPill({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border-subtle bg-white text-foreground/70 hover:bg-zinc-50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  def,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  def: string;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      title={def}
      className={clsx("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
    >
      {label}
      <span className="text-[10px]">{active ? (dir === "desc" ? "▼" : "▲") : "▽"}</span>
    </button>
  );
}

export function PromptTable() {
  const [category, setCategory] = useState<string>("all");
  const [intent, setIntent] = useState<string>("all");
  const [engine, setEngine] = useState<string>("chatgpt");
  const [sortKey, setSortKey] = useState<SortKey>("asks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const rows = useMemo(() => {
    const filtered = prompts.filter(
      (p) => (category === "all" || p.category === category) && (intent === "all" || p.intent === intent),
    );
    const mrOf = (p: Prompt) => p.perEngine.find((s) => s.e === engine)?.mr ?? 0;
    const sorted = [...filtered].sort((a, b) =>
      sortKey === "asks" ? a.estWeeklyAsks - b.estWeeklyAsks : mrOf(a) - mrOf(b),
    );
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }, [category, intent, engine, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted">Category</span>
          <FilterPill active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterPill>
          {meta.categories.map((c) => (
            <FilterPill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted">Intent stage</span>
          <FilterPill active={intent === "all"} onClick={() => setIntent("all")}>
            All
          </FilterPill>
          {INTENTS.map((it) => (
            <FilterPill key={it.id} active={intent === it.id} onClick={() => setIntent(it.id)} title={it.def}>
              {it.label}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted">Mention rate on</span>
          {meta.engines.map((e) => (
            <FilterPill key={e.id} active={engine === e.id} onClick={() => setEngine(e.id)}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: engineColor(e.id) }} />
              {e.name}
            </FilterPill>
          ))}
        </div>
      </div>

      <p className="mb-2 text-xs text-muted">
        Showing {rows.length} of {prompts.length} prompts. Mention rate and week-over-week change reflect the latest
        week on {engineName(engine)}; the trend column blends all five engines.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium text-muted">
              <th className="py-2 pr-3 font-medium">Prompt</th>
              <th className="py-2 pr-3 font-medium">Category</th>
              <th className="py-2 pr-3 font-medium">Intent</th>
              <th className="py-2 pr-3 text-right font-medium">
                <SortHeader
                  label="Est. weekly asks"
                  sortKey="asks"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  def="Demo assumption for how often people ask an engine this question each week. Engines do not publish prompt volumes."
                />
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                <SortHeader
                  label="Mention rate (95% CI)"
                  sortKey="mr"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  def="Share of the latest week's 70 sampled runs on the selected engine where the answer names the category's Adobe product. The range in parentheses is a 95% confidence interval."
                />
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                <Term def="Week-over-week change in mention rate on the selected engine, in percentage points.">WoW</Term>
              </th>
              <th className="py-2 font-medium">
                <Term def="26 weeks of mention rate, blended across all five engines by assumed usage share.">
                  26-wk trend
                </Term>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const s = p.perEngine.find((x) => x.e === engine);
              return (
                <tr key={p.id} className="border-b border-border-subtle/60 hover:bg-zinc-50/60">
                  <td className="max-w-xs py-2.5 pr-3">
                    <Link
                      href={`/prompts/${p.id}`}
                      className="font-medium underline-offset-2 hover:text-accent hover:underline"
                    >
                      {p.text}
                    </Link>
                    {p.treated ? (
                      <span
                        title="Treatment group in the Express help-content experiment"
                        className="ml-2 inline-block rounded bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-amber-700"
                      >
                        experiment
                      </span>
                    ) : null}
                    <div className="mt-0.5 text-xs text-muted">{p.adobeBrandName}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-muted">{categoryName(p.category)}</td>
                  <td className="py-2.5 pr-3 text-xs capitalize text-muted">{p.intent}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{num(p.estWeeklyAsks)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {s ? (
                      <>
                        <span className="font-semibold">{pct(s.mr)}</span>{" "}
                        <span className="text-xs text-muted">
                          ({Math.round(s.ciLo * 100)}-{Math.round(s.ciHi * 100)})
                        </span>
                      </>
                    ) : (
                      "n/a"
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right">{s ? <Delta value={s.mr - s.prevMr} /> : null}</td>
                  <td className="py-2.5">
                    <Sparkline values={p.spark} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
