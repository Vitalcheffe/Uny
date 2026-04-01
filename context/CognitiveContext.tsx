import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { routeToCompetency, Competency } from '../services/aiOrchestrator';

// Define the types of entities the AI can interact with
export type EntityType = 'client' | 'project' | 'document' | 'invoice' | 'profile' | 'osint_event' | 'risk_assessment';

export interface FocusedEntity {
  id: string;
  type: EntityType;
  name: string;
  metadata?: any;
}

export interface CognitiveAction {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  details: any;
  reasoning?: string; // For the "Boîte Noire" auditability
}

interface CognitiveContextState {
  // Contextual Awareness
  activeModule: string;
  focusedEntities: FocusedEntity[];
  recentActions: CognitiveAction[];
  lastResponse: string | null;
  
  // Actions
  setActiveModule: (module: string) => void;
  addFocusedEntity: (entity: FocusedEntity) => void;
  removeFocusedEntity: (entityId: string) => void;
  clearFocusedEntities: () => void;
  logCognitiveAction: (action: string, details: any, reasoning?: string) => void;
  setLastResponse: (response: string | null) => void;
  
  // AI Intention Mapping (Future-proofing for Chat-Command)
  executeCommand: (intent: string, payload: any) => Promise<any>;
}

const CognitiveContext = createContext<CognitiveContextState | undefined>(undefined);

export const CognitiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, orgId } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [focusedEntities, setFocusedEntities] = useState<FocusedEntity[]>([]);
  const [recentActions, setRecentActions] = useState<CognitiveAction[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const addFocusedEntity = useCallback((entity: FocusedEntity) => {
    setFocusedEntities(prev => {
      // Avoid duplicates
      if (prev.some(e => e.id === entity.id)) return prev;
      return [...prev, entity];
    });
  }, []);

  const removeFocusedEntity = useCallback((entityId: string) => {
    setFocusedEntities(prev => prev.filter(e => e.id !== entityId));
  }, []);

  const clearFocusedEntities = useCallback(() => {
    setFocusedEntities([]);
  }, []);

  const logCognitiveAction = useCallback((action: string, details: any, reasoning?: string) => {
    const newAction: CognitiveAction = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      module: activeModule,
      details,
      reasoning
    };

    setRecentActions(prev => {
      const updated = [newAction, ...prev];
      return updated.slice(0, 50); // Keep last 50 actions in memory
    });

    // In a real implementation, this could also sync to Supabase/Firestore for the "Boîte Noire"
    console.log(`🧠 [Cognitive OS] Action Logged: ${action}`, { details, reasoning });
  }, [activeModule]);

  // Placeholder for the Intention Mapping Engine
  const executeCommand = useCallback(async (intent: string, payload: any) => {
    if (!orgId || !user) throw new Error("Authentication required for AI commands.");

    logCognitiveAction(`execute_intent:${intent}`, payload, `AI requested execution of ${intent} based on user prompt.`);
    
    // 1. Determine Competency based on intent
    let competency = Competency.WRITER;
    if (intent === 'analyze_data') competency = Competency.ANALYST;
    if (intent === 'legal_review') competency = Competency.LEGAL;

    // 2. Route to Orchestrator
    const prompt = `Intent: ${intent}\nPayload: ${JSON.stringify(payload)}\nUser Prompt: ${payload.raw_text || ''}`;
    
    try {
      const response = await routeToCompetency(prompt, competency, orgId, user.id);
      setLastResponse(response);
      console.log(`🤖 [AI Command Executor] Response:`, response);
      return { status: 'success', response, intent, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error("AI Command Execution Error:", error);
      throw error;
    }
  }, [logCognitiveAction, orgId, user]);

  const value = {
    activeModule,
    setActiveModule,
    focusedEntities,
    addFocusedEntity,
    removeFocusedEntity,
    clearFocusedEntities,
    recentActions,
    logCognitiveAction,
    executeCommand,
    lastResponse,
    setLastResponse
  };

  return (
    <CognitiveContext.Provider value={value}>
      {children}
    </CognitiveContext.Provider>
  );
};

export const useCognitive = () => {
  const context = useContext(CognitiveContext);
  if (context === undefined) {
    throw new Error('useCognitive must be used within a CognitiveProvider');
  }
  return context;
};
