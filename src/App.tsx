import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import LeadsPage from './pages/admin/LeadsPage';
import PackagesPage from './pages/admin/PackagesPage';
import SettingsPage from './pages/admin/SettingsPage';
import LoginPage from './pages/LoginPage';
import FoodVision from './pages/FoodVision';
import EditorLayout from './layouts/EditorLayout';
import SubmissionPage from './pages/editor/SubmissionPage';
import ClientManagementPage from './pages/admin/ClientManagementPage';
import EditorLoginPage from './pages/EditorLoginPage';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { DebugPanel } from '@/components/ui/debug-panel';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import EditorDashboard from './pages/editor/EditorDashboard';

function App() {
  return (
    <EnhancedErrorBoundary context="Main Application">
      <div className="min-h-screen bg-background font-sans antialiased" dir="rtl">
        <Router>
          <UnifiedAuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/editor/login" element={<EditorLoginPage />} />
              <Route path="/food-vision" element={<FoodVision />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AnalyticsDashboard />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="packages" element={<PackagesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="clients" element={<ClientManagementPage />} />
              </Route>

              {/* Editor Routes */}
              <Route path="/editor" element={<EditorLayout />}>
                <Route index element={<EditorDashboard />} />
                <Route path="submission/:submissionId" element={<SubmissionPage />} />
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
