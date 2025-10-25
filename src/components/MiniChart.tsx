"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '~/hooks/useAuth';

interface MiniChartProps {
  title: string;
  type: 'documents' | 'activities' | 'processing';
  className?: string;
}

export default function MiniChart({ title, type, className = "" }: MiniChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMiniChartData = useCallback(async () => {
    try {
      const response = await fetch(`/api/charts?type=daily&days=7`);
      if (response.ok) {
        const chartData = await response.json() as { date: string; documents: number; activities: number }[];
        
        let values: number[] = [];
        let currentTotal = 0;
        
        switch (type) {
          case 'documents':
            values = chartData.map(d => d.documents);
            currentTotal = chartData.reduce((sum, d) => sum + d.documents, 0);
            break;
          case 'activities':
            values = chartData.map(d => d.activities);
            currentTotal = chartData.reduce((sum, d) => sum + d.activities, 0);
            break;
          case 'processing':
            // Para processing, simulamos datos basados en documentos
            values = chartData.map(d => Math.floor(d.documents * 0.3));
            currentTotal = values.reduce((sum, val) => sum + val, 0);
            break;
        }
        
        setData(values);
        setTotal(currentTotal);
        
        // Calcular cambio porcentual
        if (values.length >= 2) {
          const latest = values[values.length - 1] ?? 0;
          const previous = values[values.length - 2] ?? 0;
          const changePercent = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
          setChange(changePercent);
        }
      }
    } catch (error) {
      console.error('Error cargando mini gráfica:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const generateSparkline = () => {
    if (data.length === 0) return '';
    
    const width = 100;
    const height = 40;
    const maxValue = Math.max(...data, 1);
    
    const points = data.map((value, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  useEffect(() => {
    if (user) {
      void loadMiniChartData();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        void loadMiniChartData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, loadMiniChartData]);

  const getColorClasses = () => {
    switch (type) {
      case 'documents':
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          line: '#3B82F6',
          gradient: '#3B82F6'
        };
      case 'activities':
        return {
          bg: 'bg-red-50',
          icon: 'text-red-600',
          line: '#EF4444',
          gradient: '#EF4444'
        };
      case 'processing':
        return {
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          line: '#F59E0B',
          gradient: '#F59E0B'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'documents':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'activities':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
    }
  };

  const colors = getColorClasses();
  const sparklinePath = generateSparkline();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>
            {getIcon()}
          </div>
        </div>
        
        {change !== 0 && (
          <div className={`flex items-center text-sm ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <svg 
              className={`w-3 h-3 mr-1 transform ${change > 0 ? '' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
      </div>
      
      <div className="h-10 relative">
        {data.length > 0 ? (
          <svg viewBox="0 0 100 40" className="w-full h-full">
            {/* Area under curve */}
            <defs>
              <linearGradient id={`miniGradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.gradient} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={colors.gradient} stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            {sparklinePath && (
              <>
                <path
                  d={`${sparklinePath} L 100,40 L 0,40 Z`}
                  fill={`url(#miniGradient-${type})`}
                />
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={colors.line}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            
            {/* Data points */}
            {data.map((value, i) => {
              const maxValue = Math.max(...data, 1);
              const x = (i / Math.max(data.length - 1, 1)) * 100;
              const y = 40 - (value / maxValue) * 40;
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={colors.line}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            Sin datos
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Últimos 7 días
      </div>
    </div>
  );
}