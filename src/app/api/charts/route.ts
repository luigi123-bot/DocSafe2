// src/app/api/charts/route.ts
// API para obtener datos de gráficas dinámicas

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getActivityChartData } from '~/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'daily';
    const days = parseInt(searchParams.get('days') ?? '30');

    console.log(`📊 Obteniendo datos de gráficas: type=${type}, days=${days}, user=${clerkUserId}`);

    // Obtener datos de gráficas
    const chartData = await getActivityChartData(clerkUserId, days);

    switch (type) {
      case 'daily':
        return NextResponse.json(chartData.daily_activity);
      
      case 'hourly':
        return NextResponse.json(chartData.hourly_activity);
      
      case 'status':
        return NextResponse.json(chartData.status_distribution);
      
      case 'all':
        return NextResponse.json(chartData);
      
      default:
        return NextResponse.json(chartData.daily_activity);
    }

  } catch (error) {
    console.error('❌ Error en API de gráficas:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}