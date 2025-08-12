
import {
  Home,
  Users,
  Package,
  MessageSquare,
  Bell,
  Settings,
  User,
  FileSpreadsheet,
  BarChart,
  ClipboardList,
  UserCheck,
  CreditCard,
  Globe,
} from "lucide-react";

export const adminNavItems = [
  {
    title: "דאשבורד",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "לידים",
    href: "/admin/leads",
    icon: MessageSquare,
  },
  {
    title: "לקוחות",
    href: "/admin/clients",
    icon: Users,
  },
  {
    title: "חבילות",
    href: "/admin/packages",
    icon: Package,
  },
  {
    title: "הגשות",
    href: "/admin/submissions",
    icon: FileSpreadsheet,
  },
  {
    title: "הגשות אנונימיות",
    href: "/admin/public-submissions",
    icon: Globe,
  },
  {
    title: "שותפים",
    href: "/admin/affiliates",
    icon: UserCheck,
  },
  {
    title: "אישור תשלומים",
    href: "/admin/payment-approvals",
    icon: CreditCard,
  },
  {
    title: "תור הגשות",
    href: "/admin/queue",
    icon: ClipboardList,
  },
  {
    title: "אנליטיקס",
    href: "/admin/analytics",
    icon: BarChart,
  },
  {
    title: "התראות",
    href: "/admin/alerts",
    icon: Bell,
  },
  {
    title: "משתמשים",
    href: "/admin/users",
    icon: User,
  },
];

export default adminNavItems;
