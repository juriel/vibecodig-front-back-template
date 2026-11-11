> **Copia del kit de marca.** La fuente es `~/Documents/nexvia-marca/` en el PC de Jhonny: si cambia algo, se cambia allá y se vuelve a copiar a cada proyecto (smsconsole, SMPP Client Lab, Nexvia-Bot, CMS). Las rutas de este archivo (`logos/oficial/`, `fuentes/`, `nexvia-tokens.css`) son relativas a esta carpeta `marca/`. El script para regenerar logos (`herramientas/`) y los PDF de la propuesta están solo en la carpeta original.

# Marca NEXVIA — referencia única

Este archivo es la referencia para **todo lo visual de NEXVIA**: smsconsole (consola de clientes y panel del equipo), Nexvia-Bot / Chabito, SMPP Client Lab, el sitio web, el CMS, los videos, los correos, los reportes y cualquier página, panel o función nueva.

- **Origen:** `NEXVIA - Marca - propuesta.pdf`, que la jefa aprobó, y `NEXVIA - Marca - anexo detallado.pdf`, que trae el detalle. Los dos están en esta misma carpeta.
- **Valores para el código:** `nexvia-tokens.css` (variables CSS) y `tailwind.nexvia.js` (preset de Tailwind), también en esta carpeta.
- **Kit listo para usar:** logos en `logos/oficial/` y fuentes web en `fuentes/`. El índice y los fragmentos para copiar están en la **sección 10**.
- **Versión 1:** 10 de noviembre de 2026.

> **Si este archivo y el código chocan, manda este archivo para lo nuevo.**
> Lo que ya existe se migra por fases y solo cuando se pida (ver la sección 9). No cambies colores ni letras de pantallas existentes por iniciativa propia.

---

## 1. Logo — opción **E** (aprobada)

**Qué es:** el **avión nuevo** seguido de la palabra **nexvia** en **Baloo 2**.
- El avión es plano y bicolor, en Señal y Petróleo, con tres puntos detrás.
- Va en minúsculas, color Noche, y la **x** en Señal.

**Ajuste de la jefa:** **todas las letras del mismo tamaño**. La x no puede ir más grande ni más chica que las demás: misma altura, misma línea base y mismo grosor que n, e, v, i, a. Solo cambia de color.

### Versiones
| Versión | Dónde | Colores |
|---|---|---|
| **Principal** (`color`) | Sobre blanco, Papel o Bruma. Es la de siempre. | Letras Noche, x Señal; avión con ala superior `#2BBBA6` e inferior Petróleo; puntos Menta, `#2BBBA6` y Señal |
| **Negativo** (`negativo`) | Sobre Noche o Petróleo | Letras blancas, x Menta; avión Menta y Señal |
| **Sobre color de marca** (`sobre-senal`) | Sobre Señal | Letras blancas; avión blanco y Noche; puntos blancos |
| **Sin la x de color** (`color-sin-x`) | Cuando el color de la x estorba | Letras todas Noche, avión a color |
| **Una sola tinta** | Sellos, facturas, impresión | Todo Noche, o todo blanco |
| **Apilado** | Espacios cuadrados o verticales | Avión arriba y nombre debajo |
| **Símbolo** | Favicon, ícono de app, foto de perfil (WhatsApp del bot, por ejemplo) | Avión con los tres puntos en un cuadrado redondeado, fondo Noche o Señal |
| **Tamaños pequeños** | 16–48 px y favicon | El símbolo sin los tres puntos y con el avión más grande (`-chico`), porque a ese tamaño los puntos no se ven |

### Reglas
- **Nunca escribas "nexvia" con una fuente para armar el logo.** Usa siempre el archivo SVG en trazos, para que no dependa de que Baloo 2 esté instalada.
- **Construcción:** x = alto del ala superior del avión.
  - Zona libre de x en los cuatro lados.
  - Separación de ½x entre el avión y el nombre.
- **Tamaño mínimo:** 24 px en pantalla y 8 mm impreso.
- No estirarlo, rotarlo, cambiarle colores, ponerle sombras ni ponerlo sobre fondos sin contraste.
- En correos va en PNG al doble de tamaño, porque muchos lectores de correo no muestran SVG.

