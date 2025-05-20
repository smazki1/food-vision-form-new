/// <reference types="vitest/globals" />
// src/utils/__tests__/client-utils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateClient } from '../client-utils'; // Removed ClientResult import
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  // This is the base mock for the entire supabase client object
  const mockSupabaseClient = {
    from: vi.fn(), 
    // Actual insert/update implementations will be more detailed on the object returned by from()
    // or overridden in tests. These are placeholders if someone tries to call them directly on supabase.
    auth: {
      getSession: vi.fn()
    }
    // Other Supabase methods like rpc, storage, etc., if needed
  };
  return { supabase: mockSupabaseClient };
});


describe('getOrCreateClient', () => {
  const clientDetails = {
    restaurantName: 'Test Restaurant',
    contactName: 'Test Contact',
    phoneNumber: '1234567890',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });

    // Define a reusable mock structure for what supabase.from() returns
    const createTableMock = () => {
      const mock: any = {}; // Use 'any' for type flexibility in mock chaining
      mock.select = vi.fn().mockReturnValue(mock);
      mock.insert = vi.fn().mockReturnValue(mock); // For supabase.insert(...).select().single()
      mock.update = vi.fn().mockReturnValue(mock); // For supabase.update(...).eq(...).select().single()
      mock.eq = vi.fn().mockReturnValue(mock);
      mock.or = vi.fn().mockReturnValue(mock);
      mock.is = vi.fn().mockReturnValue(mock);
      mock.limit = vi.fn().mockResolvedValue({ data: [], error: null }); // Resolves with specific data structure
      // Default single for finds; updates/inserts will also hit this if they chain to single via .select().single()
      mock.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }); 
      return mock;
    };

    // Mock supabase.from to return a specific table mock based on tableName
    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      const tableMock = createTableMock();
      if (tableName === 'service_packages') {
        // Specific override for service_packages .single()
        tableMock.single.mockResolvedValue({
            data: { package_id: 'free-package-uuid', total_servings: 1 },
            error: null,
        });
      }
      // For 'clients' table, the default createTableMock values are usually fine for beforeEach
      // Specific test cases will override the relevant methods like .single() or .limit() for 'clients'
      return tableMock;
    });
  });

  it('should create a new client with a free tasting package if client does not exist and is not an auth user', async () => {
    // Specific mock setup for this test case
    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({ // This insert is for the clients table
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { client_id: 'new-client-uuid' }, error: null })
      })),
      update: vi.fn().mockReturnThis(), // Not used in this path but good to have
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      // For find by auth_user_id (which uses .single())
      single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }), 
      // For find by email (which uses .limit())
      limit: vi.fn().mockResolvedValueOnce({ data: [], error: null }), 
    };

    const mockServicePackagesTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
          data: { package_id: 'free-package-uuid', total_servings: 1 }, 
          error: null 
      }),
      // Add other methods if service_packages interaction becomes more complex
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTable;
      }
      if (tableName === 'service_packages') {
        return mockServicePackagesTable;
      }
      return {}; // Should not happen in this test
    });

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-uuid');
    // Check that clients.insert was called with the correct payload
    expect(mockClientsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: clientDetails.email,
        user_auth_id: undefined,
        current_package_id: 'free-package-uuid',
        remaining_servings: 1,
      })
    );
    // Check that from was called for service_packages
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    // Check that service_packages.select.eq.single was involved
    expect(mockServicePackagesTable.select).toHaveBeenCalled();
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('package_name', 'חבילת טעימה חינמית');
    expect(mockServicePackagesTable.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockServicePackagesTable.single).toHaveBeenCalled();
  });

  it('should return existing client_id if client is found by authUserId', async () => {
    const existingClientId = 'existing-auth-user-client-id';
    const mockAuthUserId = 'test-auth-user-123';

    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(), // Should not be called
      update: vi.fn(), // Should not be called
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      // For find by auth_user_id (which uses .single())
      single: vi.fn().mockResolvedValueOnce({ 
        data: { client_id: existingClientId, email: clientDetails.email, user_auth_id: mockAuthUserId, remaining_servings: 5 }, 
        error: null 
      }), 
      limit: vi.fn(), // Should not be called in this path
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTable;
      }
      // service_packages table should not be queried in this scenario
      return {}; 
    });

    const clientId = await getOrCreateClient(clientDetails, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    expect(supabase.from).toHaveBeenCalledWith('clients');
    expect(mockClientsTable.select).toHaveBeenCalled();
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();
    // Ensure service_packages was not called
    const fromCalls = (supabase.from as vi.Mock).mock.calls;
    expect(fromCalls.some(call => call[0] === 'service_packages')).toBe(false);
  });

  it('should return existing client_id if client is found by email (anonymous user)', async () => {
    const existingClientId = 'existing-email-client-id';
    const clientEmail = 'anonymous@example.com';

    // This mock will be used by supabase.from when tableName is 'clients'
    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(), // Should not be called in this path
      update: vi.fn(), // Should not be called in this path
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(), 
      is: vi.fn().mockReturnThis(),
      // Mock for the first call (by authUserId) - .single()
      single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }), 
      // Mock for the second call (by email) - .limit()
      limit: vi.fn().mockResolvedValueOnce({ 
        data: [{ client_id: existingClientId, email: clientEmail, user_auth_id: null, remaining_servings: 3 }], 
        error: null 
      }), 
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        // The mock for `single` and `limit` are already set up on mockClientsTable for the sequence of calls
        return mockClientsTable;
      }
      // service_packages table should not be queried in this scenario
      return {}; // Return an empty object for other table names to avoid errors
    });

    const localClientDetails = { ...clientDetails, email: clientEmail }; // Use a specific email for this test
    const clientId = await getOrCreateClient(localClientDetails, undefined); // No authUserId provided

    expect(clientId).toBe(existingClientId);
    // Verify the calls to supabase.from('clients')
    expect(supabase.from).toHaveBeenCalledWith('clients');
    // Verify the .eq() and .limit() calls for email lookup
    expect(mockClientsTable.eq).toHaveBeenCalledWith('email', clientEmail);
    expect(mockClientsTable.limit).toHaveBeenCalledWith(1);
    
    // Ensure no client was created or updated
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();

    // Ensure service_packages was not queried
    const fromCalls = (supabase.from as vi.Mock).mock.calls;
    // Filter out the calls to 'clients' and check if 'service_packages' was ever called.
    const servicePackagesCalls = fromCalls.filter(call => call[0] === 'service_packages');
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

    // Specific mock setup for this test case
    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(), // Should not be called
      update: vi.fn(), // Should not be called
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: initialClientData, error: null }), // Find by authUserId
      limit: vi.fn().mockResolvedValue({ data: [], error: null }), // Default for email lookup if it were reached
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTable;
      }
      // service_packages should not be called in this specific test path
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { package_id: 'free-package-uuid', total_servings: 1 }, error: null })
      };
    });

    const clientId = await getOrCreateClient(newClientDetailsFromForm, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    expect(supabase.from).toHaveBeenCalledWith('clients');
    expect(mockClientsTable.select).toHaveBeenCalledTimes(1); 
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId); 
    expect(mockClientsTable.single).toHaveBeenCalledTimes(1);
    // Crucially, no update should be called for general details mismatch in this path
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

    // Local mock for supabase.from for this specific test
    const localClientsTableMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(), // Should not be called, but make it chainable if accidentally hit
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn(), // Will be specifically mocked for the email lookup
      single: vi.fn(), // Will be specifically mocked for auth lookup and update result
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return localClientsTableMock;
      }
      // Mock service_packages to return a default successful package if it were called (not expected here)
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { package_id: 'free-package-uuid', total_servings: 1 }, error: null })
      };
    });

    // Sequence for .single() on localClientsTableMock:
    // 1. Auth find (fails)
    // 2. Update result (succeeds)
    localClientsTableMock.single
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }) // Call 1 (auth find)
      .mockResolvedValueOnce({ data: { client_id: existingClientId }, error: null });             // Call 2 (update result)

    // Sequence for .limit() on localClientsTableMock:
    // 1. Email find (succeeds)
    localClientsTableMock.limit.mockResolvedValueOnce({ data: [initialAnonymousClientData], error: null });
    
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });

    const clientId = await getOrCreateClient(clientDetailsForUpdate, mockAuthUserId);

    expect(clientId).toBe(existingClientId);
    expect(supabase.from).toHaveBeenCalledWith('clients'); // General call to from('clients')
    
    // Auth find check
    expect(localClientsTableMock.eq).toHaveBeenCalledWith('user_auth_id', mockAuthUserId);
    // Email find check
    expect(localClientsTableMock.eq).toHaveBeenCalledWith('email', clientEmail);
    expect(localClientsTableMock.limit).toHaveBeenCalledWith(1);
    // Update check
    expect(localClientsTableMock.update).toHaveBeenCalledWith({
      user_auth_id: mockAuthUserId, 
    });
    expect(localClientsTableMock.eq).toHaveBeenCalledWith('client_id', existingClientId); // Update targets correct client
    expect(localClientsTableMock.single).toHaveBeenCalledTimes(2); // auth find + update result
    expect(localClientsTableMock.insert).not.toHaveBeenCalled();
  });

  it('should create a new client with null package when free tasting package is not found', async () => {
    // Client does not exist by authUserId or email
    const mockClientsTableNotFound = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({ // This insert is for the clients table
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { client_id: 'new-client-no-package-uuid' }, error: null })
      })),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }), // For find by auth_user_id
      limit: vi.fn().mockResolvedValue({ data: [], error: null }), // For find by email
    };

    // Mock service_packages to return no rows found
    const mockServicePackagesTableNotFound = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }),
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTableNotFound;
      }
      if (tableName === 'service_packages') {
        return mockServicePackagesTableNotFound;
      }
      return {};
    });

    // No authUserId provided, simulating new anonymous user
    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-no-package-uuid');
    // Check that clients.insert was called with null package details
    expect(mockClientsTableNotFound.insert).toHaveBeenCalledWith(
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
    // Check that service_packages was queried
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTableNotFound.single).toHaveBeenCalled();
  });

  it('should create a new client with null package if service_packages lookup returns an error', async () => {
    const mockClientsTableNotFound = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { client_id: 'new-client-pkg-error-uuid' }, error: null })
      })),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    // Mock service_packages to return a generic error
    const mockServicePackagesTableError = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error', code: '50000' } }),
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTableNotFound;
      }
      if (tableName === 'service_packages') {
        return mockServicePackagesTableError;
      }
      return {};
    });

    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe('new-client-pkg-error-uuid');
    expect(mockClientsTableNotFound.insert).toHaveBeenCalledWith(
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
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTableError.single).toHaveBeenCalled();
  });

  it('should throw an error if clients.insert fails', async () => {
    const mockClientsTableInsertError = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed', code: 'DB001' } })
      })),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } }), // For find by auth_user_id
      limit: vi.fn().mockResolvedValue({ data: [], error: null }), // For find by email
    };

    // service_packages lookup is successful in this case, the failure is at client insertion
    const mockServicePackagesTableSuccess = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
            data: { package_id: 'free-package-uuid', total_servings: 1 },
            error: null,
        }),
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTableInsertError;
      }
      if (tableName === 'service_packages') {
        return mockServicePackagesTableSuccess;
      }
      return {};
    });

    // Expect getOrCreateClient to throw an error
    await expect(getOrCreateClient(clientDetails, undefined)).rejects.toThrow(
      'Failed to get or create client: Insert failed'
    );

    expect(mockClientsTableInsertError.insert).toHaveBeenCalled();
    // We also expect the function to have tried to get the package first
    expect(supabase.from).toHaveBeenCalledWith('service_packages');
    expect(mockServicePackagesTableSuccess.single).toHaveBeenCalled();
  });

  it('should throw an error if clients.update fails', async () => {
    const mockAuthUserId = 'auth-user-for-update-fail';
    const existingClientId = 'client-id-update-will-fail';
    const initialClientData = {
      client_id: existingClientId,
      email: 'old.email@example.com',
      user_auth_id: mockAuthUserId, // Client is already linked to this auth user
      restaurant_name: 'Old Restaurant',
      contact_name: 'Old Contact',
      phone: '0000000000',
      remaining_servings: 5,
      current_package_id: 'some-package-id'
    };
    const newClientDetailsToFailUpdate = {
      restaurantName: 'New Restaurant Name Update Fail',
      contactName: 'New Contact Name Update Fail',
      phoneNumber: '1112223333',
      email: 'new.updated.email.fail@example.com',
    };

    const mockClientsTable = (supabase.from as vi.Mock)('clients');
    // 1. Initial find by authUserId (succeeds)
    // 2. Update operation (fails)
    mockClientsTable.single
      .mockResolvedValueOnce({ data: initialClientData, error: null }) // Initial find
      .mockResolvedValueOnce({ data: null, error: { message: 'Update failed forcefully', code: 'DB002' } }); // Update attempt

    // The actual function getOrCreateClient will try to update clientDetails if they differ from found client.
    // Let's assume the scenario is that the client *is* found by authUserId, and an update to its details is attempted and fails.
    // The function getOrCreateClient internally would call update if details differ, or if an unlinked client is found by email and needs linking.
    // This test now simulates the case where a client is found by authUserId, and the subsequent implicit update of details fails.
    
    // To ensure the update path is triggered within getOrCreateClient, we make the incoming email different
    // from the one in initialClientData, assuming clientDetails are always updated if different.
    // However, the current getOrCreateClient doesn't explicitly update details if found by authUserId unless email also changes.
    // Let's adjust the test to reflect an update of an unlinked client (found by email, then authUserId is provided), where that update fails.

    // REVISED SCENARIO for update failure: Client found by email (unlinked), then attempt to link authUserId fails.
    const clientEmailForUnlinkedFind = 'unlinked.update.fail@example.com';
    const unlinkedClientData = {
        client_id: existingClientId,
        email: clientEmailForUnlinkedFind,
        user_auth_id: null, // Unlinked
    };

    // Reset mocks for this specific scenario
    vi.resetAllMocks(); // Important to reset mocks from beforeEach for this specific flow
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
    
    const localMockClientsTable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        limit: vi.fn(), // To be specifically mocked below
        single: vi.fn(), // To be specifically mocked below
    };
    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
        if (tableName === 'clients') {
            return localMockClientsTable;
        }
        // Add a default mock for service_packages if it were to be called, though not expected in this test flow
        return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Generic package error'}})
        }; 
    });

    localMockClientsTable.single // For authUserId lookup (fails first)
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found', code: 'PGRST116' } })
        .mockResolvedValueOnce({data: null, error: {message: 'Update failed forcefully', code: 'DB002'}}); // For the update itself
    
    localMockClientsTable.limit // For email lookup (finds unlinked client)
        .mockResolvedValueOnce({ data: [unlinkedClientData], error: null });


    await expect(getOrCreateClient(
        {...newClientDetailsToFailUpdate, email: clientEmailForUnlinkedFind }, 
        mockAuthUserId
    )).rejects.toThrow(
      `Failed to update client ${existingClientId} with new authUserId: Update failed forcefully`
    );

    expect(localMockClientsTable.update).toHaveBeenCalledWith({ user_auth_id: mockAuthUserId });
    expect(localMockClientsTable.eq).toHaveBeenCalledWith('client_id', existingClientId);
  });

  it('should use authUserId from session if authUserId param is undefined and session exists', async () => {
    const sessionAuthUserId = 'session-user-id';
    const existingClientIdFromSession = 'client-from-session-id';

    // Mock getSession to return an active session
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({
      data: { session: { user: { id: sessionAuthUserId } } },
      error: null,
    });

    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(), // Should not be called
      update: vi.fn(), // Should not be called
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ 
        data: { client_id: existingClientIdFromSession, user_auth_id: sessionAuthUserId, email: clientDetails.email }, 
        error: null 
      }), 
      limit: vi.fn(), 
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') {
        return mockClientsTable;
      }
      return {}; 
    });

    // Pass undefined for authUserId, function should pick it up from session
    const clientId = await getOrCreateClient(clientDetails, undefined);

    expect(clientId).toBe(existingClientIdFromSession);
    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', sessionAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
    expect(mockClientsTable.update).not.toHaveBeenCalled();
  });

  it('should use provided authUserId even if session exists and IDs match', async () => {
    const providedAuthUserId = 'provided-and-session-match-id';
    const existingClientId = 'client-found-by-provided-id';

    // Mock getSession to return an active session with the SAME user ID
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({
      data: { session: { user: { id: providedAuthUserId } } },
      error: null,
    });

    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ 
        data: { client_id: existingClientId, user_auth_id: providedAuthUserId, email: clientDetails.email }, 
        error: null 
      }),
      limit: vi.fn(),
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') return mockClientsTable;
      return {};
    });

    const clientId = await getOrCreateClient(clientDetails, providedAuthUserId);

    expect(clientId).toBe(existingClientId);
    // getSession might be called, but the providedAuthUserId is what matters for the query
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', providedAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  it('should use provided authUserId if it differs from session user ID', async () => {
    const providedAuthUserId = 'provided-id-takes-precedence';
    const sessionAuthUserId = 'different-session-id';
    const existingClientIdForProvided = 'client-for-provided-id-precedence';

    (supabase.auth.getSession as vi.Mock).mockResolvedValue({
      data: { session: { user: { id: sessionAuthUserId } } },
      error: null,
    });

    const mockClientsTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ 
        data: { client_id: existingClientIdForProvided, user_auth_id: providedAuthUserId, email: clientDetails.email }, 
        error: null 
      }),
      limit: vi.fn(),
    };

    (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'clients') return mockClientsTable;
      return {};
    });

    const clientId = await getOrCreateClient(clientDetails, providedAuthUserId);

    expect(clientId).toBe(existingClientIdForProvided);
    // Ensure the query used the providedAuthUserId, not the one from the session
    expect(mockClientsTable.eq).toHaveBeenCalledWith('user_auth_id', providedAuthUserId);
    expect(mockClientsTable.single).toHaveBeenCalled();
    expect(mockClientsTable.insert).not.toHaveBeenCalled();
  });

  // More tests will be added here
}); 