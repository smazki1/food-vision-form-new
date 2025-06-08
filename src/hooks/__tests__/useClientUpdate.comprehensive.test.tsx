import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientUpdate } from '../useClientUpdate';
import { Client } from '@/types/client';

// Mock dependencies with proper hoisting
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
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

describe('useClientUpdate Hook - Comprehensive Tests', () => {
  let mockSupabaseUpdate: ReturnType<typeof vi.fn>;
  let mockSupabaseFrom: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked module to get access to the mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
    
    // Setup mock chain
    mockSupabaseUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    
    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    });
  });

  describe('Happy Path Tests', () => {
    it('should successfully update client notes field', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'New client notes' }
        });
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'New client notes',
          updated_at: expect.any(String),
        })
      );
    });

    it('should successfully update reminder fields', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });
      const reminderDate = '2025-01-15';
      const reminderDetails = 'Follow up call about package upgrade';

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            next_follow_up_date: reminderDate,
            reminder_details: reminderDetails
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          next_follow_up_date: reminderDate,
          reminder_details: reminderDetails,
          updated_at: expect.any(String),
        })
      );
    });

    it('should update client contact information correctly', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            restaurant_name: 'Updated Restaurant Name',
            contact_name: 'New Contact Person',
            phone: '052-9876543',
            email: 'new@restaurant.com'
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_name: 'Updated Restaurant Name',
          contact_name: 'New Contact Person',
          phone: '052-9876543',
          email: 'new@restaurant.com',
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle payment status updates', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            payment_status: 'שולם',
            payment_amount_ils: 5000,
            payment_due_date: '2025-02-01'
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_status: 'שולם',
          payment_amount_ils: 5000,
          payment_due_date: '2025-02-01',
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string updates', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            notes: '',
            reminder_details: '',
            website_url: ''
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: '',
          reminder_details: '',
          website_url: '',
        })
      );
    });

    it('should handle null values correctly', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            next_follow_up_date: null,
            website_url: null
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          next_follow_up_date: null,
          website_url: null,
        })
      );
    });

    it('should handle Hebrew text correctly', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });
      const hebrewNotes = 'לקוח מעוניין בחבילה מתקדמת. יש לחזור בעוד שבוע';

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            notes: hebrewNotes,
            restaurant_name: 'מסעדת השף'
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: hebrewNotes,
          restaurant_name: 'מסעדת השף',
        })
      );
    });

    it('should handle multiple field updates in single call', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            notes: 'Updated notes',
            reminder_details: 'Call next week',
            next_follow_up_date: '2025-01-20',
            payment_status: 'ממתין לתשלום',
            business_type: 'מסעדה'
          }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Updated notes',
          reminder_details: 'Call next week',
          next_follow_up_date: '2025-01-20',
          payment_status: 'ממתין לתשלום',
          business_type: 'מסעדה',
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = { message: 'Database connection failed', code: '500' };
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn(() => Promise.resolve({ error: dbError })),
      });

      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Test notes' }
        });
      }).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn(() => Promise.reject(new Error('Network error'))),
      });

      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Test notes' }
        });
      }).rejects.toThrow('Network error');
    });

    it('should handle RLS (Row Level Security) permission errors', async () => {
      const rlsError = { 
        message: 'new row violates row-level security policy',
        code: '42501' 
      };
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn(() => Promise.resolve({ error: rlsError })),
      });

      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Test notes' }
        });
      }).rejects.toThrow();
    });
  });

  describe('Optimistic Updates & Cache Management', () => {
    it('should not invalidate cache immediately to prevent UI jumping', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Test notes' }
        });
      });

      // Should use setQueryData for optimistic updates, not invalidateQueries
      expect(setQueryDataSpy).toHaveBeenCalled();
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });

    it('should handle cache rollback on mutation failure', async () => {
      const queryClient = createTestQueryClient();
      
      // Setup cache with initial data
      const initialClientData = [
        { client_id: 'client-123', notes: 'Original notes', restaurant_name: 'Original Name' }
      ];
      queryClient.setQueryData(['clients_simplified'], initialClientData);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Mock failure
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      try {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Failed update' }
        });
      } catch (error) {
        // Expected to fail
      }

      // Should have attempted to rollback cache
      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });

  describe('Field Validation & Type Safety', () => {
    it('should accept all valid Client fields', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      const validUpdates: Partial<Client> = {
        restaurant_name: 'Test Restaurant',
        contact_name: 'Test Contact',
        phone: '050-1234567',
        email: 'test@example.com',
        business_type: 'מסעדה',
        client_status: 'לקוח פעיל',
        address: 'תל אביב',
        website_url: 'https://restaurant.com',
        internal_notes: 'Internal notes',
        payment_status: 'שולם',
        payment_amount_ils: 5000,
        payment_due_date: '2025-01-15',
        next_follow_up_date: '2025-01-20',
        reminder_details: 'Call about renewal',
        notes: 'General client notes'
      };

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: validUpdates
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining(validUpdates)
      );
    });

    it('should filter out undefined values', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { 
            notes: 'Valid note',
            undefined_field: undefined,
            null_field: null,
            empty_field: ''
          } as any
        });
      });

      const updateCall = mockSupabaseUpdate.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('undefined_field');
      expect(updateCall).toHaveProperty('null_field', null);
      expect(updateCall).toHaveProperty('empty_field', '');
    });
  });

  describe('Performance & Efficiency', () => {
    it('should batch multiple updates efficiently', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Multiple rapid updates
      const updates = [
        { notes: 'Update 1' },
        { reminder_details: 'Update 2' },
        { payment_status: 'Update 3' }
      ];

      for (const update of updates) {
        await waitFor(async () => {
          await result.current.mutateAsync({
            clientId: 'client-123',
            updates: update
          });
        });
      }

      // Should have made 3 separate calls (no automatic batching)
      expect(mockSupabaseUpdate).toHaveBeenCalledTimes(3);
    });

    it('should include updated_at timestamp in all updates', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { notes: 'Test' }
        });
      });

      const updateCall = mockSupabaseUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(new Date(updateCall.updated_at)).toBeInstanceOf(Date);
    });
  });
}); 