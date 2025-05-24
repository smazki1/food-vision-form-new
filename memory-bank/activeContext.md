# Food Vision AI - Active Context

## Current Status

### Primary Focus: Admin Client Management Page
With the authentication and authorization systems now stable, the primary focus shifts to developing the "Clients" page within the Admin Dashboard. This page is currently non-functional or "stuck" and needs to be implemented to allow admins to manage client data effectively.

### Recent Achievements
1.  **Resolved Login Loop & "Access Denied" Errors:**
    *   Successfully diagnosed and fixed the "Access Denied: Insufficient privileges" error that caused a login loop for admin users.
    *   The root cause was identified as missing `EXECUTE` permission on the `public.get_my_role()` RPC function for the `authenticated` role.
    *   The `get_my_role()` function was reviewed and confirmed to be `SECURITY DEFINER`.
    *   A migration file (`supabase/migrations/20240723100000_setup_get_my_role_function.sql`) was created to ensure the function definition and its `EXECUTE` grant are versioned.
2.  **Improved UI Error Handling for Auth:**
    *   Enhanced toast notification management in `src/hooks/useCurrentUserRole.ts` to prevent persistent error messages after the underlying issue is resolved. Specific toast IDs are now used for better control.
3.  **Stabilized Admin Layout Rendering:**
    *   Refactored `src/layouts/AdminLayout.tsx` to simplify auth state management and prevent rendering/routing loops during role determination. The layout now relies more directly on `useCurrentUserRole` status.
4.  **Previous Fixes (Maintained):**
    *   Radix UI Select Fix (`CustomerGallery.tsx`).
    *   Invalid Hook Call (`FoodVisionForm.tsx`).
    *   `isSubmitDisabled` Fix (`FormNavigation.tsx`).
    *   Form Submission Conflict (`additional_details` fixed with `upsert`).

## Active Development Areas

### 1. Admin Clients Page Implementation
**Priority: Critical**
*   **Diagnose "Stuck" Page:** Investigate why the current admin clients page is not loading or functioning correctly. Check for console errors, failed network requests, or issues in component logic.
*   **Define Core Functionality:**
    *   Display a list/table of all clients from `public.clients`.
    *   Implement search and filtering capabilities.
    *   Allow viewing detailed information for a specific client.
    *   Enable creation of new client records.
    *   Enable editing of existing client records.
    *   Manage client status (e.g., active, suspended).
    *   Assign/manage service packages for clients.
*   **Data Synchronization:** Ensure client data displayed and managed is consistent with all relevant tables (e.g., `service_packages`, `customer_submissions`).
*   **RLS & API Permissions:** Verify that RLS policies on `public.clients` and related tables allow admins all necessary CRUD operations. Ensure any new RPC functions for client management have correct permissions.

### 2. RLS Policy Review (Ongoing Maintenance)
**Priority: Medium**
*   Continue to review and verify RLS policies across the application as new features are added, ensuring data security and correct access patterns for different user roles.

### 3. Minor UI/UX & Accessibility Warnings (Backlog)
**Priority: Low**
*   Address Radix UI accessibility warnings (`DialogContent` missing `DialogTitle`/`DialogDescription`).
*   Investigate and fix React `sonner` toast warning (`Cannot update a component (ForwardRef) while rendering a different component (ForwardRef)`), if still present after recent toast management changes.

## Technical Context

### Current Implementation Focus
*   Admin area: `src/pages/admin/clients/*` (or similar path for the clients page).
*   Data source: `public.clients` table primarily.
*   Relevant hooks: `useCurrentUserRole.ts` (for admin auth context), potentially new hooks for client data fetching and mutations (e.g., `useAdminClients`).

### Active Components & Hooks
*   `src/layouts/AdminLayout.tsx` (provides the main admin interface shell).
*   The yet-to-be-fully-implemented Admin Clients Page component(s).
*   Supabase RLS policies for `public.clients` and any related tables.

## Next Actions

### Immediate Tasks
1.  **Locate and Analyze Admin Clients Page Code:** Identify the main file(s) for the admin clients page.
2.  **Debug Loading/Functional Issues:** Check browser console, network tab, and component logic to understand why the page is "stuck".
3.  **Plan Client Page Features:** Based on findings and requirements, outline the specific sub-tasks for implementing the client management functionalities.

### Upcoming Tasks
1.  Implement client listing, viewing, creation, and editing features.
2.  Address any remaining UI warnings or minor bugs once major functionalities are stable.
3.  Continuously document new components, hooks, and system patterns.

## Known Issues

### Active Issues
1.  **High:** Admin Clients Page is not functional ("stuck").
2.  **Low (Pending Verification):** Radix UI accessibility warnings.
3.  **Low (Pending Verification):** React `sonner` setState warning.

### Resolved Issues
1.  **Critical:** Login loop & "Access Denied: Insufficient privileges" error for admin users.
2.  **High:** Unstable rendering/routing loop in `AdminLayout.tsx` during auth state changes.
3.  **Medium:** Persistent error toasts after auth issues were resolved.
4.  `Select.Item` value error in `CustomerGallery.tsx`.
5.  "Invalid hook call" in `FoodVisionForm.tsx`.
6.  `isSubmitDisabled` being `null` in `FormNavigation.tsx`.
7.  `409 Conflict` on `additional_details` table (fixed with `upsert`).
8.  Initial `VITE_SUPABASE_URL` identification.
9.  Previous customer submissions display issue.
10. Potential TypeScript type inference issue with `supabase.rpc('get_my_role')` (implicitly resolved by ensuring correct arguments and successful calls). 