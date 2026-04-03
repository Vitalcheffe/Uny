/**
 * PII Round-Trip Test
 * 
 * Tests: original → mask → unmask returns original
 */

import { describe, it, expect } from 'vitest';
import { PIIMasker } from '../lib/pii-masker';

describe('PII Round-Trip', () => {
  it('should mask, store mapping, and restore original text', () => {
    // Original text with Moroccan PII
    const original = 'Ahmed CIN: AB123456, email: ahmed@corp.ma, tel: +212661234567';
    
    // Step 1: Mask the text
    const { maskedText, mapping } = PIIMasker.mask(original);
    
    // Verify masking worked
    expect(maskedText).not.toContain('AB123456');
    expect(maskedText).not.toContain('ahmed@corp.ma');
    expect(maskedText).not.toContain('+212661234567');
    expect(mapping.size).toBe(3);
    
    // Step 2: Unmask should return original
    const restored = PIIMasker.unmask(maskedText, mapping);
    expect(restored).toBe(original);
  });

  it('should handle multiple round-trips', () => {
    const texts = [
      'CIN: BE123456, phone: +212700000000',
      'Email: test@exemple.ma, ICE: 001234567000012',
      'Name: Mohammed, IBAN: MA64123456789012345678901234',
    ];
    
    for (const original of texts) {
      const { maskedText, mapping } = PIIMasker.mask(original);
      const restored = PIIMasker.unmask(maskedText, mapping);
      expect(restored).toBe(original);
    }
  });

  it('should handle empty text', () => {
    const { maskedText, mapping } = PIIMasker.mask('');
    expect(maskedText).toBe('');
    expect(mapping.size).toBe(0);
  });
});