// src/app/api/documents/[id]/download/route.ts
// API para generar URLs presignadas para descargar documentos desde S3

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '~/lib/supabase';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { SupabaseClient } from '@supabase/supabase-js';

// Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

type DocumentRow = {
  id: string;
  filename: string;
  file_path?: string;
  title?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      console.log(`[API][download] Usuario no autorizado`);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: documentId } = await params;
    console.log(`[API][download] Intentando visualizar documento:`, { documentId });

    const supabase = getSupabaseServerClient() as SupabaseClient;
    
    // Obtener información del documento tipado
    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, file_path, title')
      .eq('id', documentId)
      .single();

    const document = data as DocumentRow | null;

    console.log(`[API][download] Resultado consulta documento:`, { documentId, document, error });

    if (error || !document) {
      console.error(`[API][download] ❌ Documento no encontrado`, { documentId, error, document });
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Verifica que filename exista
    if (!document.filename) {
      console.error(`[API][download] ❌ El documento no tiene filename`, { documentId, document });
      return NextResponse.json({ error: 'Documento sin archivo asociado' }, { status: 404 });
    }

    // Usa file_path si existe, si no construye la ruta por defecto (prefer nullish coalescing)
    const filePath = document.file_path ?? `documents/${documentId}/${document.filename}`;
    console.log(`[API][download] filePath usado:`, { documentId, filePath });

    // Generar URL presignada de S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: filePath,
      ResponseContentDisposition: `inline; filename="${document.filename}"`,
    });

    let signedUrl: string | undefined;
    try {
      signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log(`[API][download] ✅ URL presignada generada`, { documentId, filePath, signedUrl });
    } catch (urlError) {
      console.error(`[API][download] ❌ Error generando URL presignada`, { documentId, filePath, urlError });
      return NextResponse.json({ error: 'No se pudo generar la URL presignada' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: signedUrl,
      filename: document.filename,
      title: document.title ?? ''
    });

  } catch (error) {
    console.error(`[API][download] ❌ Error interno`, { error });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}