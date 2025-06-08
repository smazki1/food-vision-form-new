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
import React, { Suspense } from "react";

// Import debug script for testing comments
import "@/test-comments-debug";

// Lazy load heavy admin components to reduce initial bundle size
const Dashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const ClientsList = React.lazy(() => import("@/pages/admin/ClientsList"));
const ClientDetails = React.lazy(() => import("@/pages/admin/ClientDetails"));
const PackagesManagementPage = React.lazy(() => import("@/pages/admin/PackagesManagementPage"));
const AdminLeadsPage = React.lazy(() => import("@/pages/admin/leads"));
const SubmissionsPage = React.lazy(() => import("@/pages/admin/SubmissionsPage"));
const SubmissionsQueuePage = React.lazy(() => import("@/pages/admin/SubmissionsQueuePage"));
const SubmissionDetailsPage = React.lazy(() => import("@/pages/admin/SubmissionDetailsPage"));
const LeadsTestPage = React.lazy(() => import("@/pages/admin/LeadsTestPage"));
const AlertsDashboard = React.lazy(() => import("@/pages/admin/AlertsDashboard"));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
                <Route index element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
                <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
                <Route path="clients" element={<Suspense fallback={<LoadingSpinner />}><ClientsList /></Suspense>} />
                <Route path="clients/:clientId" element={<Suspense fallback={<LoadingSpinner />}><ClientDetails /></Suspense>} />
                <Route path="packages" element={<Suspense fallback={<LoadingSpinner />}><PackagesManagementPage /></Suspense>} />
                <Route path="leads" element={<Suspense fallback={<LoadingSpinner />}><AdminLeadsPage /></Suspense>} />
                <Route path="submissions" element={<Suspense fallback={<LoadingSpinner />}><SubmissionsPage /></Suspense>} />
                <Route path="submissions-queue" element={<Suspense fallback={<LoadingSpinner />}><SubmissionsQueuePage /></Suspense>} />
                <Route path="submissions/:submissionId" element={<Suspense fallback={<LoadingSpinner />}><SubmissionDetailsPage /></Suspense>} />
                <Route path="alerts" element={<Suspense fallback={<LoadingSpinner />}><AlertsDashboard /></Suspense>} />
                <Route path="leads-test-page" element={<Suspense fallback={<LoadingSpinner />}><LeadsTestPage /></Suspense>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UnifiedAuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
