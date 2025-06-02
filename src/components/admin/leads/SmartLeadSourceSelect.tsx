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

interface SmartLeadSourceSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Predefined lead sources
const DEFAULT_LEAD_SOURCES = [
  'אתר',
  'הפניה',
  'פייסבוק',
  'אינסטגרם',
  'גוגל',
  'לינקדאין',
  'טלמרקטינג',
  'פה לאוזן',
  'מודעה',
  'הליכת רחוב',
  'תערוכה',
  'אירוע',
  'אחר',
];

export const SmartLeadSourceSelect: React.FC<SmartLeadSourceSelectProps> = ({
  value,
  onValueChange,
  placeholder = "בחר מקור ליד",
  disabled = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSource, setNewSource] = useState('');
  const queryClient = useQueryClient();

  console.log('SmartLeadSourceSelect rendered with value:', value, 'disabled:', disabled);

  // Fetch all unique lead sources from the database
  const { data: existingSources = [] } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      console.log('Fetching lead sources from database...');
      const { data, error } = await supabase
        .from('leads')
        .select('lead_source')
        .not('lead_source', 'is', null);

      if (error) {
        console.error('Error fetching lead sources:', error);
        throw error;
      }

      // Get unique lead sources and combine with defaults, filter out empty strings
      const uniqueSources = Array.from(
        new Set([
          ...DEFAULT_LEAD_SOURCES,
          ...data.map(item => item.lead_source).filter(source => source && source.trim() !== '')
        ])
      ).sort();

      console.log('Fetched lead sources:', uniqueSources);
      return uniqueSources;
    },
  });

  // Check if current value exists in the list, if not add it
  useEffect(() => {
    console.log('useEffect check - value:', value, 'existingSources:', existingSources);
    if (value && !existingSources.includes(value)) {
      console.log('Current value not in list, adding:', value);
      queryClient.setQueryData(['lead-sources'], (old: string[] = []) => {
        return Array.from(new Set([...old, value])).sort();
      });
    }
  }, [value, existingSources, queryClient]);

  // Log the final state before render
  console.log('About to render - existingSources:', existingSources, 'value:', value, 'value exists:', existingSources.includes(value || ''));

  // Mutation to save new lead source (we don't need to save it separately, 
  // it will be saved when the lead is updated)
  const handleCreateNew = () => {
    if (!newSource.trim()) {
      toast.error('אנא הזן שם מקור ליד');
      return;
    }

    const trimmedSource = newSource.trim();
    
    // Check if source already exists
    if (existingSources.includes(trimmedSource)) {
      toast.error('מקור ליד זה כבר קיים');
      return;
    }

    // Update the value and add to cache
    onValueChange(trimmedSource);
    
    // Add to the cached list
    queryClient.setQueryData(['lead-sources'], (old: string[] = []) => {
      return Array.from(new Set([...old, trimmedSource])).sort();
    });

    setNewSource('');
    setIsCreating(false);
    toast.success('מקור ליד חדש נוצר');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewSource('');
    }
  };

  if (isCreating) {
    return (
      <div className="flex gap-2">
        <Input
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="הזן מקור ליד חדש"
          onKeyDown={handleKeyPress}
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleCreateNew}
          disabled={!newSource.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setNewSource('');
          }}
        >
          ביטול
        </Button>
      </div>
    );
  }

  return (
    <Select 
      value={value} 
      onValueChange={(selectedValue) => {
        console.log('SmartLeadSourceSelect onValueChange called with:', selectedValue);
        onValueChange(selectedValue);
      }} 
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {existingSources.map((source) => (
          <SelectItem key={source} value={source}>
            {source}
          </SelectItem>
        ))}
        <div className="border-t mt-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-right"
            onClick={() => {
              console.log('Add new lead source button clicked');
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף מקור ליד חדש
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
}; 