### Archivos
- **Ya están hechos** en `logos/oficial/`, con el índice en la sección 10.
- El color `#2BBBA6`, el ala superior del avión del manual, **existe solo dentro del logo**. No se usa en pantallas.
- Los archivos sueltos en `logos/` que no están dentro de `oficial/` (`nexvia-principal.svg`, `nexvia-negativo-noche.svg`, etc.) son de la opción **A (Sora)** o del avión viejo. **No los uses.**
- Los logos se toman siempre de `logos/oficial/`, nunca de capturas de pantalla.
- Se retiran todos los logos viejos:
  - el avión con degradado y "nexvia" gris en Open Sans;
  - el avión al revés;
  - el PNG de 128 px del SMPP Lab;
  - los PNG del sitio.

---

## 2. Color — 22 colores en total

### Marca (7)
| Nombre | Hex | Para qué |
|---|---|---|
| **Señal** | `#14A3A8` | Color principal: gráficos, íconos, enlaces grandes, fondos de marca, foco |
| **Petróleo** | `#0E6E7A` | Botones y enlaces con texto blanco (hover `#0A5862`) |
| **Noche** | `#0B2A3C` | Textos, títulos, fondos oscuros |
| **Menta** | `#4FD1A5` | Acento sobre fondo oscuro, ilustración. Siempre con texto Noche |
| **Bruma** | `#DDF3EF` | Fondos suaves, filas seleccionadas, etiquetas |
| **Papel** | `#F5F8F7` | Fondo general de la plataforma |
| **Coral** | `#FF6B3D` | Contraste: **un solo elemento por pantalla**, como una novedad o el punto final de un titular. **No es color de error** ni de acciones de la plataforma |

**Por qué hay dos verdes:** Señal con texto blanco da 3,1:1, que no alcanza para el texto de un botón. Por eso:
- la marca se ve en **Señal**;
- los botones van en **Petróleo**, que con blanco da 5,9:1.

**Proporción aproximada:** Papel y blanco 55 %, Noche 20 %, Señal 13 %, Petróleo 6 %, Bruma y Menta 4 %, Coral ≤ 2 %. Mucho aire y poco color.

### Estados (4)
| Estado | Texto | Fondo | Uso |
|---|---|---|---|
| **Éxito** | `#0F7A5C` | `#E3F6EF` | Entregado, conectado |
| **Aviso** | `#9A5B00` | `#FFF3DC` | Pendiente, en cola |
| **Error** | `#C0392B` | `#FDECEA` | Fallido |
| **Info** | `#0E6E7A` (Petróleo) | `#DDF3EF` (Bruma) | Información; reemplaza todos los azules |

**WhatsApp** `#25D366` va **solo** en el botón de WhatsApp, porque es la marca de otra empresa.

### Grises — una sola escala con tono de Noche (11)
Reemplaza a slate, gray y todos los grises sueltos.

| Paso | Hex | Uso |
|---|---|---|
| 950 | `#0B2A3C` | = Noche |
| 900 | `#183140` | |
| 800 | `#2F4859` | |
| 700 | `#4D5D68` | **Texto secundario** (6,8:1) |
| 600 | `#637480` | **El gris más claro que sirve para texto** (4,8:1) |
| 500 | `#7B8C98` | Solo texto grande e íconos |
| 400 | `#9CA6AD` | Íconos apagados |
| 300 | `#BCC6CD` | |
| 200 | `#D5E0E7` | **Bordes** |
| 100 | `#EBF1F5` | |
| 50 | `#F5F8F7` | = Papel |

### Qué texto va sobre qué fondo (WCAG 2.2 AA)
| Fondo | Texto que sirve |
|---|---|
| Blanco / Papel / Bruma | Noche, Petróleo. Señal **solo** en texto grande |
| Señal | Noche. Blanco **solo** en texto grande |
| Petróleo | Blanco. **Nunca** Noche |
| Noche | Blanco, Menta, Señal. **Nunca** Petróleo |
| Menta / Coral | **Solo** Noche |

