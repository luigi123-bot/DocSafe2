// src/app/api/documents/[id]/download/route.ts
// API para generar URLs presignadas para descargar documentos desde S3

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '~/lib/supabase';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
    console.log('📥 Generando URL de descarga para documento:', documentId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supabase = getSupabaseServerClient();
    
    // Obtener información del documento
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const { data: document, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .from('documents')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .select('id, filename, file_path, title')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .eq('id', documentId)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .single();

    if (error || !document) {
      console.error('❌ Documento no encontrado:', error);
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    console.log('📄 Documento encontrado:', document);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const filePath = document.file_path ?? `documents/${documentId}/${document.filename}`;
    
    // Generar URL presignada de S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      Key: filePath,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ResponseContentDisposition: `inline; filename="${document.filename}"`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hora
    });

    console.log('✅ URL presignada generada para:', filePath);

    return NextResponse.json({
      success: true,
      url: signedUrl,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      filename: document.filename,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      title: document.title
    });

  } catch (error) {
    console.error('❌ Error generando URL de descarga:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}