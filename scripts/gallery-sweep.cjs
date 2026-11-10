// Elder-first sweep of the component gallery on the web build (DESIGN.md rules 1, 2, 6):
// every button/tab/input >= 56x56, no text under 15px, nothing wider than the screen, no
// truncation, tab labels inside their tabs; light/dark, iOS/Android manners, en/ml, 100%/160%.
//   cd apps/app && npx expo export --platform web --output-dir dist
//   python3 scripts/serve-static.py apps/app/dist &      # serves /gallery -> gallery.html
//   NODE_PATH=$(npm root -g) node scripts/gallery-sweep.cjs <screenshot-dir>
// Exits 1 on any finding. Uses the Playwright that is preinstalled in dev containers.
const { chromium } = require('playwright');
const out = process.argv[2] || '.';
const base = process.env.GALLERY_URL || 'http://localhost:8765';
let failed = false;
(async () => {
  const b = await chromium.launch();
  const errors = [];
  const run = async (name, { scheme = 'light', clicks = [], openSheet = false }) => {
    const p = await b.newPage({ viewport: { width: 390, height: openSheet ? 844 : 7000 }, colorScheme: scheme, locale: 'en-IN' });
    p.on('pageerror', (e) => errors.push(name + ': ' + e));
    p.on('console', (m) => m.type() === 'error' && errors.push(name + ': ' + m.text().slice(0, 200)));
    await p.goto(base + '/gallery', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    for (const id of clicks) { await p.getByTestId(id).click(); await p.waitForTimeout(150); }
    if (openSheet) { await p.getByTestId('open-sheet').click(); await p.waitForTimeout(400); }
    const report = await p.evaluate(() => {
      const small = [];
      for (const el of document.querySelectorAll('[role=button],[role=tab],input')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.height < 55.5 || r.width < 55.5) small.push(`${el.getAttribute('aria-label') || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      const tinyText = [...document.querySelectorAll('div[dir],span')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 15).map(e => e.textContent.slice(0, 30) + ' ' + getComputedStyle(e).fontSize);
      const ellipsis = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth).map(e => e.textContent.slice(0, 30));
      const wide = [...document.querySelectorAll('div,button,input')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).map(e => (e.getAttribute('aria-label') || e.textContent).slice(0, 40) + ' right=' + Math.round(e.getBoundingClientRect().right)).slice(0, 8);
      const tabs = [...document.querySelectorAll('[role=tab]')]; const clash = []; for (const tb of tabs) { const lbl = [...tb.querySelectorAll('div[dir]')].pop(); if (!lbl) continue; const r = document.createRange(); r.selectNodeContents(lbl); const tr = r.getBoundingClientRect(), br = tb.getBoundingClientRect(); if (tr.left < br.left - 1 || tr.right > br.right + 1) clash.push(lbl.textContent + ' ' + Math.round(tr.width) + '>' + Math.round(br.width)); }
      return { clash, tabs: tabs.length, wide, overflowX: document.documentElement.scrollWidth > window.innerWidth, small, tinyText, ellipsis };
    });
    console.log(name, JSON.stringify(report));
    if (report.clash.length || report.wide.length || report.overflowX || report.small.length || report.tinyText.length || report.ellipsis.length) failed = true;
    await p.screenshot({ path: `${out}/g-${name}.png`, fullPage: !openSheet });
    await p.close();
  };
  await run('light-ios-100', {});
  await run('dark-android-160', { scheme: 'dark', clicks: ['toggle-manner', 'toggle-scale', 'toggle-scale'] });
  await run('ml-ios-160', { clicks: ['toggle-language', 'toggle-scale', 'toggle-scale'] });
  await run('sheet-ios', { openSheet: true });
  await run('sheet-android-dark', { scheme: 'dark', clicks: ['toggle-manner'], openSheet: true });
  console.log('errors', errors);
  if (errors.length || failed) process.exitCode = 1;
  await b.close();
})();
