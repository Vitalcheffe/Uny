import { firestoreService } from '../lib/supabase-data-layer';
import { toast } from 'sonner';

export const organizationService = {
  async spawnOrganization(auditRequest: any) {
    try {
      const timestamp = Date.now().toString().slice(-4);
      const cleanSlug = auditRequest.company_name.replace(/[^A-Za-z0-9]/g, '-').toUpperCase();
      const orgId = `${cleanSlug}-${timestamp}`;

      // 1. Create Organization
      await firestoreService.setDocument('organizations', orgId, orgId, {
        name: auditRequest.company_name,
        sector: 'TECH', // Default or from audit request
        team_size: '1',
        currency: 'USD',
        metadata: {
          billing_type: 'RECURRING',
          primary_goal: 'CASHFLOW',
          ai_preference: 'ASSISTED'
        }
      });

      // 2. Promote User to Org Admin (Update Profile)
      // Assuming auditRequest has a requester_id or email
      // For this simulation, we'll need to find the user profile by email
      // This part might need a backend function in a real app
      
      // 3. Generate License (Paddle)
      // Call Paddle API here
      
      // 4. Initialize Workspace
      // Create dedicated storage/knowledge hub entries

      return { orgId };
    } catch (error) {
      console.error("Error spawning organization:", error);
      throw error;
    }
  }
};
