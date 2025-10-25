// src/lib/admin-documents.ts
// Funciones administrativas para gestión de documentos

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { getSupabaseServerClient } from './supabase';
import { deleteFileS3 } from './supabase-s3';
import type { DocumentWithDetails } from '~/types/database';

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  created_by: string;
  document_count: number;
}

export interface DocumentFilter {
  status?: string[];
  category?: string[];
  folder_id?: string; // Ahora sí disponible con la nueva relación
  owner_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

/**
 * Obtiene todos los documentos con filtros para admin
 */
export async function getAllDocumentsAdmin(filters: DocumentFilter = {}): Promise<{
  documents: DocumentWithDetails[];
  total: number;
  pages: number;
}> {
  const supabase = getSupabaseServerClient();
  
  try {
    const {
      status = [],
      category = [],
      folder_id, // Ahora sí podemos usar folder_id con la nueva relación
      owner_id,
      search = '',
      date_from,
      date_to,
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('documents')
      .select(`
        *,
        users!inner(first_name, last_name, email, role),
        document_folders(name, color)
      `, { count: 'exact' });

    // Aplicar filtros
    if (status.length > 0) {
      query = query.in('status', status);
    }

    if (category.length > 0) {
      query = query.in('category', category);
    }

    // Si se filtra por carpeta, primero obtenemos los IDs de documentos de esa carpeta
    let documentIdsInFolder: string[] | null = null;
    if (folder_id) {
      const { data: folderDocs } = await supabase
        .from('folder_documents')
        .select('document_id')
        .eq('folder_id', folder_id);
      
      interface FolderDocumentRelation {
        document_id: string;
      }

      documentIdsInFolder = folderDocs?.map((fd: FolderDocumentRelation) => fd.document_id) ?? [];
      
      // Si la carpeta no tiene documentos, retornamos resultado vacío
      if (!documentIdsInFolder || documentIdsInFolder.length === 0) {
        return { documents: [], total: 0, pages: 0 };
      }
      
      query = query.in('id', documentIdsInFolder);
    }

    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Paginación y ordenamiento
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error obteniendo documentos admin:', error);
      throw new Error(`Error obteniendo documentos: ${error.message}`);
    }

    // Transformar datos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents: DocumentWithDetails[] = (data ?? []).map((doc: any) => ({
      ...doc,
      owner_name: doc.users ? `${doc.users.first_name} ${doc.users.last_name}` : 'Usuario',
      owner_email: doc.users?.email ?? '',
      owner_role: doc.users?.role ?? 'empleado',
      folder_name: doc.document_folders?.name ?? null,
      folder_color: doc.document_folders?.color ?? null,
      ocr_pages_count: 0, // Se puede implementar después
      tags_count: 0,
      shares_count: 0,
      tags: [],
      categories: []
    }));

    const total = count ?? 0;
    const pages = Math.ceil(total / limit);

    return { documents, total, pages };

  } catch (error) {
    console.error('Error en getAllDocumentsAdmin:', error);
    return { documents: [], total: 0, pages: 0 };
  }
}

/**
 * Obtiene un documento específico con todos los detalles para admin
 */
