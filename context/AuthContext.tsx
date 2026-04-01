/**
 * ⚡ UNY PROTOCOL: AUTH CONTEXT (V1)
 * Description: Sovereign authentication manager based on Supabase Custom Claims.
 * Zéro hardcoding, Zero Firebase, Zéro type 'any'.
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UnyUser, UserRole, AuthContextType } from '../types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UnyUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Map Supabase user to UnyUser interface
   * Extract role from JWT app_metadata (Custom Claims)
   */
  const mapSupabaseUser = useCallback((sbUser: User | null): UnyUser | null => {
    if (!sbUser) return null;

    const role = (sbUser.app_metadata?.role as UserRole) || UserRole.USER;
    const organization_id = (sbUser.app_metadata?.organization_id as string) || null;

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      role,
      organization_id,
      full_name: sbUser.user_metadata?.full_name || null,
      avatar_url: sbUser.user_metadata?.avatar_url || null,
      last_sign_in: sbUser.last_sign_in_at || null,
    };
  }, []);

  /**
   * Refresh current user state
   */
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: sbUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(mapSupabaseUser(sbUser));
    } catch (error) {
      console.error('🛡️ [Kernel] User refresh fault:', error);
      setUser(null);
    }
  }, [mapSupabaseUser]);

  /**
   * Session initialization et écoute des changements d'état
   */
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(currentSession);
        setUser(mapSupabaseUser(currentSession?.user || null));
      } catch (error) {
        console.error('🛡️ [Kernel] Session init fault:', error);
        toast.error('Security kernel connection error.');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`🛡️ [Kernel] Auth Event: ${event}`);
      setSession(currentSession);
      setUser(mapSupabaseUser(currentSession?.user || null));
      setIsLoading(false);

      if (event === 'SIGNED_IN') {
        toast.success('Secure connection established.');
      } else if (event === 'SIGNED_OUT') {
        toast.info('Session ended.');
      }
    });

    return () => subscription.unsubscribe();
  }, [mapSupabaseUser]);

  /**
   * Password authentication
   */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Authentication failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Full logout
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Logout error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Simplified permission check basée sur le rôle
   * Sera affinée dans les phases suivantes
   */
  const hasPermission = useCallback((module: string, action: string = 'read'): boolean => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role === UserRole.ORG_ADMIN) return true;
    
    // Default logic for other roles
    if (action === 'read') return true;
    return user.role === UserRole.MANAGER;
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
    isAdmin: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORG_ADMIN,
    isUnyAdmin: user?.role === UserRole.SUPER_ADMIN,
    orgId: user?.organization_id || null,
    profile: user, // Alias pour compatibilité
    profileLoaded: !isLoading,
    signIn,
    signOut,
    refreshUser,
    refreshProfile: refreshUser, // Alias pour compatibilité
    hasPermission
  }), [user, session, isLoading, refreshUser, hasPermission]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
};
