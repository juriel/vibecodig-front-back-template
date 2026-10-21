import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:8001', OUT = process.env.OUT ?? 'out';
let ok = true; const check = (n, c, i = '') => { ok &&= !!c; console.log(c ? 'OK  ' : 'FAIL', n, c ? '' : `-> ${i}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', `--user-data-dir=${process.env.OUT ?? 'out'}/profile-ej-${Date.now()}`], defaultViewport: { width: 1366, height: 800 } });
for (const [url, name, must] of [['/servicios.page', 'servicios', 'Servicios de mensajería'], ['/crea-tu-sitio.page', 'crea-tu-sitio', 'Crea tu sitio'], ['/politica-de-datos.page', 'politica', 'Política de tratamiento'], ['/', 'inicio', 'Conectamos'], ['/no-existe', '404', 'Página no encontrada'], ['/panel', 'redireccion-panel', 'Crea tu sitio']]) {
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(B + url, { waitUntil: 'load' }); await wait(1200);
  await p.addStyleTag({ content: '.animate-on-scroll{opacity:1!important;transform:none!important}' });
  const t = await p.evaluate(() => document.body.innerText);
  check(`${url}: contenido`, t.includes(must), t.slice(0, 120));
  check(`${url}: sin errores JS`, errs.length === 0, errs.join(' | '));
  if (['servicios', 'crea-tu-sitio', 'politica'].includes(name)) {
    check(`${url}: widgets expandidos`, !t.includes('%WIDGET') && t.includes('Ver también'));
    const menu = await p.$eval('#header a.nav-link', a => a.getAttribute('href')); check(`${url}: menú NEXVIA enlaza al inicio`, menu.startsWith('/#'), menu);
  }
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); await p.close();
}
await b.close(); console.log(ok ? '\nTODO OK' : '\nHAY FALLOS');
