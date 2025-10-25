import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'empleado';
  password: string;
  changePassword: boolean;
}

interface UpdateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'empleado';
  password?: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'empleado',
    password: '',
    changePassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email,
        role: user.role as 'admin' | 'empleado',
        password: '',
        changePassword: false
      });
      setError('');
      setShowDeleteConfirm(false);
    }
  }, [user, isOpen]);

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const updateData: UpdateUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role
      };

      if (formData.changePassword && formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json() as ApiResponse;

      if (data.success) {
        onUserUpdated();
        onClose();
      } else {
        setError(data.error ?? 'Error actualizando usuario');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json() as ApiResponse;

      if (data.success) {
        onUserUpdated();
        onClose();
      } else {
        setError(data.error ?? 'Error eliminando usuario');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              ✏️ Editar Usuario
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Image
                className="h-12 w-12 rounded-full"
                src={user.imageUrl}
                alt={`${user.firstName} ${user.lastName}`}
                width={48}
                height={48}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=ef4444&color=ffffff&size=48`;
                }}
              />
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {user.id}
                </div>
                {user.username && (
                  <div className="text-sm text-gray-500">
                    @{user.username}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingresa el nombre"
                    title="Nombre del usuario"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingresa los apellidos"
                    title="Apellidos del usuario"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="usuario@empresa.com"
                  title="Dirección de correo electrónico"
                />
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'empleado' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Seleccionar rol del usuario"
                >
                  <option value="empleado">👤 Empleado</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>

              {/* Cambiar contraseña */}
              <div>
                <label htmlFor="changePassword" className="flex items-center space-x-2">
                  <input
                    id="changePassword"
                    type="checkbox"
                    checked={formData.changePassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, changePassword: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    title="Cambiar contraseña"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Cambiar contraseña
                  </span>
                </label>
              </div>

              {formData.changePassword && (
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="newPassword"
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nueva contraseña"
                      title="Nueva contraseña para el usuario"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="Generar contraseña"
                    >
                      🎲
                    </button>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  🗑️ Eliminar Usuario
                </button>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Confirmación de eliminar */
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Eliminar usuario?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{' '}
                <strong>{user.firstName} {user.lastName}</strong>.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}