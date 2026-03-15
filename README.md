# MedEstudia

MedEstudia es una aplicación web educativa diseñada para apoyar el estudio de estudiantes de Medicina en Cuba.  
Integra flujos de estudio preclínico y clínico con herramientas interactivas basadas en IA, en modo estrictamente educativo.

## Características

- **Flujo Preclínico**  
  Selección de asignaturas básicas (Anatomía, Histología, Fisiología, etc.) con acceso a:
  - Generador de preguntas tipo examen (MCQ)
  - Quiz rápido de 5 preguntas
  - Explicador de temas
  - Estadísticas de rendimiento locales

- **Flujo Clínico – Estudio**  
  Organización por rotaciones (Medicina Interna, Cirugía, Pediatría, Ginecología, MGI) y sistemas (Cardiovascular, Respiratorio, etc.) con las mismas herramientas de estudio adaptadas al contexto clínico.

- **Flujo Clínico – Guías**  
  Módulo de chat estructurado para explorar guías clínicas representativas en modo educativo, con:
  - Resúmenes por pasos
  - Advertencias importantes
  - Nota de fuente aclarando el carácter representativo del contenido

- **Bilingüe (ES / EN)**  
  Interfaz en español por defecto con cambio a inglés, persistente en el navegador.

- **Persistencia local (sin login)**  
  - Preferencia de idioma
  - Historial de quizzes y estadísticas
  - Historial de chat por sección (hasta 20 mensajes)
  — todo almacenado en `localStorage` del navegador.

## Tecnologías

- **Frontend**
  - React 18 + TypeScript
  - Vite
  - React Router
  - Tailwind CSS
  - shadcn/ui

- **Estado / datos**
  - React Query para estados asíncronos
  - Contextos propios para idioma y estado de la IA

- **Backend (prototipo)**
  - Endpoint `/api/ai` implementado como función serverless (compatible con Vercel)
  - Integración con proveedores de modelos de lenguaje vía API tipo OpenAI

## Instalación

Requisitos:

- Node.js 18+
- npm

Pasos:

```bash
git clone <URL_DEL_REPOSITORIO>
cd medestudia-ayuda-pro
npm install
```

## Desarrollo local

1. Configura las variables de entorno (ver más abajo).
2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible normalmente en `http://localhost:8080`.

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
DEEPSEEK_API_KEY=tu_clave_otra_api_aqui
```

En producción (por ejemplo en Vercel), las variables se configuran desde el panel de la plataforma.

## Arquitectura básica

- `src/`
  - `pages/` — Pantallas principales: Inicio, Preclínico, Clínico, Estudio Clínico, Guías Clínicas.
  - `components/` — Componentes reutilizables (Chat, MCQGenerator, QuickQuiz, TopicExplainer, etc.).
  - `contexts/` — Contextos de React (`LanguageContext`, `AIStatusContext`).
  - `lib/` — Lógica de cliente para el endpoint de IA (`aiClient.ts`) y utilidades.
- `api/`
  - `ai.ts` — Función serverless que recibe las peticiones desde el frontend y llama al proveedor de IA seleccionado.

## Estructura del proyecto

```
medestudia-ayuda-pro/
├── api/
│   └── ai.ts              # Función serverless para el endpoint de IA
├── src/
│   ├── components/        # Componentes React
│   │   ├── ChatInterface.tsx
│   │   ├── MCQGenerator.tsx
│   │   ├── QuickQuiz.tsx
│   │   ├── TopicExplainer.tsx
│   │   └── ui/            # Componentes shadcn/ui
│   ├── contexts/
│   │   ├── LanguageContext.tsx
│   │   └── AIStatusContext.tsx
│   ├── hooks/
│   │   └── useScoreTracking.ts
│   ├── lib/
│   │   ├── aiClient.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Preclinical.tsx
│   │   ├── Clinical.tsx
│   │   ├── ClinicalStudy.tsx
│   │   └── ClinicalGuidelines.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Build y despliegue

- **Compilar para producción:**
  ```bash
  npm run build
  ```

- **Previsualizar build:**
  ```bash
  npm run preview
  ```

- **Despliegue en Vercel:**  
  Conectar el repositorio a Vercel, configurar la variable `DEEPSEEK_API_KEY` (o la que use el proveedor de IA) en el panel, y desplegar. El archivo `api/ai.ts` se reconoce como función serverless.

## Uso previsto y aviso importante

MedEstudia está diseñada **exclusivamente con fines educativos**.  
No debe utilizarse para:

- Diagnosticar pacientes reales
- Indicar tratamientos
- Tomar decisiones clínicas en la práctica asistencial

Cualquier referencia a diagnósticos, tratamientos o guías debe interpretarse como **ejemplo representativo** para el estudio, y nunca como sustituto del juicio clínico profesional ni de las guías oficiales vigentes.

## Licencia y titularidad

- Autores: Abdul-Rashid Dasana Abdulai.
- Titularidad económica: Facultad de Ciencias Médicas Julio Trigo López, según registro ante CENDA.

El uso, despliegue y posibles adaptaciones de MedEstudia se realizan en el marco de acuerdos con la institución titular y la normativa cubana de derecho de autor.
