import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogContent } from '@/components/ui/dialog';

// Lazy load the heavy LeadSubmissionModal component
const LeadSubmissionModal = lazy(() => 
  import('@/components/admin/leads/LeadSubmissionModal').then(module => ({
    default: module.LeadSubmissionModal
  }))
);

// Loading component for the LeadSubmissionModal
const LeadSubmissionModalSkeleton = () => (
  <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
    <div className="space-y-4 p-6 h-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4 h-5/6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
);

// Import the Lead type
import { Lead } from '@/types/lead';

// Props interface
interface LazyLeadSubmissionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const LazyLeadSubmissionModal: React.FC<LazyLeadSubmissionModalProps> = (props) => {
  if (!props.isOpen) return null;
  
  return (
    <Suspense fallback={<LeadSubmissionModalSkeleton />}>
      <LeadSubmissionModal {...props} />
    </Suspense>
  );
};

export default LazyLeadSubmissionModal; 