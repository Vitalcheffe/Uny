
import { GoogleGenAI, Type } from "@google/genai";

/**
 * UNY HR INGESTION PROTOCOL v3.0
 * Uses structural pattern matching and historical role context for forensic extraction.
 */
export const extractPayslipData = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    UNY COMMANDER AI: HR FORENSIC PROTOCOL v3.0
    
    SYSTEM DIRECTIVE:
    Identify and extract all operative (employee) data from the following text stream.
    Pay extreme attention to salary magnitudes, professional titles, and hire dates.
    
    GUIDELINES:
    - Net Salary: Extract the 'Net to Pay' amount.
    - Title: Map to a standard corporate role.
    - Department: Infer based on title if not explicit (e.g., 'React Dev' -> 'Operations/Tech').
    - Hierarchy: Identify if the operative has management keywords (Manager, Lead, Head, Director).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt + "\n\nRAW DATA STREAM:\n" + text,
      config: {
        thinkingConfig: { thinkingBudget: 1500 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            employees: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  full_name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  salary: { type: Type.NUMBER },
                  hire_date: { type: Type.STRING },
                  department: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
                },
                required: ["full_name", "role", "salary"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{\"employees\":[]}");
  } catch (err) {
    console.error("❌ HR_Forensic_Extraction_Failure:", err);
    return { employees: [] };
  }
};

export const formatVirtualOperative = (emp: any) => ({
  ...emp,
  is_virtual: true,
  metadata: {
    job_title: emp.role,
    hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
    department: emp.department || 'Operations',
    extracted_via: 'AI_SURGICAL_INGESTION_V13',
    node_type: 'operative',
    confidence: emp.confidence || 0.8
  }
});
