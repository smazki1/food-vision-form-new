import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  EnhancedLeadsFilter, 
} from '@/types/filters';
import { 
  LeadStatusEnum, 
  LeadSourceEnum,
  LEAD_STATUS_DISPLAY,
  LEAD_SOURCE_DISPLAY 
} from '@/types/lead';
import { Search, Filter, X, Calendar, Bell } from 'lucide-react';

interface EnhancedLeadsFiltersProps {
  filters: EnhancedLeadsFilter;
  onFilterChange: (filters: EnhancedLeadsFilter) => void;
  isArchiveView?: boolean;
}

export const EnhancedLeadsFilters: React.FC<EnhancedLeadsFiltersProps> = ({
  filters,
  onFilterChange,
  isArchiveView = false
}) => {
  const updateFilter = (key: keyof EnhancedLeadsFilter, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
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
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-semibold">סינון לידים</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            נקה סינונים
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Term */}
          <div className="space-y-2">
            <Label htmlFor="search">חיפוש חופשי</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="שם מסעדה, איש קשר, טלפון או אימייל"
                value={filters.searchTerm || ''}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          {!isArchiveView && (
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => updateFilter('status', value === 'all' ? 'all' : value as LeadStatusEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {Object.entries(LEAD_STATUS_DISPLAY).map(([key, display]) => (
                    <SelectItem key={key} value={key}>
                      {display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Source Filter */}
          <div className="space-y-2">
            <Label>מקור</Label>
            <Select
              value={filters.leadSource || 'all'}
              onValueChange={(value) => updateFilter('leadSource', value === 'all' ? 'all' : value as LeadSourceEnum)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {Object.entries(LEAD_SOURCE_DISPLAY).map(([key, display]) => (
                  <SelectItem key={key} value={key}>
                    {display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label>תקופה</Label>
            <Select
              value={filters.dateFilter || 'all'}
              onValueChange={(value) => updateFilter('dateFilter', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר תקופה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל התקופות</SelectItem>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="this-week">השבוע</SelectItem>
                <SelectItem value="this-month">החודש</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reminder Filters */}
        <div className="flex flex-wrap gap-6 pt-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="onlyReminders"
              checked={filters.onlyReminders || false}
              onCheckedChange={(checked) => updateFilter('onlyReminders', checked === true)}
            />
            <Label htmlFor="onlyReminders" className="flex items-center gap-2 cursor-pointer">
              <Bell className="h-4 w-4" />
              רק לידים עם תזכורות
            </Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="remindersToday"
              checked={filters.remindersToday || false}
              onCheckedChange={(checked) => updateFilter('remindersToday', checked === true)}
            />
            <Label htmlFor="remindersToday" className="flex items-center gap-2 cursor-pointer">
              <Calendar className="h-4 w-4" />
              תזכורות להיום
            </Label>
          </div>
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>מיון לפי</Label>
            <Select
              value={filters.sortBy || 'created_at'}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">תאריך יצירה</SelectItem>
                <SelectItem value="updated_at">תאריך עדכון</SelectItem>
                <SelectItem value="restaurant_name">שם מסעדה</SelectItem>
                <SelectItem value="lead_status">סטטוס</SelectItem>
                <SelectItem value="next_follow_up_date">תאריך מעקב</SelectItem>
                <SelectItem value="total_ai_costs">עלויות AI</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>כיוון מיון</Label>
            <Select
              value={filters.sortDirection || 'desc'}
              onValueChange={(value) => updateFilter('sortDirection', value as 'asc' | 'desc')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">יורד (החדש לישן)</SelectItem>
                <SelectItem value="asc">עולה (הישן לחדש)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 