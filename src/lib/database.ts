// src/lib/database.ts
// Funciones de utilidad para trabajar con la base de datos

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { getSupabaseServerClient } from './supabase';
import type { User, Document, Activity, DocumentWithDetails, DashboardStats } from '~/types/database';

/**
 * Obtiene todos los documentos con detalles para un usuario
 */
export async function getUserDocuments(clerkUserId: string): Promise<DocumentWithDetails[]> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Obtener el ID interno del usuario
    const ownerId = await getUserIdFromClerk(clerkUserId);
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        users!inner(first_name, last_name, email)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo documentos del usuario:', error);
      throw new Error(`Error obteniendo documentos: ${error.message}`);
    }

    // Transformar los datos al formato esperado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documentsWithDetails: DocumentWithDetails[] = (data ?? []).map((doc: any) => ({
      ...doc,
      owner_name: doc.users ? `${doc.users.first_name} ${doc.users.last_name}` : 'Usuario',
      owner_email: doc.users?.email ?? '',
      ocr_pages_count: 0, // Por ahora 0, se puede implementar después
      tags_count: 0,
      shares_count: 0,
      tags: [],
      categories: []
    }));

    return documentsWithDetails;
  } catch (error) {
    console.error('Error en getUserDocuments:', error);
    return [];
  }
}

/**
 * Crea un nuevo documento en la base de datos
 */
export async function createDocument(documentData: {
  owner_clerk_id: string;
  title: string;
  filename: string;
  storage_path?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
}): Promise<Document> {
  const supabase = getSupabaseServerClient();
  
  // Obtener el ID interno del usuario
  const ownerId = await getUserIdFromClerk(documentData.owner_clerk_id);
  
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
    console.error('Error creando documento:', error);
    throw new Error(`Error creando documento: ${error.message}`);
  }

  // Registrar actividad
  await logActivity(documentData.owner_clerk_id, 'document_uploaded', {
    document_id: data.id,
    filename: documentData.filename,
    size: documentData.file_size
  });

  return data;
}

/**
 * Actualiza el estado de un documento
 */
export async function updateDocumentStatus(
  documentId: string, 
  status: 'uploaded' | 'processing' | 'processed' | 'ocr_failed'
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', documentId);

  if (error) {
    console.error('Error actualizando estado del documento:', error);
    throw new Error(`Error actualizando documento: ${error.message}`);
  }
}

/**
 * Guarda resultado de OCR para un documento
 */