- Los estados nunca se indican solo con color: siempre llevan también ícono o texto.
  - Ejemplos: ✓✓ Entregado · ◷ En cola · ✕ Fallido · ↺ Enviando.

---

## 3. Tipografía

| Uso | Fuente |
|---|---|
| Títulos, cifras y métricas | **Sora** |
| Textos, botones, tablas, menús, formularios | **Manrope** |
| Logo | **Baloo 2**, pero solo dentro del archivo del logo, en trazos. **No se usa para textos de pantalla** |
| Registros y código (logs, PDU, SQL) | Una monoespaciada; se mantiene la que ya usa cada proyecto |

- **Respaldo:** `'Sora' | 'Manrope', 'Segoe UI', Arial, sans-serif`.
- **En correos:** Manrope con respaldo Arial.
- **Las fuentes se sirven desde nuestros propios servidores**, como woff2 con latín y latín extendido para ñ y tildes, igual que ya hace la consola en `/branding/fonts`. No se cargan de Google. Las dos fuentes son SIL OFL: gratis.

### Escala
| Estilo | Fuente | Tamaño / línea |
|---|---|---|
| Display | Sora Bold | 56 / 60 px, −2 % de espaciado |
| Título 1 | Sora Bold | 40 / 48 |
| Título 2 | Sora Bold | 30 / 38 |
| Título 3 | Sora SemiBold | 22 / 30 |
| Título 4 y botones | Sora SemiBold | 16–18 / 24 |
| Texto | Manrope Regular | 16 / 24 en web; 14 / 20 en tablas |
| Etiquetas y menús | Manrope SemiBold | 14 / 20 |
| LEYENDA | Manrope Bold | 12 / 16, +8 %, en mayúsculas |
| Cifras | Sora Bold | Con cifras tabulares (`font-variant-numeric: tabular-nums`) |

**Reglas:**
- Como mucho dos pesos por pantalla, además del texto normal.
- **Títulos en tipo oración:** "Envío masivo", no "ENVÍO MASIVO".

Retiradas: Poppins, Montserrat, Open Sans, Georgia, la letra del sistema, Onest y Barlow Condensed. Arial queda solo como respaldo en correos.

---

## 4. Componentes

| Elemento | Valor | Para qué |
|---|---|---|
| Radio píldora | `999px` | Botones, etiquetas, chips, buscador |
| Radio grande | `20px` | Modales, tarjetas destacadas |
| Radio medio | `14px` | Tarjetas, tablas |
| Radio chico | `10px` | Campos de formulario |
| Sombra base | `0 1px 2px rgba(11,42,60,.06), 0 4px 16px rgba(11,42,60,.06)` | Tarjetas |
| Sombra elevada | `0 12px 32px -8px rgba(11,42,60,.18)` | Menús, modales |
| Foco de teclado | Contorno de 3 px en Señal, 2 px de separación | Siempre visible con teclado |
| Espaciado | 4 · 8 · 12 · 16 · 24 · 32 · 48 px | Márgenes y separaciones |
| Íconos | Heroicons de línea, trazo 1,75 px, 20/24 px | Sin mezclar estilos |
| Movimiento | 150–250 ms, `cubic-bezier(.16, 1, .3, 1)` | Respetar "reducir movimiento" |

**Botones**, siempre en forma de píldora:
- **Primario:** fondo Petróleo, texto blanco, hover `#0A5862`.
- **Secundario:** borde neutro-200 y texto Noche.
- **Peligro:** fondo Error con texto blanco.
- **Sobre fondo oscuro:** fondo Menta con texto Noche.
- **Coral** solo para algo destacado de marketing (sitio, promos), **nunca** para una acción de la plataforma.

---

## 5. Tokens en el código

**Regla:** **prohibido escribir colores sueltos** (`#2D9B9B`, `text-slate-500`, `bg-[#...]`). El código usa solo los tokens de **uso**.

