"use client";

import { useState } from "react";
import ProtectedRoute from '~/components/ProtectedRoute';
import UserManagementModal from '~/components/UserManagementModal';
import UserList from '~/components/UserList';
import EditUserModal from '~/components/EditUserModal';
import DocumentManager from '~/components/DocumentManager';
import { useAuth } from '~/hooks/useAuth';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username: string | null;
  role: string;
  createdAt: number;
  lastSignInAt: number | null;
  imageUrl: string;
}

export default function AdminPage() {
  const { user, role } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingUser(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    setEditingUser(user);
  };

  return (
    <ProtectedRoute requiredPermission="canManageUsers">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de Administración
            </h1>
            <p className="text-gray-600">
              Gestión avanzada del sistema DocSafe
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del Admin */}
            <div className="bg-gradient-to-r from-red-50 to-white p-6 rounded-lg border border-red-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                👑 Información del Administrador
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rol:</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    {role === 'admin' ? 'Administrador' : role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario desde:</span>
                  <span className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estadísticas del Sistema */}
            <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📊 Estadísticas del Sistema
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Total Documentos</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">1,247</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Usuarios Activos</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">23</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Almacenamiento</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">2.4 GB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones de Administrador */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowUserModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Crear Usuario
            </button>
            
            <button 
              onClick={() => setShowUserList(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Gestionar Usuarios
            </button>

            <button 
              onClick={() => setShowDocumentManager(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gestionar Documentos
            </button>
            
            <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reportes Avanzados
            </button>
          </div>

          {/* Configuración adicional - nuevo botón */}
          <div className="mt-4">
            <button className="w-full bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración del Sistema
            </button>
          </div>

          {/* Alertas del Sistema */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔔 Alertas del Sistema
            </h2>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Almacenamiento:</strong> El espacio utilizado está al 75% de la capacidad.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      <strong>Sistema:</strong> Todos los servicios están funcionando correctamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Gestión de Usuarios */}
        <UserManagementModal 
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onUserCreated={handleUserCreated}
        />

        {/* Lista de Usuarios */}
        {showUserList && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    👥 Gestión de Usuarios
                  </h2>
                  <button
                    onClick={() => setShowUserList(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  <UserList
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gestión de Documentos */}
        {showDocumentManager && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📄 Gestión Avanzada de Documentos
                  </h2>
                  <button
                    onClick={() => setShowDocumentManager(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="max-h-[85vh] overflow-y-auto">
                  <DocumentManager />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición de Usuario */}
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </ProtectedRoute>
  );
}