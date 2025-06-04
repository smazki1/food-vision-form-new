import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { Palette, Eye, FileText, FileImage } from 'lucide-react';

export type ClientReviewFormData = NewItemFormData;

interface ClientReviewStepProps {
  formData: ClientReviewFormData;
  imagePreviews: string[];
}

const ClientReviewStep: React.FC<ClientReviewStepProps> = ({
  formData,
  imagePreviews
}) => {
  const getItemTypeLabel = (type: NewItemFormData['itemType']) => {
    switch (type) {
      case 'dish': return 'מנה';
      case 'cocktail': return 'קוקטייל';
      case 'drink': return 'משקה';
      default: return type || 'לא צוין';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-center">סקירה ואישור</h2>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">פרטי המסעדה וההגשה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>שם המסעדה:</strong> {formData.restaurantName || '-'}</p>
          <p><strong>שם המגיש/איש קשר:</strong> {formData.submitterName || '-'}</p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">פרטי הפריט</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>שם הפריט:</strong> {formData.itemName || '-'}</p>
          <p><strong>סוג:</strong> {getItemTypeLabel(formData.itemType)}</p>
          {formData.description && <p><strong>תיאור:</strong> {formData.description}</p>}
          {formData.specialNotes && <p><strong>הערות:</strong> {formData.specialNotes}</p>}
        </CardContent>
      </Card>

      {imagePreviews.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">תמונות ({formData.referenceImages?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="aspect-square relative group">
                  <img
                    src={preview}
                    alt={`תמונה ${index + 1}`}
                    className="w-full h-full object-cover rounded-md shadow-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
       {imagePreviews.length === 0 && formData.referenceImages?.length === 0 && (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">תמונות</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500">לא הועלו תמונות לפריט זה.</p>
            </CardContent>
        </Card>
      )}

      {/* Additional Details Section */}
      {((formData.brandingMaterials && formData.brandingMaterials.length > 0) || 
        (formData.referenceExamples && formData.referenceExamples.length > 0)) && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">פרטים נוספים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.brandingMaterials && formData.brandingMaterials.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Palette className="w-5 h-5 text-purple-500 ml-2" />
                  <strong>חומרי מיתוג ({formData.brandingMaterials.length} קבצים):</strong>
                </div>
                <div className="space-y-1">
                  {formData.brandingMaterials.map((file, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      {file.type.startsWith('image/') ? (
                        <FileImage className="w-4 h-4 text-blue-500 ml-2" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-500 ml-2" />
                      )}
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.referenceExamples && formData.referenceExamples.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Eye className="w-5 h-5 text-green-500 ml-2" />
                  <strong>דוגמאות להתייחסות ({formData.referenceExamples.length} קבצים):</strong>
                </div>
                <div className="space-y-1">
                  {formData.referenceExamples.map((file, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      {file.type.startsWith('image/') ? (
                        <FileImage className="w-4 h-4 text-blue-500 ml-2" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-500 ml-2" />
                      )}
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientReviewStep; 