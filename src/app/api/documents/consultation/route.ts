// src/app/api/documents/consultation/route.ts
// API para consulta de documentos por usuarios regulares

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '~/lib/supabase';


interface DocumentFilter {
  search?: string;
  type?: string;
  category?: string;
  user?: string;
  folder_id?: string;
  date?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

// GET - Listar documentos para consulta
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      console.log('❌ Usuario no autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('✅ Usuario autorizado:', clerkUserId);

    const { searchParams } = new URL(request.url);
    
    const filters: DocumentFilter = {
      search: searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      user: searchParams.get('user') ?? undefined,
      folder_id: searchParams.get('folder_id') ?? undefined,
      date: searchParams.get('date') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '10'),
      sortBy: searchParams.get('sortBy') ?? 'created_at',
      sortOrder: searchParams.get('sortOrder') ?? 'desc'
    };
    console.log('📋 Obteniendo documentos para consulta con filtros:', filters);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supabase = getSupabaseServerClient();
    
    // Construir query base - Versión simplificada para evitar problemas de relación
    console.log('📋 Ejecutando consulta simplificada...');
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    let query = supabase
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .from('documents')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .select(`
        id,
        title,
        filename,
        status,
        mime_type,
        file_size,
        created_at,
        storage_path,
        owner_id,
        page_count,
        updated_at
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      query = query.or(`title.ilike.%${filters.search}%,filename.ilike.%${filters.search}%`);
    }

    if (filters.type) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      query = query.eq('mime_type', filters.type);
    }

    // Nota: category no existe en la tabla documents, se maneja por relaciones separadas

    // Nota: folder_id no existe en la tabla documents actual, se puede implementar más tarde

    if (filters.date) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      query = query.gte('created_at', `${filters.date}-01`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      query = query.lt('created_at', `${filters.date}-31`);
    }

    // Ordenamiento
    const validSortFields = ['title', 'created_at', 'filename', 'status', 'file_size', 'updated_at'];
    const sortField = validSortFields.includes(filters.sortBy ?? '') ? filters.sortBy : 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    query = query.order(sortField!, sortOrder);

    // Paginación
    const offset = ((filters.page ?? 1) - 1) * (filters.limit ?? 10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    query = query.range(offset, offset + (filters.limit ?? 10) - 1);

    console.log('📋 Ejecutando consulta a Supabase...');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error obteniendo documentos:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Error obteniendo documentos: ${error.message}`);
    }

    console.log('📋 Datos obtenidos de Supabase:', data);

    // Transformar datos - usando las columnas reales de la base de datos
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const documentsWithDetails = (data ?? []).map((doc: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: doc.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      title: doc.title,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      filename: doc.filename,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      status: doc.status,
      category: 'General', // Valor predeterminado - las categorías se manejan por relaciones separadas
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      document_type: doc.mime_type ?? 'application/octet-stream', // Usar mime_type como document_type
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      file_size: doc.file_size,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      created_at: doc.created_at,
      folder_id: null, // Por ahora null hasta que se implemente la relación con carpetas
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      file_path: doc.storage_path, // Usar storage_path como file_path
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      owner_name: `Usuario ${doc.owner_id}`, // Simplificado por ahora
      owner_email: '',
      folder_name: null,
      folder_color: null
    }));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const total = count ?? 0;
    const pages = Math.ceil(total / (filters.limit ?? 10));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log(`📋 Devolviendo ${documentsWithDetails.length} documentos de ${total} totales`);

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: documentsWithDetails,
      pagination: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        total,
        pages,
        current_page: filters.page,
        per_page: filters.limit
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/documents/consultation:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
