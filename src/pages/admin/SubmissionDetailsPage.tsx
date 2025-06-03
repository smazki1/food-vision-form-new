import React from 'react';
import { useParams } from 'react-router-dom';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();

  if (!submissionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">מזהה הגשה לא נמצא</p>
        </div>
      </div>
    );
  }

  return (
    <SubmissionViewer 
      submissionId={submissionId}
      viewMode="admin"
      context="full-page"
    />
  );
};

export default SubmissionDetailsPage;
