
import { HomeIcon, Users, Package, FileText, Settings, LogIn, Upload, UserPlus, Calendar, ClipboardList, Eye, BarChart3, AlertTriangle, UserCog, Database } from "lucide-react";
import CustomerDashboardPage from "./pages/customer/CustomerDashboardPage";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import PublicUploadPage from "./pages/PublicUploadPage";
import FoodVisionForm from "./pages/FoodVisionForm";
import SmartUploadPage from "./pages/SmartUploadPage";

// Admin imports
import Dashboard from "./pages/admin/Dashboard";
import ClientsList from "./pages/admin/ClientsList";
import PackagesManagementPage from "./pages/admin/PackagesManagementPage";
import LeadsManagement from "./pages/admin/LeadsManagement";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "./pages/admin/SubmissionsQueuePage";
import SubmissionDetailsPage from "./pages/admin/SubmissionDetailsPage";
import SubmissionsAnalytics from "./pages/admin/SubmissionsAnalytics";
import AlertsDashboard from "./pages/admin/AlertsDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import DataConsolidationPage from "./pages/admin/DataConsolidationPage";

// Editor imports
import EditorDashboardPage from "./pages/editor/EditorDashboardPage";
import SubmissionProcessingPage from "./pages/editor/SubmissionProcessingPage";

// Customer imports
import CustomerHomePage from "./pages/customer/CustomerHomePage";
import IndexPage from "./pages/IndexPage";

export const navItems = [
  {
    title: "דף הבית",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <IndexPage />,
  },
  {
    title: "התחברות לקוחות",
    to: "/customer-login",
    icon: <LogIn className="h-4 w-4" />,
    page: <CustomerLogin />,
  },
  {
    title: "התחברות אדמין",
    to: "/admin-login",
    icon: <LogIn className="h-4 w-4" />,
    page: <AdminLogin />,
  },
  {
    title: "העלאה ציבורית",
    to: "/public-upload",
    icon: <Upload className="h-4 w-4" />,
    page: <PublicUploadPage />,
  },
  {
    title: "טופס Food Vision",
    to: "/food-vision-form",
    icon: <FileText className="h-4 w-4" />,
    page: <FoodVisionForm />,
  },
  {
    title: "העלאה חכמה",
    to: "/smart-upload",
    icon: <Upload className="h-4 w-4" />,
    page: <SmartUploadPage />,
  },

  // Customer routes
  {
    title: "דאשבורד לקוח",
    to: "/customer/dashboard",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <CustomerDashboardPage />,
  },
  {
    title: "בית לקוח",
    to: "/customer/home",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <CustomerHomePage />,
  },

  // Admin routes
  {
    title: "דאשבורד אדמין",
    to: "/admin",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Dashboard />,
  },
  {
    title: "ניהול לקוחות",
    to: "/admin/clients",
    icon: <Users className="h-4 w-4" />,
    page: <ClientsList />,
  },
  {
    title: "ניהול שירותים",
    to: "/admin/packages",
    icon: <Package className="h-4 w-4" />,
    page: <PackagesManagementPage />,
  },
  {
    title: "ניהול לידים",
    to: "/admin/leads",
    icon: <UserPlus className="h-4 w-4" />,
    page: <LeadsManagement />,
  },
  {
    title: "הגשות",
    to: "/admin/submissions",
    icon: <FileText className="h-4 w-4" />,
    page: <SubmissionsPage />,
  },
  {
    title: "תור הגשות",
    to: "/admin/submissions-queue",
    icon: <ClipboardList className="h-4 w-4" />,
    page: <SubmissionsQueuePage />,
  },
  {
    title: "פרטי הגשה",
    to: "/admin/submissions/:submissionId",
    icon: <Eye className="h-4 w-4" />,
    page: <SubmissionDetailsPage />,
  },
  {
    title: "ניתוח הגשות",
    to: "/admin/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <SubmissionsAnalytics />,
  },
  {
    title: "התראות",
    to: "/admin/alerts",
    icon: <AlertTriangle className="h-4 w-4" />,
    page: <AlertsDashboard />,
  },
  {
    title: "ניהול משתמשים",
    to: "/admin/users",
    icon: <UserCog className="h-4 w-4" />,
    page: <UserManagementPage />,
  },
  {
    title: "איחוד נתונים",
    to: "/admin/data-consolidation",
    icon: <Database className="h-4 w-4" />,
    page: <DataConsolidationPage />,
  },

  // Editor routes
  {
    title: "דאשבורד עורך",
    to: "/editor",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <EditorDashboardPage />,
  },
  {
    title: "עיבוד הגשה",
    to: "/editor/submission/:submissionId",
    icon: <FileText className="h-4 w-4" />,
    page: <SubmissionProcessingPage />,
  },
];
