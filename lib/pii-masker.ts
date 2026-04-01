/**
 * ⚡ UNY PROTOCOL: PII MASKING ENGINE (V1)
 * Description: PII masking engine for Moroccan data sovereignty compliance (CNDP/Loi 09-08).
 * Assure qu'aucune donnée sensible ne quitte l'infrastructure UNY vers les LLMs externes.
 */

export interface MaskingResult {
  maskedText: string;
  mapping: Map<string, string>;
}

export class PIIMasker {
  /**
   * Robust detection patterns (Morocco-specific and standard patterns)
   */
  private static readonly PATTERNS = {
    // Moroccan CIN: 1-2 lettres suivies de 6 chiffres (ex: AB123456, C123456)
    CIN: /[A-Z]{1,2}[0-9]{6}/g,
    
    // ICE (Identifiant Commun de l'Entreprise): 15 chiffres
    ICE: /[0-9]{15}/g,
    
    // Moroccan phones: +212, 06, 07, 05 suivis de 8 chiffres
    PHONE: /(?:\+212|0)([567][0-9]{8})/g,
    
    // Emails: Standard RFC 5322 pattern
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // Moroccan IBAN: MA64 + 20 chiffres
    IBAN_MA: /MA[0-9]{22}/g,
    
    // Noms propres (Approximation: Mots capitalisés suivis d'un autre mot capitalisé)
    // Note: Risk of false positives, use sparingly or with allowlist/noire
    NAME: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
  };

  /**
   * Mask sensitive data in text
   * @param text Raw text to anonymize
   * @returns Object with masked text and mapping table
   */
  static mask(text: string): MaskingResult {
    const mapping = new Map<string, string>();
    let maskedText = text;
    let counter = 1;

    // 1. Masquage des CIN
    maskedText = maskedText.replace(this.PATTERNS.CIN, (match) => {
      const placeholder = `{{USER_CIN_${counter++}}}`;
      mapping.set(placeholder, match);
      return placeholder;
    });

    // 2. Masquage des ICE
    maskedText = maskedText.replace(this.PATTERNS.ICE, (match) => {
      const placeholder = `{{ORG_ICE_${counter++}}}`;
      mapping.set(placeholder, match);
      return placeholder;
    });

    // 3. Masquage des Téléphones
    maskedText = maskedText.replace(this.PATTERNS.PHONE, (match) => {
      const placeholder = `{{USER_PHONE_${counter++}}}`;
      mapping.set(placeholder, match);
      return placeholder;
    });

    // 4. Masquage des Emails
    maskedText = maskedText.replace(this.PATTERNS.EMAIL, (match) => {
      const placeholder = `{{USER_EMAIL_${counter++}}}`;
      mapping.set(placeholder, match);
      return placeholder;
    });

    // 5. Masquage des IBAN
    maskedText = maskedText.replace(this.PATTERNS.IBAN_MA, (match) => {
      const placeholder = `{{USER_IBAN_${counter++}}}`;
      mapping.set(placeholder, match);
      return placeholder;
    });

    return { maskedText, mapping };
  }

  /**
   * Restore original data in anonymized text
   * @param maskedText Text from LLM (contenant des placeholders)
   * @param mapping Mapping table generated during masking
   * @returns Text with original data restored
   */
  static unmask(maskedText: string, mapping: Map<string, string>): string {
    let unmaskedText = maskedText;

    // Iterate map to replace each placeholder par sa valeur d'origine
    mapping.forEach((originalValue, placeholder) => {
      // Use global regex to replace toutes les occurrences du placeholder
      const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
      unmaskedText = unmaskedText.replace(regex, originalValue);
    });

    return unmaskedText;
  }

  /**
   * Utility to escape special characters dans une regex
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