export async function saveOcrResult(ocrData: {
  document_id: string;
  page_number: number;
  text_content: string;
  confidence?: number;
  language?: string;
  raw_data?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from('ocr_results')
    .insert({
      document_id: ocrData.document_id,
      page_number: ocrData.page_number,
      text_content: ocrData.text_content,
      confidence: ocrData.confidence,
      language: ocrData.language ?? 'es',
      raw_data: ocrData.raw_data
    });

  if (error) {
    console.error('Error guardando resultado OCR:', error);
    throw new Error(`Error guardando OCR: ${error.message}`);
  }

  // Actualizar estado del documento
  await updateDocumentStatus(ocrData.document_id, 'processed');
}

/**
 * Busca documentos por texto
 */
export async function searchDocuments(searchTerm: string): Promise<DocumentWithDetails[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('search_documents', { search_term: searchTerm });

  if (error) {
    console.error('Error buscando documentos:', error);
    throw new Error(`Error en búsqueda: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Obtiene estadísticas del dashboard con datos para gráficas dinámicas
 */
export async function getDashboardStats(clerkUserId?: string): Promise<DashboardStats> {
  const supabase = getSupabaseServerClient();
  
  try {
    let ownerId: string | null = null;
    
    // Si hay un usuario específico, obtener su ID interno
    if (clerkUserId) {
      try {
        ownerId = await getUserIdFromClerk(clerkUserId);
      } catch {
        console.warn('Usuario no encontrado para estadísticas:', clerkUserId);
        // Continuar sin filtro de usuario
      }
    }

    // Consulta básica de documentos
    const documentsQuery = supabase
      .from('documents')
      .select('id, status, file_size, created_at, owner_id');
    
    if (ownerId) {
      documentsQuery.eq('owner_id', ownerId);
    }

    const { data: documents, error: docsError } = await documentsQuery;
    
    if (docsError) {
      console.error('Error obteniendo documentos:', docsError);
      throw new Error(`Error obteniendo documentos: ${docsError.message}`);
    }

    // Consulta de usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');
    
    if (usersError) {
      console.warn('Error obteniendo usuarios:', usersError);
    }

    // Consulta de actividades
    const activitiesQuery = supabase
      .from('activities')
      .select(`
        id, 
        action, 
        created_at,
        user_id,
        users!inner(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Aumentamos el límite para mejores gráficas
    
    if (ownerId) {
      activitiesQuery.eq('user_id', ownerId);
    }

    const { data: activities, error: activitiesError } = await activitiesQuery;
    
    if (activitiesError) {
      console.warn('Error obteniendo actividades:', activitiesError);
    }

    // Procesar estadísticas
    const totalDocuments = documents?.length ?? 0;
    const totalUsers = ownerId ? 1 : (users?.length ?? 0);
    
    // Agrupar documentos por estado
    const documentsByStatus: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?.forEach((doc: any) => {
      const status = doc.status ?? 'uploaded';
      documentsByStatus[status] = (documentsByStatus[status] ?? 0) + 1;
    });

    // Procesar actividades recientes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentActivities = activities?.map((activity: any) => ({
      action: activity.action,
      created_at: activity.created_at,
      user_name: activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : 'Usuario'
    })) ?? [];

    return {
      total_documents: totalDocuments,
      total_users: totalUsers,
      total_ocr_pages: 0, // Por ahora 0, se puede implementar después
      total_activities: activities?.length ?? 0,
      documents_by_status: documentsByStatus,
      recent_activities: recentActivities
    };

  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    
    // Devolver estadísticas por defecto en caso de error
    return {
      total_documents: 0,
      total_users: 0,
      total_ocr_pages: 0,
      total_activities: 0,
      documents_by_status: {},
      recent_activities: []
    };
  }
}

/**
 * Obtiene datos para gráficas de actividad por día
 */
export async function getActivityChartData(clerkUserId?: string, days = 30): Promise<{
  daily_activity: { date: string; documents: number; activities: number }[];
  hourly_activity: { hour: number; count: number }[];
  status_distribution: { status: string; count: number; percentage: number }[];
}> {
  const supabase = getSupabaseServerClient();
  
  try {
    let ownerId: string | null = null;
    
    if (clerkUserId) {
      try {
        ownerId = await getUserIdFromClerk(clerkUserId);
      } catch {
        console.warn('Usuario no encontrado para gráficas:', clerkUserId);
      }
    }

    // Fecha de inicio (últimos N días)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Actividad diaria
    const activitiesQuery = supabase
      .from('activities')
      .select('created_at, action')
      .gte('created_at', startDateStr);
    
    if (ownerId) {
      activitiesQuery.eq('user_id', ownerId);
    }

    const { data: activities } = await activitiesQuery;

    // Documentos por día
    const documentsQuery = supabase
      .from('documents')
      .select('created_at, status')
      .gte('created_at', startDateStr);
    
    if (ownerId) {
      documentsQuery.eq('owner_id', ownerId);
    }

    const { data: documents } = await documentsQuery;

    // Procesar datos diarios
    const dailyData: Record<string, { documents: number; activities: number }> = {};
    
    // Inicializar todos los días con 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      dailyData[dateStr] = { documents: 0, activities: 0 };
    }

    // Contar actividades por día
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activities?.forEach((activity: any) => {
      const date = activity.created_at?.split('T')[0];
      if (date && dailyData[date]) {
        dailyData[date].activities++;
      }
    });

    // Contar documentos por día
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?.forEach((doc: any) => {
      const date = doc.created_at?.split('T')[0];
      if (date && dailyData[date]) {
        dailyData[date].documents++;
      }
    });

    const daily_activity = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Actividad por hora del día
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activities?.forEach((activity: any) => {
      const createdAt = activity.created_at as string;
      if (createdAt) {
        const hour = new Date(createdAt).getHours();
        hourlyData[hour] = (hourlyData[hour] ?? 0) + 1;
      }
    });

    const hourly_activity = Object.entries(hourlyData).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));

    // Distribución por estado
    const statusCounts: Record<string, number> = {};
    let totalDocs = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?.forEach((doc: any) => {
      const status = doc.status ?? 'uploaded';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      totalDocs++;
    });

    const status_distribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0
    }));

    return {
      daily_activity,
      hourly_activity,
      status_distribution
    };

  } catch (error) {
    console.error('Error obteniendo datos de gráficas:', error);
    return {
      daily_activity: [],
      hourly_activity: [],
      status_distribution: []
    };
  }
}

