import React, { useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Corrected Supabase import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react'; // For spinner

type ItemType = 'dish' | 'cocktail' | 'drink';

interface SubmissionResult {
  success: boolean;
  submission_id: string;
  item_id: string;
  client_found: boolean;
  client_id: string | null;
  message: string;
}

const PublicUploadForm: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [itemType, setItemType] = useState<ItemType>('dish');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [price, setPrice] = useState<number | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleIngredientsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIngredients(e.target.value.split(',').map(ing => ing.trim()));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStatus(null);

    if (!restaurantName || !itemName) {
        setSubmissionStatus({ type: 'error', message: 'שם מסעדה ושם פריט הם שדות חובה.' });
        setIsLoading(false);
        return;
    }

    let imageUrls: string[] = [];
    if (files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-vision-images') // Corrected bucket name
          .upload(`public-submissions/${fileName}`, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setSubmissionStatus({ type: 'error', message: `שגיאה בהעלאת תמונה: ${uploadError.message}` });
          setIsLoading(false);
          return;
        }
        if (uploadData) {
          // Get public URL
          const { data: urlData } = supabase.storage.from('food-vision-images').getPublicUrl(uploadData.path);
          imageUrls.push(urlData.publicUrl);
        }
      }
    }

    const params = {
      p_restaurant_name: restaurantName,
      p_item_type: itemType,
      p_item_name: itemName,
      p_description: description || null,
      p_category: itemType === 'cocktail' ? null : category || null,
      p_ingredients: itemType === 'cocktail' ? ingredients : null,
      p_price: price === '' ? null : Number(price),
      p_reference_image_urls: imageUrls.length > 0 ? imageUrls : null,
    };

    const { data, error } = await supabase.rpc('public_submit_item_by_restaurant_name', params);

    setIsLoading(false);

    if (error) {
      console.error('Error submitting item:', error);
      setSubmissionStatus({ type: 'error', message: `שגיאה בשליחת הפריט: ${error.message}` });
    } else if (data) {
        const result = data as unknown as SubmissionResult; // Cast to SubmissionResult
        if (result.success) {
            setSubmissionStatus({ type: 'success', message: result.message || 'הפריט נשלח בהצלחה!' });
            // Optionally reset form
            setRestaurantName('');
            setItemType('dish');
            setItemName('');
            setDescription('');
            setCategory('');
            setIngredients([]);
            setPrice('');
            setFiles([]);
        } else {
            setSubmissionStatus({ type: 'error', message: result.message || 'שגיאה בשליחת הפריט.' });
        }
    }
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">העלאת פריט חדש לתפריט</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">שם המסעדה (חובה)</Label>
          <Input
            id="restaurantName"
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <Label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">סוג הפריט</Label>
          <Select value={itemType} onValueChange={(value) => setItemType(value as ItemType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="בחר סוג פריט" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dish">מנה</SelectItem>
              <SelectItem value="cocktail">קוקטייל</SelectItem>
              <SelectItem value="drink">משקה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">שם הפריט (חובה)</Label>
          <Input
            id="itemName"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">תיאור</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {itemType !== 'cocktail' && (
          <div>
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</Label>
            <Input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {itemType === 'cocktail' && (
          <div>
            <Label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">מרכיבים (מופרדים בפסיק)</Label>
            <Input
              id="ingredients"
              type="text"
              value={ingredients.join(', ')}
              onChange={handleIngredientsChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}

        <div>
          <Label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">מחיר</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
            step="0.01"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <Label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">העלאת תמונות</Label>
          <Input
            id="files"
            type="file"
            multiple
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {files.length} קבצים נבחרו: {files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        {submissionStatus && (
          <div className={`p-4 rounded-md ${submissionStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {submissionStatus.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'שלח פריט'}
        </Button>
      </form>
    </div>
  );
};

export default PublicUploadForm; 