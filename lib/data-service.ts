/**
 * ⚡ UNY PROTOCOL: DATA SERVICE (V1)
 * Description: Unified CRUD interface for all Supabase operations.
 * Zero Firebase, Typage strict, Gestion des timestamps.
 */

import { supabase } from './supabase-client';
import { UnyUser, UserRole } from '../types/auth';
import { toast } from 'sonner';

/**
 * Interface for organizations
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for documents
 */
export interface UnyDocument {
  id: string;
  name: string;
  storage_path: string;
  size: number;
  type: string;
  org_id: string;
  metadata: Record<string, any>;
  embedding?: number[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * DataService class for centralized Supabase calls
 */
export class DataService {
  /**
   * Retrieve organization data by ID
   */
  static async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Organization;
    } catch (error: any) {
      console.error(`❌ [DataService] getOrganization fault: ${error.message}`);
      toast.error("Erreur lors de la récupération de l'organisation.");
      return null;
    }
  }

  /**
   * Upload document to Supabase Storage + Save metadata to DB
   */
  static async uploadDocument(file: File, orgId: string): Promise<UnyDocument | null> {
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `orgs/${orgId}/docs/${fileName}`;

    try {
      // 1. Upload to bucket 'documents'
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (storageError) throw storageError;

      // 2. Save file metadata to database
      const { data: docData, error: dbError } = await (supabase as any)
        .from('documents')
        .insert({
          name: file.name,
          storage_path: storagePath,
          size: file.size,
          type: file.type,
          org_id: orgId,
          metadata: {
            original_name: file.name,
            last_modified: file.lastModified,
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success(`Document ${file.name} téléchargé avec succès.`);
      return docData as UnyDocument;
    } catch (error: any) {
      console.error(`❌ [DataService] uploadDocument fault: ${error.message}`);
      toast.error(`Échec de l'upload: ${error.message}`);
      return null;
    }
  }

  /**
   * Log activity to Audit Ledger
   */
  static async logActivity(action: string, target: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('audit_ledger')
        .insert({
          user_id: user?.id || null,
          action,
          target,
          metadata,
          ip_address: null, // Sera géré côté serveur si possible
        });

      if (error) throw error;
    } catch (error: any) {
      // Do not block user for failed audit log, mais on log l'erreur
      console.error(`❌ [DataService] logActivity fault: ${error.message}`);
    }
  }

  /**
   * Soft delete document
   */
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Document supprimé.');
      return true;
    } catch (error: any) {
      console.error(`❌ [DataService] deleteDocument fault: ${error.message}`);
      toast.error('Erreur lors de la suppression du document.');
      return false;
    }
  }

  /**
   * Create new audit request (Formulaire public)
   */
  static async createAuditRequest(payload: {
    company_name: string;
    email: string;
    team_size: string;
    industry: string;
    annual_revenue: string;
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      console.log("DEBUG_AUDIT_PAYLOAD", payload);
      
      const { error } = await (supabase as any)
        .from('audit_requests')
        .insert({
          company_name: payload.company_name,
          organization_name: payload.company_name, // Fallback for NOT NULL constraint
          email: payload.email,
          team_size: payload.team_size,
          industry: payload.industry,
          annual_revenue: payload.annual_revenue,
          type: payload.type || 'STANDARD',
          metadata: payload.metadata || {},
          status: 'PENDING'
        });

      if (error) throw error;
      
      toast.success("Demande d'audit envoyée avec succès !");
      return true;
    } catch (error: any) {
      console.error(`❌ [DataService] createAuditRequest fault: ${error.message}`);
      toast.error(`Échec de l'envoi: ${error.message}`);
      return false;
    }
  }
}
