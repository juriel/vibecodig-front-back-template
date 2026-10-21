# Identidad y tokens

Todo vive en `frontend/src/styles.css` (bloque `@theme` y tema oscuro) y `frontend/src/palettes/palette.css` (colores derivados). Los componentes **solo** usan clases de Tailwind sobre estos tokens.

## Superficies y escala neutral
| Token | Claro | Oscuro (GitHub) | Uso |
|---|---|---|---|
| `bg-ink` | `#f4f6f9` | `#0d1117` | fondo de página |
| `bg-surface` | `#ffffff` | `#161b22` | tarjetas, paneles, diálogos (nunca `bg-white`) |
| `bg-raised` | `#f1f4f8` | `#21262d` | campos, hover, chips |
| `slate-50…900` | escala normal | **invertida** (50 oscuro → 900 claro) | así `text-slate-900` es siempre el texto más fuerte y `border-slate-200` siempre la línea |

El tema oscuro redefine las mismas variables bajo `:root[data-theme="dark"]`; no hace falta `dark:` en los componentes.

## Colores por usuario
- Base: `--brand-base` (principal) y `--accent-base` (acento). Por defecto los de TitiCMS: `#1f5fc4` y `#f26a10`.
- `palette.css` deriva `brand-50…900` y `accent-50…700` con `color-mix` para claro y oscuro (en oscuro también se invierten: 50 = tinte tenue, 600+ = texto claro).
- `lib/theme.ts` (al aplicar la apariencia del usuario) fija además:
  - `--color-on-primary` / `--color-on-accent`: blanco u oscuro según qué contraste más sobre el color → usar `text-on-primary` / `text-on-accent` sobre fondos `bg-brand-500` / `bg-accent-500`.
  - `--brand-ink`, `--accent-ink` (y `-dark`): el mismo tono oscurecido o aclarado hasta contraste 4.5, que alimenta `brand-600/700` y `accent-600/700` (lo que se usa como texto).
- Estilos predefinidos (`lib/palettes.ts`): `titi` = «Clásico» (azul + naranja), `nexvia` (#2d9b9b + #2c3e50), `ocean`, `forest`, `grape`, `ruby`, `slate`. «Mis colores» = `palette: 'custom'` con `brand`/`accent` propios.
- Persistencia: tabla `user_preference` (theme, palette, brand, accent) vía `PUT /api/auth/me/preferences`; viaja en el login y `/auth/me`. `localStorage['appearance']` solo cachea el último del equipo para que `web/index.html` lo pinte antes de cargar (sin parpadeo).

## Dónde va cada color (reglas de uso)
| Elemento | Color |
|---|---|
| Franja de título, botón primario, página activa de la paginación, tarjeta destacada del inicio, selección del editor visual | `brand-500` + `text-on-primary` |
| Saludo, enlaces, títulos de color | `text-brand-600` |
| Encabezado de tabla, botón «Nuevo», «Editar visualmente», avatar, marca | `accent-500` + `text-on-accent` |
| Opción activa del menú | `bg-accent-50 text-accent-700` + barrita `bg-accent-500` |
| Íconos de accesos rápidos | `bg-accent-50 text-accent-600` |
| Línea bajo títulos | `h-1 w-12 rounded-full bg-accent-500` |
| Editar / eliminar en tablas | `bg-[#16a34a]` / `bg-[#dc2626]` con texto blanco (fijos a propósito) |

Nunca combinar principal y acento en un mismo degradado.

## Tipografía
- `font-sans` = **Onest** (interfaz). `font-display` = **Barlow Condensed** solo para títulos grandes, en mayúsculas.
- Escala usada: saludo del inicio `text-7xl/8xl/9xl` bold; franja `text-4xl md:text-5xl`; secciones de Mi cuenta `text-3xl`; títulos de tarjeta `text-[1.6rem]`; cuerpo 15 px; ayudas `text-xs`.
- Sin `uppercase tracking-wide` en etiquetas pequeñas.

## Forma
- Tarjetas `rounded-[20px]`–`[24px]`, diálogos `rounded-[24px]`, botones y chips `rounded-full`, campos `rounded-xl`.
- Bordes finos (`border-slate-200`) en lugar de sombras fuertes; `shadow-card` es sutil.
