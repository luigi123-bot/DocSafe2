import { type NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface DocumentRecord {
  id: string;
  filename: string;
  originalName: string;
  ocrText: string;
  confidence: number;
  uploadDate: string;
  size: number;
  type: string;
}

// Simulamos una base de datos en memoria para demostración
const documents: DocumentRecord[] = [];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ocrText = formData.get('ocrText') as string;
    const confidence = formData.get('confidence') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró ningún archivo' },
        { status: 400 }
      );
    }

    // Crear directorio de uploads si no existe
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadDir, filename);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Crear registro del documento
    const documentRecord: DocumentRecord = {
      id: timestamp.toString(),
      filename,
      originalName: file.name,
      ocrText: ocrText || '',
      confidence: parseInt(confidence) || 0,
      uploadDate: new Date().toISOString(),
      size: file.size,
      type: file.type
    };

    // Guardar en "base de datos" (en memoria)
    documents.push(documentRecord);

    console.log('Documento guardado:', documentRecord);

    return NextResponse.json({
      success: true,
      document: documentRecord,
      message: 'Documento subido y procesado exitosamente'
    });

  } catch (error) {
    console.error('Error al subir documento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    documents,
    total: documents.length
  });
}