
import { GoogleGenAI, Type } from "@google/genai";
import { firestoreService } from "./firestore-service";

/**
 * UNY NEURAL INGESTION KERNEL v15.0
 * Enhanced forensic extraction using Gemini 3 Pro for maximum precision.
 */
export const processDocumentQueue = async (documentId: string, orgId: string, fileData: { data: string, mimeType: string }) => {
  // 1. Update status to PROCESSING
  await firestoreService.updateDocument('documents', orgId, documentId, { processing_status: 'PROCESSING' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // 2. Fetch existing context to prevent entity drift
    const [clients, projects] = await Promise.all([
      firestoreService.getCollection('clients', orgId, []),
      firestoreService.getCollection('projects', orgId, [])
    ]);

    const entityContext = {
      known_clients: clients?.map((c: any) => c.name) || [],
      known_projects: projects?.map((p: any) => p.name) || []
    };

    const ai = new GoogleGenAI({ apiKey });
    
    const runAnalysis = async (retryCount = 0): Promise<any> => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: {
            parts: [
              { inlineData: fileData }, 
              { text: `
                UNY FORENSIC PROTOCOL v15.0
                
                SYSTEM DIRECTIVE:
                Perform an exhaustive forensic scan of this document payload.
                Identify financial magnitudes, temporal nodes, nominal entities, and logical dependencies.
                
                CONTEXTUAL HINTS (Cross-reference with these if detected):
                - KNOWN CLIENTS: ${entityContext.known_clients.join(', ')}
                - KNOWN MISSIONS: ${entityContext.known_projects.join(', ')}

                PRECISION RULES:
                1. Amounts must be absolute numbers. Detect taxes (VAT/TVA) vs totals.
                2. Dates must follow ISO 8601 (YYYY-MM-DD).
                3. Entity Matching: Use high-precision matching for known hints.
                4. Logic Classification: Categorize into FINANCE, OPS, HR, or LEGAL silos.
                5. Anomaly Detection: Flag any inconsistencies with standard enterprise patterns.
              `}
            ]
          },
          config: {
            thinkingConfig: { thinkingBudget: 4000 },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: "High-level strategic summary." },
                department: { type: Type.STRING, description: "FINANCE, OPS, HR, or LEGAL" },
                risk_assessment: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, CRITICAL" },
                    reason: { type: Type.STRING }
                  }
                },
                amounts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      currency: { type: Type.STRING },
                      is_tax: { type: Type.BOOLEAN }
                    },
                    required: ["label", "value"]
                  }
                },
                dates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING, description: "YYYY-MM-DD" },
                      importance: { type: Type.STRING, description: "CRITICAL, STANDARD, INFORMATION" }
                    },
                    required: ["label", "value"]
                  }
                },
                entities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING, description: "Person, Organization, Department, Role" },
                      confidence: { type: Type.NUMBER }
                    },
                    required: ["name", "type"]
                  }
                },
                strategic_insights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      impact_area: { type: Type.STRING }
                    }
                  }
                },
                suggested_connections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      target_node_name: { type: Type.STRING },
                      target_node_type: { type: Type.STRING, description: "project or client" },
                      confidence: { type: Type.NUMBER },
                      reasoning: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ["summary", "department", "amounts", "dates", "entities", "suggested_connections", "strategic_insights"]
            }
          }
        });
        
        return JSON.parse(response.text || "{}");
      } catch (err: any) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
          return runAnalysis(retryCount + 1);
        }
        throw err;
      }
    };

    const report = await runAnalysis();

    // 3. Match suggested connections to real database IDs
    if (report.suggested_connections) {
      for (const conn of report.suggested_connections) {
        if (conn.target_node_type === 'project') {
          const p = projects.find((item: any) => item.name.toLowerCase().includes(conn.target_node_name.toLowerCase()));
          if (p) conn.target_id = p.id;
        } else if (conn.target_node_type === 'client') {
          const c = clients.find((item: any) => item.name.toLowerCase().includes(conn.target_node_name.toLowerCase()));
          if (c) conn.target_id = c.id;
        }
      }
    }

    // 4. Commit final payload to the vault
    await firestoreService.updateDocument('documents', orgId, documentId, {
      ai_analysis: report,
      processing_status: 'COMPLETED',
      ai_confidence: report.overall_confidence || 95
    });

    return report;
  } catch (err) {
    await firestoreService.updateDocument('documents', orgId, documentId, { processing_status: 'FAILED' });
    console.error("❌ Neural Kernel Fault:", err);
    return null;
  }
};
