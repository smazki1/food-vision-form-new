# Food Vision AI - System Patterns

## Comprehensive Testing Architecture (January 2025)

### Testing Excellence Patterns - Comment Synchronization & Lead-to-Client Conversion Success Models

#### **1. 100% Core Functionality Testing Achievement Pattern**
**Proven Pattern**: Focus on business logic testing over complex UI mocking achieves 100% test success

```typescript
// Optimal Testing Strategy (Proven to achieve 100% success rate)
1. Core Business Logic Tests (Hook-level) - HIGHEST PRIORITY
2. Database Integration Tests (Direct function testing) - HIGH PRIORITY  
3. Edge Cases & Error Handling - ESSENTIAL
4. Performance & Memory Tests - IMPORTANT
5. UI Component Tests - OPTIONAL (complex components difficult to mock)

// File Structure Pattern - Successful Implementation
src/
├── hooks/__tests__/
│   ├── commentSynchronization.comprehensive.test.tsx  // 24/24 tests passing ✅
│   ├── convertLeadToClient.integration.test.ts        // 15/15 tests passing ✅
│   └── useLeadConversion.test.ts                      // 17/17 tests passing ✅
└── components/admin/*/___tests__/
    └── *.integration.test.tsx                         // Complex UI - mocking issues ⚠️
```

#### **2. Comment Synchronization Testing Pattern - 100% Success Model**
**Critical Pattern**: Comprehensive hook testing with realistic scenarios achieves user goals

```typescript
// Template: Comment Synchronization Test Structure (24/24 passing)
describe('Comment Synchronization Comprehensive Tests', () => {
  
  // ✅ Happy Path Tests (5/5 passing)
  describe('Happy Path Scenarios', () => {
    it('should fetch and process client comments successfully', async () => {
      // Test successful comment retrieval and processing
    });
    
    it('should detect missing lead comments automatically', async () => {
      // Test automatic identification of unsynced lead comments
    });
    
    it('should handle empty comment state gracefully', async () => {
      // Test when no comments exist or need synchronization
    });
    
    it('should add new comments with optimistic updates', async () => {
      // Test new comment addition with UI updates and cache invalidation
    });
    
    it('should force refresh comments when requested', async () => {
      // Test manual cache refresh with staleTime: 0
    });
  });

  // ✅ Edge Cases (4/4 passing)
  describe('Edge Cases', () => {
    it('should handle malformed JSON in internal_notes', async () => {
      // Test graceful degradation with invalid JSON data
    });
    
    it('should handle query failures gracefully', async () => {
      // Test network/timeout scenarios with proper error handling
    });
    
    it('should validate empty client ID parameters', async () => {
      // Test parameter validation with meaningful error messages
    });
    
    it('should retry comment additions with exponential backoff', async () => {
      // Test retry mechanisms up to 3 attempts
    });
  });

  // ✅ Error Handling (3/3 passing)
  describe('Error Handling', () => {
    it('should handle database operation failures', async () => {
      // Test database failures with Hebrew error messages
    });
    
    it('should handle comment addition failures with max retries', async () => {
      // Test retry logic with proper error propagation
    });
    
    it('should handle sync status update failures', async () => {
      // Test fallback recovery mechanisms
    });
  });

  // ✅ Diagnostic Utilities (8/8 passing)
  describe('Diagnostic Utilities', () => {
    it('should test lead comment transfer functionality', async () => {
      // Test testLeadCommentTransfer() utility
    });
    
    it('should debug client comments state', async () => {
      // Test debugClientComments() utility
    });
    
    it('should force comment synchronization', async () => {
      // Test forceCommentSync() utility
    });
    
    // Additional utility tests...
  });

  // ✅ Integration Tests (2/2 passing)
  describe('Integration Tests', () => {
    it('should complete full synchronization workflow', async () => {
      // Test end-to-end from detection to completion
    });
    
    it('should handle concurrent comment operations', async () => {
      // Test race conditions and simultaneous operations
    });
  });

  // ✅ Performance/Memory Tests (2/2 passing)
  describe('Performance & Memory', () => {
    it('should handle large comment datasets efficiently', async () => {
      // Test 100+ comments without performance degradation
    });
    
    it('should prevent memory leaks', async () => {
      // Test proper cleanup and resource management
    });
  });
});
```

#### **3. Layered Testing Strategy**
**Proven Pattern**: Database → Hooks → UI Component testing approach provides comprehensive coverage

```typescript
// Testing Layer Hierarchy (Most Critical → Least Critical)
1. Database Integration Tests (100% business logic coverage required)
2. Hook-Level Tests (React Query + business logic validation)  
3. UI Component Tests (User interaction validation - optional for complex components)

// File Structure Pattern
src/
├── hooks/__tests__/
│   ├── convertLeadToClient.integration.test.ts  // Database layer
│   └── useLeadConversion.test.ts                // Hook layer
└── components/admin/leads/__tests__/
    └── LeadToClientConversion.comprehensive.test.tsx // UI layer
```

#### **2. Database Integration Testing Pattern**
**Critical Pattern**: Test the database function directly with comprehensive scenarios

