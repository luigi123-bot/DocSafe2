import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { syncUserToSupabase, logUserActivity } from '~/lib/userSync';

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'empleado';
  password: string;
}

interface ClerkError {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
}

interface ClerkAPIError {
  status?: number;
  code?: string;
  errors?: ClerkError[];
  message?: string;
  longMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado y es admin
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la instancia del cliente
    const clerk = await clerkClient();

    // Verificar que el usuario actual es admin
    const currentUser = await clerk.users.getUser(userId);
    const currentUserRole = currentUser.publicMetadata?.role;
    
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Obtener datos del body
    const body = await request.json() as CreateUserRequest;
    const { firstName, lastName, email, role, password } = body;

    // Validar datos requeridos
    if (!firstName || !lastName || !email || !role || !password) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }

    // Validar rol
    if (!['admin', 'empleado'].includes(role)) {
      return NextResponse.json({ 
        error: 'Rol inválido' 
      }, { status: 400 });
    }

    // Verificar si ya existe un usuario con este email (más exhaustivo)
    try {
      console.log('Verificando si existe usuario con email:', email);
      
      // Buscar por email exacto
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [email.trim().toLowerCase()]
      });
      
      console.log('Usuarios encontrados:', existingUsers.data?.length || 0);
      
      if (existingUsers.data && existingUsers.data.length > 0) {
        console.log('Usuario existente encontrado:', existingUsers.data[0]?.id);
        return NextResponse.json({
          error: 'Ya existe un usuario registrado con este email'
        }, { status: 409 });
      }
      
      // También buscar por email en todas las variantes
      const allUsers = await clerk.users.getUserList({
        limit: 500 // Buscar en más usuarios
      });
      
      const duplicateUser = allUsers.data?.find(user => 
        user.emailAddresses.some(emailAddr => 
          emailAddr.emailAddress?.toLowerCase() === email.trim().toLowerCase()
        )
      );
      
      if (duplicateUser) {
        console.log('Usuario duplicado encontrado en búsqueda amplia:', duplicateUser.id);
        return NextResponse.json({
          error: 'Este email ya está registrado en el sistema'
        }, { status: 409 });
      }
      
      console.log('Email disponible, procediendo con la creación');
      
    } catch (searchError) {
      console.log('Error buscando usuario existente (continuando):', searchError);
    }

    // Crear usuario en Clerk (con todos los datos requeridos)
    try {
      console.log('Creando usuario con datos completos:', { firstName, lastName, email });
      
      // Generar un username único válido (solo letras, números, - y _)
      const emailPrefix: string = (email.split('@')[0] ?? email).replace(/[^a-zA-Z0-9]/g, '_'); // Reemplazar caracteres inválidos con _
      const timestamp = Date.now().toString().slice(-6);
      const username = `${emailPrefix}_${timestamp}`;
      
      console.log('Username generado:', username);
      
      const newUser = await clerk.users.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: [email.trim().toLowerCase()],
        username: username, // Agregar username requerido
        password: password  // Agregar contraseña requerida
      });

      console.log('Usuario creado exitosamente:', newUser.id);

      // Asignar el rol
      try {
        await clerk.users.updateUser(newUser.id, {
          publicMetadata: {
            role: role
          }
        });
        console.log('Rol asignado exitosamente');
      } catch (updateError) {
        console.warn('Error asignando rol:', updateError);
      }

      // Sincronizar con Supabase
      try {
        await syncUserToSupabase({
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailAddresses: newUser.emailAddresses,
          username: newUser.username,
          imageUrl: newUser.imageUrl,
          createdAt: newUser.createdAt,
          lastSignInAt: newUser.lastSignInAt,
          publicMetadata: { role }
        });
        console.log('✅ Usuario sincronizado con Supabase');
        
        // Registrar actividad
        await logUserActivity(
          newUser.id, 
          'user_created_by_admin', 
          { createdBy: currentUser.id, role },
          request.headers.get('x-forwarded-for') ?? undefined,
          request.headers.get('user-agent') ?? undefined
        );
      } catch (syncError) {
        console.warn('⚠️ Error sincronizando con Supabase (continuando):', syncError);
        // No fallar la creación si falla la sincronización
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.emailAddresses[0]?.emailAddress,
          username: newUser.username,
          role: role,
          createdAt: newUser.createdAt
        }
      }, { status: 201 });

    } catch (clerkError: unknown) {
      if (clerkError && typeof clerkError === 'object' && 'status' in clerkError) {
        const error = clerkError as ClerkAPIError;
        console.error('Error detallado de Clerk:', {
          status: error.status,
          code: error.code,
          errors: error.errors,
          message: error.message,
          longMessage: error.longMessage
        });
        
        // Detallar específicamente el array de errores
        if (error.errors && Array.isArray(error.errors)) {
          console.error('Errores específicos de Clerk:');
          error.errors.forEach((err, index) => {
            console.error(`Error ${index + 1}:`, JSON.stringify(err, null, 2));
          });
          
          // Verificar si es un error de email duplicado
          const emailError = error.errors.find(err => 
            err.code === 'form_identifier_exists' || 
            (err.message?.includes('email') ?? false) || 
            (err.message?.includes('already exists') ?? false)
          );
          
          if (emailError) {
            return NextResponse.json({ 
              error: 'Este email ya está registrado en Clerk. Por favor usa un email diferente.' 
            }, { status: 422 });
          }
        }
      } else {
        console.error('Error no identificado:', clerkError);
      }
      
      // Re-lanzar el error para que lo maneje el catch principal
      throw clerkError;
    }

  } catch (error: unknown) {
    console.error('Error creando usuario:', error);
    
    // Manejar errores específicos de Clerk
    if (error && typeof error === 'object' && 'status' in error) {
      const clerkError = error as { status: number };
      
      if (clerkError.status === 422) {
        return NextResponse.json({ 
          error: 'El email ya está en uso o los datos son inválidos' 
        }, { status: 422 });
      }
      
      if (clerkError.status === 400) {
        return NextResponse.json({ 
          error: 'Datos de usuario inválidos' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}