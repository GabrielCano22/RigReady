# RigReady

Interfaz web de RigReady: una SPA construida en **React 18 + TypeScript + Vite + Tailwind CSS v4**. Permite a los gamers ingresar las especificaciones de su PC, buscar un videojuego en Steam, y ver al instante si su equipo está listo — con veredicto por tier (Mínimo / Recomendado / Ultra), detección de cuellos de botella y un diseño oscuro, kinético y unapologetically gamer.

Frontend del motor [RigReady-Backend](https://github.com/GabrielCano22/RigReady-Backend).

---

## Tabla de contenido

- [Stack técnico](#stack-técnico)
- [Páginas](#páginas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura de componentes](#arquitectura-de-componentes)
- [Sistema de animaciones](#sistema-de-animaciones)
- [Internacionalización](#internacionalización)
- [Cliente HTTP](#cliente-http)
- [Estilos y sistema de diseño](#estilos-y-sistema-de-diseño)
- [Variables de entorno](#variables-de-entorno)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts](#scripts)
- [Flujo de trabajo Git](#flujo-de-trabajo-git)

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 (`@theme inline`) |
| Componentes UI | shadcn/ui + Radix primitives |
| Animaciones | framer-motion + utilidades scrollxui |
| Ruteo | react-router-dom |
| i18n | react-i18next (ES / EN) |
| Iconos | lucide-react |

---

## Páginas

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `pages/Landing.tsx` | Aterrizaje con hero kinético, meteoros cyan y carrusel de logos de confianza. |
| `/evaluator` | `pages/Evaluator.tsx` | Formulario principal: form factor, CPU, GPU, RAM y búsqueda de juego en Steam → renderiza veredicto. |
| `/about` | `pages/About.tsx` | Hero con scan-sweep, tres pasos del flujo, cuatro valores del proyecto y CTA hacia el evaluador. |

---

## Estructura del proyecto

```
RigReady/
├── public/                       # Activos estáticos (favicon, etc.)
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Layout + router (Header/Footer + rutas)
│   ├── index.css                 # Tailwind v4 + tokens + utilidades globales
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Evaluator.tsx
│   │   └── About.tsx
│   ├── components/
│   │   ├── Combobox.tsx          # Selector buscable de CPU/GPU
│   │   ├── VerdictCard.tsx       # Render del resultado de evaluación
│   │   ├── Footer.tsx
│   │   ├── Logo.tsx
│   │   └── ui/
│   │       ├── header-1.tsx      # Header sticky + menú móvil portalizado
│   │       ├── hero-1.tsx        # Hero con meteoros + stagger chars
│   │       ├── logos-section.tsx # Trust strip de logos
│   │       ├── background-meteors.tsx
│   │       ├── aurora-dots.tsx
│   │       ├── card-tilt.tsx
│   │       ├── reveal-text.tsx
│   │       ├── spotlight-card.tsx
│   │       ├── stagger-chars.tsx
│   │       ├── infinite-slider.tsx
│   │       ├── menu-toggle-icon.tsx
│   │       ├── use-scroll.ts
│   │       └── (primitivas shadcn: button, input, select, card, alert, ...)
│   ├── lib/
│   │   ├── api.ts                # Cliente HTTP tipado del backend
│   │   ├── types.ts              # Tipos del dominio compartidos
│   │   └── utils.ts              # Helper cn (clsx + tailwind-merge)
│   └── i18n/
│       ├── index.ts              # Configuración i18next
│       └── locales/
│           ├── es.json
│           └── en.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── .env.example
```

---

## Arquitectura de componentes

La UI se organiza en cuatro capas:

1. **Primitivas shadcn** (`components/ui/{button,input,card,select,...}`): wrappers tipados sobre Radix con estilos Tailwind.
2. **Componentes de efecto** (`components/ui/{hero-1,background-meteors,aurora-dots,card-tilt,reveal-text,spotlight-card,stagger-chars,infinite-slider,logos-section}`): animaciones framer-motion listas para componer.
3. **Componentes compuestos** (`components/{Combobox,VerdictCard,Footer,Logo}`): unidades de negocio reutilizables.
4. **Páginas** (`pages/`): orquestan los bloques anteriores y gestionan estado de página.

El `Evaluator` descompone su lógica en dos hooks dedicados: `useHardwareCatalog(formFactor)` y `useGameSearch()`. Cada uno encapsula su propio ciclo de fetch + cancelación + error, dejando la página lo más declarativa posible.

---

## Sistema de animaciones

Animaciones propias inspiradas en scrollxui.dev, todas respetan `prefers-reduced-motion`:

| Componente | Uso |
|---|---|
| `BackgroundMeteors` | Grid oscuro + beams cyan cayendo en columnas espaciadas (sin clumping). Fondo del hero. |
| `StaggerChars` | Flip per-char en el headline del hero; auto-reproducción en dispositivos touch. |
| `AuroraDots` | Campo de partículas cyan con auto-hover orbital (canvas 2D, pausa vía IntersectionObserver). |
| `CardTilt` + `CardTiltContent` | Parallax 3D con cursor via motion springs; publicado por contexto. |
| `RevealText` | Cover-box que se retira para revelar texto al entrar en viewport (palabras staggered en modo `auto`). |
| `SpotlightCard` | Glow radial cyan que sigue al cursor dentro del card. |
| `InfiniteSlider` | Carrusel horizontal infinito (usado en el trust strip de logos). |

---

## Internacionalización

`react-i18next` con detección de idioma basada en `localStorage` (claves `i18nextLng` y `rigready_lang`). Soporte para **español** (default) e **inglés**. El switcher vive en el header, tanto desktop como mobile menu.

Archivos de diccionario: `src/i18n/locales/{es,en}.json`. Todas las cadenas de UI pasan por `t("path.to.key")`.

---

## Cliente HTTP

`src/lib/api.ts` expone funciones tipadas que envuelven `fetch` contra el backend:

- `getCpus(formFactor?)` → `GET /api/cpus`
- `getGpus(formFactor?)` → `GET /api/gpus`
- `searchRawgGames(query)` → `GET /api/steam/search`
- `evaluateRawg(payload)` → `POST /api/evaluate/rawg`

Errores tipados (ej. `RawgUnavailableError`) se re-lanzan para que el consumidor decida cómo degradar la UI.

Base URL configurable vía `VITE_API_URL`.

---

## Estilos y sistema de diseño

Tailwind CSS v4 con `@theme inline` en `src/index.css`. Highlights del sistema:

- **Dark-only**: la clase `dark` se fuerza en `<html>` al boot.
- **Tokens de color**: cyan primario (`#00d4ff` / `#00ffff`), foreground casi-blanco, background `#0a0a0a`, border tenue.
- **Tipografía**: Space Mono para acentos técnicos (labels, números, CTAs), Inter para prosa.
- **Utilidades personalizadas**:
  - `.bg-grid` — fondo de grid sutil
  - `.bg-scanlines` — textura de scanlines CRT
  - `.scan-sweep` — barrido cyan en loop
  - `.glow-cyan` — halo cyan en hover
  - `.btn-shimmer` — shimmer diagonal al pasar el cursor
  - `.text-outline-cyan` — stroke cyan en el texto
  - `.label-mono` — label uppercase tracking wide para secciones

---

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar:

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | URL base del backend RigReady-Backend. |

---

## Puesta en marcha

**Requisito previo**: tener corriendo [RigReady-Backend](https://github.com/GabrielCano22/RigReady-Backend) en el puerto configurado.

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Desarrollo (Vite con HMR)
npm run dev

# 4. Build productivo
npm run build

# 5. Preview del build
npm run preview
```

App disponible en `http://localhost:5173`.

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Vite dev server con HMR. |
| `npm run build` | Typecheck + build de producción a `dist/`. |
| `npm run preview` | Sirve el build para verificación local. |
| `npm run lint` | Ejecuta ESLint sobre el código. |
| `npx tsc --noEmit` | Typecheck puro, sin emitir archivos. |

---

## Flujo de trabajo Git

Ramas del repositorio:

- `main` — estable, solo recibe merges desde `prod`.
- `prod` — producción.
- `qa` — rama de QA / staging.
- `dev` — integración. **Toda feature parte de aquí.**
- `feat/<accion>` — ramas de feature; PR con título `feat: <accion>` contra `dev`.

Convenciones de commit: `feat: <descripción>` en español, una línea de título + cuerpo explicativo cuando aplique.

---

## Autor

Proyecto desarrollado por [Gabriel Cano](https://github.com/GabrielCano22).
