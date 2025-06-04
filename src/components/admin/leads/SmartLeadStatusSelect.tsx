import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartLeadStatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Predefined lead statuses
const DEFAULT_LEAD_STATUSES = [
  'ליד חדש',
  'פנייה ראשונית בוצעה',
  'בטיפול',
  'מעוניין',
  'לא מעוניין',
  'הפך ללקוח',
  'ארכיון',
  'להתעדכן'
];

export const SmartLeadStatusSelect: React.FC<SmartLeadStatusSelectProps> = ({
  value,
  onValueChange,
  placeholder = "בחר סטטוס",
  disabled = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const queryClient = useQueryClient();

  console.log('🔴 SmartLeadStatusSelect rendered with value:', value, 'disabled:', disabled);

  // Fetch all unique lead statuses from the database
  const { data: existingStatuses = [] } = useQuery({
    queryKey: ['lead-statuses'],
    queryFn: async () => {
      console.log('🔴 Fetching lead statuses from database...');
      const { data, error } = await supabase
        .from('leads')
        .select('lead_status')
        .not('lead_status', 'is', null)
        .not('lead_status', 'eq', '');

      if (error) {
        console.error('🔴 Error fetching lead statuses:', error);
        throw error;
      }

      // Get unique lead statuses and combine with defaults
      const uniqueStatuses = Array.from(
        new Set([
          ...DEFAULT_LEAD_STATUSES,
          ...data.map(item => item.lead_status).filter(Boolean)
        ])
      ).sort();

      console.log('🔴 Fetched lead statuses:', uniqueStatuses);
      return uniqueStatuses;
    },
  });

  // Check if current value exists in the list, if not add it
  useEffect(() => {
    console.log('🔴 useEffect check - value:', value, 'existingStatuses:', existingStatuses);
    if (value && !existingStatuses.includes(value)) {
      console.log('🔴 Current value not in list, adding:', value);
      queryClient.setQueryData(['lead-statuses'], (old: string[] = []) => {
        return Array.from(new Set([...old, value])).sort();
      });
    }
  }, [value, existingStatuses, queryClient]);

  // Log the final state before render
  console.log('🔴 About to render - existingStatuses:', existingStatuses, 'value:', value, 'value exists:', existingStatuses.includes(value || ''));

  // Handle creating new status
  const handleCreateNew = () => {
    if (!newStatus.trim()) {
      toast.error('אנא הזן שם סטטוס');
      return;
    }

    const trimmedStatus = newStatus.trim();
    
    // Check if status already exists
    if (existingStatuses.includes(trimmedStatus)) {
      toast.error('סטטוס זה כבר קיים');
      return;
    }

    // Update the value and add to cache
    onValueChange(trimmedStatus);
    
    // Add to the cached list
    queryClient.setQueryData(['lead-statuses'], (old: string[] = []) => {
      return Array.from(new Set([...old, trimmedStatus])).sort();
    });

    setNewStatus('');
    setIsCreating(false);
    toast.success('סטטוס חדש נוצר');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewStatus('');
    }
  };

  if (isCreating) {
    console.log('🔴 Rendering create mode');
    return (
      <div className="flex gap-2">
        <Input
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          placeholder="הזן סטטוס חדש"
          onKeyDown={handleKeyPress}
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleCreateNew}
          disabled={!newStatus.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setNewStatus('');
          }}
        >
          ביטול
        </Button>
      </div>
    );
  }

  console.log('🔴 Rendering select mode');
  return (
    <Select 
      value={value} 
      onValueChange={(selectedValue) => {
        console.log('🔴 SmartLeadStatusSelect onValueChange called with:', selectedValue);
        onValueChange(selectedValue);
      }} 
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {existingStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
        <div className="border-t mt-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-right"
            onClick={() => {
              console.log('🔴 Add new lead status button clicked');
              alert('לחיצה על הוסף סטטוס חדש!'); // Temporary alert for debugging
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף סטטוס חדש
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
}; 