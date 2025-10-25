import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Función helper para formatear bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Datos mock para testing
const mockDocuments = [
  {
    id: 'doc_mock_1',
    title: 'Factura Ejemplo 001',
    filename: 'factura_001.pdf',
    owner_name: 'Usuario Demo',
    status: 'processed',
    file_size: 2048000,
    mime_type: 'application/pdf',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['factura', 'importante'],
    categories: ['invoices']
  },
  {
    id: 'doc_mock_2',
    title: 'Contrato Servicios',
    filename: 'contrato_servicios.pdf',
    owner_name: 'Usuario Demo',
    status: 'uploaded',
    file_size: 5120000,
    mime_type: 'application/pdf',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['contrato', 'legal'],
    categories: ['contracts']
  },
  {
    id: 'doc_mock_3',
    title: 'Recibo Compra',
    filename: 'recibo_compra.jpg',
    owner_name: 'Usuario Demo',
    status: 'processing',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['recibo'],
    categories: ['receipts']
  }
];

const mockStats = {
  totalDocuments: 12,
  processedDocuments: 8,
  processingDocuments: 2,
  totalSize: formatBytes(45000000)
};

const mockActivity = [
  { day: 'Dom', value: 2 },
  { day: 'Lun', value: 8 },
  { day: 'Mar', value: 12 },
  { day: 'Mié', value: 6 },
  { day: 'Jue', value: 15 },
  { day: 'Vie', value: 10 },
  { day: 'Sáb', value: 4 }
];

const mockSettings = {
  app_name: 'DocSafe',
  ocr_enabled: true,
  max_file_size: 52428800
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'stats';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    console.log(`📊 [MOCK] API de datos solicitada - tipo: ${type}, usuario: ${userId}`);

    switch (type) {
      case 'stats': {
        console.log('📈 [MOCK] Devolviendo estadísticas simuladas');
        return NextResponse.json(mockStats);
      }

      case 'documents': {
        console.log(`📄 [MOCK] Devolviendo ${Math.min(limit, mockDocuments.length)} documentos simulados`);
        return NextResponse.json(mockDocuments.slice(0, limit));
      }

      case 'recent_documents': {
        console.log(`📄 [MOCK] Devolviendo ${Math.min(limit, mockDocuments.length)} documentos recientes simulados`);
        // Ordenar por fecha más reciente
        const recentDocs = [...mockDocuments]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
        return NextResponse.json(recentDocs);
      }

      case 'activity': {
        console.log('📈 [MOCK] Devolviendo actividad simulada de 7 días');
        return NextResponse.json(mockActivity);
      }

      case 'settings': {
        console.log('⚙️ [MOCK] Devolviendo configuraciones simuladas');
        return NextResponse.json(mockSettings);
      }

      default:
        return NextResponse.json({ 
          error: 'Tipo no válido. Usa: stats, documents, recent_documents, activity, settings' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [MOCK] Error en API de datos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      error: errorMessage,
      mock: true
    }, { status: 500 });
  }
}