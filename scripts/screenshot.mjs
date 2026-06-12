/* Dev-only: screenshot key pages and report console errors. Not part of the app. */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = "/tmp/scorecard-shots";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["summary", "/summary"],
  ["overview", "/"],
  ["category-quick-design", "/categories/quick-design"],
  ["prompts", "/prompts"],
  ["prompt-p01", "/prompts/p01"],
  ["outcomes", "/outcomes"],
  ["experiments", "/experiments"],
  ["methodology", "/methodology"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`${page.url()}: PAGEERROR ${e.message}`));

for (const [name, path] of pages) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(600); // let charts animate in
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`shot ${name} (${path})`);
}

console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join("\n")}` : "no console errors");
await browser.close();
