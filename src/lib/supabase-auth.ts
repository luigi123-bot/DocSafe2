// src/lib/supabase-auth.ts
// Configuración de autenticación entre Clerk y Supabase

import { getSupabaseClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncUserToSupabase } from './userSync';

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
 * Configura la sesión de Supabase con el token JWT de Clerk
 */
export async function setSupabaseAuth(clerkUser: ClerkUser, clerkToken?: string): Promise<void> {
  try {
    // Primero sincronizamos el usuario en la base de datos
    await syncUserToSupabase(clerkUser);

    // Si tenemos un token JWT de Clerk, lo usamos para autenticar en Supabase
    if (clerkToken) {
      const supabase: SupabaseClient = getSupabaseClient() as SupabaseClient;
      
      const { error } = await supabase.auth.setSession({
        access_token: clerkToken,
        refresh_token: '', // Clerk maneja el refresh
      });

      if (error) {
        console.warn('Error configurando sesión Supabase con token Clerk:', error);
      }
    }
  } catch (error) {
    console.error('Error en setSupabaseAuth:', error);
  }
}

/**
 * Limpia la sesión de Supabase
 */
export async function clearSupabaseAuth(): Promise<void> {
  try {
    const supabase: SupabaseClient = getSupabaseClient() as SupabaseClient;
    
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error limpiando autenticación Supabase:', error);
  }
}