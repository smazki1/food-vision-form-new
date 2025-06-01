# Food Vision AI - Active Context

## Current Status

### הגשות - תיקון מלא של בעיית ההצגה במערכת האדמין (2024-07-24)
**✅ הושלם בהצלחה:**
- **בעיה מקורית:** 31 הגשות לא הוצגו במערכת האדמין (מתוך 111 הגשות)
- **גורם השורש:** הגשות לא מקושרות לשום ליד או לקוח, ו-useAllSubmissions לא כלל צירוף לטבלת leads
- **פתרונות שיושמו:**
  1. **עדכון useAllSubmissions.ts** - הוספת צירוף לטבלת leads (בנוסף ללקוחות)
  2. **עדכון SubmissionsTable.tsx** - הצגה נכונה של הגשות מקושרות ללידים ולקוחות
  3. **עדכון Submission type** - הוספת שדות leads, submission_contact_* ו-created_lead_id
  4. **Migration לתיקון הגשות אנונימיות** - יצירת לידים אוטומטית ל-31 הגשות לא מקושרות
- **תוצאה:** כל 111 ההגשות כעת מוצגות בממשק האדמין (78 מקושרות ללקוחות, 33 ללידים)
- **הגשות עתידיות:** ה-RPC public_submit_item_by_restaurant_name כבר מתוקן ויוצר לידים אוטומטית

### Make.com Webhook Integration (2024-07-24)
- הושלמה אינטגרציה מלאה של webhook ל-Make.com בכל שלושת מסלולי ההגשה (unified, public, legacy):
  - כל נתוני הטופס, טיימסטמפ, סטטוס התחברות, וזיהוי מקור נשלחים ל-webhook.
  - נכתבו בדיקות יחידה ואינטגרציה מקיפות (עברו בהצלחה), כולל תיעוד בעברית.
  - כל הבדיקות עברו, אין שגיאות פעילות.
- השלב הבא: העלאה ל-git ו-deploy.

### Public Upload Form - Restaurant Details (PREVIOUS)
- פותח טופס פרטי מסעדה/עסק לציבור עם לוגיקת הצגה מותנית:
  - שאלה בראש "האם אתה בעל המסעדה/עסק?" (כן/לא)
  - אם כן: הצגת שדות פרטי המסעדה הקיימים
  - אם לא: הצגת שדות פשוטים למגיש (שם, טלפון, אימייל)
- אינטגרציה עם ניהול לידים: יצירת ליד חדש או שיוך לקיים
- בדיקה ואימות של זרימת הנתונים מהטופס הציבורי

### Main Page Redirect to Customer Login (PREVIOUS)
- בוצעה הפניה אוטומטית מהעמוד הראשי (`/`) לעמוד התחברות לקוח (`/customer-login`).
- ההפניה מתבצעת בקומפוננטת Index.tsx באמצעות useEffect ו-useNavigate מ-react-router-dom.
- כל משתמש שמגיע ל-root של האתר מנותב מיידית לעמוד ההתחברות, ללא תנאים נוספים.
- המטרה: להבטיח שכל משתמש חדש או לא מזוהה יתחיל את הזרימה מעמוד ההתחברות ללקוח.

### Primary Focus: Admin Client Management Page
With the authentication and authorization systems now stable, the primary focus shifts to developing the "Clients" page within the Admin Dashboard. This page is currently non-functional or "stuck" and needs to be implemented to allow admins to manage client data effectively.

### Recent Achievements
1.  **Successfully Resolved Public Form Submission and Lead Creation Issues:**
    *   Fixed `phone_number` vs. `phone` discrepancies in the `public_submit_item_by_restaurant_name` RPC and related migrations.
    *   Corrected RPC function signature mismatches (7-parameter vs. 10-parameter versions) that were causing 'function not found' (PGRST202) errors when the frontend called the RPC with an unexpected number of parameters.
    *   Resolved database error 'column "status" of relation "leads" does not exist' by updating the RPC to use the correct column name `lead_status`.
    *   Fixed database error 'invalid input value for enum lead_status_type' (PostgreSQL error 22P02) by ensuring the RPC uses correct Hebrew ENUM values (e.g., 'ליד חדש' for `lead_status`, 'אתר' for `lead_source`) for default lead properties during insertion.
    *   Ensured successful application of all database migrations after iteratively resolving multiple errors in older migration files (e.g., `20240530000000_advanced_leads_management.sql` regarding column name issues, and `20240731000002_update_public_submit_item_rpc.sql` regarding `CREATE POLICY IF NOT EXISTS` syntax). This included addressing issues with missing functions like `get_my_role()` by prepending its definition or commenting out redundant creations.
    *   The public form submission is now stable and correctly creating leads in the database.

