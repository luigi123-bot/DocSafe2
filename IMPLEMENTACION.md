# Guía de Implementación - DocSafe con Supabase

Esta guía te llevará paso a paso para implementar tu sistema DocSafe con la base de datos real de Supabase.

## 📋 Pasos para la Implementación

### 1. Ejecutar el Schema en Supabase Studio

1. Ve a tu proyecto de Supabase: https://kgrjkhqhrfrckjznahbg.supabase.co
2. Navega a **SQL Editor** en el menú izquierdo
3. Ejecuta los siguientes archivos SQL en orden:

#### Paso 1.1: Crear el esquema principal
```sql
-- Ejecutar todo el contenido de: sql/001_create_schema.sql
```

#### Paso 1.2: Crear el almacenamiento
```sql
-- Ejecutar todo el contenido de: sql/002_create_storage.sql
```

### 2. Verificar la Base de Datos

Después de ejecutar el SQL, verifica que se crearon correctamente:

#### En Supabase Studio:
- **Database > Tables**: Deberías ver 9 tablas creadas
  - users
  - documents
  - ocr_results
  - activities
  - settings
  - document_tags
  - shared_documents
  - document_categories
  - document_extracted_fields

- **Storage**: Deberías ver el bucket "documents" creado

### 3. Configurar Variables de Entorno

Verifica que tu archivo `.env.local` contenga:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kgrjkhqhrfrckjznahbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Probar el Sistema

#### 4.1: Iniciar el servidor de desarrollo
```bash
npm run dev
```

#### 4.2: Acceder a la aplicación
- Ve a http://localhost:3000
- Inicia sesión con Clerk
- Navega a las diferentes secciones

#### 4.3: Probar la subida de documentos
1. Ve a la sección "📤 Subir Documento"
2. Arrastra un archivo PDF o imagen
3. Selecciona una categoría
4. Activa/desactiva OCR si quieres
5. Haz clic en "Subir Documento"

### 5. Verificar Funcionamiento

#### 5.1: En la aplicación
- **Dashboard**: Debe mostrar estadísticas reales (inicialmente en 0)
- **Subir**: Debe permitir subir archivos sin errores
- ****: Debe mostrar documentos subidos
- **Buscar**: Debe permitir buscar documentos

#### 5.2: En Supabase Studio
- **Database > users**: Debe aparecer tu usuario de Clerk
- **Database > documents**: Debe aparecer cualquier documento subido
- **Database > activities**: Debe mostrar las actividades realizadas
- **Storage > documents**: Debe contener los archivos subidos

## 🔧 Comandos Útiles

### Instalar dependencias si es necesario:
```bash
npm install @supabase/supabase-js
```

### Ver logs del servidor:
```bash
# Los logs aparecerán en la terminal donde ejecutaste npm run dev
```

### Reiniciar el servidor si hay cambios:
```bash
# Ctrl+C para detener, luego npm run dev
```

## ⚠️ Solución de Problemas

### Error: "No se puede conectar a Supabase"
- Verifica las variables de entorno
- Confirma que el proyecto de Supabase esté activo
- Revisa la consola del navegador para errores específicos

### Error: "Tabla no encontrada"
- Ejecuta nuevamente el SQL del schema
- Verifica que todas las tablas se crearon en Supabase Studio

### Error: "Access denied" al subir archivos
- Verifica que se ejecutó el SQL de storage (002_create_storage.sql)
- Confirma que las políticas de RLS estén activas

### Error: "User not found"
- Asegúrate de estar logueado con Clerk
- Verifica que el usuario se sincronizó con Supabase (tabla users)

## 📊 Datos de Prueba

Para probar con datos reales:

1. **Sube varios documentos** con diferentes categorías
2. **Activa OCR** en algunos para ver el procesamiento
3. **Revisa el dashboard** para ver las estadísticas actualizadas
4. **Usa la búsqueda** para encontrar documentos específicos

## 🚀 Próximos Pasos

Una vez que el sistema básico esté funcionando:

1. **Implementar OCR real** (reemplazar la simulación)
2. **Agregar más filtros** en la búsqueda
3. **Implementar compartir documentos** entre usuarios
4. **Agregar notificaciones** para el procesamiento
5. **Optimizar el rendimiento** para grandes volúmenes

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de la consola del navegador
2. Verifica los logs del servidor en la terminal
3. Confirma que Supabase esté respondiendo
4. Verifica que Clerk esté funcionando correctamente

¡El sistema está listo para funcionar con datos reales! 🎉