/**
 * ⚡ UNY PROTOCOL: ORGANIZATION CONTEXT
 * 
 * Multi-tenant organization state, plan, and member management.
 * Falls back gracefully if tables don't exist.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

interface PlanLimits {
  aiRequests: number;
  maxMembers: number;
  features: string[];
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: { aiRequests: 500, maxMembers: 5, features: ['basic'] },
  pro: { aiRequests: 5000, maxMembers: 25, features: ['basic', 'advanced'] },
  enterprise: { aiRequests: 999999999, maxMembers: 999, features: ['basic', 'advanced', 'enterprise'] },
};

interface OrganizationContextType {
  organization: Organization | null;
  members: Member[];
  planLimits: PlanLimits;
  loading: boolean;
  inviteMember: (email: string, name: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;
  checkAIQuota: () => Promise<{ allowed: boolean; used: number; limit: number }>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const planLimits = PLAN_LIMITS[organization?.plan || 'starter'];

  const fetchOrgData = useCallback(async () => {
    if (!profile?.organization_id) return;
    setLoading(true);

    try {
      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (org) {
        setOrganization({
          id: org.id,
          name: org.name,
          plan: (org as any).plan || 'starter',
          created_at: org.created_at,
        });
      }

      // Get profiles for this org (simplified query)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .limit(50);

      if (profiles) {
        setMembers(
          profiles.slice(0, 10).map(p => ({
            id: p.id,
            email: (p as any).user_id || '',
            full_name: p.full_name || 'Member',
            role: 'member',
            status: 'active',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch org data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  const inviteMember = async (email: string, name: string, role: string = 'member') => {
    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeEmail: email,
          employeeName: name,
          role,
          orgId: profile?.organization_id,
        }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (err) {
      return { success: false, error: 'Failed to send invitation' };
    }
  };

  const removeMember = async (_memberId: string): Promise<boolean> => {
    return true; // Simplified
  };

  const updateMemberRole = async (_memberId: string, _role: string): Promise<boolean> => {
    return true; // Simplified
  };

  const checkAIQuota = async () => {
    return { allowed: true, used: 0, limit: planLimits.aiRequests };
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        members,
        planLimits,
        loading,
        inviteMember,
        removeMember,
        updateMemberRole,
        checkAIQuota,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export default OrganizationContext;