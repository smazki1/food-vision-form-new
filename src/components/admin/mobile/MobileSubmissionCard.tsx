import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Calendar, 
  FileImage, 
  Building2, 
  User,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Submission } from '@/api/submissionApi';
import { cn } from '@/lib/utils';

interface MobileSubmissionCardProps {
  submission: Submission;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  onStatusUpdate?: (status: string) => void;
}

export const MobileSubmissionCard: React.FC<MobileSubmissionCardProps> = ({
  submission,
  isSelected,
  onSelect,
  onView,
  onStatusUpdate
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'in_progress': return 'בעבודה';
      case 'completed': return 'הושלם';
      case 'rejected': return 'נדחה';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isSelected && "ring-2 ring-blue-500 bg-blue-50"
    )}>
      <CardContent className="p-4">
        {/* Header with checkbox and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">
                {submission.item_name_at_submission}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {submission.restaurant_name || 'ללא שם מסעדה'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                צפייה
              </DropdownMenuItem>
              {onStatusUpdate && (
                <>
                  <DropdownMenuItem onClick={() => onStatusUpdate('in_progress')}>
                    בעבודה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusUpdate('completed')}>
                    הושלם
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusUpdate('rejected')}>
                    נדחה
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status and type */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusColor(submission.submission_status))}
          >
            {getStatusText(submission.submission_status)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {submission.item_type}
          </Badge>
        </div>

        {/* Contact info */}
        {submission.contact_name && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">
              {submission.contact_name}
            </span>
          </div>
        )}

        {/* Date and images info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(submission.uploaded_at)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <FileImage className="h-3 w-3" />
            <span>
              {submission.original_image_urls?.length || 0} תמונות
            </span>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center gap-2 mt-3">
          <div className={cn(
            "h-2 w-2 rounded-full",
            submission.original_image_urls?.length ? "bg-green-500" : "bg-gray-300"
          )} />
          <span className="text-xs text-muted-foreground">מקור</span>
          
          <div className={cn(
            "h-2 w-2 rounded-full",
            submission.processed_image_urls?.length ? "bg-green-500" : "bg-gray-300"
          )} />
          <span className="text-xs text-muted-foreground">עובד</span>
          
          <div className={cn(
            "h-2 w-2 rounded-full",
            submission.branding_material_urls?.length ? "bg-green-500" : "bg-gray-300"
          )} />
          <span className="text-xs text-muted-foreground">מיתוג</span>
        </div>

        {/* Quick action button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 h-8 text-xs"
          onClick={onView}
        >
          <Eye className="h-3 w-3 mr-1" />
          צפייה מהירה
        </Button>
      </CardContent>
    </Card>
  );
};

export default MobileSubmissionCard; 