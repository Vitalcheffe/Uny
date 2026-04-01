/**
 * ⚡ UNY PROTOCOL: AUTH TYPES
 *
 * Strict type definitions for authentication and authorization.
 * Roles follow the multi-tenant permission model:
 *   SUPER_ADMIN > ORG_ADMIN > MANAGER > USER > GUEST
 */

import { Session } from '@supabase/supabase-js';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  GUEST = 'GUEST',
}

export interface UserAppMetadata {
  role: UserRole;
  organization_id?: string;
}

export interface UnyUser {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  avatar?: string | null;
  last_sign_in: string | null;
  created_at?: string;
  onboarding_completed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuthState {
  user: UnyUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  orgId: string | null;
  isAdmin: boolean;
  isUnyAdmin: boolean;
  profile: UnyUser | null;
  profileLoaded: boolean;
  hasPermission: (module: string, action?: string) => boolean;
}
