/**
 * ⚡ UNY PROTOCOL: DATA SERVICE (V1)
 * Description: Interface de vérité pour toutes les opérations CRUD Supabase.
 * Zéro Firebase, Typage strict, Gestion des timestamps.
 */

import { supabase } from './supabase-client';
import { UnyUser, UserRole } from '../types/auth';
import { toast } from 'sonner';

/**
 * Interface pour les organisations
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
 * Interface pour les documents
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
 * Classe DataService pour centraliser les appels Supabase
 */
export class DataService {
  /**
   * Récupère les données d'une organisation par son ID
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
   * Upload d'un document vers Supabase Storage + Enregistrement en DB
   */
  static async uploadDocument(file: File, orgId: string): Promise<UnyDocument | null> {
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `orgs/${orgId}/docs/${fileName}`;

    try {
      // 1. Upload vers le bucket 'documents'
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (storageError) throw storageError;

      // 2. Enregistrement des métadonnées en DB
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
   * Log d'activité dans l'Audit Ledger
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
      // On ne bloque pas l'utilisateur pour un log d'audit qui échoue, mais on log l'erreur
      console.error(`❌ [DataService] logActivity fault: ${error.message}`);
    }
  }

  /**
   * Soft delete d'un document
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
   * Crée une nouvelle demande d'audit (Formulaire public)
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
          organization_name: payload.company_name, // Fallback pour satisfaire la contrainte NOT NULL
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
