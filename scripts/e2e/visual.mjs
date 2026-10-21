import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));

// --- API: copy of "inicio" as zz-visual (the real home page is never touched) ---
const api = async (method, path, body, token) => {
  const r = await fetch(B + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: r.status === 204 ? null : await r.json() };
};
const { data: { token } } = await api('POST', '/auth/login', { login: 'zz_test_a', password: PW });
const pages = (await api('GET', '/cms/pages', null, token)).data;
for (const p of pages.filter(p => p.url === 'zz-visual')) await api('DELETE', `/cms/pages/${p.id}`, null, token);
const inicio = (await api('GET', `/cms/pages/${pages.find(p => p.url === 'inicio').id}`, null, token)).data;
const copy = (await api('POST', '/cms/pages', { cms_layout: inicio.cms_layout, url: 'zz-visual', title: 'Prueba editor visual', page_content: inicio.page_content, css: inicio.css, noindex: true }, token)).data;
check('copia de inicio creada', copy.id, JSON.stringify(copy).slice(0, 200));

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-visual-${Date.now()}`], defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage(); const errs = [];
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
const reqs = []; p.on('request', r => reqs.push(r.url()));
const text = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const clickText = async (sel, txt) => { const h = await p.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find(e => e.innerText.trim().includes(t)), sel, txt); await h.click(); };

await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
check('panel no descarga GrapesJS al entrar', !reqs.some(u => /846\.app\.js|grapes/.test(u)), reqs.filter(u => u.includes('app.js')).join(','));

const openEditor = async () => {
  await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(800);
  for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/zz-visual.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
  await wait(1200);
  await clickText('button', 'Editar visualmente');
  await p.waitForSelector('page-visual-editor iframe.gjs-frame', { timeout: 20000 }); await wait(2500);
  return (await p.$('iframe.gjs-frame')).contentFrame();
};

// ---------- A) round trip without changes ----------
let f = await openEditor();
const canvasText = await f.evaluate(() => document.body.innerText);
check('el editor muestra la página (texto del hero)', /SMS|NEXVIA|mensaj/i.test(canvasText), canvasText.slice(0, 200));
const hidden = await f.evaluate(() => [...document.querySelectorAll('.animate-on-scroll')].filter(e => getComputedStyle(e).opacity === '0').length);
check('secciones animadas visibles dentro del editor', hidden === 0, hidden);
const cssLoaded = await f.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).join(' '));
check('el editor carga el CSS del sitio', cssLoaded.includes('/css/nexvia.css'), cssLoaded);
await p.screenshot({ path: `${OUT}/v1-editor.png` });
await clickText('button', 'Aplicar cambios'); await wait(800);
check('aplicar cierra el editor', !(await p.$('page-visual-editor')));
await clickText('button', 'Guardar'); await wait(1800);

const norm = 'body *{animation:none!important;transition:none!important} .animate-on-scroll{opacity:1!important;transform:none!important}';
const shot = async (url, name) => {
  const q = await b.newPage(); await q.setViewport({ width: 1440, height: 900 });
  await q.goto(B + url, { waitUntil: 'load' }); await q.addStyleTag({ content: norm }); await wait(1500);
  await q.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  const info = await q.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' '), ld: document.querySelectorAll('script[type="application/ld+json"]').length,
    onclick: document.querySelectorAll('[onclick*="openLegalModal"]').length, forms: document.querySelectorAll('form[data-envio="pendiente"]').length }));
  await q.close(); return info;
};
const orig = await shot('/inicio.page', 'v2-original'), rt = await shot('/zz-visual.page', 'v3-ida-y-vuelta');
check('ida y vuelta: mismo texto visible', orig.text === rt.text, `${orig.text.length} vs ${rt.text.length}`);
check('ida y vuelta: conserva JSON-LD, onclick y formularios', rt.ld === orig.ld && rt.onclick === orig.onclick && rt.forms === orig.forms, JSON.stringify([orig.ld, rt.ld, orig.onclick, rt.onclick, orig.forms, rt.forms]));

const saved = (await api('GET', `/cms/pages/${copy.id}`, null, token)).data;
const lines = saved.page_content.split('\n'), longest = Math.max(...lines.map(l => l.length));
check('HTML guardado ordenado (varias líneas, ninguna gigante)', lines.length > 300 && longest < 2000, `${lines.length} líneas, la más larga ${longest}`);
check('JSON-LD intacto tras formatear', saved.page_content.includes('"telephone"') && JSON.parse(saved.page_content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]) !== null);
check('CSS guardado ordenado', saved.css === '' || saved.css.split('\n').length > 3, saved.css.slice(0, 120));
// (real edits are covered by clic.mjs and rapido.mjs)
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close();
await api('DELETE', `/cms/pages/${copy.id}`, null, token);
console.log(ok ? '\nTODO OK' : '\nHAY FALLOS'); process.exit(ok ? 0 : 1);
