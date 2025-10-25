import { NextResponse } from 'next/server';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  ocrText: string;
  confidence: number;
  uploadDate: string;
  size: number;
  type: string;
  tags: string[];
}

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  fileType?: string;
  minConfidence?: number;
}

interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
}

// Simulamos una base de datos en memoria con algunos documentos de ejemplo
const mockDocuments: Document[] = [
  {
    id: '1',
    filename: 'invoice-001.jpg',
    originalName: 'Factura Electricidad Marzo.jpg',
    ocrText: 'FACTURA ELÉCTRICA\nCompañía Eléctrica Nacional\nPeríodo: Marzo 2024\nImporte: $125.50\nVencimiento: 15/04/2024',
    confidence: 95,
    uploadDate: '2024-03-15T10:30:00Z',
    size: 256000,
    type: 'image/jpeg',
    tags: ['factura', 'electricidad', 'servicios']
  },
  {
    id: '2',
    filename: 'contract-rent.pdf',
    originalName: 'Contrato Alquiler Apartamento.pdf',
    ocrText: 'CONTRATO DE ARRENDAMIENTO\nInquilino: Juan Pérez\nDirección: Av. Principal 123\nMonto mensual: $800\nDuración: 12 meses',
    confidence: 88,
    uploadDate: '2024-03-10T14:20:00Z',
    size: 1024000,
    type: 'application/pdf',
    tags: ['contrato', 'alquiler', 'legal']
  },
  {
    id: '3',
    filename: 'certificate-birth.jpg',
    originalName: 'Certificado Nacimiento.jpg',
    ocrText: 'CERTIFICADO DE NACIMIENTO\nNombre: María García López\nFecha de nacimiento: 15/05/1990\nLugar: Ciudad Capital\nRegistro Civil: 12345',
    confidence: 92,
    uploadDate: '2024-03-05T09:15:00Z',
    size: 512000,
    type: 'image/jpeg',
    tags: ['certificado', 'identidad', 'personal']
  }
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const tag = url.searchParams.get('tag') ?? '';
  
  let filteredDocuments = mockDocuments;
  
  // Filtrar por texto de búsqueda en OCR
  if (query) {
    filteredDocuments = filteredDocuments.filter(doc => 
      doc.ocrText.toLowerCase().includes(query.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Filtrar por etiqueta
  if (tag) {
    filteredDocuments = filteredDocuments.filter(doc => 
      doc.tags.includes(tag.toLowerCase())
    );
  }
  
  return NextResponse.json({
    documents: filteredDocuments,
    total: filteredDocuments.length,
    query,
    tag
  });
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json() as SearchRequest;
    const { query, filters } = requestData;
    
    let results = mockDocuments;
    
    // Búsqueda por texto
    if (query && typeof query === 'string') {
      results = results.filter(doc => 
        doc.ocrText.toLowerCase().includes(query.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Aplicar filtros adicionales
    if (filters) {
      if (filters.dateFrom && typeof filters.dateFrom === 'string') {
        results = results.filter(doc => 
          new Date(doc.uploadDate) >= new Date(filters.dateFrom!)
        );
      }
      
      if (filters.dateTo && typeof filters.dateTo === 'string') {
        results = results.filter(doc => 
          new Date(doc.uploadDate) <= new Date(filters.dateTo!)
        );
      }
      
      if (filters.fileType && typeof filters.fileType === 'string') {
        results = results.filter(doc => 
          doc.type.includes(filters.fileType!)
        );
      }
      
      if (filters.minConfidence && typeof filters.minConfidence === 'number') {
        results = results.filter(doc => 
          doc.confidence >= filters.minConfidence!
        );
      }
    }
    
    return NextResponse.json({
      documents: results,
      total: results.length,
      searchParams: { query, filters }
    });
    
  } catch {
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    );
  }
}