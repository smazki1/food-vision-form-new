import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the heavy SubmissionViewer component
const SubmissionViewer = lazy(() => 
  import('@/components/admin/submissions/SubmissionViewer').then(module => ({
    default: module.SubmissionViewer
  }))
);

// Loading component for the SubmissionViewer
const SubmissionViewerSkeleton = () => (
  <div className="space-y-4 p-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-24" />
    </div>
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Props interface
interface LazySubmissionViewerProps {
  submissionId: string;
  viewMode: 'admin' | 'client' | 'editor';
  context: 'lead-panel' | 'full-page' | 'table-row' | 'client-dashboard';
  onClose?: () => void;
}

export const LazySubmissionViewer: React.FC<LazySubmissionViewerProps> = (props) => {
  return (
    <Suspense fallback={<SubmissionViewerSkeleton />}>
      <SubmissionViewer {...props} />
    </Suspense>
  );
};

export default LazySubmissionViewer; 