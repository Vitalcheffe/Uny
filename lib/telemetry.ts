
import { TelemetryContext, TelemetryEntry } from '../types';
import { supabase } from './supabase';

/**
 * UNY Telemetry Engine v2.0.0 (Supabase Optimized)
 * Purpose: Real-time interception and logging of enterprise signals.
 */
export const logTelemetry = async (
  event_type: 'AUTOPILOT_APPROVAL' | 'AUTOPILOT_REJECTION' | 'FEEDBACK_SUBMISSION' | 'VELOCITY_DRIFT' | 'NEURAL_INTERACTION' | 'AI_ALERT' | 'AI_FEEDBACK_SUBMITTED',
  metric_label: string,
  context: Partial<TelemetryContext> = {},
  payload?: any,
  org_id?: string
) => {
  const logEntry = {
    event_type,
    metric_label,
    context: {
      clarityScore: context.clarityScore ?? 100,
      revenueVelocity: context.revenueVelocity ?? 0,
      clientSentiment: context.clientSentiment ?? 80,
      activeNodes: context.activeNodes ?? 0,
    },
    payload: payload ?? {}, // Ensure payload is at least an empty object
    timestamp: new Date().toISOString(),
    session_id: (window as any).UNY_SESSION_ID || crypto.randomUUID(),
    org_id: org_id || (window as any).UNY_ORG_ID || 'GLOBAL',
    build: '2100.5.1-live'
  };

  if (!(window as any).UNY_SESSION_ID) {
    (window as any).UNY_SESSION_ID = logEntry.session_id;
  }
  
  if (org_id && !(window as any).UNY_ORG_ID) {
    (window as any).UNY_ORG_ID = org_id;
  }

  if ((import.meta as any).env?.DEV) {
    console.debug(`%c[SIGNAL] ${event_type}: ${metric_label}`, 'color: #3b82f6; font-weight: bold;');
  }

  // Persist to Supabase
  try {
    const { error } = await (supabase as any)
      .from('telemetry_logs')
      .insert([logEntry]);
    
    if (error) {
      if ((import.meta as any).env?.DEV) {
        console.error('Telemetry Persistence Fault:', error);
      }
    }
  } catch (err) {
    // Fail silently to prevent UI disruption
  }
};
