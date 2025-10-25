import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface CreateDocumentRequest {
  title: string;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  activate_ocr: boolean;
}

// MOCK TEMPORAL - SIMULA GUARDAR SIN BASE DE DATOS
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

    console.log('📄 [MOCK] Simulando creación de documento:', {
      title,
      filename,
      owner: userId,
      size: file_size,
      type: mime_type,
      category,
      ocr: activate_ocr,
      storage_path
    });

    // SIMULAR GUARDADO EXITOSO
    const mockDocumentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('✅ [MOCK] Documento "creado" exitosamente:', mockDocumentId);
    console.log('📁 [MOCK] Archivo "guardado" en:', storage_path);

    // Si OCR está activado, simular procesamiento
    if (activate_ocr) {
      console.log('🔍 [MOCK] OCR simulado para:', mockDocumentId);
    }

    return NextResponse.json({
      success: true,
      document_id: mockDocumentId,
      message: 'Documento creado exitosamente (modo simulación)',
      data: {
        id: mockDocumentId,
        title: title,
        status: 'uploaded',
        created_at: new Date().toISOString(),
        storage_path: storage_path,
        owner_id: userId,
        filename: filename,
        file_size: file_size,
        mime_type: mime_type,
        category: category,
        ocr_enabled: activate_ocr
      },
      mock: true,
      note: 'Este es un resultado simulado. El archivo se subió a Supabase Storage pero los metadatos no se guardaron en la base de datos debido a problemas de RLS.'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [MOCK] Error en simulación:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json({ 
      error: errorMessage,
      mode: 'mock',
      debug: true
    }, { status: 500 });
  }
}