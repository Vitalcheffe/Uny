import { GoogleGenAI } from "@google/genai";
import { logAuditAction, AuditAction } from "./auditService";
import { firestoreService } from "../lib/supabase-data-layer";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export enum Competency {
  ANALYST = 'ANALYST',
  WRITER = 'WRITER',
  LEGAL = 'LEGAL',
  VISION = 'VISION'
}

const COMPETENCY_MODELS: Record<Competency, string> = {
  [Competency.ANALYST]: 'gemini-3.1-pro-preview',
  [Competency.WRITER]: 'gemini-3-flash-preview',
  [Competency.LEGAL]: 'gemini-3.1-pro-preview',
  [Competency.VISION]: 'gemini-3.1-flash-image-preview'
};

const CREDIT_COSTS: Record<Competency, number> = {
  [Competency.ANALYST]: 10,
  [Competency.WRITER]: 2,
  [Competency.LEGAL]: 8,
  [Competency.VISION]: 5
};

/**
 * Simple PII Masking filter to ensure data sovereignty.
 * Replaces sensitive information with generic labels.
 */
export const maskPII = (text: string): string => {
  let masked = text;
  // Email
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // Phone (Morocco format)
  masked = masked.replace(/(\+212|0)([ \-_/]*)(\d[ \-_/]*){9}/g, '[PHONE]');
  // Currency/Amounts
  masked = masked.replace(/\d+([.,]\d+)?\s*(MAD|DH|€|\$|EUR|USD)/gi, '[AMOUNT]');
  // ICE (Morocco)
  masked = masked.replace(/\d{15}/g, '[ICE]');
  return masked;
};

export const routeToCompetency = async (
  prompt: string,
  competency: Competency,
  organizationId: string,
  userId: string,
  shouldMask: boolean = true
) => {
  const modelName = COMPETENCY_MODELS[competency];
  const cost = CREDIT_COSTS[competency];

  // Pre-processing: PII Masking
  const processedPrompt = shouldMask ? maskPII(prompt) : prompt;

  // 1. Log the intent in the Immutable Ledger
  await logAuditAction(AuditAction.AI_QUERY, organizationId, { 
    competency, 
    modelName, 
    cost,
    masked: shouldMask 
  });

  try {
    // 2. Execute AI Query via the abstracted Competency model
    const response = await ai.models.generateContent({
      model: modelName,
      contents: processedPrompt,
    });

    const resultText = response.text || "No response generated.";

    // 3. Record credit consumption in the Pay-as-you-go ledger
    await firestoreService.addDocumentGlobal('credit_transactions', {
      amount: -cost,
      type: 'AI_QUERY',
      user_id: userId,
      organization_id: organizationId,
      description: `AI Competency: ${competency} (${modelName})`,
      timestamp: new Date().toISOString()
    });

    return resultText;
  } catch (error) {
    console.error(`AI Orchestration Error (${competency}):`, error);
    throw error;
  }
};
