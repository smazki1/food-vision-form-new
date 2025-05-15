
import React, { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadStatus, LEAD_STATUS_OPTIONS, LEAD_SOURCE_OPTIONS, LeadSource } from "@/types/lead";
import LeadsTable from "@/components/admin/leads/LeadsTable";
import LeadForm from "@/components/admin/leads/LeadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const LeadsManagement: React.FC = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "all">("all");
  const [leadSource, setLeadSource] = useState<LeadSource | "all">("all");
  const [dateFilter, setDateFilter] = useState<"today" | "this-week" | "this-month" | "all">("all");
  const [onlyReminders, setOnlyReminders] = useState(false);
  const [remindersToday, setRemindersToday] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Lead form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  // Get leads with filters
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads({
    searchTerm,
    leadStatus,
    leadSource,
    dateFilter,
    onlyReminders,
    remindersToday
  });
  
  const handleCreateLead = () => {
    setCurrentLead(undefined);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setCurrentLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      // Toast is handled in the mutation
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleConvertToClient = (lead: Lead) => {
    // This is a placeholder for future implementation (Section 1.2.2)
    toast.info("המרת ליד ללקוח תיושם בהמשך");
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentLead(undefined);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      if (currentLead) {
        await updateLead(currentLead.id, data);
        // Toast is handled in the mutation
      } else {
        await addLead(data);
        // Toast is handled in the mutation
      }
      
      setIsFormOpen(false);
      setCurrentLead(undefined);
    } catch (error) {
      console.error("Form submission error:", error);
      // Toast is handled in the mutation
    } finally {
      setFormLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setLeadStatus("all");
    setLeadSource("all");
    setDateFilter("all");
    setOnlyReminders(false);
    setRemindersToday(false);
  };

  // Count active filters
  const activeFiltersCount = [
    leadStatus !== "all", 
    leadSource !== "all", 
    dateFilter !== "all", 
    onlyReminders, 
    remindersToday
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">ניהול לידים</h1>
        <Button onClick={handleCreateLead}>
          <Plus className="mr-2 h-4 w-4" /> ליד חדש
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם מסעדה, איש קשר, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover open={filtersVisible} onOpenChange={setFiltersVisible}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>סינון</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-base">אפשרויות סינון</h3>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-xs" 
                    onClick={clearAllFilters}
                  >
                    <X className="h-3 w-3" /> נקה הכל
                  </Button>
                )}
              </div>
              
              {/* Lead Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">סטטוס ליד</label>
                <Select
                  value={leadStatus}
                  onValueChange={(val) => setLeadStatus(val as LeadStatus | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל הסטטוסים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    {LEAD_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Lead Source Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">מקור ליד</label>
                <Select
                  value={leadSource}
                  onValueChange={(val) => setLeadSource(val as LeadSource | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל המקורות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המקורות</SelectItem>
                    {LEAD_SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Creation Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">תאריך יצירה</label>
                <Select
                  value={dateFilter}
                  onValueChange={(val) => setDateFilter(val as "today" | "this-week" | "this-month" | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל התאריכים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התאריכים</SelectItem>
                    <SelectItem value="today">היום</SelectItem>
                    <SelectItem value="this-week">השבוע</SelectItem>
                    <SelectItem value="this-month">החודש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Reminder Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">תזכורות</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="only-reminders" 
                      checked={onlyReminders} 
                      onCheckedChange={(val) => setOnlyReminders(Boolean(val))} 
                    />
                    <label 
                      htmlFor="only-reminders" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                    >
                      הצג רק לידים עם תזכורות
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reminders-today" 
                      checked={remindersToday} 
                      onCheckedChange={(val) => setRemindersToday(Boolean(val))} 
                    />
                    <label 
                      htmlFor="reminders-today" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                    >
                      הצג רק לידים עם תזכורות להיום
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">סינון לפי:</span>
          {leadStatus !== "all" && (
            <Badge variant="outline" className="flex gap-1 items-center">
              סטטוס: {leadStatus}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setLeadStatus("all")} 
              />
            </Badge>
          )}
          {leadSource !== "all" && (
            <Badge variant="outline" className="flex gap-1 items-center">
              מקור: {leadSource}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setLeadSource("all")} 
              />
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="outline" className="flex gap-1 items-center">
              תאריך: {
                dateFilter === "today" ? "היום" : 
                dateFilter === "this-week" ? "השבוע" : 
                "החודש"
              }
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setDateFilter("all")} 
              />
            </Badge>
          )}
          {onlyReminders && (
            <Badge variant="outline" className="flex gap-1 items-center">
              עם תזכורות
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setOnlyReminders(false)} 
              />
            </Badge>
          )}
          {remindersToday && (
            <Badge variant="outline" className="flex gap-1 items-center">
              תזכורות להיום
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setRemindersToday(false)} 
              />
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs" 
            onClick={clearAllFilters}
          >
            נקה הכל
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>לידים</CardTitle>
            <CardDescription>
              רשימת כל הלידים במערכת {searchTerm || activeFiltersCount > 0 ? `(${leads.length} תוצאות)` : `(${leads.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable
              leads={leads}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              onConvertToClient={handleConvertToClient}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      )}

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {currentLead ? "עריכת ליד" : "יצירת ליד חדש"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <LeadForm
              lead={currentLead}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
              isLoading={formLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadsManagement;
