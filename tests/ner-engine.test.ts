/**
 * NER Engine Tests
 *
 * Tests the dual-mode PII detection engine:
 * - Regex fallback (testable without API key)
 * - Anonymize/deanonymize roundtrip
 * - Moroccan-specific formats (CIN, ICE)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NEREngine } from '../lib/ner-engine';

describe('NEREngine', () => {
  let engine: NEREngine;

  beforeEach(() => {
    engine = new NEREngine('test-api-key');
  });

  describe('fallback detection (regex)', () => {
    // We test fallbackDetection directly by mocking the AI to fail
    // so the engine falls back to regex

    it('should detect email addresses', async () => {
      // Mock AI to throw, forcing fallback
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const entities = await engine.detectEntities(
        'Contact me at john.doe@example.com for details'
      );

      const emails = entities.filter((e) => e.type === 'EMAIL');
      expect(emails.length).toBeGreaterThan(0);
      expect(emails[0].value).toBe('john.doe@example.com');
      expect(emails[0].confidence).toBe(0.9);
    });

    it('should detect Moroccan phone numbers', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const entities = await engine.detectEntities(
        'Appelez-moi au +212612345678 ou au 0612345678'
      );

      const phones = entities.filter((e) => e.type === 'PHONE');
      expect(phones.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Moroccan CIN numbers', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const entities = await engine.detectEntities(
        'Ma CIN est AB123456, la sienne est C123456'
      );

      const cins = entities.filter((e) => e.type === 'CIN');
      expect(cins.length).toBe(2);
      expect(cins[0].value).toBe('AB123456');
      expect(cins[1].value).toBe('C123456');
    });

    it('should detect ICE numbers (15 digits)', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const entities = await engine.detectEntities(
        'ICE entreprise: 000123456789012'
      );

      const ices = entities.filter((e) => e.type === 'ICE');
      expect(ices.length).toBe(1);
      expect(ices[0].value).toBe('000123456789012');
    });

    it('should detect IBAN numbers', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const entities = await engine.detectEntities(
        'Mon IBAN: MA64123456789012345678901234'
      );

      const financials = entities.filter((e) => e.type === 'FINANCIAL');
      expect(financials.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect multiple entity types in one text', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const text =
        'Ahmed (CIN: AB123456) reached out at ahmed@corp.ma, phone +212661234567';
      const entities = await engine.detectEntities(text);

      expect(entities.length).toBeGreaterThanOrEqual(2);

      const types = entities.map((e) => e.type);
      expect(types).toContain('EMAIL');
      expect(types).toContain('CIN');
    });
  });

  describe('anonymize / deanonymize roundtrip', () => {
    it('should anonymize emails and restore them', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const original = 'Contact Ahmed at ahmed@company.ma for info';
      const { anonymized, mapping, entitiesDetected } =
        await engine.anonymize(original);

      // Email should be replaced with a token
      expect(anonymized).not.toContain('ahmed@company.ma');
      expect(anonymized).toMatch(/\[EMAIL_[a-f0-9]+\]/);
      expect(entitiesDetected).toBeGreaterThanOrEqual(1);

      // Roundtrip should restore original
      const restored = engine.deanonymize(anonymized, mapping);
      expect(restored).toBe(original);
    });

    it('should handle multiple entities in anonymization', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const original = 'Email: test@test.com, CIN: AB123456';
      const { anonymized, mapping, entitiesDetected } =
        await engine.anonymize(original);

      expect(entitiesDetected).toBeGreaterThanOrEqual(2);

      // Both entities should be masked
      expect(anonymized).not.toContain('test@test.com');
      expect(anonymized).not.toContain('AB123456');

      // Roundtrip restores everything
      const restored = engine.deanonymize(anonymized, mapping);
      expect(restored).toBe(original);
    });

    it('should return original text unchanged when no PII found', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      const original = 'No sensitive data here, just regular text.';
      const { anonymized, entitiesDetected } =
        await engine.anonymize(original);

      expect(anonymized).toBe(original);
      expect(entitiesDetected).toBe(0);
    });
  });

  describe('deduplication', () => {
    it('should remove overlapping entities', async () => {
      vi.spyOn(engine as any, 'aiDetection').mockRejectedValue(
        new Error('AI unavailable')
      );

      // CIN pattern (AB123456) could overlap with broader patterns
      const text = 'CIN: AB123456';
      const entities = await engine.detectEntities(text);

      // Should not have overlapping entities
      for (let i = 0; i < entities.length - 1; i++) {
        expect(entities[i].end).toBeLessThanOrEqual(entities[i + 1].start);
      }
    });
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new NEREngine('')).toThrow('NEREngine requires a Gemini API key');
    });
  });
});
