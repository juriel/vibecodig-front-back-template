---
name: comtor-moderno
description: Sistema de diseño "Comtor moderno" del panel de administración (la evolución de TitiCMS) — tipografía, colores por usuario (claro/oscuro, estilos predefinidos y propios), franjas de título, tablas, paginación, tarjetas del inicio, Mi cuenta, editor visual y de código, asistente de IA, movimiento y las reglas de diseño que pidió el usuario. Úsala SIEMPRE que crees o cambies una pantalla, componente, color, texto o animación del panel (`frontend/src`), o cuando pregunten cómo se ve, cómo extender el estilo o cómo verificarlo.
---

# Comtor moderno

El panel (`/admin`) es la **evolución de TitiCMS**: conserva sus referencias (azul y naranja, franja de título azul, encabezados de tabla naranja, accesos grandes en el inicio) con un acabado moderno. Lo usa sobre todo una persona **no técnica** (abogada) para crear páginas, así que todo prioriza claridad.

## Antes de tocar nada
1. Lee la referencia que corresponda:
   - `references/identidad-y-tokens.md` — colores, temas, estilos de color por usuario, tipografía, superficies, contraste.
   - `references/componentes.md` — qué componente usar para cada cosa y dónde vive.
   - `references/verificacion.md` — capturas, resoluciones y pruebas que hay que pasar antes de dar algo por hecho.
2. Reutiliza lo que existe (`lib/ui.ts`, `lib/title-band.ts`, `crud/*`, `lib/code-editor.ts`). Un componente nuevo solo si ninguno sirve.

## Reglas del usuario (no negociables)
Salieron de sus pedidos y correcciones; respétalas aunque otra guía diga lo contrario.

- **Colores de titi separados, nunca mezclados en degradados.** El principal (`brand`, azul titi por defecto) va en franjas, botones, enlaces, íconos y títulos; el acento (`accent`, naranja titi) en encabezados de tabla, "Nuevo", opción activa del menú, íconos de accesos, línea bajo títulos, avatar y "Editar visualmente". Nada de `linear-gradient` azul→naranja.
- **Cada persona elige su apariencia** en Mi cuenta: tema claro/oscuro y estilo de colores (predefinido o propio). Nunca fijes colores con hex en componentes: usa las clases `brand-*`, `accent-*`, `slate-*`, `bg-ink/surface/raised` y `text-on-primary` / `text-on-accent`.
- **Tema claro por defecto** (el jefe lo prefiere). El oscuro sigue la paleta de GitHub para que se lea bien.
- **Inicio sin scroll** en 1280×720, 1366×768 y 1920×1080, y solo con lo de **creación** (las 8 secciones de TitiCMS, Páginas destacada). Nada de "Mi cuenta" ni "Ver sitio" ahí.
- **Saludo del inicio**: solo «Hola, <nombre>» en letra gigante. No preguntas tipo «¿Qué creamos hoy?».
- **Nada de paneles a media pantalla**: formularios y tarjetas usan el ancho disponible.
- **Títulos de pantalla en franja azul** (`titleBand`) con ícono, título en mayúsculas condensadas y acciones a la derecha («Nuevo» en naranja).
- **Tablas TitiCMS modernas**: encabezado naranja, filas alternadas, acciones de color (ver = principal, editar = verde `#16a34a`, eliminar = **rojo** `#dc2626`), paginación clásica con movimiento.
- **Letras**: Onest para la interfaz; Barlow Condensed (`font-display`) solo para títulos grandes. Sin etiquetas en MAYÚSCULAS espaciadas, sin «·» entre metadatos, sin flechas «→» pegadas a textos.
- **Textos** en español claro, desde el punto de vista de quien usa el panel ("Sube imágenes y PDF", no "media manager"). Todo pasa por i18n (`es` y `en`).
- **Movimiento** solo con propósito: una entrada por pantalla y respuestas a acciones. Respeta `prefers-reduced-motion`. En el login, solo el cursor que hace clic (el usuario rechazó esferas, pincel tipo DVD e ilustraciones armándose).
- **Legibilidad primero**: contraste ≥ 4.5 en textos; `lib/theme.ts` ya calcula texto blanco u oscuro sobre cada color y una versión legible del color cuando se usa como texto.

## Para crear una pantalla nueva en este estilo
1. Módulo CRUD con el patrón de `CLAUDE.md` (service / table / form / page). La franja, la tabla naranja, la paginación y el formulario a todo el ancho salen solos de `crud/`.
2. Ícono en `lib/icons.ts` (Heroicons outline) y entrada en `menu.ts` con su `icon`. La franja toma el ícono del menú.
3. Si es una tarea de creación del día a día, evalúa si va en el inicio (`modules/home/home-page.ts`, lista `QUICK`) sin romper el "sin scroll".
4. Campos de código: `type: 'textarea', mono: true, language: 'html' | 'css' | 'javascript'` → editor tipo VS Code con sugerencias de IA.
5. Textos en ambos catálogos y `python3 scripts/check_i18n.py`.
6. Verifica según `references/verificacion.md`.

## Para cambiar o agregar un estilo de color
`frontend/src/lib/palettes.ts` (lista `PALETTES`: id + color principal + acento) y su nombre `palette.<id>` en los catálogos. Las escalas claro/oscuro las deriva `src/palettes/palette.css`; el contraste lo resuelve `lib/theme.ts`. Elige pares que combinen y comprueba en los dos temas.
