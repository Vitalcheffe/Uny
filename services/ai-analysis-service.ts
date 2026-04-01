import { GoogleGenAI, Type } from "@google/genai";
import { firestoreService } from "../lib/firestore-service";

export interface AIAnalysisResult {
  entities: {
    names: string[];
    dates: string[];
    amounts: string[];
  };
  complianceRisks: {
    risk: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
  }[];
  actions: {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string[];
  }[];
  ganttTasks: {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    type: string;
    project?: string;
    dependencies?: string[];
  }[];
  reactFlowNodes: any[]; // Compatible with reactflow
  reactFlowEdges: any[]; // Compatible with reactflow
  analyzedAt: string;
}

export const aiAnalysisService = {
  async analyzeDocument(orgId: string, documentId: string, documentContent: string): Promise<AIAnalysisResult | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analysez le document suivant et extrayez les informations demandées.
      Le document est un texte brut extrait d'un fichier.
      
      Document:
      """
      ${documentContent}
      """
      
      Veuillez extraire :
      1. Les entités clés : Noms (personnes/entreprises), Dates, et Montants.
      2. Les risques de conformité par rapport aux normes marocaines (ex: CNDP, droit du travail, fiscalité).
      3. Les actions à entreprendre.
      
      De plus, générez :
      - Un format JSON compatible avec 'gantt-task-react' pour les actions à entreprendre (champs: id, name, start (YYYY-MM-DD), end (YYYY-MM-DD), progress, dependencies).
      - Un format JSON compatible avec 'reactflow' pour les concepts clés (nodes: {id, data: {label}, position: {x, y}}, edges: {id, source, target}).
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              entities: {
                type: Type.OBJECT,
                properties: {
                  names: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dates: { type: Type.ARRAY, items: { type: Type.STRING } },
                  amounts: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              complianceRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                    description: { type: Type.STRING }
                  }
                }
              },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    start: { type: Type.STRING },
                    end: { type: Type.STRING },
                    progress: { type: Type.NUMBER },
                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              ganttTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    start: { type: Type.STRING },
                    end: { type: Type.STRING },
                    progress: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                    project: { type: Type.STRING },
                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              reactFlowNodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    data: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING }
                      }
                    },
                    position: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              },
              reactFlowEdges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const resultText = response.text;
      if (!resultText) return null;

      const analysisData = JSON.parse(resultText) as AIAnalysisResult;
      analysisData.analyzedAt = new Date().toISOString();

      // Save to Supabase via firestoreService: documents/{documentId}/analyses
      await firestoreService.addDocument(`documents/${documentId}/analyses`, orgId, {
        ...analysisData,
        org_id: orgId
      });

      return analysisData;
    } catch (error) {
      console.error("Error during AI analysis:", error);
      return null;
    }
  },

  async analyzeAllPendingDocuments(orgId: string) {
    try {
      // Fetch all documents for the org
      const docs = await firestoreService.getCollection('documents', orgId);
      
      const results = [];
      
      for (const documentDoc of docs) {
        // Check if it already has an analysis
        const analyses = await firestoreService.getCollection(`documents/${documentDoc.id}/analyses`, orgId);
        
        if (analyses.length === 0) {
          // We need some content to analyze. If the document has extracted_text, use it.
          // Otherwise, use a placeholder or summary if available.
          const contentToAnalyze = documentDoc.extracted_text || documentDoc.file_name || "Document sans contenu textuel extrait.";
          
          const analysis = await this.analyzeDocument(orgId, documentDoc.id, contentToAnalyze);
          if (analysis) {
            results.push({ documentId: documentDoc.id, analysis });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error analyzing pending documents:", error);
      throw error;
    }
  }
};
