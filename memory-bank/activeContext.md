# Food Vision AI - Active Context

## Current Status

### White Screen and Auth Timeout Fix (2024-12-19) - ✅ COMPLETED
**בעיה שזוהתה:** המערכת נתקעת במסך לבן לאחר זמן ארוך ויש בעיות timeout שגורמות להחזרה למסך loading. הבעיה מתרחשת בכל הדפים, לא רק בעמוד ספציפי.

**גורמים שזוהו:**
1. **נתיב שגוי ב-PublicOnlyRoute**: ההפניה הייתה ל-`/customer-dashboard` במקום `/customer/dashboard`
2. **טיפול לקוי ב-role=null**: כשהמשתמש מאומת אבל ה-role הוא null, המערכת לא ידעה איך לטפל בזה
3. **Timeout של שנייה אחת**: ב-useClientAuthSync היה timeout קצר מדי שגרם ללולאות
4. **חוסר מנגנון recovery**: לא היה פתרון לmצבים של תקיעות

**פתרונות שיושמו:**
1. **תיקון נתיבי ההפניה**: תוקנו כל הנתיבים השגויים ב-PublicOnlyRoute
2. **טיפול ב-role null/undefined**: הוספת לוגיקה מיוחדת למקרים שהrole לא נקבע עדיין
3. **הגדלת timeout ל-5 שניות**: הפחתת הלחץ על המערכת בuseClientAuthSync
4. **מנגנון forced completion**: מניעת לולאות אינסופיות ב-useClientAuthSync
5. **emergency recovery**: הוספת מנגנון התאוששות ב-useUnifiedAuthState שכולל:
   - הפעלת timeout ל-15 שניות במקום 20
   - זיהוי חזרה לכרטיסייה (visibility change detection)
   - רענון אוטומטי של העמוד במקרי קיצון
6. **Error boundary**: הוספת מנגנון תפיסת שגיאות ב-App.tsx עם אפשרות recovery ידנית

**תוצאות צפויות:**
- מסך לבן לא אמור להתרחש יותר
- רענון העמוד יחזיר את המערכת לתפקוד
- טיפול טוב יותר במעברים בין כרטיסיות
- פחות timeouts והודעות שגיאה

**סטטוס פריסה:** ✅ נפרס לפרודקשן ומוכן לבדיקה

### Token Refresh Loop Fix (2024-12-19) - ✅ COMPLETED
**בעיה שזוהתה:** כשמשתמש במערכת האדמין עובר לכרטיסייה אחרת או עובר זמן וחוזר, המערכת מציגה מסך "Verifying admin access..." ונכנסת למצב loading מחדש.

**גורם השורש:** 
- כש-Supabase מרענן את ה-JWT token אוטומטית (`TOKEN_REFRESHED` event), המערכת מאבדת את כל ה-cache ומתחילה שוב את כל תהליך האימות
- ה-cache מתנקה ומעמיס מחדש את ההרשאות, מה שגורם למסך loading

**פתרונות שיושמו:**
1. **תיקון useCurrentUserRole** - הוספת טיפול מיוחד ב-`TOKEN_REFRESHED` events שמעדכן רק את userId ללא איפוס מלא של המצב
2. **שיפור optimizedAuthService** - הגדלת TTL של cache ל-30 דקות (במקום 10) והוספת פונקציה `refreshAuthDataSilently`
3. **תיקון useAuthInitialization** - הוספת טיפול שקט ב-token refresh שמעדכן רק session ללא initialization מחדש

**תוצאה:** Token refresh עכשיו מתבצע ברקע מבלי להציג loading screen או לאפס את מצב המשתמש.

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

### Admin Leads Page Core Issues (2024-12-19) - ✅ COMPLETED
**בעיה שזוהתה:** לחיצה על לידים בעמוד `/admin/leads` הביאה למסכים ריקים עם שגיאות 400 ובעיות בהקשר האימות.

**פתרונות שיושמו:**
1. **תיקון RLS policies** - יצירת מדיניות זמנית לכל הטבלאות הרלוונטיות
2. **תיקון נתיבי router** - הוספת נתיב חסר ל-ClientDetails
3. **תיקון בעיות נגישות** - הוספת DialogDescription בכל הקומפוננטים הרלוונטיים
4. **תיקון validation בטפסים** - תיקון Select.Item עם value ריק

*סטטוס פריסה: ✅ נפרס לפרודקשן*

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
4.  **High:** Unstable rendering/routing loop in `AdminLayout.tsx`