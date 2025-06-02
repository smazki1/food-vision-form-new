import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  RotateCcw,
  Clock 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedLeadsFilter } from '@/types/filters';
import { 
  LeadStatusEnum, 
  LeadSourceEnum, 
  LEAD_STATUS_DISPLAY, 
  LEAD_SOURCE_DISPLAY 
} from '@/types/lead';

interface EnhancedLeadsFiltersProps {
  filters: EnhancedLeadsFilter;
  onFilterChange: (filters: EnhancedLeadsFilter) => void;
  isArchiveView?: boolean;
}

export const EnhancedLeadsFilters: React.FC<EnhancedLeadsFiltersProps> = ({
  filters,
  onFilterChange,
  isArchiveView = false,
}) => {
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');
  
  // Handle search input submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, searchTerm: searchInput });
  };
  
  // Handle status filter change
  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filters,
      status: status === 'all' ? 'all' : status as LeadStatusEnum,
    });
  };
  
  // Handle source filter change
  const handleSourceChange = (source: string) => {
    onFilterChange({
      ...filters,
      leadSource: source === 'all' ? 'all' : source as LeadSourceEnum,
    });
  };
  
  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    onFilterChange({ ...filters, dateFilter: value as 'all' | 'today' | 'this-week' | 'this-month' });
  };
  
  // Handle reminders filter change
  const handleRemindersFilterChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      onFilterChange({ ...filters, onlyReminders: checked });
    }
  };
  
  // Handle reminders today filter change
  const handleRemindersTodayFilterChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      onFilterChange({ ...filters, remindersToday: checked });
    }
  };
  
  // Handle sort change
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    onFilterChange({ ...filters, sortBy: field, sortDirection: direction });
  };
  
  // Reset all filters to default
  const handleResetFilters = () => {
    onFilterChange({
      searchTerm: '',
      status: 'all',
      leadSource: 'all',
      dateFilter: 'all',
      onlyReminders: false,
      remindersToday: false,
      sortBy: 'created_at',
      sortDirection: 'desc',
      excludeArchived: !isArchiveView,
      onlyArchived: isArchiveView,
    });
    setSearchInput('');
  };
  
  // Check if there are any active filters
  const hasActiveFilters = () => {
    return (
      !!filters.searchTerm ||
      filters.status !== 'all' ||
      filters.leadSource !== 'all' ||
      filters.dateFilter !== 'all' ||
      filters.onlyReminders ||
      filters.remindersToday ||
      filters.sortBy !== 'created_at' ||
      filters.sortDirection !== 'desc'
    );
  };
  
  // Count active filters for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.leadSource !== 'all') count++;
    if (filters.dateFilter !== 'all') count++;
    if (filters.onlyReminders) count++;
    if (filters.remindersToday) count++;
    if (filters.sortBy !== 'created_at' || filters.sortDirection !== 'desc') count++;
    return count;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
          {/* Search input */}
          <div className="flex-1">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <Input
                placeholder="חיפוש לפי שם מסעדה, איש קשר, טלפון או אימייל"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="rounded-r-none"
              />
              <Button type="submit" className="rounded-l-none" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Status filter */}
          <div className="min-w-[160px]">
            <Select
              value={filters.status?.toString() || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.values(LeadStatusEnum)
                  .filter(status => isArchiveView ? status === LeadStatusEnum.ARCHIVED : status !== LeadStatusEnum.ARCHIVED)
                  .map((status) => (
                    <SelectItem key={status} value={status}>
                      {LEAD_STATUS_DISPLAY[status]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source filter */}
          <div className="min-w-[160px]">
            <Select
              value={filters.leadSource?.toString() || 'all'}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {Object.values(LeadSourceEnum).map((source) => (
                  <SelectItem key={source} value={source}>
                    {LEAD_SOURCE_DISPLAY[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>סינון מתקדם</span>
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2">סינון מתקדם</h3>
                
                {/* Date filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    תאריך יצירה
                  </h4>
                  <Select
                    value={filters.dateFilter || 'all'}
                    onValueChange={handleDateFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר טווח תאריכים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="today">היום</SelectItem>
                      <SelectItem value="this-week">השבוע</SelectItem>
                      <SelectItem value="this-month">החודש</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Reminders filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    תזכורות
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="only-reminders"
                        checked={filters.onlyReminders || false}
                        onCheckedChange={handleRemindersFilterChange}
                      />
                      <label 
                        htmlFor="only-reminders" 
                        className="text-sm cursor-pointer"
                      >
                        רק לידים עם תזכורת
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="reminders-today"
                        checked={filters.remindersToday || false}
                        onCheckedChange={handleRemindersTodayFilterChange}
                      />
                      <label 
                        htmlFor="reminders-today" 
                        className="text-sm cursor-pointer"
                      >
                        תזכורות להיום
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Sorting */}
                <div>
                  <h4 className="text-sm font-medium mb-2">מיון לפי</h4>
                  <Select
                    value={`${filters.sortBy || 'created_at'}-${filters.sortDirection || 'desc'}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-');
                      handleSortChange(field, direction as 'asc' | 'desc');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="מיון לפי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">תאריך יצירה (מהחדש לישן)</SelectItem>
                      <SelectItem value="created_at-asc">תאריך יצירה (מהישן לחדש)</SelectItem>
                      <SelectItem value="restaurant_name-asc">שם מסעדה (א-ת)</SelectItem>
                      <SelectItem value="restaurant_name-desc">שם מסעדה (ת-א)</SelectItem>
                      <SelectItem value="total_ai_costs-desc">עלויות AI (גבוה לנמוך)</SelectItem>
                      <SelectItem value="total_ai_costs-asc">עלויות AI (נמוך לגבוה)</SelectItem>
                      <SelectItem value="roi-desc">ROI (גבוה לנמוך)</SelectItem>
                      <SelectItem value="roi-asc">ROI (נמוך לגבוה)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset filters button - only visible if there are active filters */}
          {hasActiveFilters() && (
            <Button 
              variant="ghost" 
              onClick={handleResetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>איפוס סינון</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 