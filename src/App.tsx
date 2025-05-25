import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import "./App.css";
import "@/rtl.css";

// Our refined Auth Providers and ProtectedRoute
import { UnifiedAuthProvider } from "@/providers/UnifiedAuthProvider";
import { CurrentUserRoleProvider } from "@/hooks/useCurrentUserRole";
import { ClientAuthProvider } from "@/providers/ClientAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute"; 

// Layouts
import { CustomerLayout } from "@/layouts/CustomerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import EditorLayout from "@/layouts/EditorLayout";

// Public pages
import PromoLandingPage from "./pages/PromoLandingPage";
import NotFound from "./pages/NotFound";
import CustomerLogin from "./pages/customer/CustomerLogin";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/customer/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import FoodVisionForm from "./pages/FoodVisionForm";
// import AccountSetupPage from "./pages/AccountSetupPage"; // Decide if/how to integrate

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import LeadsManagement from "./pages/admin/LeadsManagement";
import { ClientsList } from "./pages/admin/ClientsList";
import ClientDetails from "./pages/admin/ClientDetails";
import PackagesManagementPage from "./pages/admin/PackagesManagementPage";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "./pages/admin/SubmissionsQueuePage";
import SubmissionsAnalytics from "./pages/admin/SubmissionsAnalytics";
import AlertsDashboard from "./pages/admin/AlertsDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";

// Customer pages
import CustomerHomePage from "./pages/customer/CustomerHomePage";
import CustomerDashboardPage from "./pages/customer/CustomerDashboardPage";
import CustomerSubmissionsPage from "./pages/customer/CustomerSubmissionsPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import CustomerGalleryPage from "./pages/customer/CustomerGalleryPage";
import SubmissionDetailsPage from "./pages/customer/SubmissionDetailsPage";
import FoodVisionUploadFormPage from "./pages/customer/FoodVisionUploadFormPage";
import CustomerSubmissionsStatusPage from "./pages/customer/CustomerSubmissionsStatusPage";
import { DishesPage } from "./pages/customer/DishesPage";
import CustomerPackageDetailsPage from "./pages/customer/CustomerPackageDetailsPage";

// Editor pages
import EditorDashboardPage from "./pages/editor/EditorDashboardPage";
import SubmissionProcessingPage from "./pages/editor/SubmissionProcessingPage";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="food-vision-theme">
        <TooltipProvider>
          <Router>
            <UnifiedAuthProvider>
              <CurrentUserRoleProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<PromoLandingPage />} />
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Food Vision Form - might need ClientAuthProvider if it interacts with client data */}
                <Route path="/food-vision-form" element={<FoodVisionForm />} /> 
                                
                {/* Customer routes - protected */}
                <Route 
                  element={
                    <ClientAuthProvider>
                      <ProtectedRoute />
                    </ClientAuthProvider>
                  }
                >
                  <Route element={<CustomerLayout />}>
                    <Route path="/customer">
                      <Route index element={<Navigate to="/customer/home" replace />} />
                      <Route path="home" element={<CustomerHomePage />} />
                      <Route path="dashboard" element={<CustomerDashboardPage />} />
                      <Route path="submissions" element={<CustomerSubmissionsPage />} />
                      <Route path="dishes" element={<DishesPage />} />
                      <Route path="submissions/:submissionId" element={<SubmissionDetailsPage />} />
                      <Route path="gallery" element={<CustomerGalleryPage />} />
                      <Route path="profile" element={<CustomerProfilePage />} />
                      <Route path="new-submission" element={<FoodVisionUploadFormPage />} />
                      <Route path="submissions-status" element={<CustomerSubmissionsStatusPage />} />
                      <Route path="package-details" element={<CustomerPackageDetailsPage />} />
                    </Route>
                  </Route>
                </Route>
                
                {/* Admin routes - TODO: Implement Admin specific protection if needed */}
                {/* For now, assuming they might also use a form of ProtectedRoute or specific admin auth logic */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="leads" element={<LeadsManagement />} />
                  <Route path="clients" element={<ClientsList />} />
                  <Route path="clients/:clientId" element={<ClientDetails />} />
                  <Route path="packages" element={<PackagesManagementPage />} />
                  <Route path="submissions" element={<SubmissionsPage />} />
                  <Route path="queue" element={<SubmissionsQueuePage />} />
                  <Route path="analytics" element={<SubmissionsAnalytics />} />
                  <Route path="alerts" element={<AlertsDashboard />} />
                  <Route path="users" element={<UserManagementPage />} />
                </Route>
                
                {/* Editor routes - TODO: Implement Editor specific protection */}
                <Route path="/editor" element={<EditorLayout />}>
                  <Route index element={<Navigate to="/editor/dashboard" replace />} />
                  <Route path="dashboard" element={<EditorDashboardPage />} />
                  <Route path="submissions/:submissionId" element={<SubmissionProcessingPage />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              </CurrentUserRoleProvider>
            </UnifiedAuthProvider>
          </Router>
          <SonnerToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
