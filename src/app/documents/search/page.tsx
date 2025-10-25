import DocumentSearch from "~/components/DocumentSearch";

export default function SearchDocumentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Buscar Documentos</h1>
        
        <DocumentSearch />
        
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Consejos de Búsqueda</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Búsqueda por contenido:</h3>
              <ul className="space-y-1">
                <li>• Busca palabras que aparecen en el texto extraído por OCR</li>
                <li>• Los resultados se resaltan automáticamente</li>
                <li>• No distingue entre mayúsculas y minúsculas</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Filtros avanzados:</h3>
              <ul className="space-y-1">
                <li>• Filtra por rango de fechas de subida</li>
                <li>• Selecciona tipos de archivo específicos</li>
                <li>• Establece un nivel mínimo de confianza OCR</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}