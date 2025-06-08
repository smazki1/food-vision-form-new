# Food Vision AI - System Patterns

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