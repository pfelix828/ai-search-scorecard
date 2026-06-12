/**
 * Synthetic data generator for the AI Search Visibility Scorecard demo.
 *
 * ALL DATA PRODUCED HERE IS SIMULATED. It is designed to be statistically
 * coherent (binomial sampling of mentions, autocorrelated weekly trends,
 * planned narrative events) so the dashboard demonstrates a measurement
 * framework — it is not a claim about real brand performance.
 *
 * Deterministic: seeded RNG, so `npm run data` always regenerates the same
 * dataset. Run: node scripts/generate-data.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) + distributions
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260607);
const uniform = (lo, hi) => lo + (hi - lo) * rand();
// Box-Muller normal
function normal(mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function binomial(n, p) {
  let k = 0;
  for (let i = 0; i < n; i++) if (rand() < p) k++;
  return k;
}
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

// Wilson score interval for a binomial proportion (z = 1.96)
function wilson(k, n) {
  if (n === 0) return { lo: 0, hi: 0 };
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { lo: clamp(center - half, 0, 1), hi: clamp(center + half, 0, 1) };
}

// ---------------------------------------------------------------------------
// Panel design
// ---------------------------------------------------------------------------
// 26 weekly rollups, week-ending Sundays, last = 2026-06-07.
const N_WEEKS = 26;
const weekEndings = [];
{
  const last = new Date(Date.UTC(2026, 5, 7)); // Jun 7 2026, Sunday
  for (let i = N_WEEKS - 1; i >= 0; i--) {
    const d = new Date(last);
    d.setUTCDate(d.getUTCDate() - 7 * (N_WEEKS - 1 - i));
    weekEndings[i] = d.toISOString().slice(0, 10);
  }
}

// Runs per prompt-engine-week: 10 sampled runs/day x 7 days (Adobe LLM
// Optimizer analyzes prompts daily and rolls up weekly).
const RUNS_PER_WEEK = 70;

// Engines, with assumed share of AI-assistant usage for exposure modeling
// (directionally consistent with published referral-share data; ChatGPT
// carries 80%+ of attributable AI referral traffic).
const engines = [
  { id: "chatgpt", name: "ChatGPT", usageShare: 0.56, referrerCapture: 0.55 },
  { id: "ai-overviews", name: "Google AI Overviews", usageShare: 0.2, referrerCapture: 0.0 }, // clicks arrive as google.com → organic
  { id: "gemini", name: "Google Gemini", usageShare: 0.09, referrerCapture: 0.45 },
  { id: "perplexity", name: "Perplexity", usageShare: 0.08, referrerCapture: 0.6 },
  { id: "copilot", name: "Microsoft Copilot", usageShare: 0.07, referrerCapture: 0.4 },
];

// Categories: Adobe flagship product vs tracked competitors.
// baseline = week-1 mention rate on a "typical" engine; engines modify it.
const categories = [
  {
    id: "quick-design",
    name: "Quick Design & Social Content",
    adobeBrand: "Adobe Express",
    brands: [
      { id: "adobe-express", name: "Adobe Express", adobe: true, baseline: 0.38, trend: 0.0015, position: 2.6, sentiment: 0.55, citationShare: 0.1 },
      { id: "canva", name: "Canva", baseline: 0.78, trend: 0.001, position: 1.4, sentiment: 0.62, citationShare: 0.3 },
      { id: "figma", name: "Figma", baseline: 0.3, trend: 0.0005, position: 3.1, sentiment: 0.5, citationShare: 0.08 },
      { id: "picsart", name: "Picsart", baseline: 0.22, trend: -0.0005, position: 3.6, sentiment: 0.42, citationShare: 0.05 },
      { id: "ms-designer", name: "Microsoft Designer", baseline: 0.18, trend: 0.0008, position: 3.8, sentiment: 0.45, citationShare: 0.05 },
    ],
  },
  {
    id: "genai-image",
    name: "Generative AI Imaging",
    adobeBrand: "Adobe Firefly",
    brands: [
      { id: "firefly", name: "Adobe Firefly", adobe: true, baseline: 0.34, trend: 0.002, position: 2.9, sentiment: 0.58, citationShare: 0.12 },
      { id: "midjourney", name: "Midjourney", baseline: 0.72, trend: 0.0005, position: 1.6, sentiment: 0.6, citationShare: 0.15 },
      { id: "gpt-image", name: "OpenAI GPT Image", baseline: 0.62, trend: 0.004, position: 1.9, sentiment: 0.57, citationShare: 0.1 },
      { id: "ideogram", name: "Ideogram", baseline: 0.28, trend: 0.001, position: 3.4, sentiment: 0.48, citationShare: 0.06 },
      { id: "stable-diffusion", name: "Stable Diffusion", baseline: 0.4, trend: -0.001, position: 2.8, sentiment: 0.45, citationShare: 0.08 },
    ],
  },
  {
    id: "pdf-tools",
    name: "PDF & Document Productivity",
    adobeBrand: "Adobe Acrobat",
    brands: [
      { id: "acrobat", name: "Adobe Acrobat", adobe: true, baseline: 0.74, trend: 0.0005, position: 1.5, sentiment: 0.52, citationShare: 0.22 },
      { id: "smallpdf", name: "Smallpdf", baseline: 0.42, trend: 0.0005, position: 2.7, sentiment: 0.5, citationShare: 0.28 },
      { id: "ilovepdf", name: "iLovePDF", baseline: 0.38, trend: 0.001, position: 2.9, sentiment: 0.48, citationShare: 0.24 },
      { id: "foxit", name: "Foxit", baseline: 0.3, trend: 0, position: 3.2, sentiment: 0.45, citationShare: 0.08 },
      { id: "pdfgear", name: "PDFgear", baseline: 0.16, trend: 0.0015, position: 3.9, sentiment: 0.44, citationShare: 0.05 },
    ],
  },
  {
    id: "photo-editing",
    name: "Photo Editing",
    adobeBrand: "Adobe Photoshop",
    brands: [
      { id: "photoshop", name: "Adobe Photoshop", adobe: true, baseline: 0.8, trend: 0, position: 1.3, sentiment: 0.5, citationShare: 0.18 },
      { id: "photopea", name: "Photopea", baseline: 0.34, trend: 0.001, position: 2.9, sentiment: 0.52, citationShare: 0.1 },
      { id: "pixlr", name: "Pixlr", baseline: 0.28, trend: 0, position: 3.3, sentiment: 0.46, citationShare: 0.07 },
      { id: "gimp", name: "GIMP", baseline: 0.46, trend: -0.0005, position: 2.5, sentiment: 0.4, citationShare: 0.09 },
      { id: "affinity-photo", name: "Affinity Photo", baseline: 0.3, trend: 0.0005, position: 3.0, sentiment: 0.5, citationShare: 0.06 },
    ],
  },
  {
    id: "video-editing",
    name: "Video Editing",
    adobeBrand: "Adobe Premiere Pro",
    brands: [
      { id: "premiere", name: "Adobe Premiere Pro", adobe: true, baseline: 0.6, trend: 0.0005, position: 1.9, sentiment: 0.52, citationShare: 0.14 },
      { id: "capcut", name: "CapCut", baseline: 0.6, trend: 0.003, position: 1.8, sentiment: 0.55, citationShare: 0.12 },
      { id: "davinci", name: "DaVinci Resolve", baseline: 0.55, trend: 0.001, position: 2.2, sentiment: 0.58, citationShare: 0.1 },
      { id: "finalcut", name: "Final Cut Pro", baseline: 0.35, trend: 0, position: 2.8, sentiment: 0.5, citationShare: 0.06 },
      { id: "filmora", name: "Filmora", baseline: 0.3, trend: 0.0005, position: 3.2, sentiment: 0.44, citationShare: 0.07 },
    ],
  },
];

// Engine-level modifiers on Adobe-brand mention propensity (e.g., Perplexity
// is citation-driven, AI Overviews lean on web corpus where adobe.com helps).
const engineBrandMod = {
  chatgpt: { default: 1.0 },
  "ai-overviews": { default: 1.05, "adobe-express": 1.1, acrobat: 1.08 },
  gemini: { default: 0.95 },
  perplexity: { default: 0.92, firefly: 1.05 },
  copilot: { default: 1.0, "ms-designer": 1.6 },
};

// Narrative events baked into the series:
// 1. Week 14 (w/e 2026-03-22): Express content program ships on treated
//    prompts (llms.txt + FAQ restructure + schema) → mention-rate lift on
//    ChatGPT/Perplexity for treated half of quick-design panel.
const EXPRESS_INTERVENTION_WEEK = 14;
// 2. Week 19 (w/e 2026-04-26): Gemini model update → volatility shock, all
//    brands on Gemini; partial recovery over 3 weeks.
const GEMINI_SHOCK_WEEK = 19;
// 3. Weeks 8-11: Photoshop pricing-news cycle → sentiment dip when mentioned.
const PS_SENTIMENT_DIP = [8, 11];
// 4. Week 10 (w/e 2026-02-22): Firefly PR/seeding push → citation lift on
//    Perplexity only (null on ChatGPT — kept honestly null).
const FIREFLY_PR_WEEK = 10;

// Intent stages for the prompt panel
const intents = ["discovery", "evaluation", "how-to", "suitability"];

// Prompt panel: 8 prompts per category. volume = est. weekly asks across
// engines (High/Medium/Low buckets used for weighting).
const promptPanel = [
  // quick-design
  { cat: "quick-design", text: "What's the best free tool to make social media posts?", intent: "discovery", vol: "high", treated: true },
  { cat: "quick-design", text: "Adobe Express vs Canva: which should I use?", intent: "evaluation", vol: "high", treated: false },
  { cat: "quick-design", text: "How do I make an Instagram story with my brand colors?", intent: "how-to", vol: "medium", treated: true },
  { cat: "quick-design", text: "Best design app for a small business owner with no design skills?", intent: "suitability", vol: "high", treated: true },
  { cat: "quick-design", text: "Quickest way to resize one design for every social platform?", intent: "how-to", vol: "medium", treated: true },
  { cat: "quick-design", text: "What tool should a marketing team use for branded templates?", intent: "suitability", vol: "medium", treated: false },
  { cat: "quick-design", text: "Free Canva alternatives worth trying?", intent: "discovery", vol: "medium", treated: false },
  { cat: "quick-design", text: "Best tool to design a flyer in under ten minutes?", intent: "discovery", vol: "low", treated: false },
  // genai-image
  { cat: "genai-image", text: "What's the best AI image generator right now?", intent: "discovery", vol: "high" },
  { cat: "genai-image", text: "Which AI image tool is safe for commercial use?", intent: "suitability", vol: "medium", fireflyStrong: true },
  { cat: "genai-image", text: "Adobe Firefly vs Midjourney: strengths and weaknesses?", intent: "evaluation", vol: "medium" },
  { cat: "genai-image", text: "How do I generate product photos with AI for my store?", intent: "how-to", vol: "medium" },
  { cat: "genai-image", text: "Best AI image tool that won't get me sued over copyright?", intent: "suitability", vol: "medium", fireflyStrong: true },
  { cat: "genai-image", text: "AI image generators with the best text rendering?", intent: "evaluation", vol: "low" },
  { cat: "genai-image", text: "How can I extend the background of a photo with AI?", intent: "how-to", vol: "medium", fireflyStrong: true },
  { cat: "genai-image", text: "Cheapest way to generate marketing images with AI?", intent: "discovery", vol: "medium" },
  // pdf-tools
  { cat: "pdf-tools", text: "What's the best PDF editor?", intent: "discovery", vol: "high" },
  { cat: "pdf-tools", text: "How do I edit a PDF for free?", intent: "how-to", vol: "high", citationLeak: true },
  { cat: "pdf-tools", text: "Adobe Acrobat vs Smallpdf: is Acrobat worth it?", intent: "evaluation", vol: "medium" },
  { cat: "pdf-tools", text: "How do I combine several PDFs into one file?", intent: "how-to", vol: "high", citationLeak: true },
  { cat: "pdf-tools", text: "Best PDF tool for a small law office?", intent: "suitability", vol: "low" },
  { cat: "pdf-tools", text: "How can I get an AI summary of a long PDF?", intent: "how-to", vol: "medium" },
  { cat: "pdf-tools", text: "Is there a good free alternative to Adobe Acrobat?", intent: "discovery", vol: "high", citationLeak: true },
  { cat: "pdf-tools", text: "Best way to e-sign documents?", intent: "discovery", vol: "medium" },
  // photo-editing
  { cat: "photo-editing", text: "What's the best photo editing software?", intent: "discovery", vol: "high" },
  { cat: "photo-editing", text: "Photoshop vs free editors like Photopea: what do I give up?", intent: "evaluation", vol: "medium" },
  { cat: "photo-editing", text: "How do I remove the background from a photo?", intent: "how-to", vol: "high" },
  { cat: "photo-editing", text: "Best photo editor for a beginner photographer?", intent: "suitability", vol: "medium" },
  { cat: "photo-editing", text: "How do I remove a person from a photo?", intent: "how-to", vol: "medium" },
  { cat: "photo-editing", text: "Is Photoshop still worth the subscription?", intent: "evaluation", vol: "medium", priceSensitive: true },
  { cat: "photo-editing", text: "Best free photo editing app on the web?", intent: "discovery", vol: "medium" },
  { cat: "photo-editing", text: "How do I batch-edit hundreds of photos quickly?", intent: "how-to", vol: "low" },
  // video-editing
  { cat: "video-editing", text: "What's the best video editing software?", intent: "discovery", vol: "high" },
  { cat: "video-editing", text: "Best video editor for TikTok and Reels?", intent: "suitability", vol: "high", capcutStrong: true },
  { cat: "video-editing", text: "Premiere Pro vs DaVinci Resolve for a YouTuber?", intent: "evaluation", vol: "medium" },
  { cat: "video-editing", text: "How do I auto-caption a video?", intent: "how-to", vol: "high", capcutStrong: true },
  { cat: "video-editing", text: "Best video editor for a marketing team?", intent: "suitability", vol: "medium" },
  { cat: "video-editing", text: "Easiest way to cut silence out of a long recording?", intent: "how-to", vol: "low" },
  { cat: "video-editing", text: "Professional video editing software comparison?", intent: "evaluation", vol: "medium" },
  { cat: "video-editing", text: "How do I color-grade footage like a pro?", intent: "how-to", vol: "low" },
];

const volWeights = { high: 3, medium: 2, low: 1 };
// Estimated weekly asks per prompt theme across all engines (demo assumption)
const volAsks = { high: 40000, medium: 12000, low: 3000 };

// ---------------------------------------------------------------------------
// Mention-rate model per (week, engine, category, brand)
// ---------------------------------------------------------------------------
function brandWeeklyP(cat, brand, engineId, w, promptFlags = {}) {
  let p = brand.baseline + brand.trend * w; // gentle secular trend (per-week)
  const mod = engineBrandMod[engineId] || { default: 1 };
  p *= mod[brand.id] ?? mod.default ?? 1;

  // Narrative: Express treated-content lift (ChatGPT + Perplexity, post wk14)
  if (brand.id === "adobe-express" && promptFlags.treated && (engineId === "chatgpt" || engineId === "perplexity") && w >= EXPRESS_INTERVENTION_WEEK) {
    const ramp = Math.min(1, (w - EXPRESS_INTERVENTION_WEEK + 1) / 4);
    p += 0.14 * ramp;
  }
  // Category-level echo of the Express program (smaller, untreated spillover ~0)
  // Firefly strengths/weaknesses by prompt type
  if (brand.id === "firefly" && promptFlags.fireflyStrong) p += 0.3;
  if (brand.id === "firefly" && promptFlags.intent === "discovery") p -= 0.1;
  // CapCut social-video dominance
  if (brand.id === "capcut" && promptFlags.capcutStrong) p += 0.2;
  if (brand.id === "premiere" && promptFlags.capcutStrong) p -= 0.15;
  // Gemini model-update shock: depress mention rates, recovering over ~3 weeks
  if (engineId === "gemini" && w >= GEMINI_SHOCK_WEEK) {
    const since = w - GEMINI_SHOCK_WEEK;
    const recovery = Math.min(1, since / 3);
    p *= 0.78 + 0.18 * recovery;
  }
  return clamp(p, 0.01, 0.97);
}

function brandWeeklySentiment(brand, w) {
  let s = brand.sentiment;
  if (brand.id === "photoshop" && w >= PS_SENTIMENT_DIP[0] && w <= PS_SENTIMENT_DIP[1]) s -= 0.25;
  return clamp(s + normal(0, 0.04), -1, 1);
}

function brandWeeklyCitation(brand, engineId, w, promptFlags = {}) {
  let c = brand.citationShare;
  if (promptFlags.citationLeak && (brand.id === "smallpdf" || brand.id === "ilovepdf")) c += 0.15;
  if (promptFlags.citationLeak && brand.id === "acrobat") c -= 0.08;
  if (brand.id === "firefly" && engineId === "perplexity" && w >= FIREFLY_PR_WEEK) {
    c += 0.1 * Math.min(1, (w - FIREFLY_PR_WEEK + 1) / 3);
  }
  if (engineId === "perplexity") c *= 1.3; // citation-heavy engine
  return clamp(c + normal(0, 0.015), 0, 0.85);
}

// Illustrative composite, modeled on Adobe LLM Optimizer's published
// definition (weighted blend of mentions, citations, sentiment, rank).
// Weights here are our own and stated openly in the methodology page.
function visibilityScore(mr, avgPos, citShare, sent) {
  const positionFactor = clamp((4 - Math.min(avgPos, 4)) / 3, 0, 1);
  const base = 0.45 * mr + 0.2 * positionFactor + 0.2 * citShare;
  if (sent === null) return (100 / 0.85) * base; // no mentions -> no sentiment reading; renormalize remaining weights
  return 100 * (base + 0.15 * ((sent + 1) / 2));
}

// ---------------------------------------------------------------------------
// Generate weekly brand x engine x category rollups
// ---------------------------------------------------------------------------
const weekly = [];
// per-prompt weekly series for the Adobe brand (sparklines + drilldowns)
const promptSeries = promptPanel.map(() => []);

for (let w = 0; w < N_WEEKS; w++) {
  for (const cat of categories) {
    const catPrompts = promptPanel
      .map((p, idx) => ({ ...p, idx }))
      .filter((p) => p.cat === cat.id);
    for (const eng of engines) {
      // accumulate category-level stats from prompt-level binomial draws
      const acc = {};
      for (const brand of cat.brands) acc[brand.id] = { mentions: 0, n: 0, n2: 0, posSum: 0, posN: 0, citSum: 0, citN: 0, sentSum: 0, sentN: 0 };

      for (const prompt of catPrompts) {
        const wgt = volWeights[prompt.vol];
        const n = RUNS_PER_WEEK; // runs per prompt-engine-week
        for (const brand of cat.brands) {
          const flags = { treated: prompt.treated, fireflyStrong: prompt.fireflyStrong, capcutStrong: prompt.capcutStrong, citationLeak: prompt.citationLeak, priceSensitive: prompt.priceSensitive, intent: prompt.intent };
          const p = brandWeeklyP(cat, brand, eng.id, w, flags);
          const k = binomial(n, p);
          const a = acc[brand.id];
          // volume-weighted accumulation at category level
          a.mentions += k * wgt;
          a.n += n * wgt;
          a.n2 += n * wgt * wgt;
          if (k > 0) {
            const pos = clamp(normal(brand.position, 0.5), 1, 8);
            a.posSum += pos * k * wgt;
            a.posN += k * wgt;
            const sent = brandWeeklySentiment(brand, w);
            a.sentSum += sent * k * wgt;
            a.sentN += k * wgt;
          }
          const cit = brandWeeklyCitation(brand, eng.id, w, flags);
          a.citSum += cit * wgt;
          a.citN += wgt;

          // store Adobe-brand prompt-level series (unweighted, raw n)
          if (brand.adobe) {
            promptSeries[prompt.idx].push({ w, e: eng.id, k, n, p: round(k / n) });
          }
        }
      }

      const cellRows = [];
      for (const brand of cat.brands) {
        const a = acc[brand.id];
        const mr = a.mentions / a.n;
        const avgPos = a.posN > 0 ? a.posSum / a.posN : null;
        const cit = a.citSum / a.citN;
        const sent = a.sentN > 0 ? a.sentSum / a.sentN : null;
        const nEff = (a.n * a.n) / a.n2; // Kish effective sample size for the weighted proportion
        const ci = wilson(mr * nEff, nEff);
        cellRows.push({ brand, mr, avgPos, cit, sent, ci, n: a.n });
      }
      // Citation shares are shares of one pool of cited sources, so tracked
      // brands plus untracked sources (blogs, video, news) must sum to 1.
      // Renormalize the cell when tracked brands would exceed 90%, reserving
      // at least a 10% remainder for untracked sources.
      const citTotal = cellRows.reduce((s, r) => s + r.cit, 0);
      const citScale = citTotal > 0.9 ? 0.9 / citTotal : 1;
      for (const r of cellRows) {
        const cit = r.cit * citScale;
        weekly.push({
          w,
          week: weekEndings[w],
          c: cat.id,
          e: eng.id,
          b: r.brand.id,
          mr: round(r.mr),
          ciLo: round(r.ci.lo),
          ciHi: round(r.ci.hi),
          pos: r.avgPos === null ? null : round(r.avgPos, 2),
          cit: round(cit),
          sent: r.sent === null ? null : round(r.sent, 2),
          vs: round(visibilityScore(r.mr, r.avgPos ?? 4, cit, r.sent), 1),
          n: r.n,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Prompt-level latest snapshot + sparklines
// ---------------------------------------------------------------------------
const prompts = promptPanel.map((p, idx) => {
  const series = promptSeries[idx];
  const cat = categories.find((c) => c.id === p.cat);
  const adobeBrand = cat.brands.find((b) => b.adobe);
  const perEngine = engines.map((eng) => {
    const latest = series.find((r) => r.w === N_WEEKS - 1 && r.e === eng.id);
    const prev = series.find((r) => r.w === N_WEEKS - 2 && r.e === eng.id);
    const ci = wilson(latest.k, latest.n);
    // pooled over the last 6 weeks: the window size the methodology says to
    // read for prompt-level statements, since single weeks are noise at n=70
    const recent = series.filter((r) => r.e === eng.id && r.w >= N_WEEKS - 6);
    const k6 = recent.reduce((s, r) => s + r.k, 0);
    const n6 = recent.reduce((s, r) => s + r.n, 0);
    const ci6 = wilson(k6, n6);
    return {
      e: eng.id,
      mr: round(latest.k / latest.n),
      prevMr: round(prev.k / prev.n),
      ciLo: round(ci.lo),
      ciHi: round(ci.hi),
      k: latest.k,
      n: latest.n,
      mr6w: round(k6 / n6),
      ci6wLo: round(ci6.lo),
      ci6wHi: round(ci6.hi),
      k6w: k6,
      n6w: n6,
    };
  });
  // blended weekly mention rate across engines (usage-share weighted)
  const spark = [];
  for (let w = 0; w < N_WEEKS; w++) {
    let num = 0, den = 0;
    for (const eng of engines) {
      const r = series.find((s) => s.w === w && s.e === eng.id);
      num += (r.k / r.n) * eng.usageShare;
      den += eng.usageShare;
    }
    spark.push(round(num / den));
  }
  return {
    id: `p${String(idx + 1).padStart(2, "0")}`,
    text: p.text,
    category: p.cat,
    intent: p.intent,
    volume: p.vol,
    estWeeklyAsks: volAsks[p.vol],
    treated: !!p.treated,
    adobeBrand: adobeBrand.id,
    adobeBrandName: adobeBrand.name,
    perEngine,
    spark,
  };
});

// ---------------------------------------------------------------------------
// Site-side funnel: AI referral sessions, agentic traffic, signups (weekly)
// All simulated. Engine referral sessions loosely follow visibility, with an
// overall channel growth curve and the AI Overviews dark-traffic problem.
// ---------------------------------------------------------------------------
const funnel = [];
for (let w = 0; w < N_WEEKS; w++) {
  const channelGrowth = 1 + 0.035 * w; // ~3.5% weekly channel growth (demo assumption)
  for (const eng of engines) {
    // average Adobe visibility across categories this week on this engine
    const rows = weekly.filter((r) => r.w === w && r.e === eng.id && categories.find((c) => c.id === r.c).brands.find((b) => b.id === r.b)?.adobe);
    const avgMr = rows.reduce((s, r) => s + r.mr, 0) / rows.length;
    const base = 90000; // demo scale unit: weekly sessions across tracked categories
    const trueSessions = Math.round(base * eng.usageShare * avgMr * channelGrowth * (1 + normal(0, 0.04)));
    const observed = Math.round(trueSessions * eng.referrerCapture);
    const agentic = Math.round(trueSessions * uniform(8, 14)); // crawls far exceed referrals
    funnel.push({
      w,
      week: weekEndings[w],
      e: eng.id,
      estSessions: trueSessions,
      observedSessions: observed,
      agenticHits: agentic,
    });
  }
}

// Outcome-model default assumptions (every one adjustable in the UI; all
// are demo values chosen near published industry reference points).
const outcomeAssumptions = {
  referrerCaptureNote: "Share of AI-influenced visits that keep an AI referrer. Industry estimates put this at 30-40%; the rest land in Direct/Organic.",
  signupRate: 0.055, // AI-referred visitors convert well (Similarweb: ChatGPT referrals 7.1% retail CVR)
  trialToPaid: 0.11,
  arpuMonthly: 14.0,
  grossMarginMonths: 24, // LTV horizon in months for the proxy
};

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------
function seriesFor(brandId, engineIds, promptFilter) {
  // weekly blended mention rate for brand over selected prompts/engines
  const out = [];
  for (let w = 0; w < N_WEEKS; w++) {
    let k = 0, n = 0;
    promptPanel.forEach((p, idx) => {
      if (!promptFilter(p)) return;
      for (const e of engineIds) {
        const r = promptSeries[idx].find((s) => s.w === w && s.e === e);
        if (r) { k += r.k; n += r.n; }
      }
    });
    const ci = wilson(k, n);
    out.push({ w, week: weekEndings[w], mr: round(k / n), ciLo: round(ci.lo), ciHi: round(ci.hi), k, n });
  }
  return out;
}

const expressTreated = seriesFor("adobe-express", ["chatgpt", "perplexity"], (p) => p.cat === "quick-design" && p.treated);
const expressControl = seriesFor("adobe-express", ["chatgpt", "perplexity"], (p) => p.cat === "quick-design" && !p.treated);

// Firefly PR experiment: citation share on Perplexity vs ChatGPT (weekly model values)
const fireflyPerplexity = [];
const fireflyChatgpt = [];
{
  const cat = categories.find((c) => c.id === "genai-image");
  const ff = cat.brands.find((b) => b.id === "firefly");
  for (let w = 0; w < N_WEEKS; w++) {
    const rowP = weekly.find((r) => r.w === w && r.e === "perplexity" && r.b === "firefly");
    const rowC = weekly.find((r) => r.w === w && r.e === "chatgpt" && r.b === "firefly");
    fireflyPerplexity.push({ w, week: weekEndings[w], cit: rowP.cit });
    fireflyChatgpt.push({ w, week: weekEndings[w], cit: rowC.cit });
  }
}

function liftStats(series, interventionWeek, preWindow = 6, postWindow = 6) {
  const pre = series.filter((r) => r.w >= interventionWeek - preWindow && r.w < interventionWeek);
  const post = series.filter((r) => r.w >= interventionWeek + 1 && r.w <= interventionWeek + postWindow);
  const preK = pre.reduce((s, r) => s + (r.k ?? 0), 0);
  const preN = pre.reduce((s, r) => s + (r.n ?? 0), 0);
  const postK = post.reduce((s, r) => s + (r.k ?? 0), 0);
  const postN = post.reduce((s, r) => s + (r.n ?? 0), 0);
  if (preN === 0 || postN === 0) return null;
  const p1 = preK / preN, p2 = postK / postN;
  const se = Math.sqrt((p1 * (1 - p1)) / preN + (p2 * (1 - p2)) / postN);
  return {
    pre: round(p1), post: round(p2), liftPts: round(round(p2) - round(p1)),
    ciLo: round(p2 - p1 - 1.96 * se), ciHi: round(p2 - p1 + 1.96 * se),
  };
}

const experiments = [
  {
    id: "express-content",
    name: "Express help-content restructure (llms.txt + FAQ schema)",
    status: "positive",
    interventionWeek: EXPRESS_INTERVENTION_WEEK,
    interventionDate: weekEndings[EXPRESS_INTERVENTION_WEEK],
    design:
      "Treated vs control prompt panel. Four quick-design prompts whose answers draw on Express help content were designated treated; the other four stayed control. Content team shipped llms.txt, restructured FAQs into direct Q&A blocks, and added HowTo schema during the week ending Mar 22, 2026; that week sits on the pre/post boundary. Outcome: weekly mention rate on ChatGPT + Perplexity, 70 runs per prompt-engine-week.",
    metric: "Adobe Express mention rate (ChatGPT + Perplexity)",
    treated: expressTreated,
    control: expressControl,
    treatedLift: liftStats(expressTreated, EXPRESS_INTERVENTION_WEEK),
    controlLift: liftStats(expressControl, EXPRESS_INTERVENTION_WEEK),
    readout:
      "Treated prompts rose ~12-14 pts vs a flat control panel. Because answer engines refresh retrieval corpora on different cadences, the lift ramped over ~4 weeks rather than stepping. Next iteration: replicate on the PDF panel where citation leakage to competitor how-to content is the gap.",
    caveats:
      "No true randomization at user level; assignment was judgment-based, following which prompts draw on Express help content, so the two arms differ in intent and volume mix; pooled pre-period mention rates were nearly identical, 38.2% treated vs 38.5% control, which supports baseline comparability. Stochastic sampling noise means week-level reads need the pooled 6-week pre/post window.",
  },
  {
    id: "firefly-pr",
    name: "Firefly commercial-safety PR & citation seeding",
    status: "mixed",
    interventionWeek: FIREFLY_PR_WEEK,
    interventionDate: weekEndings[FIREFLY_PR_WEEK],
    design:
      "PR placements and third-party reviews emphasizing Firefly's licensed-training-data position, targeting publications answer engines tend to cite. Outcome: Firefly citation share by engine, pre/post week ending Feb 22, 2026.",
    metric: "Firefly citation share (share of cited sources)",
    perplexitySeries: fireflyPerplexity,
    chatgptSeries: fireflyChatgpt,
    readout:
      "Citation share rose on Perplexity (citation-forward engine, fast corpus refresh) but showed no detectable change on ChatGPT in the same window. Honest read: the channel mechanism matters: earned citations move citation-driven engines first; ChatGPT visibility appears to route more through broad web presence than individual placements.",
    caveats:
      "Null on ChatGPT is a real null at this sample size, not evidence the tactic can never work there. Citation share is modeled per answer sample; engine corpus-refresh timing is unobservable, so attribution to the PR push specifically is an assumption.",
  },
];

// ---------------------------------------------------------------------------
// Insights feed (generated from the data so numbers always match)
// ---------------------------------------------------------------------------
function catEngineRow(w, c, e, b) {
  return weekly.find((r) => r.w === w && r.c === c && r.e === e && r.b === b);
}
const LAST = N_WEEKS - 1;
/** "2026-06-07" -> "Jun 7" (mirrors src/lib/format.ts shortDate) */
const shortDate = (iso) => {
  const [, m, d] = iso.split("-").map(Number);
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " " + d;
};
const insights = [];
{
  // Express experiment lift, quoted on the pooled pre/post windows the
  // methodology calls for rather than single-week endpoints
  const tl = experiments[0].treatedLift;
  const cl = experiments[0].controlLift;
  const pts = (x) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}`;
  insights.push({
    week: weekEndings[LAST],
    severity: "win",
    category: "quick-design",
    title: `Express mention rate up ${pts(tl.liftPts)} pts on treated prompts since the help-content restructure`,
    body: `Pooled over six-week pre/post windows on ChatGPT and Perplexity, the four treated prompts moved from ${(tl.pre * 100).toFixed(1)}% to ${(tl.post * 100).toFixed(1)}% (${pts(tl.liftPts)} pts, 95% CI ${pts(tl.ciLo)} to ${pts(tl.ciHi)}), while the four control prompts stayed flat (${pts(cl.liftPts)} pts, 95% CI ${pts(cl.ciLo)} to ${pts(cl.ciHi)}). The flat control supports a content-driven mechanism rather than a model-version effect. Recommended action: extend the same llms.txt + FAQ pattern to the PDF how-to cluster.`,
    link: "/experiments",
  });
  const mj = catEngineRow(LAST, "genai-image", "chatgpt", "midjourney");
  const ff = catEngineRow(LAST, "genai-image", "chatgpt", "firefly");
  // Within-brand contrast on pooled six-week windows: Firefly's own rate on
  // the two commercial-safety suitability prompts vs the generic discovery
  // prompt. (The panel tracks competitor rates at category level only, so no
  // claim is made about which tool leads on individual prompts.)
  const safety = prompts.filter((p) => p.category === "genai-image" && p.intent === "suitability");
  const sK = safety.reduce((s, p) => s + p.perEngine.find((pe) => pe.e === "chatgpt").k6w, 0);
  const sN = safety.reduce((s, p) => s + p.perEngine.find((pe) => pe.e === "chatgpt").n6w, 0);
  const discPrompt = prompts.find((p) => p.text === "What's the best AI image generator right now?");
  const discFf = discPrompt.perEngine.find((pe) => pe.e === "chatgpt");
  insights.push({
    week: weekEndings[LAST],
    severity: "opportunity",
    category: "genai-image",
    title: "Firefly is far stronger on 'commercially safe' prompts than on generic discovery",
    body: `Pooled over the last six simulated weeks on ChatGPT, Firefly's mention rate is ${((sK / sN) * 100).toFixed(0)}% on the two commercial-safety suitability prompts but ${(discFf.mr6w * 100).toFixed(0)}% on the generic "best AI image generator" discovery prompt. At category level on ChatGPT, Firefly (${(ff.mr * 100).toFixed(0)}%) sits well behind Midjourney (${(mj.mr * 100).toFixed(0)}%). The differentiated claim is performing; the generic claim is not. Recommended action: concentrate content and PR on the licensing/safety wedge instead of head-to-head 'best generator' positioning.`,
    link: "/categories/genai-image",
  });
  const acro = catEngineRow(LAST, "pdf-tools", "chatgpt", "acrobat");
  const smallpdf = catEngineRow(LAST, "pdf-tools", "chatgpt", "smallpdf");
  insights.push({
    week: weekEndings[LAST],
    severity: "risk",
    category: "pdf-tools",
    title: "Acrobat dominates mentions but citations leak to competitor how-to content",
    body: `Acrobat's mention rate is ${(acro.mr * 100).toFixed(0)}% on ChatGPT, far ahead of the next PDF tool (Smallpdf at ${(smallpdf.mr * 100).toFixed(0)}%), yet on free how-to prompts the cited sources skew to Smallpdf and iLovePDF tutorials. Engines name Acrobat while linking elsewhere. Owned-citation share is the gap to close: answer-shaped how-to content on adobe.com/acrobat targeted at the top three how-to prompts.`,
    link: "/categories/pdf-tools",
  });
  // Gemini shock stats computed from the data so the copy always matches:
  // per-brand relative drop in the first shocked week vs the week before
  const shockRels = weekly
    .filter((r) => r.w === GEMINI_SHOCK_WEEK && r.e === "gemini")
    .map((r) => {
      const prev = weekly.find((q) => q.w === GEMINI_SHOCK_WEEK - 1 && q.e === "gemini" && q.c === r.c && q.b === r.b);
      return (prev.mr - r.mr) / prev.mr;
    });
  const fell = shockRels.filter((x) => x > 0).sort((a, b) => a - b);
  const medianRel = fell[Math.floor(fell.length / 2)];
  insights.push({
    week: weekEndings[GEMINI_SHOCK_WEEK + 1],
    severity: "watch",
    category: "all",
    title: "Gemini model update depressed mention rates across all categories",
    body: `Week ending ${shortDate(weekEndings[GEMINI_SHOCK_WEEK])}, mention rates on Gemini fell for ${fell.length} of ${shockRels.length} tracked brands, typically about ${(medianRel * 100).toFixed(0)}% relative, ranging from ${(fell[0] * 100).toFixed(0)}% to ${(fell[fell.length - 1] * 100).toFixed(0)}%. This is why weekly reads carry confidence intervals: single-week engine-level moves during model updates are mostly noise. Partial recovery visible within three weeks; the week was annotated as a model-update event for channel owners rather than escalated as brand losses.`,
    link: "/methodology",
  });
  insights.push({
    week: weekEndings[PS_SENTIMENT_DIP[1]],
    severity: "watch",
    category: "photo-editing",
    title: "Photoshop sentiment dipped during the pricing news cycle, mentions unaffected",
    body: `For four weeks, answers mentioning Photoshop carried more negative framing on value-for-money ("powerful but expensive") while mention rate held steady. Sentiment recovered with the news cycle. Lesson encoded into the framework: track sentiment conditional on mention, separately from visibility. They move on different drivers.`,
    link: "/categories/photo-editing",
  });
}

