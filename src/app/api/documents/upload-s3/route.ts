// src/app/api/documents/upload-s3/route.ts
// API para upload de documentos con método híbrido (S3 + Supabase normal)

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { uploadDocument, generateFileName, validateFile } from '~/lib/supabase-storage';
import { createDocument } from '~/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('📤 Iniciando upload híbrido para usuario:', clerkUserId);

    // Obtener datos del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const activateOCR = formData.get('activateOCR') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('✅ Archivo validado:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Generar nombre seguro
    const secureFileName = generateFileName(file.name, clerkUserId);
    
    console.log('📁 Nombre de archivo generado:', secureFileName);

    // Convertir File a ArrayBuffer para compatibilidad
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload usando método híbrido (S3 o API normal)
    const uploadResult = await uploadDocument(uint8Array, secureFileName, file.type);
    
    if (!uploadResult.success) {
      console.error('❌ Error en upload:', uploadResult.error);
      return NextResponse.json(
        { error: `Error subiendo archivo: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    console.log('✅ Archivo subido exitosamente:', uploadResult.url);

    // Guardar metadatos en base de datos
    const document = await createDocument({
      owner_clerk_id: clerkUserId,
      title: title || file.name,
      filename: file.name,
      storage_path: secureFileName,
      file_size: file.size,
      mime_type: file.type,
      page_count: 1,
    });

    console.log('✅ Documento guardado en BD:', document.id);

    // Simular OCR si está activado
    if (activateOCR) {
      console.log('🔍 OCR activado - se procesará en background');
      
      // Actualizar estado a processing en background
      setTimeout(() => {
        void (async () => {
          try {
            const { updateDocumentStatus } = await import('~/lib/database');
            await updateDocumentStatus(document.id, 'processing');
            console.log('🔄 Estado actualizado a processing');
          } catch (error) {
            console.error('Error actualizando estado:', error);
          }
        })();
      }, 1000);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        status: document.status,
        storage_url: uploadResult.url,
        size: file.size,
        type: file.type,
        category: category,
        ocr_enabled: activateOCR,
      }
    });

  } catch (error) {
    console.error('❌ Error en upload:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}