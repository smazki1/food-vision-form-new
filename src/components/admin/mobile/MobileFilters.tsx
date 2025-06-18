import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  status: string;
  itemType: string;
  dateRange: string;
  hasProcessedImages: string;
  hasBrandingMaterials: string;
  hasReferenceExamples: string;
}

interface MobileFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeFilterCount: number;
}

export const MobileFilters: React.FC<MobileFiltersProps> = ({
  filters,
  onFiltersChange,
  activeFilterCount
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: 'all',
      itemType: 'all',
      dateRange: 'all',
      hasProcessedImages: 'all',
      hasBrandingMaterials: 'all',
      hasReferenceExamples: 'all'
    });
  };

  const getFilterLabel = (key: keyof FilterState) => {
    switch (key) {
      case 'status': return 'סטטוס';
      case 'itemType': return 'סוג פריט';
      case 'dateRange': return 'תאריך';
              case 'hasProcessedImages': return 'תמונות מוכנות';
      case 'hasBrandingMaterials': return 'חומרי מיתוג';
      case 'hasReferenceExamples': return 'דוגמאות';
      default: return key;
    }
  };

  const getFilterOptions = (key: keyof FilterState) => {
    switch (key) {
      case 'status':
        return [
          { value: 'all', label: 'הכל' },
          { value: 'pending', label: 'ממתין' },
          { value: 'in_progress', label: 'בעבודה' },
          { value: 'completed', label: 'הושלם' },
          { value: 'rejected', label: 'נדחה' }
        ];
      case 'itemType':
        return [
          { value: 'all', label: 'הכל' },
          { value: 'מנה', label: 'מנה' },
          { value: 'שתיה', label: 'שתיה' },
          { value: 'קוקטייל', label: 'קוקטייל' }
        ];
      case 'dateRange':
        return [
          { value: 'all', label: 'הכל' },
          { value: 'today', label: 'היום' },
          { value: 'week', label: 'השבוע' },
          { value: 'month', label: 'החודש' },
          { value: 'quarter', label: 'הרבעון' }
        ];
      case 'hasProcessedImages':
      case 'hasBrandingMaterials':
      case 'hasReferenceExamples':
        return [
          { value: 'all', label: 'הכל' },
          { value: 'yes', label: 'יש' },
          { value: 'no', label: 'אין' }
        ];
      default:
        return [];
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          מסננים
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="text-right">
          <SheetTitle className="flex items-center justify-between">
            <span>מסננים</span>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  נקה הכל
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Active filters display */}
          {activeFilterCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">מסננים פעילים:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value === 'all') return null;
                  const options = getFilterOptions(key as keyof FilterState);
                  const option = options.find(opt => opt.value === value);
                  return (
                    <Badge 
                      key={key} 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1"
                    >
                      {getFilterLabel(key as keyof FilterState)}: {option?.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => handleFilterChange(key as keyof FilterState, 'all')}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter controls */}
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(filters).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium">
                  {getFilterLabel(key as keyof FilterState)}
                </label>
                <Select
                  value={value}
                  onValueChange={(newValue) => handleFilterChange(key as keyof FilterState, newValue)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterOptions(key as keyof FilterState).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <div className="pt-4 border-t">
            <Button 
              className="w-full" 
              onClick={() => setIsOpen(false)}
            >
              החל מסננים
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilters; 