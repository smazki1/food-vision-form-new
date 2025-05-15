
import React, { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/lead";
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
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const LeadsManagement: React.FC = () => {
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.restaurant_name.toLowerCase().includes(searchLower) ||
      lead.contact_name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.phone_number.includes(searchTerm)
    );
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
      toast.success("הליד נמחק בהצלחה");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("שגיאה במחיקת הליד");
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
        toast.success("הליד עודכן בהצלחה");
      } else {
        await addLead(data);
        toast.success("ליד חדש נוצר בהצלחה");
      }
      
      setIsFormOpen(false);
      setCurrentLead(undefined);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("שגיאה בשמירת הליד");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">ניהול לידים</h1>
        <Button onClick={handleCreateLead}>
          <Plus className="mr-2 h-4 w-4" /> ליד חדש
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם מסעדה, איש קשר, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
              רשימת כל הלידים במערכת ({leads.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable
              leads={filteredLeads}
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
