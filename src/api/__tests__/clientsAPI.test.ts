/// <reference types="vitest/globals" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { clientsAPI, checkClientExists, createClientFromLead } from '../clientsApi';
import { CLIENT_STATUSES, LEAD_STATUSES } from '@/constants/statusTypes';
import { Lead, LeadStatusEnum } from '@/types/lead';
import { Client } from '@/types/models';

vi.mock('@/integrations/supabase/client', async () => {
  const actualVitest = await vi.importActual<typeof import('vitest')>('vitest');
  const { vi: actualVi } = actualVitest;

  const selectFn = actualVi.fn();
  const insertFn = actualVi.fn();
  const updateFn = actualVi.fn();
  const eqFn = actualVi.fn();
  const inFn = actualVi.fn();
  const orFn = actualVi.fn();
  const orderFn = actualVi.fn();
  const rangeFn = actualVi.fn();
  const singleFn = actualVi.fn();
  const maybeSingleFn = actualVi.fn();

  const mockChainedFunctions = {
    select: selectFn,
    insert: insertFn,
    update: updateFn,
    eq: eqFn,
    in: inFn,
    or: orFn,
    order: orderFn,
    range: rangeFn,
    single: singleFn,
    maybeSingle: maybeSingleFn,
  };

  selectFn.mockImplementation(() => mockChainedFunctions);
  insertFn.mockImplementation(() => mockChainedFunctions);
  updateFn.mockImplementation(() => mockChainedFunctions);
  eqFn.mockImplementation(() => mockChainedFunctions);
  inFn.mockImplementation(() => mockChainedFunctions);
  orFn.mockImplementation(() => mockChainedFunctions);
  orderFn.mockImplementation(() => mockChainedFunctions);
  rangeFn.mockResolvedValue({ data: [], error: null });
  singleFn.mockResolvedValue({ data: {}, error: null });
  maybeSingleFn.mockResolvedValue({ data: null, error: null });

  const fromFn = actualVi.fn(() => mockChainedFunctions);

  return {
    supabase: {
      from: fromFn,
      _internalMocks: {
        from: fromFn,
        select: selectFn,
        insert: insertFn,
        update: updateFn,
        eq: eqFn,
        in: inFn,
        or: orFn,
        order: orderFn,
        range: rangeFn,
        single: singleFn,
        maybeSingle: maybeSingleFn,
      }
    },
  };
});

import { supabase } from '@/integrations/supabase/client';

let fromMock: any;
let selectMock: any;
let insertMock: any;
let eqMock: any;
let inMock: any;
let orMock: any;
let orderMock: any;
let rangeMock: any;
let singleMock: any;
let maybeSingleMock: any;


