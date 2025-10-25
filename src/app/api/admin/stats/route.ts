// src/app/api/admin/stats/route.ts
// API para estadísticas administrativas

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getAdminStats } from '~/lib/admin-documents';

// GET - Obtener estadísticas administrativas
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('📊 Obteniendo estadísticas administrativas...');

    const stats = await getAdminStats();

    // Formatear tamaño de storage
    const formatStorageSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        storage_usage_formatted: formatStorageSize(stats.storage_usage)
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/admin/stats:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}