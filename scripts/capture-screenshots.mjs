/**
 * Captures store screenshots of the web build at phone resolution using
 * headless Chrome (no extra dependencies; talks to Chrome DevTools directly).
 *
 * Usage:
 *   1. Start the app:  npx expo start   (serves the web build on :8081)
 *   2. Run:            node scripts/capture-screenshots.mjs [phone|tablet7|tablet10]
 *   3. Frame them:     python3 scripts/frame-screenshots.py [phone|tablet7|tablet10]
 *
 * Raw captures are written to store-listing/screenshots/raw/ (phone) or
 * store-listing/screenshots/raw-<device>/ (tablets).
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEVICE = process.argv[2] ?? 'phone';
const OUT = join(ROOT, 'store-listing', 'screenshots', DEVICE === 'phone' ? 'raw' : `raw-${DEVICE}`);
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const CHROME = process.env.CHROME ?? 'google-chrome';
const PORT = 9333;

const VIEWPORTS = {
  // 360x780 pt at 3x = 1080x2340 px, a typical modern phone screen.
  phone: { width: 360, height: 780, deviceScaleFactor: 3, mobile: false },
  // 600x960 pt at 2x = 1200x1920 px, a 7" tablet in portrait.
  tablet7: { width: 600, height: 960, deviceScaleFactor: 2, mobile: false },
  // 800x1280 pt at 2x = 1600x2560 px, a 10" tablet in portrait.
  tablet10: { width: 800, height: 1280, deviceScaleFactor: 2, mobile: false },
};
const VIEWPORT = VIEWPORTS[DEVICE];
if (!VIEWPORT) throw new Error(`Unknown device "${DEVICE}". Use: ${Object.keys(VIEWPORTS).join(', ')}`);

const form = {
  monthlyIncome: '2000', hoursPerDay: '6', daysPerWeek: '5', vacationDays: '20',
  nonBillablePct: '25', platformFeePct: '10', taxPct: '15', monthlyExpenses: '100', marginPct: '10',
};
const usd = { code: 'USD', customSymbol: '' };
const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const SEED = {
  'frc:lastState:v1': { form, currency: usd, project: { hours: '40', bufferPct: '20' } },
  'frc:presets:v1': [
    { id: 'a', name: 'Upwork clients', createdAt: now, hourlyRate: 33.3115, form, currency: usd },
    { id: 'b', name: 'Fiverr gigs', createdAt: now - 3 * day, hourlyRate: 37.4755, form: { ...form, platformFeePct: '20' }, currency: usd },
    { id: 'c', name: 'Direct clients', createdAt: now - 9 * day, hourlyRate: 29.9804, form: { ...form, platformFeePct: '0' }, currency: usd },
  ],
};

const SHOTS = [
  { file: '1.png', path: '/', waitFor: 'Minimum hourly rate' },
  { file: '2.png', path: '/', waitFor: 'Where each month', scrollTo: 'Results' },
  { file: '3.png', path: '/estimator', waitFor: 'Suggested fixed price', scrollTo: 'Price' },
  { file: '4.png', path: '/presets', waitFor: 'Direct clients' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = pages.find((p) => p.type === 'page');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    } catch {
      // Chrome not up yet.
    }
    await sleep(200);
  }
  throw new Error('Could not connect to headless Chrome');
}

async function main() {
  try {
    await fetch(APP);
  } catch {
    throw new Error(`The app isn't running at ${APP}. Start it first with: npx expo start`);
  }
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'frc-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--hide-scrollbars', '--disable-extensions', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    const ws = await connect();
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let nextId = 0;
    const pending = new Map();
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const evaluate = async (expression) =>
      (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const waitForText = async (text) => {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`)) return;
        await sleep(200);
      }
      throw new Error(`Timed out waiting for "${text}"`);
    };

    await send('Emulation.setDeviceMetricsOverride', VIEWPORT);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

    // Seed storage once, on the app's origin.
    await send('Page.navigate', { url: APP });
    await waitForText('Rate Calculator');
    await evaluate(`(() => { localStorage.clear(); ${Object.entries(SEED)
      .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`)
      .join(' ')} })()`);

    for (const shot of SHOTS) {
      await send('Page.navigate', { url: APP + shot.path });
      await waitForText(shot.waitFor);
      // Desktop Linux renders tab labels in its system-ui font, whose taller line
      // height clips them; use an Android-like font stack as on a real phone.
      await evaluate(`(() => { const s = document.createElement('style');
        s.textContent = '* { font-family: Roboto, Arial, "Liberation Sans", sans-serif !important; }';
        document.head.appendChild(s); })()`);
      if (shot.scrollTo) {
        await evaluate(`(() => {
          const el = [...document.querySelectorAll('div')].find(
            (d) => d.childElementCount === 0 && d.textContent === ${JSON.stringify(shot.scrollTo)});
          // Scroll the section card (the heading's parent) to the top, with a little breathing room.
          const card = el && el.parentElement;
          card && card.scrollIntoView({ block: 'start' });
          let scroller = card && card.parentElement;
          while (scroller && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
          if (scroller) scroller.scrollTop = Math.max(0, scroller.scrollTop - 16);
        })()`);
      }
      await sleep(600);
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(OUT, shot.file), Buffer.from(data, 'base64'));
      console.log(`wrote ${join(OUT, shot.file).slice(ROOT.length + 1)}`);
    }
    ws.close();
  } finally {
    // Wait for Chrome to exit before deleting its profile, or it may still be writing to it.
    if (chrome.exitCode === null) {
      const exited = once(chrome, 'exit');
      chrome.kill();
      await exited;
    }
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A leftover temp folder is harmless; don't fail the run over it.
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
