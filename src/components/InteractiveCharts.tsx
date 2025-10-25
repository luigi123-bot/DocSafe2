"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '~/hooks/useAuth';

interface ChartData {
  daily_activity: { date: string; documents: number; activities: number }[];
  hourly_activity: { hour: number; count: number }[];
  status_distribution: { status: string; count: number; percentage: number }[];
}

interface InteractiveChartsProps {
  className?: string;
}

export default function InteractiveCharts({ className = "" }: InteractiveChartsProps) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData>({
    daily_activity: [],
    hourly_activity: [],
    status_distribution: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'daily' | 'hourly' | 'status'>('daily');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando datos de gráficas dinámicas...');
      
      const response = await fetch(`/api/charts?type=all&days=${timeRange}`);
      if (response.ok) {
        const data = await response.json() as ChartData;
        setChartData(data);
        console.log('📈 Datos de gráficas cargados:', data);
      } else {
        console.error('❌ Error en respuesta de API:', response.status);
        // Datos de fallback
        setChartData({
          daily_activity: [],
          hourly_activity: [],
          status_distribution: []
        });
      }
    } catch (error) {
      console.error('❌ Error cargando gráficas:', error);
      // Datos de fallback
      setChartData({
        daily_activity: [],
        hourly_activity: [],
        status_distribution: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user) {
      void loadChartData();
    }
  }, [user, loadChartData]);

  const generateDailyPath = (data: typeof chartData.daily_activity, key: 'documents' | 'activities') => {
    if (data.length === 0) return '';
    
    const width = 800;
    const height = 300;
    const padding = 60;
    
    const maxValue = Math.max(...data.map(d => d[key]), 1);
    const minValue = 0;
    
    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(data.length - 1, 1);
      const y = height - padding - ((d[key] - minValue) / Math.max(maxValue - minValue, 1)) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      uploaded: '#3B82F6',
      processing: '#F59E0B',
      processed: '#10B981',
      error: '#EF4444',
      ocr_failed: '#DC2626'
    };
    return colors[status] ?? '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      uploaded: 'Subidos',
      processing: 'Procesando',
      processed: 'Procesados',
      error: 'Con Error',
      ocr_failed: 'Error OCR'
    };
    return labels[status] ?? status;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Análisis de Actividad
          </h2>
          <p className="text-sm text-gray-500">
            Datos en tiempo real de tus documentos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            title="Seleccionar rango de tiempo"
            aria-label="Seleccionar rango de tiempo"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={15}>Últimos 15 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 3 meses</option>
          </select>

          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'daily' as const, label: 'Diario', icon: '📊' },
              { key: 'hourly' as const, label: 'Por Hora', icon: '🕐' },
              { key: 'status' as const, label: 'Estados', icon: '📈' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setSelectedChart(key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedChart === key
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-80 relative">
        {selectedChart === 'daily' && (
          <div className="h-full">
            {chartData.daily_activity.length > 0 ? (
              <svg viewBox="0 0 800 300" className="w-full h-full">
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Documents Line */}
                <defs>
                  <linearGradient id="documentsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const path = generateDailyPath(chartData.daily_activity, 'documents');
                  return path && (
                    <>
                      <path
                        d={`${path} L 740,240 L 60,240 Z`}
                        fill="url(#documentsGradient)"
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  );
                })()}
                
                {/* Activities Line */}
                {(() => {
                  const path = generateDailyPath(chartData.daily_activity, 'activities');
                  return path && (
                    <path
                      d={path}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="5,5"
                    />
                  );
                })()}
                
                {/* Data Points */}
                {chartData.daily_activity.map((d, i) => {
                  const width = 800;
                  const height = 300;
                  const padding = 60;
                  const maxDocs = Math.max(...chartData.daily_activity.map(d => d.documents), 1);
                  const maxActs = Math.max(...chartData.daily_activity.map(d => d.activities), 1);
                  
                  const x = padding + (i * (width - 2 * padding)) / Math.max(chartData.daily_activity.length - 1, 1);
                  const yDocs = height - padding - (d.documents / maxDocs) * (height - 2 * padding);
                  const yActs = height - padding - (d.activities / maxActs) * (height - 2 * padding);
                  
                  return (
                    <g key={i}>
                      {/* Documents point */}
                      <circle
                        cx={x}
                        cy={yDocs}
                        r={hoveredPoint === i ? "6" : "4"}
                        fill="#3B82F6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      />
                      {/* Activities point */}
                      <circle
                        cx={x}
                        cy={yActs}
                        r={hoveredPoint === i ? "6" : "4"}
                        fill="#EF4444"
                        stroke="#ffffff"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      />
                      
                      {/* Tooltip */}
                      {hoveredPoint === i && (
                        <g>
                          <rect
                            x={x - 40}
                            y={Math.min(yDocs, yActs) - 50}
                            width="80"
                            height="45"
                            fill="#1F2937"
                            rx="4"
                            opacity="0.9"
                          />
                          <text
                            x={x}
                            y={Math.min(yDocs, yActs) - 35}
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            {formatDate(d.date)}
                          </text>
                          <text
                            x={x}
                            y={Math.min(yDocs, yActs) - 20}
                            textAnchor="middle"
                            fill="#93C5FD"
                            fontSize="11"
                          >
                            📄 {d.documents}
                          </text>
                          <text
                            x={x}
                            y={Math.min(yDocs, yActs) - 8}
                            textAnchor="middle"
                            fill="#FCA5A5"
                            fontSize="11"
                          >
                            ⚡ {d.activities}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                
                {/* X-axis labels */}
                {chartData.daily_activity.map((d, i) => {
                  if (i % Math.ceil(chartData.daily_activity.length / 8) === 0) {
                    const x = 60 + (i * 680) / Math.max(chartData.daily_activity.length - 1, 1);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={285}
                        textAnchor="middle"
                        fill="#6B7280"
                        fontSize="12"
                      >
                        {formatDate(d.date)}
                      </text>
                    );
                  }
                  return null;
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No hay datos de actividad diaria</p>
                </div>
              </div>
            )}
            
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
                  <span>Documentos</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-red-500 border-dashed border-t mr-2"></div>
                  <span>Actividades</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChart === 'hourly' && (
          <div className="h-full">
            {chartData.hourly_activity.length > 0 ? (
              <div className="h-full flex items-end space-x-1 px-4">
                {chartData.hourly_activity.map((d, i) => {
                  const maxValue = Math.max(...chartData.hourly_activity.map(h => h.count), 1);
                  const height = Math.max((d.count / maxValue) * 250, 2);
                  
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <div className="relative">
                        {hoveredPoint === i && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                            {d.count} actividades
                          </div>
                        )}
                        <div
                          className={`w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm transition-all duration-300 ${
                            hoveredPoint === i ? 'opacity-100' : 'opacity-80'
                          }`}
                          style={{ height: `${height}px` }}
                        />
                      </div>
                      {i % 2 === 0 && (
                        <span className="text-xs text-gray-500 mt-2">
                          {formatHour(d.hour)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🕐</div>
                  <p>No hay datos de actividad por hora</p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedChart === 'status' && (
          <div className="h-full">
            {chartData.status_distribution.length > 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {(() => {
                      let currentAngle = 0;
                      const total = chartData.status_distribution.reduce((sum, d) => sum + d.count, 0);
                      
                      return chartData.status_distribution.map((d, i) => {
                        const percentage = total > 0 ? d.count / total : 0;
                        const angle = percentage * 360;
                        const radius = 80;
                        const centerX = 100;
                        const centerY = 100;
                        
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle += angle;
                        
                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;
                        
                        const x1 = centerX + radius * Math.cos(startAngleRad);
                        const y1 = centerY + radius * Math.sin(startAngleRad);
                        const x2 = centerX + radius * Math.cos(endAngleRad);
                        const y2 = centerY + radius * Math.sin(endAngleRad);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        return (
                          <path
                            key={i}
                            d={pathData}
                            fill={getStatusColor(d.status)}
                            stroke="white"
                            strokeWidth="2"
                            className="transition-opacity duration-300 hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.status_distribution.reduce((sum, d) => sum + d.count, 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="ml-8 space-y-2">
                  {chartData.status_distribution.map((d) => (
                    <div key={d.status} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3 inline-block"
                        style={{ backgroundColor: getStatusColor(d.status) }}
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {getStatusLabel(d.status)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 ml-3">
                        {d.count} ({d.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No hay datos de distribución de estados</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData.daily_activity.reduce((sum, d) => sum + d.documents, 0)}
            </div>
            <div className="text-sm text-gray-500">Documentos Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {chartData.daily_activity.reduce((sum, d) => sum + d.activities, 0)}
            </div>
            <div className="text-sm text-gray-500">Actividades Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {chartData.daily_activity.length > 0 
                ? Math.round(chartData.daily_activity.reduce((sum, d) => sum + d.documents, 0) / chartData.daily_activity.length * 10) / 10
                : 0}
            </div>
            <div className="text-sm text-gray-500">Promedio Diario</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {chartData.hourly_activity.length > 0 
                ? chartData.hourly_activity.reduce((max, h) => Math.max(max, h.count), 0)
                : 0}
            </div>
            <div className="text-sm text-gray-500">Pico de Actividad</div>
          </div>
        </div>
      </div>
    </div>
  );
}