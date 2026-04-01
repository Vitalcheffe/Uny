/**
 * Data Service Tests
 *
 * Tests for the core CRUD service layer (Supabase operations).
 * Uses mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase-client before importing DataService
vi.mock('../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '123', name: 'Test Org' }, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
      })),
    },
  },
}));

import { DataService } from '../lib/data-service';

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrganization', () => {
    it('should return organization data on success', async () => {
      const org = await DataService.getOrganization('org-123');
      expect(org).not.toBeNull();
      expect(org?.id).toBe('123');
    });
  });

  describe('createAuditRequest', () => {
    it('should return true on successful insert', async () => {
      const result = await DataService.createAuditRequest({
        company_name: 'Test Corp',
        email: 'test@corp.ma',
        team_size: '1-10',
        industry: 'TECH',
        annual_revenue: 'N/A',
      });

      expect(result).toBe(true);
    });
  });
});
