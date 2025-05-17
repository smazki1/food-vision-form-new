
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./App.css";
import "@/rtl.css";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import EditorLayout from "@/layouts/EditorLayout";
import { AuthProvider } from "@/hooks/useCustomerAuth";
import { ClientAuthProvider } from "@/providers/ClientAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Import all pages
import PromoLandingPage from "./pages/PromoLandingPage";
import FoodVisionForm from "./pages/FoodVisionForm";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import CustomerLogin from "./pages/customer/CustomerLogin";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/customer/ResetPassword";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import LeadsManagement from "./pages/admin/LeadsManagement";
import ClientsList from "./pages/admin/ClientsList";
import ClientDetails from "./pages/admin/ClientDetails";
import PackagesManagementPage from "./pages/admin/PackagesManagementPage";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "./pages/admin/SubmissionsQueuePage";
import SubmissionsAnalytics from "./pages/admin/SubmissionsAnalytics";
import AlertsDashboard from "./pages/admin/AlertsDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";

// Customer pages
import CustomerDashboardPage from "./pages/customer/CustomerDashboardPage";
import CustomerSubmissionsPage from "./pages/customer/CustomerSubmissionsPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import CustomerGalleryPage from "./pages/customer/CustomerGalleryPage";
import SubmissionDetailsPage from "./pages/customer/SubmissionDetailsPage";

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
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<PromoLandingPage />} />
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                
                {/* Food Vision Form - accessible with or without ClientAuthProvider */}
                <Route path="/food-vision-form" element={
                  <ClientAuthProvider>
                    <FoodVisionForm />
                  </ClientAuthProvider>
                } />
                
                {/* Customer routes - protected, requiring authentication */}
                <Route element={<ProtectedRoute />}>
                  {/* All protected customer routes need ClientAuthProvider */}
                  <Route element={<ClientAuthProvider>
                    <CustomerLayout />
                  </ClientAuthProvider>}>
                    <Route path="/customer">
                      <Route index element={<Navigate to="/customer/dashboard" replace />} />
                      <Route path="dashboard" element={<CustomerDashboardPage />} />
                      <Route path="submissions" element={<CustomerSubmissionsPage />} />
                      <Route path="submissions/:submissionId" element={<SubmissionDetailsPage />} />
                      <Route path="gallery" element={<CustomerGalleryPage />} />
                      <Route path="profile" element={<CustomerProfilePage />} />
                    </Route>
                  </Route>
                </Route>
                
                {/* Admin routes */}
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
                
                {/* Editor routes */}
                <Route path="/editor" element={<EditorLayout />}>
                  <Route index element={<Navigate to="/editor/dashboard" replace />} />
                  <Route path="dashboard" element={<EditorDashboardPage />} />
                  <Route path="submissions/:submissionId" element={<SubmissionProcessingPage />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
