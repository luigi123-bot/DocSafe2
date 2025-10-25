// src/lib/supabase-s3.ts
// Cliente S3 optimizado para Supabase Storage

import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración del cliente S3 para Supabase
const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  region: process.env.SUPABASE_S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: true, // Necesario para Supabase
});

/**
 * Sube un archivo a Supabase Storage usando S3 protocol
 */
export async function uploadFileS3(
  bucketName: string,
  key: string,
  file: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      // Metadatos adicionales si es necesario
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construir URL pública
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${key}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error subiendo archivo con S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera una URL firmada para descarga temporal
 */
export async function getSignedDownloadUrl(
  bucketName: string,
  key: string,
  expiresIn = 3600 // 1 hora por defecto
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('Error generando URL firmada:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera una URL firmada para upload temporal
 */
export async function getSignedUploadUrl(
  bucketName: string,
  key: string,
  contentType?: string,
  expiresIn = 900 // 15 minutos por defecto
): Promise<{ success: boolean; url?: string; fields?: Record<string, string>; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('Error generando URL de upload firmada:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteFileS3(
  bucketName: string,
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('Error eliminando archivo con S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Verifica si un archivo existe en el bucket
 */
export async function fileExistsS3(
  bucketName: string,
  key: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return { exists: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return { exists: false };
    }
    
    console.error('Error verificando archivo:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Lista archivos en un bucket con prefijo opcional
 */
export async function listFilesS3(
  bucketName: string,
  prefix?: string,
  maxKeys = 100
): Promise<{ success: boolean; files?: Array<{ key: string; size: number; lastModified: Date }>; error?: string }> {
  try {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    const files = response.Contents?.map(obj => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
    })) ?? [];

    return {
      success: true,
      files,
    };
  } catch (error) {
    console.error('Error listando archivos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene información de un archivo específico
 */
export async function getFileInfoS3(
  bucketName: string,
  key: string
): Promise<{ 
  success: boolean; 
  info?: { 
    size: number; 
    lastModified: Date; 
    contentType?: string; 
    metadata?: Record<string, string> 
  }; 
  error?: string 
}> {
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      success: true,
      info: {
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified ?? new Date(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      },
    };
  } catch (error) {
    console.error('Error obteniendo info del archivo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export default s3Client;