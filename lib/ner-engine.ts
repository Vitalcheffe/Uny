/**
 * ⚡ UNY PROTOCOL: NER ENGINE (Named Entity Recognition)
 *
 * Dual-mode PII detection engine for Moroccan data sovereignty compliance (Loi 09-08).
 * Primary: Gemini AI for high-accuracy entity extraction.
 * Fallback: Regex-based detection when AI is unavailable.
 *
 * Supported entity types:
 * - PERSON: Human names
 * - EMAIL: Email addresses
 * - PHONE: Phone numbers (Moroccan + international)
 * - CIN: Moroccan national ID cards (1-2 letters + 6 digits)
 * - ICE: Moroccan business identifier (15 digits)
 * - FINANCIAL: IBAN, account numbers, monetary amounts
 */

interface Entity {
  type: 'PERSON' | 'EMAIL' | 'PHONE' | 'CIN' | 'ICE' | 'FINANCIAL';
  value: string;
  start: number;
  end: number;
  confidence: number;
}

interface AnonymizeResult {
  anonymized: string;
  mapping: Map<string, string>;
  entitiesDetected: number;
}

export class NEREngine {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('NEREngine requires a Gemini API key.');
    }
    this.apiKey = apiKey;
  }

  /**
   * Detect PII entities in text using Gemini AI.
   * Falls back to regex detection if the AI call fails.
   *
   * @param text - Raw text to analyze
   * @returns Array of detected entities with positions and confidence scores
   */
  async detectEntities(text: string): Promise<Entity[]> {
    try {
      return await this.aiDetection(text);
    } catch (error) {
      console.warn('⚠️ [NEREngine] AI detection failed, using fallback regex:', error);
      return this.fallbackDetection(text);
    }
  }

  /**
   * Gemini-powered entity detection with structured JSON output.
   */
  private async aiDetection(text: string): Promise<Entity[]> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const prompt = `You are a Named Entity Recognition (NER) system for Moroccan business data.

Extract ALL personally identifiable information from the text below. Return ONLY valid JSON.

Entity types to detect:
- PERSON: Full names of people
- EMAIL: Email addresses
- PHONE: Phone numbers (any format: +212, 06, 07, international)
- CIN: Moroccan national ID (1-2 uppercase letters + 6 digits, e.g. AB123456)
- ICE: Moroccan business ID (exactly 15 digits)
- FINANCIAL: IBAN, bank accounts, monetary amounts

Text to analyze:
"""
${text}
"""

Respond with ONLY this JSON structure, no markdown:
{"entities":[{"type":"PERSON","value":"exact text","start":0,"end":10,"confidence":0.95}]}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const responseText = result.text || '';

    // Clean potential markdown wrapping
    const jsonText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonText);
    return (parsed.entities || []) as Entity[];
  }

  /**
   * Regex-based fallback detection for when AI is unavailable.
   * Covers Moroccan-specific formats (CIN, ICE) and international standards.
   */
  private fallbackDetection(text: string): Entity[] {
    const entities: Entity[] = [];

    // Email detection
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    this.pushMatches(text, emailRegex, 'EMAIL', entities, 0.9);

    // Moroccan phone: +212XXXXXXXXX, 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX
    const phoneRegex = /(?:\+212|0)[567]\d{8}/g;
    this.pushMatches(text, phoneRegex, 'PHONE', entities, 0.85);

    // International phone (broader pattern)
    const intlPhoneRegex = /\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
    this.pushMatches(text, intlPhoneRegex, 'PHONE', entities, 0.7);

    // Moroccan CIN: 1-2 uppercase letters followed by 6 digits
    const cinRegex = /\b[A-Z]{1,2}\d{6}\b/g;
    this.pushMatches(text, cinRegex, 'CIN', entities, 0.8);

    // ICE: exactly 15 digits (avoid matching longer numbers)
    const iceRegex = /\b\d{15}\b/g;
    this.pushMatches(text, iceRegex, 'ICE', entities, 0.75);

    // IBAN (Moroccan: MA + 2 digits + 20+ chars, or general IBAN)
    const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{4,}\b/g;
    this.pushMatches(text, ibanRegex, 'FINANCIAL', entities, 0.8);

    // Monetary amounts: $1,000.00 or 1.000,00 MAD or 1000 DH
    const moneyRegex = /(?:\$|€|MAD|DH|EUR)\s?\d[\d.,]+/g;
    this.pushMatches(text, moneyRegex, 'FINANCIAL', entities, 0.85);

    return this.deduplicate(entities);
  }

  /**
   * Helper to extract regex matches and push as entities.
   */
  private pushMatches(
    text: string,
    regex: RegExp,
    type: Entity['type'],
    entities: Entity[],
    confidence: number
  ): void {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence,
      });
    }
  }

  /**
   * Remove overlapping entities, keeping the one with higher confidence.
   */
  private deduplicate(entities: Entity[]): Entity[] {
    if (entities.length <= 1) return entities;

    entities.sort((a, b) => a.start - b.start);
    const result: Entity[] = [entities[0]];

    for (let i = 1; i < entities.length; i++) {
      const last = result[result.length - 1];
      const current = entities[i];

      // Check overlap
      if (current.start < last.end) {
        // Keep the one with higher confidence
        if (current.confidence > last.confidence) {
          result[result.length - 1] = current;
        }
      } else {
        result.push(current);
      }
    }

    return result;
  }

  /**
   * Anonymize text by replacing PII with reversible tokens.
   *
   * @param text - Raw text containing PII
   * @returns Object with anonymized text, token mapping, and entity count
   *
   * @example
   * ```ts
   * const result = await nerEngine.anonymize('Contact Ahmed at ahmed@company.ma');
   * // result.anonymized: "Contact Ahmed at [EMAIL_a1b2c3d4]"
   * // result.mapping: Map { "[EMAIL_a1b2c3d4]" => "ahmed@company.ma" }
   * ```
   */
  async anonymize(text: string): Promise<AnonymizeResult> {
    const entities = await this.detectEntities(text);
    const mapping = new Map<string, string>();
    let anonymized = text;

    // Sort by position descending to avoid index shifting
    const sorted = [...entities].sort((a, b) => b.start - a.start);

    for (const entity of sorted) {
      const tokenId = this.generateTokenId();
      const token = `[${entity.type}_${tokenId}]`;
      mapping.set(token, entity.value);

      anonymized =
        anonymized.slice(0, entity.start) +
        token +
        anonymized.slice(entity.end);
    }

    return {
      anonymized,
      mapping,
      entitiesDetected: mapping.size,
    };
  }

  /**
   * Restore original values from anonymized text using the token mapping.
   *
   * @param text - Anonymized text with tokens
   * @param mapping - Token-to-original mapping from anonymize()
   * @returns Text with original PII restored
   */
  deanonymize(text: string, mapping: Map<string, string>): string {
    let result = text;

    for (const [token, original] of mapping.entries()) {
      // Escape special regex characters in token
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), original);
    }

    return result;
  }

  /**
   * Generate a short unique token ID (8 hex chars).
   */
  private generateTokenId(): string {
    const array = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 4; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
