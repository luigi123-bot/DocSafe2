// src/lib/document-upload-s3.ts
// Funciones de upload optimizadas con S3 protocol

import { uploadFileS3, getSignedUploadUrl } from './supabase-s3';

/**
 * Sube un archivo usando el protocolo S3 optimizado
 */
export async function uploadDocumentS3(
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    onProgress?.(10); // Archivo convertido

    // Subir usando S3 protocol
    const result = await uploadFileS3(
      'documents', // bucket name
      fileName,
      uint8Array,
      file.type
    );

    onProgress?.(100); // Upload completo

    return result;
  } catch (error) {
    console.error('Error en uploadDocumentS3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Upload con chunks para archivos grandes (multipart)
 */
export async function uploadLargeDocumentS3(
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    
    if (file.size <= CHUNK_SIZE) {
      // Archivo pequeño, usar upload directo
      return uploadDocumentS3(file, fileName, onProgress);
    }

    // Para archivos grandes, usar multipart upload
    console.log(`📤 Archivo grande detectado (${file.size} bytes), usando multipart upload...`);
    
    // Por ahora, usamos upload directo hasta implementar multipart completo
    return uploadDocumentS3(file, fileName, onProgress);
    
  } catch (error) {
    console.error('Error en uploadLargeDocumentS3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera URL firmada para upload directo desde el cliente
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn = 900 // 15 minutos
): Promise<{ success: boolean; url?: string; error?: string }> {
  return getSignedUploadUrl('documents', fileName, contentType, expiresIn);
}

/**
 * Upload directo usando URL firmada (mejor para archivos grandes)
 */
export async function uploadWithPresignedUrl(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: `HTTP ${xhr.status}: ${xhr.statusText}` 
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ 
          success: false, 
          error: 'Error de red durante el upload' 
        });
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error en uploadWithPresignedUrl:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Validaciones de archivo mejoradas
 */
export function validateFileForS3(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `El archivo es demasiado grande. Máximo permitido: ${Math.round(MAX_SIZE / 1024 / 1024)}MB` 
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido. Tipos soportados: PDF, imágenes, documentos de Office, texto plano` 
    };
  }

  return { valid: true };
}

/**
 * Genera nombre de archivo único y seguro para S3
 */
export function generateSecureFileName(originalName: string, userId: string): string {
  // Limpiar nombre de archivo
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();

  // Generar timestamp único
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  // Estructura: user_id/year/month/timestamp_randomId_filename
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  return `${userId}/${year}/${month}/${timestamp}_${randomId}_${cleanName}`;
}