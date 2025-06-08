import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Submission } from "@/api/submissionApi";
import { 
  ImagesTabContent, 
  ClientFeedbackTabContent, 
  InternalNotesTabContent,
  ProcessingInfoTab,
  OriginalImagesTabContent
} from "../tabs";

interface ContentTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  submission: Submission;
  responseToClient: string;
  setResponseToClient: (value: string) => void;
  handleSelectMainImage?: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage?: (imageUrl: string) => Promise<boolean>;
  addProcessedImage?: (url: string) => Promise<boolean>;
  addInternalNote?: (note: string) => Promise<boolean>;
  setLightboxImage?: (imageUrl: string | null, images?: string[]) => void;
  maxEdits: number;
}

const ContentTabs: React.FC<ContentTabsProps> = ({
  activeTab,
  setActiveTab,
  submission,
  responseToClient,
  setResponseToClient,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  addInternalNote,
  setLightboxImage,
  maxEdits,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
      <TabsList className="mb-4 grid w-full grid-cols-3 sm:grid-cols-5 gap-1 p-1">
        <TabsTrigger value="images" className="whitespace-nowrap">תמונות מעובדות</TabsTrigger>
        <TabsTrigger value="originals" className="whitespace-nowrap">תמונות מקוריות</TabsTrigger>
        <TabsTrigger value="feedback" className="whitespace-nowrap">משוב לקוח</TabsTrigger>
        <TabsTrigger value="notes" className="whitespace-nowrap">הערות פנימיות</TabsTrigger>
        <TabsTrigger value="info" className="whitespace-nowrap">מידע למעבד</TabsTrigger>
      </TabsList>
      
      <TabsContent value="images">
        <ImagesTabContent 
          submission={submission} 
          handleSelectMainImage={handleSelectMainImage || (() => Promise.resolve(false))}
          handleRemoveProcessedImage={handleRemoveProcessedImage || (() => Promise.resolve(false))}
          addProcessedImage={addProcessedImage || (() => Promise.resolve(false))}
          setLightboxImage={setLightboxImage || (() => {})}
        />
      </TabsContent>
      
      <TabsContent value="originals">
        <OriginalImagesTabContent 
          submission={submission} 
          setLightboxImage={setLightboxImage || (() => {})}
        />
      </TabsContent>
      
      <TabsContent value="feedback">
        <ClientFeedbackTabContent 
          submission={submission}
          maxEdits={maxEdits}
          responseToClient={responseToClient}
          setResponseToClient={setResponseToClient}
        />
      </TabsContent>
      
      <TabsContent value="notes">
        <InternalNotesTabContent
          internalTeamNotes={submission.internal_team_notes}
          onAddNote={addInternalNote || (() => Promise.resolve(false))}
        />
      </TabsContent>
      
      <TabsContent value="info">
        <ProcessingInfoTab submission={submission} />
      </TabsContent>
    </Tabs>
  );
};

export default ContentTabs;
