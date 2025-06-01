
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { leadsAPI } from '../leadsApi';
import { supabase } from '@/integrations/supabase/client';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        in: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(),
            })),
          })),
          order: vi.fn(() => ({
            range: vi.fn(),
          })),
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(),
          })),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

describe('leadsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLeads', () => {
    it('should fetch leads successfully', async () => {
      const mockData = [
        {
          lead_id: '1',
          restaurant_name: 'Test Restaurant',
          contact_name: 'Test Contact',
          email: 'test@example.com',
          phone: '1234567890',
          lead_status: 'ליד חדש',
          lead_source: 'אתר',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
      ];

      const mockQuery = {
        range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      const mockOrder = {
        order: vi.fn().mockReturnValue(mockQuery),
      };
      const mockIn = {
        in: vi.fn().mockReturnValue(mockOrder),
      };
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockIn),
      };
      
      (supabase.from as any).mockReturnValue(mockSelect);

      const result = await leadsAPI.fetchLeads({});
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching leads', async () => {
      const mockError = { message: 'Database error' };
      
      const mockQuery = {
        range: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      const mockOrder = {
        order: vi.fn().mockReturnValue(mockQuery),
      };
      const mockIn = {
        in: vi.fn().mockReturnValue(mockOrder),
      };
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockIn),
      };
      
      (supabase.from as any).mockReturnValue(mockSelect);

      await expect(leadsAPI.fetchLeads({})).rejects.toThrow('Error fetching leads: Database error');
    });
  });

  describe('createLead', () => {
    it('should create a lead successfully', async () => {
      const mockLead = {
        lead_id: '1',
        restaurant_name: 'New Restaurant',
        contact_name: 'New Contact',
        email: 'new@example.com',
        phone: '0987654321',
        lead_status: 'ליד חדש',
        lead_source: 'אתר',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        ai_trainings_count: 0,
        ai_training_cost_per_unit: 1.5,
        ai_prompts_count: 0,
        ai_prompt_cost_per_unit: 0.16,
        free_sample_package_active: false,
      };

      const mockSingle = {
        single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
      };
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockSingle),
      };
      const mockInsert = {
        insert: vi.fn().mockReturnValue(mockSelect),
      };
      
      (supabase.from as any).mockReturnValue(mockInsert);

      const result = await leadsAPI.createLead({
        restaurant_name: 'New Restaurant',
        contact_name: 'New Contact',
        email: 'new@example.com',
        phone: '0987654321',
      });
      
      expect(result).toEqual(mockLead);
    });
  });
});
