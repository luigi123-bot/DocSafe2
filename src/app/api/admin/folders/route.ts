// src/app/api/admin/folders/route.ts
// API para gestión de carpetas de documentos

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { 
  getDocumentFolders,
  createDocumentFolder,
  updateDocumentFolder,
  deleteDocumentFolder,
} from '~/lib/admin-documents';

// GET - Listar carpetas
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('📁 Obteniendo carpetas de documentos...');

    const folders = await getDocumentFolders();

    return NextResponse.json({
      success: true,
      data: folders
    });

  } catch (error) {
    console.error('❌ Error en GET /api/admin/folders:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear carpeta
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as {
      name: string;
      description?: string;
      color: string;
    };

    const { name, description = '', color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nombre de carpeta requerido' }, { status: 400 });
    }

    console.log('📁 Creando nueva carpeta:', name);

    const result = await createDocumentFolder(name, description, color, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.folder
    });

  } catch (error) {
    console.error('❌ Error en POST /api/admin/folders:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar carpeta
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as {
      folder_id: string;
      name?: string;
      description?: string;
      color?: string;
    };

    const { folder_id, ...updates } = body;

    if (!folder_id) {
      return NextResponse.json({ error: 'folder_id requerido' }, { status: 400 });
    }

    console.log('✏️ Actualizando carpeta:', folder_id, updates);

    const result = await updateDocumentFolder(folder_id, updates, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error en PUT /api/admin/folders:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar carpeta
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json({ error: 'ID de carpeta requerido' }, { status: 400 });
    }

    console.log('🗑️ Eliminando carpeta:', folderId);

    const result = await deleteDocumentFolder(folderId, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error en DELETE /api/admin/folders:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}