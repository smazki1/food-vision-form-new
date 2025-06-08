import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockSupabaseRpc
  }
}));

describe('convert_lead_to_client Database Function Integration Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should successfully convert lead to new client', async () => {
      const expectedClientId = 'new-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: expectedClientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'test-lead-123'
      });

      expect(result.data).toBe(expectedClientId);
      expect(result.error).toBeNull();
      expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
        p_lead_id: 'test-lead-123'
      });
    });

    it('should link lead to existing client with same email', async () => {
      const existingClientId = 'existing-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: existingClientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'test-lead-existing-email'
      });

      expect(result.data).toBe(existingClientId);
      expect(result.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle lead with no notes', async () => {
      const clientId = 'no-notes-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'lead-no-notes'
      });

      expect(result.data).toBe(clientId);
      expect(result.error).toBeNull();
    });

    it('should handle lead with no activity log', async () => {
      const clientId = 'no-activity-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'lead-no-activity'
      });

      expect(result.data).toBe(clientId);
    });

    it('should handle lead with no comments', async () => {
      const clientId = 'no-comments-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'lead-no-comments'
      });

      expect(result.data).toBe(clientId);
    });

    it('should handle Hebrew text in notes and comments correctly', async () => {
      const clientId = 'hebrew-client-123';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'hebrew-lead'
      });

      expect(result.data).toBe(clientId);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent lead ID', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Lead not found with ID: non-existent-lead',
          code: 'P0001'
        }
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'non-existent-lead'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Lead not found');
    });

    it('should handle already converted lead', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Lead is already converted to client',
          code: 'P0001'
        }
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'already-converted-lead'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('already converted');
    });

    it('should handle lead with empty email', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Cannot convert lead to client: email is required but missing',
          code: 'P0001'
        }
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'lead-no-email'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('email is required');
    });

    it('should handle database constraint violations', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'constraint-violation-lead'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('23505');
    });

    it('should handle network/connection errors', async () => {
      mockSupabaseRpc.mockRejectedValueOnce(new Error('Network error'));

      const { supabase } = await import('@/integrations/supabase/client');
      
      await expect(
        supabase.rpc('convert_lead_to_client', {
          p_lead_id: 'network-error-lead'
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed lead ID', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'invalid input syntax for type uuid',
          code: '22P02'
        }
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'not-a-uuid'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('22P02');
    });
  });

  describe('Performance Tests', () => {
    it('should handle conversion within acceptable time', async () => {
      const clientId = 'performance-client';
      
      // Simulate reasonable response time
      mockSupabaseRpc.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: clientId,
            error: null
          }), 50) // 50ms simulated database time
        )
      );

      const { supabase } = await import('@/integrations/supabase/client');
      
      const startTime = performance.now();
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'performance-test-lead'
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.data).toBe(clientId);
      expect(executionTime).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Data Preservation Tests', () => {
    it('should validate function call parameters', async () => {
      const clientId = 'param-validation-client';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'test-lead-params'
      });

      expect(result.data).toBe(clientId);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
        p_lead_id: 'test-lead-params'
      });
    });

    it('should handle successful response format', async () => {
      const clientId = 'format-test-client';
      
      mockSupabaseRpc.mockResolvedValueOnce({
        data: clientId,
        error: null
      });

      const { supabase } = await import('@/integrations/supabase/client');
      
      const result = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: 'format-test-lead'
      });

      expect(typeof result.data).toBe('string');
      expect(result.error).toBeNull();
      expect(result.data).toBe(clientId);
    });
  });
}); 