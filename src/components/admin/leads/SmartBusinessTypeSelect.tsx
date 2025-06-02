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

interface SmartBusinessTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Predefined business types
const DEFAULT_BUSINESS_TYPES = [
  'מסעדה',
  'בית קפה',
  'מאפייה',
  'קייטרינג',
  'פיצרייה',
  'בר',
  'מזון רחוב',
  'בית חולים',
  'בית ספר',
  'משרד',
];

export const SmartBusinessTypeSelect: React.FC<SmartBusinessTypeSelectProps> = ({
  value,
  onValueChange,
  placeholder = "בחר סוג עסק",
  disabled = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState('');
  const queryClient = useQueryClient();

  console.log('SmartBusinessTypeSelect rendered with value:', value, 'disabled:', disabled);

  // Fetch all unique business types from the database
  const { data: existingTypes = [] } = useQuery({
    queryKey: ['business-types'],
    queryFn: async () => {
      console.log('Fetching business types from database...');
      const { data, error } = await supabase
        .from('leads')
        .select('business_type')
        .not('business_type', 'is', null)
        .not('business_type', 'eq', '');

      if (error) {
        console.error('Error fetching business types:', error);
        throw error;
      }

      // Get unique business types and combine with defaults
      const uniqueTypes = Array.from(
        new Set([
          ...DEFAULT_BUSINESS_TYPES,
          ...data.map(item => item.business_type).filter(Boolean)
        ])
      ).sort();

      console.log('Fetched business types:', uniqueTypes);
      return uniqueTypes;
    },
  });

  // Check if current value exists in the list, if not add it
  useEffect(() => {
    console.log('useEffect check - value:', value, 'existingTypes:', existingTypes);
    if (value && !existingTypes.includes(value)) {
      console.log('Current value not in list, adding:', value);
      queryClient.setQueryData(['business-types'], (old: string[] = []) => {
        return Array.from(new Set([...old, value])).sort();
      });
    }
  }, [value, existingTypes, queryClient]);

  // Log the final state before render
  console.log('About to render - existingTypes:', existingTypes, 'value:', value, 'value exists:', existingTypes.includes(value || ''));

  // Mutation to save new business type (we don't need to save it separately, 
  // it will be saved when the lead is updated)
  const handleCreateNew = () => {
    if (!newType.trim()) {
      toast.error('אנא הזן שם סוג עסק');
      return;
    }

    const trimmedType = newType.trim();
    
    // Check if type already exists
    if (existingTypes.includes(trimmedType)) {
      toast.error('סוג עסק זה כבר קיים');
      return;
    }

    // Update the value and add to cache
    onValueChange(trimmedType);
    
    // Add to the cached list
    queryClient.setQueryData(['business-types'], (old: string[] = []) => {
      return Array.from(new Set([...old, trimmedType])).sort();
    });

    setNewType('');
    setIsCreating(false);
    toast.success('סוג עסק חדש נוצר');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewType('');
    }
  };

  if (isCreating) {
    return (
      <div className="flex gap-2">
        <Input
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="הזן סוג עסק חדש"
          onKeyDown={handleKeyPress}
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleCreateNew}
          disabled={!newType.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsCreating(false);
            setNewType('');
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
        console.log('SmartBusinessTypeSelect onValueChange called with:', selectedValue);
        onValueChange(selectedValue);
      }} 
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {existingTypes.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
        <div className="border-t mt-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-right"
            onClick={() => {
              console.log('Add new business type button clicked');
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף סוג עסק חדש
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
}; 