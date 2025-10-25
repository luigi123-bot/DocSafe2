"use client";

import { useState } from "react";
import DocumentUpload from "~/components/DocumentUpload";
import DocumentSearch from "~/components/DocumentSearch";
import DocumentConsultation from "~/components/DocumentConsultation";
import DashboardContent from "~/components/DashboardContent";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/hooks/useAuth";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'search' | 'consultation'>('dashboard');
  const { permissions, role } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header con información del rol */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
                <p className="text-gray-600">
                  Bienvenido al sistema DocSafe - Rol: <span className="font-semibold">{role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Permisos activos:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {permissions.canViewDocuments && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Ver</span>}
                  {permissions.canUploadDocuments && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Subir</span>}
                  {permissions.canEditDocuments && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Editar</span>}
                  {permissions.canDeleteDocuments && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Eliminar</span>}
                  {permissions.canViewAnalytics && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Analytics</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Solo mostrar tabs permitidos */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {permissions.canViewAnalytics && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Dashboard
                </button>
              )}
              {permissions.canViewDocuments && (
                <button
                  onClick={() => setCurrentView('consultation')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'consultation'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋  Documentos
                </button>
              )}
              {permissions.canUploadDocuments && (
                <button
                  onClick={() => setCurrentView('upload')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'upload'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📤 Subir Documento
                </button>
              )}
              {permissions.canViewDocuments && (
                <button
                  onClick={() => setCurrentView('search')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'search'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔍 Buscar
                </button>
              )}
            </div>
          </div>

        {/* Content based on current view */}
        {currentView === 'dashboard' && permissions.canViewAnalytics && (
          <DashboardContent />
        )}

        {currentView === 'consultation' && permissions.canViewDocuments && (
          <DocumentConsultation />
        )}

        {currentView === 'upload' && permissions.canUploadDocuments && (
          <DocumentUpload 
            onUploadSuccess={() => {
              // Handle successful upload
              console.log('Document uploaded successfully');
            }}
            onClose={() => {
              // Handle close action
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'search' && permissions.canViewDocuments && (
          <DocumentSearch />
        )}

        {/* Mensaje cuando no hay permisos para la vista actual */}
        {((currentView === 'dashboard' && !permissions.canViewAnalytics) ||
          (currentView === 'consultation' && !permissions.canViewDocuments) ||
          (currentView === 'upload' && !permissions.canUploadDocuments) ||
          (currentView === 'search' && !permissions.canViewDocuments)) && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sin permisos suficientes
              </h3>
              <p className="text-gray-600 mb-4">
                No tienes los permisos necesarios para acceder a esta sección.
              </p>
              <p className="text-sm text-gray-500">
                Contacta a tu administrador para obtener acceso.
              </p>
            </div>
          </div>
        )}


      </div>
    </main>
    </ProtectedRoute>
  );
}
