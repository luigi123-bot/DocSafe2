// src/lib/userSync.ts
// Funciones para sincronizar usuarios entre Clerk y Supabase

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { getSupabaseClient } from './supabase';

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  username: string | null;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
  publicMetadata?: {
    role?: string;
  };
}

/**
 * Sincroniza un usuario de Clerk con la tabla users de Supabase
 */
export async function syncUserToSupabase(clerkUser: ClerkUser): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const userData = {
      clerk_user_id: clerkUser.id,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      username: clerkUser.username,
      role: clerkUser.publicMetadata?.role ?? 'empleado',
      avatar_url: clerkUser.imageUrl,
      last_sign_in_at: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : null,
    };

    // Insertar o actualizar usuario
    const { error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error sincronizando usuario con Supabase:', error);
      throw new Error(`Error de sincronización: ${error.message}`);
    }

    console.log('✅ Usuario sincronizado con Supabase:', clerkUser.id);
  } catch (error) {
    console.error('Error en syncUserToSupabase:', error);
    throw error;
  }
}

/**
 * Registra actividad del usuario en Supabase
 */
export async function logUserActivity(
  clerkUserId: string, 
  action: string, 
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Obtener el ID interno del usuario
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (!user) {
      console.warn('Usuario no encontrado en Supabase para registrar actividad:', clerkUserId);
      return;
    }

    const { error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        action,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Error registrando actividad:', error);
    } else {
      console.log('📝 Actividad registrada:', action, 'para usuario:', clerkUserId);
    }
  } catch (error) {
    console.error('Error en logUserActivity:', error);
  }
}

/**
 * Elimina usuario de Supabase cuando se elimina de Clerk
 */
export async function deleteUserFromSupabase(clerkUserId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      console.error('Error eliminando usuario de Supabase:', error);
      throw new Error(`Error de eliminación: ${error.message}`);
    }

    console.log('🗑️ Usuario eliminado de Supabase:', clerkUserId);
  } catch (error) {
    console.error('Error en deleteUserFromSupabase:', error);
    throw error;
  }
}