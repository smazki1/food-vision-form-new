
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicUploadForm } from '@/hooks/usePublicUploadForm';
import { usePublicImageUpload } from '@/hooks/usePublicImageUpload';
import { usePublicFormSubmit } from '@/hooks/usePublicFormSubmit';
import BasicFormFields from './upload-form/BasicFormFields';
import ImageUploadSection from './upload-form/ImageUploadSection';

const PublicUploadForm: React.FC = () => {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    handleInputChange,
    validateForm,
    resetForm
  } = usePublicUploadForm();

  const { handleImageUpload, removeImage } = usePublicImageUpload();
  const { isSubmitting, handleSubmit } = usePublicFormSubmit();

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleImageUpload(files, setFormData, setErrors);
  };

  const onRemoveImage = (index: number) => {
    removeImage(index, setFormData);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(formData, validateForm, resetForm);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">העלאת פריט חדש למסעדה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <BasicFormFields
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
              />

              <ImageUploadSection
                images={formData.images}
                onImageUpload={onImageUpload}
                onRemoveImage={onRemoveImage}
                error={errors.images}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-lg"
              >
                {isSubmitting ? 'שולח...' : 'שלח פריט למסעדה'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicUploadForm;
