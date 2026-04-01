import { GoogleGenAI, Type } from "@google/genai";
import { firestoreService } from './supabase-data-layer';
import { extractTextFromPDF, performOCR } from './documentParser';
import { supabase } from './supabase';
import { NEREngine } from './ner-engine';

interface ExtractionResult {
  atoms: any[];
  edges: any[];
  suggestions: any[];
  confidence: number;
}

export class NeuralExtractor {
  /**
   * Main forensic pipeline with enhanced storage resilience
   */
  async processDocument(
    documentId: string,
    documentUrl: string,
    documentType: string,
    orgId: string
  ): Promise<ExtractionResult> {
    
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Neural Intelligence Node Offline: API Key Missing.");
    }

    // 1. Verify Session Integrity
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Security Protocol Breach: Unauthenticated session.");

    const logId = await firestoreService.addDocument('ai_extraction_logs', orgId, {
      org_id: orgId,
      document_id: documentId,
      status: 'processing',
      model_used: 'gemini-3-pro-preview',
      created_at: new Date().toISOString()
    });
    
    try {
      // 2. Forensic Extraction & Anonymization
      const rawText = await this.extractText(documentUrl, documentType);
      
      // 2.5 Secure Proxy: Mask PII before sending to the main extraction model
      console.log('🛡️ [SecureProxy] Anonymizing payload via NER Engine...');
      const anonymizedText = await NEREngine.maskPII(rawText);
      
      const extraction = await this.extractKnowledge(anonymizedText, documentType);
      
      // 3. Robust Archival to 'analytics' node (Supabase Storage)
      const analyticalPayload = JSON.stringify({
        source_doc_id: documentId,
        timestamp: new Date().toISOString(),
        extraction_model: 'gemini-3-pro-preview',
        data: extraction
      });

      const fileName = `${orgId}/${documentId}_analysis.json`;
      console.log(`📡 [Storage] Targeting Node: analytics | Path: ${fileName}`);

      // Attempt upload with internal retry logic
      await this.robustUpload('analytics', fileName, analyticalPayload);
      
      // 4. Save Atoms with source linking
      const savedAtoms = await this.saveAtoms(
        extraction.atoms,
        documentId,
        orgId
      );
      
      // 5. Map Connections
      const edges = await this.createEdges(
        extraction.edges,
        savedAtoms,
        orgId
      );
      
      // 6. Finalize Log
      await firestoreService.updateDocument('ai_extraction_logs', orgId, logId, {
        status: 'completed',
        atoms_extracted: savedAtoms.length,
        edges_created: edges.length,
        avg_confidence: extraction.overall_confidence,
        processing_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      });
        
      await firestoreService.updateDocument('documents', orgId, documentId, {
        ai_analysis: {
          analytical_node_path: fileName,
          suggestions: extraction.suggestions,
          summary: extraction.executive_summary,
          risk_assessment: extraction.risk_assessment
        },
        processing_status: 'COMPLETED',
        updated_at: new Date().toISOString()
      });
      
      return {
        atoms: savedAtoms,
        edges,
        suggestions: extraction.suggestions,
        confidence: extraction.overall_confidence
      };
      
    } catch (error: any) {
      console.error("🔴 [Kernel] Forensic Extraction Pipeline Failure:", error);
      await firestoreService.updateDocument('ai_extraction_logs', orgId, logId, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });
      throw error;
    }
  }

  private async robustUpload(bucket: string, path: string, payload: string, retries = 2): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, payload, {
            contentType: 'application/json',
            upsert: true
          });
        
        if (error) throw error;
        return;
      } catch (err) {
        if (i === retries) throw err;
        console.warn(`⚠️ [Storage] Retrying upload to [${bucket}] (${i + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  private async extractText(url: string, type: string): Promise<string> {
    if (type.includes('pdf')) {
      return await extractTextFromPDF(url);
    } else if (type.includes('image')) {
      return await performOCR(url);
    } else {
      const response = await fetch(url);
      return await response.text();
    }
  }
  
  private async extractKnowledge(text: string, documentType: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      UNY SYSTEMS: DEEP FORENSIC PROTOCOL v15.5
      Perform forensic scan on: ${documentType}
      Payload: ${text}
      Format: JSON Schema Match Required.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executive_summary: { type: Type.STRING },
            risk_assessment: {
              type: Type.OBJECT,
              properties: { level: { type: Type.STRING }, details: { type: Type.STRING } }
            },
            atoms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  entity_type: { type: Type.STRING },
                  key: { type: Type.STRING },
                  value: { type: Type.OBJECT },
                  value_text: { type: Type.STRING },
                  source_location: { type: Type.STRING },
                  extraction_context: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER },
                  ai_reasoning: { type: Type.STRING }
                }
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from_key: { type: Type.STRING },
                  to_key: { type: Type.STRING },
                  relationship_type: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER }
                }
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { type: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } }
              }
            },
            overall_confidence: { type: Type.NUMBER }
          },
          required: ["atoms", "edges", "overall_confidence"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
  
  private async saveAtoms(atoms: any[], documentId: string, orgId: string): Promise<any[]> {
    if (!atoms || atoms.length === 0) return [];

    const savedAtoms: any[] = [];
    for (const atom of atoms) {
      const atomData = {
        org_id: orgId,
        category: atom.category,
        entity_type: atom.entity_type,
        key: atom.key,
        value: atom.value,
        value_text: atom.value_text,
        source_document_id: documentId,
        source_location: atom.source_location,
        extraction_context: atom.extraction_context,
        confidence_score: atom.confidence_score,
        ai_reasoning: atom.ai_reasoning,
        validation_status: 'pending',
        created_at: new Date().toISOString()
      };
      const id = await firestoreService.addDocument('knowledge_atoms', orgId, atomData);
      savedAtoms.push({ id, ...atomData });
    }
    
    return savedAtoms;
  }
  
  private async createEdges(edges: any[], savedAtoms: any[], orgId: string): Promise<any[]> {
    if (!edges || edges.length === 0 || savedAtoms.length === 0) return [];

    const createdEdges: any[] = [];
    for (const edge of edges) {
      const fromAtom = savedAtoms.find(a => a.key === edge.from_key);
      const toAtom = savedAtoms.find(a => a.key === edge.to_key);
      if (!fromAtom || !toAtom) continue;
      
      const edgeData = {
        org_id: orgId,
        from_atom_id: fromAtom.id,
        to_atom_id: toAtom.id,
        relationship_type: edge.relationship_type,
        confidence_score: edge.confidence_score,
        inferred_by: 'ai',
        created_at: new Date().toISOString()
      };
      const id = await firestoreService.addDocument('knowledge_edges', orgId, edgeData);
      createdEdges.push({ id, ...edgeData });
    }
    
    return createdEdges;
  }
}

export const neuralExtractor = new NeuralExtractor();