describe('clientsAPI', () => {
  beforeEach(() => {
    const internalMocks = (supabase as any)._internalMocks || {};
    fromMock = internalMocks.from;
    selectMock = internalMocks.select;
    insertMock = internalMocks.insert;
    eqMock = internalMocks.eq;
    inMock = internalMocks.in;
    orMock = internalMocks.or;
    orderMock = internalMocks.order;
    rangeMock = internalMocks.range;
    singleMock = internalMocks.single;
    maybeSingleMock = internalMocks.maybeSingle;

    vi.clearAllMocks();

    fromMock.mockImplementation(() => ({
      select: selectMock.mockReturnThis(),
      insert: insertMock.mockReturnThis(),
      update: (supabase as any)._internalMocks.update.mockReturnThis(),
      eq: eqMock.mockReturnThis(),
      in: inMock.mockReturnThis(),
      or: orMock.mockReturnThis(),
      order: orderMock.mockReturnThis(),
      range: rangeMock.mockResolvedValue({ data: [], error: null }),
      single: singleMock.mockResolvedValue({ data: {}, error: null }),
      maybeSingle: maybeSingleMock.mockResolvedValue({ data: null, error: null })
    }));
  });

  describe('checkClientExists', () => {
    test('should return true if client exists', async () => {
      maybeSingleMock.mockResolvedValueOnce({ data: { client_id: '1', email: 'exists@example.com' }, error: null });
      const result = await checkClientExists('exists@example.com');
      expect(fromMock).toHaveBeenCalledWith('clients');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('email', 'exists@example.com');
      expect(maybeSingleMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false if client does not exist', async () => {
      maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
      const result = await checkClientExists('new@example.com');
      expect(result).toBe(false);
    });

    test('should throw error if supabase call fails', async () => {
      const errorMessage = 'Supabase error';
      maybeSingleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });
      await expect(checkClientExists('error@example.com')).rejects.toThrow(errorMessage);
    });
  });

  describe('createClientFromLead', () => {
    const mockLead: Lead = {
      lead_id: 'lead-123',
      restaurant_name: 'Test Restaurant',
      contact_name: 'Test Contact',
      phone: '1234567890',
      email: 'lead@example.com',
      lead_status: LeadStatusEnum.NEW,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_trainings_count: 0,
      ai_training_cost_per_unit: 0,
      ai_prompts_count: 0,
      ai_prompt_cost_per_unit: 0,
      free_sample_package_active: false,
    };
    const packageId = 'pkg-001';
    const servingsCount = 10;
    const mockCreatedClient = { 
        client_id: 'client-789', 
        restaurant_name: mockLead.restaurant_name, 
        contact_name: mockLead.contact_name,
        phone: mockLead.phone,
        email: mockLead.email,
        original_lead_id: mockLead.lead_id, 
        client_status: CLIENT_STATUSES.ACTIVE,
        remaining_servings: servingsCount,
        current_package_id: packageId,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
    } as unknown as Client;

    test('should successfully create a client and return client data', async () => {
      const dbReturnedClient = { 
          ...mockCreatedClient,
          updated_at: new Date().toISOString(),
      };
      singleMock.mockResolvedValueOnce({ data: dbReturnedClient, error: null });

      const result = await createClientFromLead(mockLead, packageId, servingsCount);

      expect(fromMock).toHaveBeenCalledWith('clients');
      expect(insertMock).toHaveBeenCalledWith({
        restaurant_name: mockLead.restaurant_name,
        contact_name: mockLead.contact_name,
        phone: mockLead.phone,
        email: mockLead.email,
        original_lead_id: mockLead.lead_id,
        client_status: CLIENT_STATUSES.ACTIVE, 
        remaining_servings: servingsCount,
        current_package_id: packageId
      });
      expect(selectMock).toHaveBeenCalled();
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(dbReturnedClient);
    });

    test('should throw error if supabase insert fails', async () => {
      const errorMessage = 'Insert failed';
      singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });
      await expect(createClientFromLead(mockLead, packageId, servingsCount)).rejects.toThrow(errorMessage);
    });
  });

  describe('clientsAPI.fetchClients', () => {
    test('should fetch active clients by default with default sorting and pagination', async () => {
      const mockClientsData = [{
        client_id: '1', 
        client_status: CLIENT_STATUSES.ACTIVE,
        restaurant_name: "Client 1",
        contact_name: "Contact 1",
        phone: "111",
        email: "c1@example.com",
        remaining_servings: 10,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      }] as Client[];
      rangeMock.mockResolvedValueOnce({ data: mockClientsData, error: null });

      await clientsAPI.fetchClients({});

      expect(fromMock).toHaveBeenCalledWith('clients');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(inMock).toHaveBeenCalledWith('client_status', [CLIENT_STATUSES.ACTIVE]);
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(rangeMock).toHaveBeenCalledWith(0, 19);
    });

    test('should apply status filters when provided', async () => {
      const statusesToFilter = [CLIENT_STATUSES.ACTIVE, CLIENT_STATUSES.PENDING];
      rangeMock.mockResolvedValueOnce({ data: [], error: null });
      await clientsAPI.fetchClients({ statuses: statusesToFilter });
      expect(inMock).toHaveBeenCalledWith('client_status', statusesToFilter);
    });

    test('should apply searchTerm when provided', async () => {
      const searchTerm = 'Pizza Place';
      rangeMock.mockResolvedValueOnce({ data: [], error: null });
      await clientsAPI.fetchClients({ searchTerm });
      expect(orMock).toHaveBeenCalledWith(
        `restaurant_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    });

    test('should apply sorting options when provided', async () => {
      rangeMock.mockResolvedValueOnce({ data: [], error: null });
      await clientsAPI.fetchClients({ sortBy: 'restaurant_name', sortDirection: 'asc' });
      expect(orderMock).toHaveBeenCalledWith('restaurant_name', { ascending: true });
    });

    test('should apply pagination options when provided', async () => {
      rangeMock.mockResolvedValueOnce({ data: [], error: null });
      await clientsAPI.fetchClients({ page: 1, pageSize: 10 });
      expect(rangeMock).toHaveBeenCalledWith(10, 19);
    });

    test('should throw an error if supabase query returns an error from range', async () => {
      const errorMessage = 'Supabase fetch error';
      rangeMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });
      await expect(clientsAPI.fetchClients({})).rejects.toThrow(`Error fetching clients: ${errorMessage}`);
    });
  });

  describe('clientsAPI.fetchClientById', () => {
    test('should call supabase with correct client_id and return client data', async () => {
      const clientId = 'client-123';
      const mockClientData: Client = {
          client_id: clientId, 
          restaurant_name: 'Specific Client',
          contact_name: "Client Contact",
          phone: "0987654321",
          email: "client@example.com",
          client_status: CLIENT_STATUSES.ACTIVE,
          remaining_servings: 5,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
      };
      singleMock.mockResolvedValueOnce({ data: mockClientData, error: null });

      const result = await clientsAPI.fetchClientById(clientId);

      expect(fromMock).toHaveBeenCalledWith('clients');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('client_id', clientId);
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockClientData);
    });

    test('should throw error if supabase returns error for fetchClientById', async () => {
      const clientId = 'client-error';
      const errorMessage = 'Supabase single fetch error';
      singleMock.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(clientsAPI.fetchClientById(clientId)).rejects.toThrow(`Error fetching client: ${errorMessage}`);
    });
  });
}); 