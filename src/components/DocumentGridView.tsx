"use client";

import React from 'react';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  document_type: string;
  status: string;
  created_at: string;
  folder_name?: string;
  folder_color?: string;
}

interface DocumentGridViewProps {
  documents: Document[];
  selectedDocuments: Set<string>;
  onSelectDocument: (documentId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEditDocument: (document: Document) => void;
  onViewDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string, title: string) => void;
  className?: string;
}

export default function DocumentGridView({
  documents,
  selectedDocuments,
  onSelectDocument,
  onSelectAll,
  onDeselectAll,
  onEditDocument,
  onViewDocument,
  onDeleteDocument,
  className = ""
}: DocumentGridViewProps) {

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      case 'txt': return '📋';
      default: return '📎';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };

  const allSelected = documents.length > 0 && documents.every(doc => selectedDocuments.has(doc.id));
  const someSelected = documents.some(doc => selectedDocuments.has(doc.id));

  return (
    <div className={className}>
      {/* Header with bulk selection */}
      {documents.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected && !allSelected;
              }}
              onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              aria-label="Seleccionar todos los documentos"
            />
            <span className="ml-2 text-sm text-gray-600">
              {selectedDocuments.size > 0 
                ? `${selectedDocuments.size} documento(s) seleccionado(s)`
                : `${documents.length} documento(s)`
              }
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            Vista en cuadrícula
          </div>
        </div>
      )}

      {/* Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay documentos
          </h3>
          <p className="text-gray-500">
            Los documentos aparecerán aquí cuando se suban
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className={`
                relative bg-white border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md
                ${selectedDocuments.has(document.id) 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onSelectDocument(document.id)}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedDocuments.has(document.id)}
                  onChange={() => onSelectDocument(document.id)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Seleccionar documento ${document.title}`}
                />
              </div>

              {/* Actions menu */}
              <div className="absolute top-2 right-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDocument(document);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors mr-1"
                    title="Editar documento"
                    aria-label={`Editar documento ${document.title}`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(document.id, document.title);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar documento"
                    aria-label={`Eliminar documento ${document.title}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* File icon and type */}
              <div className="text-center mb-3 pt-6">
                <div className="text-4xl mb-2">
                  {getFileIcon(document.file_name)}
                </div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                  {getStatusText(document.status)}
                </span>
              </div>

              {/* Document info */}
              <div className="space-y-2">
                <h4 
                  className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight"
                  title={document.title}
                >
                  {document.title}
                </h4>
                
                <p className="text-xs text-gray-500 line-clamp-1" title={document.file_name}>
                  {document.file_name}
                </p>

                {document.description && (
                  <p className="text-xs text-gray-600 line-clamp-2" title={document.description}>
                    {document.description}
                  </p>
                )}

                {/* Folder indicator */}
                {document.folder_name && (
                  <div className="flex items-center text-xs text-gray-500">
                    <span 
                      className={`w-2 h-2 rounded-full mr-1 ${
                        !document.folder_color ? 'bg-blue-500' : ''
                      }`}
                      {...(document.folder_color ? {
                        style: { backgroundColor: document.folder_color }
                      } : {})}
                    />
                    <span className="line-clamp-1" title={document.folder_name}>
                      {document.folder_name}
                    </span>
                  </div>
                )}

                {/* Document metadata */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Tamaño:</span>
                    <span>{formatFileSize(document.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="line-clamp-1" title={document.document_type}>
                      {document.document_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{formatDate(document.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocument(document);
                  }}
                  className="w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Ver documento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}