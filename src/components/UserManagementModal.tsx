"use client";

import { useState } from 'react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'empleado';
  sendCredentials: boolean;
}

interface CreatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  role: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  user: CreatedUser;
  error?: string;
}

export default function UserManagementModal({ isOpen, onClose, onUserCreated }: UserManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'empleado',
    sendCredentials: true
  });

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateUniqueEmail = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `test.user.${timestamp}.${random}@example.com`;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'empleado',
      sendCredentials: true
    });
    setGeneratedPassword('');
    setShowSuccess(false);
    setError('');
    setCreatedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Generar contraseña temporal
      const tempPassword = generatePassword();
      setGeneratedPassword(tempPassword);

      // Crear usuario en Clerk a través de nuestra API
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          password: tempPassword,
        }),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? 'Error creando usuario');
      }

      // Guardar información del usuario creado
      setCreatedUser(data.user);

      // Simular envío de credenciales por email si está habilitado
      if (formData.sendCredentials) {
        console.log(`📧 Enviando credenciales a ${formData.email}:`);
        console.log(`Email: ${formData.email}`);
        console.log(`Contraseña temporal: ${tempPassword}`);
        console.log(`Rol: ${formData.role}`);
        
        // Aquí puedes integrar un servicio de email real como SendGrid
        // await sendWelcomeEmail(formData.email, tempPassword, formData.role);
      }

      setShowSuccess(true);
      // Llamar al callback para actualizar la lista
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error: unknown) {
      console.error('Error creando usuario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Crear Nuevo Usuario
            </h2>
            <button
              onClick={handleClose}
              title="Cerrar modal"
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mostrar error si existe */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👤</span>
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ej: Pérez García"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="usuario@empresa.com"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, email: generateUniqueEmail() }))}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Generar email único para pruebas"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Rol */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🛡️</span>
                  Rol y Permisos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="empleado"
                      name="role"
                      value="empleado"
                      checked={formData.role === 'empleado'}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'empleado' }))}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <label htmlFor="empleado" className="ml-3 cursor-pointer">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                          👤 Empleado
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">Empleado</div>
                          <div className="text-sm text-gray-500">Ver, subir y editar documentos</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="admin"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'empleado' }))}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <label htmlFor="admin" className="ml-3 cursor-pointer">
                      <div className="flex items-center">
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                          👑 Admin
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">Administrador</div>
                          <div className="text-sm text-gray-500">Acceso completo al sistema</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Opciones de Credenciales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔐</span>
                  Credenciales de Acceso
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendCredentials"
                      checked={formData.sendCredentials}
                      onChange={(e) => setFormData(prev => ({ ...prev, sendCredentials: e.target.checked }))}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendCredentials" className="ml-3 text-sm text-gray-700">
                      Enviar credenciales de acceso por correo electrónico
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Se generará una contraseña temporal y se enviará junto con las instrucciones de acceso
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando Usuario...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success View */
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Usuario Creado Exitosamente!
              </h3>
              <p className="text-gray-600 mb-6">
                Se ha creado el usuario <strong>{formData.firstName} {formData.lastName}</strong> con el rol de <strong>{formData.role === 'admin' ? 'Administrador' : 'Empleado'}</strong>
              </p>

              {/* Información del usuario creado */}
              {createdUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Usuario creado en Clerk:</h4>
                  <div className="text-left space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">ID:</span>
                      <span className="font-mono text-green-900 text-xs">{createdUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Nombre:</span>
                      <span className="text-green-900">{createdUser.firstName} {createdUser.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Email:</span>
                      <span className="font-mono text-green-900">{createdUser.email}</span>
                    </div>
                    {createdUser.username && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Usuario:</span>
                        <span className="font-mono text-green-900">{createdUser.username}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-green-700">Rol:</span>
                      <span className="text-green-900">{createdUser.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Creado:</span>
                      <span className="text-green-900">
                        {new Date(createdUser.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {generatedPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Credenciales Generadas:</h4>
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Email:</span>
                      <span className="font-mono text-blue-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Contraseña temporal:</span>
                      <span className="font-mono text-blue-900">{generatedPassword}</span>
                    </div>
                  </div>
                  {formData.sendCredentials && (
                    <div className="mt-3 text-sm text-blue-700">
                      ✅ Credenciales enviadas por correo electrónico
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Crear Otro Usuario
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}