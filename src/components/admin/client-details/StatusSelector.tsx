import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { SUBMISSION_STATUSES, SubmissionStatus } from '@/hooks/useSubmissionStatus';

interface StatusSelectorProps {
  currentStatus: SubmissionStatus;
  onStatusChange: (newStatus: SubmissionStatus) => void;
  isUpdating?: boolean;
  disabled?: boolean;
}

const getStatusColor = (status: SubmissionStatus) => {
  switch (status) {
    case 'ממתינה לעיבוד':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'בעיבוד':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'מוכנה להצגה':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'הערות התקבלו':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'הושלמה ואושרה':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  isUpdating = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusSelect = (status: SubmissionStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled && !isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={disabled || isUpdating}
        className={`
          flex items-center gap-2 min-w-[160px] justify-between
          ${getStatusColor(currentStatus)}
          hover:opacity-80 transition-opacity
          ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2">
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${
              currentStatus === 'הושלמה ואושרה' ? 'bg-green-500' :
              currentStatus === 'בעיבוד' ? 'bg-blue-500' :
              currentStatus === 'מוכנה להצגה' ? 'bg-yellow-500' :
              currentStatus === 'הערות התקבלו' ? 'bg-orange-500' :
              'bg-gray-500'
            }`} />
          )}
          <span className="text-sm font-medium">{currentStatus}</span>
        </div>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
            {SUBMISSION_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`
                  w-full px-3 py-2 text-right text-sm hover:bg-gray-50 
                  flex items-center justify-between transition-colors
                  ${status === currentStatus ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'הושלמה ואושרה' ? 'bg-green-500' :
                    status === 'בעיבוד' ? 'bg-blue-500' :
                    status === 'מוכנה להצגה' ? 'bg-yellow-500' :
                    status === 'הערות התקבלו' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`} />
                  <span className={`${status === currentStatus ? 'font-medium' : ''}`}>
                    {status}
                  </span>
                </div>
                {status === currentStatus && (
                  <Check className="h-3 w-3 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
      
      {isUpdating && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          שומר...
        </div>
      )}
    </div>
  );
}; 