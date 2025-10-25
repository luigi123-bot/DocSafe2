import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username: string | null;
  role: string;
  createdAt: number;
  lastSignInAt: number | null;
  imageUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /admin/users llamada');
    
    // Verificar que el usuario está autenticado y es admin
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('✅ Usuario autenticado:', userId);

    // Obtener la instancia del cliente
    const clerk = await clerkClient();

    // Verificar que el usuario actual es admin
    const currentUser = await clerk.users.getUser(userId);
    const currentUserRole = currentUser.publicMetadata?.role;
    
    console.log('👤 Rol del usuario actual:', currentUserRole);
    
    if (currentUserRole !== 'admin') {
      console.log('❌ Usuario sin permisos suficientes');
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const search = searchParams.get('search') ?? '';

    console.log('📊 Parámetros de consulta:', { page, limit, search });

    // Obtener lista de usuarios
    console.log('🔄 Obteniendo usuarios de Clerk...');
    const usersResponse = await clerk.users.getUserList({
      limit: limit,
      offset: (page - 1) * limit,
      query: search !== '' ? search : undefined,
      orderBy: '-created_at'
    });

    console.log('📈 Respuesta de Clerk:', {
      totalCount: usersResponse.totalCount,
      dataLength: usersResponse.data?.length,
      hasData: !!usersResponse.data
    });

    // Formatear datos de usuarios
    const users: User[] = usersResponse.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      username: user.username,
      role: (user.publicMetadata?.role as string) ?? 'empleado',
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      imageUrl: user.imageUrl
    }));

    console.log('✅ Usuarios formateados:', users.length);
    console.log('👥 Ejemplo de usuario:', users[0] ?? 'No hay usuarios');

    const response = {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: usersResponse.totalCount,
        totalPages: Math.ceil(usersResponse.totalCount / limit)
      }
    };

    console.log('📤 Enviando respuesta:', {
      success: response.success,
      usersCount: response.users.length,
      pagination: response.pagination
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}