```typescript
// Template: Database Integration Test Structure
describe('[Feature] Database Integration Tests', () => {
  // ✅ Happy Path Scenarios
  it('should handle successful conversion with new client creation', async () => {
    // Test unique email → creates new client
  });
  
  it('should handle successful conversion with existing client linking', async () => {
    // Test existing email → links to current client
  });

  // ✅ Edge Cases  
  it('should handle conversion with empty data gracefully', async () => {
    // Test leads with no notes/activity/comments
  });
  
  it('should handle Hebrew characters in all text fields', async () => {
    // Test Hebrew text processing and preservation
  });

  // ✅ Error Handling
  it('should handle non-existent lead ID with proper error', async () => {
    // Test invalid UUID handling
  });
  
  it('should handle database constraint violations', async () => {
    // Test unique key violations and constraint errors
  });
  
  it('should handle network errors during conversion', async () => {
    // Test timeout and connection failures
  });

  // ✅ Performance Requirements
  it('should complete conversion within acceptable time', async () => {
    const startTime = performance.now();
    // ... conversion logic
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(200); // Sub-200ms requirement
  });

  // ✅ Data Preservation Validation
  it('should preserve all lead data during conversion', async () => {
    // Verify notes, comments, activity logs are maintained
  });
});
```

#### **3. React Hook Testing Pattern**
**Proven Pattern**: Comprehensive hook testing with proper mocking infrastructure

```typescript
// Template: Hook Testing Structure
describe('[Feature] Hook Tests', () => {
  let queryClient: QueryClient;
  let mockSupabaseRpc: MockedFunction<any>;
  let mockToastSuccess: MockedFunction<any>;
  let mockToastError: MockedFunction<any>;

  beforeEach(() => {
    // Fresh QueryClient for each test - essential for isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Comprehensive Supabase client mocking
    mockSupabaseRpc = vi.fn();
    vi.mocked(supabase).rpc = mockSupabaseRpc;
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      })
    });

    // Toast notification mocking
    mockToastSuccess = vi.fn();
    mockToastError = vi.fn();
    vi.mocked(toast).success = mockToastSuccess;
    vi.mocked(toast).error = mockToastError;
  });

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  // Test Pattern: Happy Path
  it('should successfully trigger conversion on status change', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({
      data: 'new-client-id-123',
      error: null
    });

    const { result } = renderHook(() => useUpdateLeadWithConversion(), {
      wrapper: createWrapper()
    });

    await waitFor(async () => {
      await result.current.mutateAsync({
        leadId: 'test-lead-id',
        updates: { lead_status: 'הפך ללקוח' }
      });
    });

    expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
      p_lead_id: 'test-lead-id'
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
    );
  });

  // Test Pattern: Error Handling
  it('should handle conversion failure gracefully', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Lead not found', code: 'P0001' }
    });

    const { result } = renderHook(() => useUpdateLeadWithConversion(), {
      wrapper: createWrapper()
    });

    await waitFor(async () => {
      try {
        await result.current.mutateAsync({
          leadId: 'invalid-lead',
          updates: { lead_status: 'הפך ללקוח' }
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('שגיאה בהמרת הליד ללקוח')
    );
  });
});
```

#### **4. UI Component Testing Pattern (Optional for Complex Components)**
**Learning**: Complex tab-based components with heavy dependency injection are difficult to test

```typescript
// Recommendation: Focus on business logic testing over complex UI testing
// For complex tabbed interfaces, prioritize hook and database testing

// Simple Component Testing Pattern (Recommended)
describe('Simple Component Tests', () => {
  it('should render basic UI elements', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});

// Complex Component Testing (Avoid - Focus on Business Logic Instead)
// ❌ Don't test complex tabbed interfaces with heavy mocking
// ✅ Test the hooks and database functions they use instead
```

#### **5. Mock Strategy Patterns**

**Supabase Client Mocking Pattern:**
```typescript
// Comprehensive Supabase client mock setup
const mockSupabaseClient = {
  rpc: vi.fn(),
  from: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null })
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: {}, error: null })
      })
    })
  })
};

vi.mocked(supabase).rpc = mockSupabaseClient.rpc;
vi.mocked(supabase).from = mockSupabaseClient.from;
```

