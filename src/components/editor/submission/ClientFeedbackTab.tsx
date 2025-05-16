
import React from "react";
import { formatDate } from "@/utils/formatDate";
import { Textarea } from "@/components/ui/textarea";

interface ClientFeedbackTabProps {
  submission: any;
  maxEdits: number;
  responseToClient: string;
  setResponseToClient: (value: string) => void;
}

const ClientFeedbackTab: React.FC<ClientFeedbackTabProps> = ({
  submission,
  maxEdits,
  responseToClient,
  setResponseToClient
}) => {
  const editProgress = submission.edit_count || 0;
  const editProgressPercentage = Math.min(100, (editProgress / maxEdits) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">הערות והבקשות מהלקוח</h3>
        {submission.edit_history?.length ? (
          <div className="space-y-4">
            {submission.edit_history.map((edit: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">בקשת עריכה #{idx + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {edit.timestamp ? formatDate(edit.timestamp) : ""}
                  </span>
                </div>
                {edit.client_request && (
                  <p className="text-sm mb-2">{edit.client_request}</p>
                )}
                {edit.editor_response && (
                  <div className="mt-2 bg-slate-50 p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">תגובת העורך:</p>
                    <p className="text-sm">{edit.editor_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">אין הערות או בקשות מהלקוח</p>
        )}
        
        {/* Edit progress indicator */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm">עריכות: {editProgress} מתוך {maxEdits}</span>
            <span className="text-sm">{editProgressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${editProgressPercentage >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${editProgressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Response to client feedback */}
        {submission.submission_status === "הערות התקבלו" && (
          <div className="mt-4 space-y-2">
            <h4 className="text-md font-medium">תגובה לבקשת לקוח</h4>
            <Textarea
              placeholder="הוסף תגובה לבקשת העריכה של הלקוח..."
              value={responseToClient}
              onChange={(e) => setResponseToClient(e.target.value)}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              התגובה תישלח ללקוח כאשר תסמן את המשימה כ"מוכנה להצגה"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientFeedbackTab;
