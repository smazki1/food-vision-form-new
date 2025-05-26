
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";

export function DashboardSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    clients: { id: string; name: string }[];
    leads: { id: string; name: string }[];
    submissions: { id: string; name: string; client_name: string }[];
  }>({
    clients: [],
    leads: [],
    submissions: [],
  });
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setResults({ clients: [], leads: [], submissions: [] });
        return;
      }

      setLoading(true);

      try {
        const [clientsResults, leadsResults, submissionsResults] = await Promise.all([
          // Search clients
          supabase
            .from("clients")
            .select("client_id, restaurant_name")
            .or(`restaurant_name.ilike.%${debouncedSearchQuery}%,contact_name.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`)
            .limit(5),

          // Search leads
          supabase
            .from("leads")
            .select("id, restaurant_name")
            .or(`restaurant_name.ilike.%${debouncedSearchQuery}%,contact_name.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`)
            .limit(5),

          // Search submissions
          supabase
            .from("customer_submissions")
            .select(`
              submission_id, 
              item_name_at_submission, 
              clients!inner (restaurant_name)
            `)
            .ilike("item_name_at_submission", `%${debouncedSearchQuery}%`)
            .limit(5),
        ]);

        setResults({
          clients: (clientsResults.data || []).map((client) => ({
            id: client.client_id,
            name: client.restaurant_name,
          })),
          leads: (leadsResults.data || []).map((lead) => ({
            id: lead.id,
            name: lead.restaurant_name,
          })),
          submissions: (submissionsResults.data || []).map((submission) => ({
            id: submission.submission_id,
            name: submission.item_name_at_submission,
            client_name: submission.clients?.restaurant_name || "",
          })),
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setSearchQuery("");
    
    switch (type) {
      case "client":
        navigate(`/admin/clients/${id}`);
        break;
      case "lead":
        navigate(`/admin/leads?highlight=${id}`);
        break;
      case "submission":
        navigate(`/admin/submissions?id=${id}`);
        break;
      default:
        break;
    }
  };

  const hasResults = 
    results.clients.length > 0 ||
    results.leads.length > 0 || 
    results.submissions.length > 0;

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder='חיפוש... (Ctrl+K)'
          className="pl-8 w-full"
          onClick={() => setOpen(true)}
          ref={inputRef}
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="חיפוש לקוחות, לידים, הגשות..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm">
              <span className="text-muted-foreground">מחפש...</span>
            </div>
          )}
          
          {!loading && !hasResults && searchQuery.length > 0 && (
            <CommandEmpty>לא נמצאו תוצאות ל-"{searchQuery}"</CommandEmpty>
          )}

          {!loading && results.clients.length > 0 && (
            <CommandGroup heading="לקוחות">
              {results.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => handleSelect("client", client.id)}
                >
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.leads.length > 0 && (
            <CommandGroup heading="לידים">
              {results.leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  onSelect={() => handleSelect("lead", lead.id)}
                >
                  {lead.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.submissions.length > 0 && (
            <CommandGroup heading="הגשות">
              {results.submissions.map((submission) => (
                <CommandItem
                  key={submission.id}
                  onSelect={() => handleSelect("submission", submission.id)}
                >
                  {submission.name} ({submission.client_name})
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
