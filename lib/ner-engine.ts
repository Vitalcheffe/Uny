/**
 * ⚡ UNY PROTOCOL: NER ENGINE (Named Entity Recognition)
 * Description: Client-side utility to call the secure backend NER engine.
 */

export class NEREngine {
  /**
   * Detects and masks PII (Personally Identifiable Information) in text.
   * Calls the secure backend endpoint which uses Gemini.
   */
  static async maskPII(text: string): Promise<string> {
    try {
      const response = await fetch('/api/ner/mask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`NER Engine Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.maskedText || text;
    } catch (error) {
      console.error('❌ [NEREngine] Failed to mask PII:', error);
      // Fallback to basic regex masking if backend fails
      return this.fallbackMasking(text);
    }
  }

  /**
   * Basic regex-based fallback masking if the AI engine is unavailable.
   */
  private static fallbackMasking(text: string): string {
    let masked = text;
    // Basic Email masking
    masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
    // Basic Phone masking (very naive)
    masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED]');
    return masked;
  }
}
