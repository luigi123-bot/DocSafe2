// src/app/api/admin/documents/[id]/route.ts
// API para obtener documento específico por ID

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getDocumentByIdAdmin } from '~/lib/admin-documents';

// GET - Obtener documento por ID
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    console.log('📄 Obteniendo documento admin:', documentId);

    const document = await getDocumentByIdAdmin(documentId);

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('❌ Error en GET /api/admin/documents/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}