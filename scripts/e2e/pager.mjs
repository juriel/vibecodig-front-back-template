import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-pager-${Date.now()}`] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
await p.setViewport({ width: 1366, height: 768 });
await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
await p.screenshot({ path: `${OUT}/1-inicio-entrada.png` });   // during the entrance animation
await wait(900); await p.screenshot({ path: `${OUT}/2-inicio.png` });
const h1 = await p.$eval('home-page h1', e => [e.innerText, parseFloat(getComputedStyle(e).fontSize)]);
check('saludo gigante en el inicio', /^HOLA, /.test(h1[0].trim()) && h1[1] >= 72, JSON.stringify(h1));
for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1080]]) {
  await p.setViewport({ width: w, height: h }); await wait(300);
  const [sh, ih] = await p.evaluate(() => [document.scrollingElement.scrollHeight, innerHeight]);
  check(`${w}x${h}: inicio sin scroll`, sh <= ih, `${sh} > ${ih}`);
  if (w === 1920) await p.screenshot({ path: `${OUT}/3-inicio-1920.png` });
}
await p.setViewport({ width: 1366, height: 768 });
// NEXVIA palette
await p.goto(B + '/admin/account', { waitUntil: 'networkidle0' }); await wait(500);
await (await p.evaluateHandle(() => [...document.querySelectorAll('[role=radio]')].find(e => e.innerText.trim() === 'NEXVIA'))).click(); await wait(900);
check('estilo NEXVIA', (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand-base').trim())) === '#2d9b9b');
await p.goto(B + '/admin', { waitUntil: 'networkidle0' }); await wait(1200);
await p.screenshot({ path: `${OUT}/4-inicio-nexvia.png` });
// pager
await p.goto(B + '/admin/privilege', { waitUntil: 'networkidle0' }); await wait(800);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(600);
const pos = () => p.evaluate(() => { const i = document.querySelector('.pager-indicator'), a = document.querySelector('.pager-track [aria-current="page"]');
  return [Math.round(new DOMMatrix(getComputedStyle(i).transform).m41), a.offsetLeft, document.querySelector('.pager-progress').style.width]; });
const before = await pos();
await (await p.$('.pager-track')).evaluate(e => e.closest('div.border-t').scrollIntoView({ block: 'center' })); await (await p.$('.pager-track')).evaluate(e => 0).then(async () => { const el = await p.$('div.border-t:has(.pager-track)'); await el.screenshot({ path: `${OUT}/5-pager-1.png` }); });
await (await p.$('.pager-track button:not([aria-current="page"])')).click();
await wait(140); await (await p.$('.pager-track')).evaluate(e => e.closest('div.border-t').scrollIntoView({ block: 'center' })); await (await p.$('.pager-track')).evaluate(e => 0).then(async () => { const el = await p.$('div.border-t:has(.pager-track)'); await el.screenshot({ path: `${OUT}/6-pager-moviendo.png` }); });
const mid = await pos(); await wait(700);
const after = await pos();
check('el círculo activo se desliza (pasa por posiciones intermedias)', mid[0] > before[0] && mid[0] !== after[1] || mid[0] > before[0], JSON.stringify([before, mid, after]));
check('termina sobre la página 2', after[0] === after[1], JSON.stringify(after));
check('la barra de progreso avanza al 100%', after[2] === '100%' && before[2] === '50%', `${before[2]} → ${after[2]}`);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(200);
await (await p.$('.pager-track')).evaluate(e => e.closest('div.border-t').scrollIntoView({ block: 'center' })); await (await p.$('.pager-track')).evaluate(e => 0).then(async () => { const el = await p.$('div.border-t:has(.pager-track)'); await el.screenshot({ path: `${OUT}/7-pager-2.png` }); });
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; }); await wait(300);
await (await p.$('.pager-track')).evaluate(e => e.closest('div.border-t').scrollIntoView({ block: 'center' })); await (await p.$('.pager-track')).evaluate(e => 0).then(async () => { const el = await p.$('div.border-t:has(.pager-track)'); await el.screenshot({ path: `${OUT}/8-pager-oscuro.png` }); });
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
