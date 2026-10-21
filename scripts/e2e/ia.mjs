import puppeteer from 'puppeteer-core';
// Run with the server started with AI_FAKE=1 (MODE=fake) or without any key (MODE=off).
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234', MODE = process.env.MODE || 'fake';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-ia-${Date.now()}`], defaultViewport: { width: 1366, height: 860 } });
const p = await b.newPage(); const errs = [];
p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && !/503|Failed to load resource/.test(m.text()) && errs.push(m.text()));
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
const text = () => p.evaluate(() => document.body.innerText);
const byText = (t, sel = 'button') => p.evaluateHandle((t, s) => [...document.querySelectorAll(s)].find(e => e.innerText.trim() === t || e.innerText.trim().startsWith(t)), t, sel);
await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(700);

if (MODE === 'off') {
  await (await byText('Crear con IA')).click(); await wait(900);
  check('sin clave: la ventana avisa que no está configurada', (await text()).includes('no está configurado'));
  check('sin clave: el botón de escribir está desactivado', await p.evaluate(() => document.querySelector('ai-draft-dialog button[type=submit]').disabled));
  await p.screenshot({ path: `${OUT}/sin-clave.png` });
  const r = await p.evaluate(async () => (await fetch('/api/ai/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('SESSION')).token }, body: '{"language":"html","before":"<p>","after":""}' })).status);
  check('sin clave: /api/ai/complete responde 503', r === 503, r);
  check('sin errores JS', errs.length === 0, errs.join(' | ')); await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS'); process.exit(ok ? 0 : 1);
}

// --- code editor (Monaco) on the page form ---
for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/servicios.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
await p.waitForSelector('code-editor .monaco-editor', { timeout: 30000 }); await wait(800);
check('editor tipo VS Code en el contenido, CSS y JS', (await p.$$('code-editor .monaco-editor')).length === 3);
check('el cuadro de texto original queda oculto', await p.$eval('#page_content', t => t.classList.contains('sr-only')));
check('el editor muestra el HTML de la página', (await p.$eval('code-editor[for=page_content] .view-lines', e => e.innerText)).includes('dm-grid'));
await p.evaluate(() => document.querySelector('code-editor[for=page_content]').scrollIntoView({ block: 'center' })); await wait(300);
await p.screenshot({ path: `${OUT}/1-editor-codigo.png` });
// type at the end of the content: the textarea (what the form saves) follows
const ed = await p.$('code-editor[for=page_content] .monaco-editor .view-lines'); await ed.click(); await wait(200);
await p.keyboard.down('Control'); await p.keyboard.press('End'); await p.keyboard.up('Control');
await p.keyboard.press('Enter'); await p.keyboard.type('<p>', { delay: 30 });
check('lo que se escribe en el editor llega al formulario', (await p.$eval('#page_content', t => t.value)).trimEnd().endsWith('<p>'), (await p.$eval('#page_content', t => t.value)).slice(-30));
// the AI ghost text appears after a pause; Tab accepts it
await wait(2500);
const ghost = await p.evaluate(() => [...document.querySelectorAll('code-editor[for=page_content] [class*="ghost-text"]')].map(e => e.textContent).join(''));
await p.screenshot({ path: `${OUT}/2-sugerencia.png` });
check('aparece la sugerencia gris de la IA', ghost.includes('</p>'), JSON.stringify(ghost));
await p.keyboard.press('Tab'); await wait(400);
check('Tab acepta la sugerencia', (await p.$eval('#page_content', t => t.value)).trimEnd().endsWith('<p></p>'), (await p.$eval('#page_content', t => t.value)).slice(-40));
// the visual editor writes back and the code editor follows
const before = await p.$eval('#page_content', t => t.value);
await (await byText('Editar visualmente')).click(); await p.waitForSelector('iframe.gjs-frame'); await wait(2500);
await (await byText('Aplicar cambios')).click(); await wait(1200);
const sync = await p.evaluate(() => { const t = document.querySelector('#page_content'); const ed = document.querySelector('code-editor[for=page_content]').editor; return [ed.getValue() === t.value, t.value !== '', ed.getValue().length]; });
check('tras el editor visual, el editor de código muestra lo mismo que el formulario', sync[0] && sync[1], JSON.stringify(sync));
await (await byText('Volver')).click(); await wait(800);

// --- "Create with AI" ---
await (await byText('Crear con IA')).click(); await wait(900);
await p.screenshot({ path: `${OUT}/3-crear-con-ia.png` });
await p.type('#ai-brief', 'Una página sobre SMS para clínicas: recordatorios de citas y campañas de salud.');
await p.select('#ai-layout', await p.evaluate(() => [...document.querySelectorAll('#ai-layout option')].find(o => o.textContent.includes('Interna'))?.value ?? ''));
await (await byText('Escribir borrador')).click(); await wait(2500);
const t2 = await text();
check('se abre el borrador en el formulario', t2.includes('Modificar el registro') && (await p.$eval('[name=title]', e => e.value)).startsWith('Borrador:'), t2.slice(0, 200));
check('el borrador queda oculto para Google', await p.$eval('[name=noindex]', e => e.checked));
await p.screenshot({ path: `${OUT}/4-borrador.png` });
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
