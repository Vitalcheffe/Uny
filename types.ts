
import React from 'react';

export type UserRole = 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'EMPLOYEE'
  | 'OWNER' 
  | 'SUPER_ADMIN' 
  | 'DIR_RH' 
  | 'FINANCE_CONTROLLER' 
  | 'HR_MANAGER' 
  | 'LEGAL_COUNSEL' 
  | 'OPS_MANAGER' 
  | 'CONTRIBUTOR' 
  | 'AUDITOR' 
  | 'OPERATIVE' 
  | 'GUEST' 
  | 'CLIENT_VIP';

export interface Organization {
  id: string; 
  name: string;
  industry: 'DENTISTE' | 'AVOCAT' | 'LOGISTIQUE' | 'FINANCE' | 'RH' | 'JURIDIQUE' | 'AUTRE';
  ice?: string;
  moat_index: number;
  integrity_score: number;
  sector?: string;
  team_size?: string;
  currency?: string;
  trial_ends_at?: string;
  subscription_status?: 'trialing' | 'active' | 'past_due' | 'canceled';
  stripe_customer_id?: string;
  current_period_end?: string;
  ai_usage_count?: number;
  deleted_at?: string;
  metadata?: {
    billing_model?: string;
    primary_bottleneck?: string;
    ai_autonomy_level?: string;
    legacy_systems?: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string | null;
  full_name: string | null;
  email: string;
  role: UserRole;
  onboarding_completed: boolean;
  salary?: number; // In cents
  health_data?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
  deleted_at?: string;
  metadata?: {
    strategic_title?: string;
    department?: string;
    node_type?: string;
    burnout_risk?: number;
    ai_trust_score?: number;
    capacity_percentage?: number;
    annual_revenue_goal?: number;
    [key: string]: any;
  };
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD';
  trust_score: number;
  revenue_attribution?: number; // In cents
  sentiment_score?: number;
  deleted_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  client_id: string | null;
  client?: string;
  name: string;
  status: 'PROSPECTION' | 'AUDIT' | 'DEPLOYED' | 'Backlog' | 'Ongoing' | 'Review' | 'Completed' | 'PLANNING' | 'ACTIVE' | 'PAUSED';
  budget: number; // In cents
  revenue?: number; // In cents
  priority: 'High' | 'Medium' | 'Low';
  drift_probability?: number;
  deadline: string | null;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  project_id: string | null;
  client_id: string | null;
  client_name?: string;
  amount: number; // In cents
  tax_rate: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'Sent' | 'Paid' | 'Draft' | 'Overdue';
  due_date: string | null;
  paid_at: string | null;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_type: string;
  storage_path: string;
  category: 'INVOICE' | 'CONTRACT' | 'PAYSLIP' | 'UNCATEGORIZED';
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'pending' | 'processing';
  ai_confidence: number;
  extracted_data: any;
  ai_analysis?: any;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  org_id: string;
  user_id: string;
  project_id: string;
  project_name?: string;
  description: string;
  duration_minutes: number;
  duration_seconds?: number;
  date: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface TelemetryLog {
  id: string;
  org_id: string;
  event_type: 'SYSTEM_ERROR' | 'AI_DETECTION' | 'USER_ACTION' | 'SECURITY_BREACH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface StatItem {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

export interface BusinessIntelligence {
  activeNeuralConnections: number;
  moatIndex: number;
}

export interface NetworkStrength {
  connectedNodes: number;
  approvalVelocity: number;
  networkValueLocked: number;
}

export interface AutopilotAction {
  id: string;
  type: 'COMMUNICATION' | 'OPTIMIZATION' | 'RECOVERY';
  title: string;
  description: string;
  confidence: number;
}

export interface TelemetryContext {
  clarityScore: number;
  revenueVelocity: number;
  clientSentiment: number;
  activeNodes: number;
}

export interface TelemetryEntry {
  id: string;
  event_type: 'AUTOPILOT_APPROVAL' | 'AUTOPILOT_REJECTION' | 'FEEDBACK_SUBMISSION' | 'VELOCITY_DRIFT' | 'NEURAL_INTERACTION' | 'AI_ALERT' | 'AI_FEEDBACK_SUBMITTED';
  metric_label: string;
  context: TelemetryContext;
  payload?: any;
  timestamp: string;
  session_id: string;
  org_id: string;
  build: string;
}

export interface FiscalDeadline {
  id: string;
  org_id: string;
  due_date: string;
  label: string;
  type: 'TAX' | 'EXPENSE' | 'COMPLIANCE' | 'INCOME';
  urgent: boolean;
  status: 'PENDING' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}
