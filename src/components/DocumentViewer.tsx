"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import Image from "next/image";
import styles from "./DocumentViewer.module.css";

interface DocumentViewerProps {
  file: File | null;
  onClose: () => void;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export default function DocumentViewer({ file, onClose }: DocumentViewerProps) {
  const [ocrText, setOcrText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [documentMetadata] = useState({
    category: "Financial Reports",
    type: file?.type.includes('pdf') ? 'PDF' : file?.type.includes('image') ? 'Image' : 'Document',
    uploadedBy: "Usuario Actual"
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  // Función auxiliar para aplicar transformaciones
  const applyTransform = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.style.setProperty('--zoom', String(zoomLevel / 100));
      element.style.setProperty('--rotation', `${rotation}deg`);
    }
  }, [zoomLevel, rotation]);

  // Aplicar transformaciones cuando cambien zoom o rotación
  useEffect(() => {
    applyTransform(transformRef.current);
  }, [applyTransform]);

  // Crear URL de la imagen de forma memoizada para evitar renders innecesarios
  useEffect(() => {
    let url: string | null = null;
    if (file?.type.startsWith('image/')) {
      url = URL.createObjectURL(file);
      void Promise.resolve().then(() => setImageUrl(url));
      return () => {
        setImageUrl(null);
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Función para mostrar toasts
  const showToast = (type: ToastMessage['type'], message: string, duration = 3000) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, message, duration };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  // Cerrar toast manualmente
  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Guardar en localStorage cuando cambian los datos
  useEffect(() => {
    if (file && (ocrText || ocrStatus !== 'idle')) {
      const dataToSave = {
        ocrText,
        ocrStatus,
        metadata: documentMetadata,
        zoomLevel,
        rotation,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(`document_${file.name}_${file.size}`, JSON.stringify(dataToSave));
    }
  }, [file, ocrText, ocrStatus, documentMetadata, zoomLevel, rotation]);

  // Funciones de zoom con toasts
  const handleZoomIn = () => {
    if (zoomLevel < 300) {
      setZoomLevel(prev => Math.min(prev + 25, 300));
      showToast('info', `Zoom: ${Math.min(zoomLevel + 25, 300)}%`, 1000);
    } else {
      showToast('warning', 'Zoom máximo alcanzado (300%)', 2000);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 25) {
      setZoomLevel(prev => Math.max(prev - 25, 25));
      showToast('info', `Zoom: ${Math.max(zoomLevel - 25, 25)}%`, 1000);
    } else {
      showToast('warning', 'Zoom mínimo alcanzado (25%)', 2000);
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    setRotation(0);
    showToast('success', 'Vista restaurada al 100%', 1500);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    showToast('info', `Rotado ${(rotation + 90) % 360}°`, 1000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    showToast('info', isFullscreen ? 'Modo ventana' : 'Modo pantalla completa', 1500);
  };

  // Simular proceso de OCR con toasts
  const processOCR = async () => {
    if (!file) return;

    setIsProcessing(true);
    setOcrStatus('processing');
    setOcrProgress(0);
    showToast('info', 'Iniciando procesamiento OCR...', 2000);

    // Simular progreso de OCR
    const progressInterval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Texto de ejemplo mejorado
      const mockOcrText = `INFORME FINANCIERO Q4 2023

DESTACADOS FINANCIEROS DEL CUARTO TRIMESTRE

Los ingresos totales para el cuarto trimestre alcanzaron $15.2 millones, un aumento del 12% interanual, impulsado por un sólido desempeño en el mercado norteamericano. 

La utilidad neta fue de $3.1 millones, o $0.45 por acción diluida, en comparación con $2.5 millones, o $0.37 por acción diluida, en el cuarto trimestre de 2022.

Los gastos operativos aumentaron un 8% debido a inversiones estratégicas en investigación y desarrollo e iniciativas de marketing para apoyar el lanzamiento de nuestro nuevo producto.

El efectivo y equivalentes de efectivo de la compañía totalizaron $23.8 millones al 31 de diciembre de 2023.

INDICADORES CLAVE DE RENDIMIENTO:
• Crecimiento de ingresos: 12% interanual
• Margen de utilidad neta: 20.4%
• Posición de efectivo: $23.8M
• Inversión en I+D: $2.1M

PERSPECTIVAS PARA 2024:
Se espera un crecimiento continuo del 15-18% en el próximo ejercicio fiscal, con un enfoque en la expansión internacional y desarrollo de productos innovadores.`;

      setOcrText(mockOcrText);
      setOcrStatus('complete');
      setIsProcessing(false);
      clearInterval(progressInterval);
      setOcrProgress(100);
      showToast('success', 'OCR completado exitosamente', 3000);
    } catch {
      setOcrStatus('error');
      setIsProcessing(false);
      clearInterval(progressInterval);
      showToast('error', 'Error durante el procesamiento OCR');
    }
  };

  if (!file) return null;

  // Toast Component
  const Toast = ({ toast }: { toast: ToastMessage }) => {
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }[toast.type];

    const icon = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[toast.type];

    return (
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 mb-2 transform transition-all duration-300 ease-out animate-in slide-in-from-right-full`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{toast.message}</span>
        <button 
          onClick={() => closeToast(toast.id)}
          className="ml-auto text-white hover:text-gray-200 text-lg leading-none"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal Container */}
        <div 
          ref={modalRef}
          className={`
            bg-white rounded-2xl shadow-2xl overflow-hidden
            transition-all duration-300 ease-out transform
            ${isFullscreen 
              ? 'w-full h-full max-w-none max-h-none' 
              : 'w-[95vw] h-[95vh] max-w-6xl max-h-[800px]'
            }
            flex flex-col
          `}
        >
          {/* Header */}
          <div className="bg-red-500 text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h1 className="text-lg font-bold truncate max-w-96">
                  {file.name}
                </h1>
                <p className="text-red-100 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {documentMetadata.type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                Zoom: {zoomLevel}%
              </span>
              <Button 
                onClick={handleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? '🗗' : '🗖'}
              </Button>
              <Button 
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                title="Cerrar modal"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex h-[calc(100%-80px)] overflow-hidden">
            {/* Document Viewer */}
            <div className="flex-1 bg-gray-50 flex flex-col min-h-0">
              {/* Document Preview */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" ref={imageContainerRef}>
                <div className="max-w-full max-h-full flex items-center justify-center">
                  {imageUrl ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl max-w-full max-h-full">
                      <div
                        ref={transformRef}
                        className={`transition-transform duration-200 ease-in-out origin-center ${styles.dynamicTransform}`}
                      >
                        <Image
                          src={imageUrl}
                          alt={file.name}
                          width={800}
                          height={1000}
                          className="block w-auto h-auto max-w-full max-h-[60vh] object-contain"
                          priority
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                      <div className="text-6xl mb-4 animate-pulse">📄</div>
                      <div className="text-xl text-gray-600 mb-2">
                        Vista previa no disponible
                      </div>
                      <div className="text-sm text-gray-500">
                        {file.type}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Controls */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg flex-shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 25}
                      className="px-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Zoom out"
                    >
                      🔍➖
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleZoomReset}
                      className="px-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Reset zoom y rotación"
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 300}
                      className="px-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Zoom in"
                    >
                      🔍➕
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRotate}
                      className="px-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                      title="Rotar 90°"
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Info Panel */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg">
              {/* Info Section - Solo mostrar datos, no editar */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white flex-shrink-0 max-h-80 overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center sticky top-0 bg-gradient-to-r from-red-50 to-white pb-2">
                  <span className="mr-2">📋</span>
                  Información del Documento
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <label className="block text-gray-500 text-xs font-medium mb-1">Subido por:</label>
                    <div className="font-medium text-gray-900 text-xs">{documentMetadata.uploadedBy}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white rounded-lg p-2 border border-gray-100 flex-1">
                      <label className="block text-gray-500 text-xs font-medium mb-1">Fecha:</label>
                      <div className="font-medium text-gray-900 text-xs">{new Date().toLocaleDateString('es-ES')}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-100 flex-1">
                      <label className="block text-gray-500 text-xs font-medium mb-1">Tamaño:</label>
                      <div className="font-medium text-gray-900 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white rounded-lg p-2 border border-gray-100 flex-1">
                      <label className="block text-gray-500 text-xs font-medium mb-1">Categoría:</label>
                      <div className="font-medium text-gray-900 text-xs">{documentMetadata.category}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-100 flex-1">
                      <label className="block text-gray-500 text-xs font-medium mb-1">Tipo:</label>
                      <div className="font-medium text-gray-900 text-xs">{documentMetadata.type}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OCR Section */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2">🔍</span>
                      OCR
                    </h3>
                    {ocrStatus === 'idle' && (
                      <Button 
                        onClick={processOCR}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 transition-all duration-200 shadow-md hover:shadow-lg"
                        size="sm"
                      >
                        🚀 Extraer
                      </Button>
                    )}
                    {ocrStatus === 'complete' && (
                      <Button 
                        onClick={processOCR}
                        variant="outline"
                        className="text-xs px-3 py-1 hover:bg-red-50 hover:border-red-300 transition-colors"
                        size="sm"
                      >
                        🔄 Re-extraer
                      </Button>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="mb-3 bg-white rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⏳</span>
                          Procesando...
                        </span>
                        <span className="font-medium text-red-600">{Math.round(ocrProgress)}%</span>
                      </div>
                      <Progress value={ocrProgress} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
                  {ocrStatus === 'complete' && (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <div className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded-full">
                          ✅ Texto extraído ({ocrText.length} chars)
                        </div>
                      </div>
                      <textarea
                        value={ocrText}
                        readOnly
                        className={`flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm leading-relaxed resize-none focus:outline-none min-h-0 ${styles.scrollableTextarea}`}
                        placeholder="El texto extraído aparecerá aquí..."
                      />
                    </div>
                  )}
                  
                  {ocrStatus === 'idle' && (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                      <div>
                        <div className="mb-3 text-4xl animate-pulse">📄</div>
                        <div className="text-lg font-medium mb-2">
                          Listo para procesar
                        </div>
                        <div className="text-sm">
                          Haz clic en &quot;Extraer&quot; para analizar este documento
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                      <div>
                        <div className="mb-3 text-4xl animate-spin">⏳</div>
                        <div className="text-lg font-medium mb-2">
                          Analizando...
                        </div>
                        <div className="text-sm">
                          Procesando el texto
                        </div>
                      </div>
                    </div>
                  )}

                  {ocrStatus === 'error' && (
                    <div className="flex-1 flex items-center justify-center text-center text-red-500">
                      <div>
                        <div className="mb-3 text-4xl">❌</div>
                        <div className="text-lg font-medium mb-2">
                          Error
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          Intenta nuevamente
                        </div>
                        <Button 
                          onClick={processOCR}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          size="sm"
                        >
                          🔄 Reintentar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Solo cerrar */}
              <div className="p-4 border-t border-gray-200 space-y-2 bg-gradient-to-r from-red-50 to-white flex-shrink-0">
                <Button 
                  onClick={onClose}
                  variant="outline" 
                  className="w-full hover:bg-gray-50 transition-colors"
                >
                  ❌ Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
}