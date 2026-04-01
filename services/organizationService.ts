/**
 * ⚡ UNY PROTOCOL: ORGANIZATION SERVICE
 *
 * Handles organization lifecycle: creation, onboarding, and workspace initialization.
 * Called after an admin approves an audit request.
 */

import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';

interface SpawnOptions {
  company_name: string;
  email: string;
  sector?: string;
  team_size?: string;
  currency?: string;
}

interface SpawnResult {
  orgId: string;
  success: boolean;
}

export const organizationService = {
  /**
   * Create a new organization after audit approval.
   * Generates a unique slug-based ID and initializes the workspace.
   *
   * @param auditRequest - Approved audit data
   * @returns The new organization ID
   */
  async spawnOrganization(auditRequest: SpawnOptions): Promise<SpawnResult> {
    try {
      const timestamp = Date.now().toString().slice(-4);
      const cleanSlug = auditRequest.company_name
        .replace(/[^A-Za-z0-9]/g, '-')
        .toUpperCase()
        .slice(0, 30);
      const orgId = `${cleanSlug}-${timestamp}`;

      // 1. Create Organization record
      const { error: orgError } = await (supabase as any)
        .from('organizations')
        .insert({
          id: orgId,
          name: auditRequest.company_name,
          sector: auditRequest.sector || 'TECH',
          team_size: auditRequest.team_size || '1',
          currency: auditRequest.currency || 'MAD',
          email: auditRequest.email,
          subscription_status: 'trial',
          metadata: {
            billing_type: 'RECURRING',
            primary_goal: 'CASHFLOW',
            ai_preference: 'ASSISTED',
          },
        });

      if (orgError) throw orgError;

      console.log(`✅ [OrgService] Organization spawned: ${orgId}`);
      return { orgId, success: true };
    } catch (error) {
      console.error('❌ [OrgService] spawnOrganization failed:', error);
      toast.error("Erreur lors de la création de l'organisation.");
      throw error;
    }
  },

  /**
   * Get organization by ID.
   */
  async getOrganization(orgId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ [OrgService] getOrganization failed:', error);
      return null;
    }
  },

  /**
   * Update organization settings.
   */
  async updateOrganization(
    orgId: string,
    updates: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orgId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ [OrgService] updateOrganization failed:', error);
      toast.error('Erreur lors de la mise à jour.');
      return false;
    }
  },
};
