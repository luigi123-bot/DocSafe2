"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '~/hooks/useAuth';
import DocumentGridView from './DocumentGridView';
import DocumentEditModal from './DocumentEditModal';
import FolderManager from './FolderManager';

interface Document {
  id: string;
  title: string;
  filename: string;
  status: string;
  category: string;
  file_size: number;
  created_at: string;
  owner_name: string;
  owner_email: string;
  owner_role: string;
  folder_name?: string;
  folder_color?: string;
  folder_id?: string;
  document_type?: string;
  description?: string;
  tags?: Array<{ tag: string; color: string }>;
}

interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  document_count: number;
}

interface AdminStats {
  total_documents: number;
  documents_by_status: Record<string, number>;
  documents_by_category: Record<string, number>;
  documents_by_folder: Record<string, number>;
  recent_uploads: number;
  storage_usage: number;
  storage_usage_formatted: string;
}

interface DocumentManagerProps {
  className?: string;
}

export default function DocumentManager({ className = "" }: DocumentManagerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'grid' | 'folders'>('list');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    folder_id: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1,
    per_page: 20
  });
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDocuments(),
        loadFolders(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error cargando datos admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      void loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters]);

  const loadDocuments = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.folder_id) params.append('folder_id', filters.folder_id);
      params.append('page', filters.page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/admin/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json() as {
          success: boolean;
          data: Document[];
          pagination: typeof pagination;
        };
        setDocuments(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: DocumentFolder[] };
        setFolders(data.data);
      }
    } catch (error) {
      console.error('Error cargando carpetas:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: AdminStats };
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/documents?id=${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setSelectedDocuments(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
        await loadStats(); // Actualizar estadísticas
      } else {
        const error = await response.json() as { error: string };
        alert(`Error eliminando documento: ${error.error}`);
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
      alert('Error eliminando documento');
    }
  };

  const handleBulkMove = async (folderId: string | null) => {
    const selectedIds = Array.from(selectedDocuments);
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un documento');
      return;
    }

    try {
      const response = await fetch('/api/admin/folders/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_ids: selectedIds,
          folder_id: folderId
        })
      });

      if (response.ok) {
        await loadDocuments();
        await loadStats();
        setSelectedDocuments(new Set());
      } else {
        const error = await response.json() as { error: string };
        alert(`Error moviendo documentos: ${error.error}`);
      }
    } catch (error) {
      console.error('Error moviendo documentos:', error);
      alert('Error moviendo documentos');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return '📄';
      case 'processing': return '⏳';
      case 'processed': return '✅';
      case 'error': return '❌';
      case 'ocr_failed': return '⚠️';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'ocr_failed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funciones para edición de documentos
  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowEditModal(true);
  };

  const handleSaveDocument = async (documentId: string, updates: {
    title: string;
    description?: string;
    document_type: string;
    folder_id?: string;
  }) => {
    try {
      const response = await fetch('/api/admin/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          ...updates
        })
      });

      if (response.ok) {
        await loadDocuments();
        await loadStats();
      } else {
        const error = await response.json() as { error: string };
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Error actualizando documento:', error);
      throw error;
    }
  };

  const handleViewDocument = async (document: Document) => {
    // Implementar vista del documento - podría abrir en modal o nueva ventana
    window.open(`/documents/${document.id}`, '_blank');
  };

  // Funciones para gestión de selección
  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc.id)));
  };

  const handleDeselectAll = () => {
    setSelectedDocuments(new Set());
  };

  // Filtrar documentos por carpeta seleccionada
  const visibleDocuments = filters.folder_id
    ? documents.filter(doc => doc.folder_id === filters.folder_id)
    : documents;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestión de Documentos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Administra todos los documentos del sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'list' as const, icon: '📋', label: 'Lista' },
                { key: 'grid' as const, icon: '⊞', label: 'Grid' },
                { key: 'folders' as const, icon: '📁', label: 'Carpetas' }
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setCurrentView(key)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === key
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-lg">📄</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Documentos</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total_documents.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-lg">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Procesados</p>
                  <p className="text-xl font-bold text-green-900">
                    {stats.documents_by_status.processed ?? 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Procesando</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {stats.documents_by_status.processing ?? 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-lg">💾</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Almacenamiento</p>
                  <p className="text-xl font-bold text-purple-900">{stats.storage_usage_formatted}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            aria-label="Filtrar por estado"
            title="Filtrar documentos por estado"
          >
            <option value="">Todos los estados</option>
            <option value="uploaded">Subidos</option>
            <option value="processing">Procesando</option>
            <option value="processed">Procesados</option>
            <option value="error">Con Error</option>
          </select>
          
          <select
            value={filters.folder_id}
            onChange={(e) => setFilters(prev => ({ ...prev, folder_id: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            aria-label="Filtrar por carpeta"
            title="Filtrar documentos por carpeta"
          >
            <option value="">Todas las carpetas</option>
            <option value="null">Sin carpeta</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                📁 {folder.name} ({folder.document_count})
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedDocuments.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedDocuments.size} documento(s) seleccionado(s)
            </span>
            <div className="flex space-x-2">
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    void handleBulkMove(value === 'null' ? null : value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1 text-sm border border-blue-300 rounded"
                aria-label="Mover documentos seleccionados"
                title="Mover documentos a carpeta"
              >
                <option value="">Mover a carpeta...</option>
                <option value="null">Sin carpeta</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSelectedDocuments(new Set())}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="p-6">
        {/* Content based on current view */}
        {currentView === 'folders' ? (
          <FolderManager 
            onFolderCreated={() => void loadAllData()}
            onFolderUpdated={() => void loadAllData()}
          />
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron documentos
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {currentView === 'grid' && (
              <DocumentGridView
                documents={visibleDocuments.map(doc => ({
                  id: doc.id,
                  title: doc.title,
                  description: undefined,
                  file_name: doc.filename,
                  file_size: doc.file_size,
                  document_type: doc.category,
                  status: doc.status,
                  created_at: doc.created_at,
                  folder_name: doc.folder_name,
                  folder_color: doc.folder_color
                }))}
                selectedDocuments={selectedDocuments}
                onSelectDocument={handleSelectDocument}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onEditDocument={(doc) => {
                  const originalDoc = documents.find(d => d.id === doc.id);
                  if (originalDoc) {
                    handleEditDocument({
                      ...originalDoc,
                      document_type: doc.document_type
                    });
                  }
                }}
                onViewDocument={(doc) => {
                  const originalDoc = documents.find(d => d.id === doc.id);
                  if (originalDoc) {
                    void handleViewDocument(originalDoc);
                  }
                }}
                onDeleteDocument={(id) => void handleDeleteDocument(id)}
              />
            )}

            {/* Table View */}
            {currentView === 'list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.size === documents.length && documents.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments(new Set(documents.map(doc => doc.id)));
                            } else {
                              setSelectedDocuments(new Set());
                            }
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          aria-label="Seleccionar todos los documentos"
                          title="Seleccionar todos"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propietario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carpeta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibleDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.has(doc.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedDocuments);
                              if (e.target.checked) {
                                newSet.add(doc.id);
                              } else {
                                newSet.delete(doc.id);
                              }
                              setSelectedDocuments(newSet);
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            aria-label={`Seleccionar documento ${doc.title}`}
                            title={`Seleccionar ${doc.title}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {getStatusIcon(doc.status)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.filename} • {formatFileSize(doc.file_size)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doc.owner_name}</div>
                          <div className="text-sm text-gray-500">{doc.owner_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.folder_name ? (
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                {...(doc.folder_color ? { style: { backgroundColor: doc.folder_color } } : {})}
                              />
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                {...(doc.folder_color ? { style: { backgroundColor: doc.folder_color } } : {})}
                              >
                                📁 {doc.folder_name}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Sin carpeta
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => void handleViewDocument(doc)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver documento"
                            >
                              👁️
                            </button>
                            <button 
                              onClick={() => handleEditDocument(doc)}
                              className="text-green-600 hover:text-green-900"
                              title="Editar documento"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => void handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar documento"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
                  {pagination.total} documentos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-2 text-sm bg-red-600 text-white rounded">
                    {pagination.current_page}
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.current_page === pagination.pages}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <DocumentEditModal
        document={editingDocument ? {
          id: editingDocument.id,
          title: editingDocument.title,
          description: undefined,
          document_type: editingDocument.document_type ?? editingDocument.category,
          folder_id: editingDocument.folder_id
        } : null}
        folders={folders}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDocument(null);
        }}
        onSave={handleSaveDocument}
      />
    </div>
  );
}