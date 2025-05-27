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

// Lazy load pages
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicUploadPage = lazy(() => import("./pages/PublicUploadPage"));

// Customer pages
const CustomerHomePage = lazy(() => import("./pages/customer/CustomerHomePage"));
const CustomerDashboardPage = lazy(() => import("./pages/customer/CustomerDashboardPage"));
const FoodVisionUploadFormPage = lazy(() => import("./pages/customer/FoodVisionUploadFormPage"));

// Admin pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ClientsList = lazy(() => import("./pages/admin/ClientsList"));
const ClientDetails = lazy(() => import("./pages/admin/ClientDetails"));

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

                  {/* Customer Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerHomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <FoodVisionUploadFormPage />
                      </ProtectedRoute>
                    }
                  />

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
