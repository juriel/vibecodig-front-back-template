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

const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-rapido-${Date.now()}`], defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage(); const errs = [];
await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
const text = () => p.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
const byText = (t, scope = 'button') => p.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find(e => e.innerText.trim() === t), scope, t);
const qp = (t) => p.evaluateHandle(t => [...document.querySelectorAll('quick-style-panel button')].find(e => e.innerText.trim() === t), t);
const swatch = (name, row) => p.evaluateHandle((n, r) => { const rows = [...document.querySelectorAll('quick-style-panel .space-y-1\\.5')]; const box = rows.find(x => x.querySelector('p')?.textContent.trim() === r); return box?.querySelector(`button[title="${n}"]`); }, name, row);

await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' });
await p.type('input[name=login]', 'zz_test_a'); await p.type('input[type=password]', PW); await p.keyboard.press('Enter'); await wait(1500);
await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(800);
for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/zz-visual.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
await wait(1200); await (await byText('Editar visualmente')).click();
await p.waitForSelector('page-visual-editor iframe.gjs-frame', { timeout: 20000 }); await wait(2500);
const f = await (await p.$('iframe.gjs-frame')).contentFrame();
const cs = (sel, prop) => f.evaluate((s, pr) => getComputedStyle(document.querySelector(s)).getPropertyValue(pr), sel, prop);
const pick = async sel => { await f.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await wait(300); const bb = await (await f.$(sel)).boundingBox(); await p.mouse.click(bb.x + 15, bb.y + 15); await wait(500); };

// --- heading ---
await pick('h1');
const t1 = await text();
check('panel de ajustes rápidos visible', t1.includes('Ajustes rápidos') && t1.includes('Color del texto') && t1.includes('Tipo de letra'), t1.slice(0, 500));
const sw = await swatch('primary', 'Color del texto');
check('muestras con los colores del sitio (primary)', await sw.evaluate(e => !!e));
await sw.click(); await wait(300);
check('color del texto cambia con un clic', (await cs('h1', 'color')) === 'rgb(45, 155, 155)', await cs('h1', 'color'));
const s0 = parseFloat(await cs('h1', 'font-size'));
await (await qp('A+')).click(); await wait(200); await (await qp('A+')).click(); await wait(300);
check('A+ agranda el texto', parseFloat(await cs('h1', 'font-size')) === s0 + 4, `${s0} -> ${await cs('h1', 'font-size')}`);
await p.select('quick-style-panel select', "Georgia, 'Times New Roman', serif"); await wait(300);
check('tipo de letra Georgia', (await cs('h1', 'font-family')).includes('Georgia'), await cs('h1', 'font-family'));
await (await qp('Cursiva')).click(); await (await qp('Derecha')).click(); await wait(300);
check('cursiva y alineación', (await cs('h1', 'font-style')) === 'italic' && (await cs('h1', 'text-align')) === 'right');
await (await swatch('Rosado', 'Color del texto')).click(); await wait(300);
check('color rosado de la paleta general', (await cs('h1', 'color')) === 'rgb(236, 64, 122)', await cs('h1', 'color'));
await p.screenshot({ path: `${OUT}/r1-titulo.png` });
await (await p.$('details.vis-more summary')).click(); await wait(300);
check('"Más opciones" incluye tipo de letra y transparencia', (await text()).includes('Transparencia') && !!(await p.$('.gjs-sm-property__font-family')), '');
await (await p.$('details.vis-more summary')).click();
// reset
await (await qp('Quitar mis cambios')).click(); await wait(300);
check('"Quitar mis cambios" vuelve al estilo original', (await cs('h1', 'font-style')) === 'normal' && (await cs('h1', 'color')) !== 'rgb(45, 155, 155)', await cs('h1', 'color'));
await (await qp('Muy grande')).click(); await (await swatch('primary', 'Color del texto')).click(); await wait(300);

// --- button ---
await pick('a.btn-primary');
check('en un botón aparece "Estilo del botón"', (await text()).includes('Estilo del botón'));
await (await swatch('text-dark', 'Color de fondo')).click(); await wait(900);
check('color de fondo del botón (tapa el degradado)', (await cs('a.btn-primary', 'background-color')) === 'rgb(44, 62, 80)' && (await cs('a.btn-primary', 'background-image')) === 'none', `${await cs('a.btn-primary', 'background-color')} ${await cs('a.btn-primary', 'background-image')}`);
await (await qp('Píldora')).click(); await wait(900);
check('esquinas píldora', (await cs('a.btn-primary', 'border-radius')) === '999px', await cs('a.btn-primary', 'border-radius'));
await p.screenshot({ path: `${OUT}/r2-boton.png` });
await (await qp('Con borde')).click(); await wait(400);
check('botón pasa a "Con borde"', await f.evaluate(() => !!document.querySelector('a.btn-outline[id]') || document.querySelectorAll('a.btn-outline').length >= 2));

// --- image: click block, upload, width, center ---
await pick('h1');
await (await byText('Bloques')).click(); await wait(300);
await (await p.evaluateHandle(() => [...document.querySelectorAll('.gjs-block')].find(e => e.innerText.trim() === 'Imagen'))).click(); await wait(800);
await (await p.$('.gjs-am-file-uploader input[type=file]')).uploadFile(path.join(DIR, 'Foto Oficina Chía.png')); await wait(2000);
check('imagen subida y puesta', await f.evaluate(() => !!document.querySelector('img[src="/media/imagenes/foto-oficina-chia.png"]')));
await pick('img[src="/media/imagenes/foto-oficina-chia.png"]');
check('en una imagen aparece "Ancho de la imagen"', (await text()).includes('Ancho de la imagen'));
await (await qp('50%')).click(); await (await qp('Centrar imagen')).click(); await (await qp('Redondas')).click(); await wait(400);
const iw = await f.evaluate(() => { const i = document.querySelector('img[src="/media/imagenes/foto-oficina-chia.png"]'); const r = i.getBoundingClientRect(), pr = i.parentElement.getBoundingClientRect(); return [Math.round(r.width / pr.width * 100), Math.round(r.left - pr.left), Math.round(pr.right - r.right)]; });
check('imagen al 50% y centrada', Math.abs(iw[0] - 50) <= 2 && Math.abs(iw[1] - iw[2]) <= 2, JSON.stringify(iw));
await p.screenshot({ path: `${OUT}/r3-imagen.png` });

// --- mobile only ---
await p.click('button[title="Celular"]'); await wait(1200);
const f2 = await (await p.$('iframe.gjs-frame')).contentFrame();
await f2.evaluate(() => document.querySelector('h1').scrollIntoView({ block: 'center' })); await wait(300);
const hb = await (await f2.$('h1')).boundingBox(); await p.mouse.click(hb.x + 15, hb.y + 15); await wait(500);
await (await qp('Título')).click(); await wait(300);
const mob = await f2.evaluate(() => getComputedStyle(document.querySelector('h1')).fontSize);
await p.click('button[title="Computador"]'); await wait(1200);
const f3 = await (await p.$('iframe.gjs-frame')).contentFrame();
const desk = await f3.evaluate(() => getComputedStyle(document.querySelector('h1')).fontSize);
check('tamaño en Celular no cambia el de Computador', mob === '32px' && desk === '48px', `${mob} / ${desk}`);

// --- publish ---
await (await byText('Aplicar cambios')).click(); await wait(800);
await (await byText('Guardar')).click(); await wait(1800);
const css = await (await fetch(B + '/css/zz-visual.css')).text();
check('CSS publicado con los cambios (color, píldora, @media celular)', css.includes('45, 155, 155') || css.toLowerCase().includes('#2d9b9b') ? css.includes('999px') && /@media[^{]*max-width:\s*480px/.test(css) : false, css.slice(0, 400));
const q = await b.newPage(); await q.goto(B + '/zz-visual.page', { waitUntil: 'load' }); await wait(800);
check('en el sitio publicado el título es primary y 48px', await q.evaluate(() => { const s = getComputedStyle(document.querySelector('h1')); return s.color === 'rgb(45, 155, 155)' && s.fontSize === '48px'; }));
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close();
await api('DELETE', `/cms/pages/${copy.id}`, null, token);
console.log(ok ? '\nTODO OK' : '\nHAY FALLOS'); process.exit(ok ? 0 : 1);
