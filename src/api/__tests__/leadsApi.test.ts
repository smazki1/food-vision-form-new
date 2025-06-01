import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { leadsAPI } from '../leadsApi';
import { LEAD_STATUSES, LEAD_STATUS_DISPLAY } from '@/constants/statusTypes';
import { Lead, LeadStatus } from '@/types/models';

vi.mock('@/integrations/supabase/client', async () => {
  const actualVitest = await vi.importActual<typeof import('vitest')>('vitest');
  const { vi: actualVi } = actualVitest;

  const selectFn = actualVi.fn();
  const insertFn = actualVi.fn();
  const updateFn = actualVi.fn();
  const deleteFn = actualVi.fn();
  const eqFn = actualVi.fn();
  const inFn = actualVi.fn();
  const orFn = actualVi.fn();
  const orderFn = actualVi.fn();
  const rangeFn = actualVi.fn();
  const singleFn = actualVi.fn();

  const internalMockChainedFunctions = {
    select: selectFn,
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
    eq: eqFn,
    in: inFn,
    or: orFn,
    order: orderFn,
    range: rangeFn,
    single: singleFn,
  };

  // Mock implementations to return 'this' (the builder object) for chaining by default
  selectFn.mockImplementation(() => internalMockChainedFunctions);
  insertFn.mockImplementation(() => internalMockChainedFunctions);
  updateFn.mockImplementation(() => internalMockChainedFunctions);
  deleteFn.mockImplementation(() => internalMockChainedFunctions);
  eqFn.mockImplementation(() => internalMockChainedFunctions);
  inFn.mockImplementation(() => internalMockChainedFunctions);
  orFn.mockImplementation(() => internalMockChainedFunctions);
  orderFn.mockImplementation(() => internalMockChainedFunctions);
  rangeFn.mockResolvedValue({ data: [], error: null }); // Terminal methods resolve
  singleFn.mockResolvedValue({ data: {}, error: null });// Terminal methods resolve


  const fromFn = actualVi.fn(() => internalMockChainedFunctions);
  const rpcFn = actualVi.fn().mockResolvedValue({ data: {}, error: null });

  return {
    supabase: {
      from: fromFn,
      rpc: rpcFn,
      _internalMocks: {
        from: fromFn,
        rpc: rpcFn,
        select: selectFn,
        insert: insertFn,
        update: updateFn,
        delete: deleteFn,
        eq: eqFn,
        in: inFn,
        or: orFn,
        order: orderFn,
        range: rangeFn,
        single: singleFn,
        _chainedBuilder: internalMockChainedFunctions 
      }
    },
  };
});

import { supabase } from '@/integrations/supabase/client';

// Define variables to hold the mocks using 'any' type
let fromMock: any;
let rpcMock: any;
let selectMock: any;
let insertMock: any;
let updateMock: any;
let deleteMock: any;
let eqMock: any;
let inMock: any;
let orMock: any;
let orderMock: any;
let rangeMock: any;
let singleMock: any;
// let chainedBuilderMock: any; // This will be the object returned by fromMock now

