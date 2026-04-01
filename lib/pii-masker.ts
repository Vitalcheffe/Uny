/**
 * ⚡ UNY PROTOCOL: PII MASKING ENGINE (V1)
 * Description: Moteur de masquage des données personnelles (PII) pour la conformité CNDP (Maroc).
 * Assure qu'aucune donnée sensible ne quitte l'infrastructure UNY vers les LLMs externes.
 */

export interface MaskingResult {
  maskedText: string;
  mapping: Map<string, string>;
}

export class PIIMasker {
  /**
   * Patterns de détection robustes (Spécifiques au Maroc et standards)
   */
  private static readonly PATTERNS = {
    // CIN Marocaine: 1-2 lettres suivies de 6 chiffres (ex: AB123456, C123456)
    CIN: /[A-Z]{1,2}[0-9]{6}/g,
    
    // ICE (Identifiant Commun de l'Entreprise): 15 chiffres
    ICE: /[0-9]{15}/g,
    
    // Téléphones Marocains: +212, 06, 07, 05 suivis de 8 chiffres
    PHONE: /(?:\+212|0)([567][0-9]{8})/g,
    
    // Emails: Pattern standard RFC 5322
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // IBAN Marocain: MA64 + 20 chiffres
    IBAN_MA: /MA[0-9]{22}/g,
    
    // Noms propres (Approximation: Mots capitalisés suivis d'un autre mot capitalisé)
    // Note: Risque de faux positifs, à utiliser avec parcimonie ou via une liste blanche/noire
    NAME: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
  };

  /**
   * Masque les données sensibles dans un texte
   * @param text Le texte brut à anonymiser
   * @returns Un objet contenant le texte masqué et la table de correspondance
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
   * Réinjecte les données réelles dans un texte anonymisé
   * @param maskedText Le texte provenant du LLM (contenant des placeholders)
   * @param mapping La table de correspondance générée lors du masquage
   * @returns Le texte avec les données réelles réinjectées
   */
  static unmask(maskedText: string, mapping: Map<string, string>): string {
    let unmaskedText = maskedText;

    // On itère sur la map pour remplacer chaque placeholder par sa valeur d'origine
    mapping.forEach((originalValue, placeholder) => {
      // Utilisation d'une regex globale pour remplacer toutes les occurrences du placeholder
      const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
      unmaskedText = unmaskedText.replace(regex, originalValue);
    });

    return unmaskedText;
  }

  /**
   * Utilitaire pour échapper les caractères spéciaux dans une regex
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
