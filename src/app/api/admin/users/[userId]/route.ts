import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'empleado';
  password?: string;
}

interface ClerkUpdateData {
  firstName?: string;
  lastName?: string;
  password?: string;
  emailAddress?: string[];
  publicMetadata?: Record<string, unknown>;
}

// Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(currentUserId);
    const currentUserRole = currentUser.publicMetadata?.role;
    
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { userId: targetUserId } = await params;
    const user = await clerk.users.getUser(targetUserId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress ?? '',
        username: user.username,
        role: (user.publicMetadata?.role as string) || 'empleado',
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        imageUrl: user.imageUrl
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Actualizar un usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(currentUserId);
    const currentUserRole = currentUser.publicMetadata?.role;
    
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const body = await request.json() as UpdateUserRequest;
    const { firstName, lastName, email, role, password } = body;

    // Preparar datos de actualización
    const updateData: ClerkUpdateData = {};

    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (password !== undefined) updateData.password = password;

    // Actualizar email si se proporciona
    if (email !== undefined) {
      updateData.emailAddress = [email.trim().toLowerCase()];
    }

    // Actualizar metadatos del rol
    const { userId: targetUserId } = await params;
    if (role !== undefined) {
      updateData.publicMetadata = {
        ...((await clerk.users.getUser(targetUserId)).publicMetadata ?? {}),
        role
      };
    }

    console.log('Actualizando usuario:', targetUserId, 'con datos:', updateData);

    const updatedUser = await clerk.users.updateUser(targetUserId, updateData);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.emailAddresses[0]?.emailAddress ?? '',
        username: updatedUser.username,
        role: (updatedUser.publicMetadata?.role as string) || 'empleado',
        createdAt: updatedUser.createdAt,
        lastSignInAt: updatedUser.lastSignInAt,
        imageUrl: updatedUser.imageUrl
      }
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    
    if (error && typeof error === 'object' && 'status' in error) {
      const clerkError = error as { status: number };
      
      if (clerkError.status === 422) {
        return NextResponse.json({ 
          error: 'Los datos proporcionados son inválidos' 
        }, { status: 422 });
      }
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Eliminar un usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(currentUserId);
    const currentUserRole = currentUser.publicMetadata?.role;
    
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { userId: targetUserId } = await params;
    
    // Verificar que no se esté eliminando a sí mismo
    if (targetUserId === currentUserId) {
      return NextResponse.json({ 
        error: 'No puedes eliminar tu propia cuenta' 
      }, { status: 400 });
    }

    await clerk.users.deleteUser(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}