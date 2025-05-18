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
   - Stored procedures for complex operations
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

2. **Hook Testing**
   - Custom hook testing
   - Mocked API responses
   - State management testing 