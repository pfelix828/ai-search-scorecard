"use client";

/**
 * Interactive proxy chain: simulated AI-influenced sessions -> signups ->
 * paying users -> revenue proxies. All outputs are modeled, not measured.
 * Renders the model card, then `children` (the page's middle sections),
 * then the sensitivity table, so the sliders and the table share state.
 */
import { useState, type ReactNode } from "react";
import { Card, CardTitle, Pill, Term } from "@/components/ui";
import { money, num, pct } from "@/lib/format";

interface Defaults {
  signupRate: number;
  trialToPaid: number;
  arpuMonthly: number;
  grossMarginMonths: number;
}

function Slider({
  id,
  label,
  def,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  id: string;
  label: string;
  def: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-foreground/80">
          <Term def={def}>{label}</Term>
        </label>
        <span className="text-sm font-semibold tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-accent"
      />
    </div>
  );
}

function Output({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Modeled
        </span>
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight tabular-nums">{value}</div>
      <p className="mt-1 text-[11px] leading-snug text-muted">{caption}</p>
    </div>
  );
}

export function ProxyModel({
  baseSessions,
  defaults,
  weekLabel,
  children,
}: {
  baseSessions: number;
  defaults: Defaults;
  weekLabel: string;
  children?: ReactNode;
}) {
  const [signupRate, setSignupRate] = useState(defaults.signupRate);
  const [trialToPaid, setTrialToPaid] = useState(defaults.trialToPaid);
  const [arpu, setArpu] = useState(defaults.arpuMonthly);
  const [horizon, setHorizon] = useState(defaults.grossMarginMonths);

  const isDefault =
    signupRate === defaults.signupRate &&
    trialToPaid === defaults.trialToPaid &&
    arpu === defaults.arpuMonthly &&
    horizon === defaults.grossMarginMonths;

  const reset = () => {
    setSignupRate(defaults.signupRate);
    setTrialToPaid(defaults.trialToPaid);
    setArpu(defaults.arpuMonthly);
    setHorizon(defaults.grossMarginMonths);
  };

  const signups = baseSessions * signupRate;
  const payers = signups * trialToPaid;
  const gnarrOf = (s: number, t: number, a: number) => baseSessions * s * t * a * 12;
  const gnarr = gnarrOf(signupRate, trialToPaid, arpu);
  const ltv = payers * arpu * horizon;

  const sensitivity = [
    {
      name: "Signup rate",
      low: gnarrOf(signupRate * 0.8, trialToPaid, arpu),
      high: gnarrOf(signupRate * 1.2, trialToPaid, arpu),
      effect: "Moves the proxy one for one",
    },
    {
      name: "Trial-to-paid rate",
      low: gnarrOf(signupRate, trialToPaid * 0.8, arpu),
      high: gnarrOf(signupRate, trialToPaid * 1.2, arpu),
      effect: "Moves the proxy one for one",
    },
    {
      name: "Monthly price",
      low: gnarrOf(signupRate, trialToPaid, arpu * 0.8),
      high: gnarrOf(signupRate, trialToPaid, arpu * 1.2),
      effect: "Moves the proxy one for one",
    },
    {
      name: "LTV horizon",
      low: gnarr,
      high: gnarr,
      effect: "No effect here; it only moves the LTV figure",
    },
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle sub="Arm 1 of the funnel, the acquisition arm, modeled end to end. Move the sliders. Every output below recomputes live, and every output is a modeled estimate, not a measurement.">
            New-user acquisition: sessions to signups to revenue
          </CardTitle>
          <button
            type="button"
            onClick={reset}
            disabled={isDefault}
            className="rounded-md border border-border-subtle px-2.5 py-1 text-xs font-medium text-foreground/70 hover:bg-zinc-50 disabled:opacity-40"
          >
            Reset to defaults
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-zinc-50 px-3 py-2.5">
          <span className="text-xs text-muted">Fixed input from the simulated funnel:</span>
          <span className="text-base font-bold tabular-nums">{num(baseSessions)}</span>
          <span className="text-xs text-muted">
            estimated{" "}
            <Term def="Visits where an AI answer plausibly influenced the user to come to the site, whether or not analytics could attribute them. Modeled from mention rates and engine usage shares.">
              AI-influenced sessions
            </Term>{" "}
            in the week ending {weekLabel}, summed across all five engines.
          </span>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Slider
            id="signup-rate"
            label="Signup rate"
            def="Share of AI-influenced sessions that create a free account. Demo default based on a typical freemium landing rate."
            min={0.01}
            max={0.12}
            step={0.0025}
            value={signupRate}
            display={pct(signupRate, 1)}
            onChange={setSignupRate}
          />
          <Slider
            id="trial-to-paid"
            label="Trial-to-paid rate"
            def="Share of new signups that become paying subscribers. Demo default, adjustable."
            min={0.02}
            max={0.3}
            step={0.005}
            value={trialToPaid}
            display={pct(trialToPaid, 1)}
            onChange={setTrialToPaid}
          />
          <Slider
            id="arpu"
            label="Monthly price per paying user"
            def="Average monthly revenue per paying user across the tracked products. Demo default, adjustable."
            min={5}
            max={60}
            step={1}
            value={arpu}
            display={`$${arpu}/mo`}
            onChange={setArpu}
          />
          <Slider
            id="horizon"
            label="LTV horizon"
            def="How many months of revenue to count per paying user when estimating lifetime value. A simple stand-in for retention."
            min={6}
            max={48}
            step={3}
            value={horizon}
            display={`${horizon} months`}
            onChange={setHorizon}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Output
            label="Weekly signups"
            value={num(Math.round(signups))}
            caption="AI-influenced sessions times signup rate."
          />
          <Output
            label="Weekly new paying users"
            value={num(Math.round(payers))}
            caption="Signups times trial-to-paid rate."
          />
          <Output
            label="Gross new ARR proxy"
            value={money(gnarr)}
            caption="Illustrative gross new ARR proxy: new paying users times monthly price times 12, annualized from one week of new paying users."
          />
          <Output
            label="LTV-horizon value"
            value={money(ltv)}
            caption="New paying users times monthly price times the LTV horizon in months."
          />
        </div>

        <p className="mt-3 text-xs text-muted">
          The{" "}
          <Term def="The yearly value of newly added subscriptions, before churn or downgrades net it down.">
            gross new ARR
          </Term>{" "}
          and{" "}
          <Term def="Lifetime value: the revenue one customer generates over the time they stay subscribed.">LTV</Term>{" "}
          figures here are proxies: directional estimates built from stated assumptions, useful for comparing
          scenarios, not for booking revenue.
        </p>
      </Card>

      {children}

      <Card>
        <CardTitle sub="The illustrative gross new ARR proxy, recomputed with each slider at minus 20 percent, its current value, and plus 20 percent, holding the other sliders fixed.">
          Sensitivity: which assumption moves the proxy
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-muted">
                <th className="py-2 pr-3 font-medium">Assumption</th>
                <th className="py-2 pr-3 font-medium tabular-nums">At -20%</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Current</th>
                <th className="py-2 pr-3 font-medium tabular-nums">At +20%</th>
                <th className="py-2 font-medium">Effect on the proxy</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={row.name} className="border-b border-border-subtle/60">
                  <td className="py-2 pr-3 font-medium">{row.name}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(row.low)}</td>
                  <td className="py-2 pr-3 font-semibold tabular-nums">{money(gnarr)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(row.high)}</td>
                  <td className="py-2 text-muted">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          The point of a proxy model is not the headline number, it is knowing which assumption moves the answer most.
          Because this chain is multiplicative, the three rate assumptions each move the proxy exactly one for one, so
          the real work is narrowing whichever assumption has the widest plausible range. The LTV horizon never touches
          the annualized proxy at all; it only moves the lifetime value figure.
        </p>
        <div className="mt-2">
          <Pill>All values modeled from simulated data</Pill>
        </div>
      </Card>
    </>
  );
}
