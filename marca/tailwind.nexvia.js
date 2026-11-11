/** NEXVIA — preset de Tailwind (propuesta v1). Mismos valores que nexvia-tokens.css.
 *  Uso en tailwind.config.js:  presets: [require('./tailwind.nexvia.js')]
 *  "primary" queda como alias de Petróleo para que las vistas actuales no se rompan
 *  mientras se migran a los nombres nuevos (accion, marca, texto-3, neutro-200…). */
const neutro = {
    950: '#0B2A3C', 900: '#183140', 800: '#2F4859', 700: '#4D5D68', 600: '#637480',
    500: '#7B8C98', 400: '#9CA6AD', 300: '#BCC6CD', 200: '#D5E0E7', 100: '#EBF1F5', 50: '#F5F8F7',
};

module.exports = {
    theme: {
        extend: {
            colors: {
                senal: '#14A3A8', petroleo: '#0E6E7A', noche: '#0B2A3C', menta: '#4FD1A5',
                bruma: '#DDF3EF', papel: '#F5F8F7', coral: '#FF6B3D',
                neutro,
                marca: '#14A3A8',
                accion: { DEFAULT: '#0E6E7A', hover: '#0A5862' },
                texto: { DEFAULT: '#0B2A3C', 2: '#4D5D68', 3: '#637480' },
                borde: '#D5E0E7',
                fondo: '#F5F8F7',
                exito: { DEFAULT: '#0F7A5C', fondo: '#E3F6EF' },
                aviso: { DEFAULT: '#9A5B00', fondo: '#FFF3DC' },
                error: { DEFAULT: '#C0392B', fondo: '#FDECEA' },
                info: { DEFAULT: '#0E6E7A', fondo: '#DDF3EF' },
                whatsapp: '#25D366',
                // Compatibilidad con las vistas actuales (se retira al terminar la migración)
                primary: { DEFAULT: '#0E6E7A', dark: '#0A5862', light: '#14A3A8' },
            },
            fontFamily: {
                titulos: ['Sora', '"Segoe UI"', 'Arial', 'sans-serif'],
                texto: ['Manrope', '"Segoe UI"', 'Arial', 'sans-serif'],
                sans: ['Manrope', '"Segoe UI"', 'Arial', 'sans-serif'],
            },
            borderRadius: { pildora: '999px', grande: '20px', medio: '14px', chico: '10px' },
            boxShadow: {
                nx: '0 1px 2px rgba(11,42,60,.06), 0 4px 16px rgba(11,42,60,.06)',
                'nx-elevada': '0 12px 32px -8px rgba(11,42,60,.18)',
            },
        },
    },
};
