import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Loader2,
  Palette,
  Camera,
  Download,
  X,
  Plus,
  FileImage
} from 'lucide-react';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ReferenceImage {
  id: string;
  url: string;
  title: string;
  notes: string;
  uploadedAt: string;
}

interface ClientDesignSettingsProps {
  clientId: string;
  client: Client;
}

export const ClientDesignSettings: React.FC<ClientDesignSettingsProps> = ({
  clientId,
  client
}) => {
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing reference images for client
  React.useEffect(() => {
    loadReferenceImages();
  }, [clientId]);

  const loadReferenceImages = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('internal_notes')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;

      // Parse stored reference images from internal_notes
      let storedImages: ReferenceImage[] = [];
      
      if (data?.internal_notes) {
        try {
          const parsed = JSON.parse(data.internal_notes);
          
          // Reference images (migrate old 'purpose' field to 'title' if needed)
          if (parsed.referenceImages && Array.isArray(parsed.referenceImages)) {
            storedImages = parsed.referenceImages.map((img: any) => ({
              ...img,
              title: img.title || img.purpose || '',
            }));
          }
        } catch (e) {
          // Not JSON or no reference images, start fresh
        }
      }

      setReferenceImages(storedImages);
    } catch (error) {
      console.error('Error loading reference images:', error);
      toast.error('שגיאה בטעינת תמונות הייחוס');
    } finally {
      setIsLoading(false);
    }
  };

  const saveReferenceImages = async (images: ReferenceImage[]) => {
    try {
      const existingNotes = client.internal_notes || '';
      let notesData: any = {};
      
      try {
        notesData = JSON.parse(existingNotes);
      } catch (e) {
        notesData = { originalNotes: existingNotes };
      }
      
      notesData.referenceImages = images;
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          internal_notes: JSON.stringify(notesData),
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) throw error;
      
      setReferenceImages(images);
    } catch (error) {
      console.error('Error saving reference images:', error);
      toast.error('שגיאה בשמירת תמונות הייחוס');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות קטן מ-25MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/reference/${Date.now()}.${fileExt}`;
      const filePath = `client-reference-images/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);

      // Create new reference image entry
      const newImage: ReferenceImage = {
        id: Date.now().toString(),
        url: publicUrl,
        title: '',
        notes: '',
        uploadedAt: new Date().toISOString()
      };

      // Add to existing images and save
      const updatedImages = [...referenceImages, newImage];
      await saveReferenceImages(updatedImages);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('תמונת הייחוס הועלתה בהצלחה');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      const updatedImages = referenceImages.filter(img => img.id !== imageId);
      await saveReferenceImages(updatedImages);
      toast.success('תמונת הייחוס הוסרה בהצלחה');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('שגיאה בהסרת התמונה');
    }
  };

  const handleUpdateImageField = async (imageId: string, field: 'title' | 'notes', value: string) => {
    try {
      const updatedImages = referenceImages.map(img => 
        img.id === imageId 
          ? { ...img, [field]: value.trim() }
          : img
      );
      
      await saveReferenceImages(updatedImages);
    } catch (error) {
      console.error('Error updating image field:', error);
      toast.error('שגיאה בעדכון פרטי התמונה');
    }
  };

  const handleDownloadImage = (imageUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `reference-${title || 'image'}-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            תמונות ייחוס ועיצוב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            תמונות ייחוס ועיצוב
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מעלה תמונה...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  הוסף תמונת ייחוס
                </>
              )}
            </Button>
            
            {referenceImages.length > 0 && (
              <Badge variant="outline">
                {referenceImages.length} תמונות ייחוס
              </Badge>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file);
              }
            }}
            accept="image/*"
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Reference Images Gallery */}
      {referenceImages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <FileImage className="h-20 w-20 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-600 mb-3">אין תמונות ייחוס עדיין</h3>
            <p className="text-gray-500 mb-6">התחל על ידי העלאת תמונת ייחוס ראשונה</p>
            <Button
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              העלה תמונת ייחוס ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {referenceImages.map((image, index) => (
            <Card key={image.id} className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-indigo-600" />
                    {image.title || `תמונת ייחוס #${index + 1}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {new Date(image.uploadedAt).toLocaleDateString('he-IL')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image Display */}
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                        <img 
                          src={image.url} 
                          alt={image.title || `תמונת ייחוס ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedImage(image.url)}
                        />
                      </div>
                      
                      {/* Action buttons overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadImage(image.url, image.title)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveImage(image.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Metadata - Always Editable */}
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium text-gray-700">כותרת</Label>
                      <Input
                        value={image.title}
                        onChange={(e) => {
                          // Update local state immediately for responsive UI
                          const updatedImages = referenceImages.map(img => 
                            img.id === image.id ? { ...img, title: e.target.value } : img
                          );
                          setReferenceImages(updatedImages);
                        }}
                        onBlur={(e) => handleUpdateImageField(image.id, 'title', e.target.value)}
                        placeholder="למשל: רקע לתפריט, סגנון צילום, עיצוב שולחן..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="font-medium text-gray-700">הערות ופרטים</Label>
                      <Textarea
                        value={image.notes}
                        onChange={(e) => {
                          // Update local state immediately for responsive UI
                          const updatedImages = referenceImages.map(img => 
                            img.id === image.id ? { ...img, notes: e.target.value } : img
                          );
                          setReferenceImages(updatedImages);
                        }}
                        onBlur={(e) => handleUpdateImageField(image.id, 'notes', e.target.value)}
                        placeholder="הערות נוספות על הסגנון, צבעים, אווירה, או כל פרט רלוונטי..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Lightbox Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] p-1">
            <DialogHeader className="sr-only">
              <DialogTitle>תצוגת תמונה מוגדלת</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="תמונת ייחוס מוגדלת"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 