import puppeteer from 'puppeteer-core';
import path from 'node:path';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234', DIR = path.resolve('archivos');
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const api = async (method, p, body, token) => { const r = await fetch(B + '/api' + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, data: r.status === 204 ? null : await r.json() }; };
const { data: { token } } = await api('POST', '/auth/login', { login: 'zz_test_a', password: PW });
const pages = (await api('GET', '/cms/pages', null, token)).data;
for (const p of pages.filter(p => p.url === 'zz-visual')) await api('DELETE', `/cms/pages/${p.id}`, null, token);
const inicio = (await api('GET', `/cms/pages/${pages.find(p => p.url === 'inicio').id}`, null, token)).data;
const copy = (await api('POST', '/cms/pages', { cms_layout: inicio.cms_layout, url: 'zz-visual', title: 'Prueba editor visual', page_content: inicio.page_content, css: inicio.css, noindex: true }, token)).data;

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-clic-${Date.now()}`], defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage(); const errs = [];
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && !/400/.test(m.text()) && errs.push(m.text()));
const text = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const btnByText = (t, scope = 'button') => p.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find(e => e.innerText.trim() === t || e.innerText.includes(t)), scope, t);
const block = t => p.evaluateHandle(t => [...document.querySelectorAll('page-visual-editor .gjs-block')].find(e => e.innerText.trim() === t), t);

await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(800);
for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/zz-visual.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
await wait(1200); await (await btnByText('Editar visualmente')).click();
await p.waitForSelector('page-visual-editor iframe.gjs-frame', { timeout: 20000 }); await wait(2500);
const f = await (await p.$('iframe.gjs-frame')).contentFrame();
const count = sel => f.evaluate(s => document.querySelectorAll(s).length, sel);

// 1) select the h1, then CLICK the "Botón" block → inserted right after it
await f.evaluate(() => document.querySelector('h1').scrollIntoView({ block: 'center' })); await wait(400);
const hb = await (await f.$('h1')).boundingBox(); await p.mouse.click(hb.x + 30, hb.y + hb.height / 2); await wait(400);
await (await btnByText('Bloques')).click(); await wait(300);
const nBtn = await count('a.btn');
await (await block('Botón')).click(); await wait(600);
check('clic en Botón agrega un botón', (await count('a.btn')) === nBtn + 1, `${nBtn} -> ${await count('a.btn')}`);
check('el botón queda justo después del título', await f.evaluate(() => document.querySelector('h1').nextElementSibling?.matches('a.btn')));
check('se abre Configuración con "Lleva a"', (await text()).includes('Lleva a') && (await text()).includes('Enlazar a un PDF'), (await text()).slice(0, 600));
await p.screenshot({ path: `${OUT}/c1-boton-config.png` });
const href = await p.evaluateHandle(() => { const l = [...document.querySelectorAll('.vis-traits .gjs-trt-trait')].find(e => e.innerText.includes('Lleva a')); return l?.querySelector('input'); });
await href.click({ clickCount: 3 }); await href.type('/contacto.page'); await p.keyboard.press('Enter'); await wait(300);
check('el destino del botón cambia', await f.evaluate(() => document.querySelector('h1').nextElementSibling.getAttribute('href')) === '/contacto.page');

// 2) CLICK "Imagen" → picker → upload from the computer → used right away
await (await btnByText('Bloques')).click(); await wait(300);
const nImg = await count('img');
await (await block('Imagen')).click(); await wait(800);
check('se abre la ventana de imágenes', await p.evaluate(() => !!document.querySelector('.gjs-mdl-container') && getComputedStyle(document.querySelector('.gjs-mdl-container')).display !== 'none'));
check('la ventana muestra imágenes ya subidas (logo)', (await p.evaluate(() => document.querySelector('.gjs-am-assets')?.innerText ?? '')).includes('logo-nexvia1') || await p.evaluate(() => [...document.querySelectorAll('.gjs-am-asset')].length > 0));
await p.screenshot({ path: `${OUT}/c2-ventana-imagen.png` });
const up = await p.$('.gjs-am-file-uploader input[type=file]');
await up.uploadFile(path.join(DIR, 'Foto Oficina Chía.png')); await wait(2000);
const src = await f.evaluate(() => [...document.querySelectorAll('img')].map(i => i.getAttribute('src')).find(s => s?.includes('/media/imagenes/')));
check('imagen subida y puesta en la página', (await count('img')) === nImg + 1 && src === '/media/imagenes/foto-oficina-chia.png', `${src}`);
check('la ventana se cierra sola', await p.evaluate(() => { const m = document.querySelector('.gjs-mdl-container'); return !m || getComputedStyle(m).display === 'none'; }));
await p.screenshot({ path: `${OUT}/c3-imagen-puesta.png` });

// 3) CLICK "Documento PDF" → file chooser → link to the uploaded PDF
await (await btnByText('Bloques')).click(); await wait(300);
const [chooser] = await Promise.all([p.waitForFileChooser(), (await block('Documento PDF')).click()]);
await chooser.accept([path.join(DIR, 'Política de Datos.pdf')]); await wait(2000);
const pdf = await f.evaluate(() => [...document.querySelectorAll('a')].find(a => a.getAttribute('href')?.includes('/media/documentos/')));
const pdfInfo = await f.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => a.getAttribute('href')?.includes('/media/documentos/')); return a && [a.getAttribute('href'), a.getAttribute('target'), a.innerText]; });
check('PDF subido y enlazado (nueva pestaña)', pdfInfo && pdfInfo[0] === '/media/documentos/politica-de-datos.pdf' && pdfInfo[1] === '_blank' && pdfInfo[2].includes('Política de Datos'), JSON.stringify(pdfInfo));

// 4) DRAG the "Texto" block
await (await btnByText("Bloques")).click(); await wait(300);
const nP = await count('p');
await f.evaluate(() => document.querySelector('section.hero p').scrollIntoView({ block: 'center' })); await wait(400);
const tb = await (await f.$('section.hero p')).boundingBox(); const bb = await (await block('Texto')).boundingBox();
await p.setDragInterception(true);
await p.mouse.dragAndDrop({ x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }, { x: tb.x + tb.width / 2, y: tb.y + tb.height - 4 }, { delay: 200 });
await p.setDragInterception(false); await wait(800);
check('arrastrar Texto también funciona', (await count('p')) === nP + 1, `${nP} -> ${await count('p')}`);

// 5) a file type that is not allowed
await f.evaluate(() => document.querySelector('img[src="/media/imagenes/foto-oficina-chia.png"]').scrollIntoView({ block: 'center' })); await wait(400);
const sel = await f.$('img[src="/media/imagenes/foto-oficina-chia.png"]'); const ib = await sel.boundingBox();
await p.mouse.click(ib.x + 10, ib.y + 10); await wait(500);
await (await btnByText('Cambiar imagen')).click(); await wait(800);
await (await p.$('.gjs-am-file-uploader input[type=file]')).uploadFile(path.join(DIR, 'virus.exe')); await wait(1500);
check('archivo no permitido → mensaje claro', (await text()).includes('Solo se pueden subir imágenes'), (await text()).slice(-400));
await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('.gjs-mdl-btn-close')?.click()); await wait(400);

// 6) apply, save, publish
await (await btnByText('Aplicar cambios')).click(); await wait(800);
await (await btnByText('Guardar')).click(); await wait(1800);
const pub = await (await fetch(B + '/zz-visual.page')).text();
check('publicado: botón, imagen y PDF', pub.includes('href="/contacto.page"') && pub.includes('/media/imagenes/foto-oficina-chia.png') && pub.includes('/media/documentos/politica-de-datos.pdf'));
const ri = await fetch(B + '/media/imagenes/foto-oficina-chia.png'), rp = await fetch(B + '/media/documentos/politica-de-datos.pdf');
check('la imagen y el PDF abren en el sitio', ri.status === 200 && ri.headers.get('content-type') === 'image/png' && rp.status === 200 && rp.headers.get('content-type') === 'application/pdf', `${ri.status} ${rp.status}`);
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close();
await api('DELETE', `/cms/pages/${copy.id}`, null, token);
console.log(ok ? '\nTODO OK' : '\nHAY FALLOS'); process.exit(ok ? 0 : 1);
