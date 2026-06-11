/** Formatting helpers shared across pages. */

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

/** Percentage-point delta, signed: +4 pts / -2 pts */
export const pts = (x: number, digits = 0) => {
  const v = (x * 100).toFixed(digits);
  return `${x >= 0 ? "+" : ""}${v} pts`;
};

export const num = (x: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(x);

export const money = (x: number) =>
  Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(x);

export const score = (x: number) => x.toFixed(1);

/** "2026-06-07" -> "Jun 7" */
export const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  void y;
  return `${months[m - 1]} ${d}`;
};
