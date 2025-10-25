// src/app/api/admin/folders/move/route.ts
// API para mover documentos entre carpetas

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { moveDocumentsToFolder } from '~/lib/admin-documents';

// POST - Mover documentos a carpeta
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as {
      document_ids: string[];
      folder_id: string | null;
    };

    const { document_ids, folder_id } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'Lista de documentos requerida' }, { status: 400 });
    }

    console.log('📁 Moviendo documentos a carpeta:', { document_ids, folder_id });

    const result = await moveDocumentsToFolder(document_ids, folder_id, clerkUserId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: `${document_ids.length} documento(s) movido(s) exitosamente`
    });

  } catch (error) {
    console.error('❌ Error en POST /api/admin/folders/move:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}