
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
import EmptyState from "@/components/EmptyState";

const LeadsManagement: React.FC = () => {
  const { leads, loading, addLead, updateLead, deleteLead, updateLeadStatus } = useLeads();
  
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

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentLead(undefined);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      if (currentLead) {
        await updateLead(currentLead.id, data);
      } else {
        await addLead(data);
      }
      
      setIsFormOpen(false);
      setCurrentLead(undefined);
    } catch (error) {
      console.error("Form submission error:", error);
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

      {leads.length === 0 && !loading ? (
        <EmptyState
          title="אין לידים"
          description="טרם נוצרו לידים במערכת. צור ליד חדש כדי להתחיל."
          action={
            <Button onClick={handleCreateLead}>
              <Plus className="mr-2 h-4 w-4" /> צור ליד חדש
            </Button>
          }
        />
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onEdit={handleEditLead}
          onDelete={deleteLead}
          onStatusChange={updateLeadStatus}
          isLoading={loading}
        />
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
