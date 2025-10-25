// src/app/api/documents/route.ts
// API para gestión de documentos conectada a la base de datos

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '~/lib/supabase';

interface DocumentResponse {
  id: string;
  title: string;
  filename: string;
  status: string;
  category: string;
  document_type?: string;
  file_size: number;
  created_at: string;
  owner_name: string;
  owner_email: string;
  folder_name?: string;
  folder_color?: string;
  folder_id?: string;
}

interface FolderResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  document_count: number;
}

// GET - Listar documentos con filtros desde la base de datos
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const dateFilter = searchParams.get('date') ?? '';
    const typeFilter = searchParams.get('type') ?? '';
    const categoryFilter = searchParams.get('category') ?? '';
    const folderFilter = searchParams.get('folder') ?? '';
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');

    const supabase = getSupabaseServerClient();

    // Construir query para documentos
    let documentsQuery = supabase
      .from('documents')
      .select(`
        id,
        title,
        filename,
        status,
        category,
        document_type,
        file_size,
        created_at,
        folder_id,
        users!inner(first_name, last_name, email),
        document_folders(id, name, color)
      `, { count: 'exact' });

    // Aplicar filtros
    if (search) {
      documentsQuery = documentsQuery.or(`title.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    if (dateFilter) {
      documentsQuery = documentsQuery.gte('created_at', `${dateFilter}-01`);
      documentsQuery = documentsQuery.lt('created_at', `${dateFilter}-31`);
    }

    if (typeFilter) {
      documentsQuery = documentsQuery.eq('document_type', typeFilter);
    }

    if (categoryFilter) {
      documentsQuery = documentsQuery.eq('category', categoryFilter);
    }

    if (folderFilter) {
      if (folderFilter === 'null') {
        documentsQuery = documentsQuery.is('folder_id', null);
      } else {
        documentsQuery = documentsQuery.eq('folder_id', folderFilter);
      }
    }

    // Ordenamiento
    const validSortFields = ['title', 'created_at', 'document_type', 'category'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    documentsQuery = documentsQuery.order(field, { ascending: sortOrder === 'asc' });

    // Paginación
    const offset = (page - 1) * limit;
    documentsQuery = documentsQuery.range(offset, offset + limit - 1);

    const { data: documentsData, error: documentsError, count } = await documentsQuery;

    if (documentsError) {
      console.error('Error obteniendo documentos:', documentsError);
      throw new Error(`Error obteniendo documentos: ${documentsError.message}`);
    }

    // Obtener carpetas
    const { data: foldersData, error: foldersError } = await supabase
      .from('document_folders')
      .select(`
        id,
        name,
        description,
        color,
        created_at,
        documents(count)
      `)
      .order('name');

    if (foldersError) {
      console.error('Error obteniendo carpetas:', foldersError);
    }

    // Transformar datos de documentos
    const documents: DocumentResponse[] = (documentsData ?? []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      status: doc.status,
      category: doc.category,
      document_type: doc.document_type,
      file_size: doc.file_size,
      created_at: doc.created_at,
      folder_id: doc.folder_id,
      owner_name: doc.users ? `${doc.users.first_name} ${doc.users.last_name}` : 'Usuario',
      owner_email: doc.users?.email ?? '',
      folder_name: doc.document_folders?.name ?? undefined,
      folder_color: doc.document_folders?.color ?? undefined
    }));

    // Transformar datos de carpetas
    const folders: FolderResponse[] = (foldersData ?? []).map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      created_at: folder.created_at,
      document_count: folder.documents?.[0]?.count ?? 0
    }));

    // Obtener tipos, categorías y usuarios únicos para filtros
    const { data: filterData } = await supabase
      .from('documents')
      .select('document_type, category, users!inner(first_name, last_name)')
      .limit(1000);

    const types = [...new Set((filterData ?? []).map((doc: any) => doc.document_type).filter(Boolean))];
    const categories = [...new Set((filterData ?? []).map((doc: any) => doc.category).filter(Boolean))];
    const users = [...new Set((filterData ?? []).map((doc: any) => 
      doc.users ? `${doc.users.first_name} ${doc.users.last_name}` : ''
    ).filter(Boolean))];

    return NextResponse.json({
      documents,
      folders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count ?? 0) / limit),
        totalDocuments: count ?? 0,
        limit
      },
      filters: {
        types,
        categories,
        users
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

// PUT - Mover documentos a carpeta
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json() as { documentIds: string[]; folderId: string | null };
    const { documentIds, folderId } = body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs de documentos' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Mover documentos a la carpeta especificada
    const { error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .in('id', documentIds);

    if (error) {
      console.error('Error moviendo documentos:', error);
      return NextResponse.json(
        { error: 'Error moviendo documentos' },
        { status: 500 }
      );
    }

    // Obtener carpetas actualizadas
    const { data: foldersData } = await supabase
      .from('document_folders')
      .select(`
        id,
        name,
        color,
        documents(count)
      `)
      .order('name');

    const folders: FolderResponse[] = (foldersData ?? []).map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      document_count: folder.documents?.[0]?.count ?? 0
    }));

    return NextResponse.json({
      success: true,
      message: `${documentIds.length} documento(s) movido(s) exitosamente`,
      folders
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al mover documentos' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar documento
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del documento' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Eliminar documento de la base de datos
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error eliminando documento:', error);
      return NextResponse.json(
        { error: 'Error eliminando documento' },
        { status: 500 }
      );
    }

    // Obtener carpetas actualizadas
    const { data: foldersData } = await supabase
      .from('document_folders')
      .select(`
        id,
        name,
        color,
        documents(count)
      `)
      .order('name');

    const folders: FolderResponse[] = (foldersData ?? []).map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      document_count: folder.documents?.[0]?.count ?? 0
    }));

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      folders
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar documento' },
      { status: 500 }
    );
  }
}