/**
 * Agrega etiquetas a un documento
 */
export async function addDocumentTags(documentId: string, tags: string[]): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const tagInserts = tags.map(tag => ({
    document_id: documentId,
    tag: tag.trim(),
    color: getRandomTagColor()
  }));

  const { error } = await supabase
    .from('document_tags')
    .insert(tagInserts);

  if (error) {
    console.error('Error agregando etiquetas:', error);
    throw new Error(`Error agregando etiquetas: ${error.message}`);
  }
}

/**
 * Obtiene todas las actividades recientes
 */
export async function getRecentActivities(limit = 50): Promise<Activity[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error obteniendo actividades:', error);
    throw new Error(`Error obteniendo actividades: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Obtiene configuración del sistema
 */
export async function getSetting(key: string): Promise<unknown> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Error obteniendo configuración ${key}:`, error);
    return null;
  }

  return data?.value;
}

/**
 * Actualiza configuración del sistema
 */
export async function updateSetting(
  key: string, 
  value: unknown, 
  updatedBy: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const userId = await getUserIdFromClerk(updatedBy);
  
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_by: userId
    });

  if (error) {
    console.error(`Error actualizando configuración ${key}:`, error);
    throw new Error(`Error actualizando configuración: ${error.message}`);
  }
}

/**
 * Funciones auxiliares
 */

// Obtiene el ID interno de usuario a partir del clerk_user_id
export async function getUserIdFromClerk(clerkUserId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  
  // Primero intentar obtener el usuario existente
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Si no existe, crear un usuario básico usando información de Clerk
  console.log('Usuario no encontrado en BD, creando registro para:', clerkUserId);
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email: `user_${clerkUserId}@clerk.local`, // Email temporal único
      first_name: 'Usuario',
      last_name: 'Clerk',
      role: 'empleado'
    })
    .select('id')
    .single();

  if (createError || !newUser) {
    console.error('Error creando usuario en BD:', createError);
    throw new Error(`Error creando usuario: ${createError?.message ?? 'Desconocido'}`);
  }

  console.log('✅ Usuario creado en BD:', newUser.id);
  return newUser.id;
}

// Registra una actividad en el sistema
async function logActivity(
  clerkUserId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  try {
    const userId = await getUserIdFromClerk(clerkUserId);
    
    await supabase
      .from('activities')
      .insert({
        user_id: userId,
        action,
        metadata
      });
  } catch (error) {
    console.error('Error registrando actividad:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

// Genera un color aleatorio para etiquetas
function getRandomTagColor(): string {
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
  ];
  
  return colors[Math.floor(Math.random() * colors.length)] ?? '#6B7280';
}

// Obtiene todos los usuarios
export async function getAllUsers(): Promise<User[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo usuarios:', error);
    throw new Error(`Error obteniendo usuarios: ${error.message}`);
  }

  return data ?? [];
}

// Obtiene todas las categorías de documentos
export async function getDocumentCategories(): Promise<{ id: string; name: string; description?: string; created_at: string }[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error obteniendo categorías:', error);
    throw new Error(`Error obteniendo categorías: ${error.message}`);
  }

  return data ?? [];
}