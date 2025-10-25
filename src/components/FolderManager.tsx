"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '~/hooks/useAuth';

interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  document_count: number;
  created_at: string;
}

interface FolderManagerProps {
  onFolderCreated?: () => void;
  onFolderUpdated?: () => void;
  className?: string;
}

export default function FolderManager({ onFolderCreated, onFolderUpdated, className = "" }: FolderManagerProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6B7280', // Gray
  ];

  useEffect(() => {
    if (user) {
      void loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: DocumentFolder[] };
        setFolders(data.data);
      }
    } catch (error) {
      console.error('Error cargando carpetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      alert('El nombre de la carpeta es requerido');
      return;
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadFolders();
        setShowCreateForm(false);
        setFormData({ name: '', description: '', color: '#3B82F6' });
        onFolderCreated?.();
      } else {
        const error = await response.json() as { error: string };
        alert(`Error creando carpeta: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creando carpeta:', error);
      alert('Error creando carpeta');
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !formData.name.trim()) {
      alert('El nombre de la carpeta es requerido');
      return;
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: editingFolder.id,
          ...formData
        })
      });

      if (response.ok) {
        await loadFolders();
        setEditingFolder(null);
        setFormData({ name: '', description: '', color: '#3B82F6' });
        onFolderUpdated?.();
      } else {
        const error = await response.json() as { error: string };
        alert(`Error actualizando carpeta: ${error.error}`);
      }
    } catch (error) {
      console.error('Error actualizando carpeta:', error);
      alert('Error actualizando carpeta');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"? Los documentos se moverán a "Sin carpeta".`)) {
      return;
    }

    try {
      const response = await fetch(`/api/folders?id=${folderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadFolders();
        onFolderUpdated?.();
      } else {
        const error = await response.json() as { error: string };
        alert(`Error eliminando carpeta: ${error.error}`);
      }
    } catch (error) {
      console.error('Error eliminando carpeta:', error);
      alert('Error eliminando carpeta');
    }
  };

  const startEdit = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description ?? '',
      color: folder.color
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingFolder(null);
    setShowCreateForm(false);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gestión de Carpetas
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Organiza documentos en carpetas personalizadas
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            📁 Nueva Carpeta
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la carpeta *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Contratos, Facturas, Documentos Legales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el tipo de documentos que contendrá esta carpeta..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    {...{ style: { backgroundColor: color } }}
                    title={`Seleccionar color ${color}`}
                    aria-label={`Seleccionar color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingFolder ? 'Actualizar' : 'Crear'} Carpeta
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders List */}
      <div className="p-6">
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay carpetas creadas
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primera carpeta para organizar los documentos
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Crear Primera Carpeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-lg mr-3 flex items-center justify-center"
                      style={{ backgroundColor: folder.color }}
                    >
                      <span className="text-white text-sm">📁</span>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-900 truncate">
                        {folder.name}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">
                          📄 {folder.document_count} documento(s)
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(folder.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEdit(folder)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar carpeta"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar carpeta"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {folder.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {folder.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}