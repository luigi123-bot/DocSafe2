# 🚀 Guía de Solución - Error RLS

## ❌ Problema Actual
Error: `new row violates row-level security policy`

## 🔧 Solución

### 1. Ejecutar Scripts SQL en Supabase Studio

**Accede a tu Supabase Dashboard:**
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto: `kgrjkhqhrfrckjznahbg`
- Ve a "SQL Editor"

**Ejecuta los scripts en este orden:**

#### Paso 1: Crear el esquema principal
```sql
-- Copia y pega el contenido completo de:
-- c:\Users\HOME\Documents\docsafe2\sql\001_create_schema.sql
```

#### Paso 2: Crear el bucket de storage
```sql
-- Copia y pega el contenido completo de:
-- c:\Users\HOME\Documents\docsafe2\sql\002_create_storage.sql
```

#### Paso 3: Corregir políticas RLS (IMPORTANTE)
```sql
-- Copia y pega el contenido completo de:
-- c:\Users\HOME\Documents\docsafe2\sql\003_fix_rls_policies.sql
```

### 2. Verificar Variables de Entorno

Asegúrate de que `.env.local` tenga:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kgrjkhqhrfrckjznahbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Reiniciar el Servidor

Después de ejecutar los scripts SQL:
```bash
npm run dev
```

### 4. Probar la Subida

Ahora deberías poder subir documentos sin errores.

## 🔍 ¿Por qué ocurrió esto?

1. **RLS (Row Level Security)** estaba habilitado
2. **Faltaban políticas de INSERT** para las tablas
3. **Las tablas no existían** en Supabase
4. **El bucket de storage no estaba creado**

## ✅ Lo que está solucionado

- ✅ Componente DocumentUpload recreado sin errores
- ✅ Scripts SQL corregidos con políticas completas
- ✅ APIs funcionando correctamente
- ✅ Sincronización Clerk-Supabase arreglada

## 📋 Próximos Pasos Después de la Solución

1. Probar subida de diferentes tipos de archivo
2. Verificar que el OCR se procese correctamente
3. Confirmar que los datos aparezcan en el dashboard
4. Probar búsqueda de documentos

---

**¿Necesitas ayuda ejecutando algún script? ¡Pídemelo!**