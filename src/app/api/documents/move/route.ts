import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { moveDocumentsToFolder } from '~/lib/admin-documents';

interface MoveDocumentsRequest {
  documentIds: string[];
  folderId: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as MoveDocumentsRequest;
    const { documentIds, folderId } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un ID de documento' },
        { status: 400 }
      );
    }

    console.log('🔄 Moviendo documentos:', { documentIds, folderId, userId });

    const result = await moveDocumentsToFolder(documentIds, folderId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Error moviendo documentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: folderId 
        ? `${documentIds.length} documento(s) movido(s) a la carpeta`
        : `${documentIds.length} documento(s) movido(s) fuera de la carpeta`,
      movedCount: documentIds.length
    });

  } catch (error) {
    console.error('❌ Error en POST /api/documents/move:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}