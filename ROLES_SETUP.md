# Configuración de Roles y Permisos en DocSafe

## Sistema de Autenticación y Autorización

DocSafe utiliza **Clerk** para la autenticación y un sistema de roles personalizado para la autorización.

### Roles Disponibles

1. **admin** (Administrador)
   - ✅ Ver documentos
   - ✅ Subir documentos
   - ✅ Editar documentos
   - ✅ Eliminar documentos
   - ✅ Gestionar usuarios
   - ✅ Ver analytics/dashboard
   - ✅ Exportar documentos

2. **empleado** (Empleado)
   - ✅ Ver documentos
   - ✅ Subir documentos
   - ✅ Editar documentos
   - ❌ Eliminar documentos
   - ❌ Gestionar usuarios
   - ❌ Ver analytics/dashboard
   - ❌ Exportar documentos

### Configuración de Roles en Clerk

Para asignar roles a los usuarios, sigue estos pasos:

#### 1. Acceder al Dashboard de Clerk
1. Ve a [https://clerk.com/](https://clerk.com/)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto DocSafe

#### 2. Configurar los Metadatos del Usuario
1. En el dashboard de Clerk, ve a **Users**
2. Selecciona el usuario al que quieres asignar un rol
3. Ve a la pestaña **Metadata**
4. En la sección **Public metadata**, agrega:
   ```json
   {
     "role": "admin"
   }
   ```
   o
   ```json
   {
     "role": "empleado"
   }
   ```

#### 3. Alternativamente, usando el API de Clerk
Puedes usar el API de Clerk para configurar roles programáticamente:

```javascript
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: "admin" // o "empleado"
  }
});
```

### Configuración por Defecto

- **Usuarios nuevos**: Por defecto se asignan como `empleado`
- **Sin rol**: Los usuarios sin rol definido no tendrán acceso a ninguna funcionalidad

### Protección de Rutas

El sistema utiliza:

1. **ProtectedRoute**: Componente que protege rutas completas
2. **useAuth**: Hook personalizado que proporciona información del usuario y permisos
3. **Verificación de permisos**: Cada funcionalidad verifica permisos específicos

### Ejemplo de Uso

```tsx
import { useAuth } from '~/hooks/useAuth';
import ProtectedRoute from '~/components/ProtectedRoute';

function MyComponent() {
  const { permissions, role, isAdmin } = useAuth();

  return (
    <ProtectedRoute requiredPermission="canViewDocuments">
      {permissions.canDeleteDocuments && (
        <button>Eliminar Documento</button>
      )}
    </ProtectedRoute>
  );
}
```

### Seguridad

- ⚠️ **Importante**: Los permisos se validan tanto en el frontend como en el backend
- ⚠️ **Nunca confíes solo en la validación del frontend**
- ✅ Implementa validación de permisos en todas las API routes
- ✅ Los roles se almacenan en `publicMetadata` de Clerk para fácil acceso

### Troubleshooting

1. **El usuario no ve ningún contenido**:
   - Verificar que el usuario esté autenticado
   - Verificar que tenga un rol asignado en Clerk
   - Verificar que el rol sea válido (`admin` o `empleado`)

2. **Los permisos no se actualizan**:
   - Los cambios en Clerk pueden tardar unos minutos en reflejarse
   - Hacer logout/login para forzar la actualización
   - Verificar que el metadata se guardó correctamente en Clerk

3. **Error de tipos TypeScript**:
   - Asegurar que los tipos están importados correctamente
   - Verificar que useAuth está importado desde la ruta correcta