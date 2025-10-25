"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  ocrText: string;
  confidence: number;
  uploadDate: string;
  size: number;
  type: string;
  tags: string[];
}

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  fileType?: string;
  minConfidence?: number;
}

interface SearchResponse {
  documents: Document[];
  total: number;
  searchParams?: {
    query?: string;
    filters?: SearchFilters;
  };
}

export default function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const searchDocuments = async () => {
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, filters }),
      });
      
      const data = await response.json() as SearchResponse;
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error al buscar documentos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void searchDocuments();
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Buscar Documentos</h2>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Buscar por contenido, nombre de archivo..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <Button onClick={searchDocuments} disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                title="Fecha de inicio del filtro"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                title="Fecha de fin del filtro"
              />
            </div>
            <div>
              <label htmlFor="file-type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de archivo
              </label>
              <select
                id="file-type"
                value={filters.fileType ?? ''}
                onChange={(e) => setFilters({...filters, fileType: e.target.value})}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                title="Seleccionar tipo de archivo"
              >
                <option value="">Todos</option>
                <option value="image">Imágenes</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label htmlFor="min-confidence" className="block text-sm font-medium text-gray-700 mb-1">
                Confianza mínima
              </label>
              <input
                id="min-confidence"
                type="number"
                min="0"
                max="100"
                value={filters.minConfidence ?? ''}
                onChange={(e) => setFilters({...filters, minConfidence: Number(e.target.value)})}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="0-100"
                title="Nivel mínimo de confianza OCR"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {documents.length > 0 && (
          <div className="text-sm text-gray-600">
            Se encontraron {documents.length} documento(s)
          </div>
        )}

        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {doc.originalName}
                </h3>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Subido: {formatDate(doc.uploadDate)}</span>
                  <span>Tamaño: {formatFileSize(doc.size)}</span>
                  <span>Confianza OCR: {doc.confidence}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Contenido extraído por OCR:
              </h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {highlightText(doc.ocrText, query)}
              </div>
            </div>
          </div>
        ))}

        {documents.length === 0 && query && !isSearching && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron documentos que coincidan con tu búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}