**React Query Testing Pattern:**
```typescript
// Essential React Query setup for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false, // Disable retries for faster test execution
      staleTime: 0  // Ensure fresh data in tests
    },
    mutations: { 
      retry: false  // Disable mutation retries
    }
  }
});

const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

#### **6. Performance Testing Pattern**
```typescript
// Performance validation pattern
it('should complete operation within performance requirements', async () => {
  const startTime = performance.now();
  
  // Execute operation
  await performOperation();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(200); // Sub-200ms requirement
});
```

#### **7. Hebrew Language Testing Pattern**
```typescript
// Hebrew text processing validation
it('should handle Hebrew characters correctly', async () => {
  const hebrewData = {
    restaurant_name: 'מסעדה בדיקה',
    contact_name: 'איש קשר',
    notes: 'הערות בעברית',
    comments: 'תגובות בעברית'
  };

  const result = await processHebrewData(hebrewData);
  
  // Verify Hebrew text is preserved
  expect(result.restaurant_name).toBe('מסעדה בדיקה');
  expect(result.contact_name).toBe('איש קשר');
  expect(result.notes).toContain('הערות בעברית');
});
```

#### **8. Test Execution & Reporting Pattern**
```typescript
// Test naming convention for clear reporting
describe('[Feature Name] Tests', () => {
  describe('Happy Path Tests', () => {
    // All success scenarios
  });
  
  describe('Edge Cases', () => {
    // Boundary conditions and unusual inputs
  });
  
  describe('Error Handling', () => {
    // All failure scenarios
  });
  
  describe('Performance Tests', () => {
    // Time and resource validation
  });
  
  describe('Integration Tests', () => {
    // End-to-end business logic validation
  });
});
```

#### **9. Test Quality Metrics**
**Success Criteria for Production Readiness:**
- ✅ Database Integration: 100% test coverage (all business logic scenarios)
- ✅ Hook Tests: 100% test coverage (React Query + error handling)
- ✅ Performance: All operations under target time limits
- ✅ Hebrew Support: Complete character and language validation
- ✅ Error Handling: All failure scenarios tested with proper user feedback
- ⚠️ UI Components: Optional for complex components (focus on business logic)

**Deployment Confidence Levels:**
- **100% Confidence**: Database + Hook tests passing with comprehensive coverage
- **95% Confidence**: Minor UI test issues but core functionality validated
- **90% Confidence**: Some test gaps but critical paths validated
- **<90%**: Not recommended for production deployment

---

## Architecture Overview

### Frontend Architecture
1. **Component Structure**
   - UI Components: `/src/components/ui`
   - Admin Components: `/src/components/admin`
   - Customer Components: `/src/components/customer`
   - Food Vision Components: `/src/components/food-vision`

2. **Routing Structure**
   - Admin Routes: Protected by AdminRoute component
   - Customer Routes: Protected by CustomerLayout
   - Public Routes: Accessible without authentication

3. **State Management**
   - React Query for server state
   - React Context for UI state
   - Local state for component-specific data

### Backend Architecture (Supabase)
1. **Database Schema**
   ```
   clients
   ├── client_id (PK)
   ├── user_auth_id (FK to auth.users)
   ├── restaurant_name
   ├── contact_name
   ├── email
   ├── phone
   ├── client_status
   ├── current_package_id
   ├── remaining_servings
   ├── payment_status (NEW)
   ├── payment_due_date (NEW)
   ├── payment_amount_ils (NEW)
   ├── website_url (NEW)
   ├── address (NEW)
   ├── business_type (NEW)
   └── archive_status (NEW)

   client_design_settings (NEW TABLE)
   ├── id (PK)
   ├── client_id (FK to clients)
   ├── category (TEXT)
   ├── background_images (TEXT[])
   ├── style_notes (TEXT)
   ├── created_at (TIMESTAMPTZ)
   └── updated_at (TIMESTAMPTZ)

   leads
   ├── lead_id (PK, UUID)
   ├── restaurant_name (TEXT)
   ├── contact_name (TEXT)
   ├── phone (TEXT)
   ├── email (TEXT)
   ├── lead_status (lead_status_type ENUM)
   ├── lead_source (lead_source_type ENUM)
   ├── created_at (TIMESTAMPTZ)
   ├── updated_at (TIMESTAMPTZ)
   ├── notes (TEXT)
   ├── next_follow_up_date (TIMESTAMPTZ)

   lead_status_type (ENUM)
   -- ('ליד חדש', 'פנייה ראשונית בוצעה', 'מעוניין', 'לא מעוניין', 'נקבעה פגישה/שיחה', 'הדגמה בוצעה', 'הצעת מחיר נשלחה', 'ממתין לתשובה', 'הפך ללקוח', 'ארכיון')

   lead_source_type (ENUM)
   -- ('אתר', 'פייסבוק', 'אינסטגרם', 'הפנייה', 'קמפיין', 'טלמרקטינג', 'אחר')

   customer_submissions
   ├── submission_id (PK)
   ├── client_id (FK)
   ├── item_type
   ├── status
   └── processed_image_urls

   service_packages
   ├── package_id (PK)
   ├── package_name
   ├── total_servings
   └── price
   ```

2. **Authentication System**
   - Supabase Auth for user management
   - Role-based access control via metadata
   - Secure session management

   **Key RPC Functions (Illustrative - refer to migration files for exact definitions):**
   *   `public.get_my_role()`: Retrieves the role of the current authenticated user. Essential for RLS.
   *   `public.public_submit_item_by_restaurant_name(p_restaurant_name TEXT, p_item_type TEXT, p_item_name TEXT, p_contact_name TEXT, p_contact_phone TEXT, p_contact_email TEXT, p_description TEXT, p_category TEXT, p_ingredients TEXT[], p_reference_image_urls TEXT[])`:
       - Handles public form submissions for new items.
       - This function now also attempts to create a new lead in the `public.leads` table if the submitting entity (based on restaurant name, email, or phone) doesn't already exist as a client or lead.
       - It uses correct Hebrew ENUM values (e.g., 'ליד חדש' for `lead_status`, 'אתר' for `lead_source`) for default lead properties.
       - **Troubleshooting Journey**: This function underwent significant debugging. Initial issues included:
           - Multiple versions (7 vs. 10 parameters) leading to client-side calls not matching existing signatures (PGRST202 error).
           - Incorrect database column references during `INSERT` operations into the `leads` table (e.g., `phone_number` instead of `phone`, `status` instead of `lead_status`).
           - Incorrect string values for ENUM types (e.g., sending "new" instead of "ליד חדש" for `lead_status_type`), causing `22P02 invalid input value for enum` errors.
           - These issues were resolved by ensuring the RPC signature matches the client call, all database column names are correct, and all ENUM values conform to the database definitions.
     Stored procedures for complex operations (RPCs) are managed via migration files.

## Design Patterns

### Component Patterns
1. **Layout Components**
   - AdminLayout: Admin interface wrapper
   - CustomerLayout: Customer interface wrapper
   - Shared navigation and authentication checks

2. **Form Patterns**
   - Controlled inputs with validation
   - Form submission handling
   - Error state management
   - Loading state indicators
   - Conditional rendering of fields based on business status (isNewBusiness)
   - Dynamic required fields and validation with zod/react-hook-form

3. **Data Display Patterns**
   - Tables with sorting and filtering
   - Cards for summary information
   - Lists for item display
   - Modal dialogs for detailed views

4. **Tabbed Interface Patterns (CLIENT MANAGEMENT)**
   - Consistent tab structure between leads and clients
   - Sheet-based UI for detailed views
   - Inline editing with auto-save functionality
   - Real-time updates with React Query invalidation

### Hook Patterns
1. **Authentication Hooks**
   - useAdminAuth: Admin authentication logic
   - useClientAuth: Client authentication logic
   - useClientProfile: Client profile management

2. **Data Management Hooks**
   - useClientDetails: Client data management
   - useSubmissions: Submission handling
   - usePackages: Package management

3. **Utility Hooks**
   - useToast: Notification management
   - useDialog: Modal dialog control
   - useForm: Form state management

## Client Management System Patterns (Latest - January 2025)

### Tabbed Interface Architecture Pattern
1. **Unified Tab Structure** - Consistency Between Leads and Clients
   ```typescript
   // Common pattern for both LeadDetailPanel and ClientDetailPanel
   const TabStructure = {
     Tab1: "Details", // Basic information with inline editing
     Tab2: "Packages", // Package management and assignment
     Tab3: "Submissions", // Menu items and submission management
     Tab4: "Activity", // Activity history and notes
     Tab5: "Payments" // Payment tracking (clients only)
   };

   // Implementation pattern:
   export function ClientDetailPanel({ clientId }: { clientId: string }) {
     return (
       <Sheet>
         <SheetContent className="max-w-6xl">
           <Tabs>
             <TabsList>
               {/* Consistent tab navigation */}
             </TabsList>
             <TabsContent value="details">
               <ClientDetailsTab clientId={clientId} />
             </TabsContent>
             {/* Other tabs... */}
           </Tabs>
         </SheetContent>
       </Sheet>
     );
   }
   ```

2. **Inline Editing Pattern** - Direct Field Updates
   ```typescript
   // Pattern for auto-save field editing
   const handleFieldBlur = async (field: string, value: string) => {
     try {
       await updateClient.mutateAsync({
         clientId: client.client_id,
         updates: { [field]: value }
       });
       toast({ title: "עודכן בהצלחה" });
     } catch (error) {
       toast({ title: "שגיאה בעדכון", variant: "destructive" });
     }
   };

   // Usage in components:
   <Input
     onBlur={(e) => handleFieldBlur('restaurant_name', e.target.value)}
     defaultValue={client.restaurant_name}
   />
   ```

3. **Database Enhancement Pattern** - Incremental Schema Evolution
   ```sql
   -- Pattern: Add new fields to existing tables without breaking changes
   ALTER TABLE clients ADD COLUMN payment_status TEXT;
   ALTER TABLE clients ADD COLUMN payment_due_date TIMESTAMPTZ;
   ALTER TABLE clients ADD COLUMN payment_amount_ils DECIMAL;
   
   -- Pattern: Create related tables for complex data
   CREATE TABLE client_design_settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID REFERENCES clients(client_id) ON DELETE CASCADE,
     category TEXT NOT NULL,
     background_images TEXT[] DEFAULT '{}',
     style_notes TEXT
   );
   ```

### Design Settings Management Pattern
1. **Category-Based Image Storage**
   ```typescript
   // Pattern for managing multiple image categories per client
   interface ClientDesignSettings {
     id: string;
     client_id: string;
     category: string; // 'dishes', 'drinks', 'jewelry', etc.
     background_images: string[]; // 2-3 images per category
     style_notes: string;
   }

   // Usage pattern:
   const useClientDesignSettings = (clientId: string) => {
     return useQuery({
       queryKey: ['client-design-settings', clientId],
       queryFn: () => getClientDesignSettings(clientId)
     });
   };
   ```

2. **Dynamic Category System**
   - Manual category creation based on client needs
   - Flexible image storage (2-3 per category)
   - Style notes for each category
   - Easy expansion for new business types

### Lead-Client Synchronization Pattern
1. **Data Migration Pattern** - Lead to Client Conversion
   ```typescript
   // Pattern for transferring data from leads to clients
   const convertLeadToClient = async (leadId: string) => {
     const lead = await getLead(leadId);
     
     // Transfer core data
     const clientData = {
       restaurant_name: lead.restaurant_name,
       contact_name: lead.contact_name,
       email: lead.email,
       phone: lead.phone,
       // New client-specific fields
       payment_status: 'pending',
       business_type: determineBusinessType(lead),
       // ... other mappings
     };
     
     // Create client and transfer activities
     const client = await createClient(clientData);
     await transferLeadActivities(leadId, client.client_id);
     
     return client;
   };
   ```

2. **Activity History Preservation**
   - Lead activities transferred to client history
   - Notes and communication history maintained
   - Timeline continuity between lead and client phases

### Payment Management Pattern
1. **Israeli Shekel (ILS) Support**
   ```typescript
   // Pattern for ILS payment tracking
   interface PaymentInfo {
     payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
     payment_due_date: Date;
     payment_amount_ils: number; // Amount in Israeli Shekels
     payment_notes: string;
   }

   // Display pattern with Hebrew formatting
   const formatILS = (amount: number) => {
     return new Intl.NumberFormat('he-IL', {
       style: 'currency',
       currency: 'ILS'
     }).format(amount);
   };
   ```

2. **Manual Payment Tracking**
   - Admin-controlled payment status updates
   - Due date management and reminders
   - Payment history tracking
   - Integration with client billing workflow

### Component Architecture Pattern
1. **Modular Tab Components**
   ```typescript
   // Pattern: Each tab is a separate component
   src/components/admin/client-details/
   ├── ClientDetailPanel.tsx          // Main container
   ├── tabs/
   │   ├── ClientDetailsTab.tsx       // Basic info
   │   ├── ClientPackageManagement.tsx // Package assignment
   │   ├── ClientSubmissionsSection.tsx // Menu submissions
   │   ├── ClientActivityNotes.tsx    // Activity tracking
   │   └── ClientPaymentStatus.tsx    // Payment management
   ```

2. **Shared Component Pattern** - Reuse Between Leads and Clients
   ```typescript
   // Pattern: Create shared components for common functionality
   const SubmissionCard = ({ submission, context }: { 
     submission: Submission; 
     context: 'lead' | 'client' 
   }) => {
     // Shared UI with context-specific behavior
   };

   // Usage in both lead and client contexts
   <SubmissionCard submission={submission} context="client" />
   ```

### Integration Points Pattern
1. **Cross-System Data Flow**
   ```mermaid
   flowchart TD
     Lead[Lead Management] --> Conversion[Lead to Client]
     Conversion --> Client[Client Management]
     Client --> Packages[Package System]
     Client --> Submissions[Submission System]
     Client --> Payments[Payment Tracking]
   ```

2. **Unified Query Management**
   ```typescript
   // Pattern: Consistent query keys across systems
   const QUERY_KEYS = {
     leads: ['leads'],
     clients: ['clients'],
     submissions: ['submissions'],
     packages: ['packages']
   } as const;

   // Invalidation pattern for cross-system updates
   const invalidateRelatedData = (clientId: string) => {
     queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
     queryClient.invalidateQueries({ queryKey: ['submissions', 'client', clientId] });
     queryClient.invalidateQueries({ queryKey: ['packages', 'client', clientId] });
   };
   ```

## API Integration Patterns

### Supabase Integration
1. **Client Setup**
   ```typescript
   const supabase = createClient<Database>(
     SUPABASE_URL,
     SUPABASE_PUBLISHABLE_KEY
   );
   ```

2. **Data Access Patterns**
   - Direct table access with RLS
   - Stored procedures (RPC functions) for complex operations:
     - Ensure RPC call signatures (parameter names if using named parameters, types, and order if using positional) precisely match between frontend client and backend function definition.
     - Supabase PostgREST returns an HTTP 404 (Not Found) error with code `PGRST202` if it cannot find an RPC function matching the requested name and parameters.
   - Real-time subscriptions for updates

3. **File Storage Patterns**
   - Organized bucket structure
   - Secure file access control
   - Optimized upload process

## Error Handling Patterns
1. **API Error Handling**
   - Consistent error structure
   - User-friendly error messages
   - Error logging and tracking

2. **UI Error States**
   - Loading indicators
   - Error boundaries
   - Fallback UI components

## Security Patterns
1. **Authentication Security**
   - Secure password handling
   - Session management
   - Role-based access control

2. **Data Security**
   - Row Level Security (RLS)
   - Input validation
   - Data sanitization

## Testing Patterns
1. **Component Testing**
   - Unit tests for components
   - Integration tests for flows
   - Snapshot testing for UI
   - Comprehensive coverage: happy path, edge cases, error handling, integration with context and user data loading
   - Mocking react-query for session/client-details in tests

2. **Hook Testing**
   - Custom hook testing
   - Mocked API responses
   - State management testing 

## Package Management Patterns (Latest - December 2024)

### API Layer Patterns
1. **Dual Approach Pattern** - Critical for Supabase HTTP 406 Error Resolution
   ```typescript
   // REST API approach (primary)
   export async function updatePackage(packageId: string, data: Partial<Package>): Promise<Package> {
     const { data, error } = await supabase
       .from("service_packages")
       .update(transformedData)
       .eq("package_id", packageId)
       .select("package_id, name, description, ...") // Explicit columns to avoid 406
       .single();
   }

   // RPC approach (fallback for reliability)
   export async function updatePackageViaRPC(packageId: string, data: Partial<Package>): Promise<Package> {
     const { data, error } = await supabase
       .rpc('update_service_package', rpcParams);
   }
   ```

2. **Data Transformation Pattern** - Database ↔ Interface Mapping
   ```typescript
   // Helper functions for consistent data transformation
   const transformDbRowToPackage = (row: any): Package => ({
     package_id: row.package_id,
     package_name: row.name, // Map 'name' from DB to 'package_name' for interface
     description: row.description,
     // ... other fields
   });

   const transformPackageToDbRow = (packageData: Omit<Package, "package_id">) => ({
     name: packageData.package_name, // Map 'package_name' from interface to 'name' for DB
     description: packageData.description,
     // ... other fields
   });
   ```

3. **Enhanced Error Logging Pattern**
   ```typescript
   try {
     const { data, error } = await supabaseOperation;
     if (error) {
       console.error(`[packageApi] Supabase error:`, {
         code: error.code,
         details: error.details,
         hint: error.hint,
         message: error.message
       });
       throw error;
     }
   } catch (error) {
     console.error(`[packageApi] Exception:`, error);
     throw error;
   }
   ```

### Cache Management Patterns
1. **Multi-Strategy Cache Invalidation** - Ensures UI Refresh
   ```typescript
   const mutation = useMutation({
     mutationFn: updatePackageViaRPC,
     onSuccess: () => {
       // Strategy 1: Invalidate specific query keys
       queryClient.invalidateQueries({ queryKey: ["packages"] });
       queryClient.invalidateQueries({ queryKey: ["packages_simplified"] });
       
       // Strategy 2: Force refetch for immediate update
       queryClient.refetchQueries({ queryKey: ["packages"] });
       
       // Strategy 3: Predicate-based clearing (catches all variations)
       queryClient.invalidateQueries({
         predicate: (query) => 
           query.queryKey[0] === "packages" || 
           query.queryKey[0] === "packages_simplified"
       });
     }
   });
   ```

2. **Authentication-Stable Query Pattern**
   ```typescript
   const { data: packages, isLoading } = useQuery({
     queryKey: ["packages_simplified"],
     queryFn: getPackages,
     enabled: !!user || !!localStorage.getItem('auth-fallback'), // Multiple auth checks
     staleTime: 1000 * 60 * 5, // 5 minutes cache
   });
   ```

### Form Management Patterns
1. **Comprehensive Form Hook Pattern**
   ```typescript
   export const usePackageForm = (existingPackage: Package | null, onSuccess: () => void) => {
     const isEditMode = !!existingPackage;
     
     const mutation = useMutation({
       mutationFn: isEditMode ? 
         (data) => updatePackageViaRPC(existingPackage.package_id, data) :
         (data) => createPackage(data),
       onSuccess: () => {
         toast.success(isEditMode ? 'החבילה עודכנה בהצלחה' : 'החבילה נוצרה בהצלחה');
         // Multi-strategy cache invalidation
         onSuccess();
       },
       onError: () => {
         toast.error(isEditMode ? 'שגיאה בעדכון החבילה' : 'שגיאה ביצירת החבילה');
       }
     });
   };
   ```

### Database RPC Pattern
1. **Comprehensive RPC Function** - Handles All Package Updates
   ```sql
   CREATE OR REPLACE FUNCTION update_service_package(
     p_package_id UUID,
     p_name TEXT DEFAULT NULL,
     p_description TEXT DEFAULT NULL,
     p_total_servings INTEGER DEFAULT NULL,
     p_price NUMERIC DEFAULT NULL,
     p_is_active BOOLEAN DEFAULT NULL,
     p_features_tags TEXT[] DEFAULT NULL,
     p_max_processing_time_days INTEGER DEFAULT NULL,
     p_max_edits_per_serving INTEGER DEFAULT NULL
   )
   RETURNS service_packages
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     UPDATE service_packages SET
       name = COALESCE(p_name, name),
       description = COALESCE(p_description, description),
       total_servings = COALESCE(p_total_servings, total_servings),
       price = COALESCE(p_price, price),
       is_active = COALESCE(p_is_active, is_active),
       features_tags = COALESCE(p_features_tags, features_tags),
       max_processing_time_days = COALESCE(p_max_processing_time_days, max_processing_time_days),
       max_edits_per_serving = COALESCE(p_max_edits_per_serving, max_edits_per_serving),
       updated_at = NOW()
     WHERE package_id = p_package_id;
     
     RETURN (SELECT * FROM service_packages WHERE package_id = p_package_id);
   END;
   $$;
   ```

### Testing Patterns
1. **Comprehensive API Testing Pattern**
   ```typescript
   describe('Package API', () => {
     beforeEach(() => {
       vi.clearAllMocks();
     });

     it('should handle RPC errors', async () => {
       const mockError = new Error('RPC error');
       mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError });
       
       await expect(updatePackageViaRPC('123', {})).rejects.toThrow(mockError);
     });
   });
   ```

2. **React Hook Testing Pattern**
   ```typescript
   describe('usePackageForm hook', () => {
     const createWrapper = () => {
       const queryClient = new QueryClient({
         defaultOptions: {
           queries: { retry: false },
           mutations: { retry: false }
         }
       });
       return ({ children }) => (
         <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
       );
     };

     it('should handle successful package creation', async () => {
       vi.mocked(packageApi.createPackage).mockResolvedValue(mockCreatedPackage);
       // ... test implementation
     });
   });
   ```

3. **Integration Testing Pattern**
   ```typescript
   describe('Package RPC Integration Tests', () => {
     let testPackageId: string;

     beforeEach(async () => {
       // Create test data
       const { data } = await supabase.from('service_packages').insert(testData).select().single();
       testPackageId = data.package_id;
     });

     afterEach(async () => {
       // Clean up test data
       await supabase.from('service_packages').delete().eq('package_id', testPackageId);
     });
   });
   ```

---

## Latest Technical Patterns (January 2025)

### Advanced React Query Patterns

#### 1. **Optimistic Updates with Rollback Pattern**
```typescript
// Pattern for immediate UI feedback with error recovery
const updateMutation = useMutation({
  mutationFn: ({ newValue, notes }: { newValue: number; notes: string }) => 
    updateClientServings(clientId, newValue, notes),
  onMutate: async ({ newValue }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['client-detail', clientId] });

    // Snapshot previous value
    const previousClient = queryClient.getQueryData(['client-detail', clientId]);

    // Optimistically update
    queryClient.setQueryData(['client-detail', clientId], (old: any) => {
      if (!old) return old;
      return { ...old, remaining_servings: newValue };
    });

    return { previousClient };
  },
  onSuccess: (updatedClient) => {
    // Update cache with real data
    queryClient.setQueryData(['client-detail', clientId], updatedClient);
    
    // Update related queries
    queryClient.setQueryData(['clients'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((client: any) => 
        client.client_id === clientId ? updatedClient : client
      );
    });
    
    toast.success(`מנות עודכנו ל-${updatedClient.remaining_servings}`);
  },
  onError: (error, variables, context) => {
    // Rollback on failure
    queryClient.setQueryData(['client-detail', clientId], context?.previousClient);
    toast.error('שגיאה בעדכון המנות');
  },
});
```

#### 2. **Fresh Data Queries with Stale Time Zero**
```typescript
// Pattern for ensuring immediate data freshness
const { data: freshClientData } = useQuery({
  queryKey: ['client-detail', clientId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error) throw error;
    return data;
  },
  staleTime: 0, // Always fetch fresh data
  enabled: !!clientId
});

