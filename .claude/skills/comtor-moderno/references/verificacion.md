# Verificación

Nada se da por hecho sin mirarlo. Antes de decir "listo":

## 1. Compila y textos completos
```bash
cd frontend && npx tsc --noEmit -p . && npm run build
cd .. && python3 scripts/check_i18n.py      # 0 problemas
```

## 2. Capturas en los dos temas
Toma capturas (Puppeteer, como en `scripts/e2e/*.mjs`) de cada pantalla tocada en **claro y oscuro** y míralas. Para forzar el tema: `document.documentElement.dataset.theme = 'dark'`. Revisa:
- contraste de textos (nada claro sobre claro: cuidado con `text-white` fijo — usa `text-on-primary`/`text-on-accent`);
- que no haya paneles a media pantalla ni textos cortados;
- que el color se vea bien también con un estilo distinto al Clásico (prueba `nexvia` y un color propio claro, p. ej. `#ffd400`).

## 3. Resoluciones
- Inicio y login **sin scroll** en 1280×720, 1366×768 y 1920×1080: `document.scrollingElement.scrollHeight <= innerHeight`.
- Celular (390×844): menú y pantallas usables.

## 4. Movimiento
- Con `prefers-reduced-motion: reduce` (`page.emulateMediaFeatures`) todo debe quedar quieto.
- Nada que se mueva tapa el texto importante.

## 5. Pruebas de navegador del repositorio
Con el servidor de pruebas arriba (`.venv/bin/uvicorn server:app --port 8001`):
```bash
scripts/e2e/run.sh                 # todas
scripts/e2e/run.sh inicio colores  # algunas
```
Cubren: login, inicio sin scroll, Mi cuenta (datos, tema, contraseña, idioma), colores por usuario, paginación animada, editor visual (ida y vuelta sin cambios visibles), bloques con clic/arrastre y subidas, ajustes rápidos, páginas de ejemplo. La de IA (`ia`) necesita el servidor con `AI_FAKE=1`. Si cambias algo que una prueba verifica a propósito, actualiza la prueba en el mismo cambio.

## 6. No romper el contenido real
Las pruebas trabajan sobre copias (`zz-visual`) y usuarios temporales (`zz_test_*`). Si algo toca páginas reales, compara un hash del contenido antes y después (`md5(page_content)` de `inicio`).
