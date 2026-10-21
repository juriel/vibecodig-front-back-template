import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-inicio-${Date.now()}`] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
const setTheme = t => p.evaluate(t => { document.documentElement.dataset.theme = t; }, t);
await p.setViewport({ width: 1366, height: 768 });
await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
const t = await p.evaluate(() => document.body.innerText.toLowerCase());
check('las 8 secciones de creación', ['páginas', 'widgets', 'gestión de archivos', 'gestión de carpetas', 'plantillas', 'hojas de estilo css', 'javascripts', 'configuraciones globales'].every(x => t.includes(x)));
check('sin "Mi cuenta" ni "Ver mi sitio" en el inicio', !t.includes('ver mi sitio') && !(await p.$('home-page a[href="/admin/account"]')));
check('colores TitiCMS por defecto', (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand-base').trim())) === '#1f5fc4');
for (const theme of ['light', 'dark']) {
  await setTheme(theme);
  for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1080]]) {
    await p.setViewport({ width: w, height: h }); await wait(400);
    const [sh, ih] = await p.evaluate(() => [document.scrollingElement.scrollHeight, innerHeight]);
    check(`${theme} ${w}x${h}: inicio sin scroll`, sh <= ih, `${sh} > ${ih}`);
    if (w === 1366) await p.screenshot({ path: `${OUT}/inicio-${theme}.png` });
  }
}
await p.setViewport({ width: 1366, height: 768 });
for (const [path, name] of [['/admin/privilege', 'privilegios'], ['/admin/css', 'css'], ['/admin/pages', 'paginas']]) {
  await p.goto(B + path, { waitUntil: 'networkidle0' }); await wait(700);
  for (const theme of ['light', 'dark']) { await setTheme(theme); await wait(150); await p.screenshot({ path: `${OUT}/${name}-${theme}.png` }); }
}
check('paginación en círculos (privilegios)', await p.goto(B + '/admin/privilege', { waitUntil: 'networkidle0' }).then(() => wait(600)).then(() => p.$('nav[aria-label] button[aria-current="page"]')).then(Boolean));
await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(600);
for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/inicio.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
await wait(900);
const fw = await p.$eval('cms-page-form form', f => f.getBoundingClientRect().width);
const main = await p.$eval('cms-page-form', f => f.parentElement.getBoundingClientRect().width);
check('formulario de página a todo el ancho', fw >= main - 4, `${fw} / ${main}`);
for (const theme of ['light', 'dark']) { await setTheme(theme); await wait(150); await p.screenshot({ path: `${OUT}/form-${theme}.png` }); }
await p.goto(B + '/admin/account', { waitUntil: 'networkidle0' }); await wait(600);
await setTheme('light'); await p.screenshot({ path: `${OUT}/cuenta-light.png` });
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