// Use fresh data if available, fallback to prop
const currentClient = freshClientData || client;
```

### Automatic Serving Deduction Pattern

#### 3. **Universal Hook Enhancement Pattern**
```typescript
// Pattern for adding automatic functionality to existing hooks
async function handleAutomaticServingDeduction(submissionId: string, submissionData: any) {
  try {
    // Validate client existence
    const clientId = submissionData.client_id;
    if (!clientId) {
      console.warn("Cannot deduct servings: submission has no client_id");
      return;
    }

    // Get current client state
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("remaining_servings, restaurant_name")
      .eq("client_id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client for serving deduction:", clientError);
      return;
    }

    // Validate remaining servings
    const currentServings = client.remaining_servings || 0;
    if (currentServings <= 0) {
      console.warn("Cannot deduct servings: client has no remaining servings");
      return;
    }

    // Perform deduction with audit trail
    const newServingsCount = currentServings - 1;
    const notes = `ניכוי אוטומטי בעקבות אישור עבודה: ${submissionData.item_name_at_submission}`;

    await updateClientServings(clientId, newServingsCount, notes);

    // User feedback
    toast.success(`נוכה סרבינג אחד מ${client.restaurant_name}. נותרו: ${newServingsCount} מנות`);

  } catch (error) {
    console.error("Error in automatic serving deduction:", error);
    toast.error("שגיאה בניכוי אוטומטי של מנה");
  }
}

