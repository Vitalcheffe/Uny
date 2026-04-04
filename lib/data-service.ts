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
      toast.error("Error during la récupération de l'organisation.");
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
      toast.error(`Failure de l'upload: ${error.message}`);
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
      toast.error('Error during la suppression du document.');
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
  }): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log("URL:", supabaseUrl);
      console.log("KEY:", supabaseKey ? "exists" : "MISSING");
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configuration Supabase manquante. Veuillez vérifier les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel.");
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/audit_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          company_name: payload.company_name,
          email: payload.email,
          team_size: payload.team_size || '1-10',
          industry: payload.industry || 'TECH',
          status: 'PENDING'
        })
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errText = await response.text();
        console.error("Error response:", errText);
        // Provide more helpful error based on status
        if (response.status === 404) {
          throw new Error("Table 'audit_requests' non trouvée. Exécutez les migrations Supabase: https://supabase.com/dashboard/project/_/sql");
        } else if (response.status === 401 || response.status === 403) {
          throw new Error("Permission refusée. Vérifiez les politiques RLS pour audit_requests.");
        } else if (response.status >= 500) {
          throw new Error("Erreur serveur Supabase. Veuillez vérifier que le projet Supabase est actif.");
        } else {
          throw new Error(errText || `Erreur ${response.status}: La demande n'a pas pu être envoyée.`);
        }
      }
      
      console.log("SUCCESS!");
      return true;
    } catch (error: any) {
      console.error("ERROR:", error.message);
      return false;
    }
  }
}
