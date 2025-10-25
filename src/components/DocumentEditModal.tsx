"use client";

import React, { useState, useEffect } from 'react';

interface DocumentEditModalProps {
  document: {
    id: string;
    title: string;
    description?: string;
    document_type: string;
    folder_id?: string;
  } | null;
  folders: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentId: string, updates: {
    title: string;
    description?: string;
    document_type: string;
    folder_id?: string;
  }) => Promise<void>;
}

const documentTypes = [
  'Contrato',
  'Factura',
  'Recibo',
  'Documento Legal',
  'Certificado',
  'Licencia',
  'Permiso',
  'Declaración',
  'Formulario',
  'Carta',
  'Otro'
];

export default function DocumentEditModal({
  document,
  folders,
  isOpen,
  onClose,
  onSave
}: DocumentEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'Documento Legal',
    folder_id: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        description: document.description ?? '',
        document_type: document.document_type,
        folder_id: document.folder_id ?? ''
      });
    }
  }, [document]);

  const handleSave = async () => {
    if (!document || !formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    try {
      setSaving(true);
      await onSave(document.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        document_type: formData.document_type,
        folder_id: formData.folder_id || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error guardando documento:', error);
      alert('Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (document) {
      setFormData({
        title: document.title,
        description: document.description ?? '',
        document_type: document.document_type,
        folder_id: document.folder_id ?? ''
      });
    }
    onClose();
  };

  if (!isOpen || !document) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Editar Documento
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal de edición"
              title="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-2">
              Título del documento *
            </label>
            <input
              id="document-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Ingresa el título del documento"
              aria-required="true"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="document-description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              id="document-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Describe el contenido del documento"
            />
          </div>

          {/* Tipo de documento */}
          <div>
            <label htmlFor="document-type-select" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de documento
            </label>
            <select
              id="document-type-select"
              value={formData.document_type}
              onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              aria-label="Seleccionar tipo de documento"
              title="Tipo de documento"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Carpeta */}
          <div>
            <label htmlFor="folder-select" className="block text-sm font-medium text-gray-700 mb-2">
              Carpeta
            </label>
            <select
              id="folder-select"
              value={formData.folder_id}
              onChange={(e) => setFormData(prev => ({ ...prev, folder_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              aria-label="Seleccionar carpeta"
              title="Carpeta de destino"
            >
              <option value="">Sin carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}