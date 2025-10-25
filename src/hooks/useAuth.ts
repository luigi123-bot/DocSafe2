"use client";

import { useUser } from "@clerk/nextjs";

export type UserRole = 'admin' | 'empleado' | null;

export interface UserPermissions {
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canEditDocuments: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canExportDocuments: boolean;
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();

  // Obtener el rol del usuario desde los metadatos públicos de Clerk
  const getUserRole = (): UserRole => {
    if (!user) return null;
    return (user.publicMetadata?.role as UserRole) ?? 'empleado';
  };

  // Definir permisos basados en el rol
  const getPermissions = (role: UserRole): UserPermissions => {
    switch (role) {
      case 'admin':
        return {
          canViewDocuments: true,
          canUploadDocuments: true,
          canDeleteDocuments: true,
          canEditDocuments: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canExportDocuments: true,
        };
      case 'empleado':
        return {
          canViewDocuments: true,
          canUploadDocuments: true,
          canDeleteDocuments: false,
          canEditDocuments: true,
          canManageUsers: false,
          canViewAnalytics: false,
          canExportDocuments: false,
        };
      default:
        return {
          canViewDocuments: false,
          canUploadDocuments: false,
          canDeleteDocuments: false,
          canEditDocuments: false,
          canManageUsers: false,
          canViewAnalytics: false,
          canExportDocuments: false,
        };
    }
  };

  const role = getUserRole();
  const permissions = getPermissions(role);

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
    permissions,
    isAdmin: role === 'admin',
    isEmployee: role === 'empleado',
  };
}