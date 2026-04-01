import { describe, it, expect, vi } from 'vitest';
import { NEREngine } from '../lib/ner-engine';

// Mock fetch globally
global.fetch = vi.fn();

describe('NER Engine', () => {
  it('should mask PII successfully via backend', async () => {
    const mockResponse = { maskedText: 'Hello [REDACTED]' };
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await NEREngine.maskPII('Hello John Doe');
    expect(global.fetch).toHaveBeenCalledWith('/api/ner/mask', expect.any(Object));
    expect(result).toBe('Hello [REDACTED]');
  });

  it('should fallback to regex masking if backend fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await NEREngine.maskPII('Contact me at test@example.com');
    expect(result).toBe('Contact me at [EMAIL REDACTED]');
  });
});
