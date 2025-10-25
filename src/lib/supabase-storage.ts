// src/lib/supabase-storage.ts
// Cliente de storage híbrido que funciona con S3 o APIs normales de Supabase

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { getSupabaseServerClient } from './supabase';
import { uploadFileS3 } from './supabase-s3';

/**
 * Upload híbrido que funciona con S3 o método normal de Supabase
 */
export async function uploadDocument(
  file: Buffer | Uint8Array | File,
  fileName: string,
  contentType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Primero intentar con S3 si las credenciales están completas
  const hasS3Credentials = 
    process.env.SUPABASE_S3_ACCESS_KEY_ID && 
    process.env.SUPABASE_S3_SECRET_ACCESS_KEY;

  if (hasS3Credentials) {
    console.log('🚀 Usando protocolo S3 para upload...');
    try {
      // Convertir File a Buffer si es necesario para S3
      let fileForS3: Buffer | Uint8Array;
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        fileForS3 = new Uint8Array(arrayBuffer);
      } else {
        fileForS3 = file;
      }
      
      return await uploadFileS3('documents', fileName, fileForS3, contentType);
    } catch (error) {
      console.warn('⚠️ Error con S3, fallback a método normal:', error);
      // Continuar con método normal si S3 falla
    }
  } else {
    console.log('📤 Usando método normal de Supabase (S3 credentials incompletas)...');
  }

  // Fallback: usar método normal de Supabase
  return uploadWithSupabaseAPI(file, fileName, contentType);
}

/**
 * Upload usando las APIs normales de Supabase
 */
async function uploadWithSupabaseAPI(
  file: Buffer | Uint8Array | File,
  fileName: string,
  contentType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // Convertir diferentes tipos de file a formato compatible
    let fileToUpload: File | Buffer | Uint8Array;
    
    if (file instanceof File) {
      fileToUpload = file;
    } else {
      // Para Buffer o Uint8Array, usar directamente con Supabase
      fileToUpload = file;
    }

    console.log('📤 Subiendo archivo con API normal de Supabase...');

    const { data: uploadData, error } = await supabase.storage
      .from('documents')
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      console.error('❌ Error en upload normal:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Archivo subido:', uploadData?.path);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('✅ Upload normal completado:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('❌ Error en uploadWithSupabaseAPI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Eliminar archivo usando método híbrido
 */
export async function deleteDocument(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.storage
      .from('documents')
      .remove([fileName]);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Verificar si un archivo existe
 */
export async function fileExists(fileName: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from('documents')
      .list(fileName.split('/').slice(0, -1).join('/'), {
        search: fileName.split('/').pop()
      });

    if (error) {
      return { exists: false, error: error.message };
    }

    const exists = data && data.length > 0;
    return { exists };

  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener URL pública de un archivo
 */
export function getPublicUrl(fileName: string): string {
  const supabase = getSupabaseServerClient();
  
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  return data.publicUrl as string;
}

/**
 * Generar nombre de archivo único y seguro
 */
export function generateFileName(originalName: string, userId: string): string {
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

/**
 * Validar archivo antes de upload
 */
export function validateFile(file: File | { size: number; type: string }): { valid: boolean; error?: string } {
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
      error: `Archivo demasiado grande. Máximo: ${Math.round(MAX_SIZE / 1024 / 1024)}MB` 
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de archivo no permitido. Soportados: PDF, imágenes, documentos Office' 
    };
  }

  return { valid: true };
}