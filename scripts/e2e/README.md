# Pruebas de navegador del panel

Prueban el panel como lo usaría una persona (Chrome sin ventana, con Puppeteer): editor visual, bloques, subida de
imágenes y PDF, ajustes de estilo, Mi cuenta, colores por usuario, inicio sin scroll, paginación, login, páginas de
ejemplo y el asistente de IA.

## Cómo correrlas
1. Levanta un servidor de pruebas (puede ser el de desarrollo):
   `.venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001`
2. Desde la raíz del repositorio: `scripts/e2e/run.sh` (todas) o `scripts/e2e/run.sh inicio colores` (algunas).

Variables opcionales: `BASE_URL` (por defecto `http://localhost:8001`), `MYSQL_DEFAULTS` (archivo de credenciales del
cliente `mysql`), `DB` (`nexvia_cms`), `CHROME_PATH` (`/usr/bin/google-chrome`), `OUT` (carpeta de capturas, `out/`).

`ia.mjs` necesita el servidor arrancado con `AI_FAKE=1` (la IA responde textos fijos, sin llamar a la API):
`AI_FAKE=1 .venv/bin/uvicorn server:app --port 8001` y luego `scripts/e2e/run.sh ia`. Con el servidor sin clave,
`MODE=off scripts/e2e/run.sh ia` prueba que todo avise que la IA no está configurada.

## Qué hacen con los datos
Crean dos administradores temporales (`zz_test_a`, `zz_test_b`) y una página `zz-visual`, y al terminar los borran junto
con lo que subieron. No modifican las páginas reales (`visual.mjs` y compañía trabajan sobre una copia de «inicio»).
Las capturas quedan en `out/` (ignorada por git).
