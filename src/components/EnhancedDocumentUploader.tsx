"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import DocumentViewer from "./DocumentViewer";
import Tesseract from "tesseract.js";

interface OCRResult {
  text: string;
  confidence: number;
  processing_time: number;
}

interface OCROptions {
  language: string;
  preprocessed: boolean;
  enhanced: boolean;
}


export default function EnhancedDocumentUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [ocrOptions, setOcrOptions] = useState<OCROptions>({
    language: 'spa+eng',
    preprocessed: true,
    enhanced: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Función para capturar desde la cámara (móvil)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Usar cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
        setShowCamera(true);
      }
    } catch (err) {
      setError('Error al acceder a la cámara: ' + (err as Error).message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        void handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setShowCamera(false);
    }
  };

  // Función para preprocesar la imagen y mejorar OCR
  const preprocessImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        if (!ctx) {
          resolve(file);
          return;
        }
        
        // Redimensionar para mejor procesamiento
        const maxWidth = 2000;
        const maxHeight = 2000;
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen
        ctx.drawImage(img, 0, 0, width, height);
        
        // Aplicar filtros para mejorar OCR
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Aumentar contraste y convertir a escala de grises
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const gray = r * 0.3 + g * 0.59 + b * 0.11;
          const contrast = ((gray - 128) * 1.5) + 128;
          const enhanced = Math.min(255, Math.max(0, contrast));
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha remains the same
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const enhancedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(enhancedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file?: File) => {
    const selectedFile = file ?? fileInputRef.current?.files?.[0];
    if (selectedFile) {
      // Verificar que sea una imagen o PDF
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setSelectedFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError(null);
        setOcrResult(null);
        
        // Mostrar el DocumentViewer inmediatamente
        setShowDocumentViewer(true);
      } else {
        setError('Por favor selecciona un archivo de imagen (PNG, JPG, etc.) o PDF');
      }
    }
  };

  const processOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const startTime = Date.now();

    try {
      // Preprocesar imagen si está habilitado
      const fileToProcess = ocrOptions.preprocessed 
        ? await preprocessImage(selectedFile)
        : selectedFile;

      // Configuración avanzada de Tesseract para mayor precisión
      const worker = await Tesseract.createWorker(ocrOptions.language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Configurar parámetros de OCR para mayor precisión
      await worker.setParameters({
        tessedit_page_seg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789áéíóúñüÁÉÍÓÚÑÜ.,;:!?()[]{}+-=@#$%&*/ ',
        preserve_interword_spaces: '1',
      });

      const { data: { text, confidence } } = await worker.recognize(fileToProcess);
      const processingTime = Date.now() - startTime;

      // Post-procesamiento del texto
      const cleanedText = text
        .replace(/\n{3,}/g, '\n\n') // Reducir líneas vacías múltiples
        .replace(/\s{2,}/g, ' ')    // Reducir espacios múltiples
        .trim();

      setOcrResult({
        text: cleanedText,
        confidence: Math.round(confidence),
        processing_time: processingTime
      });

      await worker.terminate();
    } catch (err) {
      setError('Error al procesar el OCR: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const saveDocument = async () => {
    if (!ocrResult || !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('ocrText', ocrResult.text);
      formData.append('confidence', ocrResult.confidence.toString());

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Documento guardado exitosamente!');
        // Reset form
        setSelectedFile(null);
        setOcrResult(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Error al guardar el documento');
      }
    } catch (err) {
      setError('Error al guardar: ' + (err as Error).message);
    }
  };


  const handleViewerClose = () => {
    setShowDocumentViewer(false);
    // Optionally reset file selection
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Subir Documento con OCR Mejorado</h2>
      
      {/* OCR Options */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Opciones de OCR</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="language-select" className="block text-xs font-medium text-gray-600 mb-1">
              Idioma
            </label>
            <select
              id="language-select"
              value={ocrOptions.language}
              onChange={(e) => setOcrOptions({...ocrOptions, language: e.target.value})}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="spa+eng">Español + Inglés</option>
              <option value="spa">Solo Español</option>
              <option value="eng">Solo Inglés</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="preprocessed"
              checked={ocrOptions.preprocessed}
              onChange={(e) => setOcrOptions({...ocrOptions, preprocessed: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="preprocessed" className="text-xs text-gray-600">
              Mejorar imagen automáticamente
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enhanced"
              checked={ocrOptions.enhanced}
              onChange={(e) => setOcrOptions({...ocrOptions, enhanced: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="enhanced" className="text-xs text-gray-600">
              Configuración avanzada
            </label>
          </div>
        </div>
      </div>

      {/* Camera Section */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <Button
            onClick={startCamera}
            variant="outline"
            className="flex-1 md:flex-none"
            disabled={showCamera}
          >
            📱 Usar Cámara
          </Button>
          <label htmlFor="file-upload" className="flex-1">
            <Button variant="outline" className="w-full" asChild>
              <span>📁 Seleccionar Archivo</span>
            </Button>
          </label>
        </div>
        
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(_e) => handleFileSelect()}
          className="hidden"
        />
      </div>

      {/* Camera View */}
      {showCamera && (
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full max-h-96 object-cover"
              playsInline
              muted
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button onClick={capturePhoto} size="lg" className="rounded-full">
                📸 Capturar
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg" className="rounded-full">
                ❌ Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      {selectedFile && previewUrl && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h3>
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Vista previa del documento"
              width={400}
              height={300}
              className="max-w-full max-h-64 object-contain border rounded-lg mx-auto"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 text-center">
            Archivo: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </div>
        </div>
      )}

      {/* Process Button */}
      {selectedFile && !ocrResult && (
        <div className="mb-6">
          <Button
            onClick={processOCR}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Procesando OCR...' : '🔍 Procesar con OCR Mejorado'}
          </Button>
          
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso del OCR</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-gray-500 mt-1 text-center">
                Aplicando filtros de mejora de imagen y configuración avanzada...
              </div>
            </div>
          )}
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Resultado del OCR</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium">Confianza:</span> 
                <span className={`ml-1 ${ocrResult.confidence > 80 ? 'text-green-600' : ocrResult.confidence > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {ocrResult.confidence}%
                </span>
              </div>
              <div>
                <span className="font-medium">Tiempo:</span> {ocrResult.processing_time}ms
              </div>
            </div>
            
            <div>
              <label htmlFor="extracted-text" className="font-medium text-sm block mb-2">
                Texto Extraído:
              </label>
              <textarea
                id="extracted-text"
                value={ocrResult.text}
                onChange={(e) => setOcrResult({...ocrResult, text: e.target.value})}
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={8}
                placeholder="Texto extraído aparecerá aquí..."
              />
            </div>
          </div>

          <Button
            onClick={saveDocument}
            className="w-full"
            size="lg"
          >
            💾 Guardar Documento
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Tips for mobile */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Consejos para mejor OCR:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Mantén el documento bien iluminado y sin sombras</li>
          <li>• Asegúrate de que el texto esté enfocado y nítido</li>
          <li>• Evita inclinaciones, mantén el documento paralelo a la cámara</li>
          <li>• En móviles, usa la opción &quot;Usar Cámara&quot; para mejor calidad</li>
          <li>• Habilita &quot;Mejorar imagen automáticamente&quot; para mejor precisión</li>
        </ul>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedFile && (
        <DocumentViewer
          file={selectedFile}
          onClose={handleViewerClose}
        />
      )}
    </div>
  );
}