// ---------------------------------------------------------------------------
// Quarterly targets (Adobe fiscal: Q2 FY26 = Mar-May, Q3 FY26 = Jun-Aug)
// ---------------------------------------------------------------------------
function latestVS(catId) {
  // usage-weighted current visibility score for the Adobe brand
  const cat = categories.find((c) => c.id === catId);
  const adobe = cat.brands.find((b) => b.adobe);
  let num = 0, den = 0;
  for (const eng of engines) {
    const r = catEngineRow(LAST, catId, eng.id, adobe.id);
    num += r.vs * eng.usageShare;
    den += eng.usageShare;
  }
  return round(num / den, 1);
}
const targets = categories.map((cat) => {
  const current = latestVS(cat.id);
  return {
    category: cat.id,
    metric: "Visibility Score (usage-weighted across engines)",
    current,
    q3Target: round(current * (cat.id === "quick-design" ? 1.12 : cat.id === "genai-image" ? 1.15 : 1.06), 0),
    quarter: "Q3 FY2026 (Jun-Aug)",
  };
});

// ---------------------------------------------------------------------------
// Illustrative answer snippets (clearly simulated; used in prompt drilldowns)
// ---------------------------------------------------------------------------
const answers = {
  p01: {
    engine: "chatgpt",
    note: "Illustrative simulated answer, written for this demo, not captured from a real engine.",
    text:
      "For free social media graphics, Canva is the most popular option with thousands of templates. Adobe Express is a strong alternative, especially if you want brand kits and one-tap resizing across platforms, and it includes Firefly generative AI on the free tier. Picsart is solid on mobile. For simple posts, any of the three will do; for brand consistency across a team, Adobe Express or Canva Pro are the safer picks.",
    mentions: [
      { brand: "Canva", position: 1 },
      { brand: "Adobe Express", position: 2 },
      { brand: "Picsart", position: 3 },
    ],
    citations: ["canva.com/templates", "adobe.com/express", "blog post: '10 free design tools for 2026'"],
  },
  p17: {
    engine: "chatgpt",
    note: "Illustrative simulated answer, written for this demo, not captured from a real engine.",
    text:
      "The best-known PDF editor is Adobe Acrobat, which handles editing, OCR, signatures, and AI summaries. If you only need occasional edits, free web tools like Smallpdf or iLovePDF cover merging, splitting, and basic edits without a subscription. Foxit is a lighter desktop alternative. For heavy or legal document work, Acrobat Pro remains the standard.",
    mentions: [
      { brand: "Adobe Acrobat", position: 1 },
      { brand: "Smallpdf", position: 2 },
      { brand: "iLovePDF", position: 3 },
      { brand: "Foxit", position: 4 },
    ],
    citations: ["smallpdf.com/edit-pdf", "ilovepdf.com/blog", "adobe.com/acrobat"],
  },
  p10: {
    engine: "perplexity",
    note: "Illustrative simulated answer, written for this demo, not captured from a real engine.",
    text:
      "If commercial safety is the priority, Adobe Firefly is the most defensible choice: it is trained on Adobe Stock and licensed content, and Adobe offers IP indemnification for enterprise customers. Midjourney and other models produce striking results but their training data provenance is less clear, which matters for commercial risk. Shutterstock AI and Getty's generator are also positioned as commercially safe.",
    mentions: [
      { brand: "Adobe Firefly", position: 1 },
      { brand: "Midjourney", position: 2 },
    ],
    citations: ["adobe.com/firefly", "helpx.adobe.com firefly-faq", "legal-tech blog: 'AI images and IP risk'"],
  },
};

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });
const write = (name, obj) => {
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(obj));
  console.log(`wrote ${name} (${(JSON.stringify(obj).length / 1024).toFixed(0)} KB)`);
};

write("meta.json", {
  generatedNote:
    "All data in this app is simulated for demonstration. Generated deterministically by scripts/generate-data.mjs (seeded RNG). No real engine sampling, no Adobe data.",
  weeks: weekEndings,
  runsPerPromptEngineWeek: RUNS_PER_WEEK,
  engines: engines.map(({ id, name, usageShare, referrerCapture }) => ({ id, name, usageShare, referrerCapture })),
  categories: categories.map((c) => ({
    id: c.id,
    name: c.name,
    adobeBrand: c.adobeBrand,
    brands: c.brands.map((b) => ({ id: b.id, name: b.name, adobe: !!b.adobe })),
  })),
  targets,
  visibilityScoreWeights: { mentionRate: 0.45, position: 0.2, citationShare: 0.2, sentiment: 0.15 },
});
write("weekly.json", weekly);
write("prompts.json", prompts);
write("funnel.json", { rows: funnel, assumptions: outcomeAssumptions });
write("experiments.json", experiments);
write("insights.json", insights);
write("answers.json", answers);
console.log(`rows: weekly=${weekly.length}, prompts=${prompts.length}, funnel=${funnel.length}`);