| Token CSS | Clase Tailwind | Valor |
|---|---|---|
| `--nx-texto` | `text-texto` | Noche |
| `--nx-texto-2` | `text-texto-2` | neutro-700 |
| `--nx-texto-3` | `text-texto-3` | neutro-600 |
| `--nx-fondo` | `bg-fondo` | Papel |
| `--nx-superficie` | `bg-white` | `#FFFFFF` |
| `--nx-borde` | `border-borde` | neutro-200 |
| `--nx-accion` / `--nx-accion-hover` | `bg-accion` / `hover:bg-accion-hover` | Petróleo / `#0A5862` |
| `--nx-marca` | `text-marca` / `bg-marca` | Señal |
| `--nx-foco` | — | Señal |
| `--nx-exito`, `--nx-aviso`, `--nx-error`, `--nx-info` (+ `-fondo`) | `exito`, `aviso`, `error`, `info` (+ `-fondo`) | ver la sección 2 |
| `--nx-fuente-titulos` / `--nx-fuente-texto` | `font-titulos` / `font-texto` | Sora / Manrope |
| `--nx-radio-*`, `--nx-sombra*`, `--nx-transicion` | `rounded-pildora/grande/medio/chico`, `shadow-nx`, `shadow-nx-elevada` | ver la sección 4 |

- **Con Tailwind:** en `tailwind.config.js` va `presets: [require('./tailwind.nexvia.js')]`. Mientras dure la migración, `primary` queda como alias de Petróleo.
- **Sin Tailwind:** se copia `nexvia-tokens.css` y se usan sus variables. Así lo hacen SMPP Client Lab, el sitio y los videos.
- **Si falta un valor:** se agrega aquí y en los dos archivos de tokens. No se inventa en el proyecto.

### Equivalencias de lo viejo
| Hoy | Pasa a |
|---|---|
| `#2D9B9B`, `#3DB9B9`, `#13A3AB` | Señal |
| `#1F7A7A`, `#1A7373`, `#175F5F`, `#0E7D72` | Petróleo |
| `#0A1628`, `#0F2847`, `#1E3A5F` | Noche, neutro-900, neutro-800 |
| `#2C3E50`, `#1F2937`, slate/gray-800 y 900 | `texto` (Noche) |
| `#7F8C8D`, `#64748B`, slate/gray-500 | `texto-3` (neutro-600) |
| slate/gray-50, `#F5F7FA` | Papel |
| slate/gray-200, `#E2E8F0` | `borde` (neutro-200) |
| emerald-*, `#27AE60` | `exito` |
| red-*, `#DC2626`, `#EF4444` | `error` |
| amber-*, `#D97706` | `aviso` |
| blue-*, `#2563EB` | `info` (Petróleo) |
| `#3D3D3D` ("accent"), morado, rosa, índigo | Se eliminan |

---

## 6. Modo oscuro

La propuesta no define un tema oscuro completo. Hasta que se defina:
- **Fondo:** Noche. Superficies en neutro-900 y neutro-800.
- **Textos:** blanco y neutro-300.
- **Acento:** Menta o Señal.
- **Botón primario:** Menta con texto Noche.
- **Logo:** la versión negativo.
- Los contrastes se verifican con la tabla de la sección 2.

---

## 7. Voz y escritura

- **Siempre "tú", nunca "vos".** "Prueba de nuevo", no "Probá de nuevo".
- Frases cortas y concretas, sin tecnicismos para el cliente.
  - Ejemplo: "Tu mensaje no salió", no "Error 0x0B".
- El detalle técnico (códigos SMPP, PDU) va solo en las pantallas del equipo (NOC, SMPP Lab), no en las del cliente.

---

## 8. Lista de revisión para cualquier pantalla nueva

- [ ] Logo E desde `logos/`, como archivo y nunca escrito con fuente, en la versión que le toca al fondo.
- [ ] Solo tokens: ningún hex, slate ni gray sueltos.
- [ ] Sora en títulos y cifras, Manrope en todo lo demás, servidas desde nuestro servidor.
- [ ] Botón primario Petróleo en píldora, y como mucho un elemento Coral.
- [ ] Texto secundario no más claro que neutro-600.
- [ ] Contraste según la tabla de la sección 2.
- [ ] Estados con ícono o texto, no solo color.
- [ ] Foco de teclado visible.
- [ ] Títulos en tipo oración y textos con "tú".

---