// Enhanced hook pattern
export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: SubmissionStatusKey }) => {
      // Get current submission data before updating
      const { data: currentSubmission, error: fetchError } = await supabase
        .from('customer_submissions')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      // Update the submission status
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('customer_submissions')
        .update({ submission_status: status })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Automatic serving deduction when submission is approved
      if (status === "הושלמה ואושרה") {
        await handleAutomaticServingDeduction(submissionId, updatedSubmission);
      }

      return updatedSubmission;
    },
    onSuccess: (data, { submissionId }) => {
      // Comprehensive cache invalidation
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['client', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['client-detail', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
      
      toast.success('סטטוס עודכן בהצלחה');
    }
  });
};
```

### Hebrew Path Sanitization Pattern

#### 4. **Storage Path Sanitization for Hebrew Content**
```typescript
// Pattern for Hebrew-safe storage paths
const sanitizePathComponent = (text: string): string => {
  // 1. Hebrew word mapping for food industry terms
  const hebrewToEnglish = {
    'מנה': 'dish', 'שתיה': 'drink', 'קוקטייל': 'cocktail',
    'עוגה': 'cake', 'מאפה': 'pastry', 'סלט': 'salad',
    'עוף': 'chicken', 'בשר': 'meat', 'דג': 'fish',
    'ירקות': 'vegetables', 'פירות': 'fruits',
    'מרק': 'soup', 'קינוח': 'dessert', 'לחם': 'bread'
  };
  
  // 2. Replace whole Hebrew words first
  let result = text;
  Object.entries(hebrewToEnglish).forEach(([hebrew, english]) => {
    const regex = new RegExp(`\\b${hebrew}\\b`, 'g');
    result = result.replace(regex, english);
  });
  
  // 3. Convert remaining Hebrew characters to ASCII-safe alternatives
  result = result.replace(/[\u0590-\u05FF]/g, (char) => {
    return char.charCodeAt(0).toString(16);
  });
  
  // 4. Sanitize special characters
  result = result
    .replace(/[^\w\s-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return result || 'item';
};

// Usage in storage operations
const filePath = `clients/${clientId}/${sanitizePathComponent(itemType)}/product/${fileName}`;
```

### Multi-File Upload Pattern

#### 5. **Parallel Upload with Error Isolation**
```typescript
// Pattern for handling multiple file uploads with individual error handling
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    
    const sanitizedItemType = sanitizePathComponent(formData.itemType);
    const newItemId = uuidv4();
    
    // Parallel upload with individual error handling
    const uploadPromises = formData.referenceImages.map(async (file) => {
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
      const filePath = `clients/${client.client_id}/${sanitizedItemType}/product/${uniqueFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`שגיאה בהעלאת ${file.name}: ${uploadError.message}`);
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    });
    
    // Wait for all uploads to complete
    const uploadedImageUrls = await Promise.all(uploadPromises);
    
    // Create submission with uploaded URLs
    const submissionData = {
      client_id: client.client_id,
      original_item_id: newItemId,
      item_type: formData.itemType,
      item_name_at_submission: formData.itemName,
      submission_status: 'ממתינה לעיבוד' as const,
      original_image_urls: uploadedImageUrls
    };

    const { error: submissionError } = await supabase
      .from('customer_submissions')
      .insert(submissionData);

    if (submissionError) throw submissionError;

    toast.success('ההגשה נוצרה בהצלחה!');
    onSuccess?.();
    onClose();
    
  } catch (error: any) {
    toast.error(error.message || 'אירעה שגיאה בעת יצירת ההגשה');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Component Testing Patterns

#### 6. **Comprehensive Component Testing with Mocks**
```typescript
// Pattern for testing React components with external dependencies
describe('Component Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should handle optimistic updates correctly', async () => {
    // Mock setup
    const mockUpdate = vi.fn().mockResolvedValue({ data: updatedData });
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

    const wrapper = createWrapper();
    render(<ComponentUnderTest />, { wrapper });

    // User interaction
    const button = screen.getByRole('button', { name: /update/i });
    fireEvent.click(button);

    // Verify optimistic update
    await waitFor(() => {
      expect(screen.getByText('updated-value')).toBeInTheDocument();
    });

    // Verify API call
    expect(mockUpdate).toHaveBeenCalledWith(expectedParams);
  });
});
```

## Architecture Overview 

## Testing Architecture Patterns

### ✅ Comprehensive Component Testing Strategy (January 2025)

#### **Test ID Strategy Pattern - PROVEN SUCCESS**
**Achievement**: 100% test success rate for WireframeTest component using systematic test ID implementation.

**Test ID Naming Convention:**
```typescript
// Pattern: {feature}-{action} or {feature}-{type}-{index}
'stats-section', 'stats-in-progress', 'stats-waiting', 'stats-completed'
'costs-section', 'costs-toggle', 'gpt4-control', 'gpt4-quantity'
'submissions-sidebar', 'submission-item-{index}', 'submission-name-{index}'
'main-content', 'main-title', 'background-toggle'
'images-section', 'original-images', 'processed-images'
'notes-section', 'notes-tab-{type}', 'notes-content-{type}'
'submission-details-section', 'submission-details-toggle'
```

**Element Selection Best Practices:**
```typescript
// ❌ AVOID: Ambiguous text-based selectors
expect(screen.getByText('0')).toBeInTheDocument(); // Multiple "0" elements

// ✅ USE: Specific test ID selectors
expect(screen.getByTestId('stats-in-progress')).toHaveTextContent('0');

// ✅ USE: Indexed selectors for dynamic content
expect(screen.getByTestId('submission-item-0')).toBeInTheDocument();
```

#### **Async Test Handling Pattern**
**Critical Pattern**: Always use `waitFor()` for dynamic content and state changes.

```typescript
// ✅ CORRECT: Async handling for dynamic content
await waitFor(() => {
  expect(screen.getByTestId('submission-details-content')).toBeInTheDocument();
});

// ✅ CORRECT: State change testing
await waitFor(() => {
  expect(screen.getByTestId('costs-section')).toHaveClass('expanded');
});
```

#### **Mock Strategy for Complex Components**
**Proven Pattern**: Comprehensive UI component mocking with proper data structures.

```typescript
// Mock complex UI components inline within vi.mock()
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <h3 data-testid="card-title">{children}</h3>
  )
}));

