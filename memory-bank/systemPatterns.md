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
   └── remaining_servings

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

## Architecture Overview 