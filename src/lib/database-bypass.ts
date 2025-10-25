// src/lib/database-bypass.ts
// Versión bypass que omite verificaciones de usuario para testing

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { getSupabaseServerClient } from './supabase';
import type { Document } from '~/types/database';

/**
 * Crea documento directo sin verificaciones de usuario (SOLO PARA TESTING)
 */
export async function createDocumentBypass(documentData: {
  owner_clerk_id: string;
  title: string;
  filename: string;
  storage_path?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
}): Promise<Document> {
  const supabase = getSupabaseServerClient();
  
  console.log('🔄 Creando documento en modo bypass:', documentData);

  // Buscar o crear usuario sin verificaciones estrictas
  let ownerId: string;
  
  try {
    // Intentar obtener usuario existente
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', documentData.owner_clerk_id)
      .single();

    if (existingUser) {
      ownerId = existingUser.id;
      console.log('✅ Usuario encontrado:', ownerId);
    } else {
      // Crear usuario temporal
      console.log('⚠️ Usuario no encontrado, creando temporal...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: documentData.owner_clerk_id,
          email: `${documentData.owner_clerk_id}@temp.com`,
          first_name: 'Usuario',
          last_name: 'Temporal',
          role: 'empleado'
        })
        .select('id')
        .single();

      if (createUserError || !newUser) {
        console.error('❌ Error creando usuario:', createUserError);
        throw new Error(`Error creando usuario: ${createUserError?.message ?? 'Desconocido'}`);
      }

      ownerId = newUser.id;
      console.log('✅ Usuario temporal creado:', ownerId);
    }
  } catch (userError) {
    console.error('❌ Error manejando usuario:', userError);
    const errorMsg = userError instanceof Error ? userError.message : 'Error desconocido';
    throw new Error(`Error de usuario: ${errorMsg}`);
  }

  // Crear documento directamente
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        owner_id: ownerId,
        title: documentData.title,
        filename: documentData.filename,
        storage_path: documentData.storage_path,
        file_size: documentData.file_size,
        mime_type: documentData.mime_type,
        page_count: documentData.page_count ?? 1,
        status: 'uploaded'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando documento:', error);
      throw new Error(`Error creando documento: ${error.message}`);
    }

    console.log('✅ Documento creado exitosamente:', data.id);

    // Registrar actividad (sin fallar si hay error)
    try {
      await supabase
        .from('activities')
        .insert({
          user_id: ownerId,
          action: 'document_uploaded',
          entity_type: 'document',
          entity_id: data.id,
          metadata: {
            filename: documentData.filename,
            size: documentData.file_size,
            type: documentData.mime_type
          }
        });
      console.log('✅ Actividad registrada');
    } catch (activityError) {
      console.warn('⚠️ Error registrando actividad (no crítico):', activityError);
    }

    return data;
  } catch (docError) {
    console.error('❌ Error en creación de documento:', docError);
    throw docError;
  }
}