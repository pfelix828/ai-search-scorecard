import { meta, weeklyRows, adobeBrandOf, LAST_WEEK } from "@/lib/data";
import { score, pct } from "@/lib/format";

/**
 * Latest-week Visibility Score per (Adobe product, engine), as a colored table.
 * Plain HTML, no chart library. White = score 0, deep green = score 100.
 */
function heatColor(v: number): { bg: string; dark: boolean } {
  const t = Math.max(0, Math.min(1, v / 100));
  // interpolate white (255,255,255) -> emerald (5,150,105)
  const r = Math.round(255 + (5 - 255) * t);
  const g = Math.round(255 + (150 - 255) * t);
  const b = Math.round(255 + (105 - 255) * t);
  return { bg: `rgb(${r}, ${g}, ${b})`, dark: t > 0.55 };
}

export function VisibilityHeatmap() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="w-36" aria-label="Product" />
            {meta.engines.map((e) => (
              <th key={e.id} className="px-2 pb-1 text-center align-bottom">
                <div className="text-xs font-medium text-foreground/80">{e.name}</div>
                <div className="text-[10px] font-normal text-muted">{pct(e.usageShare)} of usage</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meta.categories.map((cat) => {
            const brand = adobeBrandOf(cat.id);
            if (!brand) return null;
            return (
              <tr key={cat.id}>
                <th className="pr-3 text-left text-xs font-medium text-foreground/80">{brand.name}</th>
                {meta.engines.map((eng) => {
                  const row = weeklyRows({ w: LAST_WEEK, c: cat.id, e: eng.id, b: brand.id })[0];
                  if (!row) {
                    return (
                      <td key={eng.id} className="rounded-md px-2 py-2.5 text-center text-xs text-muted">
                        n/a
                      </td>
                    );
                  }
                  const { bg, dark } = heatColor(row.vs);
                  return (
                    <td
                      key={eng.id}
                      className="rounded-md px-2 py-2.5 text-center text-xs font-semibold tabular-nums"
                      style={{ background: bg, color: dark ? "#ffffff" : "#1c1c1e" }}
                      title={`${brand.name} on ${eng.name}: Visibility Score ${score(row.vs)} (simulated)`}
                    >
                      {score(row.vs)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted">
        Scale: white = 0 (no mentions and no citations in that engine&apos;s sampled answers), deep green = 100 (mentioned
        first in every sampled answer, with full citation share and positive framing).
      </p>
    </div>
  );
}
