# OpenDict

<img width="1267" height="943" alt="image" src="https://github.com/user-attachments/assets/05246c78-23c1-48cc-abfb-d458679c6ce0" />

<img width="1267" height="943" alt="image" src="https://github.com/user-attachments/assets/5b16f003-928a-456d-91d7-88b50a6f2b97" />



OpenDict es una app web (Next.js) para buscar definiciones en español, guardarlas localmente y aprender jugando con un minijuego de opción múltiple basado en tu historial.

## Características
- Búsqueda con caché local en `localStorage` y recientes/historial.
- API interna que simplifica la respuesta de la RAE a un DTO propio.
- Minijuego: elige la definición correcta entre varias opciones.
- PWA básica: manifiesto + service worker para cachear recursos.
- Imagen Docker lista para despliegue (standalone) y guía para Cloud Run.

## Pila técnica
- Next.js 15 (App Router) + React 19.
- Tailwind CSS.
- TypeScript.
- Docker (multi-stage, salida `standalone`).

## Estructura del proyecto
- `app/` — Rutas del App Router (`layout.tsx`, `page.tsx`, `play/page.tsx`, `api/define`).
- `components/` — UI (formulario de búsqueda, navbar, CTA, etc.).
- `lib/types/rae.ts` — Tipos de la respuesta RAE y DTOs internos.
- `lib/client/store.ts` — Utilidades de `localStorage` (recientes e historial).
- `public/` — `sw.js` (service worker), `manifest.webmanifest`.
- `Dockerfile` — Build multi-stage para producción.
- `next.config.ts` — `output: 'standalone'` para ejecutar con `server.js`.

## Flujo de datos
1. El usuario busca en `SearchForm`.
2. Se intenta leer del caché local (historial) y se muestra si existe.
3. Se llama a `GET /api/define?q=<palabra>`:
   - Hace fetch al upstream RAE (`RAE_API_BASE` o `https://rae-api.com/api/words/<q>`),
   - Simplifica la respuesta a `DictEntryDTO` (sentidos, sinónimos, ejemplos, etimología y una muestra de conjugaciones),
   - Devuelve JSON al cliente.
4. Se guarda en historial (`opendict:entries`) y se emite el evento `opendict:entries-changed`.
5. `NavBar` y `PlayCTA` escuchan el evento y actualizan el contador y el botón “Jugar”.

## Requisitos
- Node.js 20+ y npm 10+.
- Opcional: Docker 24+.

## Desarrollo local
- Instalar dependencias: `npm install`
- Ejecutar en desarrollo: `npm run dev`
- Abrir: `http://localhost:3000`

Variables de entorno (opcional):
- `RAE_API_BASE`: URL base alternativa del upstream. Por defecto: `https://rae-api.com/api/words`.

## Build de producción (sin Docker)
- `npm run build`
- `npm start` (Next.js servirá en `PORT` o 3000 por defecto)

## Docker
Build y ejecución local:
- Construir: `docker build -t opendict .`
- Ejecutar: `docker run --rm -p 3000:3000 opendict`

Notas:
- La imagen de runtime usa Node 20 alpine, usuario no-root y copia la salida `standalone`.
- La variable `PORT` se define en el contenedor en `3000`. Puedes cambiarla con `-e PORT=8080` si lo necesitas.

## Despliegue en Cloud Run (Artifact Registry + Cloud Build)
Pre-requisitos (CLI):
- Instalar gcloud (Ubuntu con snap): `sudo snap install google-cloud-cli --classic`
- Iniciar y autenticar:
  - `gcloud init`
  - `gcloud auth login`
  - `gcloud config set project <PROJECT_ID>`
  - (Opc.) `gcloud config set run/region us-central1`
- Habilitar APIs: `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`

Crear repositorio (una sola vez):
- `gcloud artifacts repositories create opendict --repository-format=docker --location=us-central1 --description="OpenDict"`
- `gcloud auth configure-docker us-central1-docker.pkg.dev`

Build + push (Cloud Build):
- `gcloud builds submit --tag us-central1-docker.pkg.dev/<PROJECT_ID>/opendict/opendict:1.0.0 .`

Deploy a Cloud Run (público):
- Opción A — Mantener puerto 3000 de la imagen:
  - `gcloud run deploy opendict --image us-central1-docker.pkg.dev/<PROJECT_ID>/opendict/opendict:1.0.0 --region us-central1 --platform managed --allow-unauthenticated --port 3000 --memory 512Mi --cpu 1 --max-instances 10 --set-env-vars NEXT_TELEMETRY_DISABLED=1`
- Opción B — Usar puerto por defecto 8080:
  - Cambia/elimina `ENV PORT=3000` del `Dockerfile`, reconstruye y despliega sin `--port`.

Verificar y logs:
- URL del servicio: `gcloud run services describe opendict --region us-central1 --format='value(status.url)'`
- Logs: `gcloud run services logs read opendict --region us-central1 --stream`

## PWA y caché
- `public/sw.js` actualmente intenta cachear GETs. Para evitar datos obsoletos:
  - Evita cachear `/api` y documentos HTML;
  - Usa cache-first solo para `/_next/static` y assets.
- Si ves contenido desactualizado, borra el SW desde las herramientas del navegador y recarga.

## Solución de problemas
- Warning de `NODE_ENV` en build: asegúrate de no fijar `NODE_ENV=development` en producción.
- Botón “Buscar” deshabilitado tras escribir: recarga vaciando caché si cambiaste `<head>` o el SW; la app ya usa Metadata API para evitar mismatches.
- Tipos de `examples` faltantes: actualizados en `lib/types/rae.ts` y mapeados en `api/define`.

## Roadmap (ideas)
- Ampliar conjugaciones y sentidos (no solo el primero ni solo 3).
- Íconos del PWA y metadatos SEO/OG.
- Mejorar estrategias de caché en el SW por ruta.
- Pruebas unitarias para `simplify()` y utilidades de `store`.

