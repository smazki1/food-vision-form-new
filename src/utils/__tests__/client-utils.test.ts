/// <reference types="vitest/globals" />
// src/utils/__tests__/client-utils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateClient } from '../client-utils';
import { supabase } from '@/integrations/supabase/client';

// Simpler mock for Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn() // Keep auth mock if needed elsewhere or for session logic
    }
  }
}));

// Local type definition for ClientDetails if not imported from elsewhere
type ClientDetails = {
  restaurantName: string;
  contactName: string;
  phoneNumber: string;
  email: string;
};

describe('getOrCreateClient', () => {
  const clientDetails: ClientDetails = {
    restaurantName: 'Test Restaurant',
    contactName: 'Test Contact',
    phoneNumber: '1234567890',
    email: 'test@example.com',
  };

  let mockClientsTable: any;
  let mockServicePackagesTable: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }), // Default for limit
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }) // Default for single
    };

    mockServicePackagesTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // Default for single in service_packages - can be overridden per test
      single: vi.fn().mockResolvedValue({ 
        data: { package_id: 'free-package-uuid', total_servings: 1 }, 
        error: null 
      })
    };

    // @ts-ignore
    supabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTable;
      }
      if (tableName === 'service_packages') {
        return mockServicePackagesTable;
      }
      // Return a generic empty mock for any other table to avoid undefined errors
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Generic no rows', code: 'PGRST116' } })
      };
    });
  });

  it('should create a new client with a free tasting package if client does not exist and is not an auth user', async () => {
    // 1. Attempt to find client by authUserId (undefined) -> .single() on clients
    mockClientsTable.single // Auth find
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }); 
    // 2. Attempt to find client by email -> .limit() on clients
    mockClientsTable.limit // Email find (unlinked)
        .mockResolvedValueOnce({ data: [], error: null }); 
     // 2b. Attempt to find client by email (any, for conflict check) -> .limit() on clients
    mockClientsTable.limit // Email find (conflict check)
        .mockResolvedValueOnce({ data: [], error: null }); 

    // 3. Fetch free tasting package -> .single() on service_packages
    //    Default behavior of mockServicePackagesTable.single is to return the free package.
    //    If a test needs it to NOT be found, it should override this.

    // 4. Insert new client -> .insert().select().single() on clients
    mockClientsTable.insert.mockImplementationOnce(() => ({ 
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: 'new-client-uuid' }, error: null })
    }));

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-uuid');
    expect(mockClientsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: clientDetails.email,
        user_auth_id: undefined,
        current_package_id: 'free-package-uuid',
        remaining_servings: 1,
      })
    );
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTable.select).toHaveBeenCalledWith('package_id, total_servings'); // From client-utils
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('package_name', 'חבילת טעימה חינמית');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockServicePackagesTable.single).toHaveBeenCalled();
  });

  it('should return existing client_id if client is found by authUserId', async () => {
    const existingClientId = 'existing-auth-user-client-id';
    const mockAuthUserId = 'test-auth-user-123';
    
    // 1. Attempt to find client by authUserId -> .single() on clients
    mockClientsTable.single
      .mockResolvedValueOnce({ 
        data: { client_id: existingClientId, email: clientDetails.email, user_auth_id: mockAuthUserId, remaining_servings: 5 }, 
        error: null 
      }); 

    const clientId = await getOrCreateClient(clientDetails, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('clients'); // from('clients') was called
    expect(mockClientsTable.select).toHaveBeenCalled(); // .select() was called on the mock
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId); // .eq() was called
    expect(mockClientsTable.single).toHaveBeenCalled(); // .single() was called
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();
    
    // @ts-ignore
    const fromCalls = supabase.from.mock.calls;
    expect(fromCalls.some((call: string | any[]) => call[0] === 'service_packages')).toBe(false);
  });

  it('should return existing client_id if client is found by email (anonymous user)', async () => {
    const existingClientId = 'existing-email-client-id';
    const clientEmail = 'anonymous@example.com';

    // 1. Attempt to find client by authUserId (undefined) -> .single() on clients
    mockClientsTable.single
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }); 
    // 2. Attempt to find client by email (unlinked) -> .limit() on clients
    mockClientsTable.limit
      .mockResolvedValueOnce({ 
        data: [{ client_id: existingClientId, email: clientEmail, user_auth_id: null, remaining_servings: 3 }], 
        error: null 
      }); 

    const localClientDetails = { ...clientDetails, email: clientEmail };
    const clientId = await getOrCreateClient(localClientDetails, undefined); // No authUserId provided

    expect(clientId).toBe(existingClientId);
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('clients');
    
    // In this path (anonymous user), effectiveAuthUserId is undefined, so the initial
    // .eq('user_auth_id', undefined) call inside findClientByAuthId is skipped.
    // The first .eq call on mockClientsTable will be for the email lookup.
    expect(mockClientsTable.eq).toHaveBeenCalledWith('email', clientEmail); 
    // The .is('user_auth_id', null) call is NOT made in the anonymous user lookup path directly in getOrCreateClient
    // It was part of the old findClientByEmail logic that was more generic.
    // So, we expect .is NOT to have been called with these arguments here.
    expect(mockClientsTable.is).not.toHaveBeenCalledWith('user_auth_id', null);
    expect(mockClientsTable.limit).toHaveBeenCalledWith(1); // From email lookup
    
    // Verify that .single() associated with authId lookup was NOT called directly on mockClientsTable for eq('user_auth_id',...)
    // Note: .single() can be called as part of other chains (like insert/update), so be specific if needed.
    // For this specific flow, the .single() that would follow .eq('user_auth_id',...) is not reached.
    // We can check that eq with user_auth_id was not called, which implies single was also not called in that path.

    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();

    // @ts-ignore
    const fromCalls = supabase.from.mock.calls;
    const servicePackagesCalls = fromCalls.filter((call: string | any[]) => call[0] === 'service_packages');
    expect(servicePackagesCalls.length).toBe(0);
  });

  it('should return existing client if found by authUserId, without updating general details if they mismatch', async () => {
    const mockAuthUserId = 'auth-user-id-for-find';
    const existingClientId = 'client-id-found-no-update';
    const initialClientData = {
      client_id: existingClientId,
      email: 'old.email@example.com', // Email in DB
      user_auth_id: mockAuthUserId,
      restaurant_name: 'Old Restaurant',
      contact_name: 'Old Contact',
      phone: '0000000000',
      remaining_servings: 5,
      current_package_id: 'some-package-id'
    };
    const newClientDetailsFromForm = {
      restaurantName: 'New Restaurant From Form', // Different name
      contactName: 'New Contact From Form',   // Different contact
      phoneNumber: '1112223333',           // Different phone
      email: 'old.email@example.com',      // Same email as in DB for this test
    };

    // 1. Attempt to find client by authUserId -> .single() on clients
    mockClientsTable.single 
        .mockResolvedValueOnce({ data: initialClientData, error: null }); 

    const clientId = await getOrCreateClient(newClientDetailsFromForm, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('clients');
    expect(mockClientsTable.select).toHaveBeenCalledTimes(1); 
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId); 
    expect(mockClientsTable.single).toHaveBeenCalledTimes(1);
    expect(mockClientsTable.update).not.toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  it('should update existing anonymous client with authUserId if found by email and authUserId is now provided', async () => {
    const mockAuthUserId = 'newly-provided-auth-user-id';
    const existingClientId = 'anon-client-to-be-authed';
    const clientEmail = 'anonymous.user@example.com';

    const initialAnonymousClientData = {
      client_id: existingClientId,
      email: clientEmail,
      user_auth_id: null, 
      restaurant_name: 'Anon Restaurant',
      contact_name: 'Anon Contact',
      phone: '2223334444',
      remaining_servings: 2,
      current_package_id: 'anon-package-id'
    };
    const clientDetailsForUpdate = {
      restaurantName: 'Updated Anon Restaurant',
      contactName: 'Updated Anon Contact',
      phoneNumber: '5556667777',
      email: clientEmail, 
    };

    // Sequence:
    // 1. Auth find (eq('user_auth_id',...).single()) -> fails
    mockClientsTable.single
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });
    // 2. Email find (eq('email',...).is(...).limit()) -> succeeds
    mockClientsTable.limit
      .mockResolvedValueOnce({ data: [initialAnonymousClientData], error: null });
    
    // 3. Update client -> .update().eq().select().single()
    const mockUpdateEq = vi.fn().mockReturnThis(); // Spy for the .eq() in the update chain
    mockClientsTable.update.mockImplementationOnce(() => ({
        eq: mockUpdateEq, // Use the dedicated spy here
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: existingClientId, ...clientDetailsForUpdate, user_auth_id: mockAuthUserId }, error: null })
    }));          
    
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const clientId = await getOrCreateClient(clientDetailsForUpdate, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('clients');
    
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId);
    expect(mockClientsTable.eq).toHaveBeenCalledWith('email', clientEmail);
    expect(mockClientsTable.limit).toHaveBeenCalledWith(1);
    expect(mockClientsTable.update).toHaveBeenCalledWith({
      user_auth_id: mockAuthUserId, 
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('client_id', existingClientId); // Assert on the dedicated spy
    expect(mockClientsTable.single).toHaveBeenCalledTimes(1); // Only the initial auth find
    // The single after update is on the object returned by mockClientsTable.update().single()
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  it('should create a new client with null package when free tasting package is not found', async () => {
    // 1. Auth find -> .single() on clients
    mockClientsTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });
    // 2. Email find (unlinked) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });
    // 2b. Email find (conflict check) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });
    
    // 3. Mock client insertion (this will be called after package lookup)
    mockClientsTable.insert.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: 'new-client-no-package-uuid' }, error: null })
    }));

    // 4. Mock service_packages to return no rows found for the free package
    mockServicePackagesTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-no-package-uuid');
    expect(mockClientsTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: clientDetails.email,
      user_auth_id: undefined, 
      current_package_id: null,
      remaining_servings: 0,
    }));
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTable.select).toHaveBeenCalledWith('package_id, total_servings');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('package_name', 'חבילת טעימה חינמית');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockServicePackagesTable.single).toHaveBeenCalledTimes(1); // Called once for package lookup
  });

  it('should create a new client with null package if service_packages lookup returns an error', async () => {
     // 1. Auth find -> .single() on clients
    mockClientsTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });
    // 2. Email find (unlinked) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });
    // 2b. Email find (conflict check) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });

    // 3. Mock client insertion
    mockClientsTable.insert.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: 'new-client-pkg-error-uuid' }, error: null })
    }));
    
    // 4. Mock service_packages to return a generic error
    mockServicePackagesTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error', code: '50000' } });

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-pkg-error-uuid');
    expect(mockClientsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurant_name: clientDetails.restaurantName,
        contact_name: clientDetails.contactName,
        phone: clientDetails.phoneNumber,
        email: clientDetails.email,
        user_auth_id: undefined,
        current_package_id: null,
        remaining_servings: 0,
      })
    );
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTable.single).toHaveBeenCalled();
  });

  it('should throw an error if clients.insert fails', async () => {
    // 1. Auth find -> .single() on clients
    mockClientsTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });
    // 2. Email find (unlinked) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });
     // 2b. Email find (conflict check) -> .limit() on clients
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [], error: null });

    // 3. service_packages lookup is successful (default mock behavior)
    // mockServicePackagesTable.single.mockResolvedValueOnce(...); // Not needed if default is fine

    // 4. Mock clients.insert to fail
    mockClientsTable.insert.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Insert failed', code: 'DB001' } })
    }));

    await expect(getOrCreateClient(clientDetails, undefined)).rejects.toThrow(
      'Failed to get or create client: Insert failed'
    );

    expect(mockClientsTable.insert).toHaveBeenCalled();
    // @ts-ignore
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTable.single).toHaveBeenCalled();
  });

  it('should throw an error if clients.update fails', async () => {
    const mockAuthUserId = 'auth-user-for-update-fail';
    // const existingClientId = 'client-id-update-will-fail'; // Declared below from data
    const newClientDetailsToFailUpdate = {
      restaurantName: 'New Restaurant Name Update Fail',
      contactName: 'New Contact Name Update Fail',
      phoneNumber: '1112223333',
      email: 'new.updated.email.fail@example.com', // Will be set to unlinked client's email
    };
    
    const clientEmailForUnlinkedFind = 'unlinked.update.fail@example.com';
    const existingClientId = 'client-id-unlinked-for-update-fail';
    const unlinkedClientData = {
        client_id: existingClientId,
        email: clientEmailForUnlinkedFind,
        user_auth_id: null, // Unlinked
    };

    // 1. AuthUserId lookup (eq('user_auth_id',...).single()) -> fails
    mockClientsTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found for auth', code: 'PGRST116' } });
    
    // 2. Email lookup (eq('email',...).is(...).limit()) -> finds unlinked client
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [unlinkedClientData], error: null });

    // 3. Update attempt (update(...).eq(...).select().single()) -> fails
    const mockUpdateEqFail = vi.fn().mockReturnThis();
    mockClientsTable.update.mockImplementationOnce(() => ({
        eq: mockUpdateEqFail, // Use the dedicated spy here
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({data: null, error: {message: 'Update failed forcefully', code: 'DB002'}})
    }));


    await expect(getOrCreateClient(
        {...newClientDetailsToFailUpdate, email: clientEmailForUnlinkedFind }, 
        mockAuthUserId
    )).rejects.toThrow(
      `Failed to update client ${existingClientId} with new authUserId: Update failed forcefully`
    );

    expect(mockClientsTable.update).toHaveBeenCalledWith({ user_auth_id: mockAuthUserId });
    expect(mockUpdateEqFail).toHaveBeenCalledWith('client_id', existingClientId); // Assert on dedicated spy
    // The single for auth find + the single on the result of update().single()
    // single on mockClientsTable is only for first auth find, update has its own single
    expect(mockClientsTable.single).toHaveBeenCalledTimes(1); 
  });

  it('should use authUserId from session if authUserId param is undefined and session exists', async () => {
    const sessionAuthUserId = 'session-user-id';
    const existingClientIdFromSession = 'client-from-session-id';

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: sessionAuthUserId } } },
      error: null,
    });

    // 1. Attempt to find client by sessionAuthUserId -> .single() on clients
    mockClientsTable.single 
      .mockResolvedValueOnce({ 
        data: { client_id: existingClientIdFromSession, user_auth_id: sessionAuthUserId, email: clientDetails.email, remaining_servings: 10 }, 
        error: null 
      }); 

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe(existingClientIdFromSession);
    // @ts-ignore
    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', sessionAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();
  });

  it('should use provided authUserId even if session exists and IDs match', async () => {
    const providedAuthUserId = 'provided-and-session-match-id';
    const existingClientId = 'client-found-by-provided-id';

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: providedAuthUserId } } }, // Session ID matches provided
      error: null,
    });

    // 1. Attempt to find client by providedAuthUserId -> .single() on clients
    mockClientsTable.single
      .mockResolvedValueOnce({ 
        data: { client_id: existingClientId, user_auth_id: providedAuthUserId, email: clientDetails.email, remaining_servings: 4 }, 
        error: null 
      });

    const clientId = await getOrCreateClient(clientDetails, providedAuthUserId);

    expect(clientId).toBe(existingClientId);
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', providedAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  it('should use provided authUserId if it differs from session user ID', async () => {
    const providedAuthUserId = 'provided-id-takes-precedence';
    const sessionAuthUserId = 'different-session-id';
    const existingClientIdForProvided = 'client-for-provided-id-precedence';

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: sessionAuthUserId } } }, // Session ID is different
      error: null,
    });

    // 1. Attempt to find client by providedAuthUserId -> .single() on clients
    mockClientsTable.single
      .mockResolvedValueOnce({ 
        data: { client_id: existingClientIdForProvided, user_auth_id: providedAuthUserId, email: clientDetails.email, remaining_servings: 9 }, 
        error: null 
      });

    const clientId = await getOrCreateClient(clientDetails, providedAuthUserId);

    expect(clientId).toBe(existingClientIdForProvided);
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', providedAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  it('should throw an error if updating an unlinked client with authUserId fails', async () => {
    const mockEmail = 'unlinked-update-fail@example.com';
    const mockAuthUserId = 'auth-user-for-unlinked-fail';
    const existingClientId = 'client-id-unlinked-fail';

    // 1. Mock: No client found by providedAuthUserId (for the first check in getOrCreateClient)
    mockClientsTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found for auth check', code: 'PGRST116' } }); 

    // 2. Mock: Client found by email, unlinked
    mockClientsTable.limit
        .mockResolvedValueOnce({ data: [{ client_id: existingClientId, email: mockEmail, user_auth_id: null }], error: null }); 
    
    // 3. Mock: Update operation failing
    const mockUpdateEqFail2 = vi.fn().mockReturnThis();
    mockClientsTable.update.mockImplementationOnce(() => ({
        eq: mockUpdateEqFail2, // Use the dedicated spy here
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Update failed', code: 'XYZ' } })
    }));
        
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null }); 

    await expect(getOrCreateClient({ ...clientDetails, email: mockEmail }, mockAuthUserId))
      .rejects
      .toThrow(`Failed to update client ${existingClientId} with new authUserId: Update failed`);
    
    expect(mockClientsTable.update).toHaveBeenCalledWith({ user_auth_id: mockAuthUserId });
    expect(mockUpdateEqFail2).toHaveBeenCalledWith('client_id', existingClientId); // Assert on dedicated spy
    expect(mockClientsTable.single).toHaveBeenCalledTimes(1); // auth find only
  });

  // NEW TEST CASES START HERE

  it('should throw a conflict error if email exists and is linked to a DIFFERENT authUserId than the one provided', async () => {
    const mockClientDetailsConflict: ClientDetails = {
      email: 'conflict@example.com',
      restaurantName: 'Conflictaurant',
      contactName: 'Conflict Person',
      phoneNumber: '0000000000',
    };
    const providedAuthUserId = 'auth-user-id-current';
    const existingDifferentAuthUserId = 'auth-user-id-different-in-db';
    const existingClientId = 'client-id-conflict';

    // 1. Mock: No client found by providedAuthUserId.
    mockClientsTable.single
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows for current auth', code: 'PGRST116' } });
    
    // 2. Mock: Client lookup by email (findClientByEmail called with findOnlyUnlinked = false, 
    //    as effectiveAuthUserId is present). This call should find the conflicting client.
    //    .select().eq('email', ...).limit(1)
    mockClientsTable.limit
      .mockResolvedValueOnce({ 
        data: [{ client_id: existingClientId, user_auth_id: existingDifferentAuthUserId, email: mockClientDetailsConflict.email }], 
        error: null 
      });
      
    // NOTE: The third .limit() mock from the previous version of the test is removed as it was redundant
    // if the conflict is caught by the findClientByEmail(email, false) call.
    
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(getOrCreateClient(mockClientDetailsConflict, providedAuthUserId))
      .rejects
      .toThrow('Client email conflict: This email is already registered to a different user account. Please use a different email or log in to the correct account.');
    
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();
  });

  it('should create a new client with null package_id and 0 servings if free tasting package is not found', async () => {
    const mockClientDetailsNoPkg: ClientDetails = {
      email: 'new-user-no-package@example.com',
      restaurantName: 'No Pack Restaurant',
      contactName: 'No Pack User',
      phoneNumber: '1112223333',
    };
    const newClientId = 'new-client-id-no-package';

    // Mock: No client found by authUserId or email
    mockClientsTable.single // For auth user lookup
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows for auth', code: 'PGRST116' } });
    mockClientsTable.limit // For email lookup (unlinked)
        .mockResolvedValueOnce({ data: [], error: null });
    mockClientsTable.limit // For email lookup (conflict check)
        .mockResolvedValueOnce({ data: [], error: null });


    // Mock: Client insertion is successful
    mockClientsTable.insert.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: newClientId }, error: null })
    }));
    
    // Mock: Free tasting package not found (returns null for .single())
    mockServicePackagesTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows for package', code: 'PGRST116' } });
    
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const clientId = await getOrCreateClient(mockClientDetailsNoPkg, undefined);

    expect(clientId).toBe(newClientId);
    expect(mockClientsTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: mockClientDetailsNoPkg.email,
      user_auth_id: undefined, 
      current_package_id: null,
      remaining_servings: 0,
    }));
    expect(mockServicePackagesTable.select).toHaveBeenCalledWith('package_id, total_servings');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('package_name', 'חבילת טעימה חינמית');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockServicePackagesTable.single).toHaveBeenCalledTimes(1); // Called once for package lookup
  });
  
  it('should create a new client with null package_id and 0 servings if fetching free tasting package throws an error (other than no rows)', async () => {
    const mockClientDetailsPkgError: ClientDetails = {
      email: 'new-user-package-error@example.com',
      restaurantName: 'Pack Error Restaurant',
      contactName: 'Pack Error User',
      phoneNumber: '2223334444',
    };
    const newClientId = 'new-client-id-package-error';

    // Mock: No client found
    mockClientsTable.single.mockResolvedValueOnce({ data: null, error: { message: 'No rows auth', code: 'PGRST116' } }); // auth
    mockClientsTable.limit.mockResolvedValueOnce({ data: [], error: null }); // email unlinked
    mockClientsTable.limit.mockResolvedValueOnce({ data: [], error: null }); // email conflict


    // Mock: Client insertion success
    mockClientsTable.insert.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { client_id: newClientId }, error: null })
    }));
    
    // Mock: Free tasting package fetch throws an unexpected error
    mockServicePackagesTable.single
        .mockResolvedValueOnce({ data: null, error: { message: 'DB connection error', code: 'DB_ERR' } });

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const clientId = await getOrCreateClient(mockClientDetailsPkgError, undefined);

    expect(clientId).toBe(newClientId);
    expect(mockClientsTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: mockClientDetailsPkgError.email,
      current_package_id: null,
      remaining_servings: 0,
    }));
    expect(mockServicePackagesTable.select).toHaveBeenCalledWith('package_id, total_servings');
    expect(mockServicePackagesTable.single).toHaveBeenCalledTimes(1);
  });

  // Add more tests as identified or needed
}); 