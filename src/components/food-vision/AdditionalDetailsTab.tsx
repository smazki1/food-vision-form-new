import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdditionalDetails } from "@/types/food-vision";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { VisualStyleGrid } from "./VisualStyleGrid";
interface AdditionalDetailsTabProps {
  additionalDetails: AdditionalDetails;
  setAdditionalDetails: React.Dispatch<React.SetStateAction<AdditionalDetails>>;
}
const AdditionalDetailsTab: React.FC<AdditionalDetailsTabProps> = ({
  additionalDetails,
  setAdditionalDetails
}) => {
  const handleChange = (field: keyof AdditionalDetails, value: string) => {
    setAdditionalDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleFileChange = (file: File | undefined) => {
    setAdditionalDetails(prev => ({
      ...prev,
      brandingMaterials: file
    }));
  };
  // Improve guideline text for file upload
  return <div className="space-y-6 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground px-0">כל דבר נוסף שהיית רוצה להוסיף (הערות / חומרי מיתוג / לוגו וכו׳)</p>
      </div>

      <div className="space-y-4">

        <div className="space-y-2">
          <Label htmlFor="brandingMaterials">חומרי מיתוג</Label>
          <div className="flex items-center gap-2">
            <Input id="brandingMaterials" type="file" accept="image/*,.pdf" onChange={e => {
            const file = e.target.files?.[0];
            if (file && file.size > 10 * 1024 * 1024) {
              alert("גודל הקובץ גדול מ-10MB");
              e.target.value = "";
              return;
            }
            setAdditionalDetails(prev => ({
              ...prev,
              brandingMaterials: file
            }));
          }} className="hidden" />
            <Button type="button" variant="outline" onClick={() => {
            document.getElementById("brandingMaterials")?.click();
          }} className="px-[122px] sm:px-[222px]">
              <ImageIcon className="h-4 w-4 ml-2" />
              {additionalDetails.brandingMaterials ? "החלף קובץ" : "העלה קבצי מיתוג"}
            </Button>
            {additionalDetails.brandingMaterials && <span className="text-xs sm:text-sm text-muted-foreground">
                {additionalDetails.brandingMaterials.name}
              </span>}
          </div>
          {/* Improved guideline */}
          <div className="text-xs text-muted-foreground px-1">
            <p>קבצים נתמכים: תמונה (jpg, jpeg, png, webp) או PDF. עד 10MB.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="generalNotes">הערות כלליות</Label>
          <Textarea id="generalNotes" value={additionalDetails.generalNotes} onChange={e => setAdditionalDetails(prev => ({...prev, generalNotes: e.target.value}))} placeholder="הוסף הערות כלליות או בקשות מיוחדות" className="min-h-[120px]" />
        </div>
      </div>
    </div>;
export default AdditionalDetailsTab;
