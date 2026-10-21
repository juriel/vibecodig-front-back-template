import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out', PW = 'PruebaClaude-1234', PW2 = 'NuevaClave-5678';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-cuenta-${Date.now()}`], defaultViewport: { width: 1366, height: 860 } });
const errs = [];
const p = await b.newPage(); p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => m.type() === 'error' && !/400|401/.test(m.text()) && errs.push(m.text()));
await p.evaluateOnNewDocument(() => { if (!localStorage.getItem('i18n')) Object.defineProperty(navigator, 'language', { get: () => 'es-CO' }); });
const theme = () => p.evaluate(() => document.documentElement.dataset.theme);
const text = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const byText = (t, sel = 'button,a') => p.evaluateHandle((t, s) => [...document.querySelectorAll(s)].find(e => e.innerText.trim() === t || e.innerText.trim().startsWith(t)), t, sel);
const login = async (user, pw = PW) => { await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' }); await p.evaluate(() => localStorage.removeItem('SESSION')); await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' }); await p.type('input[name=login]', user); await p.type('input[type=password]', pw); await p.keyboard.press('Enter'); await wait(1500); };

await login('zz_test_a');
await p.screenshot({ path: `${OUT}/1-inicio-claro.png`, fullPage: true });
check('inicio con las secciones de creación', (await text()).includes('Configuraciones globales') && !(await text()).includes('Ver mi sitio'));
check('el inicio cabe sin scroll', await p.evaluate(() => document.scrollingElement.scrollHeight <= innerHeight));
check('ya no hay botón de tema en la barra', !(await p.$('app-header button[title*="tema"]')));
await (await p.$('app-header .relative > button')).click(); await wait(300);
await (await byText('Mi cuenta', 'a')).click(); await wait(1000);
check('"Mi cuenta" abre /admin/account', p.url().endsWith('/admin/account'), p.url());
await p.screenshot({ path: `${OUT}/2-cuenta-claro.png`, fullPage: true });
// data
await p.click('#name', { clickCount: 3 }); await p.type('#name', 'Jhonny Hortua');
await (await byText('Guardar datos')).click(); await wait(800);
check('nombre guardado y actualizado arriba', (await p.$eval('app-header', e => e.innerText)).includes('Jhonny Hortua'));
// theme
await (await p.evaluateHandle(() => [...document.querySelectorAll('[role=radio]')].find(e => e.innerText.includes('Oscuro')))).click(); await wait(800);
check('elegir Oscuro aplica el tema', (await theme()) === 'dark');
await p.screenshot({ path: `${OUT}/3-cuenta-oscuro.png`, fullPage: true });
// password
await p.type('#current_password', 'mala'); await p.type('#new_password', PW2); await p.type('#confirm_password', PW2);
await (await byText('Cambiar contraseña')).click(); await wait(800);
check('contraseña actual incorrecta → mensaje', (await text()).includes('La contraseña actual no es correcta'));
await p.click('#current_password', { clickCount: 3 }); await p.type('#current_password', PW);
await p.click('#confirm_password', { clickCount: 3 }); await p.type('#confirm_password', 'OtraCosa-1');
await (await byText('Cambiar contraseña')).click(); await wait(500);
check('confirmación distinta → mensaje', (await text()).includes('no coinciden'));
await p.click('#confirm_password', { clickCount: 3 }); await p.type('#confirm_password', PW2);
await (await byText('Cambiar contraseña')).click(); await wait(900);
check('contraseña cambiada', (await text()).includes('Contraseña cambiada'));
await login('zz_test_a', PW2);
check('entra con la contraseña nueva y conserva su tema oscuro', p.url().endsWith('/admin') && (await theme()) === 'dark', `${p.url()} ${await theme()}`);
await p.screenshot({ path: `${OUT}/4-inicio-oscuro.png`, fullPage: true });
await p.goto(B + '/admin/pages', { waitUntil: 'networkidle0' }); await wait(600);
await p.screenshot({ path: `${OUT}/5-paginas-oscuro.png` });
for (const r of await p.$$('tbody tr')) if ((await r.evaluate(e => e.innerText)).includes('/inicio.page')) { await (await r.$('button[title="Editar"]')).click(); break; }
await wait(800); await p.screenshot({ path: `${OUT}/6-formulario-oscuro.png` });
await (await byText('Editar visualmente')).click(); await p.waitForSelector('iframe.gjs-frame'); await wait(2500);
const f = await (await p.$('iframe.gjs-frame')).contentFrame(); const bb = await (await f.$('h1')).boundingBox(); await p.mouse.click(bb.x + 20, bb.y + 20); await wait(600);
await p.screenshot({ path: `${OUT}/7-editor-oscuro.png` });
await (await byText('Cancelar')).click(); await wait(400);
await login('zz_test_b');
check('otro usuario ve claro', (await theme()) === 'light');
// language
await p.goto(B + '/admin/account', { waitUntil: 'networkidle0' }); await wait(500);
await (await byText('English')).click(); await wait(2000);
check('idioma cambia a inglés', (await text()).includes('MY ACCOUNT') || (await text()).includes('My account'), (await text()).slice(0, 200));
await (await byText('Español')).click(); await wait(2000);
check('vuelve a español', /apariencia/i.test(await text()), (await text()).slice(0, 200));
await p.evaluate(() => localStorage.removeItem('SESSION')); await p.goto(B + '/admin/login', { waitUntil: 'networkidle0' }); await wait(500);
await p.screenshot({ path: `${OUT}/8-login-claro.png` });
check('sin errores JS', errs.length === 0, errs.join(' | '));
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
