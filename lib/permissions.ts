
import { UserRole } from '../types';

export type PermissionAction = 'read' | 'write' | 'delete' | 'special';
export type AppModule = 
  | 'finance' 
  | 'rh' 
  | 'documents' 
  | 'projects' 
  | 'team' 
  | 'strategy' 
  | 'telemetry' 
  | 'admin'
  | 'audit';

export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<AppModule, PermissionAction[]>>> = {
  OWNER: {
    finance: ['read', 'write', 'delete', 'special'],
    rh: ['read', 'write', 'delete', 'special'],
    documents: ['read', 'write', 'delete', 'special'],
    projects: ['read', 'write', 'delete', 'special'],
    team: ['read', 'write', 'delete', 'special'],
    strategy: ['read', 'write', 'delete', 'special'],
    telemetry: ['read', 'write', 'delete', 'special'],
    admin: ['read', 'write', 'delete', 'special'],
    audit: ['read'],
  },
  SUPER_ADMIN: {
    finance: ['read', 'write', 'delete', 'special'],
    rh: ['read', 'write', 'delete', 'special'],
    documents: ['read', 'write', 'delete', 'special'],
    projects: ['read', 'write', 'delete', 'special'],
    team: ['read', 'write', 'delete', 'special'],
    strategy: ['read', 'write', 'delete', 'special'],
    telemetry: ['read', 'write', 'delete', 'special'],
    admin: ['read', 'write', 'delete', 'special'],
    audit: ['read'],
  },
  ADMIN: {
    finance: ['read', 'write', 'special'],
    rh: ['read', 'write'], 
    documents: ['read', 'write', 'delete', 'special'],
    projects: ['read', 'write', 'delete', 'special'],
    team: ['read', 'write', 'special'],
    strategy: ['read', 'write', 'special'],
    telemetry: ['read', 'write'],
    admin: ['read', 'write'],
    audit: ['read'],
  },
  MANAGER: {
    finance: ['read'],
    rh: ['read'],
    documents: ['read', 'write'],
    projects: ['read', 'write', 'special'],
    team: ['read', 'write'],
    strategy: ['read'],
    telemetry: ['read'],
    audit: ['read'],
  },
  EMPLOYEE: {
    documents: ['read', 'write'],
    projects: ['read', 'write'],
    team: ['read'],
    audit: ['read'],
  },
  DIR_RH: {
    rh: ['read', 'write', 'special'],
    team: ['read', 'write', 'special'],
    documents: ['read', 'write'],
    projects: ['read'],
    audit: ['read'],
  },
  FINANCE_CONTROLLER: {
    finance: ['read', 'write', 'special'],
    documents: ['read', 'write'],
    projects: ['read'],
    strategy: ['read'],
    audit: ['read'],
    telemetry: ['read'],
  },
  HR_MANAGER: {
    rh: ['read', 'write'], 
    team: ['read', 'write'],
    documents: ['read', 'write'],
    audit: ['read'],
  },
  LEGAL_COUNSEL: {
    documents: ['read'],
    rh: ['read'], 
    finance: ['read'],
    telemetry: ['read', 'special'],
    audit: ['read'],
  },
  OPS_MANAGER: {
    projects: ['read', 'write', 'special'],
    finance: ['read'],
    documents: ['read', 'write', 'special'],
    team: ['read'],
    audit: ['read'],
  },
  CONTRIBUTOR: {
    documents: ['read', 'write'],
    projects: ['read', 'write'],
    team: ['read'],
  },
  OPERATIVE: {
    documents: ['read', 'write'],
    projects: ['read', 'write'],
    team: ['read'],
    finance: ['read'],
    strategy: ['read'],
  },
  AUDITOR: {
    finance: ['read'],
    rh: ['read'],
    documents: ['read'],
    projects: ['read'],
    team: ['read'],
    strategy: ['read'],
    audit: ['read'],
    telemetry: ['read'],
  },
  GUEST: {
    documents: ['read'],
    projects: ['read'],
    finance: ['read'],
    team: ['read'],
    strategy: ['read'],
    rh: ['read'],
  },
  CLIENT_VIP: {
    finance: ['read'],
    projects: ['read'],
    documents: ['read'],
  }
};

export const checkRolePermission = (
  role: UserRole | undefined, 
  module: AppModule, 
  action: PermissionAction = 'read'
): boolean => {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  
  const moduleActions = permissions[module];
  if (!moduleActions) return false;
  
  return moduleActions.includes(action);
};
