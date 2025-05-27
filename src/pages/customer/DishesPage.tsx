import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface ItemDetailsFromDB {
  description: string | null;
  reference_image_urls: string[] | null;
}

export function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const { clientId } = useUnifiedAuth();

  useEffect(() => {
    async function fetchDishes() {
      if (!clientId) {
        console.log("[DishesPage] No clientId from useUnifiedAuth yet, skipping fetch.");
        setDishes([]);
        return;
      }
      console.log(`[DishesPage] Fetching dishes for clientId: ${clientId}`);

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('customer_submissions')
        .select('submission_id, item_name_at_submission, item_type, original_item_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        toast.error('שגיאה בטעינת המנות. נסו שוב מאוחר יותר.');
        return;
      }

      if (submissionsData) {
        const enrichedDishesPromises = submissionsData.map(async (sub) => {
          let description = '';
          let mainImageUrl = '';

          let itemTable = '';
          let itemIdColumn = '';

          switch (sub.item_type) {
            case 'dish': itemTable = 'dishes'; itemIdColumn = 'dish_id'; break;
            case 'cocktail': itemTable = 'cocktails'; itemIdColumn = 'cocktail_id'; break;
            case 'drink': itemTable = 'drinks'; itemIdColumn = 'drink_id'; break;
            default: console.warn(`Unknown item_type: ${sub.item_type} for submission id: ${sub.submission_id}`);
          }

          if (itemTable && sub.original_item_id) {
            const { data: itemDetails, error: itemError } = await supabase
              .from(itemTable)
              .select('description, reference_image_urls')
              .eq(itemIdColumn, sub.original_item_id)
              .single<ItemDetailsFromDB>();

            if (itemError) {
              console.error(`Error fetching details for ${sub.item_type} ${sub.original_item_id}:`, itemError.message);
            } else if (itemDetails) {
              description = itemDetails.description || '';
              if (itemDetails.reference_image_urls && itemDetails.reference_image_urls.length > 0) {
                mainImageUrl = itemDetails.reference_image_urls[0];
              }
            }
          }
          
          description = description || sub.item_type;

          return {
            id: sub.submission_id,
            name: sub.item_name_at_submission,
            description: description,
            image_url: mainImageUrl || '',
          };
        });

        const resolvedDishes = await Promise.all(enrichedDishesPromises);
        setDishes(resolvedDishes.filter(dish => dish !== null) as Dish[]);
      }
    }

    fetchDishes();
  }, [clientId]);

  const filteredDishes = dishes.filter(dish =>
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-rose-50 pb-20">
      <div className="sticky top-0 bg-rose-50 shadow-sm z-10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">מנות</h1>
        <Link to="/customer/new-submission" className="text-primary p-2">
          <Plus size={24} />
        </Link>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="חיפוש מנות..."
            className="w-full pr-10 pl-4 py-2 bg-rose-100 rounded-lg border-transparent focus:border-rose-300 focus:ring-rose-300 text-gray-700 placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">מנות</h2>
        {filteredDishes.length > 0 ? (
          <div className="space-y-3">
            {filteredDishes.map((dish) => (
              <Card
                key={dish.id}
                className="flex items-center p-3 bg-white shadow-sm hover:bg-gray-50 transition-colors"
              >
                <img
                  src={dish.image_url || '/placeholder-dish.svg'}
                  alt={dish.name}
                  className="w-16 h-16 object-cover rounded-md ml-4"
                  onError={(e) => (e.currentTarget.src = '/placeholder-dish.svg')}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{dish.name}</h3>
                  <p className="text-sm text-gray-500">{dish.description}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>לא נמצאו מנות התואמות את החיפוש שלכם/ן.</p>
            {dishes.length === 0 && clientId && <p>עדיין לא הוספתם/ן מנות.</p>}
          </div>
        )}
      </div>
    </div>
  );
} 