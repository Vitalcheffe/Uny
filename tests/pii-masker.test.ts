/**
 * PII Masker Tests
 *
 * Tests the client-side PII masking utility for Moroccan-specific formats.
 */

import { describe, it, expect } from 'vitest';
import { PIIMasker } from '../lib/pii-masker';

describe('PIIMasker', () => {
  describe('mask', () => {
    it('should mask Moroccan CIN numbers', () => {
      const text = 'CIN: AB123456';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('AB123456');
      expect(maskedText).toMatch(/\{\{USER_CIN_\d+\}\}/);
      expect(mapping.size).toBeGreaterThanOrEqual(1);
    });

    it('should mask email addresses', () => {
      const text = 'Email: user@example.com';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('user@example.com');
      expect(mapping.size).toBeGreaterThanOrEqual(1);
    });

    it('should mask Moroccan phone numbers', () => {
      const text = 'Tél: +212612345678';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('+212612345678');
      expect(mapping.size).toBeGreaterThanOrEqual(1);
    });

    it('should mask ICE numbers', () => {
      const text = 'ICE: 000123456789012';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('000123456789012');
      expect(mapping.size).toBeGreaterThanOrEqual(1);
    });

    it('should mask Moroccan IBAN', () => {
      const text = 'IBAN: MA64123456789012345678901234';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('MA64123456789012345678901234');
      expect(mapping.size).toBeGreaterThanOrEqual(1);
    });

    it('should handle text with no PII', () => {
      const text = 'Just a regular message without sensitive data.';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).toBe(text);
      expect(mapping.size).toBe(0);
    });

    it('should mask multiple PII types simultaneously', () => {
      const text = 'Ahmed CIN: AB123456, email: ahmed@corp.ma, tel: +212661234567';
      const { maskedText, mapping } = PIIMasker.mask(text);

      expect(maskedText).not.toContain('AB123456');
      expect(maskedText).not.toContain('ahmed@corp.ma');
      expect(mapping.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('unmask', () => {
    it('should restore original values from masked text', () => {
      const original = 'CIN: AB123456, email: test@example.com';
      const { maskedText, mapping } = PIIMasker.mask(original);

      const restored = PIIMasker.unmask(maskedText, mapping);
      expect(restored).toBe(original);
    });

    it('should handle text with no masking placeholders', () => {
      const text = 'Nothing to unmask here.';
      const mapping = new Map<string, string>();

      const result = PIIMasker.unmask(text, mapping);
      expect(result).toBe(text);
    });
  });
});