export async function getDocumentByIdAdmin(documentId: string): Promise<DocumentWithDetails | null> {
  const supabase = getSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        users!inner(first_name, last_name, email, role, clerk_user_id),
        document_folders(name, color, description),
        document_tags(tag, color),
        ocr_results(id, page_number, text_content, confidence)
      `)
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Error obteniendo documento admin:', error);
      return null;
    }

    if (!data) return null;

    // Transformar datos
    const document: DocumentWithDetails = {
      ...data,
      owner_name: data.users ? `${data.users.first_name} ${data.users.last_name}` : 'Usuario',
      owner_email: data.users?.email ?? '',
      owner_role: data.users?.role ?? 'empleado',
      owner_clerk_id: data.users?.clerk_user_id ?? '',
      folder_name: data.document_folders?.name ?? null,
      folder_color: data.document_folders?.color ?? null,
      folder_description: data.document_folders?.description ?? null,
      ocr_pages_count: data.ocr_results?.length ?? 0,
      tags_count: data.document_tags?.length ?? 0,
      shares_count: 0,
      tags: data.document_tags ?? [],
      categories: [],
      ocr_results: data.ocr_results ?? []
    };

    return document;

  } catch (error) {
    console.error('Error en getDocumentByIdAdmin:', error);
    return null;
  }
}

/**
 * Actualiza un documento (solo admin)
 */
export async function updateDocumentAdmin(
  documentId: string,
  updates: {
    title?: string;
    category?: string;
    status?: string;
    folder_id?: string | null; // Ahora disponible con la nueva relación
    description?: string;
  },
  adminClerkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Filtrar campos que no existen en la tabla documents
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category, folder_id, ...validUpdates } = updates;
    
    // Actualizar campos básicos del documento
    const { error } = await supabase
      .from('documents')
      .update({
        ...validUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error actualizando documento:', error);
      return { success: false, error: error.message };
    }

    // Manejar cambio de carpeta si se especifica
    if (folder_id !== undefined) {
      // Eliminar relación actual con carpetas
      await supabase
        .from('folder_documents')
        .delete()
        .eq('document_id', documentId);

      // Si folder_id no es null, crear nueva relación
      if (folder_id) {
        const { error: folderError } = await supabase
          .from('folder_documents')
          .insert({
            folder_id: folder_id,
            document_id: documentId
          });

        if (folderError) {
          console.error('Error moviendo documento a carpeta:', folderError);
          return { success: false, error: folderError.message };
        }
      }
    }

    // Registrar actividad admin
    await logAdminActivity(adminClerkId, 'document_updated', {
      document_id: documentId,
      changes: updates
    });

    return { success: true };

  } catch (error) {
    console.error('Error en updateDocumentAdmin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Elimina un documento completamente (solo admin)
 */
export async function deleteDocumentAdmin(
  documentId: string,
  adminClerkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Obtener información del documento
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path, filename')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Documento no encontrado' };
    }

    // Eliminar archivo del storage
    if (document.storage_path) {
      const deleteResult = await deleteFileS3('documents', document.storage_path as string);
      if (!deleteResult.success) {
        console.warn('Error eliminando archivo de storage:', deleteResult.error);
        // Continuar con eliminación de BD aunque falle el storage
      }
    }

    // Eliminar registros relacionados primero
    await supabase.from('ocr_results').delete().eq('document_id', documentId);
    await supabase.from('document_tags').delete().eq('document_id', documentId);
    await supabase.from('shared_documents').delete().eq('document_id', documentId);

    // Eliminar documento de la BD
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error eliminando documento de BD:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Registrar actividad admin
    await logAdminActivity(adminClerkId, 'document_deleted', {
      document_id: documentId,
      filename: document.filename
    });

    return { success: true };

  } catch (error) {
    console.error('Error en deleteDocumentAdmin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene todas las carpetas de documentos
 */
export async function getDocumentFolders(): Promise<DocumentFolder[]> {
  const supabase = getSupabaseServerClient();
  
  try {
    console.log('📁 Obteniendo carpetas de documentos...');
    
    // Primero obtenemos las carpetas
    const { data: folders, error: foldersError } = await supabase
      .from('document_folders')
      .select('*')
      .order('name');

    if (foldersError) {
      console.error('Error obteniendo carpetas:', foldersError);
      return [];
    }

    console.log('📁 Carpetas obtenidas:', folders);

    // Luego obtenemos el conteo de documentos para cada carpeta
    const foldersWithCount = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (folders ?? []).map(async (folder: any) => {
        // Contar documentos en esta carpeta usando la tabla de relación
        const { count } = await supabase
          .from('folder_documents')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id);

        return {
          ...folder,
          document_count: count ?? 0
        };
      })
    );

    console.log('📁 Carpetas con conteo:', foldersWithCount);

    return foldersWithCount;

  } catch (error) {
    console.error('Error en getDocumentFolders:', error);
    return [];
  }
}

/**
 * Crea una nueva carpeta de documentos
 */
export async function createDocumentFolder(
  name: string,
  description: string,
  color: string,
  creatorClerkId: string
): Promise<{ success: boolean; folder?: DocumentFolder; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Obtener ID del creador
    const { getUserIdFromClerk } = await import('./database');
    const creatorId = await getUserIdFromClerk(creatorClerkId);

    const { data, error } = await supabase
      .from('document_folders')
      .insert({
        name: name.trim(),
        description: description.trim(),
        color,
        created_by: creatorId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando carpeta:', error);
      return { success: false, error: error.message };
    }

    // Registrar actividad
    await logAdminActivity(creatorClerkId, 'folder_created', {
      folder_id: data.id,
      folder_name: name
    });

    return { 
      success: true, 
      folder: { ...data, document_count: 0 } 
    };

  } catch (error) {
    console.error('Error en createDocumentFolder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Actualiza una carpeta existente
 */
export async function updateDocumentFolder(
  folderId: string,
  updates: {
    name?: string;
    description?: string;
    color?: string;
  },
  adminClerkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    const { error } = await supabase
      .from('document_folders')
      .update(updates)
      .eq('id', folderId);

    if (error) {
      console.error('Error actualizando carpeta:', error);
      return { success: false, error: error.message };
    }

    // Registrar actividad
    await logAdminActivity(adminClerkId, 'folder_updated', {
      folder_id: folderId,
      changes: updates
    });

    return { success: true };

  } catch (error) {
    console.error('Error en updateDocumentFolder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Elimina una carpeta (mueve documentos a sin carpeta)
 */
export async function deleteDocumentFolder(
  folderId: string,
  adminClerkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Eliminar todas las relaciones de documentos con esta carpeta
    await supabase
      .from('folder_documents')
      .delete()
      .eq('folder_id', folderId);

    // Eliminar carpeta
    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error('Error eliminando carpeta:', error);
      return { success: false, error: error.message };
    }

    // Registrar actividad
    await logAdminActivity(adminClerkId, 'folder_deleted', {
      folder_id: folderId
    });

    return { success: true };

  } catch (error) {
    console.error('Error en deleteDocumentFolder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Mueve documentos a una carpeta específica
 */
export async function moveDocumentsToFolder(
  documentIds: string[],
  folderId: string | null,
  adminClerkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Primero eliminamos las relaciones existentes de estos documentos
    await supabase
      .from('folder_documents')
      .delete()
      .in('document_id', documentIds);

    // Si folderId no es null, creamos las nuevas relaciones
    if (folderId) {
      const folderDocuments = documentIds.map(docId => ({
        folder_id: folderId,
        document_id: docId
      }));

      const { error } = await supabase
        .from('folder_documents')
        .insert(folderDocuments);

      if (error) {
        console.error('Error moviendo documentos a carpeta:', error);
        return { success: false, error: error.message };
      }
    }

    // Registrar actividad admin
    await logAdminActivity(adminClerkId, 'documents_moved', {
      document_ids: documentIds,
      folder_id: folderId,
      document_count: documentIds.length
    });

    // Registrar actividad
    await logAdminActivity(adminClerkId, 'documents_moved', {
      document_ids: documentIds,
      folder_id: folderId,
      count: documentIds.length
    });

    return { success: true };

  } catch (error) {
    console.error('Error en moveDocumentsToFolder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene estadísticas administrativas
 */
export async function getAdminStats(): Promise<{
  total_documents: number;
  documents_by_status: Record<string, number>;
  documents_by_category: Record<string, number>;
  documents_by_folder: Record<string, number>;
  recent_uploads: number;
  storage_usage: number;
}> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Obtener todos los documentos - usando solo campos que existen
    const { data: documents } = await supabase
      .from('documents')
      .select('status, file_size, created_at');

    const total_documents = documents?.length ?? 0;

    // Agrupar por estado
    const documents_by_status: Record<string, number> = {};
    const documents_by_category: Record<string, number> = {};
    let storage_usage = 0;

    // Documentos recientes (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let recent_uploads = 0;

    // Obtener todas las carpetas para las estadísticas
    const { data: folders } = await supabase
      .from('document_folders')
      .select('id, name');

    // Obtener todas las relaciones de carpetas con documentos
    const { data: folderDocuments } = await supabase
      .from('folder_documents')
      .select('folder_id, document_id');

    // Mapear documentos por carpeta
    const documentsByFolderMap: Record<string, number> = { 'Sin carpeta': 0 };
    
    // Contar documentos por carpeta
    if (folderDocuments && folders) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      folders.forEach((folder: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docsInFolder = folderDocuments.filter((fd: any) => fd.folder_id === folder.id);
        documentsByFolderMap[folder.name] = docsInFolder.length;
      });
      
      // Contar documentos sin carpeta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const documentsInFolders = new Set(folderDocuments.map((fd: any) => fd.document_id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentsWithoutFolder = documents?.filter((doc: any) => !documentsInFolders.has(doc.id));
      documentsByFolderMap['Sin carpeta'] = documentsWithoutFolder?.length ?? 0;
    } else {
      // Si no hay carpetas, todos los documentos están sin carpeta
      documentsByFolderMap['Sin carpeta'] = total_documents;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?.forEach((doc: any) => {
      // Por estado
      const status = doc.status ?? 'uploaded';
      documents_by_status[status] = (documents_by_status[status] ?? 0) + 1;

      // TODO: Por categoría - implementar cuando se cree la relación
      // const category = doc.category ?? 'otros';
      // documents_by_category[category] = (documents_by_category[category] ?? 0) + 1;
      documents_by_category.General = (documents_by_category.General ?? 0) + 1;

      // Uso de storage
      storage_usage += doc.file_size ?? 0;

      // Uploads recientes
      if (doc.created_at && new Date(doc.created_at as string) > weekAgo) {
        recent_uploads++;
      }
    });

    return {
      total_documents,
      documents_by_status,
      documents_by_category,
      documents_by_folder: documentsByFolderMap, // Usar el mapa calculado
      recent_uploads,
      storage_usage
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas admin:', error);
    return {
      total_documents: 0,
      documents_by_status: {},
      documents_by_category: {},
      documents_by_folder: {},
      recent_uploads: 0,
      storage_usage: 0
    };
  }
}

// Función auxiliar para registrar actividades administrativas
async function logAdminActivity(
  adminClerkId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { getUserIdFromClerk } = await import('./database');
    const supabase = getSupabaseServerClient();
    
    const adminId = await getUserIdFromClerk(adminClerkId);
    
    await supabase
      .from('activities')
      .insert({
        user_id: adminId,
        action: `admin_${action}`,
        metadata: {
          ...metadata,
          admin_action: true,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Error registrando actividad admin:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}