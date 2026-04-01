/**
 * ⚡ UNY PROTOCOL: SUPABASE DATABASE TYPES (V1)
 * Description: Supabase database type definitions.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          sector: string | null
          team_size: string | null
          annual_revenue_goal: number | null
          currency: string | null
          trial_ends_at: string | null
          subscription_status: string | null
          stripe_customer_id: string | null
          current_period_end: string | null
          ai_usage_count: number | null
          email: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sector?: string | null
          team_size?: string | null
          annual_revenue_goal?: number | null
          currency?: string | null
          trial_ends_at?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          current_period_end?: string | null
          ai_usage_count?: number | null
          email?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sector?: string | null
          team_size?: string | null
          annual_revenue_goal?: number | null
          currency?: string | null
          trial_ends_at?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          current_period_end?: string | null
          ai_usage_count?: number | null
          email?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      documents: {
        Row: {
          id: string
          org_id: string | null
          folder_id: string | null
          uploaded_by: string | null
          file_name: string
          file_type: string | null
          file_size: number | null
          storage_path: string
          extracted_text: string | null
          ai_analysis: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          folder_id?: string | null
          uploaded_by?: string | null
          file_name: string
          file_type?: string | null
          file_size?: number | null
          storage_path: string
          extracted_text?: string | null
          ai_analysis?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          folder_id?: string | null
          uploaded_by?: string | null
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          storage_path?: string
          extracted_text?: string | null
          ai_analysis?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      audit_ledger: {
        Row: {
          id: string
          organization_id: string | null
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_email: string | null
          details: string | null
          timestamp: string
          user_agent: string | null
          context: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_email?: string | null
          details?: string | null
          timestamp?: string
          user_agent?: string | null
          context?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_email?: string | null
          details?: string | null
          timestamp?: string
          user_agent?: string | null
          context?: string | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          org_id: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          onboarding_completed: boolean | null
          salary: number | null
          health_data: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          onboarding_completed?: boolean | null
          salary?: number | null
          health_data?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          onboarding_completed?: boolean | null
          salary?: number | null
          health_data?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          org_id: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id?: string | null
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      ai_request_logs: {
        Row: {
          id: string
          user_id: string | null
          request_hash: string
          is_masked: boolean
          model_used: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          request_hash: string
          is_masked?: boolean
          model_used: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          request_hash?: string
          is_masked?: boolean
          model_used?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      folders: {
        Row: {
          id: string
          org_id: string
          parent_id: string | null
          name: string
          path: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          parent_id?: string | null
          name: string
          path: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          parent_id?: string | null
          name?: string
          path?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      contracts: {
        Row: {
          id: string
          org_id: string
          title: string
          contract_type: string | null
          party_name: string | null
          party_type: string | null
          start_date: string | null
          end_date: string | null
          amount: number
          status: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          contract_type?: string | null
          party_name?: string | null
          party_type?: string | null
          start_date?: string | null
          end_date?: string | null
          amount?: number
          status?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          contract_type?: string | null
          party_name?: string | null
          party_type?: string | null
          start_date?: string | null
          end_date?: string | null
          amount?: number
          status?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      connections: {
        Row: {
          id: string
          org_id: string | null
          source_type: string
          source_id: string
          target_type: string
          target_id: string
          connection_type: string
          ai_confidence: number | null
          ai_reasoning: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          source_type: string
          source_id: string
          target_type: string
          target_id: string
          connection_type: string
          ai_confidence?: number | null
          ai_reasoning?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          source_type?: string
          source_id?: string
          target_type?: string
          target_id?: string
          connection_type?: string
          ai_confidence?: number | null
          ai_reasoning?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      time_entries: {
        Row: {
          id: string
          org_id: string
          user_id: string
          project_id: string | null
          project_name: string | null
          duration_seconds: number
          description: string | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          project_id?: string | null
          project_name?: string | null
          duration_seconds?: number
          description?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          project_id?: string | null
          project_name?: string | null
          duration_seconds?: number
          description?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      clients: {
        Row: {
          id: string
          org_id: string | null
          name: string
          email: string | null
          status: string | null
          trust_score: number | null
          revenue_attribution: number | null
          sentiment_score: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          email?: string | null
          status?: string | null
          trust_score?: number | null
          revenue_attribution?: number | null
          sentiment_score?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          name?: string
          email?: string | null
          status?: string | null
          trust_score?: number | null
          revenue_attribution?: number | null
          sentiment_score?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      projects: {
        Row: {
          id: string
          org_id: string | null
          client_id: string | null
          name: string
          status: string | null
          budget: number | null
          revenue: number | null
          priority: string | null
          deadline: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          client_id?: string | null
          name: string
          status?: string | null
          budget?: number | null
          revenue?: number | null
          priority?: string | null
          deadline?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          client_id?: string | null
          name?: string
          status?: string | null
          budget?: number | null
          revenue?: number | null
          priority?: string | null
          deadline?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      invoices: {
        Row: {
          id: string
          org_id: string
          project_id: string | null
          amount: number
          status: string | null
          due_date: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          project_id?: string | null
          amount?: number
          status?: string | null
          due_date?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          project_id?: string | null
          amount?: number
          status?: string | null
          due_date?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      telemetry_logs: {
        Row: {
          id: string
          org_id: string | null
          event_type: string
          metric_label: string
          context: Json
          payload: Json
          timestamp: string
          session_id: string | null
          build: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          org_id?: string | null
          event_type: string
          metric_label: string
          context?: Json
          payload?: Json
          timestamp?: string
          session_id?: string | null
          build?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          org_id?: string | null
          event_type?: string
          metric_label?: string
          context?: Json
          payload?: Json
          timestamp?: string
          session_id?: string | null
          build?: string | null
          metadata?: Json
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      todos: {
        Row: {
          id: string
          name: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_completed?: boolean
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      audit_requests: {
        Row: {
          id: string
          organization_name: string
          email: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_name: string
          email: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_name?: string
          email?: string
          status?: string
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
    }
    Views: {
      org_velocity_tracker: {
        Row: {
          org_id: string | null
          total_projects: number | null
          total_revenue: number | null
          avg_revenue_per_project: number | null
        }
        Insert: any
        Update: any
        Relationships: any[]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'USER' | 'GUEST'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
