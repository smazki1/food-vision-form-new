
import { HomeIcon, Users, Package, FileText, Settings, LogIn, Upload, UserPlus, Calendar, ClipboardList, Eye } from "lucide-react";
import Index from "./pages/Index";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import PublicUploadPage from "./pages/PublicUploadPage";
import FoodVisionForm from "./pages/FoodVisionForm";
import SmartUploadPage from "./pages/SmartUploadPage";

// Admin imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsManagement from "./pages/admin/ClientsManagement";
import ServicesManagement from "./pages/admin/ServicesManagement";
import LeadsManagement from "./pages/admin/LeadsManagement";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import SubmissionsQueuePage from "./pages/admin/SubmissionsQueuePage";
import SubmissionDetailsPage from "./pages/admin/SubmissionDetailsPage";

// Editor imports
import EditorDashboard from "./pages/editor/EditorDashboard";
import SubmissionProcessingPage from "./pages/editor/SubmissionProcessingPage";

// Customer imports
import CustomerHomePage from "./pages/customer/CustomerHomePage";

export const navItems = [
  {
    title: "דף הבית",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
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
    page: <CustomerDashboard />,
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
    page: <AdminDashboard />,
  },
  {
    title: "ניהול לקוחות",
    to: "/admin/clients",
    icon: <Users className="h-4 w-4" />,
    page: <ClientsManagement />,
  },
  {
    title: "ניהול שירותים",
    to: "/admin/services",
    icon: <Package className="h-4 w-4" />,
    page: <ServicesManagement />,
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

  // Editor routes
  {
    title: "דאשבורד עורך",
    to: "/editor",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <EditorDashboard />,
  },
  {
    title: "עיבוד הגשה",
    to: "/editor/submission/:submissionId",
    icon: <FileText className="h-4 w-4" />,
    page: <SubmissionProcessingPage />,
  },
];