2.  **Resolved Login Loop & "Access Denied" Errors:**
    *   Successfully diagnosed and fixed the "Access Denied: Insufficient privileges" error that caused a login loop for admin users.
    *   The root cause was identified as missing `EXECUTE` permission on the `public.get_my_role()` RPC function for the `authenticated` role.
    *   The `get_my_role()` function was reviewed and confirmed to be `SECURITY DEFINER`.
    *   A migration file (`supabase/migrations/20240723100000_setup_get_my_role_function.sql`) was created to ensure the function definition and its `EXECUTE` grant are versioned.
    *   Enhanced toast notification management in `src/hooks/useCurrentUserRole.ts` to prevent persistent error messages after the underlying issue is resolved. Specific toast IDs are now used for better control.
    *   Refactored `src/layouts/AdminLayout.tsx` to simplify auth state management and prevent rendering/routing loops during role determination. The layout now relies more directly on `useCurrentUserRole` status.
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
1.  **Confirm Next Priority:** With public form submissions stable, confirm the next development focus (e.g., Admin Clients Page implementation, or other pending tasks).
2.  **Locate and Analyze Admin Clients Page Code (If still priority):** Identify the main file(s) for the admin clients page.
3.  **Debug Loading/Functional Issues on Admin Clients Page (If still priority):** Check browser console, network tab, and component logic to understand why the page might be "stuck".
4.  **Plan Client Page Features (If still priority):** Based on findings and requirements, outline the specific sub-tasks for implementing the client management functionalities.

### Upcoming Tasks
1.  Implement client listing, viewing, creation, and editing features (if Admin Clients Page is next).
2.  Address any remaining UI warnings or minor bugs once major functionalities are stable.
3.  Continuously document new components, hooks, and system patterns.

## Known Issues

### Active Issues
1.  **High (Pending Confirmation):** Admin Clients Page is not functional ("stuck") - *This was the previous priority, needs re-confirmation.*
2.  **Low (Pending Verification):** Radix UI accessibility warnings.
3.  **Low (Pending Verification):** React `sonner` setState warning.

### Resolved Issues
1.  **Critical:** Public form submission errors (PGRST202 function not found, column `phone_number`/`status` does not exist, invalid ENUM input for `lead_status_type`).
2.  **Critical:** Multiple sequential database migration failures due to issues in `20240530000000_advanced_leads_management.sql` and other migration files (e.g., `CREATE POLICY IF NOT EXISTS` syntax, missing functions like `get_my_role`).
3.  **Critical:** Login loop & "Access Denied: Insufficient privileges" error for admin users.
4.  **High:** Unstable rendering/routing loop in `AdminLayout.tsx` during auth state changes.
5.  Persistent error toasts after auth issues were resolved.
6.  `Select.Item` value error in `CustomerGallery.tsx`.
7.  "Invalid hook call" in `FoodVisionForm.tsx`.
8.  `isSubmitDisabled` being `null` in `FormNavigation.tsx`.
9.  `409 Conflict` on `additional_details` table (fixed with `upsert`).
10. Initial `VITE_SUPABASE_URL` identification.
11. Previous customer submissions display issue.
12. Potential TypeScript type inference issue with `supabase.rpc('get_my_role')` (implicitly resolved by ensuring correct arguments and successful calls).

## עדכון 2024-07-23
- ✔️ בעיית עמוד "חבילות" נפתרה (אי-התאמה בין route ל-nav, הנתיב תוקן ל-/admin/packages).
- כל עמודי האדמין המרכזיים עובדים ונטענים כראוי.

## Next Steps
1. **בדיקה ידנית של המערכת** - לוודא שכל ההגשות מוצגות נכון במערכת האדמין
2. **ממשק אדמין משופר** - אפשרות לסנן ולמיין הגשות לפי סוג קישור (לקוח/ליד/אנונימי)
3. **תיעוד והדרכה** - עדכון תיעוד המערכת והכשרת צוות האדמין 

# Active Context - Current Work Focus

## Current Task: Admin Interface Stability & Bug Fixes

### Status: SIGNIFICANTLY IMPROVED ✅

**What was accomplished:**
1. **Fixed Admin Leads Page Issues (Phase 1)** - Resolved critical 400 errors and UI warnings
2. **Extended RLS Fixes (Phase 2)** - Added temporary policies for customer_submissions and clients tables
3. **Improved Accessibility** - Fixed multiple Dialog components missing required descriptions
4. **All Changes Deployed** - Both phases committed to git and deployed to production

**Current State:**
- Admin interface should now be significantly more stable
- All major Dialog accessibility warnings resolved
- Temporary RLS policies in place for authenticated users on key admin tables
- All changes deployed to production and accessible

### Remaining Admin Interface Tasks:

1. **User Testing Required** - Need to verify that:
   - Admin leads page now loads without errors
   - Client details page works correctly
   - Submissions queue page functions properly
   - All Dialog components display without accessibility warnings

2. **Authentication System Review** - The temporary RLS policies need to be replaced with proper admin role checking:
   - `is_admin()`, `is_editor()`, `is_account_manager()` functions exist but may need context improvements
   - User roles table has correct admin user record
   - Need to ensure proper JWT context for role checking

3. **Final Admin Interface Polishing** - Once testing confirms basic functionality:
   - Review and fix any remaining UI/UX issues
   - Optimize performance where needed
   - Add any missing admin features requested by user

### Next Immediate Decision Point:
**User should test the admin interface now** to verify fixes are working, then either:
- Report any remaining issues for immediate fixing
- Move to next phase of admin feature requests
- Begin authentication system improvements

### Technical Notes:
- Temporary RLS policies are in place on: `leads`, `customer_submissions`, `clients`
- All policies allow full access to authenticated users (interim solution)
- DialogDescription added to: PackageFormDialog, LightboxDialog, ImagePreviewDialog, EditDishDialog
- Build and deployment successful 