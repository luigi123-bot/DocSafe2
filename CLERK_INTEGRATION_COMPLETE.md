# 🔐 Conexión Real con Clerk - Gestión de Usuarios

## ✅ Sistema Implementado

Hemos implementado la conexión **real** con Clerk para crear usuarios y asignar roles. El sistema ahora:

- ✅ **Crea usuarios reales** en Clerk con credenciales
- ✅ **Asigna roles** usando metadata público de Clerk
- ✅ **Valida permisos** del administrador antes de crear usuarios
- ✅ **Maneja errores** específicos de Clerk
- ✅ **Genera contraseñas seguras** automáticamente
- ✅ **Interfaz de administración** completamente funcional

## 🛠️ Configuración Requerida

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env.local`:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 2. Configurar Webhook de Clerk (Opcional)

Para sincronizar usuarios en tiempo real, puedes configurar un webhook:

```typescript
// src/app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    console.log('User created:', evt.data);
  }

  return NextResponse.json({ message: 'Webhook received' });
}
```

## 🚀 Flujo Completo de Creación de Usuario

### 1. Verificación de Permisos
```typescript
// Verifica que el usuario actual sea admin
const currentUser = await clerk.users.getUser(userId);
const currentUserRole = currentUser.publicMetadata?.role;

if (currentUserRole !== 'admin') {
  return error('Sin permisos suficientes');
}
```

### 2. Creación en Clerk
```typescript
// Crea usuario real en Clerk
const newUser = await clerk.users.createUser({
  firstName,
  lastName,
  emailAddress: [email],
  password: generatedPassword,
  publicMetadata: {
    role: selectedRole // 'admin' o 'empleado'
  }
});
```

### 3. Respuesta y Confirmación
```typescript
// Retorna información del usuario creado
return {
  success: true,
  user: {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.emailAddresses[0]?.emailAddress,
    role: newUser.publicMetadata?.role,
    createdAt: newUser.createdAt
  }
};
```

## 📋 Estructura de Archivos Implementados

### 1. API Route
```
src/app/api/admin/create-user/route.ts
```
- ✅ Endpoint POST para crear usuarios
- ✅ Validación de permisos de administrador
- ✅ Integración real con Clerk Backend API
- ✅ Manejo de errores específicos
- ✅ TypeScript con tipos seguros

### 2. Modal de Gestión
```
src/components/UserManagementModal.tsx
```
- ✅ Formulario completo con validación
- ✅ Llamada real a la API
- ✅ Manejo de estados (loading, success, error)
- ✅ Muestra información del usuario creado
- ✅ Integración con generación de contraseñas

### 3. Panel de Administración
```
src/app/admin/page.tsx
```
- ✅ Página protegida solo para administradores
- ✅ Botón "Crear Usuario" integrado
- ✅ Estadísticas y alertas del sistema

## 🔧 Funcionalidades Técnicas

### Generación de Contraseñas
```typescript
const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
```

### Validación de Roles
```typescript
// Solo acepta roles válidos
if (!['admin', 'empleado'].includes(role)) {
  return error('Rol inválido');
}

// Almacena en metadata público para acceso rápido
publicMetadata: {
  role: role
}
```

### Manejo de Errores Clerk
```typescript
// Detecta si el email ya existe
if (clerkError.status === 422) {
  return 'El email ya está en uso o los datos son inválidos';
}

// Detecta datos inválidos
if (clerkError.status === 400) {
  return 'Datos de usuario inválidos';
}
```

## 🎯 Pruebas del Sistema

### 1. Crear Usuario Admin
1. Inicia sesión como administrador
2. Ve a `/admin`
3. Haz clic en "Crear Usuario"
4. Completa el formulario con rol "admin"
5. Verifica que se crea en Clerk Dashboard

### 2. Crear Usuario Empleado
1. Repite el proceso con rol "empleado"
2. Verifica que tiene permisos limitados
3. Confirma que no puede acceder a `/admin`

### 3. Verificar Roles
1. Ve al Dashboard de Clerk
2. Busca el usuario creado
3. Verifica en "Metadata" → "Public" que tiene el rol correcto:
   ```json
   {
     "role": "admin" // o "empleado"
   }
   ```

## 📧 Próximos Pasos: Integración de Email

### 1. Instalar Servicio de Email
```bash
# Opción 1: SendGrid
npm install @sendgrid/mail

# Opción 2: Nodemailer
npm install nodemailer
npm install @types/nodemailer

# Opción 3: Resend
npm install resend
```

### 2. Crear Función de Envío
```typescript
// src/lib/email.ts
export async function sendWelcomeEmail(
  email: string, 
  password: string, 
  role: string
) {
  // Implementar envío de email con credenciales
}
```

### 3. Integrar en Modal
```typescript
// En UserManagementModal.tsx
if (formData.sendCredentials) {
  await sendWelcomeEmail(formData.email, tempPassword, formData.role);
}
```

## 🎉 Estado Actual

✅ **COMPLETADO**: Conexión real con Clerk  
✅ **COMPLETADO**: Creación de usuarios con roles  
✅ **COMPLETADO**: Validación de permisos  
✅ **COMPLETADO**: Interfaz de administración  
✅ **COMPLETADO**: Manejo de errores  
✅ **COMPLETADO**: Generación de contraseñas  

🔄 **PENDIENTE**: Integración de email  
🔄 **PENDIENTE**: Lista de usuarios existentes  
🔄 **PENDIENTE**: Edición de usuarios  

¡El sistema está **completamente funcional** y crea usuarios reales en Clerk! 🚀