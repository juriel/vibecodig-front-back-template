// Mi cuenta → Conectar con Claude: create a token (shown once), copy it, it is listed without the secret, revoke it.
import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${OUT}/profile-tokens-${Date.now()}`], defaultViewport: { width: 1366, height: 860 } });
const errs = [];
const p = await b.newPage(); p.on('pageerror', e => errs.push(String(e)));
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
const ctx = b.defaultBrowserContext(); await ctx.overridePermissions(B, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
const text = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const byText = (t, sel = 'button') => p.evaluateHandle((t, s) => [...document.querySelectorAll(s)].find(e => e.innerText.trim().endsWith(t)), t, sel);
const api = (method, path) => p.evaluate(async (m, u) => { const s = JSON.parse(localStorage.getItem('SESSION') || '{}');
  const r = await fetch('/api/' + u, { method: m, headers: { Authorization: 'Bearer ' + s.token } }); return r.status === 204 ? null : r.json(); }, method, path);

await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
await p.goto(B + '/admin/account', { waitUntil: 'networkidle0' }); await wait(500);
check('sección "Conectar con Claude" con lista vacía', (await text()).includes('CONECTAR CON CLAUDE') && (await text()).includes('Aún no tienes tokens'), (await text()).slice(0, 300));

await p.type('#token_name', 'Claude de la oficina');
await (await byText('Crear token')).click(); await wait(1000);
const shown = await p.$eval('#new-token', e => e.value).catch(() => '');
check('muestra el token una vez, para copiarlo', shown.startsWith('ncms_') && (await text()).includes('Copia tu token ahora'), shown);
await p.evaluate(() => document.querySelector('#new-token').scrollIntoView({ block: 'center' }));
await p.screenshot({ path: `${OUT}/tokens-creado.png` });
await (await byText('Copiar')).click(); await wait(400);
check('Copiar lo deja en el portapapeles', (await p.evaluate(() => navigator.clipboard.readText())) === shown);
check('aparece en la lista con su prefijo', (await text()).includes('Claude de la oficina') && (await text()).includes(shown.slice(0, 9) + '…'));
const list = await api('GET', 'auth/me/tokens');
check('la API no vuelve a entregar el token', list.length === 1 && !('token' in list[0]));

await (await byText('Ya lo guardé')).click(); await wait(300);
check('"Ya lo guardé" oculta el token', !(await p.$('#new-token')) && !(await p.content()).includes(shown));
await p.reload({ waitUntil: 'networkidle0' }); await wait(500);
check('al recargar sigue en la lista, sin el secreto', (await text()).includes('Claude de la oficina') && !(await p.content()).includes(shown));

await (await byText('Revocar')).click(); await wait(400);
check('pide confirmación con el nombre', (await text()).includes('«Claude de la oficina»'));
await p.screenshot({ path: `${OUT}/tokens-revocar.png` });
await (await p.evaluateHandle(() => [...document.querySelectorAll('app-confirm button')].find(e => e.innerText.trim() === 'Revocar'))).click(); await wait(800);
check('revocado: la lista queda vacía', (await text()).includes('Aún no tienes tokens') && (await api('GET', 'auth/me/tokens')).length === 0);
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
process.exit(ok ? 0 : 1);
