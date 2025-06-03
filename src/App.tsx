import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { navItems } from "./nav-items";
import "./App.css";
import { UnifiedAuthProvider } from "./providers/UnifiedAuthProvider";
import { ClientAuthProvider } from "@/providers/ClientAuthProvider";
import AdminRoute from "@/components/AdminRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import { CurrentUserRoleProvider } from "@/hooks/useCurrentUserRole";
import AdminLayout from "@/layouts/AdminLayout";
import Index from "@/pages/Index";
import CustomerLogin from "@/pages/CustomerLogin";
import AdminLogin from "@/pages/AdminLogin";
import PublicUploadPage from "@/pages/PublicUploadPage";
import FoodVisionForm from "@/pages/FoodVisionForm";
import SmartUploadPage from "@/pages/SmartUploadPage";
import CustomerDashboardPage from "@/pages/customer/CustomerDashboardPage";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import EditorDashboardPage from "@/pages/editor/EditorDashboardPage";
import SubmissionProcessingPage from "@/pages/editor/SubmissionProcessingPage";
import Dashboard from "@/pages/admin/Dashboard";
import ClientsList from "@/pages/admin/ClientsList";
import ClientDetails from "@/pages/admin/ClientDetails";
import PackagesManagementPage from "@/pages/admin/PackagesManagementPage";
import AdminLeadsPage from "@/pages/admin/leads";
import SubmissionsPage from "@/pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "@/pages/admin/SubmissionsQueuePage";
import SubmissionDetailsPage from "@/pages/admin/SubmissionDetailsPage";
import LeadsTestPage from "@/pages/admin/LeadsTestPage";
import AlertsDashboard from "@/pages/admin/AlertsDashboard";
import React from "react";

const queryClient = new QueryClient();

// Emergency recovery component for app crashes
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8">
    <h1 className="text-2xl font-bold text-red-600 mb-4">משהו השתבש</h1>
    <p className="text-gray-600 mb-4">אירעה שגיאה בלתי צפויה במערכת</p>
    <div className="bg-gray-100 p-4 rounded-lg mb-4 max-w-lg">
      <pre className="text-sm text-red-600 whitespace-pre-wrap">{error.message}</pre>
    </div>
    <div className="flex gap-4">
      <button 
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        נסה שוב
      </button>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        רענן עמוד
      </button>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.href = '/admin-login';
        }}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        איפוס מלא
      </button>
    </div>
    <p className="text-sm text-gray-500 mt-4">
      אם הבעיה נמשכת, נסה "איפוס מלא" שינקה את כל הנתונים השמורים
    </p>
  </div>
);

// Simple error boundary
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Customer route wrapper
const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ClientAuthProvider>
    {children}
  </ClientAuthProvider>
);

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <UnifiedAuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes - no client auth needed */}
              <Route path="/" element={<Index />} />
              <Route path="/admin-login" element={<PublicOnlyRoute><AdminLogin /></PublicOnlyRoute>} />
              <Route path="/public-upload" element={<PublicUploadPage />} />
              <Route path="/food-vision-form" element={<FoodVisionForm />} />
              <Route path="/smart-upload" element={<SmartUploadPage />} />

              {/* Customer routes - wrapped with ClientAuthProvider */}
              <Route path="/customer-login" element={<PublicOnlyRoute><CustomerLogin /></PublicOnlyRoute>} />
              <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboardPage /></CustomerRoute>} />
              <Route path="/customer/home" element={<CustomerRoute><CustomerHomePage /></CustomerRoute>} />

              {/* Editor routes - no client auth needed */}
              <Route path="/editor" element={<EditorDashboardPage />} />
              <Route path="/editor/submission/:submissionId" element={<SubmissionProcessingPage />} />

              {/* Admin routes - no client auth needed */}
              <Route path="/admin/*" element={
                <CurrentUserRoleProvider>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </CurrentUserRoleProvider>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="clients" element={<ClientsList />} />
                <Route path="clients/:clientId" element={<ClientDetails />} />
                <Route path="packages" element={<PackagesManagementPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="submissions-queue" element={<SubmissionsQueuePage />} />
                <Route path="submissions/:submissionId" element={<SubmissionDetailsPage />} />
                <Route path="alerts" element={<AlertsDashboard />} />
                <Route path="leads-test-page" element={<LeadsTestPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UnifiedAuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
