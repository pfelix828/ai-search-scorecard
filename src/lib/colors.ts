/** Stable chart colors. Adobe brands use the accent red; competitors get distinct neutrals/blues. */

export const ADOBE_RED = "#eb1000";

export const brandColors: Record<string, string> = {
  // Adobe
  "adobe-express": ADOBE_RED,
  firefly: ADOBE_RED,
  acrobat: ADOBE_RED,
  photoshop: ADOBE_RED,
  premiere: ADOBE_RED,
  // competitors
  canva: "#00c4cc",
  figma: "#a259ff",
  picsart: "#7b68ee",
  "ms-designer": "#0078d4",
  midjourney: "#5865f2",
  "gpt-image": "#10a37f",
  ideogram: "#f59e0b",
  "stable-diffusion": "#64748b",
  smallpdf: "#fa4b4b",
  ilovepdf: "#e5322d",
  foxit: "#f97316",
  pdfgear: "#8b5cf6",
  photopea: "#0ea5e9",
  pixlr: "#22c55e",
  gimp: "#737373",
  "affinity-photo": "#d946ef",
  capcut: "#111827",
  davinci: "#f59e0b",
  finalcut: "#6b7280",
  filmora: "#3b82f6",
};

// Distinguish competitor PDF reds from Adobe red where they collide
brandColors.smallpdf = "#0ea5e9";
brandColors.ilovepdf = "#f59e0b";

export const engineColors: Record<string, string> = {
  chatgpt: "#10a37f",
  "ai-overviews": "#4285f4",
  gemini: "#9333ea",
  perplexity: "#1fb8cd",
  copilot: "#0078d4",
};

export const severityStyles: Record<string, { bg: string; text: string; label: string }> = {
  win: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Win" },
  opportunity: { bg: "bg-sky-50", text: "text-sky-700", label: "Opportunity" },
  risk: { bg: "bg-red-50", text: "text-red-700", label: "Risk" },
  watch: { bg: "bg-amber-50", text: "text-amber-700", label: "Watch" },
};

export function brandColor(id: string): string {
  return brandColors[id] ?? "#9ca3af";
}
export function engineColor(id: string): string {
  return engineColors[id] ?? "#9ca3af";
}
