# Componentes

Rutas relativas a `frontend/src/`.

## Estructura
| Pieza | Archivo | Notas |
|---|---|---|
| Clases base (input, label, botones, card) | `lib/ui.ts` | `btn('primary' \| 'secondary' \| 'danger')`; primario = píldora `bg-brand-500 text-on-primary` |
| Franja de título | `lib/title-band.ts` | `titleBand(título, subtítulo, { icon, actions })`; botones de la franja `bandBtn.accent` («Nuevo») y `bandBtn.ghost` |
| Pantalla CRUD | `crud/crud-page.ts` | franja automática con ícono del menú; `bandActions()` para botones extra (p. ej. «Crear con IA»), `openEdit(el)` para abrir un registro |
| Tabla | `crud/crud-table.ts` | encabezado naranja, filas alternadas con entrada suave al cambiar de página, acciones de color, paginación |
| Paginación | `crud/crud-table.ts` `_pager` | clásica (flechas en círculo, números con «…»), círculo activo que se desliza + línea de progreso de acento |
| Formulario | `crud/crud-form.ts` | a todo el ancho; `mono: true` + `language` → `code-editor` |
| Menú lateral / barra superior | `shell/app-sidebar.ts`, `shell/app-header.ts` | menú del usuario: «Mi cuenta» y «Cerrar sesión» |
| Inicio | `modules/home/home-page.ts` | saludo gigante con una entrada animada; `QUICK` = 8 secciones de creación, la primera destacada en `brand` |
| Mi cuenta | `modules/account/account-page.ts` | datos, apariencia (tarjetas de tema de tamaño fijo), colores (estilos + propios), idioma, contraseña |
| Login | `modules/login/login-page.ts` | título «Crea y edita / tu sitio» en dos líneas + cursor que hace clic con onda; formulario en tarjeta |
| Avisos y confirmaciones | `lib/toast.ts` | `toast(msg, 'success' \| 'error')`, `confirmDialog()` |

## Edición de páginas
| Pieza | Archivo | Notas |
|---|---|---|
| Editor visual (GrapesJS) | `modules/cms-page/page-visual-editor.ts` | bloques con clic o arrastre, subida de imágenes/PDF, configuración de enlaces, «Más opciones»; al aplicar formatea HTML/CSS |
| Ajustes rápidos de estilo | `modules/cms-page/quick-style-panel.ts` | colores del sitio + paleta general, tamaños, letra, formato, alineación, esquinas, sombra, espacio, estilo de botón, ancho de imagen |
| Editor de código (Monaco) | `lib/code-editor.ts` | sobre un `<textarea>` (fuente de verdad del formulario); sincroniza en ambos sentidos con eventos `input`; tema claro/oscuro; carga diferida |
| Sugerencias de IA (Tab) | `lib/code-editor.ts` `registerAiSuggestions` | texto gris tras una pausa; pide `POST /api/ai/complete`; se apaga sola si la IA no está configurada |
| Crear con IA | `modules/cms-page/ai-draft-dialog.ts` | describe la página → `POST /api/ai/draft-page` → borrador oculto (noindex) que se abre en el formulario |

## Backend de IA
`backend/app/services/ai_service.py`: Claude con el SDK oficial `anthropic`. Borradores con `AI_DRAFT_MODEL` (por defecto `claude-opus-5-5`, salida estructurada, `fallbacks: "default"`); sugerencias con `AI_COMPLETE_MODEL` (`claude-haiku-5-5`, sin razonamiento, esfuerzo bajo). Sin `ANTHROPIC_API_KEY` responde 503 con un mensaje claro y el panel funciona igual. `AI_FAKE=1` solo para pruebas.

## Patrones de interacción
- Acción creativa (editar visualmente, crear con IA) en **acento**; acciones de guardar/crear en **principal**.
- Diálogos: fondo `bg-black/60 backdrop-blur-sm`, tarjeta `bg-surface rounded-[24px]`, ícono en chip de acento, título `font-display` en mayúsculas, botón principal a la derecha.
- Estados vacíos y errores dicen qué pasó y qué hacer, en la voz del panel (sin disculpas).
