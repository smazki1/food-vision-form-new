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