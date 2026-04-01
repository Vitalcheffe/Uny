/**
 * ⚡ UNY PROTOCOL: AUTH TYPES (V1)
 * Description: Définitions strictes des types d'authentification et de rôles.
 */

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
  avatar?: string | null; // Alias for compatibility
  last_sign_in: string | null;
  created_at?: string;
  onboarding_completed?: boolean;
  metadata?: Record<string, any>; // Pour les données spécifiques à l'utilisateur
}

export interface AuthState {
  user: UnyUser | null;
  session: any | null; // Supabase Session type
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Alias for compatibility
  // Derived properties for UI compatibility
  orgId: string | null;
  isAdmin: boolean;
  isUnyAdmin: boolean;
  profile: UnyUser | null; // Alias for user during transition
  profileLoaded: boolean;
  hasPermission: (module: string, action?: string) => boolean;
}
