
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UnifiedAuthProvider } from "@/providers/UnifiedAuthProvider";
import { CurrentUserRoleProvider } from "@/hooks/useCurrentUserRole";
import { Suspense, lazy } from "react";

// Lazy load components
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const PublicOnlyRoute = lazy(() => import("./components/PublicOnlyRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const CustomerLayout = lazy(() => 
  import("./layouts/CustomerLayout").then(module => ({ default: module.CustomerLayout }))
);

// Lazy load pages - Use the customer-specific login page
const CustomerLogin = lazy(() => import("./pages/customer/CustomerLogin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicUploadPage = lazy(() => import("./pages/PublicUploadPage"));

// Customer pages - verify all existing components are properly imported
const CustomerHomePage = lazy(() => import("./pages/customer/CustomerHomePage"));
const CustomerDashboardPage = lazy(() => import("./pages/customer/CustomerDashboardPage"));
const FoodVisionUploadFormPage = lazy(() => import("./pages/customer/FoodVisionUploadFormPage"));
const CustomerSubmissionsStatusPage = lazy(() => import("./pages/customer/CustomerSubmissionsStatusPage"));
const CustomerProfilePage = lazy(() => import("./pages/customer/CustomerProfilePage"));
const CustomerGalleryPage = lazy(() => import("./pages/customer/CustomerGalleryPage"));
const CustomerSubmissionsPage = lazy(() => import("./pages/customer/CustomerSubmissionsPage"));
const CustomerPackageDetailsPage = lazy(() => import("./pages/customer/CustomerPackageDetailsPage"));

// Add the submission details page for individual submission viewing - FIXED: Import from pages directory
const SubmissionDetailsPage = lazy(() => import("./pages/customer/SubmissionDetailsPage"));

// Admin pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ClientsList = lazy(() => import("./pages/admin/ClientsList"));
const ClientDetails = lazy(() => import("./pages/admin/ClientDetails"));
const LeadsManagementPage = lazy(() => import("./pages/admin/LeadsManagement"));
const PackagesManagementPage = lazy(() => import("./pages/admin/PackagesManagementPage"));
const SubmissionsPage = lazy(() => import("./pages/admin/SubmissionsPage"));
const SubmissionsQueuePage = lazy(() => import("./pages/admin/SubmissionsQueuePage"));
const SubmissionsAnalyticsPage = lazy(() => import("./pages/admin/SubmissionsAnalytics"));
const AlertsDashboardPage = lazy(() => import("./pages/admin/AlertsDashboard"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedAuthProvider>
        <CurrentUserRoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/public-upload" element={<PublicUploadPage />} />
                  
                  <Route
                    path="/customer-login"
                    element={
                      <PublicOnlyRoute>
                        <CustomerLogin />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/admin-login"
                    element={
                      <PublicOnlyRoute>
                        <AdminLogin />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Customer Protected Routes - All integrated with CustomerLayout */}
                  <Route
                    path="/customer"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/customer/dashboard" replace />} />
                    <Route path="dashboard" element={<CustomerDashboardPage />} />
                    <Route path="home" element={<CustomerHomePage />} />
                    <Route path="upload" element={<FoodVisionUploadFormPage />} />
                    <Route path="submissions-status" element={<CustomerSubmissionsStatusPage />} />
                    <Route path="submissions" element={<CustomerSubmissionsPage />} />
                    <Route path="submissions/:submissionId" element={<SubmissionDetailsPage />} />
                    <Route path="profile" element={<CustomerProfilePage />} />
                    <Route path="gallery" element={<CustomerGalleryPage />} />
                    <Route path="package-details" element={<CustomerPackageDetailsPage />} />
                  </Route>
                  
                  {/* Redirect legacy customer paths */}
                  <Route path="/" element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="/customer-dashboard" element={<Navigate to="/customer/dashboard" replace />} />
                  <Route path="/upload" element={<Navigate to="/customer/upload" replace />} />

                  {/* Admin Protected Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<ClientsList />} />
                    <Route path="clients/:clientId" element={<ClientDetails />} />
                    <Route path="leads" element={<LeadsManagementPage />} />
                    <Route path="packages" element={<PackagesManagementPage />} />
                    <Route path="submissions" element={<SubmissionsPage />} />
                    <Route path="submissions-queue" element={<SubmissionsQueuePage />} />
                    <Route path="analytics" element={<SubmissionsAnalyticsPage />} />
                    <Route path="alerts" element={<AlertsDashboardPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                  </Route>

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CurrentUserRoleProvider>
      </UnifiedAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
