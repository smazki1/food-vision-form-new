/// <reference types="vitest/globals" />
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { leadsAPI } from '@/api/leadsApi'; 
import { toast } from 'sonner';
import React from 'react';

import { useLeads, useLeadDetails, useCreateLead, useUpdateLead, useConvertLeadToClient, useArchiveLead, useRestoreLeadFromArchive } from '../useLeads';
import { LEAD_STATUSES } from '@/constants/statusTypes';
import { Lead, LeadStatus } from '@/types/models';

// Mock the leadsAPI
vi.mock('@/api/leadsApi', () => ({
  leadsAPI: {
    fetchLeads: vi.fn(),
    fetchLeadById: vi.fn(),
    createLead: vi.fn(),
    updateLead: vi.fn(),
    convertToClient: vi.fn(),
    archiveLead: vi.fn(),
    restoreFromArchive: vi.fn(),
    addLeadActivityLog: vi.fn(), 
  }
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }
}));

// Helper function to create a QueryClient wrapper for tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity, 
      },
      mutations: {
        retry: false,
      }
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Lead Hooks (useLeads, etc.)', () => {
  let mockFetchLeads: any; 
  let mockCreateLead: any;
  let mockUpdateLead: any;
  let mockFetchLeadById: any;
  let mockConvertToClient: any;
  let mockArchiveLead: any;
  let mockRestoreLeadFromArchive: any;


  beforeEach(() => {
    vi.clearAllMocks(); 

    mockFetchLeads = leadsAPI.fetchLeads;
    mockCreateLead = leadsAPI.createLead;
    mockUpdateLead = leadsAPI.updateLead;
    mockFetchLeadById = leadsAPI.fetchLeadById;
    mockConvertToClient = leadsAPI.convertToClient;
    mockArchiveLead = leadsAPI.archiveLead;
    mockRestoreLeadFromArchive = leadsAPI.restoreFromArchive;
  });

  // REMOVED PLACEHOLDER useLeads function

  describe('useLeads', () => {
    test('should fetch leads and return data', async () => {
      const mockLeadsData = [
        { lead_id: '1', restaurant_name: 'Lead 1', lead_status: LEAD_STATUSES.NEW, created_at: '2023-01-01T00:00:00Z' } as Lead,
        { lead_id: '2', restaurant_name: 'Lead 2', lead_status: LEAD_STATUSES.CONTACTED, created_at: '2023-01-02T00:00:00Z' } as Lead,
      ];
      (leadsAPI.fetchLeads as any).mockResolvedValue(mockLeadsData);

      const { result } = renderHook(() => useLeads({}), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      }, { timeout: 2000 });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockLeadsData);
      expect(leadsAPI.fetchLeads).toHaveBeenCalledWith({}); 
    });

    test('should handle error when fetching leads', async () => {
      const errorMessage = 'Failed to fetch leads';
      (leadsAPI.fetchLeads as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useLeads({}), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      }, { timeout: 2000 });
      
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
      expect(leadsAPI.fetchLeads).toHaveBeenCalledWith({}); 
    });
  });

  describe('useLeadDetails', () => {
    test('should fetch lead by id and return data', async () => {
      const leadId = 'test-lead-1';
      const mockLeadData = { lead_id: leadId, restaurant_name: 'Test Lead Details', lead_status: LEAD_STATUSES.NEW, created_at: '2023-01-01T12:00:00Z', updated_at: '2023-01-01T12:00:00Z' } as Lead;
      (leadsAPI.fetchLeadById as any).mockResolvedValue(mockLeadData);

      const { result } = renderHook(() => useLeadDetails(leadId), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(leadsAPI.fetchLeadById).toHaveBeenCalledWith(leadId);
      expect(result.current.data).toEqual(mockLeadData);
    });

    test('should be disabled if leadId is null', () => {
      renderHook(() => useLeadDetails(null), { wrapper: createWrapper() });
      expect(leadsAPI.fetchLeadById).not.toHaveBeenCalled();
    });

     test('should handle error when fetching lead details', async () => {
      const leadId = 'test-lead-error';
      const errorMessage = 'Failed to fetch lead details';
      (leadsAPI.fetchLeadById as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useLeadDetails(leadId), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });
  });

  describe('useCreateLead', () => {
    test('should call createLead mutation and show success toast', async () => {
      const newLeadData = { restaurant_name: 'New Restaurant', contact_name: 'John Doe' };
      const createdLeadData = { lead_id: 'new-1', ...newLeadData, lead_status: LEAD_STATUSES.NEW, created_at: '2023-01-01T12:00:00Z', updated_at: '2023-01-01T12:00:00Z' } as Lead;
      (leadsAPI.createLead as any).mockResolvedValue(createdLeadData);

      const { result } = renderHook(() => useCreateLead(), { wrapper: createWrapper() });
      
      result.current.mutate(newLeadData as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(leadsAPI.createLead).toHaveBeenCalledWith(newLeadData);
      expect(toast.success).toHaveBeenCalledWith('ליד חדש נוצר בהצלחה');
      expect(result.current.data).toEqual(createdLeadData);
    });

    test('should show error toast on createLead failure', async () => {
      const newLeadData = { restaurant_name: 'Fail Restaurant' };
      const errorMessage = 'Failed to create lead';
      (leadsAPI.createLead as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCreateLead(), { wrapper: createWrapper() });
      result.current.mutate(newLeadData as any);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה ביצירת ליד: ${errorMessage}`);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });
  });
  
  describe('useUpdateLead', () => {
    test('should call updateLead mutation and show success toast', async () => {
      const leadId = 'lead-to-update-1';
      const updateData = { restaurant_name: 'Updated Name' };
      const updatedLeadData = { lead_id: leadId, restaurant_name: 'Updated Name', lead_status: LEAD_STATUSES.CONTACTED, created_at: '2023-01-01T12:00:00Z', updated_at: '2023-01-01T12:00:00Z' } as Lead;
      (leadsAPI.updateLead as any).mockResolvedValue(updatedLeadData);

      const { result } = renderHook(() => useUpdateLead(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, updates: updateData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(leadsAPI.updateLead).toHaveBeenCalledWith(leadId, updateData);
      expect(toast.success).toHaveBeenCalledWith('הליד עודכן בהצלחה');
      expect(result.current.data).toEqual(updatedLeadData);
    });

    test('should show error toast on updateLead failure', async () => {
      const leadId = 'lead-to-update-fail';
      const updateData = { restaurant_name: 'Fail Update' };
      const errorMessage = 'Failed to update lead';
      (leadsAPI.updateLead as any).mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useUpdateLead(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, updates: updateData });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה בעדכון הליד: ${errorMessage}`);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });
  });

  describe('useConvertLeadToClient', () => {
    test('should call convertToClient mutation and show success toast', async () => {
      const leadId = 'lead-to-convert-1';
      const userId = 'user-for-client-1';
      const mockApiClientResponse = {
        client_id: 'client-1', 
        user_id: userId, 
        updatedLead: { lead_id: leadId, lead_status: LEAD_STATUSES.CONVERTED } as Lead 
      };
      (leadsAPI.convertToClient as any).mockResolvedValue(mockApiClientResponse);

      const expectedHookData = { clientId: 'client-1', success: true };

      const { result } = renderHook(() => useConvertLeadToClient(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, userId });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(leadsAPI.convertToClient).toHaveBeenCalledWith(leadId, userId);
      expect(toast.success).toHaveBeenCalledWith('הליד הומר ללקוח בהצלחה');
      expect(result.current.data).toEqual(expectedHookData); 
    });

    test('should show error toast on convertToClient failure', async () => {
      const leadId = 'lead-to-convert-fail';
      const userId = 'user-fail';
      const errorMessage = 'Failed to convert lead';
      (leadsAPI.convertToClient as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useConvertLeadToClient(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, userId });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה בהמרת הליד ללקוח: ${errorMessage}`);
       expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });

    test('should show specific error toast if convertToClient API call indicates failure', async () => {
      const leadId = 'lead-convert-api-fail';
      const userId = 'user-api-fail';
      const conversionResult = { client_id: null, success: false }; 
      (leadsAPI.convertToClient as any).mockResolvedValue(conversionResult as any);

      const { result } = renderHook(() => useConvertLeadToClient(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, userId });

      await waitFor(() => expect(result.current.isSuccess).toBe(true)); // Hook isSuccess true, but toast.error
      expect(toast.error).toHaveBeenCalledWith('שגיאה: לא ניתן להמיר את הליד ללקוח.');
    });
  });

  describe('useArchiveLead', () => {
    test('should call archiveLead mutation and show success toast', async () => {
      const leadId = 'lead-to-archive-1';
      (leadsAPI.archiveLead as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useArchiveLead(), { wrapper: createWrapper() });
      result.current.mutate(leadId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(leadsAPI.archiveLead).toHaveBeenCalledWith(leadId);
      expect(toast.success).toHaveBeenCalledWith('הליד הועבר לארכיון בהצלחה');
      expect(result.current.data).toBe(true);
    });

    test('should show error toast on archiveLead failure', async () => {
      const leadId = 'lead-to-archive-fail';
      const errorMessage = 'Failed to archive lead';
      (leadsAPI.archiveLead as any).mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useArchiveLead(), { wrapper: createWrapper() });
      result.current.mutate(leadId);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה בהעברת הליד לארכיון: ${errorMessage}`);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });

    test('should show specific error toast if archiveLead API call indicates failure (though hook returns true)', async () => {
      const leadId = 'lead-archive-api-fail';
      const errorMessage = 'API indicated failure to archive';
      (leadsAPI.archiveLead as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useArchiveLead(), { wrapper: createWrapper() });
      result.current.mutate(leadId);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה בהעברת הליד לארכיון: ${errorMessage}`);
    });
  });

  describe('useRestoreLeadFromArchive', () => {
    test('should call restoreFromArchive mutation and show success toast', async () => {
      const leadId = 'lead-to-restore-1';
      const newStatus = LEAD_STATUSES.NEW;
      (leadsAPI.restoreFromArchive as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRestoreLeadFromArchive(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, newStatus });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(leadsAPI.restoreFromArchive).toHaveBeenCalledWith(leadId, newStatus);
      expect(toast.success).toHaveBeenCalledWith('הליד שוחזר מהארכיון בהצלחה');
      expect(result.current.data).toBe(true);
    });

    test('should show error toast on restoreFromArchive failure', async () => {
      const leadId = 'lead-to-restore-fail';
      const newStatus = LEAD_STATUSES.NEW;
      const errorMessage = 'Failed to restore lead';
      (leadsAPI.restoreFromArchive as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRestoreLeadFromArchive(), { wrapper: createWrapper() });
      result.current.mutate({ leadId, newStatus });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(`שגיאה בשחזור הליד מהארכיון: ${errorMessage}`);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });
  });

  // Add more tests for useLeads:
  // - with different options/filters
  // - pagination, sorting, etc. if applicable
}); 