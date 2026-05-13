# Supabase — Convención Científica 2026

## 1. Proyecto en Supabase

Crea un proyecto en [Supabase](https://supabase.com) y copia:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. Tablas

En el **SQL Editor** de Supabase, ejecuta el contenido de:

`supabase/convencion_schema.sql`

## 3. Variables en local (Vite)

En la raíz del repo, archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Reinicia `npm run dev` tras cambiar env.

## 4. Vercel

Añade las mismas variables en **Project → Settings → Environment Variables** y vuelve a desplegar.

## Rutas de la app

- `/convencion` — información del evento y acceso a comisiones
- `/convencion/comision/:slug` — envío de resúmenes, listado y comentarios

Los `slug` coinciden con `src/data/convencionCommissions.ts` y con la columna `commission_slug` en `summaries`.
