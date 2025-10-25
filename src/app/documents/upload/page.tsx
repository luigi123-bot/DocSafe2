import DocumentUploader from "~/components/DocumentUploader";

export default function UploadDocumentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subir Documentos</h1>
        
        <div className="grid gap-8">
          <DocumentUploader />
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Información sobre OCR</h2>
            <div className="space-y-2 text-gray-600">
              <p>• Formatos soportados: PNG, JPG, JPEG, GIF, BMP</p>
              <p>• Idiomas: Español e Inglés</p>
              <p>• El tiempo de procesamiento varía según el tamaño y complejidad de la imagen</p>
              <p>• Puedes editar el texto extraído antes de guardar el documento</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}