// Mock data structures matching actual component expectations
const mockSubmissions = [
  {
    id: '1',
    item_name_at_submission: 'חמבורגר טרופי',
    submission_status: 'in_progress',
    original_image_urls: ['url1.jpg', 'url2.jpg'],
    processed_image_urls: ['processed1.jpg']
  }
];
```

#### **Hebrew Language Testing Pattern**
**Critical Considerations**: RTL and Hebrew text require specific testing approaches.

```typescript
// ✅ Test Hebrew content with proper expectations
expect(screen.getByTestId('submission-name-0')).toHaveTextContent('חמבורגר טרופי');

// ✅ Test RTL layout considerations
expect(screen.getByTestId('notes-section')).toHaveAttribute('dir', 'rtl');

// ✅ Test Hebrew form inputs
const textarea = screen.getByTestId('notes-textarea-general');
fireEvent.change(textarea, { target: { value: 'הערות כלליות' } });
expect(textarea).toHaveValue('הערות כלליות');
```

#### **Test Categories Organization**
**Systematic Approach**: Organize tests by functionality categories for comprehensive coverage.

```typescript
describe('WireframeTest Component', () => {
  // 1. Component Rendering (6 tests)
  describe('Component Rendering', () => {
    it('renders header stats section', () => { /* test */ });
    it('renders costs section', () => { /* test */ });
    it('renders submissions sidebar', () => { /* test */ });
  });

  // 2. State Management (4 tests)
  describe('State Management', () => {
    it('toggles costs section visibility', () => { /* test */ });
    it('toggles background images', () => { /* test */ });
  });

  // 3. Image Navigation (4 tests)
  describe('Image Navigation', () => {
    it('navigates between original images', () => { /* test */ });
    it('handles navigation bounds', () => { /* test */ });
  });

  // 4. Edge Cases (2 tests)
  describe('Edge Cases', () => {
    it('handles empty submissions', () => { /* test */ });
    it('handles invalid data', () => { /* test */ });
  });
});
```

#### **Error Handling Testing Pattern**
**Comprehensive Coverage**: Test all error scenarios and edge cases systematically.

```typescript
// ✅ Test undefined/null data handling
it('handles undefined submissions gracefully', () => {
  render(<WireframeTest />, {
    wrapper: ({ children }) => (
      <QueryClient>
        <MockProvider submissions={undefined}>
          {children}
        </MockProvider>
      </QueryClient>
    )
  });
  
  expect(screen.getByTestId('submissions-sidebar')).toBeInTheDocument();
  expect(screen.getByText('אין הגשות זמינות')).toBeInTheDocument();
});

// ✅ Test error state recovery
it('recovers from error states', async () => {
  // Test error scenario and recovery
});
```

#### **Performance Testing Considerations**
**Efficiency Metrics**: Ensure tests execute efficiently for CI/CD pipelines.

```typescript
// ✅ Efficient test execution patterns
- Test execution under 2 seconds per component
- Proper cleanup with afterEach hooks
- Minimal DOM manipulation
- Efficient mock strategies

// ✅ Memory management
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### ✅ Component Architecture Patterns

// ... existing code ... 