"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import Tesseract from "tesseract.js";

interface OCRResult {
  text: string;
  confidence: number;
  processing_time: number;
}

export default function DocumentUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar que sea una imagen
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
        setOcrResult(null);
      } else {
        setError('Por favor selecciona un archivo de imagen (PNG, JPG, etc.)');
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
      const worker = await Tesseract.createWorker('spa+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text, confidence } } = await worker.recognize(selectedFile);
      const processingTime = Date.now() - startTime;

      setOcrResult({
        text: text.trim(),
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
        await response.json();
        alert('Documento guardado exitosamente!');
        // Reset form
        setSelectedFile(null);
        setOcrResult(null);
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Subir Documento con OCR</h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Imagen
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          title="Seleccionar archivo de imagen"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
      </div>

      {/* Preview */}
      {selectedFile && (
        <div className="mb-6">
          <div className="relative w-full h-64">
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              fill
              className="object-contain border rounded-lg"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
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
          >
            {isProcessing ? 'Procesando OCR...' : 'Procesar con OCR'}
          </Button>
          
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso del OCR</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
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
                <span className="font-medium">Confianza:</span> {ocrResult.confidence}%
              </div>
              <div>
                <span className="font-medium">Tiempo:</span> {ocrResult.processing_time}ms
              </div>
            </div>
            
            <div>
              <span className="font-medium text-sm">Texto Extraído:</span>
              <textarea
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
            variant="default"
          >
            Guardar Documento
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}