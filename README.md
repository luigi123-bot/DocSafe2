# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## 🏗️ Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/admin/         # APIs de administración
│   ├── admin/             # Panel de administrador
│   └── components/        # Componentes de páginas
├── components/            # Componentes reutilizables
├── lib/                   # Utilidades y configuración
│   ├── supabase.ts       # Cliente de Supabase
│   └── userSync.ts       # Sincronización Clerk-Supabase
└── types/                # Definiciones de tipos TypeScript
sql/                      # Scripts de migración de base de datos
```

## 👥 Roles y Permisos

- **Admin**: Acceso completo, gestión de usuarios, configuración del sistema
- **Empleado**: Acceso a documentos, subida y edición de archivos

## 🗄️ Base de Datos

Las tablas principales incluyen:
- `users` - Usuarios sincronizados con Clerk
- `documents` - Metadatos de documentos subidos
- `ocr_results` - Resultados del procesamiento OCR
- `activities` - Log de auditoría del sistema
- `document_tags` - Etiquetas y categorización
- `shared_documents` - Compartir documentos entre usuarios

Ver `README_SUPABASE.md` para instrucciones detalladas de configuración.

## 🚀 Funcionalidades

- ✅ **Autenticación completa** con Clerk y roles
- ✅ **Panel de administración** para gestión de usuarios
- ✅ **Sincronización automática** Clerk → Supabase
- ✅ **Log de actividades** y auditoría
- 🔲 **Subida de documentos** con OCR
- 🔲 **Búsqueda inteligente** en contenido
- 🔲 **Compartir documentos** entre usuarios
- 🔲 **Dashboard con métricas** y reportes

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Linting y formato
npm run lint
npm run type-check

# Base de datos (Supabase)
# Ejecutar migraciones en Supabase Studio > SQL Editor
```

## 📝 Notas de Desarrollo

- Usa `getSupabaseClient()` para operaciones del cliente
- Usa `getSupabaseServerClient()` para operaciones server-side con privilegios
- La sincronización Clerk-Supabase es automática al crear/actualizar usuarios
- Los logs de actividad se registran automáticamente para auditoría