## 9. Migración por fases (no empezar sin que el usuario lo pida)

1. **Base de marca:**
   - archivos del logo E;
   - Sora y Manrope en woff2;
   - tokens CSS y preset de Tailwind.
2. **smsconsole:**
   - Tailwind y variables globales;
   - luego logo, botones y estados;
   - slate y gray pasan a neutros vista por vista;
   - reportes de Contabilidad.
3. **Sitio web:** paleta (ya usa variables CSS), logo SVG y fuentes.
4. **Videos (Remotion):** un solo archivo de colores y fuentes, y el logo SVG. Los promos ya publicados se dejan como están.
5. **Correos, herramientas y piezas:**
   - plantilla única de correo;
   - SMPP Client Lab (hoy usa Onest, Barlow y `#2d9b9b`);
   - Nexvia-Bot y su panel;
   - portal de portabilidad;
   - firmas de correo, cotizaciones y presentaciones.

### Pendiente de decidir o producir
- Validar con la diseñadora el símbolo, la versión de una tinta y si los grises y estados entran al manual v2.
- Logo en un archivo editable (AI o Figma) para piezas futuras.
- Tema oscuro completo (ver la sección 6).

---

## 10. Kit listo para usar (sacar de aquí)

Todo está en `~/Documents/nexvia-marca/`. Para un proyecto nuevo **se copian solo los archivos que se necesitan** dentro del proyecto, por ejemplo a `public/branding/`. Nunca se enlazan a esta carpeta, porque solo existe en este PC.

### Nombres de archivo
`logos/oficial/svg/nexvia-<pieza>-<colores>.svg`

**`<pieza>`:**
| Pieza | Qué es | Cuándo |
|---|---|---|
| `horizontal` | Avión + nombre en una línea | **Lo normal**: encabezados, menú, login, correos, documentos |
| `apilado` | Avión arriba, nombre abajo | Espacios cuadrados, portadas, pantallas de carga |
| `nombre` | Solo "nexvia", en trazos | Cuando el avión ya está cerca, o en textos muy anchos y bajos |
| `avion` | Solo el avión con los tres puntos | Ícono de marca suelto, marcas de agua, cargando |
| `avion-sin-puntos` | Solo el avión | Espacios muy chicos (menos de 40 px de ancho) |

**`<colores>`:**
| Colores | Para fondo | Archivo de ejemplo |
|---|---|---|
| `color` | Blanco, Papel, Bruma | `nexvia-horizontal-color.svg` ← **la de siempre** |
| `color-sin-x` | Blanco, Papel, Bruma | `nexvia-horizontal-color-sin-x.svg` |
| `negativo` | Noche, Petróleo, fotos oscuras | `nexvia-horizontal-negativo.svg` |
| `sobre-senal` | Señal | `nexvia-horizontal-sobre-senal.svg` |
| `noche` | Claro, impreso a una tinta | `nexvia-horizontal-noche.svg` |
| `blanco` | Oscuro, impreso a una tinta | `nexvia-horizontal-blanco.svg` |

`avion` y `avion-sin-puntos` no tienen la variante `color-sin-x`, porque no llevan letras.

### Íconos de app y favicon
| Archivo | Qué es |
|---|---|
| `svg/nexvia-app-noche.svg` / `svg/nexvia-app-senal.svg` | Cuadrado redondeado con el avión, fondo Noche o Señal (64 px o más) |
| `svg/nexvia-app-noche-chico.svg` / `-senal-chico.svg` | Lo mismo sin puntos y con el avión más grande (16–48 px) |
| `png/app/nexvia-app-{noche,senal}-{16,32,48,64,180,192,512,1024}.png` | En PNG. Los de 16–48 ya usan la versión chica |
| `favicon/favicon.ico` | 16, 32 y 48 px en un solo archivo |
| `favicon/favicon.svg` | Favicon vectorial (versión chica, Noche) |
| `favicon/favicon-32.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` | Para el `<head>` y el manifest |

**Foto de perfil** de WhatsApp (Chabito), Google o redes: `png/app/nexvia-app-noche-1024.png` o `nexvia-app-senal-1024.png`.

