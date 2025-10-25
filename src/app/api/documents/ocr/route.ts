import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateDocumentStatus, saveOcrResult } from '~/lib/database';

interface OCRRequest {
  document_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as OCRRequest;
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json({ 
        error: 'document_id es requerido' 
      }, { status: 400 });
    }

    console.log('🔍 Iniciando procesamiento OCR para documento:', document_id);

    // Marcar documento como "processing"
    await updateDocumentStatus(document_id, 'processing');

    // Simular procesamiento OCR (en producción aquí iría la lógica real de OCR)
    setTimeout(() => {
      void (async () => {
        try {
        // Simular resultado de OCR exitoso
        const mockOcrResult = {
          document_id,
          page_number: 1,
          text_content: `Documento procesado con OCR - ${new Date().toISOString()}
          
Este es un texto de ejemplo extraído del documento.
Se detectaron los siguientes elementos:
- Fecha: ${new Date().toLocaleDateString()}
- Documento: Factura/Recibo
- Estado: Procesado correctamente

El procesamiento OCR se completó exitosamente.`,
          confidence: 85.5,
          language: 'es',
          raw_data: {
            engine: 'mock-ocr',
            processed_at: new Date().toISOString(),
            confidence_threshold: 75,
            pages_processed: 1
          }
        };

        await saveOcrResult(mockOcrResult);
        console.log('✅ OCR completado para documento:', document_id);
        
      } catch (error) {
        console.error('❌ Error en procesamiento OCR:', error);
        await updateDocumentStatus(document_id, 'ocr_failed');
      }
      })();
    }, 3000); // Simular 3 segundos de procesamiento

    return NextResponse.json({
      success: true,
      message: 'Procesamiento OCR iniciado',
      document_id,
      status: 'processing'
    });

  } catch (error) {
    console.error('❌ Error iniciando OCR:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}