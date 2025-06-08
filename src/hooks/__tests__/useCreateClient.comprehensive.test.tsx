import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreateClient } from '../useCreateClient';
import { Client } from '@/types/client';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useCreateClient Hook - Comprehensive Tests', () => {
  let mockSupabaseFrom: ReturnType<typeof vi.fn>;
  let mockSupabaseAuth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    const { supabase } = await import('@/integrations/supabase/client');
    mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
    mockSupabaseAuth = supabase.auth as any;
  });

  describe('Happy Path - Real Authentication', () => {
    it('should successfully create a new client with authenticated user', async () => {
      const mockUser = { id: 'real-auth-user-123' };
      const mockClientData = {
        restaurant_name: 'Test Restaurant',
        contact_name: 'John Doe',
        phone: '050-1234567',
        email: 'test@restaurant.com',
      };

      const mockCreatedClient = {
        client_id: 'new-client-id-123',
        user_auth_id: 'real-auth-user-123',
        ...mockClientData,
        client_status: 'פעיל',
        remaining_servings: 0,
      };

      // Mock auth
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock email check (no existing client)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      // Mock insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCreatedClient, error: null }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_auth_id: 'real-auth-user-123',
          restaurant_name: 'Test Restaurant',
          contact_name: 'John Doe',
          phone: '050-1234567',
          email: 'test@restaurant.com',
          client_status: 'פעיל',
          remaining_servings: 0,
        })
      );
      expect(toast.success).toHaveBeenCalledWith('לקוח חדש "Test Restaurant" נוצר בהצלחה');
    });

    it('should successfully create client with optional fields', async () => {
      const mockUser = { id: 'real-auth-user-456' };
      const mockClientData = {
        restaurant_name: 'Full Data Restaurant',
        contact_name: 'Jane Smith',
        phone: '052-9876543',
        email: 'jane@fulldata.com',
        client_status: 'לא פעיל',
        business_type: 'בית קפה',
        address: 'תל אביב, רחוב הרצל 123',
        website_url: 'https://fulldata.com',
        internal_notes: 'VIP customer',
        email_notifications: false,
        app_notifications: true,
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'full-data-client-id', ...mockClientData }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_auth_id: 'real-auth-user-456',
          restaurant_name: 'Full Data Restaurant',
          contact_name: 'Jane Smith',
          client_status: 'לא פעיל',
          business_type: 'בית קפה',
          address: 'תל אביב, רחוב הרצל 123',
          website_url: 'https://fulldata.com',
          internal_notes: 'VIP customer',
          email_notifications: false,
          app_notifications: true,
        })
      );
    });
  });

  describe('Happy Path - Admin Test Environment', () => {
    it('should successfully create client using test admin ID when no real auth', async () => {
      const mockClientData = {
        restaurant_name: 'Admin Test Restaurant',
        contact_name: 'Admin User',
        phone: '054-1111111',
        email: 'admin@test.com',
      };

      // Mock no real user session
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Set admin authentication flag
      localStorage.setItem('adminAuthenticated', 'true');

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { 
              client_id: 'admin-test-client-id', 
              user_auth_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              ...mockClientData 
            }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_auth_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          restaurant_name: 'Admin Test Restaurant',
        })
      );
    });

    it('should log test admin ID usage for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockClientData = {
        restaurant_name: 'Debug Log Test',
        contact_name: 'Debug User',
        phone: '055-2222222',
        email: 'debug@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      localStorage.setItem('adminAuthenticated', 'true');

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'debug-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[useCreateClient] Using test admin ID for user_auth_id:',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no authentication available', async () => {
      const mockClientData = {
        restaurant_name: 'No Auth Restaurant',
        contact_name: 'No Auth User',
        phone: '056-3333333',
        email: 'noauth@test.com',
      };

      // Mock no real user session
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // No admin authentication flag
      localStorage.removeItem('adminAuthenticated');

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync(mockClientData);
      }).rejects.toThrow('לא ניתן לזהות משתמש מחובר');

      expect(toast.error).toHaveBeenCalledWith(
        'שגיאה ביצירת לקוח חדש: לא ניתן לזהות משתמש מחובר'
      );
    });

    it('should handle duplicate email error', async () => {
      const mockUser = { id: 'user-for-duplicate-test' };
      const mockClientData = {
        restaurant_name: 'Duplicate Email Restaurant',
        contact_name: 'Duplicate User',
        phone: '057-4444444',
        email: 'duplicate@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock existing client found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ 
            data: { client_id: 'existing-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync(mockClientData);
      }).rejects.toThrow('כתובת האימייל כבר קיימת במערכת');

      expect(toast.error).toHaveBeenCalledWith(
        'שגיאה ביצירת לקוח חדש: כתובת האימייל כבר קיימת במערכת'
      );
    });

    it('should handle database insertion errors', async () => {
      const mockUser = { id: 'user-for-db-error-test' };
      const mockClientData = {
        restaurant_name: 'DB Error Restaurant',
        contact_name: 'DB Error User',
        phone: '058-5555555',
        email: 'dberror@test.com',
      };

      const dbError = { message: 'Database constraint violation', code: '23505' };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync(mockClientData);
      }).rejects.toEqual(dbError);

      expect(toast.error).toHaveBeenCalledWith(
        'שגיאה ביצירת לקוח חדש: Database constraint violation'
      );
    });

    it('should handle network errors', async () => {
      const mockUser = { id: 'user-for-network-error' };
      const mockClientData = {
        restaurant_name: 'Network Error Restaurant',
        contact_name: 'Network Error User',
        phone: '059-6666666',
        email: 'networkerror@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const networkError = new Error('Network request failed');

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockRejectedValue(networkError),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync(mockClientData);
      }).rejects.toThrow('Network request failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values appropriately', async () => {
      const mockUser = { id: 'user-for-empty-strings' };
      const mockClientData = {
        restaurant_name: 'Empty Fields Restaurant',
        contact_name: 'Empty Fields User',
        phone: '050-7777777',
        email: 'empty@test.com',
        client_status: '',
        business_type: '',
        address: '',
        website_url: '',
        internal_notes: '',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'empty-fields-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      // Should use default status when empty string provided
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_status: 'פעיל', // Default value when empty string provided
          business_type: '',
          address: '',
          website_url: '',
          internal_notes: '',
        })
      );
    });

    it('should handle Hebrew characters in all fields', async () => {
      const mockUser = { id: 'user-for-hebrew-test' };
      const mockClientData = {
        restaurant_name: 'מסעדת האושר',
        contact_name: 'יוסי כהן',
        phone: '052-1234567',
        email: 'yossi@happiness.co.il',
        business_type: 'מסעדה כשרה',
        address: 'תל אביב, רחוב דיזנגוף 99',
        internal_notes: 'לקוח מעולה עם דרישות מיוחדות כשרות',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'hebrew-client-id', ...mockClientData }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_name: 'מסעדת האושר',
          contact_name: 'יוסי כהן',
          business_type: 'מסעדה כשרה',
          address: 'תל אביב, רחוב דיזנגוף 99',
          internal_notes: 'לקוח מעולה עם דרישות מיוחדות כשרות',
        })
      );
    });

    it('should set default notification preferences when not provided', async () => {
      const mockUser = { id: 'user-for-defaults' };
      const mockClientData = {
        restaurant_name: 'Default Notifications Restaurant',
        contact_name: 'Default User',
        phone: '051-8888888',
        email: 'defaults@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'defaults-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email_notifications: true, // Default value
          app_notifications: true,   // Default value
          remaining_servings: 0,     // Default value
        })
      );
    });
  });

  describe('Cache Management', () => {
    it('should update all client-related caches on successful creation', async () => {
      const queryClient = createTestQueryClient();
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Set up some existing cache data
      queryClient.setQueryData(['clients_list_for_admin', 'test-user'], [
        { client_id: 'existing-1', restaurant_name: 'Existing Restaurant' }
      ]);

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const mockUser = { id: 'cache-test-user' };
      const mockClientData = {
        restaurant_name: 'Cache Test Restaurant',
        contact_name: 'Cache Test User',
        phone: '052-9999999',
        email: 'cache@test.com',
      };

      const newClient = {
        client_id: 'new-cache-client-id',
        ...mockClientData,
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newClient, error: null }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(setQueryDataSpy).toHaveBeenCalled();
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it('should invalidate dashboard stats after client creation', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const mockUser = { id: 'stats-test-user' };
      const mockClientData = {
        restaurant_name: 'Stats Test Restaurant',
        contact_name: 'Stats Test User',
        phone: '053-0000000',
        email: 'stats@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'stats-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function),
      });
    });
  });

  describe('Data Validation', () => {
    it('should include all required timestamps', async () => {
      const mockUser = { id: 'timestamp-test-user' };
      const mockClientData = {
        restaurant_name: 'Timestamp Test Restaurant',
        contact_name: 'Timestamp Test User',
        phone: '054-1111111',
        email: 'timestamp@test.com',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'timestamp-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('created_at');
      expect(insertCall).toHaveProperty('updated_at');
      expect(insertCall).toHaveProperty('last_activity_at');
      
      // Verify timestamps are valid ISO strings
      expect(new Date(insertCall.created_at)).toBeInstanceOf(Date);
      expect(new Date(insertCall.updated_at)).toBeInstanceOf(Date);
      expect(new Date(insertCall.last_activity_at)).toBeInstanceOf(Date);
    });

    it('should maintain type safety for all client fields', async () => {
      const mockUser = { id: 'type-safety-user' };
      const mockClientData = {
        restaurant_name: 'Type Safety Restaurant',
        contact_name: 'Type Safety User',
        phone: '055-2222222',
        email: 'types@test.com',
        email_notifications: false,
        app_notifications: true,
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { client_id: 'type-safety-client-id' }, 
            error: null 
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      const { result } = renderHook(() => useCreateClient(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync(mockClientData);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(typeof insertCall.email_notifications).toBe('boolean');
      expect(typeof insertCall.app_notifications).toBe('boolean');
      expect(typeof insertCall.remaining_servings).toBe('number');
      expect(typeof insertCall.restaurant_name).toBe('string');
    });
  });
}); 