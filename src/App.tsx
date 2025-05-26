
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from './contexts/UnifiedAuthContext';
import AdminLayout from './layouts/AdminLayout';
import LeadsManagement from './pages/admin/LeadsManagement';
import PackagesManagementPage from './pages/admin/PackagesManagementPage';
import SettingsPage from './pages/admin/SettingsPage';
import CustomerLogin from './pages/customer/CustomerLogin';
import FoodVisionForm from './pages/FoodVisionForm';
import EditorLayout from './layouts/EditorLayout';
import SubmissionProcessingPage from './pages/editor/SubmissionProcessingPage';
import ClientsList from './pages/admin/ClientsList';
import CustomerLogin as EditorLoginPage from './pages/customer/CustomerLogin';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { DebugPanel } from '@/components/ui/debug-panel';
import Dashboard from './pages/admin/Dashboard';
import EditorDashboardPage from './pages/editor/EditorDashboardPage';

function App() {
  return (
    <EnhancedErrorBoundary context="Main Application">
      <div className="min-h-screen bg-background font-sans antialiased" dir="rtl">
        <Router>
          <UnifiedAuthProvider>
            <Routes>
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/editor/login" element={<EditorLoginPage />} />
              <Route path="/food-vision" element={<FoodVisionForm />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<LeadsManagement />} />
                <Route path="packages" element={<PackagesManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="clients" element={<ClientsList />} />
              </Route>

              {/* Editor Routes */}
              <Route path="/editor" element={<EditorLayout />}>
                <Route index element={<EditorDashboardPage />} />
                <Route path="submission/:submissionId" element={<SubmissionProcessingPage />} />
              </Route>
            </Routes>
          </UnifiedAuthProvider>
        </Router>
        <Toaster />
        <DebugPanel />
      </div>
    </EnhancedErrorBoundary>
  );
}

export default App;
