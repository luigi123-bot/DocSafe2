// src/app/api/admin/documents/route.ts
// API para gestión administrativa de documentos

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { 
  getAllDocumentsAdmin, 
  updateDocumentAdmin,
  deleteDocumentAdmin,
  type DocumentFilter 
} from '~/lib/admin-documents';

// GET - Listar documentos con filtros
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Verificar que el usuario sea admin
    // Por ahora permitimos a todos los usuarios autenticados

    const { searchParams } = new URL(request.url);
    
    const filters: DocumentFilter = {
      status: searchParams.get('status')?.split(',').filter(Boolean) ?? [],
      category: searchParams.get('category')?.split(',').filter(Boolean) ?? [],
      folder_id: searchParams.get('folder_id') ?? undefined, // Ahora disponible con la nueva relación
      owner_id: searchParams.get('owner_id') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '20')
    };

    console.log('📋 Obteniendo documentos admin con filtros:', filters);

    const result = await getAllDocumentsAdmin(filters);

    return NextResponse.json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        pages: result.pages,
        current_page: filters.page,
        per_page: filters.limit
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/admin/documents:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar documento
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as {
      document_id: string;
      title?: string;
      category?: string;
      status?: string;
      folder_id?: string | null;
      description?: string;
    };

    const { document_id, ...updates } = body;

    if (!document_id) {
      return NextResponse.json({ error: 'document_id requerido' }, { status: 400 });
    }

    console.log('✏️ Actualizando documento admin:', document_id, updates);

    const result = await updateDocumentAdmin(document_id, updates, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error en PUT /api/admin/documents:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar documento
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    console.log('🗑️ Eliminando documento admin:', documentId);

    const result = await deleteDocumentAdmin(documentId, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error en DELETE /api/admin/documents:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}