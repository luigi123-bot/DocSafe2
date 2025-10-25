"use client";

import { useAuth } from '~/hooks/useAuth';

export default function UserRoleBadge() {
  const { isSignedIn, user, role } = useAuth();

  if (!isSignedIn || !user) {
    return null;
  }

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'empleado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'empleado':
        return '👤';
      default:
        return '❓';
    }
  };

  const getRoleText = () => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'empleado':
        return 'Empleado';
      default:
        return 'Sin rol';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor()}`}>
        <span className="mr-1">{getRoleIcon()}</span>
        {getRoleText()}
      </span>
      
      {/* Mostrar nombre del usuario */}
      <span className="text-sm text-gray-600">
        {user.firstName} {user.lastName}
      </span>
    </div>
  );
}