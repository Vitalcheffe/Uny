
import { firestoreService } from './supabase-data-layer';

export interface PriceDelta {
  entity_name: string;
  previous_price: number | null;
  current_price: number;
  delta_percentage: number | null;
  anomaly_detected: boolean;
  timestamp: string;
}

/**
 * Compare les données extraites avec l'historique neural de l'organisation.
 */
export const compareWithHistory = async (orgId: string, entityName: string, currentPrice: number): Promise<PriceDelta> => {
  try {
    const previousDocs = await firestoreService.getCollection(
      'documents',
      orgId,
      [],
      'created_at',
      'desc'
    );

    let previousPrice: number | null = null;
    let anomaly = false;

    for (const doc of (previousDocs || [])) {
      const analysis = (doc as any).ai_analysis;
      if (!analysis) continue;
      
      // Recherche intelligente dans les entités ou les données d'employés
      if (analysis.employee_data?.full_name?.toLowerCase().includes(entityName.toLowerCase())) {
        previousPrice = analysis.employee_data.salary_net;
        break;
      }

      const match = analysis.entities?.find((e: string) => e.toLowerCase().includes(entityName.toLowerCase()));
      if (match) {
        const priceMatch = match.match(/(\d+[\d\s,.]*)/);
        if (priceMatch) {
          previousPrice = parseFloat(priceMatch[0].replace(/\s/g, '').replace(',', '.'));
          break;
        }
      }
    }

    const delta = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : null;
    
    // Détection d'anomalie contractuelle (si variation > 15% sans changement de grade)
    if (delta && Math.abs(delta) > 15) {
      anomaly = true;
    }

    return {
      entity_name: entityName,
      previous_price: previousPrice,
      current_price: currentPrice,
      delta_percentage: delta,
      anomaly_detected: anomaly,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("❌ [COMPARATIVE MEMORY] Analysis failed:", err);
    return {
      entity_name: entityName,
      previous_price: null,
      current_price: currentPrice,
      delta_percentage: null,
      anomaly_detected: false,
      timestamp: new Date().toISOString()
    };
  }
};