### PNG ya exportados (fondo transparente; el número es el ancho en px)
| Carpeta | Anchos |
|---|---|
| `png/horizontal/` | 240, 480, 960, 1920 |
| `png/apilado/` | 256, 512, 1024 |
| `png/nombre/` | 256, 512, 1024, 2048 |
| `png/avion/` | 64, 128, 256, 512, 1024 |
| `png/avion-sin-puntos/` | 64, 128, 256, 512 |

Ejemplo: `png/horizontal/nexvia-horizontal-color-480.png`.

**Regla para PNG:** se usa el doble del tamaño en que se va a mostrar. Si se ve a 240 px, va el de 480. Si hace falta un tamaño que no existe, se regenera (ver más abajo) o se usa el SVG.

### Correos
- `correo/nexvia-correo-color@2x.png` (fondo claro) y `correo/nexvia-correo-negativo@2x.png` (encabezado oscuro).
- Miden 400 px de ancho y se muestran a 200 px:
```html
<img src="https://<dominio>/branding/nexvia-correo-color@2x.png" width="200" alt="NEXVIA"
     style="display:block;border:0;width:200px;height:auto">
```

### Logo en una página web
```html
<!-- encabezado claro; alto según el diseño, el ancho sale solo -->
<img src="/branding/nexvia-horizontal-color.svg" alt="NEXVIA" style="height:32px;width:auto">
<!-- encabezado o menú oscuro -->
<img src="/branding/nexvia-horizontal-negativo.svg" alt="NEXVIA" style="height:32px;width:auto">
```
- Alto recomendado del horizontal: 28–40 px en encabezados y menús, 48–64 px en login y portadas. Mínimo 24 px.
- Hay que dejar libre alrededor un espacio igual al alto del ala superior: más o menos la mitad del alto del avión.
- Si hace falta que cambie con el tema claro/oscuro, se usan dos `<img>` o un `<picture>` con `prefers-color-scheme`. No se le aplican filtros CSS.

### Favicon en el `<head>`
```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/branding/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/branding/apple-touch-icon.png">
<meta name="theme-color" content="#0B2A3C">
```
El manifest de una PWA usa `icon-192.png` e `icon-512.png`.

### Fuentes web
- `fuentes/Sora-variable.woff2` y `fuentes/Manrope-variable.woff2` son variables: un archivo cubre todos los pesos.
- `fuentes/nexvia-fuentes.css` trae los `@font-face`. Se copia la carpeta al proyecto, por ejemplo a `/branding/fonts/`, y se incluye ese CSS antes de `nexvia-tokens.css`.
- Licencias: `fuentes/OFL-*.txt`. Hay que copiarlas junto con las fuentes.
- Baloo 2 **no** va en `fuentes/`: no se usa para texto, solo vive dentro del logo.

### Para arrancar una pantalla nueva
1. Copiar `nexvia-tokens.css` y `fuentes/` al proyecto. Con Tailwind, además `tailwind.nexvia.js`.
2. Copiar el logo que toca según el fondo y el favicon.
3. Usar solo los tokens (sección 5) y revisar la lista de la sección 8.

### Regenerar o agregar tamaños o variantes
- **Script:** `herramientas/generar_logos.py`.
  - Dibuja el avión (medido del manual) y pasa "nexvia" en Baloo 2 Bold a trazos, con todas las letras del mismo tamaño.
  - La separación entre avión y nombre es ½ del alto del ala, y el alto de las letras es la mitad del alto del avión.
  - Las fuentes de origen están en `herramientas/fuentes-origen/`.
- **Necesita** Python con `fonttools uharfbuzz cairosvg pillow brotli`:
```bash
python3 -m venv /tmp/nx && /tmp/nx/bin/pip install fonttools uharfbuzz cairosvg pillow brotli
/tmp/nx/bin/python ~/Documents/nexvia-marca/herramientas/generar_logos.py ~/Documents/nexvia-marca/logos/oficial
```
- Para otro tamaño de PNG basta con agregarlo en `ANCHOS` dentro del script, o exportarlo desde el SVG con `cairosvg`.
- `logos/oficial/vista-previa.png` muestra todas las variantes sobre su fondo.
