
import { HomeIcon, Users, Package, FileText, Settings, LogIn, Upload, UserPlus, Calendar, ClipboardList, Eye, BarChart, Bell, User, FileSpreadsheet } from "lucide-react";
import CustomerDashboardPage from "./pages/customer/CustomerDashboardPage";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import PublicUploadPage from "./pages/PublicUploadPage";
import FoodVisionForm from "./pages/FoodVisionForm";
import SmartUploadPage from "./pages/SmartUploadPage";
import IndexPage from "./pages/IndexPage";
import NotFound from "./pages/NotFound";
import AccountSetupPage from "./pages/AccountSetupPage";

// Admin imports
import Dashboard from "./pages/admin/Dashboard";
import ClientsList from "./pages/admin/ClientsList";
import PackagesManagementPage from "./pages/admin/PackagesManagementPage";
import LeadsManagement from "./pages/admin/LeadsManagement";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "./pages/admin/SubmissionsQueuePage";
import SubmissionDetailsPage from "./pages/admin/SubmissionDetailsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ClientDetails from "./pages/admin/ClientDetails";
import DataConsolidationPage from "./pages/admin/DataConsolidationPage";
import SubmissionsAnalytics from "./pages/admin/SubmissionsAnalytics";
import AlertsDashboard from "./pages/admin/AlertsDashboard";

// Editor imports
import EditorDashboardPage from "./pages/editor/EditorDashboardPage";
import SubmissionProcessingPage from "./pages/editor/SubmissionProcessingPage";

// Customer imports
import CustomerHomePage from "./pages/customer/CustomerHomePage";
import CustomerGalleryPage from "./pages/customer/CustomerGalleryPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import CustomerSubmissionsPage from "./pages/customer/CustomerSubmissionsPage";
import NewClientUploadPage from "./pages/customer/NewClientUploadPage";
import FoodVisionUploadFormPage from "./pages/customer/FoodVisionUploadFormPage";
import CustomerSubmissionsStatusPage from "./pages/customer/CustomerSubmissionsStatusPage";
import DishesPage from "./pages/customer/DishesPage";
import ResetPassword from "./pages/customer/ResetPassword";
import CustomerPackageDetailsPage from "./pages/customer/CustomerPackageDetailsPage";
import DashboardPage from "./pages/customer/DashboardPage";
import ForgotPassword from "./pages/customer/ForgotPassword";
import CustomerSubmissionDetailsPage from "./pages/customer/SubmissionDetailsPage";
import CustomerLoginPage from "./pages/customer/CustomerLogin";

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
  {
    title: "הגדרת חשבון",
    to: "/account-setup",
    icon: <Settings className="h-4 w-4" />,
    page: <AccountSetupPage />,
  },
  {
    title: "עמוד לא נמצא",
    to: "/not-found",
    icon: <FileText className="h-4 w-4" />,
    page: <NotFound />,
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
  {
    title: "גלריה",
    to: "/customer/gallery",
    icon: <FileText className="h-4 w-4" />,
    page: <CustomerGalleryPage />,
  },
  {
    title: "פרופיל לקוח",
    to: "/customer/profile",
    icon: <User className="h-4 w-4" />,
    page: <CustomerProfilePage />,
  },
  {
    title: "הגשות לקוח",
    to: "/customer/submissions",
    icon: <FileText className="h-4 w-4" />,
    page: <CustomerSubmissionsPage />,
  },
  {
    title: "העלאה חדשה לקוח",
    to: "/customer/new-upload",
    icon: <Upload className="h-4 w-4" />,
    page: <NewClientUploadPage />,
  },
  {
    title: "טופס העלאה Food Vision",
    to: "/customer/food-vision-upload",
    icon: <FileText className="h-4 w-4" />,
    page: <FoodVisionUploadFormPage />,
  },
  {
    title: "סטטוס הגשות לקוח",
    to: "/customer/submissions-status",
    icon: <ClipboardList className="h-4 w-4" />,
    page: <CustomerSubmissionsStatusPage />,
  },
  {
    title: "מנות",
    to: "/customer/dishes",
    icon: <Package className="h-4 w-4" />,
    page: <DishesPage />,
  },
  {
    title: "איפוס סיסמה",
    to: "/customer/reset-password",
    icon: <Settings className="h-4 w-4" />,
    page: <ResetPassword />,
  },
  {
    title: "פרטי חבילה",
    to: "/customer/package-details",
    icon: <Package className="h-4 w-4" />,
    page: <CustomerPackageDetailsPage />,
  },
  {
    title: "דאשבורד",
    to: "/customer/dashboard-page",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <DashboardPage />,
  },
  {
    title: "שכחתי סיסמה",
    to: "/customer/forgot-password",
    icon: <Settings className="h-4 w-4" />,
    page: <ForgotPassword />,
  },
  {
    title: "פרטי הגשה לקוח",
    to: "/customer/submission/:submissionId",
    icon: <Eye className="h-4 w-4" />,
    page: <CustomerSubmissionDetailsPage />,
  },
  {
    title: "התחברות לקוח",
    to: "/customer/login",
    icon: <LogIn className="h-4 w-4" />,
    page: <CustomerLoginPage />,
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
    to: "/admin/services",
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
    title: "ניהול משתמשים",
    to: "/admin/users",
    icon: <User className="h-4 w-4" />,
    page: <UserManagementPage />,
  },
  {
    title: "פרטי לקוח",
    to: "/admin/clients/:clientId",
    icon: <Users className="h-4 w-4" />,
    page: <ClientDetails />,
  },
  {
    title: "איחוד נתונים",
    to: "/admin/data-consolidation",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    page: <DataConsolidationPage />,
  },
  {
    title: "אנליטיקס הגשות",
    to: "/admin/submissions-analytics",
    icon: <BarChart className="h-4 w-4" />,
    page: <SubmissionsAnalytics />,
  },
  {
    title: "דאשבורד התראות",
    to: "/admin/alerts",
    icon: <Bell className="h-4 w-4" />,
    page: <AlertsDashboard />,
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
