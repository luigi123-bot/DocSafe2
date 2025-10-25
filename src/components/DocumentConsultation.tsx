"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from '~/hooks/useAuth';
import { Button } from "~/components/ui/button";
import DocumentViewer from "./DocumentViewer";

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
  folder_name?: string;
  folder_color?: string;
  folder_id?: string;
  document_type?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  document_count: number;
}

export default function DocumentConsultation() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'document_type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#ef4444");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1,
    per_page: 10
  });
  const [viewerFile, setViewerFile] = useState<File | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Cargar documentos desde la API
  const loadDocuments = useCallback(async () => {
    if (!user) {
      console.log('📋 Usuario no autenticado, no se cargan documentos');
      return;
    }
    
    try {
      console.log('📋 Cargando documentos para usuario:', user.id);
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedDepartment) params.append('category', selectedDepartment);
      if (selectedUser) params.append('user', selectedUser);
      if (selectedFolder) params.append('folder_id', selectedFolder);
      if (selectedDate) params.append('date', selectedDate);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const url = `/api/documents/consultation?${params.toString()}`;
      console.log('📋 Llamando a API:', url);

      const response = await fetch(url);
      console.log('📋 Respuesta de API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json() as {
          success: boolean;
          data: Document[];
          pagination: typeof pagination;
        };
        console.log('📋 Datos recibidos:', data);
        setDocuments(data.data || []);
        setPagination(data.pagination || {
          total: 0,
          pages: 0,
          current_page: 1,
          per_page: 10
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = await response.json();
        console.error('📋 Error en API:', errorData);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        setError(`Error al cargar documentos: ${errorData.error ?? 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('📋 Error cargando documentos:', error);
      setError('Error de conexión al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedType, selectedDepartment, selectedUser, selectedFolder, selectedDate, currentPage, itemsPerPage, sortBy, sortOrder]);

  // Cargar carpetas desde la API
  const loadFolders = useCallback(async () => {
    if (!user) {
      console.log('📁 Usuario no autenticado, no se cargan carpetas');
      return;
    }
    
    try {
      console.log('📁 Cargando carpetas para usuario:', user.id);
      const response = await fetch('/api/folders');
      console.log('📁 Respuesta de carpetas:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: DocumentFolder[] };
        console.log('📁 Carpetas recibidas:', data);
        setFolders(data.data || []);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = await response.json();
        console.error('📁 Error en API de carpetas:', errorData);
      }
    } catch (error) {
      console.error('📁 Error cargando carpetas:', error);
    }
  }, [user]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      void loadDocuments();
      void loadFolders();
    }
  }, [user, loadDocuments, loadFolders]);

  // Crear nueva carpeta
  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: '',
          color: newFolderColor
        })
      });

      if (response.ok) {
        setNewFolderName("");
        setShowCreateFolder(false);
        await loadFolders();
      } else {
        const error = await response.json() as { error: string };
        alert(`Error creando carpeta: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creando carpeta:', error);
      alert('Error creando carpeta');
    }
  };

  // Mover documentos a carpeta
  const moveToFolder = async (folderId: string) => {
    if (selectedDocuments.length === 0 || !user) return;
    
    try {
      const response = await fetch('/api/admin/folders/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_ids: selectedDocuments,
          folder_id: folderId === '' ? null : folderId
        })
      });

      if (response.ok) {
        setSelectedDocuments([]);
        await loadDocuments();
        await loadFolders();
      } else {
        const error = await response.json() as { error: string };
        alert(`Error moviendo documentos: ${error.error}`);
      }
    } catch (error) {
      console.error('Error moviendo documentos:', error);
      alert('Error moviendo documentos');
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate("");
    setSelectedType("");
    setSelectedDepartment("");
    setSelectedUser("");
    setSelectedFolder("");
    setCurrentPage(1);
  };

  // Eliminar documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?') || !user) return;

    try {
      const response = await fetch(`/api/admin/documents?id=${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDocuments();
        await loadFolders();
        setSelectedDocuments(prev => prev.filter(id => id !== documentId));
      } else {
        const error = await response.json() as { error: string };
        alert(`Error eliminando documento: ${error.error}`);
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
      alert('Error eliminando documento');
    }
  };

  // Ver documento (descargar y mostrar en visor)
  const handleViewDocument = async (document: Document) => {
    try {
      console.log('👁️ Obteniendo URL presignada para documento:', document.id);
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (response.ok) {
        const data = await response.json() as { url: string; filename?: string };
        // Descargar el archivo como blob y crear un File para el visor
        const fileResp = await fetch(data.url);
        const blob = await fileResp.blob();
        const file = new File([blob], document.filename, { type: blob.type });
        setViewerFile(file);
        setShowViewer(true);
      } else {
        const error = await response.json() as { error: string };
        alert(`Error obteniendo documento: ${error.error}`);
      }
    } catch (error) {
      console.error('Error obteniendo URL del documento:', error);
      alert('Error obteniendo documento');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'processed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'ocr_failed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
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

  // Obtener valores únicos para filtros
  const uniqueTypes = [...new Set(documents.map(doc => doc.document_type ?? doc.category))];
  const uniqueDepartments = [...new Set(documents.map(doc => doc.category))];
  const uniqueUsers = [...new Set(documents.map(doc => doc.owner_name))];

  // Filtrar documentos por carpeta seleccionada
  const visibleDocuments = selectedFolder
    ? documents.filter(doc => doc.folder_id === selectedFolder)
    : documents;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar documentos</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => void loadDocuments()}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso requerido</h3>
            <p className="text-gray-500">Necesitas estar autenticado para ver los documentos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6"> Documentos</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar documentos por nombre, contenido, etc."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label htmlFor="date-filter" className="sr-only">Filtrar por fecha</label>
            <select
              id="date-filter"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todas las fechas</option>
              <option value="2024-10">Octubre 2024</option>
              <option value="2024-09">Septiembre 2024</option>
              <option value="2024-08">Agosto 2024</option>
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="sr-only">Filtrar por tipo</label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department-filter" className="sr-only">Filtrar por departamento</label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos los departamentos</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user-filter" className="sr-only">Filtrar por usuario</label>
            <select
              id="user-filter"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos los usuarios</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="folder-filter" className="sr-only">Filtrar por carpeta</label>
            <select
              id="folder-filter"
              value={selectedFolder}
              onChange={(e) => {
                setSelectedFolder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todas las carpetas</option>
              <option value="">Sin carpeta</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={clearFilters}
            variant="outline"
            className="w-full"
          >
            🗑️ Limpiar
          </Button>
        </div>

        {/* Folder Management */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Carpetas</h3>
            <Button
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              variant="outline"
              size="sm"
            >
              📁 Nueva Carpeta
            </Button>
          </div>

          {showCreateFolder && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label htmlFor="folder-name-input" className="sr-only">Nombre de la carpeta</label>
                <input
                  id="folder-name-input"
                  type="text"
                  placeholder="Nombre de la carpeta"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <label htmlFor="folder-color-input" className="sr-only">Color de la carpeta</label>
                <input
                  id="folder-color-input"
                  type="color"
                  value={newFolderColor}
                  onChange={(e) => setNewFolderColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
                <Button onClick={createFolder} className="w-full">
                  Crear Carpeta
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {folders.map(folder => (
              <div
                key={folder.id}
                className={`flex items-center px-3 py-2 rounded-full text-sm text-white cursor-pointer hover:opacity-80 transition-all duration-200 ${
                  selectedFolder === folder.id ? 'ring-2 ring-white ring-offset-2' : ''
                }`}
                style={{ backgroundColor: folder.color }}
                onClick={() => {
                  setSelectedFolder(selectedFolder === folder.id ? "" : folder.id);
                  setCurrentPage(1);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedFolder(selectedFolder === folder.id ? "" : folder.id);
                    setCurrentPage(1);
                  }
                }}
              >
                <span className="mr-2">📁</span>
                <span className="font-medium">{folder.name}</span>
                <span className="ml-2 px-2 py-1 bg-black bg-opacity-20 rounded-full text-xs">
                  {folder.document_count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedDocuments.length} documento(s) seleccionado(s)
              </span>
              <div className="flex gap-2">
                <label htmlFor="move-folder-select" className="sr-only">Mover a carpeta</label>
                <select
                  id="move-folder-select"
                  onChange={(e) => e.target.value && moveToFolder(e.target.value)}
                  className="px-3 py-1 text-sm border border-blue-300 rounded"
                  defaultValue=""
                >
                  <option value="">Mover a carpeta...</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
                <Button
                  onClick={() => setSelectedDocuments([])}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sorting */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <label htmlFor="sort-select" className="sr-only">Ordenar documentos</label>
          <select
            id="sort-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="created_at-desc">Fecha (más reciente)</option>
            <option value="created_at-asc">Fecha (más antigua)</option>
            <option value="title-asc">Nombre (A-Z)</option>
            <option value="title-desc">Nombre (Z-A)</option>
            <option value="document_type-asc">Tipo (A-Z)</option>
            <option value="document_type-desc">Tipo (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <label htmlFor="select-all-checkbox" className="sr-only">Seleccionar todos</label>
                <input
                  id="select-all-checkbox"
                  type="checkbox"
                  checked={selectedDocuments.length === documents.length && documents.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDocuments(documents.map(doc => doc.id));
                    } else {
                      setSelectedDocuments([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carpeta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleDocuments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedType || selectedDepartment || selectedUser || selectedFolder || selectedDate
                      ? 'No se encontraron documentos con los filtros aplicados.'
                      : 'Aún no hay documentos disponibles en el sistema.'}
                  </p>
                  {(searchTerm || selectedType || selectedDepartment || selectedUser || selectedFolder || selectedDate) && (
                    <Button onClick={clearFilters} variant="outline">
                      Limpiar filtros
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              visibleDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label htmlFor={`checkbox-${document.id}`} className="sr-only">
                      Seleccionar documento {document.title}
                    </label>
                    <input
                      id={`checkbox-${document.id}`}
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, document.id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getStatusIcon(document.status)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                        <div className="text-sm text-gray-500">{document.filename} • {formatFileSize(document.file_size)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.document_type ?? document.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(document.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.owner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {document.folder_name ? (
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: document.folder_color }}
                        />
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: document.folder_color }}
                        >
                          📁 {document.folder_name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Sin carpeta
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewDocument(document)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Ver documento"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => void handleDeleteDocument(document.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Eliminar documento"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={pagination.current_page === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
            disabled={pagination.current_page === pagination.pages}
            variant="outline"
          >
            Siguiente
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span>
              {' '}a{' '}
              <span className="font-medium">
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
              </span>
              {' '}de{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={pagination.current_page === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={pagination.current_page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="ml-1"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={pagination.current_page === pagination.pages}
                variant="outline"
                size="sm"
                className="ml-1"
              >
                Siguiente
              </Button>
            </nav>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showViewer && viewerFile && (
        <DocumentViewer
          file={viewerFile}
          onClose={() => {
            setShowViewer(false);
            setViewerFile(null);
          }}
        />
      )}
    </div>
  );
}