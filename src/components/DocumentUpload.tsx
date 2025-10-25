"use client";

import { useState, useCallback, useEffect } from 'react';
import styles from './progress-bar.module.css';

interface DocumentUploadProps {
  onUploadSuccess?: (documentId: string) => void;
  onClose?: () => void;
}

interface UploadState {
  file: File | null;
  documentName: string;
  category: string; // Usaremos el id de la carpeta
  activateOCR: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadComplete: boolean;
  error: string | null;
}

interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export default function DocumentUpload({ onUploadSuccess, onClose }: DocumentUploadProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    documentName: '',
    category: '', // Usaremos el id de la carpeta
    activateOCR: true,
    isUploading: false,
    uploadProgress: 0,
    uploadComplete: false,
    error: null,
  });
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);

  // Cargar carpetas desde la base de datos
  useEffect(() => {
    const fetchFolders = async () => {
      setFoldersLoading(true);
      try {
        const response = await fetch('/api/folders');
        if (response.ok) {
          const data = await response.json() as { success: boolean; data: DocumentFolder[] };
          setFolders(data.data || []);
        }
      } catch (error) {
        // No mostrar error aquí, solo dejar vacío
      } finally {
        setFoldersLoading(false);
      }
    };
    void fetchFolders();
  }, []);

  const updateState = (updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Validación y selección de archivos
  const handleFileSelect = useCallback((file: File) => {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      updateState({
        error: 'Tipo de archivo no permitido. Solo se aceptan PDF, JPEG, PNG y WebP.'
      });
      return;
    }

    // Validar tamaño (50MB máx)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      updateState({
        error: 'El archivo es muy grande. Tamaño máximo: 50MB.'
      });
      return;
    }

    // Generar nombre por defecto si está vacío
    const defaultName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    
    updateState({
      file,
      documentName: state.documentName || defaultName,
      error: null
    });
  }, [state.documentName]);

  // Manejo de drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]!);
    }
  }, [handleFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]!);
    }
  };

  // Función para subir archivos a Supabase Storage con protocolo S3
  const uploadToSupabase = async (): Promise<string> => {
    if (!state.file) {
      throw new Error('No hay archivo seleccionado');
    }

    console.log('📤 Subiendo archivo con protocolo S3 optimizado...');
    
    // Crear FormData para el upload
    const formData = new FormData();
    formData.append('file', state.file);
    formData.append('title', state.documentName);
    formData.append('category', state.category); // Aquí va el id de la carpeta
    formData.append('activateOCR', state.activateOCR.toString());

    updateState({ uploadProgress: 10 });

    // Upload usando API S3 optimizada
    const response = await fetch('/api/documents/upload-s3', {
      method: 'POST',
      body: formData,
    });

    updateState({ uploadProgress: 80 });

    if (!response.ok) {
      const errorData = await response.json() as { error: string };
      throw new Error(errorData.error || 'Error en el upload');
    }

    const result = await response.json() as {
      success: boolean;
      document: {
        id: string;
        title: string;
        filename: string;
        status: string;
        storage_url: string;
      };
    };

    updateState({ uploadProgress: 100 });
    console.log('✅ Upload S3 completado exitosamente');
    
    return result.document.id;
  };

  const handleSave = async () => {
    if (!state.file || !state.documentName.trim()) {
      updateState({ error: 'Por favor completa todos los campos requeridos.' });
      return;
    }

    updateState({ 
      isUploading: true, 
      uploadProgress: 0, 
      error: null 
    });

    try {
      console.log('🚀 Iniciando upload con protocolo S3...');
      
      // Upload completo usando S3 protocol (incluye guardado de metadatos)
      const documentId = await uploadToSupabase();
      
      updateState({ 
        uploadProgress: 100, 
        uploadComplete: true 
      });

      console.log('✅ Documento procesado exitosamente:', documentId);

      // Callback de éxito
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess(documentId);
        }
      }, 1500);

    } catch (error) {
      console.error('Error en subida:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isUploading: false,
        uploadProgress: 0
      });
    }
  };

  if (state.uploadComplete) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Documento subido exitosamente!
          </h3>
          <p className="text-gray-600 mb-6">
            {state.documentName} se ha subido y guardado en la base de datos.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Document</h2>
      
      {/* Área de drop */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-red-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-4">
            Drag your file or click to upload
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
          />
          <label
            htmlFor="file-upload"
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded cursor-pointer transition-colors"
          >
            Click to upload
          </label>
        </div>
        
        {state.file && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm text-gray-700">
            📄 {state.file.name} ({(state.file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      {/* Nombre del documento */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Name
        </label>
        <input
          type="text"
          value={state.documentName}
          onChange={(e) => updateState({ documentName: e.target.value })}
          placeholder="invoice_2023.pdf"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Carpeta/Categoría */}
      <div className="mb-4">
        <label htmlFor="folder-select" className="block text-sm font-medium text-gray-700 mb-2">
          Carpeta
        </label>
        <select
          id="folder-select"
          value={state.category}
          onChange={(e) => updateState({ category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecciona una carpeta...</option>
          {foldersLoading && (
            <option disabled value="">Cargando carpetas...</option>
          )}
          {!foldersLoading && folders.length === 0 && (
            <option disabled value="">No hay carpetas disponibles</option>
          )}
          {!foldersLoading && folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle OCR */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Activate OCR
          </label>
          <button
            type="button"
            title={state.activateOCR ? 'Desactivar OCR' : 'Activar OCR'}
            onClick={() => updateState({ activateOCR: !state.activateOCR })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.activateOCR ? 'bg-red-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.activateOCR ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      {state.isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Uploading...</span>
            <span>{state.uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-red-500 h-2 rounded-full transition-all duration-300 ${styles['progress-bar']}`}
              data-progress={state.uploadProgress}
            />
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{state.error}</p>
        </div>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={state.isUploading || !state.file || !state.documentName.trim()}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {state.isUploading ? 'Uploading...' : 'Save'}
      </button>
    </div>
  );
}