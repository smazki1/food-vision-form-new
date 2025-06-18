import React from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardSettings } from "@/components/admin/dashboard/DashboardSettings";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { AlertsOverview } from "@/components/admin/dashboard/AlertsOverview";
import { LeadsFunnel } from "@/components/admin/dashboard/LeadsFunnel";
import { LeadSourceChart } from "@/components/admin/dashboard/LeadSourceChart";
import { ClientsOverview } from "@/components/admin/dashboard/ClientsOverview";
import { SubmissionQueue } from "@/components/admin/dashboard/SubmissionQueue";
import { EditorPerformance } from "@/components/admin/dashboard/EditorPerformance";
import { PackageUtilization } from "@/components/admin/dashboard/PackageUtilization";
import { ClientSubmissionStatsOverview } from "@/components/admin/dashboard/ClientSubmissionStatsOverview";
import { DashboardSearch } from "@/components/admin/dashboard/DashboardSearch";
import { DashboardSettings } from "@/components/admin/dashboard/DashboardSettings";
import { Users, CreditCard, LineChart, ShoppingBag, Clock } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { settings } = useDashboardSettings();
  const { upcomingReminders } = useAlerts();

  // Sort sections by their order and filter visible ones
  const visibleSections = settings.sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  // Section renderer
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "kpi":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="לידים חדשים (החודש)"
              value={stats?.newLeadsThisMonth || 0}
              icon={<Users />}
              loading={isLoading}
            />
            <KPICard
              title="יחס המרה (החודש)"
              value={stats?.conversionRateThisMonth || 0}
              format="percentage"
              icon={<LineChart />}
              loading={isLoading}
            />
            <KPICard
              title="לקוחות פעילים"
              value={stats?.totalActiveClients || 0}
              icon={<CreditCard />}
              loading={isLoading}
            />
            <KPICard
              title="מנות בעיבוד כרגע"
              value={stats?.submissionsInProgress || 0}
              icon={<ShoppingBag />}
              loading={isLoading}
            />
          </div>
        );
      case "alerts":
        return <AlertsOverview />;
      case "leadFunnel":
        return (
          <LeadsFunnel
            data={stats?.leadsByStatus || []}
            loading={isLoading}
          />
        );
      case "leadSource":
        return (
          <LeadSourceChart
            data={stats?.leadsBySource || []}
            loading={isLoading}
          />
        );
      case "clientsOverview":
        return (
          <ClientsOverview
            statusData={stats?.clientsByStatus || []}
            packageData={stats?.clientsByPackage || []}
            loading={isLoading}
          />
        );
      case "submissionQueue":
        return (
          <SubmissionQueue
            data={stats?.submissionsByStatus || []}
            totalOverdue={stats?.overdueSubmissions || 0}
            loading={isLoading}
          />
        );
      case "editorPerformance":
        return (
          <EditorPerformance
            data={stats?.editorPerformance || []}
            loading={isLoading}
          />
        );
      case "packageUtilization":
        return (
          <PackageUtilization
            data={stats?.packageUtilization || []}
            loading={isLoading}
          />
        );
      case "clientSubmissionStats":
        return (
          <ClientSubmissionStatsOverview />
        );
      default:
        return null;
    }
  };

  // Extra KPIs for the second row
  const extraKPIs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="תזכורות להיום"
        value={upcomingReminders.filter(r => {
          const reminderDate = new Date(r.reminder_at || "");
          const today = new Date();
          return (
            reminderDate.getDate() === today.getDate() &&
            reminderDate.getMonth() === today.getMonth() &&
            reminderDate.getFullYear() === today.getFullYear()
          );
        }).length}
        icon={<Clock />}
      />
      <KPICard
        title="מנות שהושלמו (השבוע)"
        value={stats?.completedSubmissionsThisWeek || 0}
        icon={<ShoppingBag />}
        loading={isLoading}
      />
      <KPICard
        title="מנות שהושלמו (החודש)"
        value={stats?.completedSubmissionsThisMonth || 0}
        icon={<ShoppingBag />}
        loading={isLoading}
      />
      <KPICard
        title="לקוחות ללא פעילות (30+ ימים)"
        value={stats?.inactiveClients || 0}
        icon={<Users />}
        loading={isLoading}
      />
    </div>
  );
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">דאשבורד</h1>
            <p className="text-muted-foreground">סקירה כללית של המערכת</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <DashboardSearch />
            <DashboardSettings />
          </div>
        </div>
        <div className="space-y-6">
          {visibleSections.map(section => (
            <div key={section.id}>
              {renderSection(section.id)}
            </div>
          ))}
          {/* Add extra KPIs in a secondary row if main KPI section is hidden */}
          {!visibleSections.some(s => s.id === "kpi") && extraKPIs}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