describe('leadsAPI', () => {
  beforeEach(() => {
    const internalMocks = (supabase as any)._internalMocks || {}; // Added || {} for safety
    
    fromMock = internalMocks.from;
    rpcMock = internalMocks.rpc;
    selectMock = internalMocks.select;
    insertMock = internalMocks.insert;
    updateMock = internalMocks.update;
    deleteMock = internalMocks.delete;
    eqMock = internalMocks.eq;
    inMock = internalMocks.in;
    orMock = internalMocks.or;
    orderMock = internalMocks.order;
    rangeMock = internalMocks.range;
    singleMock = internalMocks.single;
    // chainedBuilderMock = internalMocks._chainedBuilder; // No longer strictly needed as separate variable if each mock fn is configured

    vi.clearAllMocks();

    // Re-establish default mock implementations after clearAllMocks if necessary,
    // or set them per test. For chaining, `fromMock` returns an object with other mocks.
    // The mocks themselves (selectMock, insertMock, etc.) should also allow chaining or resolve.

    // Default behavior for `from` is to return an object that allows chaining other methods
    fromMock.mockImplementation(() => ({
        select: selectMock,
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
        eq: eqMock,
        in: inMock,
        or: orMock,
        order: orderMock,
        range: rangeMock,
        single: singleMock,
    }));

    // Default behavior for chained methods (return the builder for further chaining, or resolve for terminal methods)
    selectMock.mockImplementation(() => fromMock()); // Return the result of fromMock() for chaining
    insertMock.mockImplementation(() => fromMock());
    updateMock.mockImplementation(() => fromMock());
    deleteMock.mockImplementation(() => fromMock());
    eqMock.mockImplementation(() => fromMock());
    inMock.mockImplementation(() => fromMock());
    orMock.mockImplementation(() => fromMock());
    orderMock.mockImplementation(() => fromMock()); // this one needs to be careful if it's terminal or chains to range/single
    
    // Terminal methods resolve
    rangeMock.mockResolvedValue({ data: [], error: null });
    singleMock.mockResolvedValue({ data: {}, error: null });
    rpcMock.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchLeads', () => {
    test('should call supabase with correct parameters for default fetch', async () => {
      const mockLeadsData = [{ lead_id: '1', restaurant_name: 'Test Restaurant' }];
      // Specific mock for this test case - terminal part of the chain
      orderMock.mockImplementationOnce(() => ({
          range: rangeMock.mockResolvedValueOnce({ data: mockLeadsData, error: null })
      })); 

      await leadsAPI.fetchLeads({});

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(selectMock).toHaveBeenCalledWith('*');
      const activeStatuses = Object.values(LEAD_STATUSES).filter(
        status => status !== LEAD_STATUSES.ARCHIVED
      );
      expect(inMock).toHaveBeenCalledWith('lead_status', activeStatuses);
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(rangeMock).toHaveBeenCalledWith(0, 19);
    });

    test('should apply status filters when provided', async () => {
      const statusesToFilter = [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED];
      orderMock.mockImplementationOnce(() => ({
        range: rangeMock.mockResolvedValueOnce({ data: [], error: null })
      })); 
      
      await leadsAPI.fetchLeads({ statuses: statusesToFilter });
      
      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(inMock).toHaveBeenCalledWith('lead_status', statusesToFilter);
      // expect(orderMock).toHaveBeenCalled(); // Order is still called by default
      // expect(rangeMock).toHaveBeenCalled(); // Range is still called by default
    });

    test('should apply searchTerm when provided', async () => {
      const searchTerm = 'Pizza Place';
       orderMock.mockImplementationOnce(() => ({
        range: rangeMock.mockResolvedValueOnce({ data: [], error: null })
      })); 

      await leadsAPI.fetchLeads({ searchTerm });
      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orMock).toHaveBeenCalledWith(
        `restaurant_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    });

    test('should apply sorting options when provided', async () => {
       orderMock.mockImplementationOnce(() => ({
        range: rangeMock.mockResolvedValueOnce({ data: [], error: null })
      })); 
      await leadsAPI.fetchLeads({ sortBy: 'restaurant_name', sortDirection: 'asc' });
      expect(orderMock).toHaveBeenCalledWith('restaurant_name', { ascending: true });
    });

    test('should apply pagination options when provided', async () => {
       orderMock.mockImplementationOnce(() => ({
        range: rangeMock.mockResolvedValueOnce({ data: [], error: null })
      })); 
      await leadsAPI.fetchLeads({ page: 1, pageSize: 10 });
      expect(rangeMock).toHaveBeenCalledWith(10, 19);
    });

    test('should throw an error if supabase query returns an error from range', async () => {
      const errorMessage = 'Supabase fetch error';
      orderMock.mockImplementationOnce(() => ({
        range: rangeMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } })
      })); 
      
      await expect(leadsAPI.fetchLeads({})).rejects.toThrow(`Error fetching leads: ${errorMessage}`);
    });
  });

  describe('fetchLeadById', () => {
    test('should call supabase with correct lead_id', async () => {
      const leadId = 'test-lead-id';
      const mockLeadData = { lead_id: leadId, restaurant_name: 'Specific Restaurant' };
      // from(...).select(...).eq(...).single()
      singleMock.mockResolvedValueOnce({ data: mockLeadData, error: null });

      const result = await leadsAPI.fetchLeadById(leadId);

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId);
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockLeadData);
    });

    test('should throw error if supabase returns error for fetchLeadById', async () => {
        const leadId = 'test-lead-id';
        const errorMessage = 'Supabase single fetch error';
        singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

        await expect(leadsAPI.fetchLeadById(leadId)).rejects.toThrow(`Error fetching lead: ${errorMessage}`);
    });
  });

  describe('createLead', () => {
    test('should call supabase insert with correct lead data and default values, then log activity', async () => {
      const newLeadData = { restaurant_name: 'New Place', contact_name: 'John Doe' };
      const expectedLeadId = 'new-lead-123';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockCreatedLead = {
        ...newLeadData,
        lead_id: expectedLeadId,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        lead_status: LEAD_STATUSES.NEW,
        ai_trainings_count: 0,
        ai_training_cost_per_unit: 1.5,
        ai_prompts_count: 0,
        ai_prompt_cost_per_unit: 0.16,
        free_sample_package_active: false
      };
      
      singleMock.mockResolvedValueOnce({ data: mockCreatedLead, error: null });
      
      insertMock
        .mockImplementationOnce(() => fromMock()) 
        .mockResolvedValueOnce({ data: null, error: null });    // Second call (activity log) should succeed

      // Spy on console.error to ensure it's NOT called for successful activity log
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await leadsAPI.createLead(newLeadData as any);

      expect(fromMock).toHaveBeenCalledWith('leads'); 
      expect(insertMock).toHaveBeenCalledWith( 
        expect.objectContaining({
          ...newLeadData,
          lead_status: LEAD_STATUSES.NEW,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
      );
      expect(selectMock).toHaveBeenCalled(); 
      expect(singleMock).toHaveBeenCalled(); 
      expect(result).toEqual(mockCreatedLead);

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log'); 
      expect(insertMock).toHaveBeenLastCalledWith(expect.objectContaining({ // Check the last call was for activity
        lead_id: expectedLeadId,
        activity_type: 'ליד חדש נוצר',
        activity_description: 'ליד חדש נוצר',
      }));
      
      // Expect console.error NOT to have been called because activity log should succeed
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore(); // Restore console.error spy
    });

    test('should throw error if supabase returns error on createLead (select single part)', async () => {
        const newLeadData = { restaurant_name: 'Error Place' };
        const errorMessage = 'Supabase insert-select-single error';
        // Mock the failing .single() call
        singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });
        // Ensure the preceding insert call still chains correctly
        insertMock.mockImplementationOnce(() => fromMock()); 

        await expect(leadsAPI.createLead(newLeadData)).rejects.toThrow(`Error creating lead: ${errorMessage}`);
    });

    test('should create lead even if addLeadActivity fails (logs error)', async () => {
      const newLeadData = { restaurant_name: 'Activity Error Place' };
      const expectedLeadId = 'activity-error-lead-123';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockCreatedLead = { 
        ...newLeadData, lead_id: expectedLeadId, created_at: now.toISOString(), updated_at: now.toISOString(), lead_status: LEAD_STATUSES.NEW, ai_trainings_count: 0, ai_training_cost_per_unit: 1.5, ai_prompts_count: 0, ai_prompt_cost_per_unit: 0.16, free_sample_package_active: false 
      };
      
      // Mock successful lead creation's .single() call
      singleMock.mockResolvedValueOnce({ data: mockCreatedLead, error: null });

      // Mock insert: first call (lead) chains, second call (activity log) fails
      const activityErrorMessage = 'Failed to log activity';
      insertMock
        .mockImplementationOnce(() => fromMock()) 
        .mockResolvedValueOnce({data: null, error: {message: activityErrorMessage}}); 
            
      console.error = vi.fn();

      const result = await leadsAPI.createLead(newLeadData);
      expect(result).toEqual(mockCreatedLead);
      
      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ lead_id: expectedLeadId }));
      expect(console.error).toHaveBeenCalledWith(
        `Error adding activity for lead ${expectedLeadId}:`,
        expect.objectContaining({ message: activityErrorMessage })
      );
    });
  });

  describe('updateLead', () => {
    test('should call supabase update with correct data and log activity', async () => {
      const leadId = 'lead-to-update';
      const updates = { restaurant_name: 'Updated Restaurant Name', lead_status: LEAD_STATUSES.CONTACTED };
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockUpdatedLead = { 
        lead_id: leadId,
        ...updates,
        updated_at: now.toISOString(),
      };

      // Mock for the lead update: from.update.eq.select.single
      // This is for the _updateLeadInternal call
      singleMock.mockResolvedValueOnce({ data: mockUpdatedLead, error: null });
      
      // Mock for the activity log insert
      // This needs to be set up to be the *second* call if createLead also uses insertMock globally.
      // However, in this specific describe block for updateLead, it might be the first if no other test before it uses insertMock.
      // For safety, we will assume it is the first specific insert for THIS test case block.
      // We should reset mocks properly in beforeEach if this becomes an issue.
      insertMock.mockResolvedValueOnce({ data: { id: 'log-id' }, error: null }); // Ensuring it resolves to avoid other errors

      await leadsAPI.updateLead(leadId, updates);

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        restaurant_name: 'Updated Restaurant Name',
        lead_status: LEAD_STATUSES.CONTACTED,
        updated_at: now.toISOString(),
      }));
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId);
      expect(selectMock).toHaveBeenCalledTimes(1); // one for the update
      expect(singleMock).toHaveBeenCalledTimes(1); // one for the update

      // Activity log part
      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      // Check the latest call to insertMock for the activity log
      expect(insertMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          lead_id: leadId,
          activity_type: 'סטטוס ליד עודכן',
          activity_description: `סטטוס ליד שונה ל: ${LEAD_STATUS_DISPLAY[LEAD_STATUSES.CONTACTED]}`,
        })
      );
    });

    test('should log different activity if only other fields are updated (not status)', async () => {
      const leadId = 'lead-to-update-other';
      const updates = { restaurant_name: 'New Name Only' }; // No lead_status update
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockUpdatedLead = { lead_id: leadId, ...updates, updated_at: now.toISOString() }; 
      singleMock.mockResolvedValueOnce({ data: mockUpdatedLead, error: null });
      insertMock.mockResolvedValueOnce({ data: { id: 'log-id' }, error: null });

      await leadsAPI.updateLead(leadId, updates);
      
      expect(insertMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          activity_type: 'פרטי ליד עודכנו',
          activity_description: 'פרטי ליד עודכנו',
        })
      );
    });

    test('should throw error if supabase returns error on update', async () => {
      const leadId = 'lead-id-update-fail';
      const updates = { restaurant_name: 'Update Fail Test' };
      const errorMessage = 'Supabase update error';
      
      // Mock for the _updateLeadInternal failure
      singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      // The error thrown by updateLead will be the one from _updateLeadInternal if not caught and re-thrown
      await expect(leadsAPI.updateLead(leadId, updates)).rejects.toThrow(`Error updating lead internal: ${errorMessage}`);
    });

    test('should update lead even if activity log fails (logs error)', async () => {
      const leadId = 'lead-activity-log-fail';
      const updates = { restaurant_name: 'Activity Fail Update', lead_status: LEAD_STATUSES.INTERESTED };
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const mockUpdatedLead = { lead_id: leadId, ...updates, updated_at: now.toISOString() }; 
      
      singleMock.mockResolvedValueOnce({ data: mockUpdatedLead, error: null }); // Successful update
      const activityErrorMessage = 'Supabase activity insert error';
      insertMock.mockResolvedValueOnce({ data: null, error: { message: activityErrorMessage } });
            
      console.error = vi.fn();

      const result = await leadsAPI.updateLead(leadId, updates);
      expect(result).toEqual(mockUpdatedLead);
      
      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ lead_id: leadId }));
      expect(console.error).toHaveBeenCalledWith(
        `Error adding activity for lead ${leadId}:`, 
        expect.objectContaining({ message: activityErrorMessage })
      );
    });
  });

  describe('convertToClient', () => {
    const CONVERTED_TO_CLIENT_ACTUAL_STATUS = (LEAD_STATUSES as any).CONVERTED_TO_CLIENT || 'הפך ללקוח'; // Use the actual value

    test('should call RPC to create client, update lead status, and log activity', async () => {
      const leadId = 'lead-to-convert';
      const userId = 'user-id-for-client';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockRpcResponse = { data: { client_id: 'new-client-id', user_id: userId }, error: null };
      rpcMock.mockResolvedValueOnce(mockRpcResponse);

      const mockUpdatedLeadAfterConversion = { 
        lead_id: leadId, 
        lead_status: CONVERTED_TO_CLIENT_ACTUAL_STATUS, // Use actual status
        updated_at: now.toISOString() 
      };
      // Mock for the _updateLeadInternal call inside convertToClient
      singleMock.mockResolvedValueOnce({ data: mockUpdatedLeadAfterConversion, error: null });
      
      // Mock for the activity log insert
      insertMock.mockResolvedValueOnce({data: null, error: null });

      const result = await leadsAPI.convertToClient(leadId, userId);

      expect(rpcMock).toHaveBeenCalledWith('create_client_from_lead', { p_lead_id: leadId, p_user_id: userId });
      
      expect(fromMock).toHaveBeenCalledWith('leads'); // From _updateLeadInternal
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        lead_status: CONVERTED_TO_CLIENT_ACTUAL_STATUS, // Use actual status
        updated_at: now.toISOString(),
      }));
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId); // From _updateLeadInternal
      expect(selectMock).toHaveBeenCalledTimes(1); // From _updateLeadInternal
      expect(singleMock).toHaveBeenCalledTimes(1); // From _updateLeadInternal

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenLastCalledWith(expect.objectContaining({
        lead_id: leadId,
        activity_type: 'המרת ליד ללקוח',
        activity_description: `הליד הומר ללקוח. Client ID: new-client-id, User ID: ${userId}`
      }));

      expect(result).toEqual({
        client_id: 'new-client-id',
        user_id: userId,
        updatedLead: mockUpdatedLeadAfterConversion
      });
    });

    test('should throw error if RPC call returns success but no client_id', async () => {
      const leadId = 'lead-rpc-no-client-id';
      const userId = 'user-rpc-no-client-id';
      
      // Mock RPC to return success, but with an empty data object (or data without client_id)
      rpcMock.mockResolvedValueOnce({ data: {}, error: null });

      // We don't expect updateLeadInternal or addLeadActivityLog to be called in this failure path,
      // so no need to mock singleMock or insertMock for them here.

      await expect(leadsAPI.convertToClient(leadId, userId)).rejects.toThrow(
        'RPC create_client_from_lead did not return client_id.'
      );
      
      // Ensure mocks for subsequent operations (update, log) were not called
      expect(updateMock).not.toHaveBeenCalled();
      expect(insertMock).not.toHaveBeenCalled(); 
    });

    test('should throw error if RPC call fails', async () => {
      const leadId = 'lead-rpc-fail';
      const userId = 'user-rpc-fail';
      const rpcErrorMessage = 'RPC create_client_from_lead error';
      rpcMock.mockResolvedValueOnce({ data: null, error: { message: rpcErrorMessage } });

      await expect(leadsAPI.convertToClient(leadId, userId)).rejects.toThrow(
        `Error in RPC create_client_from_lead: ${rpcErrorMessage}`
      );
    });

    test('should throw error if lead update fails after successful RPC', async () => {
      const leadId = 'convert-lead-update-fail';
      const userId = 'user-id';
      const rpcResponse = { data: { client_id: 'new-client-id', user_id: userId }, error: null };
      const updateErrorMessage = 'Lead update failed';

      rpcMock.mockResolvedValueOnce(rpcResponse);
      // Mock for the _updateLeadInternal failure
      singleMock.mockResolvedValueOnce({ data: null, error: { message: updateErrorMessage } });

      await expect(leadsAPI.convertToClient(leadId, userId)).rejects.toThrow(
        `Error updating lead internal: ${updateErrorMessage}` // Adjusted to internal error
      );
    });

    test('should convert to client and update lead, even if activity log fails (logs error)', async () => {
      const leadId = 'convert-activity-log-fail';
      const userId = 'user-convert-activity-fail';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const rpcSuccessResponse = { data: { client_id: 'client-xyz', user_id: userId }, error: null };
      rpcMock.mockResolvedValueOnce(rpcSuccessResponse);
      // FIXME: Add 'CONVERTED_TO_CLIENT' to LEAD_STATUSES in '@/constants/statusTypes.ts'
      const CONVERTED_TO_CLIENT_PLACEHOLDER = 'CONVERTED_TO_CLIENT'; 
      const mockUpdatedLead = { lead_id: leadId, lead_status: CONVERTED_TO_CLIENT_PLACEHOLDER, updated_at: now.toISOString() }; 
      singleMock.mockResolvedValueOnce({ data: mockUpdatedLead, error: null });
      
      const activityErrorMessage = 'Activity log insert failed for conversion';
      insertMock.mockResolvedValueOnce({ data: null, error: { message: activityErrorMessage } });
            
      console.error = vi.fn();

      const result = await leadsAPI.convertToClient(leadId, userId);
      
      expect(result).toEqual({ 
        client_id: rpcSuccessResponse.data.client_id, 
        user_id: rpcSuccessResponse.data.user_id,
        updatedLead: mockUpdatedLead 
      });
      expect(rpcMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ lead_id: leadId }));
      expect(console.error).toHaveBeenCalledWith(
        `Error adding activity for lead ${leadId}:`,
        expect.objectContaining({ message: activityErrorMessage })
      );
    });
  });

  describe('archiveLead', () => {
    const ARCHIVED_STATUS = LEAD_STATUSES.ARCHIVED || 'ארכיון';

    test('should update lead status to ARCHIVED and log activity', async () => {
      const leadId = 'lead-to-archive';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      // FIXME: Ensure LEAD_STATUSES.ARCHIVED is correctly imported/defined
      const mockArchivedLead = { lead_id: leadId, lead_status: LEAD_STATUSES.ARCHIVED, updated_at: now.toISOString() }; 

      singleMock.mockResolvedValueOnce({ data: mockArchivedLead, error: null });
      insertMock.mockResolvedValueOnce({ data: { id: 'log-id' }, error: null });

      const result = await leadsAPI.archiveLead(leadId);

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        lead_status: ARCHIVED_STATUS, // Use actual status
        updated_at: now.toISOString()
      }));
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId);
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockArchivedLead);

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenLastCalledWith(expect.objectContaining({
        activity_description: 'הליד הועבר לארכיון'
      }));
    });

    test('should throw error if update fails on archiving', async () => {
      const leadId = 'archive-fail';
      const errorMessage = 'Archive update failed';
      singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(leadsAPI.archiveLead(leadId)).rejects.toThrow(
        `Error updating lead internal: ${errorMessage}` // Adjusted to internal error
      );
    });

    test('should archive lead even if activity log fails (logs error)', async () => {
      const leadId = 'archive-activity-log-fail';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const mockArchivedLead = { lead_id: leadId, lead_status: LEAD_STATUSES.ARCHIVED, updated_at: now.toISOString() }; 
      singleMock.mockResolvedValueOnce({ data: mockArchivedLead, error: null }); // Successful archive
      
      const activityErrorMessage = 'Archive activity log insert failed';
      insertMock.mockResolvedValueOnce({ data: null, error: { message: activityErrorMessage } });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await leadsAPI.archiveLead(leadId);

      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ lead_status: ARCHIVED_STATUS })); // Use actual status
      expect(console.error).toHaveBeenCalledWith(
        `Error adding activity for lead ${leadId}:`,
        expect.objectContaining({ message: activityErrorMessage })
      );
      (console.error as vi.Mock).mockRestore();
    });
  });

  describe('restoreFromArchive', () => {
    const NEW_STATUS_ACTUAL = (LEAD_STATUSES as any).NEW || 'ליד חדש';
    const CONTACTED_STATUS_ACTUAL = (LEAD_STATUSES as any).CONTACTED || 'נוצר קשר';

    test('should update lead status to NEW and log activity when no newStatus provided', async () => {
      const leadId = 'lead-to-restore';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      // FIXME: Ensure LEAD_STATUSES.NEW is correctly imported/defined
      const mockRestoredLead = { lead_id: leadId, lead_status: LEAD_STATUSES.NEW, updated_at: now.toISOString() }; 

      singleMock.mockResolvedValueOnce({ data: mockRestoredLead, error: null });
      insertMock.mockResolvedValueOnce({ data: { id: 'log-id' }, error: null });

      const result = await leadsAPI.restoreFromArchive(leadId);

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        lead_status: NEW_STATUS_ACTUAL, // Use actual status
        updated_at: now.toISOString()
      }));
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId);
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockRestoredLead);

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenLastCalledWith(expect.objectContaining({
        activity_description: `ליד שוחזר מהארכיון עם סטטוס: ${LEAD_STATUS_DISPLAY[NEW_STATUS_ACTUAL as LeadStatus] || NEW_STATUS_ACTUAL}`
      }));
    });

    test('should update lead status to provided newStatus and log activity', async () => {
      const leadId = 'lead-to-restore-custom-status';
      const newStatus = CONTACTED_STATUS_ACTUAL as LeadStatus; // Use actual status
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      // FIXME: Ensure LEAD_STATUSES.NEW and LEAD_STATUSES.CONTACTED are correctly imported/defined
      const mockRestoredLeadCustomStatus = { lead_id: leadId, lead_status: newStatus, updated_at: now.toISOString() };
      singleMock.mockResolvedValueOnce({ data: mockRestoredLeadCustomStatus, error: null });
      insertMock.mockResolvedValueOnce({ data: { id: 'log-id' }, error: null });
      
      const result = await leadsAPI.restoreFromArchive(leadId, newStatus);

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        lead_status: newStatus,
        updated_at: now.toISOString()
      }));
      expect(eqMock).toHaveBeenCalledWith('lead_id', leadId);
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockRestoredLeadCustomStatus);

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenLastCalledWith(expect.objectContaining({
        activity_description: `ליד שוחזר מהארכיון עם סטטוס: ${LEAD_STATUS_DISPLAY[newStatus] || newStatus}`
      }));
    });

    test('should throw error if update fails on restoring', async () => {
      const leadId = 'restore-fail';
      const errorMessage = 'Restore update failed';
      singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(leadsAPI.restoreFromArchive(leadId)).rejects.toThrow(
        `Error updating lead internal: ${errorMessage}` // Adjusted to internal error
      );
    });

    test('should restore lead even if activity log fails (logs error)', async () => {
      const leadId = 'restore-activity-log-fail';
      const now = new Date();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const mockRestoredLead = { lead_id: leadId, lead_status: LEAD_STATUSES.NEW, updated_at: now.toISOString() };
      singleMock.mockResolvedValueOnce({ data: mockRestoredLead, error: null }); // Successful restore
      
      const activityErrorMessage = 'Restore activity log insert failed';
      insertMock.mockResolvedValueOnce({ data: null, error: { message: activityErrorMessage } });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await leadsAPI.restoreFromArchive(leadId);

      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ lead_status: LEAD_STATUSES.NEW })); // Use actual status
      expect(console.error).toHaveBeenCalledWith(
        `Error adding activity for lead ${leadId}:`,
        expect.objectContaining({ message: activityErrorMessage })
      );
      (console.error as vi.Mock).mockRestore();
    });
  });

  describe('addLeadActivityLog', () => {
    test('should log an error to console if supabase insert fails', async () => {
      const leadId = 'test-lead-activity-fail';
      const activityType = 'Test Activity';
      const activityDescription = 'This is a test activity description.';
      const errorMessage = 'Supabase insert error for activity log';

      // Mock the insert call for 'lead_activity_log' to return an error
      // This setup assumes 'fromMock' is reset and configured in beforeEach to return the chained mocks.
      // We need to ensure that insertMock, when called from 'lead_activity_log', returns a specific error.
      
      // Since addLeadActivityLog is called internally by other functions,
      // we might need a more specific way to target its 'insert' call if using a shared insertMock.
      // However, for a direct test of addLeadActivityLog, this should be simpler.
      
      // If insertMock is globally configured and might be called by other setups:
      // For this test, we ensure 'from("lead_activity_log").insert(...)' is the one failing.
      fromMock.mockImplementation((tableName: string) => {
        if (tableName === 'lead_activity_log') {
          return {
            insert: insertMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } }),
            // Add other chained methods if 'insert' isn't terminal or if other methods are called on this chain
          };
        }
        // Default behavior for other tables
        return {
          select: selectMock,
          insert: insertMock, // Default insert mock
          update: updateMock,
          delete: deleteMock,
          eq: eqMock,
          in: inMock,
          or: orMock,
          order: orderMock,
          range: rangeMock,
          single: singleMock,
        };
      });


      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await leadsAPI.addLeadActivityLog(leadId, activityType, activityDescription);

      expect(fromMock).toHaveBeenCalledWith('lead_activity_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        lead_id: leadId,
        activity_type: activityType,
        activity_description: activityDescription,
      }));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error adding activity for lead ${leadId}:`,
        expect.objectContaining({ message: errorMessage })
      );

      consoleErrorSpy.mockRestore();
    });
  });
}); 