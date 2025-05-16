
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';
import './rtl.css';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import EditorLayout from './layouts/EditorLayout';
import { CustomerLayout } from './layouts/CustomerLayout';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import LeadsManagement from './pages/admin/LeadsManagement';
import PackagesManagementPage from './pages/admin/PackagesManagementPage';
import ClientsList from './pages/admin/ClientsList';
import ClientDetails from './pages/admin/ClientDetails';
import AdminLogin from './pages/AdminLogin';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import AlertsDashboard from './pages/admin/AlertsDashboard';
import SubmissionsAnalytics from './pages/admin/SubmissionsAnalytics';
import UserManagementPage from './pages/admin/UserManagementPage';

// Editor Pages
import EditorDashboardPage from './pages/editor/EditorDashboardPage';
import SubmissionProcessingPage from './pages/editor/SubmissionProcessingPage';

// Customer Pages
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerSubmissionsPage from './pages/customer/CustomerSubmissionsPage';
import SubmissionDetailsPage from './pages/customer/SubmissionDetailsPage';

// Public Pages
import FoodVisionForm from './pages/FoodVisionForm';
import NotFound from './pages/NotFound';
import PromoLandingPage from './pages/PromoLandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<LeadsManagement />} />
          <Route path="packages" element={<PackagesManagementPage />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/:clientId" element={<ClientDetails />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="alerts" element={<AlertsDashboard />} />
          <Route path="analytics" element={<SubmissionsAnalytics />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>

        {/* Editor Routes */}
        <Route path="/editor" element={<EditorLayout />}>
          <Route index element={<EditorDashboardPage />} />
          <Route path="dashboard" element={<EditorDashboardPage />} />
          <Route path="submissions/:submissionId" element={<SubmissionProcessingPage />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboardPage />} />
          <Route path="dashboard" element={<CustomerDashboardPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="submissions" element={<CustomerSubmissionsPage />} />
          <Route path="submissions/:submissionId" element={<SubmissionDetailsPage />} />
        </Route>

        {/* Public Routes */}
        <Route path="/food-vision-form" element={<FoodVisionForm />} />
        <Route path="/" element={<PromoLandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
