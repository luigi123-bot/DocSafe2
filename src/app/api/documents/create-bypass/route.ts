import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createDocumentBypass } from '~/lib/database-bypass';

interface CreateDocumentRequest {
  title: string;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  activate_ocr: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as CreateDocumentRequest;
    const { 
      title, 
      filename, 
      storage_path, 
      file_size, 
      mime_type, 
      category, 
      activate_ocr 
    } = body;

    // Validar datos requeridos
    if (!title || !filename || !storage_path || !file_size || !mime_type) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }

    // Validar tamaño de archivo (50MB máx)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file_size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es muy grande. Tamaño máximo: 50MB.' 
      }, { status: 400 });
    }

    // Validar tipo MIME
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(mime_type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido' 
      }, { status: 400 });
    }

    console.log('📄 [BYPASS] Creando documento:', {
      title,
      filename,
      owner: userId,
      size: file_size,
      type: mime_type,
      category,
      ocr: activate_ocr
    });

    // Crear documento usando la función bypass
    const document = await createDocumentBypass({
      owner_clerk_id: userId,
      title: title.trim(),
      filename,
      storage_path,
      file_size,
      mime_type,
      page_count: mime_type === 'application/pdf' ? 1 : 1
    });

    console.log('✅ [BYPASS] Documento creado:', document.id);

    return NextResponse.json({
      success: true,
      document_id: document.id,
      message: 'Documento creado exitosamente (bypass mode)',
      data: {
        id: document.id,
        title: document.title,
        status: document.status,
        created_at: document.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [BYPASS] Error creando documento:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json({ 
      error: errorMessage,
      mode: 'bypass',
      debug: true
    }, { status: 500 });
  }
}