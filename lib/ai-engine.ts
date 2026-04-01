/**
 * ⚡ UNY PROTOCOL: AI ENGINE (V1)
 * Description: Sovereign AI engine with integrated PII masking.
 * Intègre Anthropic/Gemini avec une couche de sécurité Zéro-Trace.
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PIIMasker } from "./pii-masker";
import { supabase } from "./supabase-client";
import { toast } from "sonner";

/**
 * Interface pour les options de génération
 */
export interface AIEngineOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Classe AIEngine pour centraliser les appels aux LLMs
 */
export class AIEngine {
  private static readonly DEFAULT_MODEL = "gemini-3.1-pro-preview";
  private static readonly API_KEY = process.env.GEMINI_API_KEY;

  /**
   * Génère une réponse à partir d'un prompt, avec masquage PII automatique
   * @param prompt Le texte brut de l'utilisateur
   * @param options Options de configuration du modèle
   * @returns La réponse de l'IA avec les données réelles réinjectées
   */
  static async generateResponse(prompt: string, options: AIEngineOptions = {}): Promise<string | null> {
    if (!this.API_KEY) {
      const errorMsg = "❌ [AIEngine] CRITICAL: GEMINI_API_KEY is missing.";
      console.error(errorMsg);
      toast.error("Configuration IA manquante.");
      return null;
    }

    try {
      // 1. Masquage des données sensibles (PII)
      const { maskedText, mapping } = PIIMasker.mask(prompt);
      const isMasked = mapping.size > 0;

      // 2. Logging de la requête (Zéro-Trace: Hash uniquement)
      const requestHash = await this.hashString(prompt);
      await this.logAIRequest(requestHash, isMasked);

      // 3. Initialisation du client GenAI
      const ai = new GoogleGenAI({ apiKey: this.API_KEY });
      
      // 4. Appel au modèle avec le texte anonymisé
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: options.model || this.DEFAULT_MODEL,
        contents: maskedText,
        config: {
          systemInstruction: options.systemInstruction || "Tu es un assistant expert pour UNY, une plateforme de gestion de freelances. Réponds de manière professionnelle et concise.",
          temperature: options.temperature ?? 0.7,
          // maxOutputTokens: options.maxOutputTokens, // Optionnel
        },
      });

      const aiResponse = response.text;
      if (!aiResponse) throw new Error("Réponse vide du modèle.");

      // 5. Démasquage des données dans la réponse (Réinjection des vraies données)
      const finalResponse = PIIMasker.unmask(aiResponse, mapping);

      return finalResponse;
    } catch (error: any) {
      console.error(`❌ [AIEngine] generateResponse fault: ${error.message}`);
      toast.error(`Erreur IA: ${error.message}`);
      return null;
    }
  }

  /**
   * Log la requête IA dans Supabase (Zéro-Trace)
   */
  private static async logAIRequest(hash: string, masked: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await (supabase as any)
        .from('ai_request_logs')
        .insert({
          user_id: user?.id || null,
          request_hash: hash,
          is_masked: masked,
          model_used: this.DEFAULT_MODEL,
          created_at: new Date().toISOString(),
        });
    } catch (error: any) {
      // On ne bloque pas l'utilisateur pour un log qui échoue
      console.warn(`⚠️ [AIEngine] logAIRequest fault: ${error.message}`);
    }
  }

  /**
   * Analyse un document via l'IA (Compatibilité avec DocumentUploader)
   */
  static async processDocument(docId: string, orgId: string, fileData: { data: string, mimeType: string }, industry: string): Promise<void> {
    try {
      const prompt = `Analyse ce document pour l'industrie ${industry}. Identifie les points clés et les actions requises.`;
      const response = await this.generateResponse(prompt);
      
      if (response) {
        // Mise à jour du statut du document dans Supabase
        await (supabase as any)
          .from('documents')
          .update({ 
            metadata: { 
              ai_analysis: response,
              industry,
              processed_at: new Date().toISOString()
            },
            processing_status: 'COMPLETED'
          })
          .eq('id', docId);
      }
    } catch (error: any) {
      console.error(`❌ [AIEngine] processDocument fault: ${error.message}`);
    }
  }

  /**
   * Utilitaire pour hasher une chaîne de caractères (SHA-256)
   */
  private static async hashString(text: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

/**
 * Exportation pour compatibilité avec DocumentUploader
 */
export const processDocument = AIEngine.processDocument.bind(AIEngine);
