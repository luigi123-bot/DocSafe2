# Migraciones y configuración para Supabase (DocSafe)

Este archivo incluye instrucciones rápidas para crear las tablas iniciales en Supabase y cómo conectar desde la aplicación Next.js.

1) Ejecutar el script SQL

- Abre tu proyecto en Supabase Studio -> SQL Editor.
- Crea una nueva consulta y pega el contenido de `sql/001_create_schema.sql`.
- Ejecuta la consulta. Esto creará las tablas principales: `users`, `documents`, `ocr_results`, `document_tags`, `shared_documents`, `activities`, `settings`, `document_extracted_fields`.

2) Variables de entorno

Agrega estas variables a tu `.env.local` o al Dashboard de Supabase (para funciones/server):

- NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (solo para operaciones server-side que lo requieran)

3) Dependencias

Instala el cliente de Supabase en el proyecto:

npm install @supabase/supabase-js

4) Helper de conexión

Se agregó `src/lib/supabase.ts` con una función `getSupabaseClient()` que inicializa el cliente usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

5) Consideraciones

- Para operaciones sensibles (crear usuarios, roles, modificar datos masivos) usa la `SERVICE_ROLE_KEY` desde el servidor y nunca la expongas en el cliente.
- Si usas Storage (buckets) en Supabase, crea un bucket, configura políticas y guarda `storage_path` en la tabla `documents`.
- Revisa y adapta restricciones/lengths según tus necesidades (p. ej. campos de texto largos, índices adicionales).

6) Próximos pasos recomendados

- Implementar migraciones con una herramienta (pg-migrate, sqitch o carpeta `sql/` versionada) si harás cambios frecuentes.
- Crear scripts de seed para datos de ejemplo (admins, roles).
