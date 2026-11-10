// Renders the app's PNG icons and in-app logo from design/logo/*.svg using the preinstalled
// Playwright Chromium. Run after changing a logo: node scripts/render-icons.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
// Playwright is preinstalled globally in dev containers; run with NODE_PATH=$(npm root -g).
const { chromium } = createRequire(import.meta.url)('playwright');

const root = new URL('../', import.meta.url);
const svg = (f) => readFileSync(new URL(`design/logo/${f}`, root), 'utf8');
const out = (f) => new URL(`apps/app/assets/images/${f}`, root).pathname;

// [file, svg, canvas px, logo px (centred), background or null for transparent]
const jobs = [
  ['icon.png', 'aalthara-app-icon.svg', 1024, 1024, null],
  ['android-icon-foreground.png', 'aalthara-mark-on-dark.svg', 1024, 560, null],
  ['android-icon-monochrome.png', 'aalthara-mark-mono.svg', 1024, 560, null],
  ['splash-icon.png', 'aalthara-mark.svg', 600, 600, null],
  ['splash-icon-dark.png', 'aalthara-mark-on-dark.svg', 600, 600, null],
  ['favicon.png', 'aalthara-mark.svg', 48, 48, null],
  ['mark.png', 'aalthara-mark.svg', 360, 360, null],
  ['mark-on-dark.png', 'aalthara-mark-on-dark.svg', 360, 360, null],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, src, size, logo, bg] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${bg ?? 'transparent'};display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${logo}px;height:${logo}px">${svg(src).replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
  await page.screenshot({ path: out(file), omitBackground: bg == null });
  console.log('wrote', file);
}
await browser.close();
